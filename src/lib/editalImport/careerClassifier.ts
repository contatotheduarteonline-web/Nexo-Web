/**
 * careerClassifier.ts
 * Motor determinístico de classificação de carreiras baseado em evidências documentais do edital.
 * Não utiliza IA generativa, chamadas externas ou APIs pagas.
 */

import { CareerClassification, CareerId, CareerTaxonomyItem } from "./types";
import { removeAccents } from "./textNormalizer";

export const CAREER_TAXONOMY: CareerTaxonomyItem[] = [
  {
    id: "policial",
    label: "Policial",
    description: "Carreiras de segurança pública, polícia e defesa",
    aliases: ["segurança pública", "policia", "policial", "militar", "seguranca"],
  },
  {
    id: "fiscal",
    label: "Fiscal",
    description: "Receita Federal, SEFAZ, ISS e auditoria fiscal",
    aliases: ["fiscal", "tributário", "receita", "tributaria"],
  },
  {
    id: "tribunais_mpu",
    label: "Tribunais & MPU",
    description: "STF, STJ, TST, TSE, TRFs, TRTs, TJs e MPU",
    aliases: ["tribunal", "tribunais", "judiciário", "mpu", "justiça"],
  },
  {
    id: "juridica",
    label: "Carreiras Jurídicas",
    description: "Magistratura, Ministério Público, Defensoria e Procuradorias",
    aliases: ["juridica", "juridico", "magistratura", "procuradoria", "defensoria"],
  },
  {
    id: "controle_gestao",
    label: "Controle & Gestão",
    description: "TCU, CGU, TCEs, TCMs e controladorias",
    aliases: ["controle", "gestão", "tcu", "cgu", "auditoria de controle"],
  },
  {
    id: "legislativa",
    label: "Legislativa",
    description: "Senado, Câmara dos Deputados e Assembleias Legislativas",
    aliases: ["legislativo", "legislativa", "senado", "câmara", "assembleia"],
  },
  {
    id: "administrativa",
    label: "Administrativa",
    description: "Prefeituras, Autarquias, Ministérios e administração geral",
    aliases: ["administrativo", "administrativa", "prefeitura", "autarquia"],
  },
  {
    id: "bancaria",
    label: "Bancária",
    description: "Banco do Brasil, Caixa, Banco Central e bancos públicos",
    aliases: ["bancário", "bancaria", "banco", "caixa"],
  },
  {
    id: "educacao",
    label: "Educação",
    description: "Professores, Pedagogia e Educação Básica/Superior",
    aliases: ["educação", "educacao", "professor", "docência", "magistério"],
  },
  {
    id: "saude",
    label: "Saúde",
    description: "Enfermagem, Medicina, SUS e EBSERH",
    aliases: ["saúde", "saude", "médico", "enfermeiro", "ebserh"],
  },
  {
    id: "diplomacia",
    label: "Diplomacia",
    description: "Instituto Rio Branco (CACD) e Ministério das Relações Exteriores",
    aliases: ["diplomacia", "diplomata", "itamaraty", "cacd", "chancelaria"],
  },
  {
    id: "outra",
    label: "Outra Área",
    description: "Áreas técnicas específicas ou gerais",
    aliases: ["geral", "outra", "outras"],
  },
];

interface CareerRule {
  careerId: CareerId;
  strongKeywords: string[];   // Peso 5: Termos unívocos (ex: 'polícia militar', 'receita federal')
  moderateKeywords: string[]; // Peso 2: Termos correlatos (ex: 'soldado', 'tributário')
  disciplinesKeywords: string[]; // Peso 3: Disciplinas típicas (ex: 'direito penal militar', 'auditoria')
}

