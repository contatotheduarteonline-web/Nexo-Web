import React, { useState, useEffect, useMemo } from "react";
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
  Zap,
  BookOpen,
  Plus,
  Minus,
  Sparkles,
  Maximize2,
  Calendar,
  Layers,
  ChevronDown,
  Target,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";

export const FloatingTimerWidget: React.FC = () => {
  const {
    activeEdital,
    timer,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerConfig,
    finishCurrentSession,
    logStudySession,
    setActiveTab,
  } = useStudy();

  const { triggerXpMilestoneToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState<"LIVE_TIMER" | "MANUAL_LOG">("LIVE_TIMER");

  // State for Manual Log tab
  const [manualDisciplineId, setManualDisciplineId] = useState<string>("");
  const [manualTopicId, setManualTopicId] = useState<string>("");
  const [manualDurationMinutes, setManualDurationMinutes] = useState<number>(50);
  const [manualModality, setManualModality] = useState<StudyModality>("Teoria");
  const [manualQuestionsDone, setManualQuestionsDone] = useState<number>(0);
  const [manualQuestionsCorrect, setManualQuestionsCorrect] = useState<number>(0);
  const [manualNotes, setManualNotes] = useState<string>("");
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split("T")[0]);

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

      if (!manualDisciplineId) {
        const firstDisc = activeEdital.disciplines[0];
        const firstTopic = activeEdital.topics.find((t) => t.disciplineId === firstDisc.id);
        setManualDisciplineId(firstDisc.id);
        setManualTopicId(firstTopic?.id || "");
      }
    }
  }, [activeEdital, timer.disciplineId, manualDisciplineId, setTimerConfig]);

  // Format seconds to HH:MM:SS
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

  const manualDiscipline = activeEdital?.disciplines.find((d) => d.id === manualDisciplineId);
  const manualTopics = activeEdital?.topics.filter((t) => t.disciplineId === manualDisciplineId) || [];

  // Live Timer Question Helpers
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

  // Accuracy calculation
  const liveAccuracy = timer.questionsDone > 0 ? Math.round(((timer.questionsCorrect || 0) / timer.questionsDone) * 100) : 0;
  const manualAccuracy = manualQuestionsDone > 0 ? Math.round((manualQuestionsCorrect / manualQuestionsDone) * 100) : 0;

  // Live Finish Session
  const handleFinishLiveSession = () => {
    if (timer.elapsedSeconds < 10 && (timer.questionsDone || 0) === 0) {
      alert("A sessão precisa ter pelo menos 10 segundos ou questões registradas para ser salva.");
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

    const xpEarned = Math.round((timer.elapsedSeconds / 60) * (50 / 60)) + (timer.questionsDone || 0) * 10 + (timer.questionsCorrect || 0) * 5;
    finishCurrentSession();
    triggerXpMilestoneToast(xpEarned, xpEarned, "Sessão Concluída no Cronômetro!");
    setIsOpen(false);
  };

  // Manual Log Session
  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEdital || !manualDisciplineId) {
      alert("Selecione uma disciplina.");
      return;
    }

    if (manualDurationMinutes <= 0 && manualQuestionsDone <= 0) {
      alert("Informe a duração em minutos ou a quantidade de questões.");
      return;
    }

    const selectedTop = activeEdital.topics.find((t) => t.id === manualTopicId);

    logStudySession({
      editalId: activeEdital.id,
      disciplineId: manualDisciplineId,
      disciplineName: manualDiscipline?.name || "Disciplina",
      topicId: manualTopicId,
      topicName: selectedTop?.name || "Estudo Geral",
      date: new Date(manualDate).toISOString(),
      durationMinutes: Number(manualDurationMinutes) || 0,
      modality: manualModality,
      questionsDone: Number(manualQuestionsDone) || 0,
      questionsCorrect: Number(manualQuestionsCorrect) || 0,
      notes: manualNotes,
    });

    try {
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch {
      // safe
    }

    const xpEarned = Math.floor(Number(manualDurationMinutes) / 60) * 50 + manualQuestionsDone * 10 + manualQuestionsCorrect * 5;
    triggerXpMilestoneToast(xpEarned, xpEarned, "Registro de Estudo Manual Concluído!");
    setIsOpen(false);
  };

  const modalities: StudyModality[] = ["Teoria", "Questões", "Revisão", "Videoaula", "Lei Seca", "Simulado"];

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
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2D3442] text-[#F5F4EF] shadow-xl border border-[#384154] hover:border-[#4A556E] cursor-pointer transition-colors duration-200"
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
              ? "border-emerald-400/40 bg-[#10B981] text-[#11151F] shadow-[0_10px_28px_-8px_rgba(16,185,129,0.5)]"
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

      {/* Floating Modal / Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-[#384154] dark:bg-[#11151F] text-slate-900 dark:text-white max-h-[92vh] flex flex-col"
            >
              {/* Header with gradient accent */}
              <div className="relative border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 dark:border-[#384154] dark:bg-[#171B25] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3AA2D] text-[#11151F] shadow-xs">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      Registro Rápido de Estudos
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Cronômetro ao vivo ou lançamento manual offline
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setActiveTab("cronometro");
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
                    title="Abrir Cronômetro em Tela Cheia"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
                    title="Fechar Janela"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Mode Tabs: Cronômetro Ao Vivo vs Lançamento Manual */}
              <div className="flex border-b border-slate-100 dark:border-[#384154] px-5 pt-2 bg-white dark:bg-[#11151F]">
                <button
                  type="button"
                  onClick={() => setActiveTabMode("LIVE_TIMER")}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
                    activeTabMode === "LIVE_TIMER"
                      ? "text-[#F3AA2D] dark:text-[#F3AA2D]"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Timer className="h-3.5 w-3.5" />
                    Cronômetro Ao Vivo
                    {timer.isRunning && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </span>
                  {activeTabMode === "LIVE_TIMER" && (
                    <motion.div
                      layoutId="floating-timer-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F3AA2D]"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabMode("MANUAL_LOG")}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
                    activeTabMode === "MANUAL_LOG"
                      ? "text-[#F3AA2D] dark:text-[#F3AA2D]"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Lançamento Manual
                  </span>
                  {activeTabMode === "MANUAL_LOG" && (
                    <motion.div
                      layoutId="floating-timer-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F3AA2D]"
                    />
                  )}
                </button>
              </div>

              {/* Tab 1: Live Timer */}
              {activeTabMode === "LIVE_TIMER" && (
                <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
                  {/* Digital Clock Display Card */}
                  <div className="relative flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/80 dark:from-[#2D3442] dark:to-[#171B25] dark:border-slate-800 text-center shadow-inner">
                    {/* Mode Toggle (Stopwatch vs Pomodoro) */}
                    <div className="flex items-center rounded-xl bg-white dark:bg-[#2D3442] p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs mb-2">
                      <button
                        type="button"
                        onClick={() => setTimerConfig({ mode: "stopwatch" })}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                          timer.mode === "stopwatch"
                            ? "bg-[#F3AA2D] text-[#11151F] shadow-2xs"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        Contínuo
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimerConfig({ mode: "pomodoro" })}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                          timer.mode === "pomodoro"
                            ? "bg-[#F3AA2D] text-[#11151F] shadow-2xs"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        Pomodoro (25m)
                      </button>
                    </div>

                    {/* Big Digital Numbers */}
                    <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white my-1 tabular-nums">
                      {formatTime(timer.elapsedSeconds)}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-[#F3AA2D] dark:text-[#F3AA2D] bg-amber-500/15 px-2.5 py-0.5 rounded-full">
                        {timer.modality || "Teoria"}
                      </span>
                      {timer.questionsDone > 0 && (
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          &bull; {timer.questionsCorrect}/{timer.questionsDone} Q ({liveAccuracy}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary Play/Pause Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={resetTimer}
                      disabled={timer.elapsedSeconds === 0}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171B25] text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white disabled:opacity-40 transition shadow-2xs cursor-pointer"
                      title="Zerar Cronômetro"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    {timer.isRunning ? (
                      <button
                        type="button"
                        onClick={pauseTimer}
                        className="flex flex-1 items-center justify-center gap-2 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm shadow-md hover:bg-amber-400 active:scale-95 transition cursor-pointer"
                      >
                        <Pause className="h-5 w-5 fill-current" />
                        Pausar Estudo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startTimer}
                        className="flex flex-1 items-center justify-center gap-2 h-12 rounded-2xl bg-[#F3AA2D] hover:bg-[#D98F20] text-[#11151F] font-black text-sm shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                      >
                        <Play className="h-5 w-5 fill-current" />
                        {timer.elapsedSeconds > 0 ? "Retomar Estudo" : "Iniciar Cronômetro"}
                      </button>
                    )}
                  </div>

                  {/* Selectors: Disciplina & Assunto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-[#F3AA2D] focus:border-[#F3AA2D] dark:border-slate-800 dark:bg-[#171B25] dark:text-white"
                      >
                        {activeEdital?.disciplines.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Assunto / Tópico
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-[#F3AA2D] focus:border-[#F3AA2D] dark:border-slate-800 dark:bg-[#171B25] dark:text-white truncate"
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

                  {/* Modality Chips */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Modalidade
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {modalities.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTimerConfig({ modality: m })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            timer.modality === m
                              ? "bg-[#F3AA2D] text-[#11151F] shadow-2xs"
                              : "bg-slate-100 dark:bg-[#171B25] text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Questions Counter */}
                  <div className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#171B25]/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Questões Resolvidas
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {timer.questionsDone || 0} feitas &bull; {timer.questionsCorrect || 0} acertos ({liveAccuracy}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-xl bg-white dark:bg-[#2D3442] border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={handleDecQuestionsDone}
                          className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                          title="Diminuir Questões"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2 text-xs font-black text-slate-900 dark:text-white">
                          {timer.questionsDone || 0}
                        </span>
                        <button
                          type="button"
                          onClick={handleIncQuestionsDone}
                          className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                          title="Aumentar Questões"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleIncQuestionsCorrect}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                        title="Registrar Acerto"
                      >
                        +1 Acerto
                      </button>
                    </div>
                  </div>

                  {/* Save Session Action */}
                  <button
                    type="button"
                    onClick={handleFinishLiveSession}
                    disabled={timer.elapsedSeconds < 10 && (timer.questionsDone || 0) === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black text-[#11151F] bg-[#F3AA2D] hover:bg-[#D98F20] disabled:opacity-40 transition shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Salvar e Concluir Sessão
                  </button>
                </div>
              )}

              {/* Tab 2: Manual Log */}
              {activeTabMode === "MANUAL_LOG" && (
                <form onSubmit={handleSaveManualLog} className="p-5 space-y-3.5 overflow-y-auto flex-1 scrollbar-thin">
                  {/* Row 1: Disciplina & Assunto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Disciplina <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={manualDisciplineId}
                        onChange={(e) => {
                          const discId = e.target.value;
                          setManualDisciplineId(discId);
                          const firstTopic = activeEdital?.topics.find((t) => t.disciplineId === discId);
                          setManualTopicId(firstTopic?.id || "");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-[#F3AA2D] focus:border-[#F3AA2D] dark:border-slate-800 dark:bg-[#171B25] dark:text-white"
                        required
                      >
                        {activeEdital?.disciplines.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Assunto / Tópico
                      </label>
                      <select
                        value={manualTopicId}
                        onChange={(e) => setManualTopicId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-[#F3AA2D] focus:border-[#F3AA2D] dark:border-slate-800 dark:bg-[#171B25] dark:text-white truncate"
                      >
                        {manualTopics.length === 0 ? (
                          <option value="">Sem tópicos específicos</option>
                        ) : (
                          manualTopics.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Data, Duração e Modalidade */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Data
                      </label>
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-[#F3AA2D] focus:border-[#F3AA2D] dark:border-slate-800 dark:bg-[#171B25] dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Duração (Minutos)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="600"
                        value={manualDurationMinutes}
                        onChange={(e) => setManualDurationMinutes(Number(e.target.value) || 0)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-[#F3AA2D] focus:border-[#F3AA2D] dark:border-slate-800 dark:bg-[#171B25] dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Modalidade
                      </label>
                      <select
                        value={manualModality}
                        onChange={(e) => setManualModality(e.target.value as StudyModality)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-[#F3AA2D] focus:border-[#F3AA2D] dark:border-slate-800 dark:bg-[#171B25] dark:text-white"
                      >
                        {modalities.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Questões Feitas & Acertos */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-[#171B25]/60 border border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Questões Feitas
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={manualQuestionsDone}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setManualQuestionsDone(val);
                          if (manualQuestionsCorrect > val) {
                            setManualQuestionsCorrect(val);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-[#2D3442] dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Questões Corretas ({manualAccuracy}%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={manualQuestionsDone}
                        value={manualQuestionsCorrect}
                        onChange={(e) => setManualQuestionsCorrect(Math.min(manualQuestionsDone, Number(e.target.value) || 0))}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-[#2D3442] dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Row 4: Observações Rápidas */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Anotações da Sessão (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Leitura da Lei 8.112 art. 1 ao 15..."
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-[#171B25] dark:text-white"
                    />
                  </div>

                  {/* Submit Manual Log Button */}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black text-[#11151F] bg-[#F3AA2D] hover:bg-[#D98F20] transition shadow-md shadow-amber-500/20 mt-2 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Registrar Estudo Manual
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
