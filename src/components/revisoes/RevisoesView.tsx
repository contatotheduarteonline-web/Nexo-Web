import React, { useState, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import { ScheduledReview, ReviewInterval } from "../../types";
import { ReviewDetailModal } from "./ReviewDetailModal";
import {
  Repeat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Play,
  Plus,
  RotateCw,
  Sparkles,
  Check,
  Trash2,
  CalendarDays,
  ArrowRight,
  X,
  FastForward,
  CheckCheck,
  Search,
  BookOpen,
  Brain,
  FileText,
  Target,
  ChevronRight,
  Filter,
} from "lucide-react";

export const RevisoesView: React.FC = () => {
  const {
    activeEdital,
    scheduledReviews,
    completeScheduledReview,
    createScheduledReview,
    rescheduleReview,
    deleteScheduledReview,
    batchRescheduleOverdueReviews,
    launchStudySessionForTopic,
  } = useStudy();

  const [activeSubTab, setActiveSubTab] = useState<"hoje" | "atrasadas" | "proximas" | "concluidas">("hoje");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Review Detail Modal (for logging study notes, questions, moving or deleting)
  const [selectedReviewForModal, setSelectedReviewForModal] = useState<ScheduledReview | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<"study" | "reschedule" | "delete">("study");

  // Manual Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRevTopicId, setNewRevTopicId] = useState("");
  const [newRevStage, setNewRevStage] = useState<ReviewInterval>("24h");
  const [newRevDueDate, setNewRevDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // Batch action state
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState<"today" | "tomorrow" | "delete" | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const getRelativeDateString = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };

  const filteredReviews = useMemo(() => {
    return scheduledReviews.filter((r) => {
      if (activeEdital && r.editalId !== activeEdital.id) return false;
      if (selectedDiscipline !== "all" && r.disciplineId !== selectedDiscipline) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTopic = r.topicName.toLowerCase().includes(q);
        const matchDisc = r.disciplineName.toLowerCase().includes(q);
        const matchNotes = r.notes?.toLowerCase().includes(q);
        if (!matchTopic && !matchDisc && !matchNotes) return false;
      }

      if (activeSubTab === "hoje") {
        return !r.completed && r.dueDate === todayStr;
      }
      if (activeSubTab === "atrasadas") {
        return !r.completed && r.dueDate < todayStr;
      }
      if (activeSubTab === "proximas") {
        return !r.completed && r.dueDate > todayStr;
      }
      if (activeSubTab === "concluidas") {
        return r.completed;
      }
      return true;
    });
  }, [scheduledReviews, activeEdital, selectedDiscipline, searchQuery, activeSubTab, todayStr]);

  const countHoje = scheduledReviews.filter(
    (r) => !r.completed && r.dueDate === todayStr && (!activeEdital || r.editalId === activeEdital.id)
  ).length;

  const countAtrasadas = scheduledReviews.filter(
    (r) => !r.completed && r.dueDate < todayStr && (!activeEdital || r.editalId === activeEdital.id)
  ).length;

  const countProximas = scheduledReviews.filter(
    (r) => !r.completed && r.dueDate > todayStr && (!activeEdital || r.editalId === activeEdital.id)
  ).length;

  const countConcluidas = scheduledReviews.filter(
    (r) => r.completed && (!activeEdital || r.editalId === activeEdital.id)
  ).length;

  const handleAddManualReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevTopicId) {
      setAddModalError("Por favor, selecione um tópico para agendar a revisão.");
      return;
    }
    createScheduledReview(newRevTopicId, newRevStage, newRevDueDate);
    setIsAddModalOpen(false);
    setAddModalError(null);
    setNewRevTopicId("");
    showToast("Revisão agendada com sucesso!");
  };

  const handleExecuteBatchAction = () => {
    if (isBatchConfirmOpen === "today") {
      batchRescheduleOverdueReviews(todayStr);
      showToast("Todas as revisões atrasadas foram reagendadas para hoje!");
    } else if (isBatchConfirmOpen === "tomorrow") {
      const tomorrowStr = getRelativeDateString(1);
      batchRescheduleOverdueReviews(tomorrowStr);
      showToast("Todas as revisões atrasadas foram reagendadas para amanhã!");
    } else if (isBatchConfirmOpen === "delete") {
      const overdueIds = scheduledReviews
        .filter((r) => !r.completed && r.dueDate < todayStr && (!activeEdital || r.editalId === activeEdital.id))
        .map((r) => r.id);
      overdueIds.forEach((id) => deleteScheduledReview(id));
      showToast(`${overdueIds.length} revisões atrasadas foram excluídas.`);
    }
    setIsBatchConfirmOpen(null);
  };

  const openReviewModal = (review: ScheduledReview, tab: "study" | "reschedule" | "delete" = "study") => {
    setSelectedReviewForModal(review);
    setModalInitialTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl dark:bg-white dark:text-slate-900">
          <CheckCircle2 className="h-4 w-4 text-[#F59E0B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Revisões
          </h2>
        </div>

        <button
          id="btn-schedule-manual-review"
          onClick={() => {
            setNewRevDueDate(todayStr);
            setAddModalError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-[#F59E0B] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#D97706] active:scale-98"
        >
          <Plus className="h-4 w-4" />
          Agendar Revisão Manual
        </button>
      </div>

      {/* Overdue Banner with Quick Actions (When on 'atrasadas' or when there are late reviews) */}
      {countAtrasadas > 0 && activeSubTab === "atrasadas" && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-red-900 dark:text-red-200">
                  Você tem {countAtrasadas} {countAtrasadas === 1 ? "revisão acumulada" : "revisões acumuladas"}
                </h3>
                <p className="text-[11px] text-red-700 dark:text-red-300/80">
                  Reorganize seu cronograma com um clique para não sobrecarregar seus estudos de hoje.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBatchConfirmOpen("today")}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700"
              >
                <Calendar className="h-3.5 w-3.5" />
                Mover todas para Hoje
              </button>
              <button
                type="button"
                onClick={() => setIsBatchConfirmOpen("tomorrow")}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-slate-800"
              >
                <FastForward className="h-3.5 w-3.5" />
                Mover para Amanhã
              </button>
              <button
                type="button"
                onClick={() => setIsBatchConfirmOpen("delete")}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100/50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                title="Excluir todas as revisões atrasadas"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar Atrasadas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs, Search & Discipline Dropdown */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          {/* Sub-tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveSubTab("hoje")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeSubTab === "hoje"
                  ? "bg-[#F59E0B] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span>Para Hoje</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeSubTab === "hoje"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-[#F59E0B] dark:bg-amber-950 dark:text-[#FBBF24]"
                }`}
              >
                {countHoje}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab("atrasadas")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeSubTab === "atrasadas"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              }`}
            >
              <span>Atrasadas</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeSubTab === "atrasadas"
                    ? "bg-white/20 text-white"
                    : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                }`}
              >
                {countAtrasadas}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab("proximas")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeSubTab === "proximas"
                  ? "bg-[#F59E0B] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span>Próximas (Futuras)</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeSubTab === "proximas"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {countProximas}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab("concluidas")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeSubTab === "concluidas"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span>Concluídas</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeSubTab === "concluidas"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {countConcluidas}
              </span>
            </button>
          </div>

          {/* Search & Discipline Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por tópico ou disciplina..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#F59E0B] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#F59E0B] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">Todas as Disciplinas</option>
              {activeEdital?.disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Nenhuma revisão nesta lista!
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              {activeSubTab === "atrasadas"
                ? "Excelente! Você não tem nenhuma revisão atrasada pendente."
                : activeSubTab === "hoje"
                ? "Você concluiu todas as revisões de hoje ou pode agendar novas manualmente no botão acima."
                : "Quando você estudar tópicos no edital, as revisões espaçadas serão agendadas automaticamente."}
            </p>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const isLate = !rev.completed && rev.dueDate < todayStr;
            const isToday = !rev.completed && rev.dueDate === todayStr;

            return (
              <div
                key={rev.id}
                onClick={() => openReviewModal(rev, "study")}
                className={`group relative flex flex-col justify-between gap-4 rounded-2xl border p-4.5 shadow-xs transition-all hover:shadow-md cursor-pointer sm:flex-row sm:items-center ${
                  isLate
                    ? "border-red-200 bg-red-50/40 hover:border-red-300 dark:border-red-900/40 dark:bg-red-950/15"
                    : isToday
                    ? "border-amber-200 bg-amber-50/40 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/15"
                    : rev.completed
                    ? "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 dark:border-emerald-900/40 dark:bg-emerald-950/10"
                    : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                }`}
              >
                {/* Left Content */}
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] dark:text-[#FBBF24]">
                      {rev.disciplineName}
                    </span>
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-[#F59E0B] dark:bg-amber-950 dark:text-[#FBBF24]">
                      Etapa {rev.stage}
                    </span>

                    {isLate && (
                      <span className="rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        Atrasada ({rev.dueDate})
                      </span>
                    )}
                    {isToday && (
                      <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        Hoje
                      </span>
                    )}
                    {rev.completed && (
                      <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        Concluída
                      </span>
                    )}

                    {rev.reviewMethod && (
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {rev.reviewMethod}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#F59E0B] dark:text-white dark:group-hover:text-[#FBBF24] transition">
                    {rev.topicName}
                  </h4>

                  {/* Notes / Details Preview */}
                  {rev.notes && (
                    <p className="line-clamp-1 text-xs text-slate-600 dark:text-slate-300 italic flex items-center gap-1">
                      <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>"{rev.notes}"</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Prevista: <strong className="text-slate-700 dark:text-slate-300">{rev.dueDate}</strong>
                    </span>

                    {rev.durationMinutes ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {rev.durationMinutes} min
                      </span>
                    ) : null}

                    {rev.questionsDone ? (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-emerald-500" />
                        {rev.questionsCorrect}/{rev.questionsDone} questões (
                        {Math.round(((rev.questionsCorrect || 0) / rev.questionsDone) * 100)}%)
                      </span>
                    ) : null}

                    {rev.completedAt && (
                      <span>
                        • Realizada em {new Date(rev.completedAt).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions & Quick Buttons */}
                <div
                  className="flex flex-wrap items-center gap-2 self-start sm:self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!rev.completed ? (
                    <>
                      {/* Main action: Click to register / complete */}
                      <button
                        type="button"
                        onClick={() => openReviewModal(rev, "study")}
                        className="flex items-center gap-1.5 rounded-xl bg-[#F59E0B] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#D97706] active:scale-98"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Registrar / Concluir</span>
                      </button>

                      {/* Launch floating timer */}
                      <button
                        type="button"
                        onClick={() => launchStudySessionForTopic(rev.disciplineId, rev.topicId, "Revisão")}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#F59E0B] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        title="Iniciar Cronômetro de Estudo"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </button>

                      {/* Reschedule Button */}
                      <button
                        type="button"
                        onClick={() => openReviewModal(rev, "reschedule")}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        title="Mover para outro dia"
                      >
                        <CalendarDays className="h-3.5 w-3.5 text-[#F59E0B] dark:text-[#FBBF24]" />
                        <span>Mover</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => openReviewModal(rev, "delete")}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                        title="Excluir esta revisão"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openReviewModal(rev, "study")}
                        className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Ver Registro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openReviewModal(rev, "delete")}
                        className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                        title="Remover do histórico"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <ChevronRight className="hidden sm:block h-4 w-4 text-slate-400 group-hover:text-[#F59E0B] dark:group-hover:text-[#FBBF24] transition" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Detail / Execution Modal */}
      {selectedReviewForModal && (
        <ReviewDetailModal
          review={selectedReviewForModal}
          initialTab={modalInitialTab}
          onClose={() => setSelectedReviewForModal(null)}
          onSuccessToast={showToast}
        />
      )}

      {/* Batch Action Modal for Overdue Reviews */}
      {isBatchConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                {isBatchConfirmOpen === "today"
                  ? "Mover todas as atrasadas para Hoje?"
                  : isBatchConfirmOpen === "tomorrow"
                  ? "Mover todas as atrasadas para Amanhã?"
                  : "Excluir todas as revisões atrasadas?"}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Esta ação atualizará em lote as <strong>{countAtrasadas}</strong> revisões pendentes com data vencida.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBatchConfirmOpen(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchAction}
                className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs ${
                  isBatchConfirmOpen === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-[#F59E0B] hover:bg-[#D97706]"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Schedule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Agendar Revisão Espaçada
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Escolha o assunto e a data para programar a próxima revisão
            </p>

            {addModalError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                {addModalError}
              </div>
            )}

            <form onSubmit={handleAddManualReview} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Assunto / Tópico do Edital
                </label>
                <select
                  value={newRevTopicId}
                  onChange={(e) => {
                    setNewRevTopicId(e.target.value);
                    setAddModalError(null);
                  }}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Selecione um tópico...</option>
                  {activeEdital?.topics.map((t) => {
                    const disc = activeEdital.disciplines.find((d) => d.id === t.disciplineId);
                    return (
                      <option key={t.id} value={t.id}>
                        {disc?.name} — {t.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Etapa / Ciclo
                  </label>
                  <select
                    value={newRevStage}
                    onChange={(e) => setNewRevStage(e.target.value as ReviewInterval)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="24h">24 Horas (R1)</option>
                    <option value="7d">7 Dias (R2)</option>
                    <option value="15d">15 Dias (R3)</option>
                    <option value="30d">30 Dias (R4)</option>
                    <option value="60d">60 Dias (R5)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Data Prevista
                  </label>
                  <input
                    type="date"
                    value={newRevDueDate}
                    onChange={(e) => setNewRevDueDate(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#F59E0B] px-4 py-2 text-xs font-bold text-white hover:bg-[#D97706]"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