const CAREER_RULES: CareerRule[] = [
  {
    careerId: "policial",
    strongKeywords: [
      "policia militar", "policia civil", "policia federal", "policia rodoviaria",
      "policia penal", "corpo de bombeiros", "guarda municipal", "seguranca publica",
      "depen", "pmerj", "pmsp", "pmba", "pmmg", "pmpr", "pmsc", "pmpa", "pmce", "pmdf",
      "pcsp", "pcrj", "pcmg", "pcba", "pcce", "pcmt", "prf", "dpf", "perito criminal",
      "delegado de policia", "agente de policia", "escrivao de policia", "papiloscopista",
      "soldado pm", "oficial pm", "bombeiro militar"
    ],
    moderateKeywords: [
      "policia", "policial", "militar", "seguranca", "soldado", "sargento", "cabo",
      "investigador", "penitenciario", "prisional", "armamento e tiro", "tiro defensivo",
      "defesa social"
    ],
    disciplinesKeywords: [
      "direito penal militar", "direito processual penal militar", "direito penal",
      "direito processual penal", "legislacao penal especial", "criminologia",
      "medicina legal", "legislacao de transito", "direitos humanos"
    ],
  },
  {
    careerId: "fiscal",
    strongKeywords: [
      "receita federal", "auditor fiscal", "analista tributario", "sefaz", "sefin",
      "secretaria de fazenda", "secretaria da fazenda", "secretaria de financas",
      "agente fiscal de rendas", "fisco estadual", "fisco municipal", "iss sao paulo",
      "iss rj", "iss bh", "tributacao estadual"
    ],
    moderateKeywords: [
      "fiscal", "auditor", "tributario", "tributaria", "arrecadacao", "contribuinte",
      "imposto", "icms", "iss", "iptu", "ipva", "irpf", "irpj", "auditoria contabil"
    ],
    disciplinesKeywords: [
      "direito tributario", "legislacao tributaria", "auditoria", "contabilidade geral",
      "contabilidade avancada", "contabilidade de custos", "comercio internacional",
      "legislacao aduaneira", "financas publicas"
    ],
  },
  {
    careerId: "tribunais_mpu",
    strongKeywords: [
      "tribunal de justica", "tribunal regional federal", "tribunal regional do trabalho",
      "tribunal regional eleitoral", "superior tribunal de justica", "supremo tribunal federal",
      "tribunal superior do trabalho", "ministerio publico da uniao", "mpu", "tjsp", "tjrj",
      "tjmg", "tjba", "tjpr", "tjrs", "trf1", "trf2", "trf3", "trf4", "trf5", "trf6",
      "trt1", "trt2", "trt3", "trt15", "analista judiciario", "tecnico judiciario", "oficial de justica"
    ],
    moderateKeywords: [
      "tribunal", "judiciario", "cartorio judicial", "vara judicial", "comarca", "judicatura",
      "serventuario da justica", "vara do trabalho"
    ],
    disciplinesKeywords: [
      "direito processual civil", "direito processual do trabalho", "direito do trabalho",
      "direito constitucional", "normas da corregedoria", "regimento interno"
    ],
  },
  {
    careerId: "juridica",
    strongKeywords: [
      "magistratura", "juiz de direito", "juiz federal", "juiz do trabalho", "juiz substituto",
      "promotor de justica", "procurador da republica", "procurador do estado", "procurador do municipio",
      "defensoria publica", "defensor publico", "agu", "advocacia geral da uniao", "dpu", "dpe",
      "pgm", "pge", "procuradoria geral"
    ],
    moderateKeywords: [
      "promotor", "procurador", "defensor", "magistrado", "carreira juridica", "membro do mp"
    ],
    disciplinesKeywords: [
      "direito civil", "direito empresarial", "direito internacional", "direito ambiental",
      "direito difuso e coletivo", "filosofia do direito", "sociologia juridica"
    ],
  },
  {
    careerId: "controle_gestao",
    strongKeywords: [
      "tribunal de contas", "tcu", "cgu", "controladoria geral", "auditor de controle externo",
      "analista de controle externo", "tecnico de controle", "auditoria governamental", "tce", "tcm",
      "tce-sp", "tce-rj", "tce-mg", "tce-ba", "tce-pr", "cgm"
    ],
    moderateKeywords: [
      "controle externo", "controle interno", "controladoria", "prestacao de contas", "lrf",
      "orcamento publico", "compliance publico"
    ],
    disciplinesKeywords: [
      "administracao financeira e orcamentaria", "afo", "auditoria governamental",
      "controle externo", "contabilidade publica", "analise de demonstracoes contabeis"
    ],
  },
  {
    careerId: "legislativa",
    strongKeywords: [
      "senado federal", "camara dos deputados", "assembleia legislativa", "camara municipal",
      "camara distrital", "alep", "alerj", "almg", "alesp", "consultor legislativo",
      "analista legislativo", "tecnico legislativo", "policia legislativa"
    ],
    moderateKeywords: [
      "legislativo", "legislativa", "parlamentar", "processo legislativo", "regimento comum"
    ],
    disciplinesKeywords: [
      "processo legislativo constitucional", "regimento interno", "ciencia politica"
    ],
  },
  {
    careerId: "administrativa",
    strongKeywords: [
      "prefeitura municipal", "secretaria de administracao", "autarquia", "inss", "ibama",
      "incra", "ibge", "anvisa", "anatel", "anac", "antt", "assistente em administracao",
      "agente administrativo", "tecnico em administracao", "secretaria municipal"
    ],
    moderateKeywords: [
      "administrativo", "administracao", "prefeitura", "servicos gerais", "atendimento",
      "gestao publica"
    ],
    disciplinesKeywords: [
      "nocao de administracao publica", "gestao de pessoas", "arquivologia", "redacao oficial",
      "lei 8.112", "recursos materiais"
    ],
  },
  {
    careerId: "bancaria",
    strongKeywords: [
      "banco do brasil", "caixa economica federal", "banco central do brasil", "bacen",
      "banco do nordeste", "bnb", "banrisul", "banco da amazonia", "basa", "escriturario",
      "tecnico bancario"
    ],
    moderateKeywords: [
      "banco", "bancario", "bancaria", "credito bancario", "operacoes bancarias", "fintech"
    ],
    disciplinesKeywords: [
      "conhecimentos bancarios", "atendimento bancario", "vendas e negociacao",
      "mercado de capitais", "sistema financeiro nacional"
    ],
  },
  {
    careerId: "educacao",
    strongKeywords: [
      "secretaria de educacao", "seduc", "sme", "instituto federal", "universidade federal",
      "universidade estadual", "professor de educacao basica", "professor de ensino fundamental",
      "professor de ensino medio", "pedagogo", "coordenador pedagogico", "magisterio"
    ],
    moderateKeywords: [
      "educacao", "escola", "docente", "professor", "ensino", "didatica"
    ],
    disciplinesKeywords: [
      "conhecimentos pedagogicos", "legislacao educacional", "ldb", "didatica", "bncc"
    ],
  },
  {
    careerId: "saude",
    strongKeywords: [
      "secretaria de saude", "sesap", "sms", "ebserh", "sus", "sistema unico de saude",
      "hospital universitario", "tecnico de enfermagem", "enfermeiro", "medico",
      "fisioterapeuta", "nutricionista", "farmaceutico", "odontologo", "psicologo"
    ],
    moderateKeywords: [
      "saude", "hospital", "clinica", "atencao basica", "sanitaria", "epidemiologia"
    ],
    disciplinesKeywords: [
      "legislacao do sus", "saude publica", "enfermagem", "farmacologia", "biosseguranca"
    ],
  },
  {
    careerId: "diplomacia",
    strongKeywords: [
      "instituto rio branco", "cacd", "carreira diplomatica", "terceiro secretario",
      "diplomata", "itamaraty", "ministerio das relacoes exteriores", "mre"
    ],
    moderateKeywords: [
      "diplomacia", "consular", "chancelaria", "internacional"
    ],
    disciplinesKeywords: [
      "historia do brasil", "politica internacional", "geografia", "economia",
      "lingua inglesa", "lingua francesa", "lingua espanhola"
    ],
  },
];

