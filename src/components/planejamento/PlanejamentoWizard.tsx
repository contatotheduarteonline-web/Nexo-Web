import React, { useState, useEffect, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import {
  PlanCreationMethod,
  PlanOrganization,
  PlanningMode,
  CycleStep,
  WeeklyScheduleBlock,
} from "../../types";
import { PASTEL_COLORS } from "./planShared";
import {
  RotateCw,
  CalendarDays,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  HelpCircle,
} from "lucide-react";

interface PlanejamentoWizardProps {
  onFinish?: () => void;
}

// ---------- Time input helpers ----------
function decimalHoursToTimeString(hours: number): string {
  const totalMinutes = Math.round((Number(hours) || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeStringToDecimalHours(
  input: string
): { decimalHours: number; formattedStr: string } {
  const cleaned = input.replace(/[^\d:]/g, "");
  let hours = 0;
  let minutes = 0;

  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
  } else {
    if (cleaned.length <= 2) {
      hours = parseInt(cleaned, 10) || 0;
    } else if (cleaned.length === 3) {
      hours = parseInt(cleaned.slice(0, 1), 10) || 0;
      minutes = parseInt(cleaned.slice(1), 10) || 0;
    } else {
      hours = parseInt(cleaned.slice(0, 2), 10) || 0;
      minutes = parseInt(cleaned.slice(2, 4), 10) || 0;
    }
  }

  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }
  if (hours > 24 || (hours === 24 && minutes > 0)) {
    hours = 24;
    minutes = 0;
  }

  const decimalHours = hours + minutes / 60;
  const formattedStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return { decimalHours, formattedStr };
}

function formatTimeStringOnType(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

const STEPS = [
  { num: 1, label: "Organização" },
  { num: 2, label: "Disciplinas" },
  { num: 3, label: "Relevância" },
  { num: 4, label: "Horários" },
];

const DAY_ROWS = [
  { key: "dom", label: "DOM" },
  { key: "seg", label: "SEG" },
  { key: "ter", label: "TER" },
  { key: "qua", label: "QUA" },
  { key: "qui", label: "QUI" },
  { key: "sex", label: "SEX" },
  { key: "sab", label: "SÁB" },
] as const;

const MIN_OPTIONS = [
  { label: "30min", value: 30 },
  { label: "45min", value: 45 },
  { label: "1h", value: 60 },
];

const MAX_OPTIONS = [
  { label: "1h", value: 60 },
  { label: "1h30min", value: 90 },
  { label: "2h", value: 120 },
];

// Simple stylized kanban-board illustration for the choice screen
const KanbanIllustration: React.FC = () => (
  <svg viewBox="0 0 340 190" className="mx-auto h-44 w-auto" fill="none">
    {/* Board */}
    <rect x="72" y="16" width="196" height="152" rx="10" fill="#1B2129" stroke="#39414F" strokeWidth="2" />
    <line x1="137" y1="20" x2="137" y2="164" stroke="#39414F" strokeWidth="1.5" />
    <line x1="202" y1="20" x2="202" y2="164" stroke="#39414F" strokeWidth="1.5" />
    {/* Sticky notes */}
    <rect x="83" y="28" width="42" height="26" rx="3" fill="#A3E4D7" />
    <rect x="83" y="60" width="42" height="26" rx="3" fill="#F7DC6F" />
    <rect x="83" y="92" width="42" height="26" rx="3" fill="#F5CBA7" />
    <rect x="148" y="28" width="42" height="26" rx="3" fill="#A2C2F5" />
    <rect x="148" y="60" width="42" height="26" rx="3" fill="#F1948A" />
    <rect x="213" y="28" width="42" height="26" rx="3" fill="#A2C2F5" />
    <rect x="213" y="60" width="42" height="26" rx="3" fill="#F7DC6F" />
    <rect x="213" y="92" width="42" height="26" rx="3" fill="#A3E4D7" />
    {/* Left figure */}
    <circle cx="36" cy="112" r="10" fill="#64748B" />
    <rect x="24" y="126" width="24" height="42" rx="11" fill="#475569" />
    {/* Right figure */}
    <circle cx="306" cy="104" r="10" fill="#94A3B8" />
    <rect x="294" y="118" width="24" height="42" rx="11" fill="#64748B" />
  </svg>
);

export const PlanejamentoWizard: React.FC<PlanejamentoWizardProps> = ({ onFinish }) => {
  const { activeEdital, activePlan, updateStudyPlan, setActiveTab } = useStudy();

  const [stage, setStage] = useState<"choice" | "steps">(activePlan ? "steps" : "choice");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [planningMode, setPlanningMode] = useState<PlanningMode>("CYCLE");
  const [creationMethod, setCreationMethod] = useState<PlanCreationMethod>("manual");

  const [dailyAvailability, setDailyAvailability] = useState({
    seg: 3,
    ter: 3,
    qua: 3,
    qui: 3,
    sex: 3,
    sab: 4,
    dom: 0,
  });
  const [dayEnabled, setDayEnabled] = useState<Record<string, boolean>>({
    seg: true,
    ter: true,
    qua: true,
    qui: true,
    sex: true,
    sab: true,
    dom: false,
  });
  const [dailyTimeStrings, setDailyTimeStrings] = useState<Record<string, string>>({
    seg: "03:00",
    ter: "03:00",
    qua: "03:00",
    qui: "03:00",
    sex: "03:00",
    sab: "04:00",
    dom: "00:00",
  });

  const [minSessionMinutes, setMinSessionMinutes] = useState<number>(30);
  const [maxSessionMinutes, setMaxSessionMinutes] = useState<number>(90);

  const [priorityConfig, setPriorityConfig] = useState<
    Record<string, { importance: number; knowledgeLevel: number; enabled: boolean }>
  >({});

  const disciplines = activeEdital?.disciplines || [];

  // Initialize data from activePlan or defaults
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
        const enabled: Record<string, boolean> = {};
        Object.entries(activePlan.dailyAvailability).forEach(([dayKey, val]) => {
          timeStrings[dayKey] = decimalHoursToTimeString(Number(val) || 0);
          enabled[dayKey] = (Number(val) || 0) > 0;
        });
        setDailyTimeStrings(timeStrings);
        setDayEnabled(enabled);
      }
      if (activePlan.minSessionMinutes) setMinSessionMinutes(activePlan.minSessionMinutes);
      if (activePlan.maxSessionMinutes) setMaxSessionMinutes(activePlan.maxSessionMinutes);

      const map: Record<string, { importance: number; knowledgeLevel: number; enabled: boolean }> =
        {};
      const hasBlocks =
        (activePlan.cycle || []).length > 0 ||
        (activePlan.weeklySchedule || []).length > 0;
      disciplines.forEach((d) => {
        const existing = (activePlan.cycle || []).find((s) => s.disciplineId === d.id);
        map[d.id] = {
          importance: existing?.importance || (d.weight === 3 ? 5 : d.weight === 2 ? 3 : 2),
          knowledgeLevel: existing?.knowledgeLevel || 3,
          enabled: hasBlocks
            ? (activePlan.cycle || []).some((s) => s.disciplineId === d.id) ||
              (activePlan.weeklySchedule || []).some((b) => b.disciplineId === d.id)
            : true,
        };
      });
      setPriorityConfig(map);
    } else {
      const map: Record<string, { importance: number; knowledgeLevel: number; enabled: boolean }> =
        {};
      disciplines.forEach((d) => {
        map[d.id] = {
          importance: d.weight === 3 ? 5 : d.weight === 2 ? 3 : 2,
          knowledgeLevel: 3,
          enabled: true,
        };
      });
      setPriorityConfig(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlan, activeEdital]);

  const totalWeeklyHours = useMemo(() => {
    return (Object.values(dailyAvailability) as number[]).reduce(
      (a: number, b: number) => a + (Number(b) || 0),
      0
    );
  }, [dailyAvailability]);

  // ---------- Motor de cálculo ----------
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
      const score = config.importance * (6 - config.knowledgeLevel);
      return {
        discipline: disc,
        importance: config.importance,
        knowledgeLevel: config.knowledgeLevel,
        score: Math.max(1, score),
      };
    });
  }, [enabledDisciplines, priorityConfig]);

  const totalScore = useMemo(
    () => calculatedScores.reduce((acc, item) => acc + item.score, 0) || 1,
    [calculatedScores]
  );

  const calculatedDistribution = useMemo(() => {
    const totalWeeklyMinutes = totalWeeklyHours * 60;
    if (calculatedScores.length === 0 || totalWeeklyMinutes === 0) return [];

    let distributedSum = 0;
    const items = calculatedScores.map((item) => {
      const weightPercentage = Math.round((item.score / totalScore) * 100);
      let totalMinutes = Math.round((item.score / totalScore) * totalWeeklyMinutes);
      totalMinutes = Math.max(30, totalMinutes);
      distributedSum += totalMinutes;
      return { ...item, weightPercentage, totalMinutes };
    });

    const diff = totalWeeklyMinutes - distributedSum;
    if (diff !== 0 && items.length > 0) {
      items[0].totalMinutes = Math.max(30, items[0].totalMinutes + diff);
    }

    return items.map((item) => {
      const idealBlock = Math.max(minSessionMinutes || 30, maxSessionMinutes || 90);
      const blockCount = Math.max(1, Math.round(item.totalMinutes / idealBlock));
      const minutesPerBlock = Math.round(item.totalMinutes / blockCount);
      return { ...item, blockCount, minutesPerBlock };
    });
  }, [calculatedScores, totalScore, totalWeeklyHours, minSessionMinutes, maxSessionMinutes]);

  // Generated automated cycle steps (interleaving subjects)
  const generatedCycle = useMemo(() => {
    if (calculatedDistribution.length === 0) return [];

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
          const cfg = priorityConfig[pool.disciplineId];
          result.push({
            id: `step-auto-${order}-${Date.now()}`,
            disciplineId: pool.disciplineId,
            targetMinutes: pool.minutes,
            order,
            importance: cfg?.importance || 3,
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
  }, [calculatedDistribution, priorityConfig, totalScore]);

  // Generated weekly schedule blocks (distributing across days)
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
  }, [generatedCycle, dailyAvailability]);

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
        generatedWeeklySchedule.length > 0
          ? generatedWeeklySchedule
          : activePlan.weeklySchedule,
    });

    if (onFinish) {
      onFinish();
    } else {
      setActiveTab("planejamento");
    }
  };

  // ---------- Time input handlers ----------
  const handleTimeChange = (dayKey: string, raw: string) => {
    const masked = formatTimeStringOnType(raw);
    setDailyTimeStrings((prev) => ({ ...prev, [dayKey]: masked }));
    if (masked.length >= 4) {
      const parsed = parseTimeStringToDecimalHours(masked);
      setDailyAvailability((prev) => ({ ...prev, [dayKey]: parsed.decimalHours }));
    }
  };

  const handleTimeBlur = (dayKey: string) => {
    const parsed = parseTimeStringToDecimalHours(dailyTimeStrings[dayKey] || "00:00");
    setDailyTimeStrings((prev) => ({ ...prev, [dayKey]: parsed.formattedStr }));
    setDailyAvailability((prev) => ({ ...prev, [dayKey]: parsed.decimalHours }));
  };

  const toggleDay = (dayKey: string, checked: boolean) => {
    setDayEnabled((prev) => ({ ...prev, [dayKey]: checked }));
    if (!checked) {
      setDailyAvailability((prev) => ({ ...prev, [dayKey]: 0 }));
      setDailyTimeStrings((prev) => ({ ...prev, [dayKey]: "00:00" }));
    } else if (!(dailyAvailability[dayKey as keyof typeof dailyAvailability] > 0)) {
      setDailyAvailability((prev) => ({ ...prev, [dayKey]: 1 }));
      setDailyTimeStrings((prev) => ({ ...prev, [dayKey]: "01:00" }));
    }
  };

  const footerBtnBase =
    "rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer flex items-center gap-2";
  const btnPrimary = `${footerBtnBase} bg-[#F3AA2D] text-[#11151F] hover:bg-[#e09a1d] active:scale-95`;
  const btnSecondary = `${footerBtnBase} border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800`;

  // =========================================================================
  // CHOICE SCREEN: Manual vs Ajuda do Estudei
  // =========================================================================
  if (stage === "choice") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
          <div className="flex items-start justify-between">
            <h2 className="font-condensed text-2xl font-bold uppercase text-slate-900 dark:text-white">
              Criar Planejamento
            </h2>
            {activePlan && (
              <button
                type="button"
                onClick={onFinish}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            Como você deseja criar o seu Planejamento? De forma{" "}
            <strong className="text-slate-900 dark:text-white">manual</strong>, ou prefere a
            ajuda do <strong className="text-[#F3AA2D]">Estudei</strong>?
          </p>

          <div className="mt-6">
            <KanbanIllustration />
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCreationMethod("automatico");
                setStage("steps");
              }}
              className="w-full max-w-xs rounded-xl bg-[#F3AA2D] px-6 py-3 text-sm font-bold text-[#11151F] shadow-sm hover:bg-[#e09a1d] active:scale-95 transition cursor-pointer"
            >
              Quero Ajuda do Estudei
            </button>
            <button
              type="button"
              onClick={() => {
                setCreationMethod("manual");
                setStage("steps");
              }}
              className="text-xs text-slate-500 underline underline-offset-4 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            >
              Criar de Forma Manual
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4-STEP WIZARD
  // =========================================================================
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header + Stepper */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
        <div className="flex items-center justify-between">
          <h2 className="font-condensed text-xl font-bold uppercase text-slate-900 dark:text-white">
            {activePlan ? "Editar" : "Criar"} Planejamento
          </h2>
          {activePlan && (
            <button
              type="button"
              onClick={onFinish}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Stepper */}
        <div className="mt-6 flex items-start">
          {STEPS.map((s, idx) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex w-20 flex-col items-center gap-1.5">
                  <div
                    className={`num-condensed flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition ${
                      isActive
                        ? "bg-[#F3AA2D] text-[#11151F] shadow-sm"
                        : isDone
                        ? "border border-[#F3AA2D] bg-[#F3AA2D]/15 text-[#F3AA2D]"
                        : "border border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500"
                    }`}
                  >
                    {String(s.num).padStart(2, "0")}
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      isActive
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`mt-4 h-[2px] flex-1 rounded-full transition-colors ${
                      currentStep > s.num
                        ? "bg-[#F3AA2D]/60"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: ORGANIZAÇÃO */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Para iniciar o seu planejamento, escolha a melhor forma de visualização para você:
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Ciclo de Estudos */}
            <button
              type="button"
              onClick={() => setPlanningMode("CYCLE")}
              className={`flex cursor-pointer flex-col items-center rounded-2xl border p-6 text-center transition-all ${
                planningMode === "CYCLE"
                  ? "border-[#F3AA2D] bg-[#F3AA2D]/10 ring-1 ring-[#F3AA2D]"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-[#1B2129] dark:hover:border-slate-600"
              }`}
            >
              <RotateCw
                className={`h-12 w-12 transition ${
                  planningMode === "CYCLE" ? "text-[#F3AA2D]" : "text-slate-300 dark:text-slate-600"
                }`}
                strokeWidth={1.5}
              />
              <h4 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                Ciclo de Estudos
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Estude as disciplinas em uma ordem rotativa, sem depender de dias fixos. Ideal
                para quem precisa de flexibilidade na rotina.
              </p>
            </button>

            {/* Planejamento Semanal */}
            <button
              type="button"
              onClick={() => setPlanningMode("WEEKLY")}
              className={`flex cursor-pointer flex-col items-center rounded-2xl border p-6 text-center transition-all ${
                planningMode === "WEEKLY"
                  ? "border-[#F3AA2D] bg-[#F3AA2D]/10 ring-1 ring-[#F3AA2D]"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-[#1B2129] dark:hover:border-slate-600"
              }`}
            >
              <CalendarDays
                className={`h-12 w-12 transition ${
                  planningMode === "WEEKLY"
                    ? "text-[#F3AA2D]"
                    : "text-slate-300 dark:text-slate-600"
                }`}
                strokeWidth={1.5}
              />
              <h4 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                Planejamento Semanal
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Define quais matérias estudar em cada dia da semana. Ótimo para quem prefere
                uma rotina fixa e estruturada.
              </p>
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setCurrentStep(2)} className={btnPrimary}>
              <span>Próximo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: DISCIPLINAS */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Selecione quais das <strong className="text-slate-900 dark:text-white">suas disciplinas</strong>{" "}
            você deseja colocar no seu planejamento.
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Você poderá adicionar outras disciplinas a qualquer momento.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {disciplines.map((disc) => {
              const enabled = priorityConfig[disc.id]?.enabled !== false;
              return (
                <button
                  key={disc.id}
                  type="button"
                  onClick={() =>
                    setPriorityConfig((prev) => ({
                      ...prev,
                      [disc.id]: {
                        importance: prev[disc.id]?.importance || 3,
                        knowledgeLevel: prev[disc.id]?.knowledgeLevel || 3,
                        enabled: !enabled,
                      },
                    }))
                  }
                  className={`cursor-pointer rounded-xl border px-3 py-3 text-xs font-semibold leading-snug transition ${
                    enabled
                      ? "border-[#F3AA2D] bg-[#F3AA2D]/15 text-slate-900 dark:text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-[#1B2129] dark:text-slate-400 dark:hover:border-slate-600"
                  }`}
                >
                  {disc.name}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setCurrentStep(1)} className={btnSecondary}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={enabledDisciplines.length === 0}
              className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <span>Próximo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: RELEVÂNCIA */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Para cada disciplina, selecione a importância (ou peso) para sua prova e seu grau
            de conhecimento:
          </p>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row">
            {/* Left: discipline cards with sliders */}
            <div className="flex-1 space-y-3">
              {enabledDisciplines.map((disc) => {
                const cfg = priorityConfig[disc.id] || {
                  importance: 3,
                  knowledgeLevel: 3,
                  enabled: true,
                };
                const setSlider = (field: "importance" | "knowledgeLevel", value: number) =>
                  setPriorityConfig((prev) => ({
                    ...prev,
                    [disc.id]: { ...cfg, [field]: value },
                  }));

                return (
                  <div
                    key={disc.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#1B2129]"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {disc.name}
                    </p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Importância
                          </span>
                          <span className="num-condensed text-sm font-bold text-[#F3AA2D]">
                            ({cfg.importance})
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={cfg.importance}
                          onChange={(e) => setSlider("importance", Number(e.target.value))}
                          className="mt-1.5 w-full cursor-pointer accent-[#F3AA2D]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Conhecimento
                          </span>
                          <span className="num-condensed text-sm font-bold text-[#F3AA2D]">
                            ({cfg.knowledgeLevel})
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={cfg.knowledgeLevel}
                          onChange={(e) => setSlider("knowledgeLevel", Number(e.target.value))}
                          className="mt-1.5 w-full cursor-pointer accent-[#F3AA2D]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: distribution badges */}
            <div className="w-full shrink-0 space-y-2 lg:w-60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Distribuição
              </span>
              {calculatedDistribution.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Defina os horários na próxima etapa para calcular.
                </p>
              ) : (
                calculatedDistribution.map((item, idx) => (
                  <div
                    key={item.discipline.id}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{
                      backgroundColor: PASTEL_COLORS[idx % PASTEL_COLORS.length],
                    }}
                  >
                    <span className="num-condensed text-xs font-bold text-[#11151F]">
                      {item.weightPercentage}%
                    </span>
                    <span className="truncate text-[11px] font-semibold text-[#11151F]">
                      {item.discipline.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setCurrentStep(2)} className={btnSecondary}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              disabled={enabledDisciplines.length === 0}
              className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <span>Próximo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: HORÁRIOS */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Quais dias e quantas horas pretende estudar?
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DAY_ROWS.map((day) => {
              const enabled = dayEnabled[day.key];
              return (
                <label
                  key={day.key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => toggleDay(day.key, e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded accent-[#F3AA2D]"
                  />
                  <span className="w-9 text-[11px] font-bold text-slate-900 dark:text-white">
                    {day.label}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="00:00"
                    maxLength={5}
                    value={dailyTimeStrings[day.key] ?? "00:00"}
                    onChange={(e) => handleTimeChange(day.key, e.target.value)}
                    onBlur={() => handleTimeBlur(day.key)}
                    disabled={!enabled}
                    className="w-20 rounded-lg border border-slate-200 bg-white py-1 text-center font-mono text-sm font-semibold text-slate-900 focus:border-[#F3AA2D] focus:outline-none disabled:opacity-40 dark:border-slate-700 dark:bg-[#1B2129] dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">horas diárias</span>
                </label>
              );
            })}
          </div>

          {/* Weekly total */}
          <div className="mt-4 flex justify-end">
            <div className="rounded-xl border border-[#F3AA2D] px-4 py-2 text-xs font-bold text-slate-900 dark:text-white">
              Total na Semana:{" "}
              <span className="num-condensed text-[#F3AA2D]">
                {totalWeeklyHours > 0 ? `${totalWeeklyHours}h` : "0min"}
              </span>
            </div>
          </div>

          {/* Min / Max per discipline */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">
            <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              Qual <span className="text-[#F3AA2D]">mínimo</span> e{" "}
              <span className="text-[#F3AA2D]">máximo</span> de tempo que deseja estudar uma
              mesma disciplina?
              <HelpCircle className="h-4 w-4 text-slate-400" />
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <select
                value={minSessionMinutes}
                onChange={(e) => setMinSessionMinutes(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#F3AA2D] focus:outline-none dark:border-slate-700 dark:bg-[#1B2129] dark:text-white"
              >
                {MIN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400">a</span>
              <select
                value={maxSessionMinutes}
                onChange={(e) => setMaxSessionMinutes(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#F3AA2D] focus:outline-none dark:border-slate-700 dark:bg-[#1B2129] dark:text-white"
              >
                {MAX_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setCurrentStep(3)} className={btnSecondary}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              disabled={!activePlan || totalWeeklyHours === 0}
              className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Concluir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
