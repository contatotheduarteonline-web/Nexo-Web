export type ObjectiveType =
  | "Concurso Público"
  | "OAB"
  | "ENEM"
  | "Vestibular"
  | "Certificação"
  | "Outro";

export type ConcursoArea =
  | "Policial"
  | "Militar"
  | "Fiscal"
  | "Tribunais"
  | "Jurídica"
  | "Administrativa"
  | "Controle"
  | "Educação"
  | "Saúde"
  | "Bancária"
  | "Legislativa"
  | "Outra"
  | "Ainda não decidi";

export type PreparationMoment =
  | "Estou começando agora"
  | "Já estudo algumas matérias"
  | "Já tenho uma preparação avançada";

export type RoutineType =
  | "Trabalho em período integral"
  | "Trabalho ou estudo meio período"
  | "Estudo em período integral"
  | "Minha rotina varia"
  | "Prefiro informar apenas meus horários";

export type KnowledgeLevel =
  | "nunca_estudei"
  | "pouco"
  | "intermediario"
  | "bom"
  | "muito_bom";

export type OrganizationPreference =
  | "ciclo"
  | "semanal"
  | "indeciso";

export type StartDateOption =
  | "hoje"
  | "amanha"
  | "custom";

export interface DayAvailability {
  enabled: boolean;
  hours: number; // 0 to 12
  minutes: number; // 0, 15, 30, 45
}

export interface WeeklyAvailability {
  seg: DayAvailability;
  ter: DayAvailability;
  qua: DayAvailability;
  qui: DayAvailability;
  sex: DayAvailability;
  sab: DayAvailability;
  dom: DayAvailability;
}

export interface DisciplineDraftItem {
  id: string;
  name: string;
  knowledgeLevel?: KnowledgeLevel;
}

export interface OnboardingDraft {
  objective?: ObjectiveType;
  area?: ConcursoArea;
  knowsSpecificGoal?: boolean; // true: Sim, já sei / false: Ainda estou decidindo
  organ?: string;
  cargo?: string;
  banca?: string;
  knowsExamDate?: boolean; // true: Sim / false: Ainda não
  examDate?: string; // YYYY-MM-DD
  preparationMoment?: PreparationMoment;
  routineType?: RoutineType;
  availability?: WeeklyAvailability;
  disciplinesMode?: "adicionar" | "nao_sei";
  disciplines?: DisciplineDraftItem[];
  organization?: OrganizationPreference;
  startDateOption?: StartDateOption;
  customStartDate?: string; // YYYY-MM-DD
}
