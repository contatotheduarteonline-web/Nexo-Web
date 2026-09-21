import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  Edital,
  Discipline,
  Topic,
  StudyPlan,
  PlanOrganization,
  PlanCategory,
  PlanTemplate,
  PlanTemplateDiscipline,
  PlanTemplateTopic,
  WeeklyScheduleBlock,
  StudySession,
  ScheduledReview,
  Simulado,
  ActiveTimerState,
  StudyModality,
  ActiveTab,
  WeakTopicItem,
  ReviewInterval,
  Reminder,
  UserSettings,
  DailyBackupItem,
  CatalogEdital,
  CatalogCargo,
  PlanningMode,
} from "../types";
import {
  INITIAL_EDITAIS,
  INITIAL_STUDY_PLANS,
  INITIAL_STUDY_SESSIONS,
  INITIAL_SCHEDULED_REVIEWS,
  INITIAL_SIMULADOS,
  INITIAL_REMINDERS,
  INITIAL_USER_SETTINGS,
} from "../data/seedData";

import { SEED_TEMPLATES } from "../data/seedTemplates";
import {
  saveEditalToFirestore,
  deleteEditalFromFirestore,
  subscribeEditaisFromFirestore,
  saveStudyPlanToFirestore,
  deleteStudyPlanFromFirestore,
  subscribeStudyPlansFromFirestore,
  saveStudySessionToFirestore,
  deleteStudySessionFromFirestore,
  deleteMultipleStudySessionsFromFirestore,
  subscribeStudySessionsFromFirestore,
  saveScheduledReviewToFirestore,
  deleteScheduledReviewFromFirestore,
  subscribeScheduledReviewsFromFirestore,
  saveSimuladoToFirestore,
  deleteSimuladoFromFirestore,
  subscribeSimuladosFromFirestore,
  saveReminderToFirestore,
  deleteReminderFromFirestore,
  subscribeRemindersFromFirestore,
  saveUserSettingsToFirestore,
  subscribeUserSettingsFromFirestore,
  migrateLocalDataToFirestore,
  purgeOrphanOrArtificialEditais,
} from "../lib/firestoreService";
import {
  getPublishedEditais,
  subscribePublishedEditais,
  getEditalById,
  getFullCargoStructure,
  checkForPlanEditalUpdate,
} from "../lib/catalogEditalService";
import { auth } from "../lib/firebase";
import {
  fetchPlanImageFromFirestore,
  deletePlanImageFromFirestore,
  getCachedPlanImage,
  setCachedPlanImage,
  migrateLegacyPlanImage,
} from "../utils/planImageStorage";

// Helper function to normalize both database EditalTemplateModel and PlanTemplate formats
function mapEditalModelToPlanTemplate(t: any): PlanTemplate {
  const colors = ["#F59E0B", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981", "#06B6D4", "#EC4899", "#6366F1", "#14B8A6", "#84CC16", "#F59E0B"];
  
  if (t.organ && Array.isArray(t.topics) && t.topics.length > 0 && t.topics[0].disciplineId) {
    return t as PlanTemplate;
  }

  const disciplines: PlanTemplateDiscipline[] = (t.disciplines || []).map((d: any, idx: number) => ({
    id: d.id || `disc-${t.id}-${idx + 1}`,
    name: d.name,
    color: d.color || colors[idx % colors.length],
    iconName: d.iconName || "BookOpen",
    priority: (d.weight >= 3 ? "alta" : d.weight === 2 ? "media" : "baixa") as any,
    difficulty: "medio" as any,
    weight: d.weight || 2,
    targetHours: d.targetHours || 30,
  }));

  const allTopics: PlanTemplateTopic[] = [];
  (t.disciplines || []).forEach((d: any) => {
    (d.topics || []).forEach((top: any) => {
      allTopics.push({
        id: top.id,
        disciplineId: d.id,
        name: top.title || top.name,
        subtopics: Array.isArray(top.subtopics) ? top.subtopics : [],
        priority: (d.weight >= 3 ? "alta" : "media") as any,
        difficulty: "medio" as any,
      });
    });
  });

  return {
    id: t.id,
    title: t.title || `${t.orgao} - ${t.cargo}`,
    organ: t.orgao || t.organ || "Órgão do Concurso",
    cargo: t.cargo,
    banca: t.banca,
    year: t.ano || t.year || new Date().getFullYear(),
    region: t.esfera || t.region || "Federal",
    category: "Concurso Público",
    description: t.description || t.sourceVersion,
    isOfficial: true,
    verified: true,
    logoUrl: t.logoUrl,
    officialSourceUrl: t.officialSourceUrl,
    disciplines,
    topics: allTopics,
    createdAt: t.createdAt || new Date().toISOString(),
    clonesCount: t.clonesCount || 1,
  };
}

export interface CompleteReviewOptions {
  notes?: string;
  durationMinutes?: number;
  questionsDone?: number;
  questionsCorrect?: number;
  reviewMethod?: "Resumo" | "Flashcards" | "Questões" | "Lei Seca" | "Mapa Mental" | "Videoaula" | "Outro";
  retentionLevel?: "errei" | "dificil" | "bom" | "facil";
  logAsSession?: boolean;
}

export interface FinishSessionOptions {
  planId?: string;
  editalId?: string;
  cargo?: string;
  disciplineId?: string;
  topicId?: string;
  modality?: StudyModality;
  durationMinutes?: number;
  questionsDone?: number;
  questionsCorrect?: number;
  notes?: string;
  selectedReviewDays?: number[];
  studyDate?: string; // YYYY-MM-DD
  theoryCompleted?: boolean;
  scheduleReviews?: boolean;
}

interface StudyContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;

  // Theme

  // User Settings
  userSettings: UserSettings;
  updateUserSettings: (updates: Partial<UserSettings>) => void;

  // Editais & Active Edital
  editais: Edital[];
  activeEditalId: string;
  activeEdital: Edital | undefined;
  setActiveEditalId: (id: string) => void;
  createEdital: (edital: Omit<Edital, "id" | "createdAt"> & { id?: string }) => Promise<Edital>;
  updateEdital: (id: string, updates: Partial<Edital>) => void;
  deleteEdital: (id: string) => void;

  // Disciplines & Topics
  addDiscipline: (discipline: Omit<Discipline, "id"> & { id?: string }) => Discipline;
  createDiscipline?: (discipline: Omit<Discipline, "id">) => void;
  updateDiscipline: (id: string, updates: Partial<Discipline>) => void;
  deleteDiscipline: (id: string) => void;
  addTopic: (topic: Omit<Topic, "id"> | string, name?: string) => void;
  createTopic?: (topic: Omit<Topic, "id"> | string, name?: string) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
  toggleTopicStudied: (topicId: string) => void;
  toggleTopicReviewed: (topicId: string) => void;
  importVerticalizedData: (editalTitle: string, organ: string, banca: string, disciplinesData: any[]) => void;
  importVerticalizedEdital?: (editalTitle: string, organ: string, banca: string, disciplinesData: any[]) => void;

  // Catálogo Oficial Permanente de Editais
  catalogEditais: CatalogEdital[];
  isLoadingCatalog: boolean;
  refreshCatalogEditais: () => Promise<CatalogEdital[]>;
  createStudyPlanFromCatalog: (params: {
    catalogEditalId: string;
    cargoId: string;
    planName?: string;
    weeklyGoalHours?: number;
    organizationType?: PlanOrganization;
    planningMode?: PlanningMode;
  }) => Promise<StudyPlan | null>;
  checkPlanForUpdates: (planId: string) => Promise<boolean>;

  // Plans & Cycle
  studyPlans: StudyPlan[];
  activePlan: StudyPlan | undefined;
  globalTemplates: PlanTemplate[];
  isLoadingTemplates: boolean;
  fetchGlobalTemplates: () => Promise<void>;
  saveTemplateToCatalog: (templateData: Omit<PlanTemplate, "id" | "createdAt" | "clonesCount">) => Promise<PlanTemplate | null>;
  cloneTemplateToPlan: (template: PlanTemplate, customName?: string, organizationType?: PlanOrganization) => Promise<StudyPlan>;
  setActivePlanId: (id: string) => void;
  createStudyPlan: (plan: Omit<StudyPlan, "id" | "createdAt"> & { id?: string }) => Promise<StudyPlan>;
  updateStudyPlan: (id: string, updates: Partial<StudyPlan>) => void;
  deleteStudyPlan: (id: string) => void;
  archiveStudyPlan: (id: string) => void;
  resetCycleProgress: (planId: string) => void;
  advanceCycleStep: () => void;
  updateWeeklySchedule: (planId: string, schedule: WeeklyScheduleBlock[]) => void;
  cloneCatalogEditalAsPlan: (editalId: string, planName?: string, organizationType?: PlanOrganization) => Promise<StudyPlan>;
  applyOnboardingPlan: (plan: any, edital: any) => void;

  // Plan Images (Firestore Subcollection + Zero-latency cache)
  planImages: Record<string, string>;
  getPlanImageUrl: (planId: string) => string | undefined;
  isPlanImageLoading: (planId: string) => boolean;
  setPlanImageCache: (planId: string, dataUrl: string | null) => void;
  refreshPlanImage: (planId: string) => Promise<string | null>;

  // Study Sessions & History Deletion
  studySessions: StudySession[];
  logStudySession: (session: Omit<StudySession, "id">) => void;
  deleteStudySession: (id: string) => Promise<void>;
  deleteSelectedStudySessions: (ids: string[]) => Promise<void> | void;
  clearAllStudySessions: () => Promise<void> | void;

  // Reviews
  scheduledReviews: ScheduledReview[];
  completeScheduledReview: (reviewId: string, options?: CompleteReviewOptions) => void;
  createScheduledReview: (topicId: string, stage: ReviewInterval, customDueDate?: string) => void;
  rescheduleReview: (reviewId: string, newDueDate: string, stage?: ReviewInterval) => void;
  deleteScheduledReview: (reviewId: string) => void;
  updateScheduledReview: (reviewId: string, updates: Partial<ScheduledReview>) => void;
  batchRescheduleOverdueReviews: (newDueDate?: string) => void;
  clearAllScheduledReviews: () => void;
  pendingReviewsToday: ScheduledReview[];
  overdueReviews: ScheduledReview[];
  pendingReviewsCount: number;

  // Reminders
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, "id">) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  clearAllReminders: () => void;

  // Simulados
  simulados: Simulado[];
  addSimulado: (simulado: Omit<Simulado, "id">) => void;
  deleteSimulado: (id: string) => void;
  clearAllSimulados: () => void;

  // Global Active Timer
  timer: ActiveTimerState;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimerConfig: (config: Partial<ActiveTimerState>) => void;
  finishCurrentSession: (
    options?: FinishSessionOptions
  ) => Promise<{ session: StudySession; reviews: ScheduledReview[] }>;
  launchStudySessionForTopic: (disciplineId: string, topicId?: string, modality?: StudyModality) => void;

  // Derived Metrics & Analytics
  metrics: {
    hoursToday: number;
    hoursThisWeek: number;
    totalHoursStudied?: number;
    totalStudiedMinutes: number;
    totalStudiedHoursFormatted: string;
    weeklyGoalHours: number;
    weeklyGoalPercentage: number;
    disciplinesStudiedTodayCount: number;
    totalQuestionsDone: number;
    totalQuestionsCorrect: number;
    totalQuestionsWrong: number;
    overallAccuracyRate: number;
    editalStudiedPercentage: number;
    editalReviewedPercentage: number;
    totalTopicsCount: number;
    studiedTopicsCount: number;
    pendingTopicsCount: number;
    reviewedTopicsCount: number;
    currentCycleDiscipline: Discipline | undefined;
    currentCycleTargetMinutes: number;
    weakTopics: WeakTopicItem[];
    currentStreakDays: number;
    recordStreakDays: number;
  };

  // Automated Daily Backups
  dailyBackups: DailyBackupItem[];
  lastDailyBackupTime: string | null;
  isBackingUp: boolean;
  refreshDailyBackups: () => Promise<void>;
  triggerManualDailyBackup: () => Promise<{ success: boolean; message?: string }>;
  restoreDailyBackup: (backupId: string) => Promise<boolean>;
  deleteDailyBackup: (backupId: string) => Promise<boolean>;
  downloadDailyBackup: (backupId: string) => void;

  // Data management & Clean Slate
  exportBackup: () => void;
  importBackup: (jsonStr: string) => boolean;
  resetEditalProgress: (editalId?: string) => void;
  clearAllUserData: () => void;
  resetToInitialData: () => void;
}

