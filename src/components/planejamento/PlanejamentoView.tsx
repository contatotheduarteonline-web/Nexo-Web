import React, { useState, useMemo, useCallback } from "react";
import { useStudy } from "../../context/StudyContext";
import { PlanejamentoWizard } from "./PlanejamentoWizard";
import { ErrorBoundary } from "../layout/ErrorBoundary";
import { WeeklyScheduleBlock, PlanOrganization } from "../../types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  RotateCw,
  CalendarDays,
  Sparkles,
  Sliders,
  ArrowRight,
  Layers,
  Clock,
  CheckCircle2,
  Edit3,
  Shield,
  Play,
  Plus,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  Flame,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Filter,
  Eye,
  RefreshCw,
  BookOpen,
} from "lucide-react";

// Soft aesthetic pastel palette matching reference images
const PASTEL_COLORS = [
  "#93C5FD", // soft blue (Português)
  "#FCA5A5", // soft coral/red (Legislação)
  "#FDE047", // soft warm yellow (Estatística)
  "#C4B5FD", // soft purple (Direito)
  "#6EE7B7", // soft emerald (RLM)
  "#FCD34D", // soft orange (Informática)
  "#A7F3D0", // soft mint
  "#F9A8D4", // soft pink
  "#CBD5E1", // soft slate
  "#99F6E4", // soft cyan
];

const DISCIPLINE_PALETTES = [
  {
    bg: "bg-[#F3E8FF] dark:bg-[#3B1C54]/40",
    border: "border-[#E9D5FF] dark:border-[#582B7D]",
    text: "text-[#6B21A8] dark:text-[#E9D5FF]",
    badgeBg: "bg-[#E9D5FF] dark:bg-[#582B7D]",
    badgeText: "text-[#581C87] dark:text-[#F3E8FF]",
    barBg: "#C084FC",
  },
  {
    bg: "bg-[#E0F2FE] dark:bg-[#0C4A6E]/40",
    border: "border-[#BAE6FD] dark:border-[#0369A1]",
    text: "text-[#0369A1] dark:text-[#BAE6FD]",
    badgeBg: "bg-[#BAE6FD] dark:bg-[#0369A1]",
    badgeText: "text-[#075985] dark:text-[#E0F2FE]",
    barBg: "#38BDF8",
  },
  {
    bg: "bg-[#FFE4E6] dark:bg-[#881337]/40",
    border: "border-[#FECDD3] dark:border-[#BE123C]",
    text: "text-[#BE123C] dark:text-[#FECDD3]",
    badgeBg: "bg-[#FECDD3] dark:bg-[#BE123C]",
    badgeText: "text-[#9F1239] dark:text-[#FFE4E6]",
    barBg: "#FB7185",
  },
  {
    bg: "bg-[#DCFCE7] dark:bg-[#14532D]/40",
    border: "border-[#BBF7D0] dark:border-[#15803D]",
    text: "text-[#15803D] dark:text-[#BBF7D0]",
    badgeBg: "bg-[#BBF7D0] dark:bg-[#15803D]",
    badgeText: "text-[#166534] dark:text-[#DCFCE7]",
    barBg: "#4ADE80",
  },
  {
    bg: "bg-[#FEF3C7] dark:bg-[#78350F]/40",
    border: "border-[#FDE68A] dark:border-[#B45309]",
    text: "text-[#B45309] dark:text-[#FDE68A]",
    badgeBg: "bg-[#FDE68A] dark:bg-[#B45309]",
    badgeText: "text-[#92400E] dark:text-[#FEF3C7]",
    barBg: "#FBBF24",
  },
  {
    bg: "bg-[#FEF3C7] dark:bg-[#7C2D12]/40",
    border: "border-[#FED7AA] dark:border-[#C2410C]",
    text: "text-[#C2410C] dark:text-[#FED7AA]",
    badgeBg: "bg-[#FED7AA] dark:bg-[#C2410C]",
    badgeText: "text-[#9A3412] dark:text-[#FEF3C7]",
    barBg: "#FBBF24",
  },
];