export interface ClassifyInput {
  institution?: string;
  acronym?: string;
  title?: string;
  cargos?: string[];
  sampleText?: string;
  disciplines?: string[];
}

/**
 * Classifica determinística e deterministicamente a carreira do edital com pesos auditáveis.
 */
export function classifyEditalCareer(input: ClassifyInput): CareerClassification {
  const norm = (str?: string) => removeAccents((str || "").toLowerCase());

  const instText = norm(input.institution);
  const acrText = norm(input.acronym);
  const titleText = norm(input.title);
  const cargosText = norm((input.cargos || []).join(" "));
  const sampleText = norm(input.sampleText || "").slice(0, 80000); // 80k chars sample
  const discText = norm((input.disciplines || []).join(" "));

  const scores: Record<CareerId, { score: number; evidence: string[] }> = {
    policial: { score: 0, evidence: [] },
    fiscal: { score: 0, evidence: [] },
    tribunais_mpu: { score: 0, evidence: [] },
    juridica: { score: 0, evidence: [] },
    controle_gestao: { score: 0, evidence: [] },
    legislativa: { score: 0, evidence: [] },
    administrativa: { score: 0, evidence: [] },
    bancaria: { score: 0, evidence: [] },
    educacao: { score: 0, evidence: [] },
    saude: { score: 0, evidence: [] },
    diplomacia: { score: 0, evidence: [] },
    outra: { score: 0, evidence: [] },
  };

  for (const rule of CAREER_RULES) {
    const cid = rule.careerId;

    // 1. Strong keywords
    for (const kw of rule.strongKeywords) {
      const kwNorm = norm(kw);
      const reg = new RegExp(`\\b${kwNorm}\\b`, "i");

      // In institution or acronym (weight 7)
      if (reg.test(instText) || reg.test(acrText)) {
        scores[cid].score += 7;
        scores[cid].evidence.push(`Órgão/Sigla: "${kw}"`);
      }
      // In title or cargos (weight 5)
      else if (reg.test(titleText) || reg.test(cargosText)) {
        scores[cid].score += 5;
        scores[cid].evidence.push(`Título/Cargo: "${kw}"`);
      }
      // In general text (weight 2)
      else if (reg.test(sampleText)) {
        scores[cid].score += 2;
        if (scores[cid].evidence.length < 4) {
          scores[cid].evidence.push(`Texto do edital: "${kw}"`);
        }
      }
    }

    // 2. Moderate keywords
    for (const kw of rule.moderateKeywords) {
      const kwNorm = norm(kw);
      const reg = new RegExp(`\\b${kwNorm}\\b`, "i");

      if (reg.test(instText) || reg.test(titleText) || reg.test(cargosText)) {
        scores[cid].score += 2;
        if (scores[cid].evidence.length < 5) {
          scores[cid].evidence.push(`Termo: "${kw}"`);
        }
      } else if (reg.test(sampleText)) {
        scores[cid].score += 0.5;
      }
    }

    // 3. Disciplines keywords
    for (const kw of rule.disciplinesKeywords) {
      const kwNorm = norm(kw);
      const reg = new RegExp(`\\b${kwNorm}\\b`, "i");
      if (reg.test(discText)) {
        scores[cid].score += 3;
        scores[cid].evidence.push(`Disciplina: "${kw}"`);
      }
    }
  }

  // Ordena pontuações
  const sorted = Object.entries(scores)
    .map(([id, data]) => ({ id: id as CareerId, score: data.score, evidence: Array.from(new Set(data.evidence)) }))
    .sort((a, b) => b.score - a.score);

  const best = sorted[0];
  const second = sorted[1];

  // Se pontuação insuficiente para qualquer carreira específica
  if (!best || best.score < 2) {
    return {
      careerId: "outra",
      confidence: "low",
      evidence: ["Informações insuficientes para classificação automática"],
    };
  }

  // Define nível de confiança
  let confidence: "high" | "medium" | "low" = "low";
  const diff = best.score - (second ? second.score : 0);

  if (best.score >= 8 && diff >= 4) {
    confidence = "high";
  } else if (best.score >= 4 && diff >= 2) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    careerId: best.id,
    confidence,
    evidence: best.evidence.slice(0, 4),
  };
}

