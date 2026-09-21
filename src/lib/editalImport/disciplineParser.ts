/**
 * disciplineParser.ts
 * Extrai disciplinas e tópicos estritamente a partir do texto isolado da seção de conteúdo programático.
 * 
 * Regras cruciais:
 * 1. Não recebe o edital inteiro (recebe somente a seção recortada).
 * 2. Discrimina blocos intermediários ("Conhecimentos Básicos", "Conhecimentos Específicos", "Módulo I")
 *    como grupo (group), e NÃO como disciplinas.
 * 3. Rejeita terminantemente capítulos administrativos do concurso.
 * 4. Preserva rastreabilidade de origem (sourcePage, sourceReference, sourceText).
 */

import { ExtractedDiscipline, ExtractedTopic, PageText } from "./types";
import { cleanWhitespace, removeAccents } from "./textNormalizer";

const RECOGNIZED_DISCIPLINES = [
  "LINGUA PORTUGUESA",
  "PORTUGUES",
  "REDACAO OFICIAL",
  "INTERPRETACAO DE TEXTO",
  "RACIOCINIO LOGICO",
  "RACIOCINIO LOGICO-MATEMATICO",
  "RACIOCINIO LOGICO E MATEMATICO",
  "MATEMATICA",
  "MATEMATICA FINANCEIRA",
  "ESTATISTICA",
  "INFORMATICA",
  "NOCOES DE INFORMATICA",
  "TECNOLOGIA DA INFORMACAO",
  "ATUALIDADES",
  "DIREITO CONSTITUCIONAL",
  "NOCOES DE DIREITO CONSTITUCIONAL",
  "DIREITO ADMINISTRATIVO",
  "NOCOES DE DIREITO ADMINISTRATIVO",
  "DIREITO PENAL",
  "NOCOES DE DIREITO PENAL",
  "DIREITO PROCESSUAL PENAL",
  "NOCOES DE DIREITO PROCESSUAL PENAL",
  "DIREITO PENAL MILITAR",
  "NOCOES DE DIREITO PENAL MILITAR",
  "DIREITO PROCESSUAL PENAL MILITAR",
  "NOCOES DE DIREITO PROCESSUAL PENAL MILITAR",
  "DIREITO CIVIL",
  "NOCOES DE DIREITO CIVIL",
  "DIREITO PROCESSUAL CIVIL",
  "NOCOES DE DIREITO PROCESSUAL CIVIL",
  "DIREITO TRIBUTARIO",
  "LEGISLACAO TRIBUTARIA",
  "DIREITO PREVIDENCIARIO",
  "DIREITO DO TRABALHO",
  "DIREITO PROCESSUAL DO TRABALHO",
  "DIREITO FINANCEIRO",
  "DIREITO AMBIENTAL",
  "DIREITO ELEITORAL",
  "DIREITO INTERNACIONAL",
  "DIREITOS HUMANOS",
  "NOCOES DE DIREITOS HUMANOS",
  "LEGISLACAO ESPECIAL",
  "LEGISLACAO PENAL ESPECIAL",
  "LEGISLACAO INSTITUCIONAL",
  "LEGISLAÇÃO APLICADA",
  "ADMINISTRACAO PUBLICA",
  "ADMINISTRACAO GERAL",
  "ADMINISTRACAO FINANCEIRA E ORCAMENTARIA",
  "AFO",
  "CONTABILIDADE GERAL",
  "CONTABILIDADE PUBLICA",
  "AUDITORIA",
  "AUDITORIA GOVERNAMENTAL",
  "CONHECIMENTOS BANCARIOS",
  "ETICA NO SERVICO PUBLICO",
  "GEOGRAFIA",
  "GEOGRAFIA DO BRASIL",
  "HISTORIA",
  "HISTORIA DO BRASIL",
  "LEGISLACAO DE TRANSITO",
  "CRIMINOLOGIA",
  "MEDICINA LEGAL",
  "LEGISLACAO DA POLICIA MILITAR",
  "ESTATUTO DOS POLICIAIS MILITARES",
  "CIENCIA POLITICA",
  "SOCIOLOGIA",
  "FILOSOFIA",
  "FISICA",
  "QUIMICA",
  "BIOLOGIA",
  "LINGUA INGLESA",
  "INGLES",
  "LINGUA ESPANHOLA",
  "ESPANHOL",
];

