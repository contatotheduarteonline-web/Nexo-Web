export type PriorityLevel = "alta" | "media" | "baixa";
export type DifficultyLevel = "facil" | "medio" | "dificil";
export type TopicStatus = "nao_iniciado" | "em_estudo" | "concluido";
export type StudyModality = "Teoria" | "Questões" | "Revisão" | "Videoaula" | "Lei Seca" | "Simulado";
export type ReviewInterval = "24h" | "7d" | "14d" | "15d" | "30d" | "60d" | "1d" | string;
export type PlanCategory =
  | "Concurso Público"
  | "Concurso Policial"
  | "Concurso Militar"
  | "Tribunais"
  | "Fiscal e Controle"
  | "Administrativo"
  | "Bancário"
  | "Educação"
  | "Saúde"
  | "Jurídico"
  | "Inteligência"
  | "Legislativo"
  | "ENEM"
  | "Vestibular"
  | "OAB"
  | "Residência"
  | "Plano personalizado"
  | "Outro";

export type PlanOrganization = "ciclo" | "semanal";
export type PlanningMode = "CYCLE" | "WEEKLY";
export type PlanCreationMethod = "automatico" | "manual";

export type UserRole = "admin" | "aluno_vip" | "aluno";

export interface UserOnboardingState {
  completed: boolean;
  currentStep: number;
  version: number;
  startedAt?: string;
  completedAt?: string | null;
  draft?: any;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  loginMethod: "google" | "email";
  role?: UserRole;
  createdAt: string;
  lastLoginAt?: string;
  onboarding?: UserOnboardingState;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  onboardingStep?: number;
  onboardingData?: any;
}

export interface OnboardingData {
  area?: string;
  concursoName?: string;
  cargoName?: string;
  organName?: string;
  bancaName?: string;
  examDateType?: "definida" | "previsao" | "sem_data";
  examDate?: any;
  preparationLevel?: "iniciante" | "intermediario" | "avancado";
  routineType?: "integral" | "escala" | "exclusivo";
  weeklyGoalHours?: number;
  dailyAvailability?: {
    seg: number;
    ter: number;
    qua: number;
    qui: number;
    sex: number;
    sab: number;
    dom: number;
  };
  organizationType?: "ciclo" | "semanal";
  disciplines?: any[];
  objective?: any;
  routine?: any;
  availability?: any;
  organization?: any;
}

export interface PlanTemplateDiscipline {
  id: string;
  name: string;
  color: string;
  iconName: string;
  priority: PriorityLevel;
  difficulty: DifficultyLevel;
  weight: number;
  targetHours?: number;
}

export interface PlanTemplateTopic {
  id: string;
  disciplineId: string;
  name: string;
  subtopics: string[];
  priority?: PriorityLevel;
  difficulty?: DifficultyLevel;
}

export interface PlanTemplate {
  id: string;
  title: string;
  organ: string;
  banca: string;
  cargo?: string;
  year: number;
  region?: "Norte" | "Nordeste" | "Centro-Oeste" | "Sul" | "Sudeste" | "Federal" | string;
  category?: PlanCategory;
  examDate?: string;
  vacanciesCount?: number;
  sourceFileName?: string;
  description?: string;
  disciplines: PlanTemplateDiscipline[];
  topics: PlanTemplateTopic[];
  createdAt: string;
  clonesCount?: number;
  isOfficial?: boolean;
  logoUrl?: string;
  officialSourceUrl?: string;
  verified?: boolean;
}

// === CATÁLOGO OFICIAL PERMANENTE DE EDITAIS DO NEXO ===
export type CatalogEditalStatus = "draft" | "pending_review" | "published" | "archived";

