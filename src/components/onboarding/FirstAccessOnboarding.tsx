import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useStudy } from "../../context/StudyContext";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingGroupFooter } from "./OnboardingGroupFooter";
import { OnboardingWatermarkBackground } from "./OnboardingWatermarkBackground";
import {
  OnboardingDraft,
  ObjectiveType,
  ConcursoArea,
  PreparationMoment,
  RoutineType,
  WeeklyAvailability,
  KnowledgeLevel,
  DisciplineWeightLevel,
  OrganizationPreference,
  StartDateOption,
  DisciplineDraftItem,
} from "./types";
import { Discipline, Topic, CatalogCargo } from "../../types";
import {
  fetchPublishedEditaisFromServer,
  PublishedEditalSnapshot,
} from "../../lib/serverCatalogService";
import {
  getFullCargoStructure,
  getEditalCargos,
  FullCargoSnapshot,
} from "../../lib/catalogEditalService";
import { buildPlanSchedule } from "../../lib/planScheduleEngine";

// Step Components
import { Step0Welcome } from "./steps/Step0Welcome";
import { Step1Objective } from "./steps/Step1Objective";
import { Step2Area } from "./steps/Step2Area";
import { Step3SpecificGoal } from "./steps/Step3SpecificGoal";
import { Step4ExamDate } from "./steps/Step4ExamDate";
import { Step5Moment } from "./steps/Step5Moment";
import { Step6Routine } from "./steps/Step6Routine";
import { Step7Availability } from "./steps/Step7Availability";
import { Step8Disciplines } from "./steps/Step8Disciplines";
import { Step8bWeights } from "./steps/Step8bWeights";
import { Step9Knowledge } from "./steps/Step9Knowledge";
import { Step10Organization } from "./steps/Step10Organization";
import { Step11StartDate } from "./steps/Step11StartDate";
import { StepProcessing } from "./steps/StepProcessing";

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  seg: { enabled: true, hours: 2, minutes: 0 },
  ter: { enabled: true, hours: 2, minutes: 0 },
  qua: { enabled: true, hours: 2, minutes: 0 },
  qui: { enabled: true, hours: 2, minutes: 0 },
  sex: { enabled: true, hours: 2, minutes: 0 },
  sab: { enabled: true, hours: 3, minutes: 0 },
  dom: { enabled: false, hours: 0, minutes: 0 },
};

const DISCIPLINE_COLORS = ["#58A6FF", "#2BBF8A", "#F4B544", "#8B5CF6", "#EC4899", "#06B6D4", "#FF7A1A"];