// Capítulos ou seções administrativas que NUNCA podem ser tratados como matérias
const ADMINISTRATIVE_CHAPTER_PATTERNS = [
  /^(?:do|da|dos|das)\s+curso\s+de\s+forma[cç][aã]o/i,
  /^(?:do|da|dos|das)\s+matr[ií]cula/i,
  /^(?:do|da|dos|das)\s+bolsa\s+de\s+estudos?/i,
  /^(?:das|dos)\s+disposi[cç][oõ]es\s+(?:finais|gerais|preliminares)/i,
  /^(?:das|dos)\s+vagas\s+reservadas/i,
  /^(?:das|dos)\s+vagas\b/i,
  /^(?:da|das)\s+inscri[cç][oõ]es\b/i,
  /^(?:da)\s+taxa\s+de\s+inscri[cç][aã]o/i,
  /^(?:da)\s+isen[cç][aã]o/i,
  /^(?:dos)\s+requisitos/i,
  /^(?:da)\s+remunera[cç][aã]o/i,
  /^(?:do)\s+regime\s+jur[ií]dico/i,
  /^(?:dos)\s+recursos\b/i,
  /^(?:das)\s+etapas/i,
  /^(?:do)\s+cronograma/i,
  /^(?:do)\s+teste\s+de\s+aptid[aã]o/i,
  /^(?:do)\s+exame\s+biom[eé]dico/i,
  /^(?:da)\s+avalia[cç][aã]o\s+psicol[oó]gica/i,
  /^(?:da)\s+investiga[cç][aã]o\s+social/i,
  /^(?:da)\s+classifica[cç][aã]o\b/i,
  /^(?:da)\s+convoca[cç][aã]o\b/i,
  /^(?:da)\s+documenta[cç][aã]o\b/i,
  /^(?:dos)\s+resultados?\b/i,
  /^(?:do|da)\s+gabarito/i,
  /^(?:do)\s+local\s+de\s+prova/i,
  /^(?:do)\s+hor[aá]rio/i,
  /^(?:da)\s+per[ií]cia\s+m[eé]dica/i,
  /^(?:do)\s+atendimento\s+especial/i,
  /^(?:dos)\s+crit[eé]rios\s+de\s+avalia[cç][aã]o/i,
  /^(?:da)\s+prova\s+discursiva/i,
  /^(?:da)\s+prova\s+de\s+t[ií]tulos/i,
];

// Blocos intermediários que agrupam disciplinas
const INTERMEDIATE_GROUP_PATTERNS = [
  /^conhecimentos\s+b[aá]sicos(?:\s*[-–—:]|$)/i,
  /^conhecimentos\s+espec[ií]ficos(?:\s*[-–—:]|$)/i,
  /^conhecimentos\s+gerais(?:\s*[-–—:]|$)/i,
  /^conhecimentos\s+comuns(?:\s*[-–—:]|$)/i,
  /^m[oó]dulo\s+[ivxldcm\d]+(?:\s*[-–—:]|$)/i,
  /^bloco\s+[ivxldcm\d]+(?:\s*[-–—:]|$)/i,
  /^parte\s+[ivxldcm\d]+(?:\s*[-–—:]|$)/i,
  /^eixo\s+tem[aá]tico\s+\d+/i,
  /^[aá]rea\s+de\s+conhecimento\s+\d+/i,
];

import {
  DISTINCT_DISCIPLINE_COLORS,
  getNextAvailableDisciplineColor,
  ensureUniqueDisciplineColors,
} from "../../utils/disciplineColors";

interface RawDisciplineBlock {
  name: string;
  group?: string;
  lines: string[];
  pageNumber?: number;
  rawHeaderLine: string;
}

/**
 * Localiza a página de origem de uma linha no acervo de páginas
 */
export function findSourcePage(line: string, pages: PageText[]): number | undefined {
  if (!line || line.length < 5 || !pages || pages.length === 0) return undefined;
  const sample = cleanWhitespace(line).slice(0, 35);
  const found = pages.find((p) => p.text.includes(sample));
  return found?.pageNumber;
}

/**
 * Verifica se a linha corresponde a um bloco intermediário/agrupador (ex: Conhecimentos Básicos)
 */
export function isIntermediateGroup(line: string): { isGroup: boolean; groupName: string } {
  const trimmed = cleanWhitespace(line);
  if (!trimmed || trimmed.length > 70) return { isGroup: false, groupName: "" };

  const norm = removeAccents(trimmed.toLowerCase());
  for (const pat of INTERMEDIATE_GROUP_PATTERNS) {
    if (pat.test(norm)) {
      return { isGroup: true, groupName: trimmed.replace(/[:–—\-]\s*$/, "").trim() };
    }
  }

  return { isGroup: false, groupName: "" };
}

