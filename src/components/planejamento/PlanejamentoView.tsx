import React, { useState, useMemo, useCallback } from "react";
import { useStudy } from "../../context/StudyContext";
import { PlanejamentoWizard } from "./PlanejamentoWizard";
import { ErrorBoundary } from "../layout/ErrorBoundary";
import { WeeklyScheduleBlock } from "../../types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Play,
  Plus,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  RotateCw,
  RefreshCw,
  Sliders,
} from "lucide-react";
import {
  PASTEL_COLORS,
  DISCIPLINE_PALETTES,
  formatDurationHM,
  formatDurationRef,
} from "./planShared";

const MONTHS_SHORT = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];
const MONTHS_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const dateToStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const PlanejamentoViewContent: React.FC = () => {
  // =========================================================================
  // 1. ALL HOOKS CALLED AT THE VERY TOP (RULES OF HOOKS COMPLIANCE)
  // =========================================================================
  const {
    activeEdital,
    activePlan,
    updateStudyPlan,
    resetCycleProgress,
    setActiveTab,
    startTimer,
    setTimerConfig,
    scheduledReviews,
  } = useStudy();

  const [isEditingWizard, setIsEditingWizard] = useState(false);
  const isCycleMode =
    activePlan?.planningMode === "CYCLE" ||
    (activePlan?.organizationType !== "semanal" && activePlan?.planningMode !== "WEEKLY");

  // Weekly agenda filter checkboxes
  const [showPlanejamento, setShowPlanejamento] = useState(true);
  const [showRevisoes, setShowRevisoes] = useState(true);
  const [showHistorico, setShowHistorico] = useState(true);

  // Mini calendar state
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Add block modal state
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [addDay, setAddDay] = useState<"dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab">("seg");
  const [addDisciplineId, setAddDisciplineId] = useState<string>("");
  const [addDurationMinutes, setAddDurationMinutes] = useState<number>(60);

  // Quick edit block modal state
  const [editingBlock, setEditingBlock] = useState<WeeklyScheduleBlock | null>(null);
  const [editDisciplineId, setEditDisciplineId] = useState<string>("");
  const [editDurationMinutes, setEditDurationMinutes] = useState<number>(60);

  // Safe variables
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

  // Dynamic discipline color map
  const disciplineColorMap = useMemo(() => {
    const map = new Map<string, { color: string; palette: typeof DISCIPLINE_PALETTES[0] }>();
    (disciplines || []).forEach((d, idx) => {
      map.set(d.id, {
        color: PASTEL_COLORS[idx % PASTEL_COLORS.length],
        palette: DISCIPLINE_PALETTES[idx % DISCIPLINE_PALETTES.length],
      });
    });
    return map;
  }, [disciplines]);

  const totalCycleMinutes = useMemo(
    () => (cycleSteps || []).reduce((acc, step) => acc + (step?.targetMinutes || 0), 0),
    [cycleSteps]
  );

  // Donut chart slices
  const donutData = useMemo(() => {
    if (!cycleSteps || cycleSteps.length === 0) return [];
    return cycleSteps.map((step, idx) => {
      const disc = (disciplines || []).find((d) => d.id === step?.disciplineId);
      const colorData = disciplineColorMap.get(step?.disciplineId);
      return {
        name: disc?.name || `Etapa ${idx + 1}`,
        value: step?.targetMinutes || 60,
        color: colorData?.color || PASTEL_COLORS[idx % PASTEL_COLORS.length],
      };
    });
  }, [cycleSteps, disciplines, disciplineColorMap]);

  // Weekly date navigation
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - currentDay + weekOffset * 7);

    const dayKeys: Array<"dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab"> = [
      "dom", "seg", "ter", "qua", "qui", "sex", "sab",
    ];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
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
        shortLabel: `${dayNames[i]}, ${d.getDate()}`,
        date: d,
        isToday,
      };
    });
  }, [weekOffset]);

  // Mini calendar generation
  const miniCalendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Week range containing the selected date (highlighted block)
    const weekStart = new Date(selectedCalendarDate);
    weekStart.setDate(selectedCalendarDate.getDate() - selectedCalendarDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const inSelectedWeek = (d: number) => {
      const date = new Date(year, month, d);
      return date >= weekStart && date <= weekEnd;
    };

    const daysArray: Array<{ day: number | null; isToday: boolean; isSelected: boolean; inWeek: boolean }> = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push({ day: null, isToday: false, isSelected: false, inWeek: false });
    }

    const today = new Date();
    for (let d = 1; d <= totalDays; d++) {
      const isToday =
        today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
      const isSelected =
        selectedCalendarDate.getDate() === d &&
        selectedCalendarDate.getMonth() === month &&
        selectedCalendarDate.getFullYear() === year;
      daysArray.push({ day: d, isToday, isSelected, inWeek: inSelectedWeek(d) });
    }

    return daysArray;
  }, [currentCalendarDate, selectedCalendarDate]);

  // Handlers
  const handleStartStepStudy = useCallback(
    (disciplineId: string) => {
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
    },
    [disciplines, topics, setTimerConfig, startTimer, setActiveTab]
  );

  const handleAddWeeklyBlock = useCallback(
    (e: React.FormEvent) => {
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
    },
    [addDisciplineId, activePlan, weeklySchedule, addDay, addDurationMinutes, updateStudyPlan]
  );

  const handleOpenEditBlock = useCallback((block: WeeklyScheduleBlock) => {
    setEditingBlock(block);
    setEditDisciplineId(block.disciplineId);
    setEditDurationMinutes(block.targetMinutes);
  }, []);

  const handleSaveEditBlock = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingBlock || !activePlan) return;

      const updated = (weeklySchedule || []).map((b) =>
        b.id === editingBlock.id
          ? { ...b, disciplineId: editDisciplineId, targetMinutes: editDurationMinutes }
          : b
      );

      updateStudyPlan(activePlan.id, { weeklySchedule: updated });
      setEditingBlock(null);
    },
    [editingBlock, activePlan, weeklySchedule, editDisciplineId, editDurationMinutes, updateStudyPlan]
  );

  const handleRemoveWeeklyBlock = useCallback(
    (blockId: string) => {
      if (!activePlan) return;
      const updated = (weeklySchedule || []).filter((b) => b.id !== blockId);
      updateStudyPlan(activePlan.id, { weeklySchedule: updated });
      if (editingBlock?.id === blockId) setEditingBlock(null);
    },
    [activePlan, weeklySchedule, updateStudyPlan, editingBlock]
  );

  const handleRestartCycle = useCallback(() => {
    if (!activePlan) return;
    if (confirm("Deseja reiniciar a rotação do ciclo de estudos a partir do primeiro bloco?")) {
      resetCycleProgress(activePlan.id);
    }
  }, [activePlan, resetCycleProgress]);

  const handleClearWeeklySchedule = useCallback(() => {
    if (!activePlan) return;
    if (confirm("Deseja remover todos os blocos da grade semanal?")) {
      updateStudyPlan(activePlan.id, { weeklySchedule: [] });
    }
  }, [activePlan, updateStudyPlan]);

  const openAddBlockModal = useCallback((day: "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab") => {
    setAddDay(day);
    setIsAddBlockModalOpen(true);
  }, []);

  // =========================================================================
  // 2. EARLY RETURNS STRICTLY AFTER ALL HOOKS
  // =========================================================================
  if (!activePlan && !isEditingWizard) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-6 py-24 text-center shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
        <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-slate-900 dark:text-white">
          Planejamento
        </h1>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Você ainda não tem um plano de estudos ativo.
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Crie seu plano na aba Planos para configurar ciclos e horários de estudo.
        </p>
        <button
          onClick={() => setActiveTab("planos")}
          className="mt-6 rounded-xl bg-[#F3AA2D] px-6 py-2.5 text-xs font-bold text-[#11151F] shadow-sm transition hover:bg-[#e09a1d] cursor-pointer"
        >
          Criar Plano
        </button>
      </div>
    );
  }

  if (isEditingWizard) {
    return (
      <div className="space-y-6">
        <PlanejamentoWizard onFinish={() => setIsEditingWizard(false)} />
      </div>
    );
  }

  // Cycle progress calculations
  const cycleElapsedMinutes = (cycleSteps || []).reduce((acc, step, idx) => {
    if (idx < currentIndex) return acc + (step?.targetMinutes || 0);
    if (idx === currentIndex) return acc + (activePlan.currentStepElapsedMinutes || 0);
    return acc;
  }, 0);
  const cycleProgressPercentage =
    totalCycleMinutes > 0
      ? Math.min(100, Math.round((cycleElapsedMinutes / totalCycleMinutes) * 100))
      : 0;

  // Month label for the weekly navigation bar
  const navDate = weekDays[0]?.date || new Date();
  const navMonthLabel = `${MONTHS_LONG[navDate.getMonth()]}, ${navDate.getFullYear()}`;

  return (
    <div className="space-y-5 pb-16">
      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-slate-900 dark:text-white">
          Planejamento
        </h1>

        <div className="flex items-center gap-2.5">
          {isCycleMode ? (
            <>
              <button
                onClick={handleRestartCycle}
                className="flex items-center gap-2 rounded-xl border border-[#F3AA2D] px-4 py-2.5 text-xs font-bold text-[#F3AA2D] transition hover:bg-[#F3AA2D]/10 cursor-pointer"
              >
                <RotateCw className="h-4 w-4" />
                <span>Recomeçar Ciclo</span>
              </button>
              <button
                onClick={() => setIsEditingWizard(true)}
                className="flex items-center gap-2 rounded-xl bg-[#F3AA2D] px-4 py-2.5 text-xs font-bold text-[#11151F] shadow-sm transition hover:bg-[#e09a1d] cursor-pointer"
              >
                <Sliders className="h-4 w-4" />
                <span>Editar Planejamento</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClearWeeklySchedule}
                className="flex items-center gap-2 rounded-xl bg-[#F3AA2D] px-4 py-2.5 text-xs font-bold text-[#11151F] shadow-sm transition hover:bg-[#e09a1d] cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remover</span>
              </button>
              <button
                onClick={() => setIsEditingWizard(true)}
                className="flex items-center gap-2 rounded-xl bg-[#F3AA2D] px-4 py-2.5 text-xs font-bold text-[#11151F] shadow-sm transition hover:bg-[#e09a1d] cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Replanejamento</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYOUT 1: CICLO DE ESTUDOS */}
      {/* ========================================================================= */}
      {isCycleMode && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top cards: CICLOS COMPLETOS & PROGRESSO */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4 flex items-center gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-[#F3AA2D]">
                <span className="num-condensed text-3xl font-bold text-[#F3AA2D]">
                  {completedCycles}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Ciclos
                <br />
                Completos
              </span>
            </div>

            <div className="sm:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#252B38] flex flex-col justify-center gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Progresso
                </span>
                <span className="num-condensed text-sm font-bold text-slate-900 dark:text-white">
                  {formatDurationRef(cycleElapsedMinutes)} / {formatDurationHM(totalCycleMinutes)}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#11151F]">
                <div
                  style={{ width: `${cycleProgressPercentage}%` }}
                  className="h-full rounded-full bg-[#F3AA2D] transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Main 2-column: sequence list / donut */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* LEFT: SEQUÊNCIA DOS ESTUDOS */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Sequência dos Estudos
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 num-condensed text-[10px] font-bold text-slate-500 dark:bg-[#11151F] dark:text-slate-400">
                  {(cycleSteps || []).length} Blocos
                </span>
              </div>

              <div className="mt-4 max-h-[460px] space-y-2.5 overflow-y-auto pr-1">
                {(cycleSteps || []).length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                    Nenhum bloco configurado no ciclo.
                    <button
                      onClick={() => setIsEditingWizard(true)}
                      className="ml-1 font-bold text-[#F3AA2D] underline underline-offset-2 cursor-pointer"
                    >
                      Editar Planejamento
                    </button>
                  </div>
                ) : (
                  (cycleSteps || []).map((step, idx) => {
                    const disc = (disciplines || []).find((d) => d.id === step.disciplineId);
                    const isCurrent = idx === currentIndex;
                    const isPast = idx < currentIndex;
                    const barColor =
                      disciplineColorMap.get(step.disciplineId)?.color ||
                      PASTEL_COLORS[idx % PASTEL_COLORS.length];
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
                            ? "border-[#F3AA2D] bg-[#F3AA2D]/10 dark:bg-[#F3AA2D]/10"
                            : "border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-[#1B2129]"
                        }`}
                      >
                        <div
                          style={{ backgroundColor: barColor }}
                          className="absolute left-2.5 top-2.5 bottom-2.5 w-1 rounded-full"
                        />

                        <div className="ml-4 flex items-center gap-3">
                          <span className="num-condensed text-xs font-bold text-slate-400 dark:text-slate-500">
                            #{idx + 1}
                          </span>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {disc?.name || "Disciplina"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 num-condensed text-xs font-bold text-slate-600 dark:text-slate-300">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDurationRef(blockElapsed)} / {formatDurationRef(step.targetMinutes)}
                          </span>

                          {isCurrent && (
                            <button
                              onClick={() => handleStartStepStudy(step.disciplineId)}
                              className="flex items-center gap-1 rounded-lg bg-[#F3AA2D] px-2.5 py-1 text-[10px] font-bold text-[#11151F] transition hover:bg-[#e09a1d] cursor-pointer"
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

            {/* RIGHT: CICLO DONUT */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#252B38] flex flex-col">
              <div className="border-b border-slate-100 pb-3 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Ciclo
                </span>
              </div>

              <div className="relative my-4 flex flex-1 items-center justify-center">
                {(donutData || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={105}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#252B38",
                          border: "1px solid #39414F",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                        formatter={(value: any, name: any) => [
                          formatDurationHM(Number(value)),
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    Sem matérias no ciclo
                  </div>
                )}

                {(donutData || []).length > 0 && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="num-condensed text-2xl font-bold text-slate-900 dark:text-white">
                      {formatDurationHM(totalCycleMinutes)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      1 Rotação
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYOUT 2: PLANEJAMENTO SEMANAL */}
      {/* ========================================================================= */}
      {!isCycleMode && (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 animate-in fade-in duration-200">
            {/* Sidebar: mini calendar & agendas */}
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
                {/* Month navigator */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = new Date(currentCalendarDate);
                      prev.setMonth(prev.getMonth() - 1);
                      setCurrentCalendarDate(prev);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="num-condensed text-xs font-bold uppercase text-slate-900 dark:text-white">
                    {MONTHS_SHORT[currentCalendarDate.getMonth()]}. {currentCalendarDate.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(currentCalendarDate);
                      next.setMonth(next.getMonth() + 1);
                      setCurrentCalendarDate(next);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Day-of-week letters */}
                <div className="mt-3 grid grid-cols-7 text-center">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((letter, idx) => (
                    <span key={idx} className="num-condensed text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {letter}
                    </span>
                  ))}
                </div>

                {/* Days matrix (selected week highlighted) */}
                <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                  {(miniCalendarDays || []).map((item, idx) => {
                    if (!item.day) return <div key={`empty-${idx}`} className="h-7 w-7" />;
                    return (
                      <button
                        key={`day-${item.day}`}
                        type="button"
                        onClick={() => {
                          const clicked = new Date(currentCalendarDate);
                          clicked.setDate(item.day!);
                          setSelectedCalendarDate(clicked);
                        }}
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md num-condensed text-xs font-medium transition ${
                          item.isToday
                            ? "bg-[#F3AA2D] font-bold text-[#11151F]"
                            : item.isSelected
                            ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                            : item.inWeek
                            ? "bg-[#F3AA2D]/20 text-slate-900 dark:text-white"
                            : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        }`}
                      >
                        {item.day}
                      </button>
                    );
                  })}
                </div>

                {/* Minhas agendas */}
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Minhas Agendas
                  </h4>
                  <div className="mt-3 space-y-2.5">
                    {[
                      { label: "REVISÕES", state: showRevisoes, set: setShowRevisoes, dot: "bg-emerald-500" },
                      { label: "HISTÓRICO", state: showHistorico, set: setShowHistorico, dot: "bg-sky-500" },
                      { label: "PLANEJAMENTO", state: showPlanejamento, set: setShowPlanejamento, dot: "bg-[#F3AA2D]" },
                    ].map((item) => (
                      <label key={item.label} className="flex cursor-pointer items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                          <span className="text-xs font-bold text-slate-600 dark:text-white">
                            {item.label}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={item.state}
                          onChange={(e) => item.set(e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded accent-[#F3AA2D]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main: week nav bar + 7-day grid */}
            <div className="lg:col-span-9 space-y-4">
              {/* Navigation bar */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-3 shadow-sm dark:border-slate-800 dark:bg-[#252B38]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekOffset((prev) => prev - 1)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                    title="Semana anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {navMonthLabel}
                  </span>
                  <button
                    onClick={() => setWeekOffset((prev) => prev + 1)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                    title="Próxima semana"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => setWeekOffset(0)}
                      className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-white"
                    >
                      Hoje
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsEditingWizard(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                  title="Alterar forma de visualização"
                >
                  <span>Semanal</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 7-day timetable grid */}
              <div className="overflow-x-auto">
                <div className="grid min-w-[840px] grid-cols-7 gap-2">
                  {(weekDays || []).map((day) => {
                    const dayBlocks = showPlanejamento
                      ? (weeklySchedule || [])
                          .filter((b) => b.day === day.key)
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                      : [];

                    const dayReviews = showRevisoes
                      ? reviewItems.filter((r) => r.dueDate === dateToStr(day.date))
                      : [];

                    return (
                      <div
                        key={day.key}
                        className={`flex min-h-[420px] flex-col rounded-2xl border p-1.5 transition ${
                          day.isToday
                            ? "border-[#F3AA2D]/60 bg-white dark:bg-[#252B38]"
                            : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#1E2430]"
                        }`}
                      >
                        {/* Day header */}
                        <div
                          className={`mb-2 rounded-xl py-2 text-center text-xs font-bold uppercase tracking-wide ${
                            day.isToday
                              ? "bg-[#F3AA2D] text-[#11151F]"
                              : "bg-slate-50 text-slate-500 dark:bg-[#11151F] dark:text-slate-400"
                          }`}
                        >
                          {day.shortLabel}
                        </div>

                        <div className="flex-1 space-y-2">
                          {/* Revisão blocks at top */}
                          {dayReviews.slice(0, 2).map((r) => (
                            <div
                              key={r.id}
                              className="rounded-xl border border-emerald-300/60 bg-emerald-50 p-2 dark:border-emerald-800/60 dark:bg-emerald-950/40"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                                  Revisão
                                </span>
                                <span className="rounded-md bg-emerald-200/80 px-1.5 py-0.5 num-condensed text-[9px] font-bold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100">
                                  {r.stage}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-[10px] font-bold text-emerald-900 dark:text-emerald-200">
                                {r.disciplineName}
                              </p>
                            </div>
                          ))}
                          {dayReviews.length > 2 && (
                            <p className="text-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              +{dayReviews.length - 2} revisões
                            </p>
                          )}

                          {/* Planned blocks */}
                          {(dayBlocks || []).map((block) => {
                            const disc = (disciplines || []).find(
                              (d) => d.id === block.disciplineId
                            );
                            const palette =
                              disciplineColorMap.get(block.disciplineId)?.palette ||
                              DISCIPLINE_PALETTES[0];

                            return (
                              <div
                                key={block.id}
                                onClick={() => handleOpenEditBlock(block)}
                                className={`group relative cursor-pointer rounded-xl border p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md ${palette.bg} ${palette.border}`}
                              >
                                <p className={`text-xs font-bold leading-snug line-clamp-2 ${palette.text}`}>
                                  {disc?.name || "Disciplina"}
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                  <span
                                    className={`rounded-md px-2 py-0.5 num-condensed text-[10px] font-bold ${palette.badgeBg} ${palette.badgeText}`}
                                  >
                                    {formatDurationRef(block.targetMinutes)}
                                  </span>
                                  <div
                                    className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => handleStartStepStudy(block.disciplineId)}
                                      className="rounded-md bg-white/80 p-1 text-slate-700 hover:bg-white dark:bg-slate-800 dark:text-white"
                                      title="Estudar agora"
                                    >
                                      <Play className="h-3 w-3 fill-current" />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveWeeklyBlock(block.id)}
                                      className="rounded-md bg-white/80 p-1 text-rose-600 hover:bg-white dark:bg-slate-800"
                                      title="Excluir bloco"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {showPlanejamento && (dayBlocks || []).length === 0 && dayReviews.length === 0 && (
                            <p className="pt-2 text-center text-[10px] text-slate-300 dark:text-slate-600">
                              —
                            </p>
                          )}
                        </div>

                        {/* Add button */}
                        <button
                          type="button"
                          onClick={() => openAddBlockModal(day.key)}
                          className="mt-2 flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300 py-1.5 text-slate-400 transition hover:border-[#F3AA2D] hover:text-[#F3AA2D] dark:border-slate-700 dark:text-slate-500"
                          title="Adicionar bloco"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Floating action button */}
          <button
            type="button"
            onClick={() => openAddBlockModal("seg")}
            className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3AA2D] text-[#11151F] shadow-lg shadow-amber-500/20 transition hover:bg-[#e09a1d] active:scale-95"
            title="Adicionar bloco à agenda"
          >
            <Clock className="h-5 w-5" />
          </button>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR BLOCO */}
      {/* ========================================================================= */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#252B38]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
              <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Disciplina
                </label>
                <select
                  value={editDisciplineId}
                  onChange={(e) => setEditDisciplineId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-[#F3AA2D] focus:outline-none dark:border-slate-700 dark:bg-[#1B2129] dark:text-white"
                >
                  {(disciplines || []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Peso {d.weight || 1})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
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
                          ? "border-[#F3AA2D] bg-[#F3AA2D] text-[#11151F]"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1B2129] dark:text-slate-300"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleRemoveWeeklyBlock(editingBlock.id)}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Excluir</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBlock(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#F3AA2D] px-5 py-2 text-xs font-bold text-[#11151F] transition hover:bg-[#e09a1d]"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR BLOCO */}
      {/* ========================================================================= */}
      {isAddBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#252B38]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
              <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                Adicionar Bloco
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Dia da Semana
                </label>
                <select
                  value={addDay}
                  onChange={(e) => setAddDay(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-[#F3AA2D] focus:outline-none dark:border-slate-700 dark:bg-[#1B2129] dark:text-white"
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Disciplina
                </label>
                <select
                  value={addDisciplineId}
                  onChange={(e) => setAddDisciplineId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-[#F3AA2D] focus:outline-none dark:border-slate-700 dark:bg-[#1B2129] dark:text-white"
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
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
                          ? "border-[#F3AA2D] bg-[#F3AA2D] text-[#11151F]"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1B2129] dark:text-slate-300"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddBlockModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#F3AA2D] px-5 py-2 text-xs font-bold text-[#11151F] transition hover:bg-[#e09a1d]"
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
