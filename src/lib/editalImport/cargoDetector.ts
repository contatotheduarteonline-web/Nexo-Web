/**
 * cargoDetector.ts
 * Detecta cargos e vincula seus respectivos recortes de conteúdo programático.
 * 
 * Regra fundamental:
 * - O snippet de conteúdo DEVE originar-se exclusivamente da seção programática recortada.
 * - Nunca alimentar cargos com o texto do edital completo.
 */

import { PageText, ProgrammaticSection } from "./types";
import { cleanWhitespace, removeAccents } from "./textNormalizer";

export interface RawCargoBlock {
  name: string;
  pageNumber?: number;
  contentSnippet: string;
}

// Helper para verificar se uma string parece nome de arquivo ou ruído de sistema
function looksLikeFileNameOrNoise(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  if (lower.includes(".pdf") || lower.includes(".doc") || lower.includes(".zip")) return true;
  if (/^edital[\s_\-]/i.test(lower) || /[\s_\-]edital/i.test(lower)) return true;
  if (/^concurso[\s_\-]/i.test(lower)) return true;
  if (lower.includes("consolidado") && lower.includes("editais")) return true;
  if ((text.match(/[-_]/g) || []).length >= 3 && !text.includes(" ")) return true;
  return false;
}

/**
 * Detecta cargos dentro da seção de conteúdo programático recortada
 */
export function detectCargosInEdital(
  programmaticSection: ProgrammaticSection | null,
  pages: PageText[],
  fallbackName?: string
): RawCargoBlock[] {
  // Se não há seção programática isolada, retorna array vazio
  if (!programmaticSection || !programmaticSection.extractedText.trim()) {
    return [];
  }

  const targetText = programmaticSection.extractedText;
  const lines = targetText.split("\n").map((l) => l.trim()).filter(Boolean);

  const cargoRegex = /^(?:cargo(?:\s+\d+)?|posto\s*\/\s*gradua[cç][aã]o|fun[cç][aã]o|especialidade)\s*[:–—\-]\s*(.+)$/i;
  const directCargoRegex = /^(?:cargo\s+\d+\s*[-–—:]\s*)(.+)$/i;

  const cargoBlocks: RawCargoBlock[] = [];
  let currentCargo: RawCargoBlock | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(cargoRegex) || line.match(directCargoRegex);

    if (match && match[1]) {
      const candidateName = cleanWhitespace(match[1]);

      // Validações para não confundir com cabeçalhos falsos ou nomes de arquivo
      if (
        candidateName.length >= 3 &&
        candidateName.length <= 80 &&
        !candidateName.includes(";") &&
        !candidateName.toLowerCase().startsWith("horário") &&
        !candidateName.toLowerCase().startsWith("local") &&
        !looksLikeFileNameOrNoise(candidateName)
      ) {
        if (currentCargo) {
          cargoBlocks.push(currentCargo);
        }

        const pageFound = pages.find((p) => p.text.includes(line))?.pageNumber || programmaticSection.startPage;

        currentCargo = {
          name: candidateName,
          pageNumber: pageFound,
          contentSnippet: "",
        };
        continue;
      }
    }

    if (currentCargo) {
      currentCargo.contentSnippet += (currentCargo.contentSnippet ? "\n" : "") + line;
    }
  }

  if (currentCargo) {
    cargoBlocks.push(currentCargo);
  }

  // Se foram detectados múltiplos cargos estruturados dentro do programa
  if (cargoBlocks.length > 0) {
    const uniqueMap = new Map<string, RawCargoBlock>();
    for (const cb of cargoBlocks) {
      const key = removeAccents(cb.name.toLowerCase());
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, cb);
      } else {
        const existing = uniqueMap.get(key)!;
        existing.contentSnippet += "\n" + cb.contentSnippet;
      }
    }
    return Array.from(uniqueMap.values());
  }

  // Caso contrário, é um edital com cargo único ou estrutura geral de disciplinas
  // Inferir o nome do cargo através das primeiras páginas do edital
  let singleName = "";

  // Se o chamador passou um fallbackName legítimo (não é nome de arquivo)
  if (fallbackName && !looksLikeFileNameOrNoise(fallbackName)) {
    singleName = cleanWhitespace(fallbackName);
  }

  if (!singleName) {
    // Procura por cargos reais clássicos nas primeiras páginas do edital
    const firstPages = pages.slice(0, 5).map((p) => p.text).join("\n");
    const cargoMatches = firstPages.match(
      /(soldado(?:\s+pm|\s+da\s+pol[ií]cia\s+militar|\s+combatente|\s+2ª\s+classe|\s+1ª\s+classe)?|oficial(?:\s+pm|\s+da\s+pm|\s+combatente|\s+de\s+sa[uú]de)?|cadete(?:\s+pm)?|agente\s+de\s+pol[ií]cia(?:\s+federal|\s+civil)?|escriv[aã]o(?:\s+de\s+pol[ií]cia)?|papiloscopista(?:\s+policial)?|delegado(?:\s+de\s+pol[ií]cia)?|perito(?:\s+criminal|\s+m[eé]dico)?|policial\s+rodovi[aá]rio\s+federal|guarda\s+(?:municipal|civil\s+metropolitano)|t[eé]cnico\s+judici[aá]rio(?:\s+-\s+[a-z\s]+)?|analista\s+judici[aá]rio(?:\s+-\s+[a-z\s]+)?|auditor[\s-]fiscal(?:\s+da\s+receita\s+federal)?|analista\s+tribut[aá]rio|analista\s+de\s+controle\s+externo|auditor\s+estadual|t[eé]cnico\s+banc[aá]rio|escritur[aá]rio|assistente\s+administrativo|analista\s+administrativo)/i
    );

    if (cargoMatches) {
      // Formata com capitalização limpa
      const rawMatch = cleanWhitespace(cargoMatches[0]);
      singleName = rawMatch.charAt(0).toUpperCase() + rawMatch.slice(1);
    }
  }

  // Se mesmo assim nenhum cargo real pôde ser identificado, nunca inventar nem usar nome do arquivo!
  if (!singleName) {
    singleName = "Cargo não identificado";
  }

  return [
    {
      name: singleName,
      pageNumber: programmaticSection.startPage,
      contentSnippet: programmaticSection.extractedText,
    },
  ];
}