/**
 * Verifica com rigor se a linha é um cabeçalho de disciplina real
 */
export function isDisciplineHeader(line: string): { isHeader: boolean; cleanedName: string } {
  const trimmed = cleanWhitespace(line);
  if (!trimmed || trimmed.length < 3 || trimmed.length > 90) {
    return { isHeader: false, cleanedName: "" };
  }

  // 1. REJEIÇÃO ABSOLUTA de capítulos administrativos
  for (const adminPat of ADMINISTRATIVE_CHAPTER_PATTERNS) {
    if (adminPat.test(trimmed)) {
      return { isHeader: false, cleanedName: "" };
    }
  }

  // Rejeita frases verbais regulamentares (ex: "O candidato que não apresentar...")
  if (
    /(?:o\s+candidato|ser[aá]\s+eliminado|prazo\s+de\s+\d+|dever[aá]\s+comparecer|comprova[cç][aã]o|inscri[cç][aã]o\s+pela\s+internet)/i.test(
      trimmed
    )
  ) {
    return { isHeader: false, cleanedName: "" };
  }

  // Remove pontuação de fechamento
  const withoutColon = trimmed.replace(/[:–—\-]\s*$/, "").trim();
  const norm = removeAccents(withoutColon.toUpperCase());

  // Rejeita se for apenas nome de grupo intermediário
  if (
    norm === "CONHECIMENTOS BASICOS" ||
    norm === "CONHECIMENTOS ESPECIFICOS" ||
    norm === "CONHECIMENTOS GERAIS" ||
    norm === "CONTEUDO PROGRAMATICO" ||
    norm === "OBJETOS DE AVALIACAO" ||
    /^ANEXO\s+[IVXLCDM\d]+/.test(norm)
  ) {
    return { isHeader: false, cleanedName: "" };
  }

  // 2. Correspondência direta com lista canônica de disciplinas
  for (const disc of RECOGNIZED_DISCIPLINES) {
    if (
      norm === disc ||
      norm === `DISCIPLINA: ${disc}` ||
      norm === `MATERIA: ${disc}` ||
      norm.startsWith(`${disc} -`) ||
      norm.startsWith(`${disc}:`)
    ) {
      return { isHeader: true, cleanedName: withoutColon };
    }
  }

  // 3. Prefixo canônico explícito (ex: "NOÇÕES DE...", "DIREITO...", "LEGISLAÇÃO...")
  const startsWithDiscTerm =
    /^(?:no[cç][oõ]es\s+de\s+|direito\s+|legisla[cç][aã]o\s+|l[ií]ngua\s+|racioc[ií]nio\s+|disciplina\s*[:–—\-]\s*|mat[eé]ria\s*[:–—\-]\s*)/i.test(
      withoutColon
    );

  if (startsWithDiscTerm && withoutColon.length <= 70 && !withoutColon.includes(";")) {
    return { isHeader: true, cleanedName: withoutColon };
  }

  // 4. Numeração explícita de disciplina (ex: "1. LÍNGUA PORTUGUESA:" ou "DISCIPLINA 1 - DIREITO CONSTITUCIONAL")
  const numberedDisc = trimmed.match(
    /^(?:disciplina\s+\d+\s*[-–—:]\s*|\d+\s*[.)-]\s*)([A-ZÀ-Ú\s]{4,60}):?$/
  );
  if (numberedDisc && numberedDisc[1]) {
    const candidate = cleanWhitespace(numberedDisc[1]);
    const normCand = removeAccents(candidate.toUpperCase());
    // Confirma se o termo numerado parece matéria
    const looksLikeSubject =
      RECOGNIZED_DISCIPLINES.some((d) => normCand.includes(d)) ||
      /^(?:PORTUGU[EÊ]S|DIREITO|INFORM[AÁ]TICA|MATEM[AÁ]TICA|LEGISLA[CÇ][AÃ]O|HIST[OÓ]RIA|GEOGRAFIA)/i.test(
        candidate
      );
    if (looksLikeSubject) {
      return { isHeader: true, cleanedName: candidate };
    }
  }

  return { isHeader: false, cleanedName: "" };
}

/**
 * Divide as linhas de uma disciplina em tópicos individuais de forma limpa
 */
