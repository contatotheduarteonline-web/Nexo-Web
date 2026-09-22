import React, { useState, useMemo, useEffect, useRef } from "react";
import { useStudy } from "../../context/StudyContext";
import { StudyModality } from "../../types";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Plus,
  Minus,
  Target,
  RotateCw,
  Video,
  Scale,
  FileText,
  Search,
  ChevronDown,
  Check,
  ChevronRight,
  Loader2,
  Clock,
  Calendar,
  PenLine,
  Timer as TimerIcon,
} from "lucide-react";
import confetti from "canvas-confetti";

// Helpers for dates without timezone off-by-one errors
function getTodayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getYesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDatePtBr(ymdOrIso: string): string {
  if (!ymdOrIso) return "";
  const parts = ymdOrIso.split("T")[0].split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return ymdOrIso;
}

function calculateReviewDateStr(baseYmd: string, days: number): { formattedShort: string; formattedFull: string; ymd: string } {
  const [y, m, d] = baseYmd.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  const resYear = date.getFullYear();
  const resMonth = String(date.getMonth() + 1).padStart(2, "0");
  const resDay = String(date.getDate()).padStart(2, "0");
  return {
    formattedShort: `${resDay}/${resMonth}`,
    formattedFull: `${resDay}/${resMonth}/${resYear}`,
    ymd: `${resYear}-${resMonth}-${resDay}`,
  };
}

