import React, { useState, useEffect, useRef } from "react";
import { useStudy } from "../../context/StudyContext";
import { ScheduledReview, ReviewInterval } from "../../types";
import { getIntervalLabel } from "./reviewHelpers";
import {
  X,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  Brain,
  Target,
  Play,
  AlertTriangle,
  Save,
  Ban,
  Settings2,
} from "lucide-react";

interface ReviewDetailModalProps {
  review: ScheduledReview | null;
  onClose: () => void;
  initialTab?: "study" | "manage";
  onSuccessToast?: (msg: string) => void;
}

const REVIEW_METHODS = [
  "Resumo Próprio",
  "Flashcards / Anki",
  "Bateria de Questões",
  "Leitura da Lei Seca",
  "Mapa Mental",
  "Videoaula de Revisão",
  "Grifos / PDF",
  "Outro",
] as const;

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  review,
  onClose,
  initialTab = "study",
  onSuccessToast,
}) => {
  const {
    activeEdital,
    completeScheduledReview,
    rescheduleReview,
    deleteScheduledReview,
    updateScheduledReview,
    ignoreScheduledReview,
    launchStudySessionForTopic,
  } = useStudy();

  const [activeTab, setActiveTab] = useState<"study" | "manage">(initialTab);

  // Form states for Study Registration
  const [notes, setNotes] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [questionsDone, setQuestionsDone] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);
  const [reviewMethod, setReviewMethod] = useState<string>("Resumo Próprio");
  const [retentionLevel, setRetentionLevel] = useState<"errei" | "dificil" | "bom" | "facil">("bom");
  const [logAsSession, setLogAsSession] = useState<boolean>(true);

  // Form states for Reschedule
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [newStage, setNewStage] = useState<ReviewInterval>("24h");

  // Confirmation states (manage tab)
  const [confirmingIgnore, setConfirmingIgnore] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Double-submit guards
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (review) {
      setNotes(review.notes || "");
      setDurationMinutes(review.durationMinutes || 20);
      setQuestionsDone(review.questionsDone || 0);
      setQuestionsCorrect(review.questionsCorrect || 0);
      setReviewMethod(review.reviewMethod || "Resumo Próprio");
      setRetentionLevel(review.retentionLevel || "bom");
      setLogAsSession(true);
      setNewDueDate(review.dueDate);
      setNewStage(review.stage);
      setActiveTab(initialTab);
      setConfirmingIgnore(false);
      setConfirmingDelete(false);
      setIsSubmitting(false);
      submittedRef.current = false;
    }
  }, [review, initialTab]);

  if (!review) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const isIgnored = !review.completed && review.status === "Ignorada";
  const isLate = !review.completed && !isIgnored && review.dueDate < todayStr;
  const isToday = !review.completed && !isIgnored && review.dueDate === todayStr;

  const getRelativeDateString = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };

  // Derived display value only — the counters themselves stay autonomous.
  const calculatedAccuracy =
    questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 100) : null;
  const calculatedErrors = Math.max(0, questionsDone - questionsCorrect);

  const guardDoubleSubmit = (): boolean => {
    if (submittedRef.current) return false;
    submittedRef.current = true;
    setIsSubmitting(true);
    return true;
  };

  const releaseGuard = () => {
    submittedRef.current = false;
    setIsSubmitting(false);
  };

  const handleSaveNotesOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardDoubleSubmit()) return;
    try {
      updateScheduledReview(review.id, {
        notes,
        durationMinutes: durationMinutes > 0 ? durationMinutes : undefined,
        questionsDone: questionsDone > 0 ? questionsDone : undefined,
        questionsCorrect: questionsDone > 0 ? questionsCorrect : undefined,
        reviewMethod: reviewMethod as any,
        retentionLevel,
      });
      onSuccessToast?.("Anotações da revisão salvas!");
      onClose();
    } finally {
      releaseGuard();
    }
  };

  const handleCompleteReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (review.completed) {
      // Already completed: only persist edits, never re-create the session or
      // the next cycle a second time.
      handleSaveNotesOnly(e);
      return;
    }
    if (!guardDoubleSubmit()) return;
    try {
      completeScheduledReview(review.id, {
        notes,
        durationMinutes,
        questionsDone,
        questionsCorrect,
        reviewMethod: reviewMethod as any,
        retentionLevel,
        logAsSession,
      });
      onSuccessToast?.(
        retentionLevel === "errei"
          ? "Revisão concluída! Reforço agendado para amanhã."
          : "Revisão concluída e próximo ciclo programado!"
      );
      onClose();
    } finally {
      releaseGuard();
    }
  };

  const handleReschedule = () => {
    if (!newDueDate) return;
    rescheduleReview(review.id, newDueDate, newStage);
    const dateFormatted = new Date(newDueDate + "T12:00:00").toLocaleDateString("pt-BR");
    onSuccessToast?.(`Revisão movida para ${dateFormatted}!`);
    onClose();
  };

  const handleIgnore = () => {
    ignoreScheduledReview(review.id);
    onSuccessToast?.("Revisão ignorada. O registro continua salvo em 'Ignoradas'.");
    onClose();
  };

  const handleDelete = () => {
    deleteScheduledReview(review.id);
    onSuccessToast?.("Revisão excluída com sucesso.");
    onClose();
  };

  const handleStartTimer = () => {
    launchStudySessionForTopic(review.disciplineId, review.topicId, "Revisão");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#252B38]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {review.disciplineName}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {getIntervalLabel(review.stage)} (Etapa {review.stage})
              </span>
              {review.completed ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Concluída
                </span>
              ) : isIgnored ? (
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Ignorada
                </span>
              ) : isLate ? (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                  Atrasada ({review.dueDate})
                </span>
              ) : isToday ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Prevista para Hoje
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-white dark:bg-slate-800 dark:text-white">
                  Data: {review.dueDate}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white dark:text-white">
              {review.topicName}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex border-b border-slate-100 bg-white px-6 pt-2 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab("study")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "study"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-white hover:text-white dark:text-white dark:hover:text-white"
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>Registrar Estudo & Concluir</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("manage");
              setConfirmingIgnore(false);
              setConfirmingDelete(false);
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "manage"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-white hover:text-white dark:text-white dark:hover:text-white"
            }`}
          >
            <Settings2 className="h-4 w-4" />
            <span>Gerenciar Revisão</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: REGISTRAR O QUE ESTUDOU / CONCLUIR */}
          {activeTab === "study" && (
            <div className="space-y-5">
              {/* Quick Timer trigger Banner */}
              {!review.completed && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                      <Play className="h-4 w-4 fill-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white dark:text-white">
                        Quer cronometrar esta revisão agora?
                      </p>
                      <p className="text-[11px] text-white">
                        Inicie o cronômetro com a disciplina e tópico já configurados.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartTimer}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-98 transition self-start sm:self-auto"
                  >
                    Iniciar Cronômetro
                  </button>
                </div>
              )}

              {/* Textarea: O que você estudou / Anotações */}
              <div>
                <label className="block text-xs font-bold text-white dark:text-white">
                  O que você estudou nesta revisão? (Resumo & Anotações)
                </label>
                <p className="text-[11px] text-white">
                  Guarde pontos-chave, artigos de lei, fórmulas, exceções da banca ou dúvidas para as próximas revisões.
                </p>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Revisei a estrutura do ato administrativo (competência, finalidade, forma, motivo, objeto). Fixei as diferenças entre nulidade e anulabilidade..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Método de Estudo / Revisão */}
              <div>
                <label className="block text-xs font-bold text-white dark:text-white">
                  Método de Revisão Utilizado
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {REVIEW_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setReviewMethod(method)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        reviewMethod === method
                          ? "bg-blue-600 text-white shadow-xs font-bold"
                          : "border border-slate-200 bg-slate-50 text-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempo & Desempenho (contadores autônomos) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Tempo estudado */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-white dark:text-white">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Tempo de Revisão (minutos)</span>
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={600}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                      className="w-24 rounded-lg border border-slate-200 bg-white p-2 text-center text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDurationMinutes(mins)}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                            durationMinutes === mins
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Registro de desempenho — contadores independentes: alterar
                    um NÃO altera os outros (nenhum acoplamento automático). */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-white dark:text-white">
                      <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Registro de Desempenho</span>
                    </label>
                    {calculatedAccuracy !== null && (
                      <span className={`text-[11px] font-bold ${calculatedAccuracy >= 75 ? "text-emerald-600" : calculatedAccuracy >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {calculatedAccuracy}% de acerto
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] font-medium text-white">Questões:</span>
                      <input
                        type="number"
                        min={0}
                        value={questionsDone}
                        onChange={(e) =>
                          setQuestionsDone(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white p-1.5 text-center text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-white">Acertos:</span>
                      <input
                        type="number"
                        min={0}
                        value={questionsCorrect}
                        onChange={(e) =>
                          setQuestionsCorrect(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white p-1.5 text-center text-xs font-bold text-[#F59E0B] focus:border-[#F59E0B] focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-[#FBBF24]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-white">Erros:</span>
                      <input
                        type="text"
                        readOnly
                        value={calculatedErrors}
                        className="mt-0.5 w-full cursor-default rounded-lg border border-slate-200 bg-slate-100 p-1.5 text-center text-xs font-bold text-red-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-red-400"
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                    Cada contador é independente — alterar um não modifica os demais.
                  </p>
                </div>
              </div>

              {/* Nível de Retenção (Algoritmo Espaçado) */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-white dark:text-white">
                  <Brain className="h-4 w-4 text-[#F59E0B] dark:text-[#FBBF24]" />
                  <span>Como foi seu domínio ao revisar? (Algoritmo Espaçado)</span>
                </label>
                <p className="text-[11px] text-white">
                  Se você errou muito ou esqueceu o assunto, o sistema reprogramará um reforço imediato para amanhã.
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setRetentionLevel("errei")}
                    className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition ${
                      retentionLevel === "errei"
                        ? "border-red-500 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-950/40 dark:text-red-200 ring-2 ring-red-500"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm">❌</span>
                    <span className="mt-1 text-xs font-bold">Errei / Esqueci</span>
                    <span className="text-[10px] text-red-600 dark:text-red-400">Reforço em 24h</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRetentionLevel("dificil")}
                    className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition ${
                      retentionLevel === "dificil"
                        ? "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200 ring-2 ring-amber-500"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm">⚠️</span>
                    <span className="mt-1 text-xs font-bold">Difícil</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">Ciclo normal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRetentionLevel("bom")}
                    className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition ${
                      retentionLevel === "bom"
                        ? "border-amber-500 bg-amber-50 text-[#F59E0B] dark:border-amber-500 dark:bg-amber-500/20 dark:text-[#FBBF24] ring-2 ring-amber-500"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm">👍</span>
                    <span className="mt-1 text-xs font-bold">Bom / Entendi</span>
                    <span className="text-[10px] text-[#F59E0B] dark:text-[#FBBF24]">Ciclo normal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRetentionLevel("facil")}
                    className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition ${
                      retentionLevel === "facil"
                        ? "border-amber-500 bg-gradient-to-tr from-amber-50 to-amber-100/80 text-[#0A0D12] dark:border-[#FBBF24] dark:bg-amber-500/30 dark:text-white ring-2 ring-amber-500"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm">⭐</span>
                    <span className="mt-1 text-xs font-bold">Fácil / Dominado</span>
                    <span className="text-[10px] text-[#F59E0B] dark:text-[#FBBF24] font-bold">+Maestria</span>
                  </button>
                </div>
              </div>

              {/* Toggle: Salvar no histórico de sessões */}
              {!review.completed && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="logAsSessionCheck"
                    checked={logAsSession}
                    onChange={(e) => setLogAsSession(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="logAsSessionCheck" className="text-xs text-white dark:text-white">
                    Registrar automaticamente como sessão de estudo no histórico e gráficos
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GERENCIAR (Reagendar / Ignorar / Excluir) */}
          {activeTab === "manage" && (
            <div className="space-y-6">
              {/* --- Reagendar --- */}
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <h4 className="text-xs font-bold text-white dark:text-white">
                    Reagendar (mover para outro dia)
                  </h4>
                  <p className="mt-0.5 text-[11px] text-white dark:text-white">
                    Reorganize sua fila de revisões sem perder o histórico do edital.
                  </p>
                </div>

                {/* Quick Preset Buttons */}
                <div>
                  <label className="block text-xs font-bold text-white dark:text-white">
                    Atalhos Rápidos de Reagendamento
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "Para Hoje", offset: 0 },
                      { label: "Amanhã (+1d)", offset: 1 },
                      { label: "Em 3 dias", offset: 3 },
                      { label: "Em 7 dias", offset: 7 },
                      { label: "Em 15 dias", offset: 15 },
                      { label: "Em 30 dias", offset: 30 },
                      { label: "Em 60 dias", offset: 60 },
                    ].map((preset) => {
                      const presetDate = getRelativeDateString(preset.offset);
                      const isSelected = newDueDate === presetDate;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewDueDate(presetDate)}
                          className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 ring-2 ring-blue-500"
                              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Date & Cycle Stage Picker */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-white dark:text-white">
                      Data Personalizada
                    </label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white dark:text-white">
                      Etapa / Ciclo de Repetição
                    </label>
                    <select
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value as ReviewInterval)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="24h">24 Horas (R1)</option>
                      <option value="7d">7 Dias (R2)</option>
                      <option value="15d">15 Dias (R3)</option>
                      <option value="30d">30 Dias (R4)</option>
                      <option value="60d">60 Dias (R5)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleReschedule}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 active:scale-98 transition cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Confirmar Nova Data</span>
                  </button>
                </div>
              </div>

              {/* --- Ignorar (não exclui o registro) --- */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-white dark:text-white">
                      <Ban className="h-3.5 w-3.5 text-slate-500" />
                      Ignorar esta revisão
                    </h4>
                    <p className="mt-0.5 text-[11px] text-white dark:text-white">
                      A revisão sai da fila pendente, mas <strong>continua salva</strong> e pode ser reativada na aba "Ignoradas".
                    </p>
                  </div>
                  {!confirmingIgnore ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingIgnore(true)}
                      className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Ignorar
                    </button>
                  ) : null}
                </div>
                {confirmingIgnore && (
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <span className="mr-auto text-[11px] font-semibold text-white dark:text-white">
                      Confirmar que deseja ignorar esta revisão?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmingIgnore(false)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-100 dark:text-white dark:hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleIgnore}
                      className="rounded-lg bg-slate-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      Confirmar Ignorar
                    </button>
                  </div>
                )}
              </div>

              {/* --- Excluir (permanente) --- */}
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300">
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir esta revisão
                    </h4>
                    <p className="mt-0.5 text-[11px] text-red-700/80 dark:text-red-300/80">
                      Ação permanente e irreversível. Se você apenas não puder revisar hoje, prefira <strong>Ignorar</strong> ou <strong>Reagendar</strong>.
                    </p>
                  </div>
                  {!confirmingDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                    >
                      Excluir
                    </button>
                  ) : null}
                </div>
                {confirmingDelete && (
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-red-200 pt-3 dark:border-red-800">
                    <span className="mr-auto text-[11px] font-semibold text-red-700 dark:text-red-200">
                      <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                      Excluir definitivamente "{review.disciplineName} — {review.topicName}" (Etapa {review.stage})?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-100/60 dark:text-white dark:hover:bg-red-900/40"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                    >
                      Sim, Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          {activeTab === "study" && (
            <>
              <button
                type="button"
                onClick={handleSaveNotesOnly}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5 text-white" />
                <span>Salvar Rascunho</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-200/60 dark:text-white dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                {!review.completed ? (
                  <button
                    type="button"
                    onClick={handleCompleteReview}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 active:scale-98 transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Concluir Revisão</span>
                  </button>
                ) : (
                  <span className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="mr-1 inline h-4 w-4" />
                    Revisão já concluída — alterações são salvas no registro
                  </span>
                )}
              </div>
            </>
          )}

          {activeTab === "manage" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-200/60 dark:text-white dark:hover:bg-slate-800 cursor-pointer"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