const formatDurationHM = (mins: number) => {
  const safeMins = Math.max(0, isNaN(mins) ? 0 : mins);
  const hours = Math.floor(safeMins / 60);
  const m = safeMins % 60;
  return `${hours}h${m.toString().padStart(2, "0")}min`;
};

const formatDurationDigital = (mins: number) => {
  const safeMins = Math.max(0, isNaN(mins) ? 0 : mins);
  const hours = Math.floor(safeMins / 60);
  const m = safeMins % 60;
  return `${hours.toString().padStart(2, "0")}h${m.toString().padStart(2, "0")}min`;
};

export const PlanejamentoViewContent: React.FC = () => {
  // =========================================================================
  // 1. ALL HOOKS CALLED AT THE VERY TOP (RULES OF HOOKS COMPLIANCE)
  // =========================================================================
  const {
    activeEdital,
    activePlan,
    updateStudyPlan,
    advanceCycleStep,
    resetCycleProgress,
    setActiveTab,
    startTimer,
    setTimerConfig,
    scheduledReviews,
    studySessions,
  } = useStudy();

  const [isEditingWizard, setIsEditingWizard] = useState(false);
  const isCycleMode = (activePlan?.planningMode === "CYCLE") || (activePlan?.organizationType !== "semanal" && activePlan?.planningMode !== "WEEKLY");

  // Weekly Agenda filter checkboxes
  const [showPlanejamento, setShowPlanejamento] = useState(true);
  const [showRevisoes, setShowRevisoes] = useState(true);
  const [showHistorico, setShowHistorico] = useState(true);

  // Mini calendar state
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Add block modal state for weekly calendar
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [addDay, setAddDay] = useState<"dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab">("seg");
  const [addDisciplineId, setAddDisciplineId] = useState<string>("");
  const [addDurationMinutes, setAddDurationMinutes] = useState<number>(60);

  // Quick Edit Block Modal state
  const [editingBlock, setEditingBlock] = useState<WeeklyScheduleBlock | null>(null);
  const [editDisciplineId, setEditDisciplineId] = useState<string>("");
  const [editDurationMinutes, setEditDurationMinutes] = useState<number>(60);

  // Safe variables for memo calculations (safe even if activePlan is null)
  const disciplines = activeEdital?.disciplines || [];
  const topics = activeEdital?.topics || [];
  const cycleSteps = activePlan?.cycle || [];
  const weeklySchedule = activePlan?.weeklySchedule || [];
  const reviewItems = (scheduledReviews || []).filter((r) => !r.completed);
  const completedCycles = activePlan?.completedCycles || 0;
  const currentIndex = Math.min(
    Math.max(0, activePlan?.currentCycleIndex || 0),
    Math.max(0, (cycleSteps || []).length - 1)
  );
  const currentStep = (cycleSteps || [])[currentIndex] || (cycleSteps || [])[0];

  // Dynamic Discipline color palette map
  const disciplineColorMap = useMemo(() => {
    const map = new Map<string, { color: string; palette: typeof DISCIPLINE_PALETTES[0] }>();
    (disciplines || []).forEach((d, idx) => {
      const color = PASTEL_COLORS[idx % PASTEL_COLORS.length];
      const palette = DISCIPLINE_PALETTES[idx % DISCIPLINE_PALETTES.length];
      map.set(d.id, { color, palette });
    });
    return map;
  }, [disciplines]);

  // Total Cycle calculation
  const totalCycleMinutes = useMemo(() => {
    return (cycleSteps || []).reduce((acc, step) => acc + (step?.targetMinutes || 0), 0);
  }, [cycleSteps]);

  // Donut chart slices for Cycle View
  const donutData = useMemo(() => {
    if (!cycleSteps || cycleSteps.length === 0) return [];
    return cycleSteps.map((step, idx) => {
      const disc = (disciplines || []).find((d) => d.id === step?.disciplineId);
      const colorData = disciplineColorMap.get(step?.disciplineId);
      return {
        name: disc?.name || `Etapa ${idx + 1}`,
        value: step?.targetMinutes || 60,
        color: colorData?.color || PASTEL_COLORS[idx % PASTEL_COLORS.length],
        order: idx + 1,
      };
    });
  }, [cycleSteps, disciplines, disciplineColorMap]);

  // Weekly Date Navigation calculation
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - currentDay + weekOffset * 7);

    const dayKeys: Array<"dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab"> = [
      "dom", "seg", "ter", "qua", "qui", "sex", "sab"
    ];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const fullDayNames = [
      "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
    ];

    const todayDate = new Date();
    return dayKeys.map((key, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const isToday =
        d.getDate() === todayDate.getDate() &&
        d.getMonth() === todayDate.getMonth() &&
        d.getFullYear() === todayDate.getFullYear();

      return {
        key,
        label: fullDayNames[i],
        shortLabel: `${dayNames[i]}, ${d.getDate()}`,
        date: d,
        dayNumber: d.getDate(),
        isToday,
      };
    });
  }, [weekOffset]);

  // Mini Calendar Generation
  const miniCalendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArray: Array<{
      day: number | null;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push({ day: null, isToday: false, isSelected: false });
    }

    const today = new Date();
    for (let d = 1; d <= totalDays; d++) {
      const isToday =
        today.getDate() === d &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      const isSelected =
        selectedCalendarDate.getDate() === d &&
        selectedCalendarDate.getMonth() === month &&
        selectedCalendarDate.getFullYear() === year;

      daysArray.push({ day: d, isToday, isSelected });
    }

    return daysArray;
  }, [currentCalendarDate, selectedCalendarDate]);

  // Handlers
  const handleStartStepStudy = useCallback((disciplineId: string, durationMinutes: number) => {
    const disc = (disciplines || []).find((d) => d.id === disciplineId);
    if (!disc) return;

    const firstTopic = (topics || []).find((t) => t.disciplineId === disc.id);

    setTimerConfig({
      disciplineId: disc.id,
      topicId: firstTopic?.id || "",
      modality: "Teoria",
      mode: "stopwatch",
    });

    startTimer();
    setActiveTab("cronometro");
  }, [disciplines, topics, setTimerConfig, startTimer, setActiveTab]);

  const handleAddWeeklyBlock = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!addDisciplineId || !activePlan) return;

    const dayBlocks = (weeklySchedule || []).filter((b) => b.day === addDay);
    const newBlock: WeeklyScheduleBlock = {
      id: `ws-${Date.now()}`,
      day: addDay,
      disciplineId: addDisciplineId,
      targetMinutes: addDurationMinutes,
      order: (dayBlocks || []).length + 1,
    };

    updateStudyPlan(activePlan.id, {
      weeklySchedule: [...weeklySchedule, newBlock],
    });

    setIsAddBlockModalOpen(false);
    setAddDisciplineId("");
  }, [addDisciplineId, activePlan, weeklySchedule, addDay, addDurationMinutes, updateStudyPlan]);

  const handleOpenEditBlock = useCallback((block: WeeklyScheduleBlock) => {
    setEditingBlock(block);
    setEditDisciplineId(block.disciplineId);
    setEditDurationMinutes(block.targetMinutes);
  }, []);

  const handleSaveEditBlock = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlock || !activePlan) return;

    const updated = (weeklySchedule || []).map((b) =>
      b.id === editingBlock.id
        ? { ...b, disciplineId: editDisciplineId, targetMinutes: editDurationMinutes }
        : b
    );

    updateStudyPlan(activePlan.id, {
      weeklySchedule: updated,
    });

    setEditingBlock(null);
  }, [editingBlock, activePlan, weeklySchedule, editDisciplineId, editDurationMinutes, updateStudyPlan]);

  const handleRemoveWeeklyBlock = useCallback((blockId: string) => {
    if (!activePlan) return;
    const updated = (weeklySchedule || []).filter((b) => b.id !== blockId);
    updateStudyPlan(activePlan.id, {
      weeklySchedule: updated,
    });
    if (editingBlock?.id === blockId) {
      setEditingBlock(null);
    }
  }, [activePlan, weeklySchedule, updateStudyPlan, editingBlock]);

  const handleRestartCycle = useCallback(() => {
    if (!activePlan) return;
    if (confirm("Deseja reiniciar a rotação do ciclo de estudos a partir do primeiro bloco?")) {
      resetCycleProgress(activePlan.id);
    }
  }, [activePlan, resetCycleProgress]);

  // =========================================================================
  // 2. EARLY RETURNS PLACED STRICTLY AFTER ALL HOOKS
  // =========================================================================
  if (!activePlan || isEditingWizard) {
    return (
      <div className="space-y-6">
        <PlanejamentoWizard onFinish={() => setIsEditingWizard(false)} />
      </div>
    );
  }

  // Formatting calculations after early returns
  const totalCycleDurationFormatted = formatDurationHM(totalCycleMinutes);

  const cycleElapsedMinutes = (cycleSteps || []).reduce((acc, step, idx) => {
    if (idx < currentIndex) {
      return acc + (step?.targetMinutes || 0);
    }
    if (idx === currentIndex) {
      return acc + (activePlan.currentStepElapsedMinutes || 0);
    }
    return acc;
  }, 0);
  const cycleElapsedFormatted = formatDurationHM(cycleElapsedMinutes);

  const cycleProgressPercentage = totalCycleMinutes > 0
    ? Math.min(100, Math.round((cycleElapsedMinutes / totalCycleMinutes) * 100))
    : 0;

  const weekStart = weekDays[0]?.date || new Date();
  const weekEnd = weekDays[6]?.date || new Date();
  const monthNamesShort = [
    "JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
  ];
  const weekRangeLabel = `${weekStart.getDate().toString().padStart(2, "0")}/${(weekStart.getMonth() + 1).toString().padStart(2, "0")} - ${weekEnd.getDate().toString().padStart(2, "0")}/${(weekEnd.getMonth() + 1).toString().padStart(2, "0")} • ${monthNamesShort[weekEnd.getMonth()]}.`;

  const totalWeeklyScheduledMinutes = (weeklySchedule || []).reduce(
    (acc, b) => acc + (b?.targetMinutes || 0),
    0
  );
  const totalWeeklyScheduledHours = (totalWeeklyScheduledMinutes / 60).toFixed(1);

  return (
    <div className="space-y-5 pb-16">
      {/* ========================================================================= */}
      {/* TOP HEADER: CLEAN BENTO DESIGN */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white px-7 py-6 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Planejamento de Estudos
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Action: Planejar */}
          <button
            onClick={() => setIsEditingWizard(true)}
            className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-xs font-bold text-[#F59E0B] dark:bg-amber-500/20 dark:text-[#FBBF24] hover:bg-amber-500/20 transition-all shadow-xs cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
            <span>Planejar</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYOUT 1: CICLO DE ESTUDOS */}
      {/* ========================================================================= */}
      {isCycleMode && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Header Controls: Recomeçar Ciclo & Editar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Top Cards: CICLOS COMPLETOS & PROGRESSO BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
              {/* Card 1: CICLOS COMPLETOS */}
              <div className="sm:col-span-3 rounded-2xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs dark:border-[#1E293B] dark:bg-[#252B38]">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                  CICLOS COMPLETOS
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#F59E0B] font-mono text-base font-black text-[#F59E0B] dark:border-[#FBBF24] dark:text-[#FBBF24]">
                    {completedCycles}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1F2937] dark:text-white">
                      Voltas Concluídas
                    </p>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                      No edital completo
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: PROGRESSO DO CICLO ATUAL */}
              <div className="sm:col-span-9 rounded-2xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs dark:border-[#1E293B] dark:bg-[#252B38] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                    PROGRESSO DA RODADA ATUAL
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1F2937] dark:text-white">
                      {cycleElapsedFormatted} / {totalCycleDurationFormatted}
                    </span>
                    <button
                      onClick={handleRestartCycle}
                      className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-[#F59E0B] hover:bg-amber-100 dark:bg-amber-950/40 dark:text-[#FBBF24] transition cursor-pointer"
                      title="Reiniciar este ciclo a partir do bloco 1"
                    >
                      Recomeçar Ciclo
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1E293B]">
                    <div
                      style={{ width: `${cycleProgressPercentage}%` }}
                      className="h-full rounded-full bg-[#F59E0B] transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Dashboard: Left Sequence List / Right Donut Chart */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* LEFT COLUMN (lg:col-span-7): SEQUÊNCIA DOS ESTUDOS */}
            <div className="lg:col-span-7 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#1E293B] dark:bg-[#252B38] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#1E293B]">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#1F2937] dark:text-white">
                      SEQUÊNCIA DOS ESTUDOS
                    </h3>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                      Ordem contínua dos blocos de estudo no ciclo
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 font-mono text-[10px] font-bold text-[#6B7280] dark:bg-[#1E293B] dark:text-[#9CA3AF]">
                    {(cycleSteps || []).length} Blocos
                  </span>
                </div>

                {/* Vertical Sequence List Items */}
                <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                  {(cycleSteps || []).length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      Nenhum bloco configurado no ciclo. Clique em "Ajustar Ciclo" para configurar.
                    </div>
                  ) : (
                    (cycleSteps || []).map((step, idx) => {
                      const disc = (disciplines || []).find((d) => d.id === step.disciplineId);
                      const isCurrent = idx === currentIndex;
                      const isPast = idx < currentIndex;
                      const colorData = disciplineColorMap.get(step.disciplineId);
                      const barColor = colorData?.color || PASTEL_COLORS[idx % PASTEL_COLORS.length];

                      // Calculated block elapsed progress
                      const blockElapsed = isPast
                        ? step.targetMinutes
                        : isCurrent
                        ? activePlan.currentStepElapsedMinutes || 0
                        : 0;

                      return (
                        <div
                          key={step.id || `step-${idx}`}
                          className={`relative flex items-center justify-between rounded-xl border p-3 transition ${
                            isCurrent
                              ? "border-[#F59E0B] bg-[#FFF8F2] ring-1 ring-[#F59E0B] dark:border-[#F59E0B] dark:bg-[#2A1608]"
                              : "border-[#E2E8F0] bg-[#F9FAFB] hover:bg-white dark:border-[#1E293B] dark:bg-[#1C2429] dark:hover:bg-[#20292F]"
                          }`}
                        >
                          {/* Left Color Accent Strip */}
                          <div
                            style={{ backgroundColor: barColor }}
                            className="absolute left-2.5 top-2.5 bottom-2.5 w-1 rounded-full"
                          />

                          <div className="pl-4 flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-[#6B7280] dark:text-[#9CA3AF]">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-[#1F2937] dark:text-white">
                                {disc?.name || "Disciplina"}
                              </p>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#F59E0B] dark:text-[#FBBF24] uppercase">
                                  <Flame className="h-3 w-3" /> Vez Atual no Ciclo
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Duration Indicator */}
                            <span className="flex items-center gap-1 font-mono text-xs font-bold text-[#6B7280] dark:text-[#9CA3AF]">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDurationHM(blockElapsed)} / {formatDurationHM(step.targetMinutes)}
                            </span>

                            {/* Quick Study / Advance Button */}
                            {isCurrent && (
                              <button
                                onClick={() => handleStartStepStudy(step.disciplineId, step.targetMinutes)}
                                className="flex items-center gap-1 rounded-lg bg-[#F59E0B] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#D97706] shadow-xs cursor-pointer"
                                title="Iniciar estudo agora no cronômetro"
                              >
                                <Play className="h-3 w-3 fill-current" />
                                <span>Estudar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom Footer Button: Ajustar Ciclo */}
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B] flex justify-end">
                <button
                  onClick={() => setIsEditingWizard(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-5 py-2.5 text-xs font-bold text-white transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Ajustar Ciclo</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN (lg:col-span-5): DONUT CHART & MATÉRIAS PROPORÇÕES */}
            <div className="lg:col-span-5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#1E293B] dark:bg-[#252B38] flex flex-col justify-between">
              <div>
                <div className="border-b border-[#E2E8F0] pb-3 dark:border-[#1E293B]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                    CICLO COMPLETO
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#1F2937] dark:text-white">
                    Distribuição Proporcional
                  </h3>
                </div>

                {/* Donut Chart with total duration in center */}
                <div className="relative my-4 flex h-64 items-center justify-center">
                  {(donutData || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [
                            formatDurationHM(Number(value)),
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-[#6B7280]">Sem matérias no ciclo</div>
                  )}

                  {/* Centered Total Time Label (ex: 25h00min) */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-mono text-xl font-black text-[#1F2937] dark:text-white">
                      {totalCycleDurationFormatted}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                      1 ROTAÇÃO
                    </span>
                  </div>
                </div>

                {/* Legend list of disciplines & weights */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                  {(disciplines || []).map((disc, idx) => {
                    const discSteps = (cycleSteps || []).filter((s) => s.disciplineId === disc.id);
                    const discMins = discSteps.reduce((acc, s) => acc + (s.targetMinutes || 0), 0);
                    const colorData = disciplineColorMap.get(disc.id);
                    const dotColor = colorData?.color || PASTEL_COLORS[idx % PASTEL_COLORS.length];

                    return (
                      <div
                        key={disc.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-[#F3F4F6] dark:border-[#1E293B] last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            style={{ backgroundColor: dotColor }}
                            className="h-3 w-3 rounded-full flex-shrink-0"
                          />
                          <span className="font-medium text-[#374151] dark:text-[#E5EAEF] line-clamp-1">
                            {disc.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#6B7280] dark:text-[#9CA3AF] ml-2">
                          {formatDurationHM(discMins)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Quick Start CTA */}
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B]">
                <button
                  onClick={() => {
                    if (currentStep) {
                      handleStartStepStudy(currentStep.disciplineId, currentStep.targetMinutes);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1F2937] py-2.5 text-xs font-black uppercase text-white hover:bg-black dark:bg-white dark:text-[#1F2937] dark:hover:bg-[#E5EAEF] transition shadow-xs"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Estudar Bloco Atual (#{currentIndex + 1})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYOUT 2: PLANEJAMENTO SEMANAL */}
      {/* ========================================================================= */}
      {!isCycleMode && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 animate-in fade-in duration-200">
          {/* Left Sidebar Pane (lg:col-span-3): Mini Calendar & Agendas Filter */}
          <div className="lg:col-span-3 space-y-4">
            {/* Mini Calendar Card */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs dark:border-[#1E293B] dark:bg-[#252B38]">
              {/* Month Navigator Header */}
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(currentCalendarDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentCalendarDate(prev);
                  }}
                  className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2937] dark:text-[#9CA3AF] dark:hover:bg-[#1E293B] dark:hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="text-center">
                  <span className="font-mono text-xs font-black uppercase text-[#1F2937] dark:text-white">
                    {monthNamesShort[currentCalendarDate.getMonth()]}. {currentCalendarDate.getFullYear()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(currentCalendarDate);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentCalendarDate(next);
                  }}
                  className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2937] dark:text-[#9CA3AF] dark:hover:bg-[#1E293B] dark:hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day of Week Letters (D S T Q Q S S) */}
              <div className="mt-3 grid grid-cols-7 text-center">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((letter, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[10px] font-bold text-[#9CA3AF] dark:text-[#6B7280]"
                  >
                    {letter}
                  </span>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                {(miniCalendarDays || []).map((item, idx) => {
                  if (!item.day) {
                    return <div key={`empty-${idx}`} className="h-7 w-7" />;
                  }

                  return (
                    <button
                      key={`day-${item.day}`}
                      type="button"
                      onClick={() => {
                        const clicked = new Date(currentCalendarDate);
                        clicked.setDate(item.day!);
                        setSelectedCalendarDate(clicked);
                      }}
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-medium transition ${
                        item.isToday
                          ? "bg-[#249D84] font-bold text-white shadow-xs"
                          : item.isSelected
                          ? "bg-[#1F2937] text-white dark:bg-white dark:text-[#1F2937]"
                          : "text-[#374151] hover:bg-[#F3F4F6] dark:text-[#E5EAEF] dark:hover:bg-[#1E293B]"
                      }`}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>

              {/* Divider & Minhas Agendas */}
              <div className="mt-5 border-t border-[#E2E8F0] pt-4 dark:border-[#1E293B]">
                <h4 className="font-mono text-[10px] font-black uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                  MINHAS AGENDAS
                </h4>

                {/* Filter Checkboxes */}
                <div className="mt-3 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="font-mono text-xs font-bold text-[#1F2937] dark:text-white">
                        REVISÕES
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showRevisoes}
                      onChange={(e) => setShowRevisoes(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#249D84] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                      <span className="font-mono text-xs font-bold text-[#1F2937] dark:text-white">
                        HISTÓRICO
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showHistorico}
                      onChange={(e) => setShowHistorico(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#249D84] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#249D84]" />
                      <span className="font-mono text-xs font-bold text-[#1F2937] dark:text-white">
                        PLANEJAMENTO
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showPlanejamento}
                      onChange={(e) => setShowPlanejamento(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#249D84] cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Weekly Quick Metrics Summary */}
              {(() => {
                const weeklyGoal = activePlan.weeklyGoalHours || 20;
                const totalHoursNum = Number(totalWeeklyScheduledHours);
                const isOverGoal = totalHoursNum > weeklyGoal;
                const percent = Math.min(100, Math.round((totalHoursNum / weeklyGoal) * 100));

                return (
                  <div className={`mt-5 rounded-2xl p-4 transition-all duration-300 ${
                    isOverGoal
                      ? "border border-amber-300 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20"
                      : "border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40"
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500 dark:text-slate-400">Alocado na Semana:</span>
                      <span className={`font-mono font-bold ${
                        isOverGoal
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-900 dark:text-white"
                      }`}>
                        {totalWeeklyScheduledHours}h / {weeklyGoal}h
                      </span>
                    </div>

                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverGoal
                            ? "bg-amber-500 dark:bg-amber-400"
                            : "bg-[#249D84]"
                        }`}
                      />
                    </div>

                    {isOverGoal && (
                      <p className="mt-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        Atenção: A carga semanal excede a meta estipulada (+{(totalHoursNum - weeklyGoal).toFixed(1)}h).
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Area (lg:col-span-9): 7-Day Weekly Timetable (Bento Box Modern Grid) */}
          <div className="lg:col-span-9 space-y-4">
            {/* Week Navigation Header Bar */}
            <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition"
                  title="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">
                  {weekRangeLabel}
                </span>
                <button
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition"
                  title="Próxima semana"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white transition"
                  >
                    Hoje
                  </button>
                )}
                <button
                  onClick={() => {
                    setAddDay("seg");
                    setIsAddBlockModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#249D84] px-4 py-2 text-xs font-bold text-white hover:bg-[#1F826D] shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Bloco</span>
                </button>
              </div>
            </div>

            {/* 7 Columns Timetable Modern Bento Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              {(weekDays || []).map((day) => {
                const dayBlocks = showPlanejamento
                  ? (weeklySchedule || []).filter((b) => b.day === day.key)
                  : [];

                const dayMinutes = (dayBlocks || []).reduce(
                  (acc, b) => acc + (b?.targetMinutes || 0),
                  0
                );

                return (
                  <div
                    key={day.key}
                    className={`flex min-h-[520px] flex-col justify-between rounded-3xl border p-2.5 transition-all duration-200 ${
                      day.isToday
                        ? "border-[#249D84] bg-emerald-50/20 shadow-sm ring-1 ring-[#249D84]/40 dark:border-[#249D84] dark:bg-[#249D84]/5"
                        : "border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0F172A]"
                    }`}
                  >
                    <div>
                      {/* Day Column Header */}
                      <div className={`mb-2 rounded-2xl p-2.5 text-center transition ${
                        day.isToday
                          ? "bg-[#249D84] text-white"
                          : "bg-slate-50 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
                      }`}>
                        <p className="font-mono text-xs font-bold uppercase tracking-wider">
                          {day.shortLabel}
                        </p>
                        <p className={`font-mono text-[10px] ${
                          day.isToday ? "text-emerald-100" : "text-slate-400 dark:text-slate-500"
                        }`}>
                          {formatDurationDigital(dayMinutes)}
                        </p>
                      </div>

                      {/* Day Stacked Floating Cards */}
                      <div className="space-y-2">
                        {/* Planned Blocks */}
                        {(dayBlocks || []).map((block) => {
                          const disc = (disciplines || []).find(
                            (d) => d.id === block.disciplineId
                          );
                          const colorData = disciplineColorMap.get(block.disciplineId);
                          const palette = colorData?.palette || DISCIPLINE_PALETTES[0];

                          return (
                            <div
                              key={block.id}
                              onClick={() => handleOpenEditBlock(block)}
                              className={`group relative cursor-pointer rounded-2xl border p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${palette.bg} ${palette.border}`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <p
                                  className={`text-xs font-bold leading-snug ${palette.text} line-clamp-2`}
                                >
                                  {disc?.name || "Disciplina"}
                                </p>
                              </div>

                              <div className="mt-2.5 flex items-center justify-between">
                                <span
                                  className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold ${palette.badgeBg} ${palette.badgeText}`}
                                >
                                  {formatDurationDigital(block.targetMinutes)}
                                </span>

                                <div
                                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() =>
                                      handleStartStepStudy(block.disciplineId, block.targetMinutes)
                                    }
                                    className="rounded-lg bg-white p-1 text-slate-700 shadow-xs hover:bg-slate-100 dark:bg-slate-800 dark:text-white transition"
                                    title="Estudar agora"
                                  >
                                    <Play className="h-3 w-3 fill-current" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveWeeklyBlock(block.id)}
                                    className="rounded-lg bg-white p-1 text-rose-600 shadow-xs hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 transition"
                                    title="Excluir bloco"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Revisions badge if active on this day and checkbox is enabled */}
                        {showRevisoes && day.isToday && (reviewItems || []).length > 0 && (
                          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-2.5 text-xs dark:border-emerald-800/60 dark:bg-emerald-950/40">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                                Revisão
                              </span>
                              <span className="rounded-lg bg-emerald-200/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100">
                                {(reviewItems || []).length}
                              </span>
                            </div>
                            <p className="mt-1 font-bold text-[10px] text-emerald-900 dark:text-emerald-200 line-clamp-1">
                              Revisões 24h/7d/30d
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column Bottom Add Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddDay(day.key);
                          setIsAddBlockModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Bloco Existente */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#252B38]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                Editar Bloco de Estudo
              </h3>
              <button
                type="button"
                onClick={() => setEditingBlock(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBlock} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Disciplina
                </label>
                <select
                  value={editDisciplineId}
                  onChange={(e) => setEditDisciplineId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-[#249D84] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  {(disciplines || []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Peso {d.weight || 1})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Duração da Sessão
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEditDurationMinutes(mins)}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        editDurationMinutes === mins
                          ? "border-[#249D84] bg-[#249D84] text-white shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleRemoveWeeklyBlock(editingBlock.id)}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Excluir</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBlock(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#249D84] px-5 py-2 text-xs font-bold text-white hover:bg-[#1F826D] shadow-xs transition"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Bloco ao Calendário Semanal */}
      {isAddBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#252B38]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                Adicionar Bloco à Grade
              </h3>
              <button
                type="button"
                onClick={() => setIsAddBlockModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddWeeklyBlock} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dia da Semana
                </label>
                <select
                  value={addDay}
                  onChange={(e) => setAddDay(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-[#249D84] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="dom">Domingo (DOM)</option>
                  <option value="seg">Segunda-feira (SEG)</option>
                  <option value="ter">Terça-feira (TER)</option>
                  <option value="qua">Quarta-feira (QUA)</option>
                  <option value="qui">Quinta-feira (QUI)</option>
                  <option value="sex">Sexta-feira (SEX)</option>
                  <option value="sab">Sábado (SÁB)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Disciplina
                </label>
                <select
                  value={addDisciplineId}
                  onChange={(e) => setAddDisciplineId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-[#249D84] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Selecione uma disciplina...</option>
                  {(disciplines || []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Peso {d.weight || 1})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Duração da Sessão
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAddDurationMinutes(mins)}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        addDurationMinutes === mins
                          ? "border-[#249D84] bg-[#249D84] text-white shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBlockModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#249D84] px-5 py-2 text-xs font-bold text-white hover:bg-[#1F826D] shadow-xs transition"
                >
                  Salvar Bloco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const PlanejamentoView: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Erro ao carregar o Planejamento">
      <PlanejamentoViewContent />
    </ErrorBoundary>
  );
};
