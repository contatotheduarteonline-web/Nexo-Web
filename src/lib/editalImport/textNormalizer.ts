/**
 * textNormalizer.ts
 * Normalização textual determinística e utilitários para extração e deduplicação de editais.
 */

export function removeAccents(str: string): string {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function cleanWhitespace(str: string): string {
  if (!str) return "";
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Corrige quebras de linha com hifenização típica de PDFs (ex: 'desenvolvi- \n mento' -> 'desenvolvimento')
 * e remove caracteres nulos ou artefatos de renderização.
 */
export function normalizePdfText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\0/g, "")
    .replace(/(\w+)-\s*\n\s*(\w+)/g, "$1$2")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ");
}

/**
 * Remove linhas repetidas de cabeçalho/rodapé de páginas (ex: "Página 12 de 85", carimbos de edital)
 */
export function removePageNoise(lines: string[]): string[] {
  const noiseRegex = /^(p[aá]gina\s+\d+(\s+de\s+\d+)?|edital\s+n[ºo]\s*\d+[\w/.-]*|\d+\s*\/\s*\d+|\s*www\.[\w.-]+\.[\w.-]+)\s*$/i;
  return lines.filter((l) => {
    const trimmed = l.trim();
    if (!trimmed) return false;
    if (noiseRegex.test(trimmed)) return false;
    return true;
  });
}

/**
 * Gera identidade normalizada unívoca para cruzamento e detecção de duplicidade
 * (ex: 'policia militar | pmba | ba | fcc | 2026 | edital soldado')
 */
export function generateNormalizedIdentity(params: {
  institution?: string;
  acronym?: string;
  uf?: string;
  board?: string;
  year?: number | string;
  title?: string;
}): string {
  const norm = (v?: string | number) =>
    removeAccents(String(v || "").toLowerCase())
      .replace(/[^a-z0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const inst = norm(params.institution);
  const acr = norm(params.acronym);
  const uf = norm(params.uf);
  const board = norm(params.board);
  const yr = String(params.year || "").trim();
  const tit = norm(params.title);

  return [inst, acr, uf, board, yr, tit].filter(Boolean).join(" | ");
}

/**
 * Localiza indícios de ano no texto (ex: 2024, 2025, 2026)
 */
export function detectYearFromText(text: string): number | undefined {
  const currentYear = new Date().getFullYear();
  const matches = text.match(/\b(20[12]\d)\b/g);
  if (!matches) return undefined;
  
  // Prioriza anos recentes (currentYear - 2 até currentYear + 2)
  for (const m of matches) {
    const y = parseInt(m, 10);
    if (y >= currentYear - 3 && y <= currentYear + 2) {
      return y;
    }
  }
  return parseInt(matches[0], 10);
}

/**
 * Localiza número do edital (ex: 'Edital nº 01/2026', 'Edital n. 2/2025', 'Edital de Abertura 001/2024')
 */
export function detectEditalNumber(text: string): string | undefined {
  const regex = /edital\s+(?:n[ºo°.]?\s*)?(\d{1,4}\s*[\/-]\s*\d{2,4})/i;
  const match = text.match(regex);
  if (match) {
    return cleanWhitespace(match[1].replace(/\s+/g, ""));
  }
  return undefined;
}

/**
 * Detecta UF (estado brasileiro) a partir de texto
 */
export const BRAZIL_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const;

export function detectUfFromText(text: string): string | undefined {
  const upper = text.toUpperCase();
  for (const uf of BRAZIL_UFS) {
    // Busca UF isolada (ex: "ESTADO DA BAHIA - BA", "POLÍCIA MILITAR DE SP")
    const regex = new RegExp(`(?:\\bESTADO\\s+(?:DE|DO|DA)\\s+[\\w\\s]+|\\bPOL[IÍ]CIA\\s+\\w+\\s+(?:DE|DO|DA)?\\s*|[-–/\\(]\\s*)(${uf})(?:[-–/\\)\\s]|$)`, "i");
    if (regex.test(upper)) {
      return uf;
    }
  }
  return undefined;
}

/**
 * Detecta banca organizadora comum (Cespe/Cebraspe, FGV, Vunesp, FCC, IBFC, etc.)
 */
export const KNOWN_BOARDS = [
  { name: "Cebraspe", aliases: ["cebraspe", "cespe", "cespe/cebraspe"] },
  { name: "FGV", aliases: ["fgv", "fundacao getulio vargas", "fundação getulio vargas", "fundação getúlio vargas"] },
  { name: "Vunesp", aliases: ["vunesp", "fundacao vunesp", "fundação vunesp"] },
  { name: "FCC", aliases: ["fcc", "fundacao carlos chagas", "fundação carlos chagas"] },
  { name: "IBFC", aliases: ["ibfc", "instituto brasileiro de formacao e capacitacao"] },
  { name: "Idecan", aliases: ["idecan"] },
  { name: "AOCP", aliases: ["instituto aocp", "aocp"] },
  { name: "Quadrix", aliases: ["quadrix", "instituto quadrix"] },
  { name: "Selecon", aliases: ["selecon", "instituto selecon"] },
  { name: "Consulplan", aliases: ["consulplan", "instituto consulplan"] },
  { name: "Fumarc", aliases: ["fumarc"] },
  { name: "Fundatec", aliases: ["fundatec"] },
  { name: "IADES", aliases: ["iades", "instituto iades"] },
];

export function detectBoardFromText(text: string): string | undefined {
  const norm = removeAccents(text.toLowerCase());
  for (const b of KNOWN_BOARDS) {
    for (const alias of b.aliases) {
      const aliasNorm = removeAccents(alias);
      if (new RegExp(`\\b${aliasNorm}\\b`, "i").test(norm)) {
        return b.name;
      }
    }
  }
  return undefined;
}
