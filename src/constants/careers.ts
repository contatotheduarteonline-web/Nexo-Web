import {
  Award,
  BookOpen,
  GraduationCap,
  Layers,
  Scale,
  Shield,
  Sparkles,
  Stethoscope,
} from "lucide-react";

/**
 * Áreas de carreira disponíveis na seleção do plano.
 * Exportado em arquivo próprio (não no componente) para não quebrar o
 * React Fast Refresh do Vite no CreatePlanWizardModal.
 */
export const CAREER_OPTIONS = [
  { id: "policial", title: "Policial", description: "Segurança pública, PF, PRF, PC, PM e Penal", icon: Shield },
  { id: "fiscal", title: "Fiscal", description: "Receita Federal, SEFAZ e ISS", icon: Award },
  { id: "tribunais_mpu", title: "Tribunais & MPU", description: "STF, STJ, TST, TSE, TRFs, TRTs e MPU", icon: Scale },
  { id: "juridica", title: "Carreiras Jurídicas", description: "Magistratura, Ministério Público e Defensoria", icon: Scale },
  { id: "controle_gestao", title: "Controle & Gestão", description: "TCU, CGU, TCEs e TCMs", icon: Layers },
  { id: "legislativa", title: "Legislativa", description: "Senado, Câmara dos Deputados e Assembleias", icon: BookOpen },
  { id: "administrativa", title: "Administrativa", description: "Prefeituras, Autarquias e Ministérios", icon: Layers },
  { id: "bancaria", title: "Bancária", description: "Banco do Brasil, Caixa e Banco Central", icon: Award },
  { id: "educacao", title: "Educação", description: "Professores, Pedagogia e Técnicos", icon: GraduationCap },
  { id: "saude", title: "Saúde", description: "Enfermagem, Medicina, SUS e EBSERH", icon: Stethoscope },
  { id: "diplomacia", title: "Diplomacia", description: "Instituto Rio Branco (CACD)", icon: Sparkles },
  { id: "outra", title: "Outra Área", description: "Áreas técnicas específicas ou gerais", icon: Sparkles },
];
