import React, { useState, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import { ScheduledReview, ReviewInterval, StudySession, StudyModality } from "../../types";
import { ReviewDetailModal } from "./ReviewDetailModal";
import {
  getIntervalLabel,
  getDateParts,
  formatShortDate,
  formatDurationClock,
  getSessionLocalDate,
  isPendingReview,
  groupReviewsByDate,
} from "./reviewHelpers";
import {
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Play,
  Plus,
  Check,
  Trash2,
  CalendarDays,
  X,
  FastForward,
  Search,
  RotateCcw,
  FileText,
  Clock,
  Target,
  Ban,
} from "lucide-react";

type ReviewTab = "programadas" | "atrasadas" | "ignoradas" | "concluidas";

/** Compact study-record row (real StudySession data) shown under a review. */
const StudyRecordRow: React.FC<{ session: StudySession }> = ({ session }) => {
  const accuracy =
    session.questionsDone > 0
      ? Math.round((session.questionsCorrect / session.questionsDone) * 100)
      : null;
  const errors = Math.max(0, (session.questionsDone || 0) - (session.questionsCorrect || 0));

  const modalityClasses: Record<string, string> = {
    Teoria: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    "Questões": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    "Revisão": "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "Videoaula": "bg-sky-500/15 text-sky-300 border-sky-500/30",
    "Lei Seca": "bg-slate-500/15 text-slate-300 border-slate-500/30",
    "Simulado": "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
      <span className="font-semibold text-slate-700 dark:text-slate-200">
        {formatShortDate(getSessionLocalDate(session))}
      </span>
      <span
        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
          modalityClasses[session.modality] || modalityClasses["Teoria"]
        }`}
      >
        {session.modality}
      </span>
      <span className="flex items-center gap-1 font-mono">
        <Clock className="h-3 w-3" />
        {formatDurationClock(session.durationMinutes)}
      </span>
      {session.questionsDone > 0 && (
        <>
          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <Target className="h-3 w-3" />
            {session.questionsCorrect}
          </span>
          <span className="font-semibold text-red-500 dark:text-red-400">{errors}</span>
          {accuracy !== null && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {accuracy}%
            </span>
          )}
        </>
      )}
      {session.material && (
        <span className="truncate max-w-[140px] text-slate-500 dark:text-slate-400" title={session.material}>
          {session.material}
        </span>
      )}
      <div className="ml-auto flex items-center gap-1 text-slate-400" title={session.notes ? "Com anotações" : undefined}>
        {session.notes && <FileText className="h-3.5 w-3.5" />}
      </div>
    </div>
  );
};

export const RevisoesView: React.FC = () => {
  const {
    activeEdital,
    scheduledReviews,
    studySessions,
    createScheduledReview,
    rescheduleReview,
    deleteScheduledReview,
    reactivateScheduledReview,
    batchRescheduleOverdueReviews,
    launchStudySessionForTopic,
  } = useStudy();

  const [activeSubTab, setActiveSubTab] = useState<ReviewTab>("programadas");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Review Detail Modal (register/complete study, reschedule, ignore, delete)
  const [selectedReviewForModal, setSelectedReviewForModal] = useState<ScheduledReview | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<"study" | "manage">("study");

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

  const editalReviews = useMemo(
    () => scheduledReviews.filter((r) => !activeEdital || r.editalId === activeEdital.id),
    [scheduledReviews, activeEdital]
  );

  const matchesSearch = (r: ScheduledReview) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.topicName.toLowerCase().includes(q) ||
      r.disciplineName.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q)
    );
  };

  const filteredReviews = useMemo(() => {
    const base = editalReviews.filter((r) => {
      if (selectedDiscipline !== "all" && r.disciplineId !== selectedDiscipline) return false;
      return matchesSearch(r);
    });

    const byTab = base.filter((r) => {
      if (activeSubTab === "programadas") {
        return isPendingReview(r) && r.dueDate >= todayStr;
      }
      if (activeSubTab === "atrasadas") {
        return isPendingReview(r) && r.dueDate < todayStr;
      }
      if (activeSubTab === "ignoradas") {
        return !r.completed && r.status === "Ignorada";
      }
      return r.completed; // concluidas
    });

    return byTab.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editalReviews, selectedDiscipline, searchQuery, activeSubTab, todayStr]);

  const countProgramadas = editalReviews.filter((r) => isPendingReview(r) && r.dueDate >= todayStr).length;
  const countAtrasadas = editalReviews.filter((r) => isPendingReview(r) && r.dueDate < todayStr).length;
  const countIgnoradas = editalReviews.filter((r) => !r.completed && r.status === "Ignorada").length;
  const countConcluidas = editalReviews.filter((r) => r.completed).length;

  // Real study sessions related to each review, grouped by topicId.
  const sessionsByTopic = useMemo(() => {
    const map = new Map<string, StudySession[]>();
    studySessions.forEach((s) => {
      if (!s.topicId) return;
      const arr = map.get(s.topicId);
      if (arr) arr.push(s);
      else map.set(s.topicId, [s]);
    });
    map.forEach((arr) => {
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    return map;
  }, [studySessions]);

  const groupedReviews = useMemo(() => groupReviewsByDate(filteredReviews), [filteredReviews]);

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
      const overdueIds = editalReviews
        .filter((r) => isPendingReview(r) && r.dueDate < todayStr)
        .map((r) => r.id);
      overdueIds.forEach((id) => deleteScheduledReview(id));
      showToast(`${overdueIds.length} revisões atrasadas foram excluídas.`);
    }
    setIsBatchConfirmOpen(null);
  };

  const openReviewModal = (review: ScheduledReview, tab: "study" | "manage" = "study") => {
    setSelectedReviewForModal(review);
    setModalInitialTab(tab);
  };

  const handleReactivate = (review: ScheduledReview) => {
    reactivateScheduledReview(review.id);
    showToast("Revisão reativada! Ela voltou para a fila pendente.");
  };

  const tabs: { key: ReviewTab; label: string; count: number; activeClasses: string; badgeClasses: string }[] = [
    {
      key: "programadas",
      label: "Programadas",
      count: countProgramadas,
      activeClasses: "bg-[#F59E0B] text-white shadow-xs",
      badgeClasses: activeSubTab === "programadas" ? "bg-white/20 text-white" : "bg-amber-100 text-[#F59E0B] dark:bg-amber-950 dark:text-[#FBBF24]",
    },
    {
      key: "atrasadas",
      label: "Atrasadas",
      count: countAtrasadas,
      activeClasses: "bg-red-600 text-white shadow-xs",
      badgeClasses: activeSubTab === "atrasadas" ? "bg-white/20 text-white" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    },
    {
      key: "ignoradas",
      label: "Ignoradas",
      count: countIgnoradas,
      activeClasses: "bg-slate-600 text-white shadow-xs",
      badgeClasses: activeSubTab === "ignoradas" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    {
      key: "concluidas",
      label: "Concluídas",
      count: countConcluidas,
      activeClasses: "bg-emerald-600 text-white shadow-xs",
      badgeClasses: activeSubTab === "concluidas" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    },
  ];

  const statusBadge = (rev: ScheduledReview) => {
    if (rev.completed) {
      return (
        <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
          Concluída
        </span>
      );
    }
    if (rev.status === "Ignorada") {
      return (
        <span className="rounded-md bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
          Ignorada
        </span>
      );
    }
    if (rev.dueDate < todayStr) {
      return (
        <span className="rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
          Atrasada
        </span>
      );
    }
    if (rev.dueDate === todayStr) {
      return (
        <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
          Hoje
        </span>
      );
    }
    return (
      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Agendada
      </span>
    );
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
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-[#252B38]">
        <div>
          <h2 className="text-2xl font-bold text-white dark:text-white">
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

      {/* Overdue Banner with Quick Actions */}
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
                className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-[#252B38] dark:text-red-300 dark:hover:bg-slate-800"
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
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          {/* Category tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeSubTab === tab.key
                    ? tab.activeClasses
                    : "text-white hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tab.badgeClasses}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Discipline Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" />
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
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-white focus:border-[#F59E0B] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

      {/* Chronologically Grouped Reviews */}
      <div className="space-y-8">
        {filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="mt-4 text-base font-bold text-white dark:text-white">
              Nenhuma revisão nesta lista!
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-white">
              {activeSubTab === "atrasadas"
                ? "Excelente! Você não tem nenhuma revisão atrasada pendente."
                : activeSubTab === "ignoradas"
                ? "Revisões que você ignorar aparecerão aqui — elas permanecem salvas e podem ser reativadas."
                : activeSubTab === "concluidas"
                ? "Quando você concluir revisões, elas aparecerão aqui com o registro do estudo realizado."
                : "Você concluiu todas as revisões programadas ou pode agendar novas manualmente no botão acima."}
            </p>
          </div>
        ) : (
          groupedReviews.map(([dateKey, reviews]) => {
            const parts = getDateParts(dateKey);
            return (
              <div key={dateKey} className="space-y-3">
                {/* Date group header: big day + month/year + weekday + timeline line */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[26px] font-bold leading-none text-white dark:text-white">
                      {parts.day}
                    </span>
                    <span className="flex flex-col text-[10px] font-bold uppercase leading-tight text-slate-500 dark:text-slate-400">
                      <span>{parts.month}/{parts.year}</span>
                      <span>{parts.weekday}</span>
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {reviews.length} {reviews.length === 1 ? "revisão" : "revisões"}
                  </span>
                </div>

                {/* Review rows for this date */}
                <div className="space-y-3">
                  {reviews.map((rev) => {
                    const relatedSessions = (sessionsByTopic.get(rev.topicId) || []).slice(0, 2);

                    return (
                      <div
                        key={rev.id}
                        className="space-y-2"
                      >
                        {/* Action line: interval + quick actions + discipline */}
                        <div
                          id={`review-row-${rev.id}`}
                          onClick={() => openReviewModal(rev, rev.completed ? "study" : "manage")}
                          className="flex flex-wrap items-center gap-2 cursor-pointer group"
                        >
                          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {getIntervalLabel(rev.stage)}
                          </span>

                          {!rev.completed && rev.status !== "Ignorada" && (
                            <>
                              {/* Iniciar revisão (cronômetro com disciplina/tópico prontos) */}
                              <button
                                type="button"
                                title="Iniciar revisão no cronômetro"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  launchStudySessionForTopic(rev.disciplineId, rev.topicId, "Revisão");
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-xs transition hover:bg-emerald-600"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                              </button>

                              {/* Registrar estudo (modal) */}
                              <button
                                type="button"
                                title="Registrar estudo"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReviewModal(rev, "study");
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-xs transition hover:bg-emerald-600"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>

                              {/* Gerenciar revisão (reagendar / ignorar / excluir) */}
                              <button
                                type="button"
                                title="Gerenciar revisão"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReviewModal(rev, "manage");
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-red-400/90 text-white shadow-xs transition hover:bg-red-500"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {rev.status === "Ignorada" && !rev.completed && (
                            <button
                              type="button"
                              title="Reativar revisão"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReactivate(rev);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-500 text-white shadow-xs transition hover:bg-slate-600"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <span className="text-xs font-bold uppercase tracking-wide text-white group-hover:text-[#F59E0B] dark:text-white dark:group-hover:text-[#FBBF24] transition">
                            {rev.disciplineName}
                          </span>

                          {statusBadge(rev)}

                          <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500">
                            Etapa {rev.stage}
                          </span>

                          <span className="ml-auto hidden sm:flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                            <CalendarDays className="h-3 w-3" />
                            {formatShortDate(rev.dueDate)}
                          </span>
                        </div>

                        {/* Topic + related study records box */}
                        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-[#1B202B]">
                          <div className="flex items-center gap-2">
                            <p
                              onClick={() => openReviewModal(rev, rev.completed ? "study" : "manage")}
                              className="min-w-0 flex-1 cursor-pointer truncate text-[12px] font-semibold text-white dark:text-white"
                              title={rev.topicName}
                            >
                              {rev.topicName}
                            </p>
                            {rev.reviewMethod && (
                              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {rev.reviewMethod}
                              </span>
                            )}
                          </div>

                          {relatedSessions.length === 0 ? (
                            <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
                              <Ban className="h-3 w-3 shrink-0" />
                              Nenhum registro de estudo associado — use <strong className="mx-0.5">Registrar estudo</strong> para lançar sua revisão.
                            </div>
                          ) : (
                            relatedSessions.map((s) => <StudyRecordRow key={s.id} session={s} />)
                          )}

                          {/* Completion details of this review, when they exist */}
                          {rev.completed && (rev.durationMinutes || rev.questionsDone) && (
                            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                <Check className="h-3 w-3" />
                                Revisão realizada
                              </span>
                              {rev.durationMinutes ? (
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="h-3 w-3" />
                                  {formatDurationClock(rev.durationMinutes)}
                                </span>
                              ) : null}
                              {rev.questionsDone ? (
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3 text-emerald-500" />
                                  {rev.questionsCorrect}/{rev.questionsDone} (
                                  {Math.round(((rev.questionsCorrect || 0) / rev.questionsDone) * 100)}%)
                                </span>
                              ) : null}
                              {rev.completedAt && (
                                <span className="text-slate-400 dark:text-slate-500">
                                  em {new Date(rev.completedAt).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                              {rev.retentionLevel && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                  {{ errei: "Errei", dificil: "Difícil", bom: "Bom", facil: "Fácil" }[rev.retentionLevel]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#252B38]">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-white dark:text-white">
                {isBatchConfirmOpen === "today"
                  ? "Mover todas as atrasadas para Hoje?"
                  : isBatchConfirmOpen === "tomorrow"
                  ? "Mover todas as atrasadas para Amanhã?"
                  : "Excluir todas as revisões atrasadas?"}
              </h3>
              <p className="mt-1 text-xs text-white dark:text-white">
                Esta ação atualizará em lote as <strong>{countAtrasadas}</strong> revisões pendentes com data vencida.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBatchConfirmOpen(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
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
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#252B38]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-white dark:text-white">
                Agendar Revisão Espaçada
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-white">
              Escolha o assunto e a data para programar a próxima revisão
            </p>

            {addModalError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                {addModalError}
              </div>
            )}

            <form onSubmit={handleAddManualReview} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-white dark:text-white">
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
                  <label className="font-semibold text-white dark:text-white">
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
                  <label className="font-semibold text-white dark:text-white">
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
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
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
