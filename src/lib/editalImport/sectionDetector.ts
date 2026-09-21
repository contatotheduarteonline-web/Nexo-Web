/**
 * sectionDetector.ts
 * Localiza a seção de CONTEÚDO PROGRAMÁTICO e determina de forma estrita seu INÍCIO e FIM.
 * 
 * Regra fundamental:
 * - Não analisar o documento inteiro.
 * - Localizar o candidato com maior evidência de conteúdo acadêmico.
 * - Descartar sumários e índices.
 * - Determinar o ponto exato de encerramento (ao encontrar próximo bloco estrutural).
 * - Recortar apenas o intervalo de páginas/texto delimitado.
 */

import { DetectedSection, PageText, ProgrammaticSection } from "./types";
import { cleanWhitespace, removeAccents } from "./textNormalizer";

// Padrões de início de conteúdo programático
const PROGRAMMATIC_START_PATTERNS = [
  /conte[uú]do\s+program[aá]tico/i,
  /conte[uú]dos\s+program[aá]ticos/i,
  /conte[uú]do\s+das\s+provas/i,
  /programa\s+de\s+conhecimentos/i,
  /programa\s+de\s+provas?/i,
  /programa\s+das\s+provas?/i,
  /programa\s+da\s+prova\s+objetiva/i,
  /objetos\s+de\s+avalia[cç][aã]o/i,
  /dos\s+objetos\s+de\s+avalia[cç][aã]o/i,
  /anexo\s+[ivxldcm\d]+\s*[-–—:]*\s*conte[uú]do/i,
  /anexo\s+[ivxldcm\d]+\s*[-–—:]*\s*programa/i,
  /anexo\s+[ivxldcm\d]+\s*[-–—:]*\s*dos\s+conte[uú]dos/i,
];

// Padrões de encerramento da seção (blocos de nível equivalente que marcam o término do programa)
const TERMINATION_PATTERNS = [
  /^(?:do|da|dos|das)\s+curso\s+de\s+forma[cç][aã]o/i,
  /^(?:do|da|dos|das)\s+matr[ií]cula/i,
  /^(?:do|da|dos|das)\s+bolsa\s+de\s+estudos?/i,
  /^(?:do|da|dos|das)\s+cronograma/i,
  /^(?:das|dos)\s+disposi[cç][oõ]es\s+finais/i,
  /^(?:das|dos)\s+disposi[cç][oõ]es\s+gerais/i,
  /^(?:das|dos)\s+vagas\s+reservadas/i,
  /^(?:das|dos)\s+vagas\b/i,
  /^(?:das|dos)\s+inscri[cç][oõ]es\b/i,
  /^(?:dos|das)\s+requisitos\b/i,
  /^(?:dos|das)\s+recursos\b/i,
  /^(?:dos|das)\s+exames\b/i,
  /^(?:do|da)\s+teste\s+de\s+aptid[aã]o/i,
  /^(?:do|da)\s+exame\s+biom[eé]dico/i,
  /^(?:da)\s+avalia[cç][aã]o\s+psicol[oó]gica/i,
  /^(?:da)\s+investiga[cç][aã]o\s+social/i,
  /^(?:dos|das)\s+resultados?\b/i,
  /^(?:da)\s+classifica[cç][aã]o\b/i,
  /^(?:da)\s+convoca[cç][aã]o\b/i,
  /^(?:da)\s+documenta[cç][aã]o\b/i,
  /^(?:anexo|ap[eê]ndice)\s+[ivxldcm\d]+\b(?!.*(?:conte[uú]do|programa|objeto[s]?\s+de\s+avalia[cç][aã]o))/i,
  /^cronograma(?:\s+previsto|\s+de\s+atividades|\s+estimado)?$/i,
  /^disposi[cç][oõ]es\s+finais$/i,
  /^quadro\s+de\s+vagas$/i,
  /^modelo\s+de\s+(?:declara[cç][aã]o|atestado|laudo|requerimento)/i,
  /^formul[aá]rio\s+de\s+recurso/i,
];

