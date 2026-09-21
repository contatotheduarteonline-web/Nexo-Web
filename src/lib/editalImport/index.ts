/**
 * editalImport/index.ts
 * Ponto de entrada unificado para processamento client-side de editais no NEXO.
 * 
 * Fluxo Obrigatório:
 * PDF COMPLETO -> localizar seção CONTEÚDO PROGRAMÁTICO -> determinar início e fim da seção
 * -> recortar intervalo -> detectar cargo/bloco -> detectar disciplinas -> detectar tópicos
 * -> validação fail-closed.
 */

import {
  DetectedCargo,
  ExtractedDiscipline,
  ImportProgressState,
  ImportProgressUpdate,
  PageText,
  ParsedEditalData,
  ProgrammaticSection,
  ProgrammaticValidationResult,
} from "./types";
import { readPdfFile } from "./pdfReader";
import { detectProgrammaticSection, detectSections } from "./sectionDetector";
import { detectCargosInEdital } from "./cargoDetector";
import { parseDisciplinesAndTopics } from "./disciplineParser";
import { validateProgrammaticContent } from "./validator";
import { classifyEditalCareer } from "./careerClassifier";
import {
  cleanWhitespace,
  detectBoardFromText,
  detectEditalNumber,
  detectUfFromText,
  detectYearFromText,
  generateNormalizedIdentity,
} from "./textNormalizer";

export * from "./types";
export * from "./pdfReader";
export * from "./textNormalizer";
export * from "./sectionDetector";
export * from "./careerClassifier";
export * from "./cargoDetector";
export * from "./disciplineParser";
export * from "./validator";
export * from "./deduplication";

export interface ParseEditalOptions {
  careerHint?: string;
  onProgress?: (update: ImportProgressUpdate) => void;
}

/**
 * Pipeline completo de leitura, isolamento de seção, parsing e validação fail-closed
 */