export function extractTopicsFromLines(
  lines: string[],
  pageRef?: string,
  sourcePage?: number
): ExtractedTopic[] {
  const fullText = lines.join("\n").trim();
  if (!fullText) return [];

  const rawTopics: string[] = [];

  // Método A: Padrão Cespe com números sequenciais inline (1 Compreensão... 2 Tipologia... 2.1 Coesão...)
  const hasInlineNumbered = /(?:^|\s)\d+(?:\.\d+)*\s+[A-ZÀ-Ú]/.test(fullText);

  if (hasInlineNumbered) {
    const tokens = fullText.split(/(?:^|\s)(?=\d+(?:\.\d+)*\s+[A-ZÀ-Ú])/g);
    for (const tok of tokens) {
      const clean = cleanWhitespace(tok);
      if (clean && clean.length > 2) {
        rawTopics.push(clean);
      }
    }
  }

  // Método B: Se não quebrou por numeração Cespe, divide por quebras de linha e pontos e vírgulas
  if (rawTopics.length <= 1) {
    rawTopics.length = 0;
    const splitLines = fullText.split("\n");

    for (const l of splitLines) {
      const clean = cleanWhitespace(l);
      if (!clean) continue;

      if (clean.includes(";") && clean.length > 25) {
        const parts = clean.split(";").map((p) => cleanWhitespace(p)).filter(Boolean);
        if (parts.length >= 2) {
          rawTopics.push(...parts);
          continue;
        }
      }

      rawTopics.push(clean);
    }
  }

  // Filtro de ruídos e formatação de tópicos finais
  const filteredTopics: ExtractedTopic[] = [];
  let order = 1;

  for (const raw of rawTopics) {
    let clean = cleanWhitespace(raw);
    clean = clean.replace(/[.;,]\s*$/, "").trim();
    clean = clean.replace(/^[-–—•*]\s*/, "");

    // Descarte de ruídos administrativos ou números de página
    if (
      clean.length >= 3 &&
      !clean.toLowerCase().startsWith("página ") &&
      clean !== "..." &&
      !clean.toLowerCase().startsWith("anexo ")
    ) {
      filteredTopics.push({
        id: `topic-${order}-${Math.random().toString(36).substr(2, 6)}`,
        title: clean,
        order: order,
        sourcePage,
        sourceReference: pageRef,
        sourceText: clean.slice(0, 120),
      });
      order++;
    }
  }

  return filteredTopics;
}

/**
 * Parser principal de disciplinas e tópicos.
 * Recebe exclusivamente o texto da seção recortada e as páginas do edital.
 */
export function parseDisciplinesAndTopics(
  rawText: string,
  pages: PageText[]
): ExtractedDiscipline[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const blocks: RawDisciplineBlock[] = [];
  let currentGroup: string | undefined = undefined;
  let currentBlock: RawDisciplineBlock | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Verifica se é um agrupador intermediário (ex: Conhecimentos Básicos, Módulo I)
    const { isGroup, groupName } = isIntermediateGroup(line);
    if (isGroup) {
      currentGroup = groupName;
      // Se havia um bloco anterior, fecha-o
      if (currentBlock && currentBlock.lines.length > 0) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // 2. Verifica se a linha é cabeçalho de disciplina real
    const { isHeader, cleanedName } = isDisciplineHeader(line);

    if (isHeader) {
      if (currentBlock && currentBlock.lines.length > 0) {
        blocks.push(currentBlock);
      }

      currentBlock = {
        name: cleanedName,
        group: currentGroup,
        lines: [],
        rawHeaderLine: line,
        pageNumber: findSourcePage(line, pages),
      };
      continue;
    }

    // 3. Linhas de conteúdo / tópicos
    if (currentBlock) {
      currentBlock.lines.push(line);
    }
    // Se não há disciplina aberta ainda (ex: preâmbulo da seção programática), ignora as linhas soltas
  }

  if (currentBlock && currentBlock.lines.length > 0) {
    blocks.push(currentBlock);
  }

  // Converte blocos válidos em ExtractedDiscipline
  const disciplines: ExtractedDiscipline[] = [];

  blocks.forEach((b, idx) => {
    const pageRef = b.pageNumber ? `Página ${b.pageNumber}` : undefined;
    const topics = extractTopicsFromLines(b.lines, pageRef, b.pageNumber);

    // Só inclui disciplinas que possuam tópicos reais
    if (topics.length > 0) {
      disciplines.push({
        id: `disc-${idx + 1}-${Math.random().toString(36).substr(2, 6)}`,
        name: b.name,
        group: b.group,
        order: idx + 1,
        color: DISTINCT_DISCIPLINE_COLORS[idx % DISTINCT_DISCIPLINE_COLORS.length],
        weight: 2,
        topics,
        sourcePage: b.pageNumber,
        sourceReference: pageRef,
        sourceText: b.rawHeaderLine,
      });
    }
  });

  return ensureUniqueDisciplineColors(disciplines);
}