// Disciplinas canônicas para pontuação de evidência
const CANONICAL_DISCIPLINE_EVIDENCES = [
  "lingua portuguesa",
  "portugues",
  "redacao oficial",
  "raciocinio logico",
  "matematica",
  "informatica",
  "atualidades",
  "direito constitucional",
  "direito administrativo",
  "direito penal",
  "direito processual penal",
  "direito penal militar",
  "direito processual penal militar",
  "direito civil",
  "direito processual civil",
  "direitos humanos",
  "legislacao especial",
  "legislacao institucional",
  "administracao publica",
  "conhecimentos gerais",
  "conhecimentos basicos",
  "conhecimentos especificos",
  "geografia",
  "historia",
  "etica no servico publico",
];

interface SectionCandidateMatch {
  pageNumber: number;
  lineIndex: number;
  heading: string;
  isSummary: boolean;
}

/**
 * Verifica se a linha tem características de sumário/índice (ex: pontilhados seguidos de número de página)
 */
function isSummaryLine(line: string): boolean {
  // Pontilhados comuns em sumários: "Conteúdo Programático ............. 45"
  if (/\.{3,}|\.\s\.\s\./.test(line)) {
    return true;
  }
  // Linha com número de página no final de título curto
  if (/conte[uú]do\s+program[aá]tico\s+\d{1,3}$/i.test(line)) {
    return true;
  }
  return false;
}

/**
 * Avalia a evidência de conteúdo acadêmico/programático nas páginas a partir do candidato
 */
function scoreCandidateEvidence(
  candidatePageIdx: number,
  pages: PageText[]
): { score: number; disciplineHits: number; numberedTopicHits: number } {
  let score = 0;
  let disciplineHits = 0;
  let numberedTopicHits = 0;

  // Analisa uma janela de até 6 páginas após o início
  const samplePages = pages.slice(candidatePageIdx, candidatePageIdx + 6);
  const sampleText = samplePages.map((p) => p.text).join("\n");
  const normText = removeAccents(sampleText.toLowerCase());

  // 1. Ocorrência de disciplinas canônicas (+15 pontos cada, máx 120)
  for (const disc of CANONICAL_DISCIPLINE_EVIDENCES) {
    if (normText.includes(disc)) {
      disciplineHits++;
      score += 15;
    }
  }

  // 2. Detecção de tópicos numerados: "1 Compreensão de texto...", "1.1 Ortografia..."
  const numberedMatches = sampleText.match(/(?:^|\n|\s)\d+(?:\.\d+)*\s+[A-ZÀ-Ú]/g);
  if (numberedMatches) {
    numberedTopicHits = numberedMatches.length;
    score += Math.min(60, numberedMatches.length * 4);
  }

  // 3. Detecção de tópicos separados por ponto e vírgula
  const semicolonsCount = (sampleText.match(/;/g) || []).length;
  if (semicolonsCount >= 5) {
    score += 25;
  }

  // 4. Blocos estruturais de conhecimentos
  if (normText.includes("conhecimentos basicos") || normText.includes("conhecimentos gerais")) {
    score += 15;
  }
  if (normText.includes("conhecimentos especificos")) {
    score += 15;
  }

  // 5. Penalidades por termos administrativos
  if (normText.includes("recurso contra o gabarito") || normText.includes("prazo para impugnacao")) {
    score -= 30;
  }
  if (normText.includes("o candidato devera comparecer") && disciplineHits === 0) {
    score -= 40;
  }

  return { score, disciplineHits, numberedTopicHits };
}

/**
 * Localiza a seção de Conteúdo Programático isolando estritamente seu INÍCIO e FIM
 */