const normalizeKey = (v: string) =>
  (v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Compat: persisted steps from the previous 13-screen flow mapped into the new 6 sections.
const LEGACY_STEP_MAP: Record<number, number> = {
  0: 0,
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 6,
  9: 3,
  10: 4,
  11: 8,
  12: 8,
};

const normalizeStep = (step: unknown, savedDraft?: Partial<OnboardingDraft> | null): number => {
  if (typeof step !== "number" || !Number.isFinite(step)) return 0;

  // flowVersion 3+: escala 0–8 (Prioridades em duas etapas: disciplinas, depois pesos).
  if ((savedDraft?.flowVersion ?? 0) >= 3) {
    return Math.max(0, Math.min(8, Math.trunc(step)));
  }

  // flowVersion 2: escala antiga 0–7, onde 7 = Início (agora 8).
  if (savedDraft?.flowVersion === 2) {
    const s = Math.max(0, Math.min(7, Math.trunc(step)));
    return s >= 7 ? 8 : s;
  }

  // Existing records without the marker came from the previous 13-screen flow.
  return LEGACY_STEP_MAP[step] ?? 0;
};

export const FirstAccessOnboarding: React.FC = () => {
  const { user, logout, updateOnboardingStep, completeUserOnboarding } = useAuth();
  const { createEdital, createStudyPlan, setActivePlanId, catalogEditais } = useStudy();

  // Initialize draft from persisted user onboarding draft without undefined properties
  const initialDraft = useMemo<OnboardingDraft>(() => {
    const saved = user?.onboarding?.draft || user?.onboardingData || {};
    const d: OnboardingDraft = {
      organ: saved.organ || "",
      cargo: saved.cargo || "",
      banca: saved.banca || "",
      examDate: saved.examDate || "",
      availability: saved.availability || DEFAULT_AVAILABILITY,
      disciplines: Array.isArray(saved.disciplines) ? saved.disciplines : [],
      organization: saved.organization || "ciclo",
      startDateOption: saved.startDateOption || "hoje",
      customStartDate: saved.customStartDate || "",
      flowVersion: 3,
    };
    if (saved.objective) d.objective = saved.objective;
    if (saved.area) d.area = saved.area;
    if (typeof saved.knowsSpecificGoal === "boolean") d.knowsSpecificGoal = saved.knowsSpecificGoal;
    if (typeof saved.knowsExamDate === "boolean") d.knowsExamDate = saved.knowsExamDate;
    if (saved.preparationMoment) d.preparationMoment = saved.preparationMoment;
    if (saved.routineType) d.routineType = saved.routineType;
    if (saved.disciplinesMode) d.disciplinesMode = saved.disciplinesMode;
    return d;
  }, [user]);

  const [currentStep, setCurrentStep] = useState<number>(() =>
    normalizeStep(
      user?.onboarding?.currentStep,
      user?.onboarding?.draft || user?.onboardingData || {}
    )
  );

  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const draftRef = useRef<OnboardingDraft>(initialDraft);
  draftRef.current = draft;
  const [isProcessing, setIsProcessing] = useState(false);
  const [planWorkDone, setPlanWorkDone] = useState(false);

  // Sync draft if remote user state loads for the first time
  const lastSyncedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (user && user.id !== lastSyncedUserIdRef.current) {
      lastSyncedUserIdRef.current = user.id;
      if (user.onboarding?.draft || user.onboardingData) {
        setDraft(initialDraft);
        if (typeof user.onboarding?.currentStep === "number") {
          setCurrentStep(
            normalizeStep(
              user.onboarding.currentStep,
              user.onboarding.draft || user.onboardingData || {}
            )
          );
        }
      }
    }
  }, [user, initialDraft]);

  // Save progress helper
  const goToStep = async (nextStep: number, updatedDraft?: OnboardingDraft) => {
    const targetDraft = updatedDraft || draftRef.current;
    setCurrentStep(nextStep);
    setDraft(targetDraft);
    draftRef.current = targetDraft;
    if (updateOnboardingStep) {
      try {
        await updateOnboardingStep(nextStep, targetDraft);
      } catch (err) {
        console.error("[ONBOARDING] Erro ao salvar progresso:", err);
      }
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("[ONBOARDING] Erro ao sair da conta:", err);
    }
  };

  // Field update helpers without triggering synchronous render-phase side effects in parent components
  const updateDraft = (updates: Partial<OnboardingDraft>) => {
    setDraft((prev) => {
      const next: OnboardingDraft = { ...prev };
      for (const [key, val] of Object.entries(updates)) {
        if (val !== undefined) {
          (next as any)[key] = val;
        } else {
          delete (next as any)[key];
        }
      }
      draftRef.current = next;
      return next;
    });
  };

  // Debounced auto-save for edits within the current step (runs strictly outside render phase)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (updateOnboardingStep && user && !user.onboardingCompleted) {
        updateOnboardingStep(currentStep, draftRef.current).catch(() => {});
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [draft, currentStep, updateOnboardingStep, user]);

  // --- Edital catalog snapshot (published editais, com disciplinas embutidas) ---
  const [serverEditais, setServerEditais] = useState<PublishedEditalSnapshot[]>([]);
  useEffect(() => {
    let isMounted = true;
    fetchPublishedEditaisFromServer().then((list) => {
      if (isMounted) setServerEditais(list);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Localiza a lista completa de editais (servidor + espelho do Firestore)
  const allCatalogEditais = useMemo<PublishedEditalSnapshot[]>(() => {
    const seenIds = new Set(serverEditais.map((e) => e.id));
    const fallback = catalogEditais
      .filter((e) => !seenIds.has(e.id))
      .map((e) => ({ ...e }) as PublishedEditalSnapshot);
    return [...serverEditais, ...fallback].filter(
      (e) => (e.status || "published") === "published"
    );
  }, [serverEditais, catalogEditais]);

  // Estrutura completa do cargo selecionado no catálogo.
  // O catálogo do Firestore guarda cargos e disciplinas em SUBCOLEÇÕES
  // (catalogEditais/{edital}/cargos/{cargo}/disciplines) — o mesmo caminho
  // usado pelo wizard de planos. Editais publicados no servidor podem ter
  // cargos + disciplinas embutidos no snapshot.
  const [cargoStructure, setCargoStructure] = useState<FullCargoSnapshot | null>(null);
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      const organKey = normalizeKey(draft.organ || "");
      const cargoKey = normalizeKey(draft.cargo || "");
      if (!draft.catalogEditalId && !organKey) {
        setCargoStructure(null);
        return;
      }

      // Aceita apenas estruturas com disciplinas — evita estados vazios/parciais.
      const accept = (s?: FullCargoSnapshot | null): s is FullCargoSnapshot => {
        if (!s || !(s.disciplines || []).length || !isMounted) return false;
        const discs = [...s.disciplines]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((d) => ({ ...d, topics: d.topics || [] }));
        setCargoStructure({ ...s, disciplines: discs });
        return true;
      };

      // 1. Cargo selecionado diretamente no catálogo (ids salvos no rascunho)
      if (draft.catalogEditalId && draft.catalogCargoId) {
        if (
          accept(
            await getFullCargoStructure(draft.catalogEditalId, draft.catalogCargoId)
          )
        ) {
          return;
        }
      }

      // 2. Localizar o edital do catálogo (pelo id salvo ou pelo órgão)
      const edital =
        (draft.catalogEditalId &&
          allCatalogEditais.find((e) => e.id === draft.catalogEditalId)) ||
        (organKey
          ? allCatalogEditais.find(
              (e) => normalizeKey(e.institution || e.title) === organKey
            )
          : undefined);
      if (!edital) {
        if (isMounted) setCargoStructure(null);
        return;
      }

      // 3. Snapshot embutida (edital publicado no servidor, com disciplinas e tópicos)
      if (edital.cargos && edital.cargos.length > 0) {
        const cargo =
          (cargoKey && edital.cargos.find((c) => normalizeKey(c.name) === cargoKey)) ||
          edital.cargos[0];
        if (accept(cargo as FullCargoSnapshot | undefined)) return;
      }

      // 4. Catálogo do Firestore: resolver o cargo nas subcoleções
      const cargos: CatalogCargo[] = await getEditalCargos(edital.id);
      const orderedCargos = [
        ...(cargoKey ? cargos.filter((c) => normalizeKey(c.name) === cargoKey) : []),
        ...cargos,
      ];
      for (const cargo of orderedCargos) {
        if (accept(await getFullCargoStructure(edital.id, cargo.id))) return;
      }
      if (isMounted) setCargoStructure(null);
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [draft.catalogEditalId, draft.catalogCargoId, draft.organ, draft.cargo, allCatalogEditais]);

  // Disciplinas do edital selecionado — usadas nas etapas Momento e Prioridades
  const catalogDisciplines = useMemo(() => {
    if (!cargoStructure) return [];
    const discs = [...(cargoStructure.disciplines || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const hasWeights = discs.some((d) => typeof d.weight === "number" && d.weight > 0);
    return discs.map((d, idx) => ({
      id: `disc-cat-${draft.catalogEditalId || draft.organ}-${d.id}`,
      name: d.name,
      recommended: hasWeights ? (d.weight || 0) >= 3 : idx < 5,
      color: DISCIPLINE_COLORS[idx % DISCIPLINE_COLORS.length],
    }));
  }, [cargoStructure, draft.catalogEditalId, draft.organ]);

  // Toggle disciplina do edital na etapa Prioridades
  const handleToggleCatalogDiscipline = (item: { id: string; name: string }) => {
    const exists = (draft.disciplines || []).some((d) => d.id === item.id);
    if (exists) {
      updateDraft({ disciplines: (draft.disciplines || []).filter((d) => d.id !== item.id) });
    } else {
      updateDraft({
        disciplines: [
          ...(draft.disciplines || []),
          { id: item.id, name: item.name, knowledgeLevel: "nunca_estudei" as KnowledgeLevel },
        ],
      });
    }
  };

  const handleAddDiscipline = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newItem = {
      id: `disc-draft-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: trimmed,
      knowledgeLevel: "nunca_estudei" as KnowledgeLevel,
    };
    const nextDisciplines = [...(draft.disciplines || []), newItem];
    updateDraft({ disciplines: nextDisciplines });
  };

  const handleRemoveDiscipline = (id: string) => {
    const nextDisciplines = (draft.disciplines || []).filter((d) => d.id !== id);
    updateDraft({ disciplines: nextDisciplines });
  };

  // Upsert por id OU nome normalizado: rascunhos antigos com ids defasados
  // são atualizados (e ganham o id canônico) em vez de gerar entradas duplicadas.
  const upsertDraftDiscipline = (
    id: string,
    patch: { knowledgeLevel?: KnowledgeLevel; weightLevel?: DisciplineWeightLevel }
  ) => {
    const list = [...(draft.disciplines || [])];
    const fromCatalog = catalogDisciplines.find((c) => c.id === id);
    const nameKey = normalizeKey(fromCatalog?.name || id);
    const idx = list.findIndex(
      (d) => d.id === id || normalizeKey(d.name) === nameKey
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch, id, name: fromCatalog?.name || list[idx].name };
    } else {
      list.push({
        id,
        name: fromCatalog?.name || id,
        knowledgeLevel: "nunca_estudei" as KnowledgeLevel,
        ...patch,
      });
    }
    return list;
  };

  // Upsert do nível de conhecimento (disciplina pode ainda não estar no draft)
  const handleUpdateKnowledgeLevel = (id: string, level: KnowledgeLevel) => {
    updateDraft({ disciplines: upsertDraftDiscipline(id, { knowledgeLevel: level }) });
  };

  // Upsert do peso da disciplina (o edital continua completo no plano criado)
  const handleUpdateWeightLevel = (id: string, level: DisciplineWeightLevel) => {
    updateDraft({
      disciplines: upsertDraftDiscipline(id, { weightLevel: level }),
      weightsSkipped: false,
    });
  };

  const handleSkipWeights = () => {
    updateDraft({ weightsSkipped: true });
  };

  // Peso pré-preenchido: pesos do edital > nível de conhecimento > média
  const prefillWeightLevel = (disc: DisciplineDraftItem): DisciplineWeightLevel => {
    const explicit = (draft.disciplines || []).find((d) => d.id === disc.id);
    if (explicit?.weightLevel) return explicit.weightLevel;
    const fromCatalog = (cargoStructure?.disciplines || []).find(
      (cd) =>
        normalizeKey(cd.name) === normalizeKey(disc.name)
    );
    if (fromCatalog && typeof fromCatalog.weight === "number" && fromCatalog.weight > 0) {
      if (fromCatalog.weight >= 4) return "alta";
      if (fromCatalog.weight === 3) return "media";
      return "baixa";
    }
    switch (explicit?.knowledgeLevel) {
      case "muito_bom":
        return "muito_baixa";
      case "bom":
        return "baixa";
      case "pouco":
        return "alta";
      case "nunca_estudei":
        return "muito_alta";
      default:
        return "media";
    }
  };

  // Disciplinas exibidas nas etapas Momento e Pesos (do edital + adicionadas manualmente).
  // Agrupadas por nome normalizado: rascunhos antigos podem ter entradas com ids
  // defasados — o id canônico do catálogo prevalece e o nível/peso é preservado.
  const momentDisciplines = useMemo(() => {
    const byName = new Map<string, DisciplineDraftItem>();
    const put = (item: DisciplineDraftItem, canonicalId?: string) => {
      const key = normalizeKey(item.name);
      const existing = byName.get(key);
      if (existing) {
        byName.set(key, {
          ...existing,
          knowledgeLevel: item.knowledgeLevel || existing.knowledgeLevel,
          weightLevel: item.weightLevel || existing.weightLevel,
          ...(canonicalId ? { id: canonicalId } : {}),
        });
        return;
      }
      byName.set(key, canonicalId ? { ...item, id: canonicalId } : { ...item });
    };
    for (const d of draft.disciplines || []) put(d);
    for (const cat of catalogDisciplines) {
      put({ id: cat.id, name: cat.name, knowledgeLevel: "nunca_estudei" as KnowledgeLevel }, cat.id);
    }
    return Array.from(byName.values());
  }, [draft.disciplines, catalogDisciplines]);

  // Linhas da etapa de pesos (peso efetivo: escolhido ou pré-preenchido)
  const weightDisciplines = useMemo(
    () => momentDisciplines.map((d) => ({ ...d, weightLevel: prefillWeightLevel(d) })),
    [momentDisciplines, cargoStructure, draft.disciplines]
  );

  // Quantas disciplinas o plano criado terá (todas do edital + extras manuais)
  const plannedDisciplinesCount = useMemo(() => {
    const manualCount = (draft.disciplines || []).filter(
      (d) => !catalogDisciplines.some((c) => c.id === d.id)
    ).length;
    return (cargoStructure?.disciplines?.length || 0) + manualCount;
  }, [cargoStructure, draft.disciplines, catalogDisciplines]);

  // Format weekly availability
  const totalWeeklyMinutes = useMemo(() => {
    if (!draft.availability) return 0;
    const days = Object.values(draft.availability) as import("./types").DayAvailability[];
    return days.reduce((acc, day) => {
      if (!day.enabled) return acc;
      return acc + (day.hours || 0) * 60 + (day.minutes || 0);
    }, 0);
  }, [draft.availability]);

  // Final Action: Create Plan & Complete Onboarding
  const handleCreatePlan = async () => {
    setIsProcessing(true);

    try {
      // 1. Determine title
      const planTitle =
        draft.organ?.trim() ||
        draft.cargo?.trim() ||
        (draft.objective ? `Plano ${draft.objective}` : "Meu Plano de Estudos");

      // 2. Generate editalId upfront
      const editalId = `edital-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // 3. O plano traz TODAS as disciplinas e tópicos do edital selecionado,
      // mesmo que o usuário tenha marcado apenas algumas na etapa Prioridades.
      const colors = ["#58A6FF", "#2BBF8A", "#F4B544", "#8B5CF6", "#EC4899", "#06B6D4", "#F4B544"];
      const WEIGHT_NUMBERS: Record<DisciplineWeightLevel, number> = {
        muito_baixa: 1,
        baixa: 2,
        media: 3,
        alta: 4,
        muito_alta: 5,
      };
      const levelByKeyName = new Map<string, KnowledgeLevel>(
        (draft.disciplines || []).map((d) => [normalizeKey(d.name), d.knowledgeLevel])
      );
      const weightByKeyName = new Map<string, DisciplineWeightLevel>(
        (draft.disciplines || [])
          .filter((d) => !!d.weightLevel && !draft.weightsSkipped)
          .map((d) => [normalizeKey(d.name), d.weightLevel as DisciplineWeightLevel])
      );
      const catalogDiscs = [...(cargoStructure?.disciplines || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );

      const newDisciplines: Discipline[] = [];
      const newTopics: Topic[] = [];
      const resolveWeight = (name: string, catalogWeight?: number, level?: KnowledgeLevel) => {
        const draftWeight = weightByKeyName.get(normalizeKey(name));
        if (draftWeight) return WEIGHT_NUMBERS[draftWeight];
        if (catalogWeight && catalogWeight > 0) return catalogWeight;
        if (level === "nunca_estudei") return 3;
        return 2;
      };
      const pushDiscipline = (name: string, weight: number) => {
        const level = levelByKeyName.get(normalizeKey(name));
        const newDisc: Discipline = {
          id: `disc-${editalId}-${newDisciplines.length + 1}-${Math.random().toString(36).substr(2, 6)}`,
          editalId: editalId,
          name,
          color: colors[newDisciplines.length % colors.length],
          iconName: "BookOpen",
          priority: "media",
          difficulty: level === "muito_bom" || level === "bom" ? "facil" : "medio",
          weight,
          targetHours: 30,
          studiedHours: 0,
        };
        newDisciplines.push(newDisc);
        return newDisc;
      };

      catalogDiscs.forEach((cd) => {
        const level = levelByKeyName.get(normalizeKey(cd.name));
        const disc = pushDiscipline(cd.name, resolveWeight(cd.name, cd.weight, level));
        (cd.topics || []).forEach((ct) => {
          newTopics.push({
            id: `top-${editalId}-${newTopics.length + 1}`,
            disciplineId: disc.id,
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

      (draft.disciplines || []).forEach((disc) => {
        const fromCatalog = catalogDiscs.some(
          (cd) =>
            cd.id === disc.id ||
            normalizeKey(cd.name) === normalizeKey(disc.name)
        );
        if (!fromCatalog) {
          pushDiscipline(
            disc.name,
            resolveWeight(disc.name, undefined, disc.knowledgeLevel)
          );
        }
      });

      // Linhagem e logo do edital do catálogo selecionado (quando houver)
      const catalogEdital = draft.catalogEditalId
        ? allCatalogEditais.find((e) => e.id === draft.catalogEditalId)
        : undefined;

      // Create associated Edital with disciplines populated
      const createdEdital = await createEdital({
        id: editalId,
        title: planTitle,
        organ: draft.organ?.trim() || draft.area || draft.objective || "Geral",
        cargo: draft.cargo?.trim() || undefined,
        banca: draft.banca?.trim() || "A definir",
        year: new Date().getFullYear(),
        disciplines: newDisciplines,
        topics: newTopics,
        imageUrl: catalogEdital?.logoDataUrl || catalogEdital?.logoUrl,
        sourceEditalId: draft.catalogEditalId,
        sourceCargoId: draft.catalogCargoId,
        sourceEditalVersion: catalogEdital?.version,
      });

      // 4. Resolve dates
      const now = new Date();
      let resolvedStartDate = now.toISOString().split("T")[0];
      if (draft.startDateOption === "amanha") {
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        resolvedStartDate = tomorrow.toISOString().split("T")[0];
      } else if (draft.startDateOption === "custom" && draft.customStartDate) {
        resolvedStartDate = draft.customStartDate;
      }

      // 5. Daily availability map
      const dailyMap = {
        seg: draft.availability?.seg.enabled ? draft.availability.seg.hours + draft.availability.seg.minutes / 60 : 0,
        ter: draft.availability?.ter.enabled ? draft.availability.ter.hours + draft.availability.ter.minutes / 60 : 0,
        qua: draft.availability?.qua.enabled ? draft.availability.qua.hours + draft.availability.qua.minutes / 60 : 0,
        qui: draft.availability?.qui.enabled ? draft.availability.qui.hours + draft.availability.qui.minutes / 60 : 0,
        sex: draft.availability?.sex.enabled ? draft.availability.sex.hours + draft.availability.sex.minutes / 60 : 0,
        sab: draft.availability?.sab.enabled ? draft.availability.sab.hours + draft.availability.sab.minutes / 60 : 0,
        dom: draft.availability?.dom.enabled ? draft.availability.dom.hours + draft.availability.dom.minutes / 60 : 0,
      };

      // 5b. Planejamento semanal + ciclo gerados com o mesmo motor do
      // Planejamento (importância × (6 − conhecimento)), para o plano já
      // nascer com a agenda preenchida.
      const KNOWLEDGE_NUMBERS: Record<KnowledgeLevel, number> = {
        nunca_estudei: 1,
        pouco: 2,
        intermediario: 3,
        bom: 4,
        muito_bom: 5,
      };
      const scheduleEngine = buildPlanSchedule({
        disciplines: newDisciplines.map((d) => ({
          id: d.id,
          name: d.name,
          importance: d.weight,
          knowledgeLevel:
            KNOWLEDGE_NUMBERS[levelByKeyName.get(normalizeKey(d.name)) || "intermediario"],
        })),
        dailyAvailability: dailyMap as Record<string, number>,
        minSessionMinutes: 30,
        maxSessionMinutes: 90,
      });

      const weeklyGoal = scheduleEngine.weeklyGoalHours || Math.max(2, Math.round(totalWeeklyMinutes / 60));

      // 6. Create study plan
      const newPlan = await createStudyPlan({
        name: planTitle,
        editalId: createdEdital.id,
        organ: draft.organ?.trim() || draft.area || draft.objective || undefined,
        cargo: draft.cargo?.trim() || undefined,
        weeklyGoalHours: weeklyGoal,
        active: true,
        organizationType: draft.organization === "semanal" ? "semanal" : "ciclo",
        planningMode: draft.organization === "semanal" ? "WEEKLY" : "CYCLE",
        cycle:
          scheduleEngine.cycle.length > 0
            ? scheduleEngine.cycle
            : newDisciplines.map((d, idx) => ({
                id: `step-${idx + 1}`,
                disciplineId: d.id,
                targetMinutes: d.weight === 3 ? 90 : 60,
                order: idx + 1,
              })),
        weeklySchedule: scheduleEngine.weeklySchedule,
        currentCycleIndex: 0,
        currentStepElapsedMinutes: 0,
        completedCycles: 0,
        minSessionMinutes: 30,
        maxSessionMinutes: 90,
        dailyAvailability: dailyMap,
        targetExamDate: draft.knowsExamDate && draft.examDate ? draft.examDate : undefined,
        startDate: resolvedStartDate,
      });

      // Set as active plan
      setActivePlanId(newPlan.id);
    } catch (err) {
      console.error("[ONBOARDING] Erro ao criar plano inicial:", err);
    } finally {
      // A tela "Montando seu plano" conclui o onboarding ao final (~20s)
      setPlanWorkDone(true);
    }
  };

  // Conclusão do onboarding após a tela de processamento terminar
  const handleProcessingFinished = async () => {
    try {
      await completeUserOnboarding();
    } catch (err) {
      console.error("[ONBOARDING] Erro ao concluir onboarding:", err);
      // Fallback: tenta novamente para não prender o usuário na tela
      try {
        await completeUserOnboarding();
      } catch {
        // mantém o usuário na tela; pode tentar novamente recarregando
      }
    }
  };

  // --- Section navigation & gating (6 sections) ---
  const canContinueObjetivo =
    !!draft.objective &&
    (draft.objective !== "Concurso Público" || !!draft.area);

  const canContinueConcurso =
    (draft.knowsSpecificGoal === false ||
      (draft.knowsSpecificGoal === true &&
        (!!draft.organ?.trim() || !!draft.cargo?.trim()))) &&
    ((draft.knowsExamDate === false ||
      (draft.knowsExamDate === true && !!draft.examDate)));

  const showMomentDisciplines =
    !!draft.preparationMoment &&
    draft.preparationMoment !== "Estou começando agora" &&
    momentDisciplines.length > 0;

  const canContinueRotina = !!draft.routineType && !!draft.organization;

  const canContinueDisponibilidade = totalWeeklyMinutes > 0;

  const canContinueInicio =
    draft.startDateOption === "hoje" ||
    draft.startDateOption === "amanha" ||
    (draft.startDateOption === "custom" && !!draft.customStartDate);

  const handleBack = () => {
    if (currentStep <= 0) return;
    goToStep(currentStep - 1);
  };

  return (
    <div
      id="first-access-onboarding-screen"
      className="relative w-full min-h-screen bg-[#0B1120] text-white flex flex-col font-sans overflow-x-hidden"
    >
      {/* Watermark decorative layer (opacity 5-8%, pointer-events-none) */}
      <OnboardingWatermarkBackground />

      {/* Top Header Bar */}
      <header
        id="onboarding-header"
        className="relative z-20 w-full flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#1C2940]"
      >
        {/* Left: Back button or Logo */}
        <div className="flex items-center gap-3">
          {currentStep > 0 && !isProcessing && (
            <button
              type="button"
              id="btn-onboarding-back"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#527DFF] hover:bg-[#FF7A1A] text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <img
              src="/nexo-logo.png"
              alt="NEXO"
              className="w-7 h-7 rounded-lg object-cover"
              draggable={false}
            />
            <span className="text-base font-bold tracking-tight text-white">
              NEXO
            </span>
          </div>
        </div>

        {/* Right: Sair da conta */}
        {!isProcessing && (
          <button
            id="btn-onboarding-logout"
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#527DFF] hover:bg-[#FF7A1A] text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
            title="Sair da sua conta"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair da conta</span>
          </button>
        )}
      </header>

      {/* Section progress (6 labeled segments) */}
      <OnboardingProgress currentStep={currentStep} />

      {/* Question Container (One section per screen) */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center w-full px-4 py-6 sm:py-10">
        {isProcessing ? (
          <StepProcessing
            planName={draft.cargo?.trim() || draft.organ?.trim() || "seu objetivo"}
            disciplinesCount={plannedDisciplinesCount}
            workDone={planWorkDone}
            onFinished={handleProcessingFinished}
          />
        ) : (
          <div className="w-full max-w-3xl mx-auto">
            {currentStep === 0 && (
              <Step0Welcome onStart={() => goToStep(1)} />
            )}

            {/* 1. Objetivo */}
            {currentStep === 1 && (
              <>
                <Step1Objective
                  value={draft.objective}
                  onChange={(obj: ObjectiveType) => updateDraft({ objective: obj })}
                />
                {draft.objective === "Concurso Público" && (
                  <div className="mt-8 pt-6 border-t border-[#1C2940]">
                    <Step2Area
                      value={draft.area}
                      onChange={(area: ConcursoArea) => updateDraft({ area })}
                    />
                  </div>
                )}
                <OnboardingGroupFooter
                  onNext={() => goToStep(2)}
                  disabled={!canContinueObjetivo}
                />
              </>
            )}

            {/* 2. Concurso */}
            {currentStep === 2 && (
              <>
                <Step3SpecificGoal
                  knowsSpecificGoal={draft.knowsSpecificGoal}
                  organ={draft.organ}
                  cargo={draft.cargo}
                  banca={draft.banca}
                  selectedEditalId={draft.catalogEditalId}
                  selectedCargoId={draft.catalogCargoId}
                  onChangeGoalKnown={(known: boolean) => updateDraft({ knowsSpecificGoal: known })}
                  onChangeOrgan={(organ: string) => updateDraft({ organ })}
                  onChangeCargo={(cargo: string) => updateDraft({ cargo })}
                  onChangeBanca={(banca: string) => updateDraft({ banca })}
                  onChangeCatalogSelection={(editalId, cargoId) =>
                    updateDraft({ catalogEditalId: editalId, catalogCargoId: cargoId })
                  }
                  onNext={() => {}}
                />
                <div className="mt-8 pt-6 border-t border-[#1C2940]">
                  <Step4ExamDate
                    knowsExamDate={draft.knowsExamDate}
                    examDate={draft.examDate}
                    onChangeExamDateKnown={(known: boolean) => updateDraft({ knowsExamDate: known })}
                    onChangeExamDate={(date: string) => updateDraft({ examDate: date })}
                  />
                </div>
                <OnboardingGroupFooter
                  onNext={() => goToStep(3)}
                  disabled={!canContinueConcurso}
                />
              </>
            )}

            {/* 3. Momento */}
            {currentStep === 3 && (
              <>
                <Step5Moment
                  value={draft.preparationMoment}
                  onChange={(mom: PreparationMoment) => updateDraft({ preparationMoment: mom })}
                />
                {showMomentDisciplines && (
                  <div className="mt-8 pt-6 border-t border-[#1C2940]">
                    <Step9Knowledge
                      disciplines={momentDisciplines}
                      onChangeLevel={handleUpdateKnowledgeLevel}
                    />
                  </div>
                )}
                <OnboardingGroupFooter
                  onNext={() => goToStep(4)}
                  disabled={!draft.preparationMoment}
                />
              </>
            )}

            {/* 4. Rotina (tipo + organização) */}
            {currentStep === 4 && (
              <>
                <Step6Routine
                  value={draft.routineType}
                  onChange={(rout: RoutineType) => updateDraft({ routineType: rout })}
                />
                <div className="mt-8 pt-6 border-t border-[#1C2940]">
                  <Step10Organization
                    value={draft.organization}
                    onChange={(org: OrganizationPreference) => updateDraft({ organization: org })}
                  />
                </div>
                <OnboardingGroupFooter
                  onNext={() => goToStep(5)}
                  disabled={!canContinueRotina}
                />
              </>
            )}

            {/* 5. Disponibilidade (segunda etapa da Rotina) */}
            {currentStep === 5 && (
              <>
                <Step7Availability
                  value={draft.availability || DEFAULT_AVAILABILITY}
                  onChange={(avail: WeeklyAvailability) => updateDraft({ availability: avail })}
                />
                <OnboardingGroupFooter
                  onNext={() => goToStep(6)}
                  disabled={!canContinueDisponibilidade}
                />
              </>
            )}

            {/* 6. Prioridades — etapa 1: disciplinas */}
            {currentStep === 6 && (
              <>
                <Step8Disciplines
                  disciplines={draft.disciplines || []}
                  catalogDisciplines={catalogDisciplines}
                  onToggleCatalogDiscipline={handleToggleCatalogDiscipline}
                  onAddDiscipline={handleAddDiscipline}
                  onRemoveDiscipline={handleRemoveDiscipline}
                />
                <OnboardingGroupFooter
                  onNext={() =>
                    goToStep(weightDisciplines.length > 0 ? 7 : 8)
                  }
                />
              </>
            )}

            {/* 6. Prioridades — etapa 2: pesos (mesmo segmento na barra) */}
            {currentStep === 7 && (
              <>
                {weightDisciplines.length > 0 && (
                  <Step8bWeights
                    disciplines={weightDisciplines}
                    skipped={draft.weightsSkipped}
                    onChangeLevel={handleUpdateWeightLevel}
                    onChangeKnowledgeLevel={handleUpdateKnowledgeLevel}
                    onSkip={handleSkipWeights}
                  />
                )}
                <OnboardingGroupFooter onNext={() => goToStep(8)} />
              </>
            )}

            {/* 7. Início */}
            {currentStep === 8 && (
              <>
                <Step11StartDate
                  value={draft.startDateOption}
                  customDate={draft.customStartDate}
                  onChangeOption={(opt: StartDateOption) => updateDraft({ startDateOption: opt })}
                  onChangeCustomDate={(date: string) => updateDraft({ customStartDate: date })}
                />
                <OnboardingGroupFooter
                  onNext={handleCreatePlan}
                  disabled={!canContinueInicio}
                  label="Criar meu plano"
                  isLoading={isProcessing}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