export const CronometroView: React.FC = () => {
  const {
    studyPlans,
    activePlan,
    editais,
    activeEdital,
    timer,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerConfig,
    finishCurrentSession,
    studySessions,
    setActiveTab,
  } = useStudy();

  // 1. Mandatory Entities Linkage State (Plano -> Edital -> Cargo -> Disciplina -> Tópico)
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [modality, setModality] = useState<StudyModality>("Teoria");

  // Topic search popover state
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const [topicSearchTerm, setTopicSearchTerm] = useState("");
  const topicDropdownRef = useRef<HTMLDivElement>(null);

  // Close topic dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target as Node)) {
        setIsTopicDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Synchronize initial plan
  useEffect(() => {
    if (!selectedPlanId) {
      const initialPlan = activePlan || studyPlans.find((p) => p.active) || studyPlans[0];
      if (initialPlan) {
        setSelectedPlanId(initialPlan.id);
      }
    }
  }, [activePlan, studyPlans, selectedPlanId]);

  // Derived active plan, edital, and cargo
  const currentPlan = useMemo(() => {
    return studyPlans.find((p) => p.id === selectedPlanId) || activePlan || studyPlans[0];
  }, [studyPlans, selectedPlanId, activePlan]);

  const currentEdital = useMemo(() => {
    if (!currentPlan) return activeEdital || editais[0];
    return (
      editais.find(
        (e) => e.id === currentPlan.editalId || (currentPlan.sourceEditalId && e.id === currentPlan.sourceEditalId)
      ) ||
      activeEdital ||
      editais[0]
    );
  }, [editais, currentPlan, activeEdital]);

  const cargoName = currentPlan?.cargo || currentEdital?.cargo || "Geral";

  const disciplines = useMemo(() => {
    return currentEdital?.disciplines || [];
  }, [currentEdital]);

  // Keep discipline and topic synchronized with current plan
  useEffect(() => {
    if (disciplines.length > 0) {
      if (!selectedDisciplineId || !disciplines.some((d) => d.id === selectedDisciplineId)) {
        setSelectedDisciplineId(disciplines[0].id);
      }
    } else {
      setSelectedDisciplineId("");
    }
  }, [disciplines, selectedDisciplineId]);

  const topics = useMemo(() => {
    if (!currentEdital || !selectedDisciplineId) return [];
    return currentEdital.topics.filter((t) => t.disciplineId === selectedDisciplineId);
  }, [currentEdital, selectedDisciplineId]);

  useEffect(() => {
    if (topics.length > 0) {
      if (!selectedTopicId || !topics.some((t) => t.id === selectedTopicId)) {
        setSelectedTopicId(topics[0].id);
      }
    } else {
      setSelectedTopicId("");
    }
  }, [topics, selectedTopicId]);

  const currentDiscipline = useMemo(() => {
    return disciplines.find((d) => d.id === selectedDisciplineId);
  }, [disciplines, selectedDisciplineId]);

  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId);
  }, [topics, selectedTopicId]);

  // Filtered topics for the searchable popover
  const filteredTopics = useMemo(() => {
    if (!topicSearchTerm.trim()) return topics;
    const term = topicSearchTerm.toLowerCase();
    return topics.filter((t) => t.name.toLowerCase().includes(term));
  }, [topics, topicSearchTerm]);

  // 2. Questions Counter State (three independent counters)
  const [questionsDone, setQuestionsDone] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);
  const [questionsWrong, setQuestionsWrong] = useState<number>(0);

  const accuracyRate = questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 100) : 0;

  const handleAddCorrect = () => setQuestionsCorrect((prev) => prev + 1);
  const handleSubtractCorrect = () => {
    setQuestionsCorrect((prev) => Math.max(0, prev - 1));
  };

  const handleAddWrong = () => setQuestionsWrong((prev) => prev + 1);
  const handleSubtractWrong = () => {
    setQuestionsWrong((prev) => Math.max(0, prev - 1));
  };

  const handleDirectQuestionsDoneChange = (val: number) => {
    setQuestionsDone(Math.max(0, val));
  };

  // 3. Time Mode State (Stopwatch vs Manual Time Input)
  const [timeMode, setTimeMode] = useState<"stopwatch" | "manual">("stopwatch");
  const [manualHours, setManualHours] = useState<number>(1);
  const [manualMinutes, setManualMinutes] = useState<number>(0);

  // Time format helper (HH:MM:SS or MM:SS)
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Quick manual time adjustments on stopwatch
  const handleAdjustMinutes = (mins: number) => {
    const newSeconds = Math.max(0, timer.elapsedSeconds + mins * 60);
    setTimerConfig({ elapsedSeconds: newSeconds });
  };

  // 4. Data do Estudo State (Hoje / Ontem / Outra data)
  const [dateSelectionType, setDateSelectionType] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState<string>(getTodayYmd());

  const effectiveStudyDate = useMemo(() => {
    if (dateSelectionType === "today") return getTodayYmd();
    if (dateSelectionType === "yesterday") return getYesterdayYmd();
    return customDate || getTodayYmd();
  }, [dateSelectionType, customDate]);

  // 5. Opções Independentes: Teoria Finalizada & Programar Revisões
  const [theoryCompleted, setTheoryCompleted] = useState<boolean>(false);
  const [scheduleReviews, setScheduleReviews] = useState<boolean>(false);
  const [selectedReviewDays, setSelectedReviewDays] = useState<number[]>([1, 7, 14, 30]);

  const reviewCycles = [1, 7, 14, 30];

  const toggleReviewDay = (days: number) => {
    setSelectedReviewDays((prev) =>
      prev.includes(days) ? prev.filter((d) => d !== days) : [...prev, days].sort((a, b) => a - b)
    );
  };

  // 6. Session Notes with Quick Tags
  const [sessionNotes, setSessionNotes] = useState<string>("");

  const appendQuickTag = (tagText: string) => {
    setSessionNotes((prev) => {
      const prefix = prev.trim() ? `${prev.trim()} ` : "";
      return `${prefix}[${tagText}] `;
    });
  };

  // 7. Computed duration for current session (in minutes)
  const currentDurationMinutes = useMemo(() => {
    if (timeMode === "manual") {
      return Math.max(0, manualHours * 60 + manualMinutes);
    }
    return Math.round(timer.elapsedSeconds / 60);
  }, [timeMode, manualHours, manualMinutes, timer.elapsedSeconds]);

  // 8. Submission & Atomic Save State
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Finish and Save Handler
  const handleFinishAndSave = async () => {
    if (isSaving) return;

    if (!selectedPlanId || !currentPlan) {
      alert("Por favor, selecione um Plano de Estudos.");
      return;
    }

    if (!selectedDisciplineId || !currentDiscipline) {
      alert("Por favor, selecione uma Disciplina para registrar o estudo.");
      return;
    }

    const duration =
      timeMode === "manual"
        ? manualHours * 60 + manualMinutes
        : Math.round(timer.elapsedSeconds / 60);

    if (duration <= 0 && questionsDone === 0 && questionsCorrect === 0 && questionsWrong === 0) {
      alert("Informe o tempo estudado (no cronômetro ou manualmente) ou registre questões para salvar.");
      return;
    }

    setIsSaving(true);

    try {
      const calculatedDuration = Math.max(1, duration);

      await finishCurrentSession({
        planId: selectedPlanId,
        editalId: currentEdital?.id || "",
        cargo: cargoName,
        disciplineId: selectedDisciplineId,
        topicId: selectedTopicId || undefined,
        modality,
        durationMinutes: calculatedDuration,
        questionsDone,
        questionsCorrect,
        notes: sessionNotes,
        studyDate: effectiveStudyDate,
        theoryCompleted,
        scheduleReviews,
        selectedReviewDays: scheduleReviews ? selectedReviewDays : [],
      });

      try {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch {
        // safe fallback
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);

      // Reset local inputs cleanly
      setQuestionsDone(0);
      setQuestionsCorrect(0);
      setQuestionsWrong(0);
      setSessionNotes("");
      setTheoryCompleted(false);
      setScheduleReviews(false);
      if (timeMode === "manual") {
        setManualHours(1);
        setManualMinutes(0);
      }
    } catch (error) {
      console.error("Erro ao finalizar estudo:", error);
      alert("Erro ao salvar sua sessão de estudos. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // Modalities List
  const modalities: { key: StudyModality; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: "Teoria", label: "Teoria", icon: BookOpen },
    { key: "Questões", label: "Questões", icon: Target },
    { key: "Revisão", label: "Revisão", icon: RotateCw },
    { key: "Videoaula", label: "Vídeo", icon: Video },
    { key: "Lei Seca", label: "Lei Seca", icon: Scale },
    { key: "Simulado", label: "Simulado", icon: FileText },
  ];

  // Recent study sessions (clean timeline items)
  const recentSessions = useMemo(() => {
    return studySessions.slice(0, 4);
  }, [studySessions]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* 1. Topo: Título limpo e direto, sem cargo/edital redundante e sem alternadores de modo */}
      <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white dark:text-white">
          Registro de Estudos
        </h1>
      </div>

      {/* 2. Grid Principal: 2 Colunas no Desktop (Esquerda ~65%, Direita ~35%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* COLUNA ESQUERDA (~65%) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Seletor Compacto: Disciplina e Tópico com busca */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Disciplina */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Disciplina
                </label>
                <div className="relative mt-1">
                  <select
                    id="study-discipline-select"
                    value={selectedDisciplineId}
                    onChange={(e) => {
                      const discId = e.target.value;
                      setSelectedDisciplineId(discId);
                      const firstTopic = currentEdital?.topics.find((t) => t.disciplineId === discId);
                      setSelectedTopicId(firstTopic?.id || "");
                    }}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs font-semibold text-white transition focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white cursor-pointer"
                  >
                    {disciplines.length === 0 ? (
                      <option value="">Nenhuma disciplina</option>
                    ) : (
                      disciplines.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" />
                </div>
              </div>

              {/* Tópico (Dropdown com busca instantânea) */}
              <div className="relative" ref={topicDropdownRef}>
                <label className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Tópico
                </label>
                <button
                  id="study-topic-dropdown-trigger"
                  type="button"
                  onClick={() => setIsTopicDropdownOpen((prev) => !prev)}
                  className="mt-1 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-white transition hover:border-slate-300 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white cursor-pointer"
                >
                  <span className="truncate">
                    {currentTopic?.name || "Selecionar tópico..."}
                  </span>
                  <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 text-white" />
                </button>

                {/* Popover pesquisável */}
                {isTopicDropdownOpen && (
                  <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#252B38]">
                    <div className="border-b border-slate-100 p-2 dark:border-slate-800">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Buscar tópico..."
                          value={topicSearchTerm}
                          onChange={(e) => setTopicSearchTerm(e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-white focus:border-[#F59E0B] focus:outline-none dark:border-slate-700 dark:bg-[#161C28] dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto p-1 text-xs">
                      {filteredTopics.length === 0 ? (
                        <div className="p-3 text-center text-white">
                          Nenhum tópico encontrado
                        </div>
                      ) : (
                        filteredTopics.map((t) => {
                          const isSelected = t.id === selectedTopicId;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setSelectedTopicId(t.id);
                                setIsTopicDropdownOpen(false);
                                setTopicSearchTerm("");
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition cursor-pointer ${
                                isSelected
                                  ? "bg-amber-50 font-bold text-[#F59E0B] dark:bg-amber-950/40 dark:text-[#FBBF24]"
                                  : "text-white hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                              }`}
                            >
                              <span className="truncate">{t.name}</span>
                              {isSelected && <Check className="ml-2 h-3.5 w-3.5 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Atividade: Segmented Control Compacto */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {modalities.map((item) => {
                const IconComp = item.icon;
                const isSelected = modality === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setModality(item.key)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? "bg-[#F59E0B] text-white shadow-xs"
                        : "bg-slate-50 text-white hover:bg-slate-100 dark:bg-[#0F172A] dark:text-white dark:hover:bg-slate-800"
                    }`}
                  >
                    <IconComp className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cronômetro & Registro Manual de Tempo */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
            {/* Alternador discreto entre Cronômetro e Tempo Manual */}
            <div className="mb-4 inline-flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setTimeMode("stopwatch")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  timeMode === "stopwatch"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                    : "text-white hover:text-white dark:text-white dark:hover:text-white"
                }`}
              >
                <TimerIcon className="h-3.5 w-3.5" />
                <span>Cronômetro</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeMode("manual")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  timeMode === "manual"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                    : "text-white hover:text-white dark:text-white dark:hover:text-white"
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>Registrar tempo manual</span>
              </button>
            </div>

            {timeMode === "stopwatch" ? (
              /* MODO CRONÔMETRO */
              <>
                {/* Display do Tempo */}
                <div className="font-mono text-7xl font-bold tracking-tight text-white sm:text-8xl dark:text-white">
                  {formatTime(timer.elapsedSeconds)}
                </div>

                {/* Disciplina e Tópico em foco */}
                <div className="mt-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] dark:text-[#FBBF24]">
                    {currentDiscipline?.name || "Disciplina"}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-white dark:text-white">
                    {currentTopic?.name || "Geral"}
                  </div>
                </div>

                {/* Ajustes rápidos de tempo discretos */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleAdjustMinutes(-5)}
                    className="rounded-md px-2 py-1 font-mono text-white hover:bg-slate-100 hover:text-white dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    −5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustMinutes(5)}
                    className="rounded-md px-2 py-1 font-mono text-white hover:bg-slate-100 hover:text-white dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustMinutes(15)}
                    className="rounded-md px-2 py-1 font-mono text-white hover:bg-slate-100 hover:text-white dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    +15
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustMinutes(30)}
                    className="rounded-md px-2 py-1 font-mono text-white hover:bg-slate-100 hover:text-white dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    +30
                  </button>
                </div>

                {/* Ações do Cronômetro */}
                <div className="mt-6 flex items-center justify-center gap-3">
                  {timer.isRunning ? (
                    <button
                      id="timer-pause-btn"
                      type="button"
                      onClick={pauseTimer}
                      className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-amber-600 active:scale-98 cursor-pointer"
                    >
                      <Pause className="h-4 w-4 fill-white" />
                      Pausar
                    </button>
                  ) : (
                    <button
                      id="timer-start-btn"
                      type="button"
                      onClick={startTimer}
                      className="flex items-center gap-2 rounded-xl bg-[#F59E0B] px-7 py-2.5 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition hover:bg-[#D97706] active:scale-98 cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      {timer.elapsedSeconds > 0 ? "Continuar" : "Iniciar"}
                    </button>
                  )}

                  <button
                    id="timer-reset-btn"
                    type="button"
                    onClick={resetTimer}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              /* MODO TEMPO MANUAL */
              <div className="py-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Tempo Estudado
                </span>

                {/* Inputs de Horas e Minutos formatados [ HH : MM ] */}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={manualHours}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                          setManualHours(val);
                        }}
                        className="h-20 w-24 rounded-2xl border border-slate-200 bg-slate-50 text-center font-mono text-5xl font-bold text-white focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white"
                      />
                    </div>
                    <span className="mt-1 text-[11px] font-bold text-white">Horas</span>
                  </div>

                  <span className="font-mono text-5xl font-bold text-white dark:text-white">
                    :
                  </span>

                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={manualMinutes}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                          setManualMinutes(val);
                        }}
                        className="h-20 w-24 rounded-2xl border border-slate-200 bg-slate-50 text-center font-mono text-5xl font-bold text-white focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white"
                      />
                    </div>
                    <span className="mt-1 text-[11px] font-bold text-white">Minutos</span>
                  </div>
                </div>

                {/* Atalhos rápidos de tempo manual */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
                  {[
                    { label: "30m", h: 0, m: 30 },
                    { label: "45m", h: 0, m: 45 },
                    { label: "1h", h: 1, m: 0 },
                    { label: "1h 15m", h: 1, m: 15 },
                    { label: "1h 30m", h: 1, m: 30 },
                    { label: "2h", h: 2, m: 0 },
                    { label: "3h 45m", h: 3, m: 45 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setManualHours(preset.h);
                        setManualMinutes(preset.m);
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-white hover:border-amber-300 hover:bg-amber-50 hover:text-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white dark:hover:border-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-[#FBBF24] cursor-pointer transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Disciplina e Tópico em foco */}
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] dark:text-[#FBBF24]">
                    {currentDiscipline?.name || "Disciplina"}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-white dark:text-white">
                    {currentTopic?.name || "Geral"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Questões: Card Compacto com 3 métricas */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                QUESTÕES
              </span>
              {questionsDone > 0 && (
                <span className="text-xs font-bold text-[#F59E0B] dark:text-[#FBBF24]">
                  {accuracyRate}% aproveitamento
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {/* Total Questões */}
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-[#0F172A]">
                <div className="text-2xl font-bold text-white dark:text-white">
                  {questionsDone}
                </div>
                <div className="mt-0.5 text-[11px] text-white">Questões</div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDirectQuestionsDoneChange(questionsDone - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-white hover:bg-slate-100 dark:border-slate-700 dark:text-white cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectQuestionsDoneChange(questionsDone + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Acertos */}
              <div className="rounded-lg bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {questionsCorrect}
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
                  Acertos
                </div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={handleSubtractCorrect}
                    className="flex h-6 w-6 items-center justify-center rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400 cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCorrect}
                    className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Erros */}
              <div className="rounded-lg bg-rose-50/50 p-3 dark:bg-rose-950/20">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {questionsWrong}
                </div>
                <div className="mt-0.5 text-[11px] text-rose-600/70 dark:text-rose-400/70">
                  Erros
                </div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={handleSubtractWrong}
                    className="flex h-6 w-6 items-center justify-center rounded border border-rose-200 text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-400 cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleAddWrong}
                    className="flex h-6 w-6 items-center justify-center rounded bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (~35%) */}
        <div className="space-y-5 lg:col-span-4">
          {/* Data do Estudo (Hoje, Ontem, Outra data) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white">
                Data do estudo
              </label>
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setDateSelectionType("today");
                    setCustomDate(getTodayYmd());
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    dateSelectionType === "today"
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                      : "text-white hover:text-white dark:text-white"
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateSelectionType("yesterday");
                    setCustomDate(getYesterdayYmd());
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    dateSelectionType === "yesterday"
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                      : "text-white hover:text-white dark:text-white"
                  }`}
                >
                  Ontem
                </button>
                <button
                  type="button"
                  onClick={() => setDateSelectionType("custom")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    dateSelectionType === "custom"
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                      : "text-white hover:text-white dark:text-white"
                  }`}
                >
                  Outra data
                </button>
              </div>
            </div>

            {dateSelectionType === "custom" && (
              <div className="mt-3">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-white focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white cursor-pointer"
                />
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-white dark:text-white border-t border-slate-100 pt-2 dark:border-slate-800/80">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-white" />
                Data de referência:
              </span>
              <span className="font-semibold text-white dark:text-white">
                {formatDatePtBr(effectiveStudyDate)}
              </span>
            </div>
          </div>

          {/* Anotações */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Anotações
            </h3>

            <textarea
              id="session-notes-input"
              rows={3}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="O que você precisa lembrar deste estudo?"
              className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-white placeholder:text-white focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white"
            />

            {/* Chips de tags compactos */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => appendQuickTag("Lei Seca")}
                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
              >
                Lei Seca
              </button>
              <button
                type="button"
                onClick={() => appendQuickTag("Pegadinha")}
                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
              >
                Pegadinha
              </button>
              <button
                type="button"
                onClick={() => appendQuickTag("Ponto-chave")}
                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
              >
                Ponto-chave
              </button>
              <button
                type="button"
                onClick={() => appendQuickTag("Dúvida")}
                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
              >
                Dúvida
              </button>
            </div>
          </div>

          {/* DUAS OPÇÕES INDEPENDENTES E VISUALMENTE DESTACADAS */}
          <div className="space-y-3">
            {/* Opção 1: Teoria Finalizada */}
            <div
              id="toggle-theory-completed-card"
              onClick={() => setTheoryCompleted((prev) => !prev)}
              className={`group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition select-none ${
                theoryCompleted
                  ? "border-emerald-500 bg-emerald-50/70 shadow-xs dark:border-emerald-600 dark:bg-emerald-950/30"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#0F172A] dark:hover:border-slate-700"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  theoryCompleted
                    ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                    : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                {theoryCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div
                  className={`text-xs font-bold transition ${
                    theoryCompleted
                      ? "text-emerald-900 dark:text-emerald-200"
                      : "text-white dark:text-white"
                  }`}
                >
                  Teoria finalizada
                </div>
                <div
                  className={`text-[11px] transition ${
                    theoryCompleted
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-white dark:text-white"
                  }`}
                >
                  Marcar tópico como concluído
                </div>
              </div>
            </div>

            {/* Opção 2: Programar Revisões (Interação progressiva) */}
            <div
              className={`rounded-xl border transition ${
                scheduleReviews
                  ? "border-amber-500/70 bg-amber-50/40 shadow-xs dark:border-amber-600/70 dark:bg-amber-950/20"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0F172A]"
              }`}
            >
              <div
                id="toggle-schedule-reviews-card"
                onClick={() => setScheduleReviews((prev) => !prev)}
                className="group flex cursor-pointer items-start gap-3 p-3.5 select-none"
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    scheduleReviews
                      ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                      : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  {scheduleReviews && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-xs font-bold transition ${
                      scheduleReviews
                        ? "text-[#F59E0B] dark:text-[#FBBF24]"
                        : "text-white dark:text-white"
                    }`}
                  >
                    Programar revisões
                  </div>
                  <div
                    className={`text-[11px] transition ${
                      scheduleReviews
                        ? "text-amber-800/80 dark:text-amber-300/80"
                        : "text-white dark:text-white"
                    }`}
                  >
                    Revisar este tópico depois
                  </div>
                </div>
              </div>

              {/* Revelação progressiva dos ciclos e datas calculadas a partir da DATA DO ESTUDO */}
              {scheduleReviews && (
                <div className="border-t border-amber-200/60 p-3.5 pt-3 dark:border-amber-900/40">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white">
                    Ciclos de Revisão
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {reviewCycles.map((days) => {
                      const isSelected = selectedReviewDays.includes(days);
                      return (
                        <button
                          key={days}
                          type="button"
                          onClick={() => toggleReviewDay(days)}
                          className={`rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? "bg-[#F59E0B] text-white shadow-xs"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                          }`}
                        >
                          {days}d
                        </button>
                      );
                    })}
                  </div>

                  {/* Datas calculadas a partir da DATA DO ESTUDO */}
                  {selectedReviewDays.length > 0 ? (
                    <div className="mt-3 space-y-1.5 border-t border-amber-200/40 pt-2.5 dark:border-amber-900/30">
                      {selectedReviewDays.map((days) => {
                        const dateInfo = calculateReviewDateStr(effectiveStudyDate, days);
                        return (
                          <div
                            key={days}
                            className="flex items-center justify-between text-xs text-white dark:text-white"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <Check className="h-3 w-3 text-[#F59E0B] dark:text-[#FBBF24]" />
                              {days}d
                            </span>
                            <span className="font-mono text-xs font-semibold text-white dark:text-white">
                              {dateInfo.formattedFull}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2 text-center text-xs text-white">
                      Nenhum ciclo selecionado
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 15. RESUMO ANTES DE SALVAR (compacto e limpo) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-[#0F172A]/60">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-white dark:text-white">
              <span className="font-semibold text-white dark:text-white">
                {formatDatePtBr(effectiveStudyDate)}
              </span>
              <span>·</span>
              <span className="font-semibold text-white dark:text-white">
                {currentDurationMinutes >= 60
                  ? `${Math.floor(currentDurationMinutes / 60)}h${currentDurationMinutes % 60 > 0 ? ` ${currentDurationMinutes % 60}min` : ""}`
                  : `${currentDurationMinutes} min`}
              </span>
              <span>·</span>
              <span>{modality}</span>

              {theoryCompleted && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Check className="h-3 w-3 stroke-[3]" />
                    Teoria finalizada
                  </span>
                </>
              )}

              {scheduleReviews && selectedReviewDays.length > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-[#F59E0B] dark:bg-amber-950/60 dark:text-[#FBBF24]">
                    <RotateCw className="h-3 w-3" />
                    {selectedReviewDays.map((d) => `${d}d`).join(" · ")}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 16. BOTÃO FINAL: Finalizar Estudo */}
          <div>
            <button
              id="finalize-study-session-btn"
              type="button"
              disabled={isSaving}
              onClick={handleFinishAndSave}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition active:scale-98 disabled:opacity-60 cursor-pointer ${
                savedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-[#F59E0B] hover:bg-[#D97706]"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Estudo registrado</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Finalizar estudo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Timeline / Histórico Visual Diferenciado */}
      {recentSessions.length > 0 && (
        <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Histórico recente
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab("historico")}
              className="flex items-center gap-1 text-xs font-semibold text-[#F59E0B] hover:underline dark:text-[#FBBF24] cursor-pointer"
            >
              <span>Ver histórico completo</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentSessions.map((s) => {
              const displayDate = formatDatePtBr(s.studyDate || s.date.split("T")[0]);
              const acc =
                s.questionsDone > 0 ? Math.round((s.questionsCorrect / s.questionsDone) * 100) : null;

              return (
                <div
                  key={s.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#252B38] dark:hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">{displayDate}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-slate-800 dark:text-white">
                        {s.modality}
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-bold text-white dark:text-white">
                      {s.disciplineName}
                    </div>
                    <div className="truncate text-xs text-white dark:text-white">
                      {s.topicName || "Geral"}
                    </div>
                  </div>

                  {/* Métricas e Diferenciação Visual Solicitada */}
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2 text-[11px] dark:border-slate-800">
                    <div className="flex items-center justify-between text-white dark:text-white">
                      <span>{s.durationMinutes} min</span>
                      {acc !== null ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {acc}% ({s.questionsCorrect}/{s.questionsDone})
                        </span>
                      ) : (
                        <span>Sem questões</span>
                      )}
                    </div>

                    {s.theoryCompleted && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>Teoria finalizada</span>
                      </div>
                    )}

                    {Boolean(s.reviewsScheduled && s.reviewsScheduled > 0) && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#F59E0B] dark:text-[#FBBF24]">
                        <RotateCw className="h-3 w-3" />
                        <span>
                          {s.reviewsScheduled}{" "}
                          {s.reviewsScheduled === 1 ? "revisão programada" : "revisões programadas"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