export function getCareerById(careerId: string): CareerTaxonomyItem {
  const found = CAREER_TAXONOMY.find((c) => c.id === careerId);
  return (
    found || {
      id: "outra",
      label: "Outra Área",
      description: "Áreas técnicas específicas ou gerais",
      aliases: [],
    }
  );
}

/**
 * Converte labels antigas da UI (ex: "Policial", "Tribunais") para CareerId estável
 */
export function mapLegacyAreaToCareerId(areaStr?: string): CareerId {
  if (!areaStr) return "outra";
  const norm = removeAccents(areaStr.toLowerCase().trim());
  if (norm.includes("polic") || norm.includes("militar") || norm.includes("seguranca")) return "policial";
  if (norm.includes("fisc") || norm.includes("receita") || norm.includes("tribut")) return "fiscal";
  if (norm.includes("tribuna") || norm.includes("mpu") || norm.includes("judici")) return "tribunais_mpu";
  if (norm.includes("jurid") || norm.includes("magistratura") || norm.includes("defensor") || norm.includes("procurad")) return "juridica";
  if (norm.includes("control") || norm.includes("tcu") || norm.includes("cgu") || norm.includes("gestao")) return "controle_gestao";
  if (norm.includes("legislat") || norm.includes("senado") || norm.includes("camara")) return "legislativa";
  if (norm.includes("admin") || norm.includes("prefeit")) return "administrativa";
  if (norm.includes("banc") || norm.includes("caixa")) return "bancaria";
  if (norm.includes("educ") || norm.includes("profess") || norm.includes("docen")) return "educacao";
  if (norm.includes("saud") || norm.includes("medic") || norm.includes("enferm")) return "saude";
  if (norm.includes("diplo") || norm.includes("itamaraty") || norm.includes("cacd")) return "diplomacia";
  return "outra";
}