const getStorageKeys = (userId?: string) => {
  const prefix = userId ? `farda_u_${userId}_` : `farda_guest_`;
  return {
    EDITAIS: `${prefix}editais_v7`,
    ACTIVE_EDITAL_ID: `${prefix}active_edital_id_v7`,
    STUDY_PLANS: `${prefix}study_plans_v7`,
    STUDY_SESSIONS: `${prefix}study_sessions_v7`,
    SCHEDULED_REVIEWS: `${prefix}scheduled_reviews_v7`,
    SIMULADOS: `${prefix}simulados_v7`,
    REMINDERS: `${prefix}reminders_v7`,
    USER_SETTINGS: `${prefix}user_settings_v7`,
    DAILY_BACKUPS_META: `${prefix}daily_backups_meta_v1`,
    SIDEBAR_COLLAPSED: "farda_sidebar_collapsed_v8",
  };
};

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, authStatus, completeUserOnboarding } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  const storageKeys = useMemo(() => getStorageKeys(user?.id), [user?.id]);

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.SIDEBAR_COLLAPSED);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(storageKeys.SIDEBAR_COLLAPSED, JSON.stringify(next));
      return next;
    });
  };

  // User Settings
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.USER_SETTINGS);
      if (saved) return JSON.parse(saved);
      return {
        ...INITIAL_USER_SETTINGS,
        userName: user?.name || "Operador",
        userEmail: user?.email || "",
      };
    } catch {
      return INITIAL_USER_SETTINGS;
    }
  });

  const updateUserSettings = (updates: Partial<UserSettings>) => {
    setUserSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(storageKeys.USER_SETTINGS, JSON.stringify(next));
      if (user?.id) {
        saveUserSettingsToFirestore(user.id, next).catch((err) =>
          console.error("Erro ao salvar configurações no Firestore:", err)
        );
      }
      return next;
    });
  };

  // Helper to sanitize stored data and purge legacy mock seeds
  const sanitizeStoredArray = <T,>(jsonString: string | null): T[] => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return [];
      const hasLegacy = parsed.some((item: any) => {
        const str = JSON.stringify(item);
        return str.includes("edital-gcm-manaus") || str.includes("plan-gcm-manaus") || str.includes("Guarda Civil Municipal de Manaus");
      });
      if (hasLegacy) {
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  };

  // Editais
  const [editais, setEditais] = useState<Edital[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.EDITAIS);
      return sanitizeStoredArray<Edital>(saved);
    } catch {
      return [];
    }
  });

  const [activeEditalId, setActiveEditalId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.ACTIVE_EDITAL_ID);
      if (saved && !saved.includes("gcm-manaus")) {
        return saved;
      }
      return "";
    } catch {
      return "";
    }
  });

  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.STUDY_PLANS);
      return sanitizeStoredArray<StudyPlan>(saved);
    } catch {
      return [];
    }
  });

  // Zero-latency in-memory and local cache for plan images
  const [planImages, setPlanImages] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    try {
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("nexo_plan_img_")) {
            const pid = key.replace("nexo_plan_img_", "");
            const val = localStorage.getItem(key);
            if (val) initial[pid] = val;
          }
        }
      }
    } catch {}
    return initial;
  });

  const [loadingPlanImages, setLoadingPlanImages] = useState<Record<string, boolean>>({});

  const getPlanImageUrl = (planId: string): string | undefined => {
    return planImages[planId] || getCachedPlanImage(planId) || undefined;
  };

  const isPlanImageLoading = (planId: string): boolean => {
    return !!loadingPlanImages[planId];
  };

  const setPlanImageCache = (planId: string, dataUrl: string | null) => {
    setCachedPlanImage(planId, dataUrl);
    setPlanImages((prev) => {
      if (dataUrl) {
        return { ...prev, [planId]: dataUrl };
      } else {
        const next = { ...prev };
        delete next[planId];
        return next;
      }
    });
  };

  const refreshPlanImage = async (planId: string): Promise<string | null> => {
    const uid = auth.currentUser?.uid || user?.id;
    if (!uid || !planId) return null;
    setLoadingPlanImages((prev) => ({ ...prev, [planId]: true }));
    try {
      const dataUrl = await fetchPlanImageFromFirestore(uid, planId);
      if (dataUrl) {
        setPlanImages((prev) => ({ ...prev, [planId]: dataUrl }));
      }
      return dataUrl;
    } finally {
      setLoadingPlanImages((prev) => ({ ...prev, [planId]: false }));
    }
  };

  const [studySessions, setStudySessions] = useState<StudySession[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.STUDY_SESSIONS);
      return sanitizeStoredArray<StudySession>(saved);
    } catch {
      return [];
    }
  });

  const [scheduledReviews, setScheduledReviews] = useState<ScheduledReview[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.SCHEDULED_REVIEWS);
      return sanitizeStoredArray<ScheduledReview>(saved);
    } catch {
      return [];
    }
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.REMINDERS);
      return sanitizeStoredArray<Reminder>(saved);
    } catch {
      return [];
    }
  });

  const [simulados, setSimulados] = useState<Simulado[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.SIMULADOS);
      return sanitizeStoredArray<Simulado>(saved);
    } catch {
      return [];
    }
  });

  // Global Plan Templates - DEPRECATED in favor of permanent catalogEditais
  const [globalTemplates, setGlobalTemplates] = useState<PlanTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);

  // Catálogo Oficial Permanente de Editais (Firestore)
  const [catalogEditais, setCatalogEditais] = useState<CatalogEdital[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);

  // Assinatura em tempo real de editais publicados
  useEffect(() => {
    const unsubCatalog = subscribePublishedEditais((list) => {
      setCatalogEditais(list);
      setIsLoadingCatalog(false);
    });
    return () => {
      unsubCatalog();
    };
  }, []);

  const refreshCatalogEditais = async (): Promise<CatalogEdital[]> => {
    setIsLoadingCatalog(true);
    try {
      const list = await getPublishedEditais();
      setCatalogEditais(list);
      return list;
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const fetchGlobalTemplates = async () => {
    // Permanent architecture uses catalogEditais. Mocks/seeds are never used.
    setIsLoadingTemplates(false);
    setGlobalTemplates([]);
  };

  useEffect(() => {
    fetchGlobalTemplates();
  }, []);

  const saveTemplateToCatalog = async (
    templateData: Omit<PlanTemplate, "id" | "createdAt" | "clonesCount">
  ): Promise<PlanTemplate | null> => {
    try {
      if (import.meta.env.DEV) {
        const res = await fetch("/api/planos/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateData),
        }).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data.template) {
            setGlobalTemplates((prev) => {
              const filtered = prev.filter((t) => t.id !== data.template.id);
              return [data.template, ...filtered];
            });
            return data.template;
          }
        }
      }

      // Local/Firestore catalog fallback
      const localTemplate: PlanTemplate = {
        ...templateData,
        id: `tpl-custom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        clonesCount: 0,
      };
      setGlobalTemplates((prev) => [localTemplate, ...prev]);
      return localTemplate;
    } catch {
      return null;
    }
  };

  // Automatic purge of legacy localStorage keys on startup
  useEffect(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("_v1") ||
            key.includes("_v2") ||
            key.includes("_v3") ||
            key.includes("_v4") ||
            key.includes("_v5") ||
            key.includes("_v6") ||
            key.startsWith("pf_") ||
            key.includes("gcm-manaus") ||
            key.includes("manaus"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Storage purge warning:", e);
    }
  }, []);

  // Switch dataset when user logs in / changes and connect Firestore real-time synchronization
  useEffect(() => {
    const keys = getStorageKeys(user?.id);
    const savedEditais = localStorage.getItem(keys.EDITAIS);
    const cleanEditais = sanitizeStoredArray<Edital>(savedEditais);
    setEditais(cleanEditais);

    const savedActiveEdital = localStorage.getItem(keys.ACTIVE_EDITAL_ID);
    if (savedActiveEdital && !savedActiveEdital.includes("gcm-manaus") && cleanEditais.some((e) => e.id === savedActiveEdital)) {
      setActiveEditalId(savedActiveEdital);
    } else {
      setActiveEditalId(cleanEditais[0]?.id || "");
    }

    const savedPlans = localStorage.getItem(keys.STUDY_PLANS);
    const cleanPlans = sanitizeStoredArray<StudyPlan>(savedPlans);
    setStudyPlans(cleanPlans);

    const savedSessions = localStorage.getItem(keys.STUDY_SESSIONS);
    const cleanSessions = sanitizeStoredArray<StudySession>(savedSessions);
    setStudySessions(cleanSessions);

    const savedReviews = localStorage.getItem(keys.SCHEDULED_REVIEWS);
    const cleanReviews = sanitizeStoredArray<ScheduledReview>(savedReviews);
    setScheduledReviews(cleanReviews);

    const savedSimulados = localStorage.getItem(keys.SIMULADOS);
    const cleanSimulados = sanitizeStoredArray<Simulado>(savedSimulados);
    setSimulados(cleanSimulados);

    const savedReminders = localStorage.getItem(keys.REMINDERS);
    const cleanReminders = sanitizeStoredArray<Reminder>(savedReminders);
    setReminders(cleanReminders);

    const savedSettings = localStorage.getItem(keys.USER_SETTINGS);
    if (savedSettings) {
      setUserSettings(JSON.parse(savedSettings));
    } else {
      setUserSettings({
        ...INITIAL_USER_SETTINGS,
        userName: user?.name || "Operador",
        userEmail: user?.email || "",
      });
    }

    if (authStatus !== "authenticated" || !user?.id || !auth.currentUser || auth.currentUser.uid !== user.id) return;

    const uid = user.id;

    // Purge any orphan/artificial editais from previous tests/sessions
    purgeOrphanOrArtificialEditais(uid).catch(() => {});

    // Migrate any pre-existing local data to Firestore seamlessly
    migrateLocalDataToFirestore(uid, {
      editais: cleanEditais,
      studyPlans: cleanPlans,
      studySessions: cleanSessions,
      scheduledReviews: cleanReviews,
      simulados: cleanSimulados,
      reminders: cleanReminders,
      userSettings: savedSettings ? JSON.parse(savedSettings) : undefined,
    }).catch((migErr) => {
      console.warn("[FIRESTORE MIGRATION NOTICE]:", migErr);
    });

    // Real-time Firestore subscriptions for persistent multi-device state
    const unsubEditais = subscribeEditaisFromFirestore(uid, (remoteEditais) => {
      const list = remoteEditais || [];
      setEditais(list);
      if (list.length === 0) {
        setActiveEditalId("");
      } else {
        setActiveEditalId((curr) =>
          list.some((e) => e.id === curr) ? curr : list[0].id
        );
      }
    });

    const unsubPlans = subscribeStudyPlansFromFirestore(uid, (remotePlans) => {
      setStudyPlans(remotePlans || []);
    });

    const unsubSessions = subscribeStudySessionsFromFirestore(uid, (remoteSessions) => {
      setStudySessions(remoteSessions);
    });

    const unsubReviews = subscribeScheduledReviewsFromFirestore(uid, (remoteReviews) => {
      setScheduledReviews(remoteReviews);
    });

    const unsubSimulados = subscribeSimuladosFromFirestore(uid, (remoteSimulados) => {
      setSimulados(remoteSimulados);
    });

    const unsubReminders = subscribeRemindersFromFirestore(uid, (remoteReminders) => {
      setReminders(remoteReminders);
    });

    const unsubSettings = subscribeUserSettingsFromFirestore(uid, (remoteSettings) => {
      if (remoteSettings) {
        setUserSettings(remoteSettings);
      }
    });

    return () => {
      unsubEditais();
      unsubPlans();
      unsubSessions();
      unsubReviews();
      unsubSimulados();
      unsubReminders();
      unsubSettings();
    };
  }, [user?.id]);

  // Sync and fetch plan images from Firestore users/{uid}/planImages/{planId}
  useEffect(() => {
    const uid = auth.currentUser?.uid || user?.id;
    if (!uid || studyPlans.length === 0) return;

    studyPlans.forEach(async (plan) => {
      // 1. Audit & migrate legacy plan image fields if present
      if (
        (plan.imageUrl && plan.imageUrl.startsWith("data:image/")) ||
        (plan.image_path && plan.image_path.startsWith("data:image/"))
      ) {
        const migratedUrl = await migrateLegacyPlanImage(uid, plan);
        if (migratedUrl) {
          setPlanImageCache(plan.id, migratedUrl);
          updateStudyPlan(plan.id, {
            hasCustomImage: true,
            imageRef: plan.id,
            imageUrl: undefined,
            image_path: undefined,
          });
        }
        return;
      }

      // 2. Fetch image from Firestore subcollection if marked with custom image
      if (plan.hasCustomImage || plan.imageRef) {
        const inMemory = planImages[plan.id];
        if (!inMemory) {
          const cached = getCachedPlanImage(plan.id);
          if (cached) {
            setPlanImages((prev) => ({ ...prev, [plan.id]: cached }));
          } else {
            refreshPlanImage(plan.id);
          }
        }
      }
    });
  }, [studyPlans, user?.id]);

  // Global Active Timer state
  const [timer, setTimer] = useState<ActiveTimerState>({
    isRunning: false,
    mode: "stopwatch",
    elapsedSeconds: 0,
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    isBreak: false,
    editalId: "",
    disciplineId: "",
    topicId: "",
    modality: "Teoria",
    questionsDone: 0,
    questionsCorrect: 0,
    notes: "",
  });

  // Persist to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKeys.EDITAIS, JSON.stringify(editais));
      localStorage.setItem(storageKeys.ACTIVE_EDITAL_ID, activeEditalId);
      localStorage.setItem(storageKeys.STUDY_PLANS, JSON.stringify(studyPlans));
      localStorage.setItem(storageKeys.STUDY_SESSIONS, JSON.stringify(studySessions));
      localStorage.setItem(storageKeys.SCHEDULED_REVIEWS, JSON.stringify(scheduledReviews));
      localStorage.setItem(storageKeys.SIMULADOS, JSON.stringify(simulados));
      localStorage.setItem(storageKeys.REMINDERS, JSON.stringify(reminders));
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }
  }, [editais, activeEditalId, studyPlans, studySessions, scheduledReviews, simulados, reminders, storageKeys]);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const nextSeconds = prev.elapsedSeconds + 1;
          if (prev.mode === "pomodoro") {
            const limit = prev.isBreak ? prev.pomodoroBreakMinutes * 60 : prev.pomodoroWorkMinutes * 60;
            if (nextSeconds >= limit) {
              return {
                ...prev,
                elapsedSeconds: 0,
                isBreak: !prev.isBreak,
              };
            }
          }
          return {
            ...prev,
            elapsedSeconds: nextSeconds,
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.mode, timer.isBreak, timer.pomodoroBreakMinutes, timer.pomodoroWorkMinutes]);

  // Derived Active Entities
  const activePlan = useMemo(() => {
    if (studyPlans.length === 0) return undefined;
    const explicitActive = studyPlans.find((p) => p.active);
    if (explicitActive) return explicitActive;
    if (activeEditalId) {
      const match = studyPlans.find((p) => p.editalId === activeEditalId);
      if (match) return match;
    }
    return studyPlans[0];
  }, [studyPlans, activeEditalId]);

  const activeEdital = useMemo(() => {
    if (editais.length === 0) return undefined;
    if (activePlan?.editalId) {
      const match = editais.find((e) => e.id === activePlan.editalId);
      if (match) return match;
    }
    if (activeEditalId) {
      const match = editais.find((e) => e.id === activeEditalId);
      if (match) return match;
    }
    if (studyPlans.length > 0 && studyPlans[0].editalId) {
      const match = editais.find((e) => e.id === studyPlans[0].editalId);
      if (match) return match;
    }
    if (studyPlans.length === 0 && !activeEditalId) {
      return undefined;
    }
    return editais[0];
  }, [editais, activeEditalId, activePlan, studyPlans]);

  // Derived Metrics & Analytics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const relevantSessions = activeEdital
      ? studySessions.filter((s) => s.editalId === activeEdital.id)
      : studyPlans.length === 0
      ? []
      : studySessions;

    let minutesToday = 0;
    let minutesThisWeek = 0;
    let totalMinutes = 0;
    const disciplinesTodaySet = new Set<string>();

    relevantSessions.forEach((s) => {
      totalMinutes += s.durationMinutes;
      const sDate = new Date(s.date);
      if (s.date.startsWith(todayStr)) {
        minutesToday += s.durationMinutes;
        disciplinesTodaySet.add(s.disciplineId);
      }
      if (sDate >= startOfWeek) {
        minutesThisWeek += s.durationMinutes;
      }
    });

    const hoursToday = Math.round((minutesToday / 60) * 10) / 10;
    const hoursThisWeek = Math.round((minutesThisWeek / 60) * 10) / 10;
    const weeklyGoalHours = activePlan?.weeklyGoalHours || userSettings.weeklyGoalHours || 0;
    const weeklyGoalPercentage = weeklyGoalHours > 0 ? Math.min(100, Math.round((hoursThisWeek / weeklyGoalHours) * 100)) : 0;

    // Formatted Total Time (e.g. 57h 53min or dynamic)
    const totalHoursNum = Math.floor(totalMinutes / 60);
    const totalMinsNum = totalMinutes % 60;
    const totalStudiedHoursFormatted = `${totalHoursNum}h${totalMinsNum.toString().padStart(2, "0")}min`;

    // Topic & Discipline progress
    const editalTopics = activeEdital?.topics || [];
    const totalTopicsCount = editalTopics.length;
    const studiedTopicsCount = editalTopics.filter((t) => t.isStudied).length;
    const pendingTopicsCount = Math.max(0, totalTopicsCount - studiedTopicsCount);
    const reviewedTopicsCount = editalTopics.filter((t) => t.isReviewed).length;

    const editalStudiedPercentage = totalTopicsCount > 0 ? Math.round((studiedTopicsCount / totalTopicsCount) * 100) : 0;
    const editalReviewedPercentage = totalTopicsCount > 0 ? Math.round((reviewedTopicsCount / totalTopicsCount) * 100) : 0;

    // Questions accuracy derived directly from study sessions (single source of truth)
    let totalQuestionsDone = 0;
    let totalQuestionsCorrect = 0;
    relevantSessions.forEach((s) => {
      totalQuestionsDone += s.questionsDone || 0;
      totalQuestionsCorrect += s.questionsCorrect || 0;
    });
    const totalQuestionsWrong = Math.max(0, totalQuestionsDone - totalQuestionsCorrect);
    const overallAccuracyRate = totalQuestionsDone > 0 ? Math.round((totalQuestionsCorrect / totalQuestionsDone) * 100) : 0;

    // Current cycle step
    let currentCycleDiscipline: Discipline | undefined;
    let currentCycleTargetMinutes = 60;
    if (activePlan && activePlan.cycle.length > 0 && activeEdital) {
      const step = activePlan.cycle[activePlan.currentCycleIndex % activePlan.cycle.length];
      if (step) {
        currentCycleDiscipline = activeEdital.disciplines.find((d) => d.id === step.disciplineId);
        currentCycleTargetMinutes = step.targetMinutes;
      }
    }

    // Weak topics diagnostic derived from relevant sessions and topics
    const weakTopics: WeakTopicItem[] = [];
    if (activeEdital) {
      editalTopics.forEach((topic) => {
        const topicSessions = relevantSessions.filter((s) => s.topicId === topic.id);
        const qDone = topicSessions.length > 0
          ? topicSessions.reduce((acc, s) => acc + (s.questionsDone || 0), 0)
          : topic.questionsDone || 0;
        const qCorrect = topicSessions.length > 0
          ? topicSessions.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0)
          : topic.questionsCorrect || 0;
        const accRate = qDone > 0 ? Math.round((qCorrect / qDone) * 100) : topic.accuracyRate || 0;

        if (qDone >= 5 && accRate < 75) {
          const disc = activeEdital.disciplines.find((d) => d.id === topic.disciplineId);
          weakTopics.push({
            disciplineId: topic.disciplineId,
            disciplineName: disc?.name || "Geral",
            topicId: topic.id,
            topicName: topic.name,
            questionsDone: qDone,
            questionsCorrect: qCorrect,
            accuracyRate: accRate,
            masteryRate: topic.masteryRate,
            priority: topic.priority,
          });
        }
      });
    }
    weakTopics.sort((a, b) => a.accuracyRate - b.accuracyRate);

    // Calculate streak days (consecutive days with study sessions)
    const datesWithStudy = new Set<string>();
    studySessions.forEach((s) => {
      const dStr = s.studyDate || (s.date ? s.date.split("T")[0] : "");
      if (dStr) datesWithStudy.add(dStr);
    });

    let currentStreakDays = 0;
    let checkDate = new Date();
    // check today or yesterday
    const todayFormatted = checkDate.toISOString().split("T")[0];
    if (datesWithStudy.has(todayFormatted)) {
      currentStreakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      if (datesWithStudy.has(checkDate.toISOString().split("T")[0])) {
        currentStreakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    while (datesWithStudy.has(checkDate.toISOString().split("T")[0])) {
      currentStreakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Fallback if seeded or newly active
    if (currentStreakDays === 0 && studySessions.length === 0) {
      currentStreakDays = 0;
    }
    const recordStreakDays = Math.max(currentStreakDays, 0);

    return {
      hoursToday,
      hoursThisWeek,
      totalHoursStudied: Math.round((totalMinutes / 60) * 10) / 10,
      totalStudiedMinutes: totalMinutes,
      totalStudiedHoursFormatted,
      weeklyGoalHours,
      weeklyGoalPercentage,
      disciplinesStudiedTodayCount: disciplinesTodaySet.size,
      totalQuestionsDone,
      totalQuestionsCorrect,
      totalQuestionsWrong,
      overallAccuracyRate,
      editalStudiedPercentage,
      editalReviewedPercentage,
      totalTopicsCount,
      studiedTopicsCount,
      pendingTopicsCount,
      reviewedTopicsCount,
      currentCycleDiscipline,
      currentCycleTargetMinutes,
      weakTopics,
      currentStreakDays,
      recordStreakDays,
    };
  }, [studySessions, activeEdital, activePlan, userSettings]);

  // Pending & Overdue Reviews
  const { pendingReviewsToday, overdueReviews } = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const pendingToday: ScheduledReview[] = [];
    const overdue: ScheduledReview[] = [];

    scheduledReviews
      .filter((r) => !activeEdital || r.editalId === activeEdital.id)
      .forEach((r) => {
        if (!r.completed) {
          if (r.dueDate === todayStr) {
            pendingToday.push(r);
          } else if (r.dueDate < todayStr) {
            overdue.push(r);
          }
        }
      });

    return { pendingReviewsToday: pendingToday, overdueReviews: overdue };
  }, [scheduledReviews, activeEdital]);

  // Timer controls
  const startTimer = () => {
    console.log("[ESTUDOS] SESSÃO INICIADA");
    setTimer((prev) => ({ ...prev, isRunning: true, startedAt: Date.now() }));
  };

  const pauseTimer = () => {
    setTimer((prev) => ({ ...prev, isRunning: false }));
  };

  const resetTimer = () => {
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      elapsedSeconds: 0,
      isBreak: false,
      questionsDone: 0,
      questionsCorrect: 0,
      notes: "",
    }));
  };

  const setTimerConfig = (config: Partial<ActiveTimerState>) => {
    setTimer((prev) => ({ ...prev, ...config }));
  };

  const launchStudySessionForTopic = (disciplineId: string, topicId?: string, modality: StudyModality = "Teoria") => {
    const defaultTopic = topicId || activeEdital?.topics.find((t) => t.disciplineId === disciplineId)?.id || "";
    setTimer((prev) => ({
      ...prev,
      disciplineId,
      topicId: defaultTopic,
      modality,
      elapsedSeconds: 0,
      questionsDone: 0,
      questionsCorrect: 0,
      isRunning: false,
    }));
    setActiveTab("cronometro");
  };

  // Finish study session & save
  const finishCurrentSession = async (
    options?: FinishSessionOptions
  ): Promise<{ session: StudySession; reviews: ScheduledReview[] }> => {
    // 1. Resolve values with priority to explicit options, fallback to timer state and active entities
    const targetPlanId = options?.planId || timer.planId || activePlan?.id || "";
    const foundPlan = studyPlans.find((p) => p.id === targetPlanId) || activePlan;
    const targetEditalId = options?.editalId || timer.editalId || foundPlan?.editalId || activeEdital?.id || "";
    const foundEdital = editais.find((e) => e.id === targetEditalId) || activeEdital;

    const targetDisciplineId = options?.disciplineId || timer.disciplineId;
    const targetTopicId = options?.topicId || timer.topicId;

    const disc = foundEdital?.disciplines.find((d) => d.id === targetDisciplineId);
    const top = foundEdital?.topics.find((t) => t.id === targetTopicId);

    const minutes = options?.durationMinutes !== undefined
      ? Math.max(0, options.durationMinutes)
      : Math.max(1, Math.round(timer.elapsedSeconds / 60));

    const qDone = options?.questionsDone !== undefined ? options.questionsDone : timer.questionsDone;
    const qCorrect = options?.questionsCorrect !== undefined ? options.questionsCorrect : timer.questionsCorrect;
    const notesStr = options?.notes !== undefined ? options.notes : timer.notes;
    const modalityVal = options?.modality || timer.modality || "Teoria";
    const selectedDays = (options?.scheduleReviews !== false && options?.selectedReviewDays) ? options.selectedReviewDays : [];

    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();
    const baseDateStr = options?.studyDate || nowIso.split("T")[0];
    const sessionDateIso = options?.studyDate
      ? new Date(`${options.studyDate}T12:00:00`).toISOString()
      : nowIso;

    // 2. Build Scheduled Reviews upfront based STRICTLY on selectedReviewDays and baseDateStr (studyDate)
    const [bYear, bMonth, bDay] = baseDateStr.split("-").map(Number);
    const createdReviews: ScheduledReview[] = selectedDays.map((days) => {
      const targetDate = new Date(bYear, (bMonth || 1) - 1, bDay || 1);
      targetDate.setDate(targetDate.getDate() + days);
      const dueYear = targetDate.getFullYear();
      const dueMonth = String(targetDate.getMonth() + 1).padStart(2, "0");
      const dueDay = String(targetDate.getDate()).padStart(2, "0");
      const dueDate = `${dueYear}-${dueMonth}-${dueDay}`;

      return {
        id: `rev-${sessionId}-${days}d`,
        userId: user?.id,
        planId: foundPlan?.id || undefined,
        planName: foundPlan?.name || undefined,
        cargo: foundPlan?.cargo || foundEdital?.cargo || undefined,
        cargoId: foundPlan?.sourceCargoId || undefined,
        editalId: foundEdital?.id || "",
        disciplineId: disc?.id || targetDisciplineId || "",
        disciplineName: disc?.name || "Disciplina",
        topicId: top?.id || targetTopicId || "",
        topicName: top?.name || "Geral",
        sessionId: sessionId,
        originalSessionId: sessionId,
        stage: `${days}d`,
        intervalDays: days,
        dueDate,
        status: "Pendente",
        completed: false,
        notes: notesStr.trim() ? notesStr.trim() : undefined,
        createdAt: nowIso,
      };
    });

    const isTheoryCompleted = Boolean(options?.theoryCompleted);

    // 3. Build the complete StudySession object
    const newSession: StudySession = {
      id: sessionId,
      userId: user?.id,
      planId: foundPlan?.id || undefined,
      planName: foundPlan?.name || undefined,
      cargo: foundPlan?.cargo || foundEdital?.cargo || undefined,
      cargoId: foundPlan?.sourceCargoId || undefined,
      editalId: foundEdital?.id || "",
      disciplineId: disc?.id || targetDisciplineId || "",
      disciplineName: disc?.name || "Disciplina",
      topicId: top?.id || targetTopicId || undefined,
      topicName: top?.name || "Geral",
      planningBlockId: foundPlan?.id || undefined,
      date: sessionDateIso,
      studyDate: baseDateStr,
      createdAt: nowIso,
      durationMinutes: minutes,
      modality: modalityVal,
      questionsDone: qDone,
      questionsCorrect: qCorrect,
      notes: notesStr,
      theoryCompleted: isTheoryCompleted,
      reviewsScheduled: createdReviews.length,
      createdReviewsCount: createdReviews.length,
      reviewDates: createdReviews.map((r) => r.dueDate),
    };

    // 4. Atomic Firestore persistence with await
    if (user?.id) {
      try {
        await saveStudySessionToFirestore(user.id, newSession);
        for (const rev of createdReviews) {
          await saveScheduledReviewToFirestore(user.id, rev);
        }
      } catch (saveErr) {
        console.error("Erro ao persistir sessão ou revisões no Firestore:", saveErr);
      }
    }

    // 5. Update local React state
    setStudySessions((prev) => [newSession, ...prev]);
    if (createdReviews.length > 0) {
      setScheduledReviews((prev) => [...createdReviews, ...prev]);
    }

    // 6. Update topic statistics & mastery based on real sessions (CRITICAL: Registrar estudo != Concluir teoria)
    if (top && foundEdital) {
      const topSessions = [newSession, ...studySessions].filter((s) => s.topicId === top.id);
      const totalQ = topSessions.reduce((acc, s) => acc + (s.questionsDone || 0), 0);
      const totalC = topSessions.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0);
      const accRate = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
      
      const newIsStudied = isTheoryCompleted ? true : Boolean(top.isStudied || top.status === "concluido");
      const newStatus = isTheoryCompleted
        ? "concluido"
        : (top.status === "concluido" ? "concluido" : (minutes > 0 || qDone > 0 ? "em_estudo" : (top.status || "nao_iniciado")));

      const newMastery = Math.min(
        100,
        Math.round(
          (newIsStudied ? 40 : 20) +
            (totalQ > 0 ? (totalC / totalQ) * 40 : 20) +
            ((top.reviewCount || 0) + createdReviews.length) * 10
        )
      );

      const topicUpdates: Partial<Topic> = {
        isStudied: newIsStudied,
        status: newStatus,
        lastStudiedAt: sessionDateIso,
        questionsDone: totalQ,
        questionsCorrect: totalC,
        accuracyRate: accRate,
        masteryRate: newMastery,
        totalStudyMinutes: topSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0),
        sessionCount: topSessions.length,
        reviewCount: (top.reviewCount || 0) + (createdReviews.length > 0 ? 1 : 0),
      };

      updateTopic(top.id, topicUpdates);
    }

    // 7. Update discipline studied hours based on all sessions
    if (disc) {
      const discSessions = [newSession, ...studySessions].filter(
        (s) => s.disciplineId === disc.id || s.disciplineName === disc.name
      );
      const totalMin = discSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      updateDiscipline(disc.id, {
        studiedHours: Math.round((totalMin / 60) * 10) / 10,
      });
    }

    // 8. Advance cycle if plan has a cycle
    if (foundPlan) {
      advanceCycleStep();
    }

    // 9. Exact audit logs requested
    console.log(
      `[ESTUDOS] SESSÃO FINALIZADA\nPlano: ${foundPlan?.name || "Sem plano"}\nEdital: ${foundEdital?.title || "Sem edital"}\nDisciplina: ${disc?.name || "Disciplina"}\nTópico: ${top?.name || "Geral"}\nTempo: ${minutes} min\nQuestões: ${qDone}\nAcertos: ${qCorrect}\nErros: ${Math.max(0, qDone - qCorrect)}\nRevisões: ${createdReviews.length}`
    );

    if (createdReviews.length > 0) {
      console.log(
        `[ESTUDOS] REVISÕES CRIADAS\nQuantidade: ${createdReviews.length}\nDatas: ${createdReviews.map((r) => `${r.stage}: ${r.dueDate}`).join(", ")}`
      );
    }

    // 10. Reset timer
    resetTimer();

    return { session: newSession, reviews: createdReviews };
  };

  const advanceCycleStep = () => {
    if (!activePlan || activePlan.cycle.length === 0) return;
    const nextIdx = (activePlan.currentCycleIndex + 1) % activePlan.cycle.length;
    updateStudyPlan(activePlan.id, {
      currentCycleIndex: nextIdx,
      currentStepElapsedMinutes: 0,
    });
  };

  // Edital CRUD
  const createEdital = async (
    editalData: Omit<Edital, "id" | "createdAt"> & { id?: string }
  ): Promise<Edital> => {
    const newEditalId = editalData.id || `edital-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newEdital: Edital = {
      ...editalData,
      id: newEditalId,
      userId: user?.id,
      createdAt: new Date().toISOString(),
    };
    setEditais((prev) => {
      const filtered = prev.filter((e) => e.id !== newEditalId);
      return [...filtered, newEdital];
    });
    setActiveEditalId(newEdital.id);
    if (user?.id) {
      try {
        await saveEditalToFirestore(user.id, newEdital);
      } catch (err) {
        console.error("Erro ao salvar edital no Firestore:", err);
      }
    }
    return newEdital;
  };

  const updateEdital = (id: string, updates: Partial<Edital>) => {
    setEditais((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      const target = next.find((e) => e.id === id);
      if (target && user?.id) {
        saveEditalToFirestore(user.id, target).catch((err) =>
          console.error("Erro ao atualizar edital no Firestore:", err)
        );
      }
      return next;
    });
  };

  const deleteEdital = (id: string) => {
    if (user?.id) {
      deleteEditalFromFirestore(user.id, id).catch((err) =>
        console.error("Erro ao excluir edital no Firestore:", err)
      );
    }
    // 1. Determine remaining editais
    const remainingEditais = editais.filter((e) => e.id !== id);
    setEditais(remainingEditais);

    // 2. Remove any study plans associated with this edital
    const remainingPlans = studyPlans.filter((p) => p.editalId !== id);
    let nextActiveEditalId = "";

    if (remainingPlans.length > 0) {
      const hasActive = remainingPlans.some((p) => p.active);
      let updatedPlans = remainingPlans;
      if (!hasActive) {
        updatedPlans = [{ ...remainingPlans[0], active: true }, ...remainingPlans.slice(1)];
      }
      setStudyPlans(updatedPlans);
      const activeP = updatedPlans.find((p) => p.active);
      nextActiveEditalId = activeP?.editalId || remainingEditais[0]?.id || "";
    } else {
      setStudyPlans([]);
      nextActiveEditalId = remainingEditais[0]?.id || "";
    }

    setActiveEditalId(nextActiveEditalId);

    // 3. Cascade delete all study sessions linked to this edital
    setStudySessions((prev) => prev.filter((s) => s.editalId !== id));

    // 4. Cascade delete all scheduled reviews linked to this edital
    setScheduledReviews((prev) => prev.filter((r) => r.editalId !== id));

    // 5. Cascade delete all simulados linked to this edital
    setSimulados((prev) => prev.filter((sim) => sim.editalId !== id));

    // 6. Cascade delete all reminders linked to this edital
    setReminders((prev) => prev.filter((rem) => rem.editalId !== id));

    // 7. Reset timer if running on this edital
    setTimer((prev) => {
      if (prev.editalId === id) {
        return {
          isRunning: false,
          mode: "stopwatch",
          elapsedSeconds: 0,
          pomodoroWorkMinutes: 25,
          pomodoroBreakMinutes: 5,
          isBreak: false,
          editalId: "",
          disciplineId: "",
          disciplineName: "",
          topicId: "",
          topicName: "",
          modality: "Teoria",
          questionsDone: 0,
          questionsCorrect: 0,
          notes: "",
        };
      }
      return prev;
    });
  };

  // Disciplines & Topics CRUD
  const addDiscipline = (discData: Omit<Discipline, "id"> & { id?: string }): Discipline => {
    const newDisc: Discipline = {
      ...discData,
      id: discData.id || `disc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    };
    setEditais((prev) =>
      prev.map((e) => {
        if (e.id === discData.editalId) {
          const updated = { ...e, disciplines: [...e.disciplines, newDisc] };
          if (user?.id) saveEditalToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return e;
      })
    );
    return newDisc;
  };

  const updateDiscipline = (id: string, updates: Partial<Discipline>) => {
    setEditais((prev) =>
      prev.map((e) => {
        if (e.disciplines.some((d) => d.id === id)) {
          const updated = {
            ...e,
            disciplines: e.disciplines.map((d) => (d.id === id ? { ...d, ...updates } : d)),
          };
          if (user?.id) saveEditalToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return e;
      })
    );
  };

  const deleteDiscipline = (id: string) => {
    // 1. Remove from editais
    setEditais((prev) =>
      prev.map((e) => {
        if (e.disciplines.some((d) => d.id === id)) {
          const updated = {
            ...e,
            disciplines: e.disciplines.filter((d) => d.id !== id),
            topics: e.topics.filter((t) => t.disciplineId !== id),
          };
          if (user?.id) saveEditalToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return e;
      })
    );

    // 2. Remove from study plans cycles and weekly schedules
    setStudyPlans((prev) =>
      prev.map((p) => {
        const updated = {
          ...p,
          cycle: p.cycle.filter((c) => c.disciplineId !== id),
          weeklySchedule: p.weeklySchedule ? p.weeklySchedule.filter((w) => w.disciplineId !== id) : [],
        };
        if (user?.id) saveStudyPlanToFirestore(user.id, updated).catch(console.error);
        return updated;
      })
    );

    // 3. Cascade remove from scheduled reviews
    setScheduledReviews((prev) => prev.filter((r) => r.disciplineId !== id));

    // 4. Cascade remove from study sessions
    setStudySessions((prev) => prev.filter((s) => s.disciplineId !== id));

    // 5. Reset timer if running for this discipline
    setTimer((prev) => (prev.disciplineId === id ? { ...prev, disciplineId: "", disciplineName: "", topicId: "", topicName: "" } : prev));
  };

  const addTopic = (topicDataOrDisciplineId: Omit<Topic, "id"> | string, maybeName?: string) => {
    let topicData: Omit<Topic, "id">;
    if (typeof topicDataOrDisciplineId === "string") {
      topicData = {
        disciplineId: topicDataOrDisciplineId,
        name: maybeName || "Novo Tópico",
        subtopics: [],
        isStudied: false,
        isReviewed: false,
        reviewCount: 0,
        questionsDone: 0,
        questionsCorrect: 0,
        accuracyRate: 0,
        masteryRate: 0,
        notes: "",
      };
    } else {
      topicData = topicDataOrDisciplineId;
    }

    const newTopic: Topic = {
      ...topicData,
      id: `top-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setEditais((prev) =>
      prev.map((e) => {
        const hasDisc = e.disciplines.some((d) => d.id === topicData.disciplineId);
        if (hasDisc) {
          const updated = { ...e, topics: [...e.topics, newTopic] };
          if (user?.id) saveEditalToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return e;
      })
    );
  };

  const updateTopic = (id: string, updates: Partial<Topic>) => {
    setEditais((prev) =>
      prev.map((e) => {
        if (e.topics.some((t) => t.id === id)) {
          const updated = {
            ...e,
            topics: e.topics.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          };
          if (user?.id) saveEditalToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return e;
      })
    );
  };

  const deleteTopic = (id: string) => {
    // 1. Remove from editais
    setEditais((prev) =>
      prev.map((e) => {
        if (e.topics.some((t) => t.id === id)) {
          const updated = {
            ...e,
            topics: e.topics.filter((t) => t.id !== id),
          };
          if (user?.id) saveEditalToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return e;
      })
    );

    // 2. Cascade remove from scheduled reviews
    setScheduledReviews((prev) => prev.filter((r) => r.topicId !== id));

    // 3. Cascade remove from study sessions
    setStudySessions((prev) => prev.filter((s) => s.topicId !== id));

    // 4. Reset timer if running for this topic
    setTimer((prev) => (prev.topicId === id ? { ...prev, topicId: "", topicName: "" } : prev));
  };

  const toggleTopicStudied = (topicId: string) => {
    const topic = activeEdital?.topics.find((t) => t.id === topicId);
    if (!topic) return;
    const nextStudied = !topic.isStudied;
    updateTopic(topicId, {
      isStudied: nextStudied,
      lastStudiedAt: nextStudied ? new Date().toISOString() : topic.lastStudiedAt,
      masteryRate: nextStudied ? Math.max(topic.masteryRate, 40) : Math.max(0, topic.masteryRate - 30),
    });
    if (nextStudied) {
      createScheduledReview(topicId, "24h");
    }
  };

  const toggleTopicReviewed = (topicId: string) => {
    const topic = activeEdital?.topics.find((t) => t.id === topicId);
    if (!topic) return;
    const nextReviewed = !topic.isReviewed;
    updateTopic(topicId, {
      isReviewed: nextReviewed,
      reviewCount: nextReviewed ? topic.reviewCount + 1 : Math.max(0, topic.reviewCount - 1),
      masteryRate: nextReviewed ? Math.min(100, topic.masteryRate + 15) : Math.max(0, topic.masteryRate - 15),
    });
  };

  const importVerticalizedData = (editalTitle: string, organ: string, banca: string, disciplinesData: any[]) => {
    const editalId = `edital-${Date.now()}`;
    const colors = ["#F59E0B", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];
    const icons = ["BookOpen", "Scale", "Building2", "ShieldAlert", "FileText", "Laptop", "Calculator", "Sparkles"];

    const builtDisciplines: Discipline[] = [];
    const builtTopics: Topic[] = [];

    disciplinesData.forEach((d, idx) => {
      const discId = `disc-${editalId}-${idx}`;
      builtDisciplines.push({
        id: discId,
        editalId,
        name: d.name,
        color: colors[idx % colors.length],
        iconName: icons[idx % icons.length],
        priority: d.priority || "media",
        difficulty: d.difficulty || "medio",
        weight: d.weight || 2,
        targetHours: 30,
        studiedHours: 0,
      });

      if (Array.isArray(d.topics)) {
        d.topics.forEach((t: any, tIdx: number) => {
          builtTopics.push({
            id: `top-${discId}-${tIdx}`,
            disciplineId: discId,
            name: t.name,
            subtopics: Array.isArray(t.subtopics) ? t.subtopics : [],
            isStudied: false,
            isReviewed: false,
            reviewCount: 0,
            questionsDone: 0,
            questionsCorrect: 0,
            accuracyRate: 0,
            masteryRate: 0,
            notes: "",
            priority: d.priority || "media",
            difficulty: d.difficulty || "medio",
          });
        });
      }
    });

    const newEdital: Edital = {
      id: editalId,
      title: editalTitle || "Novo Concurso",
      organ: organ || "Órgão Público",
      banca: banca || "Banca Examinadora",
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      isCustom: true,
      disciplines: builtDisciplines,
      topics: builtTopics,
    };

    setEditais((prev) => [...prev, newEdital]);
    setActiveEditalId(newEdital.id);

    const newPlan: StudyPlan = {
      id: `plan-${Date.now()}`,
      name: `Plano de Estudos - ${newEdital.title}`,
      editalId,
      planningMode: "CYCLE",
      organizationType: "ciclo",
      weeklyGoalHours: 20,
      minSessionMinutes: 30,
      maxSessionMinutes: 90,
      completedCycles: 0,
      dailyAvailability: { seg: 3, ter: 3, qua: 3, qui: 3, sex: 3, sab: 4, dom: 1 },
      cycle: builtDisciplines.map((d, index) => ({
        id: `step-${index + 1}`,
        disciplineId: d.id,
        targetMinutes: d.weight === 3 ? 90 : 60,
        order: index + 1,
      })),
      currentCycleIndex: 0,
      currentStepElapsedMinutes: 0,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setStudyPlans((prev) => [...prev, newPlan]);
  };

  // Study Plans CRUD
  const createStudyPlan = async (
    planData: Omit<StudyPlan, "id" | "createdAt"> & { id?: string }
  ): Promise<StudyPlan> => {
    const orgType = planData.organizationType || (planData.planningMode === "WEEKLY" ? "semanal" : "ciclo");
    const pMode = planData.planningMode || (orgType === "semanal" ? "WEEKLY" : "CYCLE");
    const shouldBeActive = planData.active ?? (studyPlans.length === 0);
    const newPlanId = planData.id || `plan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newPlan: StudyPlan = {
      ...planData,
      id: newPlanId,
      userId: user?.id,
      planningMode: pMode,
      organizationType: orgType,
      active: shouldBeActive,
      completedCycles: planData.completedCycles || 0,
      minSessionMinutes: planData.minSessionMinutes || 30,
      maxSessionMinutes: planData.maxSessionMinutes || 90,
      createdAt: new Date().toISOString(),
    };
    setStudyPlans((prev) => [
      ...prev.map((p) => (shouldBeActive ? { ...p, active: false } : p)),
      newPlan,
    ]);
    if (shouldBeActive && newPlan.editalId) {
      setActiveEditalId(newPlan.editalId);
    }
    if (user?.id) {
      try {
        await saveStudyPlanToFirestore(user.id, newPlan);
        if (user.onboarding?.completed === false || user.onboardingCompleted === false) {
          completeUserOnboarding?.().catch((err) =>
            console.error("Erro ao concluir onboarding após salvar plano:", err)
          );
        }
      } catch (err) {
        console.error("Erro ao salvar plano no Firestore:", err);
      }
    }
    return newPlan;
  };

  const updateStudyPlan = (id: string, updates: Partial<StudyPlan>) => {
    setStudyPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const orgType = updates.organizationType || p.organizationType;
          const pMode = updates.planningMode || (updates.organizationType ? (updates.organizationType === "semanal" ? "WEEKLY" : "CYCLE") : p.planningMode || (p.organizationType === "semanal" ? "WEEKLY" : "CYCLE"));
          const updated = { ...p, ...updates, planningMode: pMode, organizationType: orgType, updatedAt: new Date().toISOString() };
          if (updates.active) {
            setActiveEditalId(updated.editalId);
          }
          if (user?.id) {
            saveStudyPlanToFirestore(user.id, updated).catch((err) =>
              console.error("Erro ao atualizar plano no Firestore:", err)
            );
          }

          // Optional dev mirror to SQLite if in development
          if (import.meta.env.DEV) {
            try {
              fetch("/api/user-plans/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user?.id || "guest",
                  plan: updated,
                }),
              }).catch(() => {});
            } catch {
              // Non-blocking
            }
          }

          return updated;
        }
        if (updates.active && p.id !== id) {
          return { ...p, active: false };
        }
        return p;
      })
    );
  };

  const deleteStudyPlan = (id: string) => {
    const uid = auth.currentUser?.uid || user?.id;
    if (uid) {
      deleteStudyPlanFromFirestore(uid, id).catch((err) =>
        console.error("Erro ao excluir plano no Firestore:", err)
      );
      deletePlanImageFromFirestore(uid, id).catch(() => {});
    }
    setPlanImageCache(id, null);
    const planToDelete = studyPlans.find((p) => p.id === id);
    const targetEditalId = planToDelete?.editalId;

    // 1. Filter out the plan and any orphaned plans referencing the same edital
    const remainingPlans = studyPlans.filter((p) => p.id !== id && (!targetEditalId || p.editalId !== targetEditalId));
    let nextActiveEditalId = "";
    let updatedPlans = remainingPlans;

    // 2. Filter out the linked edital from editais
    const remainingEditais = editais.filter((e) => !targetEditalId || e.id !== targetEditalId);
    setEditais(remainingEditais);

    if (remainingPlans.length > 0) {
      const hasActive = remainingPlans.some((p) => p.active);
      if (!hasActive) {
        updatedPlans = [{ ...remainingPlans[0], active: true }, ...remainingPlans.slice(1)];
      }
      const currentActive = updatedPlans.find((p) => p.active);
      nextActiveEditalId = currentActive?.editalId || remainingEditais[0]?.id || "";
    } else {
      updatedPlans = [];
      nextActiveEditalId = remainingEditais[0]?.id || "";
    }

    setStudyPlans(updatedPlans);
    setActiveEditalId(nextActiveEditalId);

    // 3. Cascade delete all study sessions linked to this plan or edital
    setStudySessions((prev) =>
      prev.filter((s) => {
        if (targetEditalId && s.editalId === targetEditalId) return false;
        if (s.planningBlockId === id) return false;
        return true;
      })
    );

    // 4. Cascade delete all scheduled reviews linked to this edital
    setScheduledReviews((prev) =>
      prev.filter((r) => {
        if (targetEditalId && r.editalId === targetEditalId) return false;
        return true;
      })
    );

    // 5. Cascade delete all simulados linked to this edital
    setSimulados((prev) =>
      prev.filter((sim) => {
        if (targetEditalId && sim.editalId === targetEditalId) return false;
        return true;
      })
    );

    // 6. Cascade delete all reminders linked to this edital
    setReminders((prev) =>
      prev.filter((rem) => {
        if (targetEditalId && rem.editalId === targetEditalId) return false;
        return true;
      })
    );

    // 7. Reset active timer if it belonged to the deleted plan or edital
    setTimer((prev) => {
      if ((targetEditalId && prev.editalId === targetEditalId) || prev.planningBlockId === id) {
        return {
          isRunning: false,
          mode: "stopwatch",
          elapsedSeconds: 0,
          pomodoroWorkMinutes: 25,
          pomodoroBreakMinutes: 5,
          isBreak: false,
          editalId: "",
          disciplineId: "",
          disciplineName: "",
          topicId: "",
          topicName: "",
          modality: "Teoria",
          questionsDone: 0,
          questionsCorrect: 0,
          notes: "",
        };
      }
      return prev;
    });

    // 8. Optional dev sync deletion to backend if in development
    if (import.meta.env.DEV) {
      try {
        fetch(`/api/user-plans/${id}`, { method: "DELETE" }).catch(() => {});
      } catch {
        // Non-blocking
      }
    }
  };

  const archiveStudyPlan = (id: string) => {
    setStudyPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isArchived: !p.isArchived, active: false } : p))
    );
  };

  const resetCycleProgress = (planId: string) => {
    setStudyPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              currentCycleIndex: 0,
              currentStepElapsedMinutes: 0,
            }
          : p
      )
    );
  };

  const updateWeeklySchedule = (planId: string, schedule: WeeklyScheduleBlock[]) => {
    setStudyPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, weeklySchedule: schedule } : p))
    );
  };

  const cloneTemplateToPlan = async (
    template: PlanTemplate,
    customName?: string,
    organizationType: PlanOrganization = "ciclo"
  ): Promise<StudyPlan> => {
    // 1. Generate unique IDs for disciplines and topics to guarantee full isolation from other users and instances
    const editalId = `edital-cloned-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const discIdMap = new Map<string, string>();

    const newDisciplines: Discipline[] = template.disciplines.map((td, idx) => {
      const newDiscId = `disc-${editalId}-${idx + 1}`;
      discIdMap.set(td.id, newDiscId);
      return {
        id: newDiscId,
        editalId,
        name: td.name,
        color: td.color || "#F59E0B",
        iconName: td.iconName || "BookOpen",
        priority: td.priority || "alta",
        difficulty: td.difficulty || "medio",
        weight: td.weight || 2,
        targetHours: td.targetHours || 30,
        studiedHours: 0, // Reset progress to 0h
      };
    });

    const newTopics: Topic[] = template.topics.map((tt, idx) => {
      const mappedDiscId = discIdMap.get(tt.disciplineId) || newDisciplines[0]?.id || `disc-${editalId}-1`;
      return {
        id: `top-${editalId}-${idx + 1}`,
        disciplineId: mappedDiscId,
        name: tt.name,
        subtopics: Array.isArray(tt.subtopics) ? [...tt.subtopics] : [],
        isStudied: false, // Reset progress: unstudied
        isReviewed: false, // Reset progress: unreviewed
        reviewCount: 0, // Reset: 0 reviews
        questionsDone: 0, // Reset: 0 questions
        questionsCorrect: 0, // Reset: 0 questions correct
        accuracyRate: 0, // Reset: 0% accuracy
        masteryRate: 0, // Reset: 0% mastery
        notes: "",
        priority: tt.priority || "alta",
        difficulty: tt.difficulty || "medio",
      };
    });

    // 2. Create the clean User Edital Instance
    const userEdital: Edital = {
      id: editalId,
      title: template.title,
      organ: template.organ,
      banca: template.banca,
      cargo: template.cargo,
      year: template.year || new Date().getFullYear(),
      region: (template.region as any) || "Federal",
      category: template.category || "Concurso Público",
      examDate: template.examDate,
      vacanciesCount: template.vacanciesCount,
      notes: template.description || (template.sourceFileName ? `Baseado no modelo compartilhado: ${template.sourceFileName}` : undefined),
      isCustom: true,
      disciplines: newDisciplines,
      topics: newTopics,
      createdAt: new Date().toISOString(),
    };

    setEditais((prev) => [...prev, userEdital]);
    setActiveEditalId(userEdital.id);

    // 3. Create the clean User Study Plan Instance (0 completed cycles, 0 elapsed time)
    const planTitle = customName?.trim() || `Plano de Estudos - ${template.title}`;
    const userPlan = createStudyPlan({
      name: planTitle,
      editalId: userEdital.id,
      category: template.category || "Concurso Público",
      organizationType,
      organ: template.organ,
      cargo: template.cargo,
      banca: template.banca,
      examDate: template.examDate,
      vacanciesCount: template.vacanciesCount,
      weeklyGoalHours: 20,
      minSessionMinutes: 30,
      maxSessionMinutes: 90,
      completedCycles: 0, // 0 completed cycles
      dailyAvailability: {
        seg: 3,
        ter: 3,
        qua: 3,
        qui: 3,
        sex: 3,
        sab: 4,
        dom: 1,
      },
      cycle: newDisciplines.map((d, index) => ({
        id: `step-${index + 1}`,
        disciplineId: d.id,
        targetMinutes: d.weight === 3 ? 90 : 60,
        order: index + 1,
        importance: d.weight === 3 ? 5 : 3,
        knowledgeLevel: 3,
        weightPercentage: Math.round(100 / Math.max(1, newDisciplines.length)),
      })),
      weeklySchedule: newDisciplines.slice(0, 7).map((d, index) => {
        const days: Array<"seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom"> = [
          "seg", "ter", "qua", "qui", "sex", "sab", "dom"
        ];
        return {
          id: `ws-${index + 1}`,
          day: days[index % 7],
          disciplineId: d.id,
          targetMinutes: 90,
          order: 1,
        };
      }),
      currentCycleIndex: 0,
      currentStepElapsedMinutes: 0,
      active: true,
    });

    // 4. Optional backend notification to increment clone count in background
    if (import.meta.env.DEV) {
      try {
        fetch(`/api/planos/templates/${template.id}/clone`, { method: "POST" }).catch(() => {});
      } catch {
        // Non-blocking
      }
    }

    return userPlan;
  };

  const cloneCatalogEditalAsPlan = async (
    editalId: string,
    planName?: string,
    organizationType: PlanOrganization = "ciclo"
  ): Promise<StudyPlan> => {
    const targetEdital = editais.find((e) => e.id === editalId);
    if (!targetEdital) throw new Error("Edital not found");

    const createdPlan = await createStudyPlan({
      name: planName || `Plano de Estudos - ${targetEdital.title}`,
      editalId: targetEdital.id,
      category: targetEdital.category || "Concurso Público",
      organizationType,
      organ: targetEdital.organ,
      cargo: targetEdital.cargo,
      banca: targetEdital.banca,
      examDate: targetEdital.examDate,
      vacanciesCount: targetEdital.vacanciesCount,
      weeklyGoalHours: 20,
      minSessionMinutes: 30,
      maxSessionMinutes: 90,
      completedCycles: 0,
      dailyAvailability: {
        seg: 3,
        ter: 3,
        qua: 3,
        qui: 3,
        sex: 3,
        sab: 4,
        dom: 1,
      },
      cycle: targetEdital.disciplines.map((d, index) => ({
        id: `step-${index + 1}`,
        disciplineId: d.id,
        targetMinutes: d.weight === 3 ? 90 : 60,
        order: index + 1,
        importance: d.weight === 3 ? 5 : 3,
        knowledgeLevel: 3,
        weightPercentage: Math.round(100 / Math.max(1, targetEdital.disciplines.length)),
      })),
      weeklySchedule: targetEdital.disciplines.slice(0, 7).map((d, index) => {
        const days: Array<"seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom"> = [
          "seg", "ter", "qua", "qui", "sex", "sab", "dom"
        ];
        return {
          id: `ws-${index + 1}`,
          day: days[index % 7],
          disciplineId: d.id,
          targetMinutes: 90,
          order: 1,
        };
      }),
      currentCycleIndex: 0,
      currentStepElapsedMinutes: 0,
      active: true,
    });

    setActiveEditalId(targetEdital.id);
    return createdPlan;
  };

  /**
   * Cria um Plano de Estudos a partir do Catálogo Oficial de Editais.
   * Cria um snapshot isolado do Edital e do Plano no escopo do usuário.
   * Não vincula o progresso do usuário ao documento vivo do catálogo.
   */
  const createStudyPlanFromCatalog = async (params: {
    catalogEditalId: string;
    cargoId: string;
    planName?: string;
    weeklyGoalHours?: number;
    organizationType?: PlanOrganization;
    planningMode?: PlanningMode;
  }): Promise<StudyPlan | null> => {
    try {
      const [catalogEdital, cargoSnapshot] = await Promise.all([
        getEditalById(params.catalogEditalId),
        getFullCargoStructure(params.catalogEditalId, params.cargoId),
      ]);

      if (!catalogEdital || !cargoSnapshot) {
        throw new Error("Edital ou cargo do catálogo não encontrado.");
      }

      // 1. Gerar instâncias únicas e isoladas para o snapshot do usuário
      const userEditalId = `edital-cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const discIdMap = new Map<string, string>();
      const PRESET_COLORS = [
        "#249D84", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
        "#EC4899", "#06B6D4", "#6366F1", "#14B8A6", "#F59E0B"
      ];

      const newDisciplines: Discipline[] = (cargoSnapshot.disciplines || []).map((cd, idx) => {
        const newDiscId = `disc-${userEditalId}-${idx + 1}`;
        discIdMap.set(cd.id, newDiscId);
        return {
          id: newDiscId,
          editalId: userEditalId,
          name: cd.name,
          color: PRESET_COLORS[idx % PRESET_COLORS.length],
          iconName: "BookOpen",
          priority: "media",
          difficulty: "medio",
          weight: cd.weight || 2,
          targetHours: 30,
          studiedHours: 0,
        };
      });

      const newTopics: Topic[] = [];
      (cargoSnapshot.disciplines || []).forEach((cd) => {
        const mappedDiscId = discIdMap.get(cd.id) || `disc-${userEditalId}-1`;
        (cd.topics || []).forEach((ct) => {
          newTopics.push({
            id: `top-${userEditalId}-${newTopics.length + 1}`,
            disciplineId: mappedDiscId,
            name: ct.title,
            subtopics: [],
            isStudied: false,
            isReviewed: false,
            reviewCount: 0,
            questionsDone: 0,
            questionsCorrect: 0,
            accuracyRate: 0,
            masteryRate: 0,
            notes: ct.sourceReference ? `Referência: ${ct.sourceReference}` : "",
            priority: "media",
            difficulty: "medio",
          });
        });
      });

      // 2. Salva o Edital pessoal isolado
      const personalEdital: Edital = {
        id: userEditalId,
        userId: user?.id,
        title: `${catalogEdital.institution} - ${cargoSnapshot.name}`,
        organ: catalogEdital.institution,
        banca: catalogEdital.board,
        cargo: cargoSnapshot.name,
        year: catalogEdital.year,
        state: catalogEdital.state,
        category: "Concurso Público",
        publicationDate: catalogEdital.publicationDate,
        isCustom: false,
        disciplines: newDisciplines,
        topics: newTopics,
        createdAt: new Date().toISOString(),
      };

      await createEdital(personalEdital);

      // 3. Salva o Plano de Estudos com metadados de procedência
      const planTitle =
        params.planName?.trim() || `${catalogEdital.institution} - ${cargoSnapshot.name}`;

      const userPlan = createStudyPlan({
        name: planTitle,
        editalId: personalEdital.id,
        organ: catalogEdital.institution,
        cargo: cargoSnapshot.name,
        banca: catalogEdital.board,
        category: "Concurso Público",
        weeklyGoalHours: params.weeklyGoalHours || 20,
        organizationType: params.organizationType || "ciclo",
        planningMode: params.planningMode || "CYCLE",
        active: true,
        sourceEditalId: catalogEdital.id,
        sourceEditalType: "catalog",
        sourceEditalVersion: catalogEdital.version || 1,
        sourceCargoId: cargoSnapshot.id,
        updateAvailable: false,
        cycle: newDisciplines.map((d, idx) => ({
          id: `step-${idx + 1}`,
          disciplineId: d.id,
          targetMinutes: d.weight === 3 ? 90 : 60,
          order: idx + 1,
        })),
        currentCycleIndex: 0,
        currentStepElapsedMinutes: 0,
        completedCycles: 0,
        minSessionMinutes: 30,
        maxSessionMinutes: 90,
        dailyAvailability: { seg: 3, ter: 3, qua: 3, qui: 3, sex: 3, sab: 4, dom: 1 },
      });

      setActiveEditalId(personalEdital.id);
      return userPlan;
    } catch (err) {
      console.error("[CATALOG] Erro ao criar plano a partir do catálogo:", err);
      return null;
    }
  };

  /**
   * Checa se o edital do catálogo possui retificação / nova versão.
   * Se sim, marca updateAvailable = true no plano do estudante.
   */
  const checkPlanForUpdates = async (planId: string): Promise<boolean> => {
    const plan = studyPlans.find((p) => p.id === planId);
    if (!plan || !plan.sourceEditalId) return false;

    try {
      const result = await checkForPlanEditalUpdate({
        sourceEditalId: plan.sourceEditalId,
        sourceEditalVersion: plan.sourceEditalVersion,
      });

      if (result.updateAvailable) {
        updateStudyPlan(planId, { updateAvailable: true });
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[CATALOG] Erro ao checar atualização do edital:", err);
      return false;
    }
  };

  const applyOnboardingPlan = (plan: any, edital: any) => {
    if (edital) {
      setEditais((prev) => {
        const filtered = prev.filter((e) => e.id !== edital.id);
        const next = [edital, ...filtered];
        localStorage.setItem(storageKeys.EDITAIS, JSON.stringify(next));
        return next;
      });
      setActiveEditalId(edital.id);
      localStorage.setItem(storageKeys.ACTIVE_EDITAL_ID, edital.id);
    }
    if (plan) {
      const fullPlan: StudyPlan = {
        ...plan,
        active: true,
      };
      setStudyPlans((prev) => {
        const filtered = prev.filter((p) => p.id !== fullPlan.id).map((p) => ({ ...p, active: false }));
        const next = [fullPlan, ...filtered];
        localStorage.setItem(storageKeys.STUDY_PLANS, JSON.stringify(next));
        return next;
      });
    }
  };

  // Sessions CRUD
  const logStudySession = (sessionData: Omit<StudySession, "id">) => {
    const newSess: StudySession = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      userId: user?.id,
    };
    setStudySessions((prev) => [newSess, ...prev]);
    if (user?.id) {
      saveStudySessionToFirestore(user.id, newSess).catch((err) =>
        console.error("Erro ao salvar sessão no Firestore:", err)
      );
    }

    if (sessionData.topicId && activeEdital) {
      const top = activeEdital.topics.find((t) => t.id === sessionData.topicId);
      if (top) {
        const totalQ = (top.questionsDone || 0) + (sessionData.questionsDone || 0);
        const totalC = (top.questionsCorrect || 0) + (sessionData.questionsCorrect || 0);
        const accRate = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : top.accuracyRate || 0;
        const newMastery = Math.min(
          100,
          Math.round(
            40 +
            (totalQ > 0 ? (totalC / totalQ) * 40 : 20) +
            (top.reviewCount || 0) * 10
          )
        );

        updateTopic(top.id, {
          isStudied: true,
          lastStudiedAt: sessionData.date || new Date().toISOString(),
          questionsDone: totalQ,
          questionsCorrect: totalC,
          accuracyRate: accRate,
          masteryRate: newMastery,
        });

        // Note: Reviews are created explicitly when selected by the user, respecting: "Nunca criar revisões para dias que não foram selecionados."
      }
    }

    if (activePlan) {
      advanceCycleStep();
    }
  };

  const recalculateProgress = (sessions: StudySession[]) => {
    const updatedEditais = editais.map((edital) => {
      const editalSessions = sessions.filter((s) => s.editalId === edital.id);

      const updatedDisciplines = edital.disciplines.map((disc) => {
        const discSessions = editalSessions.filter(
          (s) => s.disciplineId === disc.id || s.disciplineName === disc.name
        );
        const totalMinutes = discSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        return {
          ...disc,
          studiedHours: Math.round((totalMinutes / 60) * 10) / 10,
        };
      });

      const updatedTopics = edital.topics.map((top) => {
        const topSessions = editalSessions.filter((s) => s.topicId === top.id);
        const totalQ = topSessions.reduce((acc, s) => acc + (s.questionsDone || 0), 0);
        const totalC = topSessions.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0);
        const accRate = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
        
        // Cuidado importante (Requisito 8): Preservar conclusão do tópico se já estiver marcado como estudado/concluído
        const isStudied = Boolean(top.isStudied || top.status === "concluido");
        const status = top.status === "concluido"
          ? "concluido"
          : (isStudied ? "concluido" : (topSessions.length > 0 ? "em_estudo" : (top.status || "nao_iniciado")));

        const masteryRate = isStudied
          ? Math.min(
              100,
              Math.round(
                40 +
                (totalQ > 0 ? (totalC / totalQ) * 40 : 20) +
                (top.reviewCount || 0) * 10
              )
            )
          : (totalQ > 0 ? Math.min(100, Math.round((totalC / totalQ) * 40)) : 0);

        return {
          ...top,
          isStudied,
          status,
          questionsDone: totalQ,
          questionsCorrect: totalC,
          accuracyRate: accRate,
          masteryRate,
          totalStudyMinutes: topSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0),
          sessionCount: topSessions.length,
        };
      });

      return {
        ...edital,
        disciplines: updatedDisciplines,
        topics: updatedTopics,
      };
    });

    setEditais(updatedEditais);

    // Sync updated editais to Firestore
    if (user?.id) {
      updatedEditais.forEach((ed) => {
        saveEditalToFirestore(user.id, ed).catch((err) =>
          console.error("Erro ao sincronizar edital com Firestore:", err)
        );
      });
    }
  };

  const deleteStudySession = async (id: string): Promise<void> => {
    // 1. Remove the session from local state and recalculate progress immediately
    const updated = studySessions.filter((s) => s.id !== id);
    setStudySessions(updated);
    recalculateProgress(updated);

    // 2. Identify linked scheduled reviews generated for or tied to this study session
    const linkedReviews = scheduledReviews.filter(
      (r) => r.sessionId === id || r.originalSessionId === id || r.id.startsWith(`rev-${id}`)
    );

    if (linkedReviews.length > 0) {
      const linkedIds = new Set(linkedReviews.map((r) => r.id));
      setScheduledReviews((prev) => prev.filter((r) => !linkedIds.has(r.id)));
    }

    // 3. Atomically persist deletion to Firestore
    if (user?.id) {
      try {
        await deleteStudySessionFromFirestore(user.id, id);
        for (const rev of linkedReviews) {
          await deleteScheduledReviewFromFirestore(user.id, rev.id);
        }
      } catch (err) {
        console.error("Erro ao excluir sessão e revisões no Firestore:", err);
      }
    }
  };

  const deleteSelectedStudySessions = async (ids: string[]): Promise<void> => {
    const idSet = new Set(ids);
    const updated = studySessions.filter((s) => !idSet.has(s.id));
    setStudySessions(updated);
    recalculateProgress(updated);

    // Identify linked reviews
    const linkedReviews = scheduledReviews.filter(
      (r) =>
        (r.sessionId && idSet.has(r.sessionId)) ||
        (r.originalSessionId && idSet.has(r.originalSessionId)) ||
        ids.some((id) => r.id.startsWith(`rev-${id}`))
    );

    if (linkedReviews.length > 0) {
      const linkedIds = new Set(linkedReviews.map((r) => r.id));
      setScheduledReviews((prev) => prev.filter((r) => !linkedIds.has(r.id)));
    }

    if (user?.id) {
      try {
        await deleteMultipleStudySessionsFromFirestore(user.id, ids);
        for (const rev of linkedReviews) {
          await deleteScheduledReviewFromFirestore(user.id, rev.id);
        }
      } catch (err) {
        console.error("Erro ao excluir sessões no Firestore:", err);
      }
    }
  };

  const clearAllStudySessions = async (): Promise<void> => {
    const allIds = studySessions.map((s) => s.id);
    setStudySessions([]);
    recalculateProgress([]);
    if (user?.id && allIds.length > 0) {
      try {
        await deleteMultipleStudySessionsFromFirestore(user.id, allIds);
      } catch (err) {
        console.error("Erro ao limpar todas as sessões no Firestore:", err);
      }
    }
  };

  // Reviews CRUD
  const completeScheduledReview = (reviewId: string, options?: CompleteReviewOptions) => {
    const rev = scheduledReviews.find((r) => r.id === reviewId);
    if (!rev) return;

    const completedAt = new Date().toISOString();
    const durationMinutes = options?.durationMinutes || 0;
    const questionsDone = options?.questionsDone || 0;
    const questionsCorrect = options?.questionsCorrect || 0;
    const notes = options?.notes;
    const reviewMethod = options?.reviewMethod;
    const retentionLevel = options?.retentionLevel;

    const updatedRev: ScheduledReview = {
      ...rev,
      completed: true,
      completedAt,
      notes: notes ?? rev.notes,
      durationMinutes: durationMinutes > 0 ? durationMinutes : rev.durationMinutes,
      questionsDone: questionsDone > 0 ? questionsDone : rev.questionsDone,
      questionsCorrect: questionsDone > 0 ? questionsCorrect : rev.questionsCorrect,
      reviewMethod: reviewMethod ?? rev.reviewMethod,
      retentionLevel: retentionLevel ?? rev.retentionLevel,
    };

    setScheduledReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? updatedRev : r))
    );
    if (user?.id) {
      saveScheduledReviewToFirestore(user.id, updatedRev).catch((err) =>
        console.error("Erro ao atualizar revisão no Firestore:", err)
      );
    }

    // Optionally create a StudySession in history if time, questions, or notes were registered
    if (options?.logAsSession !== false && (durationMinutes > 0 || questionsDone > 0 || notes)) {
      const newSession: StudySession = {
        id: `sess-${Date.now()}`,
        userId: user?.id,
        editalId: rev.editalId,
        disciplineId: rev.disciplineId,
        disciplineName: rev.disciplineName,
        topicId: rev.topicId,
        topicName: rev.topicName,
        date: completedAt,
        durationMinutes: durationMinutes || 15,
        modality: "Revisão",
        questionsDone: questionsDone,
        questionsCorrect: questionsCorrect,
        notes: notes
          ? `[Revisão ${rev.stage}${reviewMethod ? ` - ${reviewMethod}` : ""}] ${notes}`
          : `Revisão de ${rev.stage}`,
      };
      const newSessionsList = [newSession, ...studySessions];
      setStudySessions(newSessionsList);
      if (user?.id) {
        saveStudySessionToFirestore(user.id, newSession).catch((err) =>
          console.error("Erro ao salvar sessão de revisão no Firestore:", err)
        );
      }

      if (durationMinutes > 0) {
        const disc = activeEdital?.disciplines.find((d) => d.id === rev.disciplineId);
        if (disc) {
          updateDiscipline(disc.id, {
            studiedHours: Math.round(((disc.studiedHours || 0) + durationMinutes / 60) * 10) / 10,
          });
        }
      }
    }

    const topic = activeEdital?.topics.find((t) => t.id === rev.topicId);
    if (topic) {
      const newQuestionsDone = (topic.questionsDone || 0) + questionsDone;
      const newQuestionsCorrect = (topic.questionsCorrect || 0) + questionsCorrect;
      const accuracyRate =
        newQuestionsDone > 0
          ? Math.round((newQuestionsCorrect / newQuestionsDone) * 100)
          : topic.accuracyRate || 0;

      let masteryBonus = 15;
      if (retentionLevel === "errei") masteryBonus = 5;
      else if (retentionLevel === "dificil") masteryBonus = 10;
      else if (retentionLevel === "facil") masteryBonus = 20;

      updateTopic(topic.id, {
        isReviewed: true,
        reviewCount: topic.reviewCount + 1,
        questionsDone: newQuestionsDone,
        questionsCorrect: newQuestionsCorrect,
        accuracyRate,
        masteryRate: Math.min(100, topic.masteryRate + masteryBonus),
      });

      // Adaptive next stage:
      if (retentionLevel === "errei") {
        createScheduledReview(topic.id, "24h");
      } else {
        const nextStages: Record<ReviewInterval, ReviewInterval | null> = {
          "24h": "7d",
          "7d": "15d",
          "15d": "30d",
          "30d": "60d",
          "60d": null,
        };
        const nextStage = nextStages[rev.stage];
        if (nextStage) {
          createScheduledReview(topic.id, nextStage);
        }
      }
    }
  };

  const rescheduleReview = (reviewId: string, newDueDate: string, stage?: ReviewInterval) => {
    setScheduledReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const updated = { ...r, dueDate: newDueDate, ...(stage ? { stage } : {}) };
          if (user?.id) saveScheduledReviewToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return r;
      })
    );
  };

  const deleteScheduledReview = (reviewId: string) => {
    setScheduledReviews((prev) => prev.filter((r) => r.id !== reviewId));
    if (user?.id) {
      deleteScheduledReviewFromFirestore(user.id, reviewId).catch(console.error);
    }
  };

  const updateScheduledReview = (reviewId: string, updates: Partial<ScheduledReview>) => {
    setScheduledReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const updated = { ...r, ...updates };
          if (user?.id) saveScheduledReviewToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return r;
      })
    );
  };

  const batchRescheduleOverdueReviews = (newDueDate?: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const targetDate = newDueDate || todayStr;
    setScheduledReviews((prev) =>
      prev.map((r) => {
        if (!r.completed && r.dueDate < todayStr) {
          const updated = { ...r, dueDate: targetDate };
          if (user?.id) saveScheduledReviewToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return r;
      })
    );
  };

  const clearAllScheduledReviews = () => {
    setScheduledReviews([]);
  };

  const createScheduledReview = (topicId: string, stage: ReviewInterval, customDueDate?: string) => {
    const topic = activeEdital?.topics.find((t) => t.id === topicId);
    const disc = activeEdital?.disciplines.find((d) => d.id === topic?.disciplineId);
    if (!topic || !disc) return;

    let daysToAdd = 1;
    if (stage === "7d") daysToAdd = 7;
    if (stage === "15d") daysToAdd = 15;
    if (stage === "30d") daysToAdd = 30;
    if (stage === "60d") daysToAdd = 60;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    const dueDate = customDueDate || targetDate.toISOString().split("T")[0];

    const newRev: ScheduledReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user?.id,
      editalId: activeEdital.id,
      disciplineId: disc.id,
      disciplineName: disc.name,
      topicId: topic.id,
      topicName: topic.name,
      stage,
      dueDate,
      completed: false,
    };

    setScheduledReviews((prev) => [newRev, ...prev]);
    if (user?.id) {
      saveScheduledReviewToFirestore(user.id, newRev).catch(console.error);
    }
  };

  // Reminders CRUD
  const addReminder = (remData: Omit<Reminder, "id">) => {
    const newReminder: Reminder = {
      ...remData,
      id: `rem-${Date.now()}`,
      userId: user?.id,
    };
    setReminders((prev) => [newReminder, ...prev]);
    if (user?.id) {
      saveReminderToFirestore(user.id, newReminder).catch(console.error);
    }
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          if (user?.id) saveReminderToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return r;
      })
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    if (user?.id) {
      deleteReminderFromFirestore(user.id, id).catch(console.error);
    }
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, completed: !r.completed };
          if (user?.id) saveReminderToFirestore(user.id, updated).catch(console.error);
          return updated;
        }
        return r;
      })
    );
  };

  const clearAllReminders = () => {
    setReminders([]);
  };

  // Simulados CRUD
  const addSimulado = (simData: Omit<Simulado, "id">) => {
    const newSim: Simulado = {
      ...simData,
      id: `sim-${Date.now()}`,
      userId: user?.id,
    };
    setSimulados((prev) => [newSim, ...prev]);
    if (user?.id) {
      saveSimuladoToFirestore(user.id, newSim).catch(console.error);
    }
  };

  const deleteSimulado = (id: string) => {
    setSimulados((prev) => prev.filter((s) => s.id !== id));
    if (user?.id) {
      deleteSimuladoFromFirestore(user.id, id).catch(console.error);
    }
  };

  const clearAllSimulados = () => {
    setSimulados([]);
  };

  // Reset and Wipe logic
  const resetEditalProgress = (editalId?: string) => {
    const targetId = editalId || activeEditalId;
    setEditais((prev) =>
      prev.map((edital) => {
        if (edital.id !== targetId) return edital;
        return {
          ...edital,
          disciplines: edital.disciplines.map((d) => ({ ...d, studiedHours: 0 })),
          topics: edital.topics.map((t) => ({
            ...t,
            isStudied: false,
            isReviewed: false,
            reviewCount: 0,
            questionsDone: 0,
            questionsCorrect: 0,
            accuracyRate: 0,
            masteryRate: 0,
            lastStudiedAt: undefined,
          })),
        };
      })
    );
    // Remove study sessions and reviews for this edital
    const updatedSessions = studySessions.filter((s) => s.editalId !== targetId);
    setStudySessions(updatedSessions);
    setScheduledReviews((prev) => prev.filter((r) => r.editalId !== targetId));
  };

  const clearAllUserData = () => {
    setStudySessions([]);
    setScheduledReviews([]);
    setSimulados([]);
    setReminders([]);
    setEditais(INITIAL_EDITAIS);
    setActiveEditalId(INITIAL_EDITAIS[0]?.id || "");
    setStudyPlans(INITIAL_STUDY_PLANS);
    setUserSettings({
      ...INITIAL_USER_SETTINGS,
      userName: user?.name || "Operador",
      userEmail: user?.email || "",
    });
    resetTimer();

    try {
      const prefix = user?.id ? `farda_u_${user.id}_` : `farda_`;
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(prefix) || key.startsWith("farda_"))) {
          allKeys.push(key);
        }
      }
      allKeys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error("Erro ao limpar dados locais:", e);
    }
  };

  // Backup & Restore
  const exportBackup = () => {
    const data = {
      version: 3,
      product: "NEXO",
      exportedAt: new Date().toISOString(),
      editais,
      activeEditalId,
      studyPlans,
      studySessions,
      scheduledReviews,
      reminders,
      userSettings,
      simulados,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_nexo_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.editais && Array.isArray(data.editais)) {
        setEditais(data.editais);
        if (data.activeEditalId) setActiveEditalId(data.activeEditalId);
        if (data.studyPlans) setStudyPlans(data.studyPlans);
        if (data.studySessions) setStudySessions(data.studySessions);
        if (data.scheduledReviews) setScheduledReviews(data.scheduledReviews);
        if (data.reminders) setReminders(data.reminders);
        if (data.userSettings) setUserSettings(data.userSettings);
        if (data.simulados) setSimulados(data.simulados);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // ==========================================
  // AUTOMATED DAILY BACKUP ENGINE
  // ==========================================
  const [dailyBackups, setDailyBackups] = useState<DailyBackupItem[]>([]);
  const [lastDailyBackupTime, setLastDailyBackupTime] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.DAILY_BACKUPS_META);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.lastBackupAt || null;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // Fetch list of daily backups from server (dev/fullstack) or local storage
  const refreshDailyBackups = async () => {
    try {
      if (import.meta.env.DEV) {
        const currentUserId = user?.id || "guest";
        const res = await fetch(`/api/backups/daily/list?userId=${encodeURIComponent(currentUserId)}`).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.backups)) {
            setDailyBackups(json.backups);
            if (json.latest?.createdAt) {
              setLastDailyBackupTime(json.latest.createdAt);
              localStorage.setItem(
                storageKeys.DAILY_BACKUPS_META,
                JSON.stringify({ lastBackupAt: json.latest.createdAt, dateKey: json.latest.dateKey })
              );
            }
          }
        }
      }
    } catch {
      // In static SPA mode, backups are safely managed locally without warnings
    }
  };

  // Perform daily backup snapshot (both local and server)
  const performDailyBackup = async (isAuto = true): Promise<{ success: boolean; message?: string }> => {
    if (isBackingUp) return { success: false, message: "Backup já em andamento." };
    setIsBackingUp(true);

    try {
      const currentUserId = user?.id || "guest";
      const now = new Date();
      const dateKey = now.toISOString().split("T")[0];

      const snapshotData = {
        version: 3,
        product: "NEXO",
        exportedAt: now.toISOString(),
        editais,
        activeEditalId,
        studyPlans,
        studySessions,
        scheduledReviews,
        reminders,
        userSettings,
        simulados,
      };

      const res = await fetch("/api/backups/daily/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          data: snapshotData,
          isAuto,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const json = await res.json();
          if (json.success) {
            setLastDailyBackupTime(now.toISOString());
            localStorage.setItem(
              storageKeys.DAILY_BACKUPS_META,
              JSON.stringify({ lastBackupAt: now.toISOString(), dateKey })
            );
            await refreshDailyBackups();
            return { success: true, message: "Ponto de backup diário salvo com sucesso!" };
          }
        }
      }

      // Fallback local save if server is offline or in static SPA mode
      setLastDailyBackupTime(now.toISOString());
      localStorage.setItem(
        storageKeys.DAILY_BACKUPS_META,
        JSON.stringify({ lastBackupAt: now.toISOString(), dateKey })
      );
      return { success: true, message: "Backup diário salvo localmente com sucesso." };
    } catch (error: any) {
      console.error("[DAILY BACKUP ERROR]:", error);
      return { success: false, message: error?.message || "Erro ao gerar backup diário." };
    } finally {
      setIsBackingUp(false);
    }
  };

  // Trigger manual daily snapshot
  const triggerManualDailyBackup = async () => {
    return await performDailyBackup(false);
  };

  // Restore a specific backup snapshot
  const restoreDailyBackup = async (backupId: string): Promise<boolean> => {
    try {
      const currentUserId = user?.id || "guest";
      const res = await fetch(`/api/backups/daily/get/${encodeURIComponent(backupId)}?userId=${encodeURIComponent(currentUserId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.backup?.data) {
          const success = importBackup(JSON.stringify(json.backup.data));
          return success;
        }
      }
      return false;
    } catch (err) {
      console.error("[DAILY BACKUP RESTORE ERROR]:", err);
      return false;
    }
  };

  // Delete a specific backup snapshot
  const deleteDailyBackup = async (backupId: string): Promise<boolean> => {
    try {
      const currentUserId = user?.id || "guest";
      const res = await fetch(`/api/backups/daily/${encodeURIComponent(backupId)}?userId=${encodeURIComponent(currentUserId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshDailyBackups();
        return true;
      }
      return false;
    } catch (err) {
      console.error("[DAILY BACKUP DELETE ERROR]:", err);
      return false;
    }
  };

  // Download a specific backup snapshot file
  const downloadDailyBackup = (backupId: string) => {
    const currentUserId = user?.id || "guest";
    const downloadUrl = `/api/backups/daily/download/${encodeURIComponent(backupId)}?userId=${encodeURIComponent(currentUserId)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `nexo_backup_${backupId}.json`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Initial load & automated daily backup runner effect
  useEffect(() => {
    refreshDailyBackups();

    // Check if daily backup was already made today
    const checkAndRunAutoDailyBackup = () => {
      try {
        const todayDateKey = new Date().toISOString().split("T")[0];
        const savedMeta = localStorage.getItem(storageKeys.DAILY_BACKUPS_META);
        let needsBackup = true;

        if (savedMeta) {
          const parsed = JSON.parse(savedMeta);
          if (parsed.dateKey === todayDateKey) {
            needsBackup = false;
          }
        }

        // Only run auto-backup if we have real content and haven't backed up today yet
        if (needsBackup && (editais.length > 0 || studySessions.length > 0)) {
          performDailyBackup(true);
        }
      } catch (e) {
        console.warn("[AUTO BACKUP CHECK]:", e);
      }
    };

    // Run after a short delay on mount so all states are settled
    const timeout = setTimeout(checkAndRunAutoDailyBackup, 4000);

    // Periodic check every 30 minutes for date rollover
    const interval = setInterval(checkAndRunAutoDailyBackup, 30 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user?.id, storageKeys.DAILY_BACKUPS_META]);

  const resetToInitialData = () => {
    clearAllUserData();
  };

  return (
    <StudyContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        userSettings,
        updateUserSettings,
        editais,
        activeEditalId,
        activeEdital,
        setActiveEditalId,
        createEdital,
        updateEdital,
        deleteEdital,
        addDiscipline,
        createDiscipline: addDiscipline,
        updateDiscipline,
        deleteDiscipline,
        addTopic,
        createTopic: addTopic,
        updateTopic,
        deleteTopic,
        toggleTopicStudied,
        toggleTopicReviewed,
        importVerticalizedData,
        importVerticalizedEdital: importVerticalizedData,
        studyPlans,
        activePlan,
        catalogEditais,
        isLoadingCatalog,
        refreshCatalogEditais,
        createStudyPlanFromCatalog,
        checkPlanForUpdates,
        globalTemplates,
        isLoadingTemplates,
        fetchGlobalTemplates,
        saveTemplateToCatalog,
        cloneTemplateToPlan,
        setActivePlanId: (id) =>
          setStudyPlans((prev) =>
            prev.map((p) => {
              const matches = p.id === id;
              if (matches) {
                setActiveEditalId(p.editalId);
              }
              return { ...p, active: matches };
            })
          ),
        createStudyPlan,
        updateStudyPlan,
        deleteStudyPlan,
        archiveStudyPlan,
        resetCycleProgress,
        advanceCycleStep,
        updateWeeklySchedule,
        cloneCatalogEditalAsPlan,
        applyOnboardingPlan,
        planImages,
        getPlanImageUrl,
        isPlanImageLoading,
        setPlanImageCache,
        refreshPlanImage,
        studySessions,
        logStudySession,
        deleteStudySession,
        deleteSelectedStudySessions,
        clearAllStudySessions,
        scheduledReviews,
        completeScheduledReview,
        createScheduledReview,
        rescheduleReview,
        deleteScheduledReview,
        updateScheduledReview,
        batchRescheduleOverdueReviews,
        clearAllScheduledReviews,
        pendingReviewsToday,
        overdueReviews,
        pendingReviewsCount: pendingReviewsToday.length,
        reminders,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminder,
        clearAllReminders,
        simulados,
        addSimulado,
        deleteSimulado,
        clearAllSimulados,
        timer,
        startTimer,
        pauseTimer,
        resetTimer,
        setTimerConfig,
        finishCurrentSession,
        launchStudySessionForTopic,
        metrics,
        dailyBackups,
        lastDailyBackupTime,
        isBackingUp,
        refreshDailyBackups,
        triggerManualDailyBackup,
        restoreDailyBackup,
        deleteDailyBackup,
        downloadDailyBackup,
        exportBackup,
        importBackup,
        resetEditalProgress,
        clearAllUserData,
        resetToInitialData,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
};
