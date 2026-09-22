import React, { useState, useEffect } from "react";
import { useStudy } from "../../context/StudyContext";
import { useToast } from "../../context/ToastContext";
import { StudyModality } from "../../types";
import {
  Clock,
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  BookOpen,
  Plus,
  Minus,
  Maximize2,
  Calendar,
  Target,
  RotateCw,
  Video,
  Scale,
  FileText,
  PenLine,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";

// ---------- Date helpers (local, no timezone drift) ----------
function getTodayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getYesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDatePtBr(ymd: string): string {
  const [y, m, d] = ymd.split("T")[0].split("-");
  if (y && m && d) return `${d}/${m}/${y}`;
  return ymd;
}

export const FloatingTimerWidget: React.FC = () => {
  const {
    activeEdital,
    timer,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerConfig,
    finishCurrentSession,
    setActiveTab,
  } = useStudy();

  const { triggerXpMilestoneToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);

  // Time mode: live stopwatch (global timer) or manual time entry
  const [timeMode, setTimeMode] = useState<"stopwatch" | "manual">("stopwatch");
  const [manualHours, setManualHours] = useState<number>(0);
  const [manualMinutes, setManualMinutes] = useState<number>(0);

  // Study date
  const [dateSelectionType, setDateSelectionType] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState<string>(getTodayYmd());

  // Notes
  const [notes, setNotes] = useState<string>("");

  // Synchronize initial selections when opening
  useEffect(() => {
    if (activeEdital && activeEdital.disciplines.length > 0) {
      if (!timer.disciplineId) {
        const firstDisc = activeEdital.disciplines[0];
        const firstTopic = activeEdital.topics.find((t) => t.disciplineId === firstDisc.id);
        setTimerConfig({
          disciplineId: firstDisc.id,
          disciplineName: firstDisc.name,
          topicId: firstTopic?.id || "",
          topicName: firstTopic?.name || "Estudo Geral",
        });
      }
    }
  }, [activeEdital, timer.disciplineId, setTimerConfig]);

  // Reset local form state when opening
  useEffect(() => {
    if (isOpen) {
      setTimeMode("stopwatch");
      setManualHours(0);
      setManualMinutes(0);
      setDateSelectionType("today");
      setCustomDate(getTodayYmd());
      setNotes("");
    }
  }, [isOpen]);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const activeDiscipline = activeEdital?.disciplines.find((d) => d.id === timer.disciplineId);
  const disciplineTopics = activeEdital?.topics.filter((t) => t.disciplineId === timer.disciplineId) || [];
  const activeTopic = disciplineTopics.find((t) => t.id === timer.topicId);

  // Quick adjustments on stopwatch
  const handleAdjustMinutes = (mins: number) => {
    setTimerConfig({ elapsedSeconds: Math.max(0, timer.elapsedSeconds + mins * 60) });
  };

  // Questions helpers (invariant: feitas = acertos + erros)
  const handleIncQuestionsDone = () => {
    setTimerConfig({ questionsDone: (timer.questionsDone || 0) + 1 });
  };
  const handleDecQuestionsDone = () => {
    const nextVal = Math.max(0, (timer.questionsDone || 0) - 1);
    setTimerConfig({
      questionsDone: nextVal,
      questionsCorrect: Math.min(timer.questionsCorrect || 0, nextVal),
    });
  };
  const handleIncQuestionsCorrect = () => {
    const nextCorrect = (timer.questionsCorrect || 0) + 1;
    const nextDone = Math.max(timer.questionsDone || 0, nextCorrect);
    setTimerConfig({
      questionsCorrect: nextCorrect,
      questionsDone: nextDone,
    });
  };
  const handleDecQuestionsCorrect = () => {
    setTimerConfig({ questionsCorrect: Math.max(0, (timer.questionsCorrect || 0) - 1) });
  };

  const questionsDone = timer.questionsDone || 0;
  const questionsCorrect = timer.questionsCorrect || 0;
  const wrongQuestions = Math.max(0, questionsDone - questionsCorrect);
  const accuracyRate = questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 100) : 0;

  const effectiveStudyDate =
    dateSelectionType === "today"
      ? getTodayYmd()
      : dateSelectionType === "yesterday"
      ? getYesterdayYmd()
      : customDate || getTodayYmd();

  const durationMinutes =
    timeMode === "manual"
      ? Math.max(0, manualHours * 60 + manualMinutes)
      : Math.round(timer.elapsedSeconds / 60);

  const durationLabel =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? ` ${durationMinutes % 60}min` : ""}`
      : `${durationMinutes} min`;

  const appendQuickTag = (tagText: string) => {
    setNotes((prev) => {
      const prefix = prev.trim() ? `${prev.trim()} ` : "";
      return `${prefix}[${tagText}] `;
    });
  };

  const modalities: { key: StudyModality; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: "Teoria", label: "Teoria", icon: BookOpen },
    { key: "Questões", label: "Questões", icon: Target },
    { key: "Revisão", label: "Revisão", icon: RotateCw },
    { key: "Videoaula", label: "Vídeo", icon: Video },
    { key: "Lei Seca", label: "Lei Seca", icon: Scale },
    { key: "Simulado", label: "Simulado", icon: FileText },
  ];

  // Unified finish: live stopwatch or manual time, same save pipeline
  const handleFinishStudy = async () => {
    if (!activeEdital || !timer.disciplineId) {
      alert("Selecione uma disciplina.");
      return;
    }

    const duration =
      timeMode === "manual"
        ? manualHours * 60 + manualMinutes
        : Math.round(timer.elapsedSeconds / 60);

    if (duration <= 0 && questionsDone === 0) {
      alert("Informe o tempo estudado ou registre questões para salvar.");
      return;
    }

    const xpEarned = Math.round((duration / 60) * 50) + questionsDone * 10 + questionsCorrect * 5;

    try {
      await finishCurrentSession({
        editalId: activeEdital.id,
        disciplineId: timer.disciplineId,
        topicId: timer.topicId || undefined,
        modality: timer.modality,
        durationMinutes: Math.max(1, duration),
        questionsDone,
        questionsCorrect,
        notes,
        studyDate: effectiveStudyDate,
        scheduleReviews: false,
        selectedReviewDays: [],
      });
    } catch (error) {
      console.error("Erro ao finalizar estudo:", error);
      alert("Erro ao salvar sua sessão de estudos. Tente novamente.");
      return;
    }

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // safe fallback
    }

    triggerXpMilestoneToast(xpEarned, xpEarned, "Sessão Concluída no Cronômetro!");
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 select-none">
        {/* Floating Tooltip Label when Timer is actively running */}
        {timer.isRunning && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2D3442] text-white shadow-xl border border-[#384154] hover:border-[#4A556E] cursor-pointer transition-colors duration-200"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-black tracking-wider">{formatTime(timer.elapsedSeconds)}</span>
            <span className="text-[10px] opacity-70 font-semibold truncate max-w-[110px]">
              {activeDiscipline?.name || "Estudando"}
            </span>
          </motion.div>
        )}

        {/* Main Floating Trigger Button — âmbar sólido, elevação sutil */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen((prev) => !prev)}
          id="floating-clock-btn"
          aria-label="Abrir Cronômetro e Registro de Estudos"
          className={`relative flex h-16 w-16 items-center justify-center rounded-2xl sm:rounded-3xl cursor-pointer select-none transition-colors duration-200 border ${
            timer.isRunning
              ? "border-emerald-400/40 bg-[#10B981] text-white shadow-[0_10px_28px_-8px_rgba(16,185,129,0.5)]"
              : "border-[#F3AA2D]/40 bg-[#F3AA2D] text-[#11151F] shadow-[0_10px_28px_-8px_rgba(243,170,45,0.5)] hover:bg-[#D98F20]"
          }`}
        >
          {/* Clock Icon com traço consistente */}
          <div className="relative flex items-center justify-center">
            {timer.isRunning ? (
              <Timer className="h-8 w-8 stroke-[2.2]" />
            ) : (
              <Clock className="h-8 w-8 stroke-[2.2]" />
            )}

            {/* Micro Badge para Questões ou Tempo em pausa */}
            {timer.elapsedSeconds > 0 && !timer.isRunning && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#11151F] text-[#F3AA2D] text-[9px] font-black shadow-md border border-[#384154]">
                ||
              </span>
            )}
          </div>
        </motion.button>
      </div>

      {/* Floating Modal — fundo desfocado */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-[#0d0f12]/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#384154] bg-[#11151F] text-white max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#384154] bg-[#171B25] px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3AA2D] text-[#11151F]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="font-condensed text-[17px] font-bold text-white">
                    Registro de Estudos
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setActiveTab("cronometro");
                    }}
                    className="p-1.5 rounded-xl text-white hover:bg-[#252B38] hover:text-white transition cursor-pointer"
                    title="Abrir Cronômetro em Tela Cheia"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl text-white hover:bg-[#252B38] hover:text-white transition cursor-pointer"
                    title="Fechar Janela"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 scrollbar-thin">
                {/* Disciplina & Tópico */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white mb-1.5">
                      Disciplina
                    </label>
                    <select
                      value={timer.disciplineId}
                      onChange={(e) => {
                        const discId = e.target.value;
                        const d = activeEdital?.disciplines.find((item) => item.id === discId);
                        const firstTopic = activeEdital?.topics.find((t) => t.disciplineId === discId);
                        setTimerConfig({
                          disciplineId: discId,
                          disciplineName: d?.name || "Geral",
                          topicId: firstTopic?.id || "",
                          topicName: firstTopic?.name || "Geral",
                        });
                      }}
                      className="w-full rounded-xl border border-[#384154] bg-[#252B38] px-3 py-2 text-xs font-semibold text-white focus:border-[#F3AA2D] focus:outline-none cursor-pointer"
                    >
                      {activeEdital?.disciplines.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white mb-1.5">
                      Tópico
                    </label>
                    <select
                      value={timer.topicId}
                      onChange={(e) => {
                        const topId = e.target.value;
                        const t = activeEdital?.topics.find((item) => item.id === topId);
                        setTimerConfig({
                          topicId: topId,
                          topicName: t?.name || "Estudo Geral",
                        });
                      }}
                      className="w-full rounded-xl border border-[#384154] bg-[#252B38] px-3 py-2 text-xs font-semibold text-white focus:border-[#F3AA2D] focus:outline-none cursor-pointer truncate"
                    >
                      {disciplineTopics.length === 0 ? (
                        <option value="">Sem tópicos específicos</option>
                      ) : (
                        disciplineTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Modalidades */}
                <div className="grid grid-cols-3 gap-1.5">
                  {modalities.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = timer.modality === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setTimerConfig({ modality: item.key })}
                        className={`flex items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-[#F3AA2D] text-[#11151F]"
                            : "border border-[#384154] bg-[#252B38] text-white hover:border-[#F3AA2D]/40"
                        }`}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Cronômetro / Tempo manual */}
                <div className="nx-card p-5 text-center">
                  {/* Alternador */}
                  <div className="mb-4 inline-flex items-center rounded-xl border border-[#384154] bg-[#171B25] p-1">
                    <button
                      type="button"
                      onClick={() => setTimeMode("stopwatch")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        timeMode === "stopwatch"
                          ? "bg-[#F3AA2D] text-[#11151F]"
                          : "text-white hover:text-white"
                      }`}
                    >
                      <Timer className="h-3.5 w-3.5" />
                      <span>Cronômetro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeMode("manual")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        timeMode === "manual"
                          ? "bg-[#F3AA2D] text-[#11151F]"
                          : "text-white hover:text-white"
                      }`}
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      <span>Registrar tempo manual</span>
                    </button>
                  </div>

                  {timeMode === "stopwatch" ? (
                    <>
                      {/* Display do tempo */}
                      <div className="num-condensed text-[52px] font-bold leading-none tracking-tight text-white tabular-nums">
                        {formatTime(timer.elapsedSeconds)}
                      </div>

                      {/* Disciplina e tópico em foco */}
                      <div className="mt-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#F3AA2D]">
                          {activeDiscipline?.name || "Disciplina"}
                        </div>
                        <div className="mt-0.5 text-[13px] font-medium text-white truncate">
                          {activeTopic?.name || "Estudo Geral"}
                        </div>
                      </div>

                      {/* Ajustes rápidos */}
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                        {[-5, 5, 15, 30].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => handleAdjustMinutes(mins)}
                            className="rounded-lg border border-[#384154] bg-[#171B25] px-2.5 py-1 font-mono text-white hover:border-[#F3AA2D]/40 hover:text-[#F3AA2D] cursor-pointer transition-colors"
                          >
                            {mins > 0 ? `+${mins}` : `−${Math.abs(mins)}`}
                          </button>
                        ))}
                      </div>

                      {/* Ações */}
                      <div className="mt-5 flex items-center justify-center gap-3">
                        {timer.isRunning ? (
                          <button
                            type="button"
                            onClick={pauseTimer}
                            className="nx-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold"
                          >
                            <Pause className="h-4 w-4 fill-[#11151F]" />
                            Pausar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startTimer}
                            className="nx-btn-primary inline-flex items-center gap-2 px-7 py-2.5 text-[13px] font-bold"
                          >
                            <Play className="h-4 w-4 fill-[#11151F]" />
                            {timer.elapsedSeconds > 0 ? "Continuar" : "Iniciar"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={resetTimer}
                          disabled={timer.elapsedSeconds === 0}
                          className="rounded-xl border border-[#384154] px-3.5 py-2.5 text-white hover:border-[#F3AA2D]/40 hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
                          title="Zerar"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                        Tempo estudado
                      </span>
                      <div className="mt-3 flex items-center justify-center gap-2.5">
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={manualHours}
                            onChange={(e) =>
                              setManualHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))
                            }
                            className="num-condensed h-16 w-[72px] rounded-2xl border border-[#384154] bg-[#171B25] text-center text-[32px] font-bold text-white focus:border-[#F3AA2D] focus:outline-none"
                          />
                          <span className="mt-1 text-[10px] font-bold text-white">Horas</span>
                        </div>
                        <span className="num-condensed text-[32px] font-bold text-white">:</span>
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min={0}
                            max={59}
                            value={manualMinutes}
                            onChange={(e) =>
                              setManualMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
                            }
                            className="num-condensed h-16 w-[72px] rounded-2xl border border-[#384154] bg-[#171B25] text-center text-[32px] font-bold text-white focus:border-[#F3AA2D] focus:outline-none"
                          />
                          <span className="mt-1 text-[10px] font-bold text-white">Minutos</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Questões */}
                <div className="nx-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                      Questões
                    </span>
                    {questionsDone > 0 && (
                      <span className="text-xs font-bold text-[#F3AA2D]">
                        {accuracyRate}% aproveitamento
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2.5 text-center">
                    {/* Questões */}
                    <div className="nx-deep rounded-xl p-3">
                      <div className="num-condensed text-[24px] font-bold text-white">
                        {questionsDone}
                      </div>
                      <div className="mt-0.5 text-[11px] text-white">Questões</div>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={handleDecQuestionsDone}
                          className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#384154] text-white hover:border-[#F3AA2D]/40 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={handleIncQuestionsDone}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#384154] text-white hover:bg-[#4A556E] cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Acertos */}
                    <div className="nx-deep rounded-xl p-3">
                      <div className="num-condensed text-[24px] font-bold text-[#34D399]">
                        {questionsCorrect}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#34D399]/70">Acertos</div>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={handleDecQuestionsCorrect}
                          className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#384154] text-white hover:border-[#34D399]/40 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={handleIncQuestionsCorrect}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#34D399] text-white cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Erros */}
                    <div className="nx-deep rounded-xl p-3">
                      <div className="num-condensed text-[24px] font-bold text-[#F87171]">
                        {wrongQuestions}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#F87171]/70">Erros</div>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={handleDecQuestionsDone}
                          className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#384154] text-white hover:border-[#F87171]/40 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={handleIncQuestionsDone}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F87171] text-white cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data do estudo */}
                <div className="nx-card p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white">
                      Data do estudo
                    </label>
                    <div className="flex items-center rounded-xl border border-[#384154] bg-[#171B25] p-0.5">
                      {(["today", "yesterday", "custom"] as const).map((type) => {
                        const label =
                          type === "today" ? "Hoje" : type === "yesterday" ? "Ontem" : "Outra data";
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setDateSelectionType(type)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                              dateSelectionType === type
                                ? "bg-[#F3AA2D] text-[#11151F]"
                                : "text-white hover:text-white"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {dateSelectionType === "custom" && (
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="mt-3 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3 py-2 text-xs font-semibold text-white focus:border-[#F3AA2D] focus:outline-none cursor-pointer"
                    />
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-[#384154] pt-2.5 text-[11px] text-white">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-white" />
                      Data de referência:
                    </span>
                    <span className="font-semibold text-white">
                      {formatDatePtBr(effectiveStudyDate)}
                    </span>
                  </div>
                </div>

                {/* Anotações */}
                <div className="nx-card p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">
                    Anotações
                  </h3>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="O que você precisa lembrar deste estudo?"
                    className="mt-2 w-full resize-none rounded-xl border border-[#384154] bg-[#171B25] p-2.5 text-xs text-white placeholder:text-white focus:border-[#F3AA2D] focus:outline-none"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Lei Seca", "Pegadinha", "Ponto-chave", "Dúvida"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => appendQuickTag(tag)}
                        className="rounded-lg border border-[#384154] bg-[#171B25] px-2 py-1 text-[11px] font-medium text-white hover:border-[#F3AA2D]/40 hover:text-[#F3AA2D] cursor-pointer transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer: resumo + finalizar */}
              <div className="flex items-center justify-between gap-4 border-t border-[#384154] bg-[#171B25] px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white">
                  <span className="font-semibold text-white">
                    {formatDatePtBr(effectiveStudyDate)}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-white">{durationLabel}</span>
                  <span>·</span>
                  <span>{timer.modality || "Teoria"}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFinishStudy}
                  className="nx-btn-primary inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-[13px] font-bold"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finalizar estudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
