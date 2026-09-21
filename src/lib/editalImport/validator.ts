/**
 * validator.ts
 * Validador fail-closed para conteúdo programático de editais.
 * Detecta anomalias estruturais, outliers de tópicos/disciplinas e capítulos administrativos.
 */

import { ExtractedDiscipline, ProgrammaticSection, ProgrammaticValidationResult } from "./types";
import { removeAccents } from "./textNormalizer";

const ADMINISTRATIVE_DISCIPLINE_TERMS = [
  "CURSO DE FORMACAO",
  "MATRICULA",
  "BOLSA DE ESTUDO",
  "DISPOSICOES FINAIS",
  "DISPOSICOES GERAIS",
  "VAGAS RESERVADAS",
  "CANDIDATOS COM DEFICIENCIA",
  "DA REMUNERACAO",
  "DOS REQUISITOS",
  "DO REGIME JURIDICO",
  "CRONOGRAMA",
  "DOS RECURSOS",
  "DAS INSCRICOES",
  "DA TAXA DE INSCRICAO",
  "DA ISENCAO",
  "DAS ETAPAS",
  "TESTE DE APTIDAO FISICA",
  "AVALIACAO PSICOLOGICA",
  "EXAME BIOMEDICO",
  "INVESTIGACAO SOCIAL",
  "DA CLASSIFICACAO",
  "DA CONVOCACAO",
  "DA DOCUMENTACAO",
  "DOS RESULTADOS",
];

export function validateProgrammaticContent(
  disciplines: ExtractedDiscipline[],
  section?: ProgrammaticSection,
  totalPagesCount: number = 0
): ProgrammaticValidationResult {
  const reasons: string[] = [];
  let isOutlier = false;

  const totalDisciplines = disciplines.length;
  const totalTopics = disciplines.reduce((acc, d) => acc + (d.topics?.length || 0), 0);
  const avgTopics = totalDisciplines > 0 ? totalTopics / totalDisciplines : 0;

  // 1. Verificação de existência
  if (totalDisciplines === 0) {
    reasons.push("Nenhuma disciplina foi identificada.");
    return {
      valid: false,
      confidence: "low",
      reasons,
      totalDisciplines: 0,
      totalTopics: 0,
      avgTopicsPerDiscipline: 0,
      isOutlier: false,
    };
  }

  // 2. Verificação de capítulos administrativos infiltrados como disciplinas
  for (const disc of disciplines) {
    const norm = removeAccents(disc.name.toUpperCase());
    for (const adminTerm of ADMINISTRATIVE_DISCIPLINE_TERMS) {
      if (norm.includes(adminTerm)) {
        reasons.push(`Capítulo administrativo detectado indevidamente como disciplina: "${disc.name}"`);
      }
    }
  }

  // 3. Verificação de limites e outliers (ex: 556 tópicos ou 40 disciplinas)
  if (totalDisciplines > 30) {
    isOutlier = true;
    reasons.push(`Número excessivo de disciplinas (${totalDisciplines}), sugerindo leitura de seções não programáticas.`);
  }

  if (totalTopics > 350) {
    isOutlier = true;
    reasons.push(`Volume anômalo de tópicos (${totalTopics}). O padrão típico de conteúdo programático é de até 250 tópicos.`);
  }

  if (totalTopics === 0) {
    reasons.push("As disciplinas identificadas não contêm tópicos programáticos.");
  }

  // 4. Verificação de páginas da seção (se cobriu mais de 45% do edital completo)
  if (section && totalPagesCount >= 15) {
    const sectionPagesCount = section.endPage - section.startPage + 1;
    const ratio = sectionPagesCount / totalPagesCount;
    if (ratio > 0.45 && !section.isManualSelection) {
      reasons.push(`A seção detectada abrange ${sectionPagesCount} páginas (${Math.round(ratio * 100)}% do edital), indicando falta de delimitação de encerramento.`);
    }
  }

  // 5. Verificação da confiança da própria seção
  if (section && section.confidence === "low" && !section.isManualSelection) {
    reasons.push("A seção de conteúdo programático possui baixa pontuação de evidência estrutural.");
  }

  const valid = reasons.length === 0;
  const confidence = valid ? (totalTopics >= 10 && totalDisciplines >= 2 ? "high" : "medium") : "low";

  return {
    valid,
    confidence,
    reasons,
    totalDisciplines,
    totalTopics,
    avgTopicsPerDiscipline: Math.round(avgTopics * 10) / 10,
    detectedSectionPages: section ? { start: section.startPage, end: section.endPage } : undefined,
    isOutlier,
  };
}
