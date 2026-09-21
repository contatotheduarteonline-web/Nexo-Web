export type CareerId =
  | "policial"
  | "fiscal"
  | "tribunais_mpu"
  | "juridica"
  | "controle_gestao"
  | "legislativa"
  | "administrativa"
  | "bancaria"
  | "educacao"
  | "saude"
  | "diplomacia"
  | "outra";

export type CareerConfidence = "high" | "medium" | "low";

export interface CareerClassification {
  careerId: CareerId;
  confidence: CareerConfidence;
  evidence: string[];
}

export interface CareerTaxonomyItem {
  id: CareerId;
  label: string;
  description: string;
  aliases: string[];
}

export interface PageText {
  pageNumber: number;
  text: string;
}

export type SectionType = "programmatic_content" | "cargos" | "general" | "other";

export interface DetectedSection {
  title: string;
  normalizedTitle: string;
  pageStart: number;
  pageEnd: number;
  type: SectionType;
  text: string;
}

export interface ExtractedTopic {
  id: string;
  title: string;
  order: number;
  sourcePage?: number;
  sourceReference?: string;
  sourceText?: string;
  subtopics?: string[];
}

export interface ExtractedDiscipline {
  id: string;
  name: string;
  order: number;
  group?: string; // Bloco/Módulo intermediário (ex: Conhecimentos Básicos, Específicos)
  topics: ExtractedTopic[];
  sourcePage?: number;
  sourceReference?: string;
  sourceText?: string;
  weight?: number;
  color?: string;
}

export interface DetectedCargo {
  id: string;
  name: string;
  normalizedName: string;
  pageNumber?: number;
  disciplines: ExtractedDiscipline[];
  vacancies?: number;
  level?: "superior" | "medio" | "fundamental";
}

export interface ProgrammaticSection {
  startPage: number;
  endPage: number;
  startOffset?: number;
  endOffset?: number;
  heading: string;
  confidence: "high" | "medium" | "low";
  score: number;
  extractedText: string;
  isManualSelection?: boolean;
}

export interface ProgrammaticValidationResult {
  valid: boolean;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  totalDisciplines: number;
  totalTopics: number;
  avgTopicsPerDiscipline: number;
  detectedSectionPages?: { start: number; end: number };
  isOutlier: boolean;
}

export interface ParsedEditalData {
  title?: string;
  institution?: string;
  acronym?: string;
  uf?: string;
  board?: string;
  year?: number;
  editalNumber?: string;
  publicationDate?: string;
  sourceFileName: string;
  sourceFileSize: number;
  sourceHash: string;
  normalizedIdentity: string;
  career: CareerClassification;
  cargos: DetectedCargo[];
  pagesCount: number;
  rawSectionsCount: number;
  programmaticSection?: ProgrammaticSection;
  validation?: ProgrammaticValidationResult;
  allPages?: PageText[];
}

export type ImportProgressState =
  | "idle"
  | "reading"
  | "detecting_structure"
  | "organizing_content"
  | "ready"
  | "error";

export interface ImportProgressUpdate {
  state: ImportProgressState;
  label: string;
  current?: number;
  total?: number;
  detail?: string;
}