export function detectProgrammaticSection(pages: PageText[]): ProgrammaticSection | null {
  if (!pages || pages.length === 0) return null;

  const candidateMatches: SectionCandidateMatch[] = [];

  // FASE 1: Localizar todos os candidatos potenciais nas páginas
  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const lines = page.text.split("\n").map((l) => l.trim()).filter(Boolean);

    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const line = lines[lIdx];
      const norm = removeAccents(line.toLowerCase());

      const isMatch = PROGRAMMATIC_START_PATTERNS.some((pat) => pat.test(norm));
      if (isMatch) {
        const isSumm = isSummaryLine(line) || (pIdx <= 2 && lines.some((other) => isSummaryLine(other)));
        candidateMatches.push({
          pageNumber: page.pageNumber,
          lineIndex: lIdx,
          heading: cleanWhitespace(line),
          isSummary: isSumm,
        });
      }
    }
  }

  // Se não encontrou cabeçalho explícito com regex padrão, procura "CONHECIMENTOS BÁSICOS" ou "PROGRAMA" em linhas isoladas
  if (candidateMatches.length === 0) {
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const page = pages[pIdx];
      const lines = page.text.split("\n").map((l) => l.trim()).filter(Boolean);
      for (let lIdx = 0; lIdx < lines.length; lIdx++) {
        const line = lines[lIdx];
        const norm = removeAccents(line.toLowerCase());
        if (
          norm === "conhecimentos basicos" ||
          norm === "conhecimentos especificos" ||
          norm === "programa da prova" ||
          norm === "programa de conhecimentos"
        ) {
          candidateMatches.push({
            pageNumber: page.pageNumber,
            lineIndex: lIdx,
            heading: cleanWhitespace(line),
            isSummary: false,
          });
        }
      }
    }
  }

  if (candidateMatches.length === 0) {
    return null;
  }

  // Filtrar candidatos: descartar os que são comprovadamente sumários, a menos que só haja eles
  const nonSummaryCandidates = candidateMatches.filter((c) => !c.isSummary);
  const candidatesToEvaluate = nonSummaryCandidates.length > 0 ? nonSummaryCandidates : candidateMatches;

  // Avaliar score de cada candidato
  let bestCandidate: SectionCandidateMatch | null = null;
  let bestScore = -999;
  let bestDisciplineHits = 0;

  for (const cand of candidatesToEvaluate) {
    const pIdx = pages.findIndex((p) => p.pageNumber === cand.pageNumber);
    if (pIdx === -1) continue;

    const { score, disciplineHits } = scoreCandidateEvidence(pIdx, pages);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = cand;
      bestDisciplineHits = disciplineHits;
    }
  }

  if (!bestCandidate) {
    return null;
  }

  // Se mesmo o melhor candidato não tem evidência mínima de disciplinas acadêmicas:
  if (bestDisciplineHits === 0 && bestScore < 15) {
    return null;
  }

  // FASE 2: DETERMINAR O FINAL DA SEÇÃO
  const startPageNum = bestCandidate.pageNumber;
  const startPageIdx = pages.findIndex((p) => p.pageNumber === startPageNum);

  let endPageNum = pages[pages.length - 1].pageNumber;
  let terminated = false;
  const collectedTextLines: string[] = [];

  for (let pIdx = startPageIdx; pIdx < pages.length; pIdx++) {
    if (terminated) break;

    const page = pages[pIdx];
    const lines = page.text.split("\n");

    const startLineIdx = pIdx === startPageIdx ? bestCandidate.lineIndex : 0;

    for (let lIdx = startLineIdx; lIdx < lines.length; lIdx++) {
      const line = lines[lIdx].trim();
      if (!line) continue;

      // Não interrompe na própria linha de abertura do candidato
      if (pIdx === startPageIdx && lIdx === bestCandidate.lineIndex) {
        continue;
      }

      const norm = removeAccents(line.toLowerCase());

      // Verifica se encontrou marcador de encerramento da seção
      const isTermination = TERMINATION_PATTERNS.some((pat) => pat.test(norm));
      if (isTermination) {
        // Encontrou fim da seção!
        endPageNum = page.pageNumber;
        terminated = true;
        // Não adiciona o marcador de término ao conteúdo
        break;
      }

      collectedTextLines.push(line);
    }

    if (!terminated) {
      endPageNum = page.pageNumber;
    }
  }

  const extractedText = collectedTextLines.join("\n").trim();
  const confidence = bestScore >= 60 && bestDisciplineHits >= 3 ? "high" : bestScore >= 30 ? "medium" : "low";

  return {
    startPage: startPageNum,
    endPage: endPageNum,
    heading: bestCandidate.heading,
    confidence,
    score: bestScore,
    extractedText,
  };
}

/**
 * Mantém compatibilidade com o formato legado DetectedSection se necessário
 */
export function detectSections(pages: PageText[]): DetectedSection[] {
  const programmatic = detectProgrammaticSection(pages);
  const sections: DetectedSection[] = [];

  if (programmatic) {
    sections.push({
      title: programmatic.heading,
      normalizedTitle: removeAccents(programmatic.heading.toLowerCase()),
      pageStart: programmatic.startPage,
      pageEnd: programmatic.endPage,
      type: "programmatic_content",
      text: programmatic.extractedText,
    });
  }

  return sections;
}
