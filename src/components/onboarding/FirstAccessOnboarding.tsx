import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useStudy } from "../../context/StudyContext";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingWatermarkBackground } from "./OnboardingWatermarkBackground";
import {
  OnboardingDraft,
  ObjectiveType,
  ConcursoArea,
  PreparationMoment,
  RoutineType,
  WeeklyAvailability,
  KnowledgeLevel,
  OrganizationPreference,
  StartDateOption,
} from "./types";
import { Discipline } from "../../types";

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
import { Step9Knowledge } from "./steps/Step9Knowledge";
import { Step10Organization } from "./steps/Step10Organization";
import { Step11StartDate } from "./steps/Step11StartDate";
import { Step12Summary } from "./steps/Step12Summary";
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

export const FirstAccessOnboarding: React.FC = () => {
  const { user, logout, updateOnboardingStep, completeUserOnboarding } = useAuth();
  const { createEdital, createStudyPlan, setActivePlanId } = useStudy();

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

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const step = user?.onboarding?.currentStep;
    return typeof step === "number" && step >= 0 && step <= 12 ? step : 0;
  });

  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const draftRef = useRef<OnboardingDraft>(initialDraft);
  draftRef.current = draft;
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync draft if remote user state loads for the first time
  const lastSyncedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (user && user.id !== lastSyncedUserIdRef.current) {
      lastSyncedUserIdRef.current = user.id;
      if (user.onboarding?.draft || user.onboardingData) {
        setDraft(initialDraft);
        if (typeof user.onboarding?.currentStep === "number") {
          setCurrentStep(user.onboarding.currentStep);
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

  // --- Step Navigation & Dynamic Skip Logic ---
  const handleNextFromWelcome = () => {
    goToStep(1);
  };

  const handleNextFromObjective = () => {
    if (draft.objective === "Concurso Público") {
      goToStep(2);
    } else {
      goToStep(3); // Skip Area for non-concurso
    }
  };

  const handleNextFromArea = () => {
    goToStep(3);
  };

  const handleNextFromSpecificGoal = () => {
    goToStep(4);
  };

  const handleNextFromExamDate = () => {
    goToStep(5);
  };

  const handleNextFromMoment = () => {
    goToStep(6);
  };

  const handleNextFromRoutine = () => {
    goToStep(7);
  };

  const handleNextFromAvailability = () => {
    goToStep(8);
  };

  const handleNextFromDisciplines = () => {
    if (draft.disciplinesMode === "adicionar" && draft.disciplines && draft.disciplines.length > 0) {
      goToStep(9);
    } else {
      goToStep(10); // Skip Knowledge level step if 0 disciplines
    }
  };

  const handleNextFromKnowledge = () => {
    goToStep(10);
  };

  const handleNextFromOrganization = () => {
    goToStep(11);
  };

  const handleNextFromStartDate = () => {
    goToStep(12);
  };

  // Back button handler with inverse skip logic
  const handleBack = () => {
    if (currentStep <= 0) return;

    if (currentStep === 3) {
      if (draft.objective === "Concurso Público") {
        goToStep(2);
      } else {
        goToStep(1);
      }
      return;
    }

    if (currentStep === 10) {
      if (draft.disciplines && draft.disciplines.length > 0) {
        goToStep(9);
      } else {
        goToStep(8);
      }
      return;
    }

    goToStep(currentStep - 1);
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

  const handleUpdateKnowledgeLevel = (id: string, level: KnowledgeLevel) => {
    const nextDisciplines = (draft.disciplines || []).map((d) =>
      d.id === id ? { ...d, knowledgeLevel: level } : d
    );
    updateDraft({ disciplines: nextDisciplines });
  };

  // Format weekly availability
  const totalWeeklyMinutes = useMemo(() => {
    if (!draft.availability) return 0;
    const days = Object.values(draft.availability) as import("./types").DayAvailability[];
    return days.reduce((acc, day) => {
      if (!day.enabled) return acc;
      return acc + (day.hours || 0) * 60 + (day.minutes || 0);
    }, 0);
  }, [draft.availability]);

  const weeklyHoursFormatted = useMemo(() => {
    const h = Math.floor(totalWeeklyMinutes / 60);
    const m = totalWeeklyMinutes % 60;
    return `${h}h${m > 0 ? String(m).padStart(2, "0") : "00"}`;
  }, [totalWeeklyMinutes]);

  // Format start date
  const startDateFormatted = useMemo(() => {
    if (draft.startDateOption === "amanha") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return `Amanhã (${d.toLocaleDateString("pt-BR")})`;
    }
    if (draft.startDateOption === "custom" && draft.customStartDate) {
      const parts = draft.customStartDate.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return draft.customStartDate;
    }
    return `Hoje (${new Date().toLocaleDateString("pt-BR")})`;
  }, [draft.startDateOption, draft.customStartDate]);

  // Format exam date
  const examDateFormatted = useMemo(() => {
    if (!draft.knowsExamDate || !draft.examDate) return undefined;
    const parts = draft.examDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return draft.examDate;
  }, [draft.knowsExamDate, draft.examDate]);

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

      // 3. Map user entered disciplines into real Discipline models
      const colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];
      const newDisciplines: Discipline[] = (draft.disciplines || []).map((disc, idx) => ({
        id: `disc-${editalId}-${idx + 1}-${Math.random().toString(36).substr(2, 6)}`,
        editalId: editalId,
        name: disc.name,
        color: colors[idx % colors.length],
        iconName: "BookOpen",
        priority: "media",
        difficulty: disc.knowledgeLevel === "muito_bom" || disc.knowledgeLevel === "bom" ? "facil" : "medio",
        weight: disc.knowledgeLevel === "nunca_estudei" ? 3 : 2,
        targetHours: 30,
        studiedHours: 0,
      }));

      // Create associated Edital with disciplines populated
      const createdEdital = await createEdital({
        id: editalId,
        title: planTitle,
        organ: draft.organ?.trim() || draft.area || draft.objective || "Geral",
        cargo: draft.cargo?.trim() || undefined,
        banca: draft.banca?.trim() || "A definir",
        year: new Date().getFullYear(),
        disciplines: newDisciplines,
        topics: [],
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

      const weeklyGoal = Math.max(2, Math.round(totalWeeklyMinutes / 60));

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
        dailyAvailability: dailyMap,
        targetExamDate: draft.knowsExamDate && draft.examDate ? draft.examDate : undefined,
        startDate: resolvedStartDate,
      });

      // Set as active plan
      setActivePlanId(newPlan.id);

      // 7. Persist completion in AuthContext & Firestore
      await completeUserOnboarding();
    } catch (err) {
      console.error("[ONBOARDING] Erro ao criar plano inicial:", err);
      // Fallback: still complete onboarding to avoid trapping user
      await completeUserOnboarding();
    }
  };

  return (
    <div
      id="first-access-onboarding-screen"
      className="relative w-full min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans overflow-x-hidden"
    >
      {/* 1. Discreet top progress bar */}
      <OnboardingProgress currentStep={currentStep} totalSteps={12} />

      {/* 2. Watermark decorative layer (opacity 5-8%, pointer-events-none) */}
      <OnboardingWatermarkBackground />

      {/* 3. Top Header Bar */}
      <header
        id="onboarding-header"
        className="relative z-20 w-full flex items-center justify-between px-4 sm:px-8 py-4 border-b border-zinc-800/40"
      >
        {/* Left: Back button or Logo */}
        <div className="flex items-center gap-3">
          {currentStep > 0 && !isProcessing && (
            <button
              type="button"
              id="btn-onboarding-back"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#E05300] flex items-center justify-center shadow-[0_0_12px_rgba(255,107,0,0.3)]">
              <span className="font-black text-xs text-white">N</span>
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              NEXO<span className="text-[#FF6B00]">.</span>
            </span>
          </div>
        </div>

        {/* Center: Discreet Step indicator (Desktop) */}
        {currentStep > 0 && currentStep <= 12 && !isProcessing && (
          <div className="hidden sm:block text-xs font-mono text-zinc-400">
            Passo {currentStep} de 12
          </div>
        )}

        {/* Right: Sair da conta */}
        {!isProcessing && (
          <button
            id="btn-onboarding-logout"
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 transition-colors cursor-pointer"
            title="Sair da sua conta"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair da conta</span>
          </button>
        )}
      </header>

      {/* 4. Question Container (One main question per screen) */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center w-full px-4 py-6 sm:py-10">
        {isProcessing ? (
          <StepProcessing onFinished={() => {}} />
        ) : (
          <>
            {currentStep === 0 && (
              <Step0Welcome onStart={handleNextFromWelcome} />
            )}

            {currentStep === 1 && (
              <Step1Objective
                value={draft.objective}
                onChange={(obj: ObjectiveType) => updateDraft({ objective: obj })}
                onNext={handleNextFromObjective}
              />
            )}

            {currentStep === 2 && (
              <Step2Area
                value={draft.area}
                onChange={(area: ConcursoArea) => updateDraft({ area })}
                onNext={handleNextFromArea}
              />
            )}

            {currentStep === 3 && (
              <Step3SpecificGoal
                knowsSpecificGoal={draft.knowsSpecificGoal}
                organ={draft.organ}
                cargo={draft.cargo}
                banca={draft.banca}
                onChangeGoalKnown={(known: boolean) => updateDraft({ knowsSpecificGoal: known })}
                onChangeOrgan={(organ: string) => updateDraft({ organ })}
                onChangeCargo={(cargo: string) => updateDraft({ cargo })}
                onChangeBanca={(banca: string) => updateDraft({ banca })}
                onNext={handleNextFromSpecificGoal}
              />
            )}

            {currentStep === 4 && (
              <Step4ExamDate
                knowsExamDate={draft.knowsExamDate}
                examDate={draft.examDate}
                onChangeExamDateKnown={(known: boolean) => updateDraft({ knowsExamDate: known })}
                onChangeExamDate={(date: string) => updateDraft({ examDate: date })}
                onNext={handleNextFromExamDate}
              />
            )}

            {currentStep === 5 && (
              <Step5Moment
                value={draft.preparationMoment}
                onChange={(mom: PreparationMoment) => updateDraft({ preparationMoment: mom })}
                onNext={handleNextFromMoment}
              />
            )}

            {currentStep === 6 && (
              <Step6Routine
                value={draft.routineType}
                onChange={(rout: RoutineType) => updateDraft({ routineType: rout })}
                onNext={handleNextFromRoutine}
              />
            )}

            {currentStep === 7 && (
              <Step7Availability
                value={draft.availability || DEFAULT_AVAILABILITY}
                onChange={(avail: WeeklyAvailability) => updateDraft({ availability: avail })}
                onNext={handleNextFromAvailability}
              />
            )}

            {currentStep === 8 && (
              <Step8Disciplines
                disciplinesMode={draft.disciplinesMode}
                disciplines={draft.disciplines || []}
                onChangeMode={(mode) => updateDraft({ disciplinesMode: mode })}
                onAddDiscipline={handleAddDiscipline}
                onRemoveDiscipline={handleRemoveDiscipline}
                onNext={handleNextFromDisciplines}
              />
            )}

            {currentStep === 9 && (
              <Step9Knowledge
                disciplines={draft.disciplines || []}
                onChangeLevel={handleUpdateKnowledgeLevel}
                onNext={handleNextFromKnowledge}
              />
            )}

            {currentStep === 10 && (
              <Step10Organization
                value={draft.organization}
                onChange={(org: OrganizationPreference) => updateDraft({ organization: org })}
                onNext={handleNextFromOrganization}
              />
            )}

            {currentStep === 11 && (
              <Step11StartDate
                value={draft.startDateOption}
                customDate={draft.customStartDate}
                onChangeOption={(opt: StartDateOption) => updateDraft({ startDateOption: opt })}
                onChangeCustomDate={(date: string) => updateDraft({ customStartDate: date })}
                onNext={handleNextFromStartDate}
              />
            )}

            {currentStep === 12 && (
              <Step12Summary
                draft={draft}
                weeklyHoursFormatted={weeklyHoursFormatted}
                startDateFormatted={startDateFormatted}
                examDateFormatted={examDateFormatted}
                onCreatePlan={handleCreatePlan}
                isCreating={isProcessing}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