export interface CatalogEdital {
  id: string;
  title: string;
  institution: string;
  acronym: string;
  state: string;
  uf?: string;
  year: number;
  careerId?: string;
  objectiveType?: string;
  editalNumber: string;
  board: string;
  publicationDate: string;
  sourceFileName: string;
  sourceType: string;
  sourceHash: string;
  normalizedIdentity?: string;
  logoUrl?: string;
  /** Imagem (dataUrl comprimida) publicada junto com o edital no catálogo oficial. */
  logoDataUrl?: string;
  cargoPretendido?: string;
  imagemTipo?: "logo_oficial";
  dadosVerificados?: boolean;
  status: CatalogEditalStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  validatedBy?: string;
  description?: string;
  cargosCount?: number;
}

export interface CatalogCargo {
  id: string;
  name: string;
  level: string;
  vacancies: number | string;
  order: number;
}

export interface CatalogDiscipline {
  id: string;
  name: string;
  order: number;
  group?: string;
  questionCount?: number;
  weight?: number;
}

export interface CatalogTopic {
  id: string;
  title: string;
  order: number;
  sourceReference?: string;
}

export type EditalSubmissionStatus = "pending" | "under_review" | "approved" | "rejected";

export interface EditalSubmission {
  id: string;
  userId: string;
  submittedAt: string;
  status: EditalSubmissionStatus;
  sourceFileName: string;
  sourceHash: string;
  personalEditalId?: string;
  linkedCatalogEditalId?: string;
  notes?: string;
}