export async function parseEditalPdf(
  file: File,
  options?: ParseEditalOptions
): Promise<ParsedEditalData> {
  const notify = (state: ImportProgressState, label: string, current?: number, total?: number) => {
    if (options?.onProgress) {
      options.onProgress({ state, label, current, total });
    }
  };

  // 1. Leitura do documento PDF
  notify("reading", "Lendo documento", 0, 100);

  const { pages, sha256, totalPages } = await readPdfFile(file, {
    onProgress: (cur, tot) => {
      notify("reading", "Lendo documento", cur, tot);
    },
  });

  // 2. Localização e delimitação estrita da seção de CONTEÚDO PROGRAMÁTICO (Início e Fim)
  notify("detecting_structure", "Localizando conteúdo programático");

  const programmaticSection = detectProgrammaticSection(pages);

  // Amostra textual dos primeiros blocos para metadados (capa / abertura)
  const introText = pages.slice(0, 5).map((p) => p.text).join("\n");
  const fullSample = pages.map((p) => p.text).join("\n").slice(0, 75000);

  const detectedYear = detectYearFromText(introText) || new Date().getFullYear();
  const detectedEditalNum = detectEditalNumber(introText);
  const detectedUf = detectUfFromText(introText);
  const detectedBoard = detectBoardFromText(introText);

  let detectedInstitution = "";
  let detectedAcronym = "";

  const introLines = introText.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(introLines.length, 12); i++) {
    const l = introLines[i];
    if (
      /(pol[ií]cia|tribunal|secretaria|prefeitura|banco|receita|assembleia|c[aâ]mara|instituto|universidade|corpo de bombeiros)/i.test(l) &&
      l.length < 90 &&
      !l.toLowerCase().startsWith("edital")
    ) {
      detectedInstitution = cleanWhitespace(l);
      break;
    }
  }

  if (detectedInstitution) {
    const acrMatch = detectedInstitution.match(/[-–(]\s*([A-Z]{2,10})\s*[)]?/);
    if (acrMatch) {
      detectedAcronym = acrMatch[1];
    }
  }

  // 3. Segmentação por cargos e parsing de disciplinas a partir exclusivamente da seção recortada
  notify("organizing_content", "Extraindo disciplinas e tópicos");

  const rawCargoBlocks = detectCargosInEdital(programmaticSection, pages);
  const detectedCargos: DetectedCargo[] = [];

  for (let i = 0; i < rawCargoBlocks.length; i++) {
    const cb = rawCargoBlocks[i];
    // disciplineParser recebe exclusivamente o snippet do bloco da seção recortada
    const disciplines = parseDisciplinesAndTopics(cb.contentSnippet, pages);

    detectedCargos.push({
      id: `cargo-${i + 1}-${Math.random().toString(36).substr(2, 6)}`,
      name: cb.name,
      normalizedName: cleanWhitespace(cb.name),
      pageNumber: cb.pageNumber,
      disciplines,
    });
  }

  // 4. Validação Fail-Closed do conteúdo programático
  const allDisciplines = detectedCargos.flatMap((c) => c.disciplines);
  const validationResult = validateProgrammaticContent(
    allDisciplines,
    programmaticSection || undefined,
    totalPages
  );

  // 5. Classificação de carreira
  const allDisciplineNames = allDisciplines.map((d) => d.name);
  const allCargoNames = detectedCargos.map((c) => c.name);

  const careerResult = classifyEditalCareer({
    institution: detectedInstitution,
    acronym: detectedAcronym,
    title: file.name,
    cargos: allCargoNames,
    sampleText: fullSample,
    disciplines: allDisciplineNames,
  });

  const normalizedIdentity = generateNormalizedIdentity({
    institution: detectedInstitution,
    acronym: detectedAcronym,
    uf: detectedUf,
    board: detectedBoard,
    year: detectedYear,
    title: detectedInstitution || file.name,
  });

  notify("ready", "Pronto para revisão");

  return {
    title: detectedInstitution ? `Concurso ${detectedInstitution} ${detectedYear}` : file.name.replace(/\.pdf$/i, ""),
    institution: detectedInstitution,
    acronym: detectedAcronym,
    uf: detectedUf,
    board: detectedBoard,
    year: detectedYear,
    editalNumber: detectedEditalNum,
    sourceFileName: file.name,
    sourceFileSize: file.size,
    sourceHash: sha256,
    normalizedIdentity,
    career: careerResult,
    cargos: detectedCargos,
    pagesCount: totalPages,
    rawSectionsCount: programmaticSection ? 1 : 0,
    programmaticSection: programmaticSection || undefined,
    validation: validationResult,
    allPages: pages,
  };
}

/**
 * Processamento manual por seleção explícita de intervalo de páginas (Fallback seguro).
 * Reaproveita o mesmo disciplineParser e validator estritamente sobre as páginas escolhidas.
 */
export function parseManualPagesSelection(
  pages: PageText[],
  startPage: number,
  endPage: number,
  cargoName: string = "Geral"
): {
  cargo: DetectedCargo;
  section: ProgrammaticSection;
  validation: ProgrammaticValidationResult;
} {
  const safeStart = Math.max(1, Math.min(startPage, endPage));
  const safeEnd = Math.min(pages.length, Math.max(startPage, endPage));

  const slicedPages = pages.filter((p) => p.pageNumber >= safeStart && p.pageNumber <= safeEnd);
  const combinedText = slicedPages.map((p) => p.text).join("\n");

  const section: ProgrammaticSection = {
    startPage: safeStart,
    endPage: safeEnd,
    heading: `Seleção Manual (Páginas ${safeStart} a ${safeEnd})`,
    confidence: "high",
    score: 100,
    extractedText: combinedText,
    isManualSelection: true,
  };

  const disciplines = parseDisciplinesAndTopics(combinedText, slicedPages);
  const validation = validateProgrammaticContent(disciplines, section, pages.length);

  const cargo: DetectedCargo = {
    id: `cargo-manual-${Date.now()}`,
    name: cargoName,
    normalizedName: cleanWhitespace(cargoName).toLowerCase(),
    pageNumber: safeStart,
    disciplines,
  };

  return { cargo, section, validation };
}
