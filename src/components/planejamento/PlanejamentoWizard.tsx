import React, { useState, useEffect, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import {
  PlanCreationMethod,
  PlanOrganization,
  PlanningMode,
  CycleStep,
  WeeklyScheduleBlock,
} from "../../types";
import {
  Sparkles,
  RotateCw,
  CalendarDays,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Layers,
  Check,
  Zap,
  Target,
  BarChart3,
  Calendar,
  Flame,
} from "lucide-react";

interface PlanejamentoWizardProps {
  onFinish?: () => void;
}

const PASTEL_COLORS = [
  "#2EC4B6",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#6366F1",
  "#14B8A6",
  "#F59E0B",
  "#06B6D4",
];

// Helper: Convert decimal hours (e.g. 1.5, 3) to "HH:MM" (e.g. "01:30", "03:00")
function decimalHoursToTimeString(hours: number): string {
  const totalMinutes = Math.round((Number(hours) || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Helper: Parse raw user input or HH:MM string to validated minutes & decimal hours
function parseTimeStringToDecimalHours(input: string): { decimalHours: number; formattedStr: string } {
  // Remove anything that is not a digit or colon
  const cleaned = input.replace(/[^\d:]/g, "");
  
  let hours = 0;
  let minutes = 0;

  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
  } else {
    // Digits only e.g. "0130", "90", "2"
    if (cleaned.length <= 2) {
      hours = parseInt(cleaned, 10) || 0;
      minutes = 0;
    } else if (cleaned.length === 3) {
      hours = parseInt(cleaned.slice(0, 1), 10) || 0;
      minutes = parseInt(cleaned.slice(1), 10) || 0;
    } else {
      hours = parseInt(cleaned.slice(0, 2), 10) || 0;
      minutes = parseInt(cleaned.slice(2, 4), 10) || 0;
    }
  }

  // Cap minutes and roll over if necessary
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }

  // Cap max hours per day at 24:00
  if (hours > 24 || (hours === 24 && minutes > 0)) {
    hours = 24;
    minutes = 0;
  }

  const decimalHours = hours + minutes / 60;
  const formattedStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return { decimalHours, formattedStr };
}

// Auto-masking as user types (e.g. typing "0130" -> "01:30")
function formatTimeStringOnType(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export const PlanejamentoWizard: React.FC<PlanejamentoWizardProps> = ({ onFinish }) => {
  const { activeEdital, activePlan, updateStudyPlan, setActiveTab } = useStudy();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [planningMode, setPlanningMode] = useState<PlanningMode>("CYCLE");
  const [creationMethod, setCreationMethod] = useState<PlanCreationMethod>("automatico");

  // Daily Availability (Hours per day in decimal)
  const [dailyAvailability, setDailyAvailability] = useState({
    seg: 3,
    ter: 3,
    qua: 3,
    qui: 3,
    sex: 3,
    sab: 4,
    dom: 1,
  });

  // Local string representation for input fields in HH:MM format
  const [dailyTimeStrings, setDailyTimeStrings] = useState<Record<string, string>>({
    seg: "03:00",
    ter: "03:00",
    qua: "03:00",
    qui: "03:00",
    sex: "03:00",
    sab: "04:00",
    dom: "01:00",
  });

  // Maximum duration per block (default 90 min)
  const [maxSessionMinutes, setMaxSessionMinutes] = useState<number>(90);
  const minSessionMinutes = 30;

  // Domain / Mastery config per discipline (1 to 5)
  const [priorityConfig, setPriorityConfig] = useState<
    Record<string, { importance: number; knowledgeLevel: number; enabled: boolean }>
  >({});

  const disciplines = activeEdital?.disciplines || [];

  // Initialize data from activePlan or default
  useEffect(() => {
    if (activePlan) {
      if (activePlan.planningMode) {
        setPlanningMode(activePlan.planningMode);
      } else if (activePlan.organizationType) {
        setPlanningMode(activePlan.organizationType === "semanal" ? "WEEKLY" : "CYCLE");
      }
      if (activePlan.creationMethod) setCreationMethod(activePlan.creationMethod);
      if (activePlan.dailyAvailability) {
        setDailyAvailability(activePlan.dailyAvailability);
        const timeStrings: Record<string, string> = {};
        Object.entries(activePlan.dailyAvailability).forEach(([dayKey, val]) => {
          timeStrings[dayKey] = decimalHoursToTimeString(Number(val) || 0);
        });
        setDailyTimeStrings(timeStrings);
      }
      if (activePlan.maxSessionMinutes) setMaxSessionMinutes(activePlan.maxSessionMinutes);

      const map: Record<string, { importance: number; knowledgeLevel: number; enabled: boolean }> = {};
      disciplines.forEach((d) => {
        const existing = activePlan.cycle.find((s) => s.disciplineId === d.id);
        map[d.id] = {
          importance: existing?.importance || (d.weight === 3 ? 5 : d.weight === 2 ? 3 : 2),
          knowledgeLevel: existing?.knowledgeLevel || 3,
          enabled: true,
        };
      });
      setPriorityConfig(map);
    } else {
      const map: Record<string, { importance: number; knowledgeLevel: number; enabled: boolean }> = {};
      disciplines.forEach((d) => {
        map[d.id] = {
          importance: d.weight === 3 ? 5 : d.weight === 2 ? 3 : 2,
          knowledgeLevel: 3,
          enabled: true,
        };
      });
      setPriorityConfig(map);
    }
  }, [activePlan, activeEdital]);

  const totalWeeklyHours = useMemo(() => {
    return (Object.values(dailyAvailability) as number[]).reduce(
      (a: number, b: number) => a + (Number(b) || 0),
      0
    );
  }, [dailyAvailability]);

  // AUTOMATIC MOTOR DE CÁLCULO
  const enabledDisciplines = useMemo(() => {
    return disciplines.filter((d) => priorityConfig[d.id]?.enabled !== false);
  }, [disciplines, priorityConfig]);

  const calculatedScores = useMemo(() => {
    return enabledDisciplines.map((disc) => {
      const config = priorityConfig[disc.id] || {
        importance: disc.weight === 3 ? 5 : disc.weight === 2 ? 3 : 2,
        knowledgeLevel: 3,
        enabled: true,
      };
      // Score calculation: Weight in exam (Importance) * (6 - Domain)
      const score = config.importance * (6 - config.knowledgeLevel);
      return {
        discipline: disc,
        importance: config.importance,
        knowledgeLevel: config.knowledgeLevel,
        score: Math.max(1, score),
      };
    });
  }, [enabledDisciplines, priorityConfig]);

  const totalScore = useMemo(() => {
    return calculatedScores.reduce((acc, item) => acc + item.score, 0) || 1;
  }, [calculatedScores]);

  // Exact minute distribution matching exactly 100% of total weekly hours
  const calculatedDistribution = useMemo(() => {
    const totalWeeklyMinutes = totalWeeklyHours * 60;
    if (calculatedScores.length === 0 || totalWeeklyMinutes === 0) return [];

    let distributedSum = 0;
    const items = calculatedScores.map((item, index) => {
      const weightPercentage = Math.round((item.score / totalScore) * 100);
      let totalMinutes = Math.round((item.score / totalScore) * totalWeeklyMinutes);

      // Avoid 0 minutes if discipline is enabled
      totalMinutes = Math.max(30, totalMinutes);
      distributedSum += totalMinutes;

      return {
        ...item,
        weightPercentage,
        totalMinutes,
      };
    });

    // Exact adjustment to ensure sum equals exactly totalWeeklyMinutes
    const diff = totalWeeklyMinutes - distributedSum;
    if (diff !== 0 && items.length > 0) {
      items[0].totalMinutes = Math.max(30, items[0].totalMinutes + diff);
    }

    return items.map((item) => {
      const hours = (item.totalMinutes / 60).toFixed(1);
      // Fragment large workloads into blocks of maxSessionMinutes (default 90 min)
      const idealBlock = Math.min(maxSessionMinutes || 90, 90);
      const blockCount = Math.max(1, Math.round(item.totalMinutes / idealBlock));
      const minutesPerBlock = Math.round(item.totalMinutes / blockCount);

      return {
        ...item,
        hours,
        blockCount,
        minutesPerBlock,
      };
    });
  }, [calculatedScores, totalScore, totalWeeklyHours, maxSessionMinutes]);

  // Generated Automated Cycle Steps (Interleaving subjects)
  const generatedCycle = useMemo(() => {
    if (calculatedDistribution.length === 0) return [];

    // Create pools of blocks
    const pools: Array<{ disciplineId: string; minutes: number; remaining: number }> =
      calculatedDistribution.map((d) => ({
        disciplineId: d.discipline.id,
        minutes: d.minutesPerBlock,
        remaining: d.blockCount,
      }));

    const result: CycleStep[] = [];
    let order = 1;
    let hasMore = true;

    while (hasMore) {
      hasMore = false;
      for (const pool of pools) {
        if (pool.remaining > 0) {
          hasMore = true;
          const disc = disciplines.find((d) => d.id === pool.disciplineId);
          const cfg = priorityConfig[pool.disciplineId];
          result.push({
            id: `step-auto-${order}-${Date.now()}`,
            disciplineId: pool.disciplineId,
            targetMinutes: pool.minutes,
            order,
            importance: cfg?.importance || (disc?.weight === 3 ? 5 : 3),
            knowledgeLevel: cfg?.knowledgeLevel || 3,
            weightPercentage: Math.round(
              ((cfg?.importance || 3) * (6 - (cfg?.knowledgeLevel || 3)) / totalScore) * 100
            ),
          });
          pool.remaining--;
          order++;
        }
      }
    }
    return result;
  }, [calculatedDistribution, disciplines, priorityConfig, totalScore]);

  // Generated Automated Weekly Schedule Blocks (Distributing across days respecting limits)
  const generatedWeeklySchedule = useMemo(() => {
    if (calculatedDistribution.length === 0 || generatedCycle.length === 0) return [];

    const days = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;
    const blocks: WeeklyScheduleBlock[] = [];
    let cycleIdx = 0;

    days.forEach((day) => {
      const dayHours = dailyAvailability[day] || 0;
      let dayMinutesLeft = dayHours * 60;
      let dayOrder = 1;

      while (dayMinutesLeft >= 20 && generatedCycle.length > 0) {
        const step = generatedCycle[cycleIdx % generatedCycle.length];
        const blockDuration = Math.min(step.targetMinutes, dayMinutesLeft);
        if (blockDuration < 20) break;

        blocks.push({
          id: `wb-auto-${day}-${dayOrder}-${Date.now()}`,
          day,
          disciplineId: step.disciplineId,
          targetMinutes: blockDuration,
          order: dayOrder,
        });

        dayMinutesLeft -= blockDuration;
        cycleIdx++;
        dayOrder++;
      }
    });

    return blocks;
  }, [calculatedDistribution, generatedCycle, dailyAvailability]);

  // Total allocated minutes calculated
  const totalAllocatedMinutes = useMemo(() => {
    if (planningMode === "CYCLE") {
      return generatedCycle.reduce((acc, s) => acc + s.targetMinutes, 0);
    }
    return generatedWeeklySchedule.reduce((acc, b) => acc + b.targetMinutes, 0);
  }, [planningMode, generatedCycle, generatedWeeklySchedule]);

  const totalAllocatedHours = (totalAllocatedMinutes / 60).toFixed(1);

  // Save & Apply Final Plan
  const handleSaveAndApply = () => {
    if (!activePlan) return;

    const organizationType: PlanOrganization = planningMode === "WEEKLY" ? "semanal" : "ciclo";

    updateStudyPlan(activePlan.id, {
      planningMode,
      organizationType,
      creationMethod,
      weeklyGoalHours: totalWeeklyHours,
      minSessionMinutes,
      maxSessionMinutes,
      dailyAvailability,
      cycle: generatedCycle.length > 0 ? generatedCycle : activePlan.cycle,
      weeklySchedule:
        generatedWeeklySchedule.length > 0 ? generatedWeeklySchedule : activePlan.weeklySchedule,
    });

    if (onFinish) {
      onFinish();
    } else {
      setActiveTab("planejamento");
    }
  };

  const stepsHeader = [
    { num: 1, label: "Formato" },
    { num: 2, label: "Horários" },
    { num: 3, label: "Disciplinas" },
    { num: 4, label: "Resumo" },
  ];

  // Helper colors for Mastery (1 to 5)
  const getKnowledgeButtonColor = (val: number, active: boolean) => {
    if (!active) {
      return "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-[#1E293B] dark:text-slate-400 dark:hover:bg-slate-800";
    }
    switch (val) {
      case 1:
        return "bg-rose-500 text-white font-semibold shadow-xs";
      case 2:
        return "bg-amber-500 text-white font-semibold shadow-xs";
      case 3:
        return "bg-amber-400 text-slate-900 font-semibold shadow-xs";
      case 4:
        return "bg-emerald-500 text-white font-semibold shadow-xs";
      case 5:
        return "bg-teal-600 text-white font-semibold shadow-xs";
      default:
        return "bg-[#F59E0B] text-white font-semibold shadow-xs";
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* ========================================================================= */}
      {/* TOP HEADER & STEPPER (MINIMALIST & ELEGANT)                               */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4.5 shadow-2xs backdrop-blur-xs dark:border-[#1E293B] dark:bg-[#0E131F]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#F59E0B]" />
              Assistente de Planejamento
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-[#F59E0B] dark:bg-amber-950/40 dark:text-amber-300">
              <Clock className="h-3.5 w-3.5" />
              <span>{totalWeeklyHours}h semanais</span>
            </span>
          </div>
        </div>

        {/* Minimalist Stepper */}
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-[#1E293B]">
          {stepsHeader.map((s, idx) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => s.num <= currentStep && setCurrentStep(s.num)}
                  disabled={s.num > currentStep}
                  className={`flex items-center gap-2 text-xs font-medium transition-all ${
                    isActive
                      ? "text-[#F59E0B] font-semibold dark:text-[#FBBF24]"
                      : isDone
                      ? "text-slate-700 dark:text-slate-300 hover:text-[#F59E0B]"
                      : "text-slate-400 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`flex h-5.5 w-5.5 items-center justify-center rounded-full text-[10px] font-bold transition ${
                      isActive
                        ? "bg-[#F59E0B] text-white shadow-xs"
                        : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-[#1E293B] dark:text-slate-400"
                    }`}
                  >
                    {isDone ? <Check className="h-3 w-3 stroke-[2.5]" /> : s.num}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < stepsHeader.length - 1 && (
                  <div
                    className={`h-[1px] flex-1 mx-3 transition-colors ${
                      currentStep > s.num
                        ? "bg-emerald-400"
                        : "bg-slate-200 dark:bg-[#1E293B]"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASSO 1: ESCOLHA DO FORMATO                                               */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-2xs dark:border-[#1E293B] dark:bg-[#0E131F]">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Escolha o formato dos estudos
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Opção 1: Ciclo de Estudos */}
            <div
              onClick={() => setPlanningMode("CYCLE")}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4.5 transition-all duration-200 ${
                planningMode === "CYCLE"
                  ? "border-[#F59E0B] bg-amber-50/30 ring-1 ring-[#F59E0B] dark:border-[#F59E0B] dark:bg-amber-500/10"
                  : "border-slate-200/90 bg-white hover:border-slate-300 dark:border-[#1E293B] dark:bg-[#090D16] dark:hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-[#F59E0B] dark:bg-amber-500/20">
                    <RotateCw className="h-4.5 w-4.5" />
                  </div>
                  <span className="rounded-md bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    Recomendado
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Ciclo de Estudos</span>
                    {planningMode === "CYCLE" && (
                      <CheckCircle2 className="h-4 w-4 text-[#F59E0B]" />
                    )}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Fila contínua e sequencial. Sem acúmulo de matéria caso surjam imprevistos.
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1E293B] space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Sessões de até 90 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Intercalação de matérias</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Opção 2: Grade Semanal */}
            <div
              onClick={() => setPlanningMode("WEEKLY")}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4.5 transition-all duration-200 ${
                planningMode === "WEEKLY"
                  ? "border-[#F59E0B] bg-amber-50/30 ring-1 ring-[#F59E0B] dark:border-[#F59E0B] dark:bg-amber-500/10"
                  : "border-slate-200/90 bg-white hover:border-slate-300 dark:border-[#1E293B] dark:bg-[#090D16] dark:hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                    <CalendarDays className="h-4.5 w-4.5" />
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-[#1E293B] dark:text-slate-300">
                    Grade Fixa
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Grade Semanal</span>
                    {planningMode === "WEEKLY" && (
                      <CheckCircle2 className="h-4 w-4 text-[#F59E0B]" />
                    )}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Disciplinas fixadas por dias da semana, de Segunda a Domingo.
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1E293B] space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Visão de calendário semanal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Distribuição fixa diária</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Avanço */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#E05E00] active:scale-95 transition cursor-pointer"
            >
              <span>Continuar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 2: DISPONIBILIDADE DIÁRIA                                           */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-2xs dark:border-[#1E293B] dark:bg-[#0E131F]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Disponibilidade por dia
              </h3>
            </div>

            <div className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-[#F59E0B] dark:bg-amber-950/40 dark:text-amber-300">
              Total: <strong>{totalWeeklyHours}h</strong>
            </div>
          </div>

          {/* 7 Days Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { key: "seg", label: "Segunda", short: "SEG" },
              { key: "ter", label: "Terça", short: "TER" },
              { key: "qua", label: "Quarta", short: "QUA" },
              { key: "qui", label: "Quinta", short: "QUI" },
              { key: "sex", label: "Sexta", short: "SEX" },
              { key: "sab", label: "Sábado", short: "SÁB" },
              { key: "dom", label: "Domingo", short: "DOM" },
            ].map((day) => {
              const currentStr =
                dailyTimeStrings[day.key] ??
                decimalHoursToTimeString(
                  dailyAvailability[day.key as keyof typeof dailyAvailability] || 0
                );

              const handleTimeChange = (raw: string) => {
                const masked = formatTimeStringOnType(raw);
                setDailyTimeStrings((prev) => ({ ...prev, [day.key]: masked }));

                if (masked.length >= 4) {
                  const parsed = parseTimeStringToDecimalHours(masked);
                  setDailyAvailability((prev) => ({
                    ...prev,
                    [day.key]: parsed.decimalHours,
                  }));
                }
              };

              const handleTimeBlur = () => {
                const parsed = parseTimeStringToDecimalHours(currentStr);
                setDailyTimeStrings((prev) => ({
                  ...prev,
                  [day.key]: parsed.formattedStr,
                }));
                setDailyAvailability((prev) => ({
                  ...prev,
                  [day.key]: parsed.decimalHours,
                }));
              };

              return (
                <div
                  key={day.key}
                  className="flex flex-col items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 transition hover:bg-slate-100/60 dark:border-[#1E293B] dark:bg-[#090D16]"
                >
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {day.short}
                  </span>
                  <div className="my-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="00:00"
                      maxLength={5}
                      value={currentStr}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      onBlur={handleTimeBlur}
                      className="w-16 rounded-lg border border-slate-200 bg-white py-1 text-center font-mono text-sm font-semibold text-slate-900 shadow-2xs focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-none dark:border-slate-700 dark:bg-[#0F172A] dark:text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-[#1E293B]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#E05E00] active:scale-95 transition cursor-pointer"
            >
              <span>Continuar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 3: DOMÍNIO DO EDITAL (1 A 5)                                        */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-2xs dark:border-[#1E293B] dark:bg-[#0E131F]">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nível de domínio por disciplina
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              1 = Básico • 5 = Avançado
            </span>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-slate-100 dark:divide-[#1E293B]">
            {disciplines.map((disc) => {
              const cfg = priorityConfig[disc.id] || {
                importance: disc.weight === 3 ? 5 : disc.weight === 2 ? 3 : 2,
                knowledgeLevel: 3,
                enabled: true,
              };
              const calc = calculatedDistribution.find((c) => c.discipline.id === disc.id);

              return (
                <div
                  key={disc.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5 transition ${
                    !cfg.enabled ? "opacity-35" : ""
                  }`}
                >
                  {/* Left: Disciplina */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={cfg.enabled}
                      onChange={(e) =>
                        setPriorityConfig({
                          ...priorityConfig,
                          [disc.id]: { ...cfg, enabled: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#F59E0B] focus:ring-0 cursor-pointer"
                    />
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: disc.color || "#F59E0B" }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {disc.name}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Nível 1..5 */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-[#090D16] border border-slate-200/60 dark:border-slate-800">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isSelected = cfg.knowledgeLevel === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            disabled={!cfg.enabled}
                            onClick={() =>
                              setPriorityConfig({
                                ...priorityConfig,
                                [disc.id]: { ...cfg, knowledgeLevel: val },
                              })
                            }
                            className={`h-6 w-6 rounded-md font-mono text-xs transition-all ${getKnowledgeButtonColor(
                              val,
                              isSelected
                            )}`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Carga */}
                  <div className="sm:text-right shrink-0">
                    {calc ? (
                      <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                        {calc.hours}h ({calc.weightPercentage}%)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-[#1E293B]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#E05E00] active:scale-95 transition cursor-pointer"
            >
              <span>Ver Resumo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 4: RESUMO & SALVAR                                                  */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-2xs dark:border-[#1E293B] dark:bg-[#0E131F]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Resumo do Planejamento
              </h3>
            </div>

            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:bg-[#090D16] dark:text-slate-200 border border-slate-200 dark:border-slate-800">
              {planningMode === "CYCLE" ? "Ciclo" : "Grade"} • {totalWeeklyHours}h
            </span>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {calculatedDistribution.map((item) => (
              <div
                key={item.discipline.id}
                className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-[#1E293B] dark:bg-[#090D16]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.discipline.color || "#F59E0B" }}
                    />
                    <span className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                      {item.discipline.name}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {item.weightPercentage}%
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {item.hours}h
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {item.blockCount} {item.blockCount === 1 ? "sessão" : "sessões"} (~{item.minutesPerBlock}m)
                  </span>
                </div>

                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    style={{
                      width: `${item.weightPercentage}%`,
                      backgroundColor: item.discipline.color || "#F59E0B",
                    }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-[#1E293B]">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ajustar</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndApply}
              className="flex items-center gap-2 rounded-xl bg-[#F59E0B] px-6 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#E05E00] active:scale-95 transition cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Salvar Planejamento</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