// === NOVO CATÁLOGO DE EDITAIS REAIS E OFICIAIS ===
export interface EditalTopicModel {
  id: string;
  disciplineId: string;
  parentId?: string | null;
  title: string;
  order: number;
  level: number;
  children?: EditalTopicModel[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EditalDisciplineModel {
  id: string;
  templateId: string;
  name: string;
  order: number;
  weight: number;
  topics: EditalTopicModel[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EditalTemplateModel {
  id: string;
  slug: string;
  orgao: string;
  sigla?: string | null;
  cargo: string;
  esfera: "Federal" | "Estadual" | "Municipal" | "Distrital" | string;
  banca: string;
  ano: number;
  editalNumero?: string | null;
  logoUrl?: string | null;
  logoSourceUrl?: string | null;
  officialSourceUrl?: string | null;
  verified: boolean;
  verifiedAt?: string | null;
  sourceVersion?: string | null;
  description?: string | null;
  category: string; // "seguranca_publica" | "tribunais" | "fiscal" | "controle" | "administrativo" | "bancario" | "legislativo" | "juridico"
  active: boolean;
  disciplines: EditalDisciplineModel[];
  totalTopicsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EditalTemplateAuditChecklist {
  orgaoCorreto: boolean;
  cargoCorreto: boolean;
  esferaCorreta: boolean;
  bancaCorreta: boolean;
  logoOficial: boolean;
  fonteOficialLocalizada: boolean;
  disciplinasCompletas: boolean;
  topicosCompletos: boolean;
  hierarquiaPreservada: boolean;
  editalAnoCorreto: boolean;
}

export interface Topic {
  id: string;
  disciplineId: string;
  parentId?: string; // Para subtópicos hierárquicos
  name: string;
  subtopics: string[];
  status?: TopicStatus; // "nao_iniciado" | "em_estudo" | "concluido"
  isStudied: boolean; // Teoria concluída
  isReviewed: boolean; // Revisão feita
  reviewCount: number; // Quantas vezes revisou
  questionsDone: number;
  questionsCorrect: number;
  accuracyRate: number; // % acertos
  masteryRate: number; // Domínio 0..100%
  notes?: string;
  lastStudiedAt?: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  totalStudyMinutes?: number;
  sessionCount?: number;
  priority?: PriorityLevel;
  difficulty?: DifficultyLevel;
}

export interface Discipline {
  id: string;
  editalId: string;
  name: string;
  color: string;
  iconName: string;
  priority?: PriorityLevel;
  difficulty?: DifficultyLevel;
  weight: number; // 1, 2, 3
  importance?: number; // 1 a 5
  knowledgeLevel?: number; // 1 a 5
  calculatedPriorityPercentage?: number; // % normalizada
  targetHours?: number;
  studiedHours?: number;
}

export interface Edital {
  id: string;
  userId?: string;
  title: string;
  organ: string;
  banca: string;
  cargo?: string;
  year: number;
  region?: "Norte" | "Nordeste" | "Centro-Oeste" | "Sul" | "Sudeste" | "Federal";
  state?: string;
  category?: PlanCategory;
  publicationDate?: string;
  examDate?: string;
  vacanciesCount?: number;
  pdfUrl?: string;
  pdfFileName?: string;
  linkUrl?: string;
  imageUrl?: string;
  imagePath?: string;
  notes?: string;
  isArchived?: boolean;
  disciplines: Discipline[];
  topics: Topic[];
  isCustom?: boolean;
  careerId?: string;
  sourceHash?: string;
  normalizedIdentity?: string;
  sourceEditalId?: string;
  sourceCargoId?: string;
  sourceEditalVersion?: number;
  createdAt: string;
}

export interface CycleStep {
  id: string;
  disciplineId: string;
  targetMinutes: number;
  order: number;
  importance?: number;
  knowledgeLevel?: number;
  weightPercentage?: number;
}

export interface WeeklyScheduleBlock {
  id: string;
  day: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
  disciplineId: string;
  targetMinutes: number;
  topicId?: string;
  order: number;
  notes?: string;
}

export interface DisciplinePriorityConfig {
  disciplineId: string;
  importance: number; // 1..5
  knowledge: number; // 1..5
  score: number; // score = importance * (6 - knowledge)
  calculatedPercentage: number;
  manualPercentage?: number;
}

export interface StudyPlan {
  id: string;
  userId?: string;
  name: string;
  editalId: string;
  category?: PlanCategory;
  planningMode?: PlanningMode; // "CYCLE" ou "WEEKLY"
  creationMethod?: PlanCreationMethod; // "automatico" ou "manual"
  organizationType: PlanOrganization; // "ciclo" ou "semanal"
  image_path?: string | null;
  imageUrl?: string;
  hasCustomImage?: boolean;
  imageRef?: string;
  organ?: string;
  cargo?: string;
  banca?: string;
  examDate?: string;
  vacanciesCount?: number;
  notes?: string;
  isArchived?: boolean;
  weeklyGoalHours: number;
  minSessionMinutes: number; // Ex: 30
  maxSessionMinutes: number; // Ex: 90
  dailyAvailability: {
    seg: number;
    ter: number;
    qua: number;
    qui: number;
    sex: number;
    sab: number;
    dom: number;
  };
  cycle: CycleStep[];
  weeklySchedule?: WeeklyScheduleBlock[];
  currentCycleIndex: number;
  currentStepElapsedMinutes: number;
  completedCycles: number; // Quantos ciclos foram finalizados
  disciplinePriorities?: Record<string, DisciplinePriorityConfig>;
  active: boolean;
  sourceEditalId?: string;
  sourceEditalType?: "catalog" | "personal" | "manual";
  sourceEditalVersion?: number;
  sourceCargoId?: string;
  updateAvailable?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StudySession {
  id: string;
  userId?: string;
  planId?: string;
  planName?: string;
  cargo?: string;
  cargoId?: string;
  editalId: string;
  disciplineId: string;
  disciplineName: string;
  topicId?: string;
  topicName?: string;
  planningBlockId?: string;
  date: string; // ISO String
  studyDate?: string; // YYYY-MM-DD
  createdAt?: string; // ISO String
  durationMinutes: number;
  modality: StudyModality;
  questionsDone: number;
  questionsCorrect: number;
  notes: string;
  material?: string;
  pagesStart?: number;
  pagesEnd?: number;
  videoTitle?: string;
  videoStart?: string;
  videoEnd?: string;
  theoryCompleted?: boolean;
  reviewsScheduled?: number;
  createdReviewsCount?: number;
  reviewDates?: string[];
}

export interface ScheduledReview {
  id: string;
  userId?: string;
  planId?: string;
  planName?: string;
  cargo?: string;
  cargoId?: string;
  editalId: string;
  disciplineId: string;
  disciplineName: string;
  topicId: string;
  topicName: string;
  sessionId?: string;
  originalSessionId?: string;
  stage: ReviewInterval;
  intervalDays?: number;
  dueDate: string; // YYYY-MM-DD
  status?: "Pendente" | "Concluída" | "Atrasada";
  completed: boolean;
  completedAt?: string;
  notes?: string;
  durationMinutes?: number;
  questionsDone?: number;
  questionsCorrect?: number;
  reviewMethod?: "Resumo" | "Flashcards" | "Questões" | "Lei Seca" | "Mapa Mental" | "Videoaula" | "Outro";
  retentionLevel?: "errei" | "dificil" | "bom" | "facil";
  createdAt?: string;
}

export interface SimuladoDisciplineResult {
  disciplineId: string;
  disciplineName: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracyRate: number;
}

export interface Simulado {
  id: string;
  userId?: string;
  editalId: string;
  title: string;
  date: string;
  durationMinutes: number;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  overallScorePercentage: number;
  targetScorePercentage: number;
  resultsByDiscipline: SimuladoDisciplineResult[];
  notes: string;
}

export interface WeakTopicItem {
  disciplineId: string;
  disciplineName: string;
  topicId: string;
  topicName: string;
  questionsDone: number;
  questionsCorrect: number;
  accuracyRate: number;
  masteryRate: number;
  priority: PriorityLevel;
}

export interface ActiveTimerState {
  isRunning: boolean;
  mode: "stopwatch" | "pomodoro";
  elapsedSeconds: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  isBreak: boolean;
  planId?: string;
  editalId: string;
  cargo?: string;
  disciplineId: string;
  disciplineName?: string;
  topicId: string;
  topicName?: string;
  targetMinutes?: number;
  planningBlockId?: string;
  modality: StudyModality;
  questionsDone: number;
  questionsCorrect: number;
  notes: string;
  startedAt?: number;
}

export interface Reminder {
  id: string;
  userId?: string;
  title: string;
  category: "INSCRICOES" | "PROVAS" | "PAGAMENTOS" | "GERAL";
  date: string; // YYYY-MM-DD
  completed: boolean;
  isCompleted?: boolean;
  editalId?: string;
  notes?: string;
}

export interface UserSettings {
  userId?: string;
  name: string;
  email: string;
  userName?: string;
  userEmail?: string;
  targetRole?: string;
  dailyGoalHours: number;
  weeklyGoalQuestions: number;
  weeklyQuestionsGoal?: number;
  weeklyGoalHours: number;
  reviewIntervals: string[];
  reviewIntervalsDays?: number[] | string[];
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
}

export type ActiveTab =
  | "dashboard"
  | "planos"
  | "disciplinas"
  | "edital"
  | "edital_verticalizado"
  | "planejamento"
  | "ciclo"
  | "quadro_semanal"
  | "cronometro"
  | "revisoes"
  | "historico"
  | "estatisticas"
  | "diagnostico"
  | "simulados"
  | "metas"
  | "medalhas"
  | "lembretes"
  | "configuracoes";

export type GamificationToastType =
  | "rank_up"
  | "xp_milestone"
  | "badge_unlock"
  | "discipline_completed"
  | "streak_milestone"
  | "success"
  | "error"
  | "info";

export interface GamificationToastData {
  id: string;
  type: GamificationToastType;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  xpBonus?: number;
  badgeStyle?: string;
  timestamp: number;
}

export interface DailyBackupItem {
  id: string;
  userId: string;
  dateKey: string; // YYYY-MM-DD
  createdAt: string; // ISO
  auto: boolean;
  fileSizeKb: number;
  summary: {
    editaisCount: number;
    studyPlansCount: number;
    studySessionsCount: number;
    totalHours: number;
    totalQuestions: number;
    simuladosCount: number;
    activeEditalName?: string;
  };
  data?: any;
}


