import React, { useMemo, useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { PlanSelector } from "../common/PlanSelector";
import { ScheduledReview, StudySession } from "../../types";
import { RegistroEstudoModal } from "./RegistroEstudoModal";
import {
  getIntervalLabel,
  getDateParts,
  formatShortDate,
  formatDurationClock,
  getSessionLocalDate,
  isPendingReview,
  groupReviewsByDate,
  getTodayLocalYmd,
} from "./reviewHelpers";
import {
  Play,
  Plus,
  X,
  Search,
  RotateCcw,
  Check,
  ChevronDown,
  Filter,
  CalendarClock,
  Trash2,
  MessageCircle,
  Inbox,
} from "lucide-react";

type ReviewTab = "programadas" | "atrasadas" | "ignoradas" | "concluidas";

/** Badge roxo da categoria do estudo (QUESTÕES / TEORIA / ...). */
const modalityBadgeClasses: Record<string, string> = {
  Teoria: "bg-violet-600 text-white",
  "Questões": "bg-[#2BBF8A] text-white",
  "Revisão": "bg-violet-600 text-white",
  "Videoaula": "bg-[#58A6FF] text-white",
  "Lei Seca": "bg-[#223149] text-white",
  "Simulado": "bg-[#F16D75] text-white",
};

/** Registro de estudo real (StudySession) em superfície cinza-clara. */
const StudyRecordRow: React.FC<{ session: StudySession }> = ({ session }) => {
  const qDone = session.questionsDone || 0;
  const qCorrect = session.questionsCorrect || 0;
  const errors = Math.max(0, qDone - qCorrect);
  const accuracy = qDone > 0 ? Math.round((qCorrect / qDone) * 100) : null;

  return (
    <div className="rounded-lg bg-[#111B2D] px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#C4CEDB]">
        <span className="font-semibold text-[#C4CEDB]">{formatShortDate(getSessionLocalDate(session))}</span>

        <span className="min-w-0 flex-1 truncate font-medium text-[#C4CEDB]" title={session.topicName}>
          {session.topicName || "-"}
        </span>

        <span
          className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            modalityBadgeClasses[session.modality] || modalityBadgeClasses.Teoria
          }`}
        >
          {session.modality}
        </span>

        <span className="font-mono text-[#C4CEDB]">{formatDurationClock(session.durationMinutes)}</span>

        {qDone > 0 && (
          <>
            <span className="font-semibold text-[#2BBF8A]">{qCorrect}</span>
            {errors > 0 && <span className="font-semibold text-[#F16D75]">{errors}</span>}
            {accuracy !== null && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
                  accuracy >= 75 ? "bg-[#2BBF8A]" : accuracy >= 50 ? "bg-[#416CEB]" : "bg-[#F16D75]"
                }`}
              >
                {accuracy}
              </span>
            )}
          </>
        )}

        {session.material && (
          <span className="max-w-[140px] truncate text-[#93A2B7]" title={session.material}>
            {session.material}
          </span>
        )}

        {session.videoTitle && (
          <span className="truncate text-[#93A2B7]" title={session.videoTitle}>
            {session.videoTitle}
          </span>
        )}

        <span className="text-[#93A2B7]">{session.videoEnd || "-"}</span>

        <span className="ml-auto flex items-center" title={session.notes ? "Com comentários" : undefined}>
          {session.notes && <MessageCircle className="h-4 w-4 text-[#F4B544]" />}
        </span>
      </div>
    </div>
  );
};

export const RevisoesView: React.FC = () => {
  const {
    activeEdital,
    editais,
    setActiveEditalId,
    scheduledReviews,
    studySessions,
    activePlan,
    getPlanImageUrl,
    createScheduledReview,
    rescheduleReview,
    deleteScheduledReview,
    ignoreScheduledReview,
    reactivateScheduledReview,
    launchStudySessionForTopic,
  } = useStudy();

  const [activeSubTab, setActiveSubTab] = useState<ReviewTab>("programadas");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal "Registro de Estudo" (compacto, da referência)
  const [isRegistroOpen, setIsRegistroOpen] = useState(false);
  const [selectedReviewForModal, setSelectedReviewForModal] = useState<ScheduledReview | null>(null);

  // Menu de gerenciamento (reagendar / excluir) por linha
  const [manageMenuFor, setManageMenuFor] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((prev) => (prev === msg ? null : prev)), 3500);
  };

  const todayStr = getTodayLocalYmd();

  const editalReviews = useMemo(
    () => scheduledReviews.filter((r) => !activeEdital || r.editalId === activeEdital.id),
    [scheduledReviews, activeEdital]
  );

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = editalReviews.filter((r) => {
      if (selectedDiscipline !== "all" && r.disciplineId !== selectedDiscipline) return false;
      if (q) {
        const hit =
          r.topicName.toLowerCase().includes(q) ||
          r.disciplineName.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (activeSubTab === "programadas") return isPendingReview(r) && r.dueDate >= todayStr;
      if (activeSubTab === "atrasadas") return isPendingReview(r) && r.dueDate < todayStr;
      if (activeSubTab === "ignoradas") return !r.completed && r.status === "Ignorada";
      return r.completed;
    });
    return base.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editalReviews, selectedDiscipline, searchQuery, activeSubTab, todayStr]);

  const counts = useMemo(
    () => ({
      programadas: editalReviews.filter((r) => isPendingReview(r) && r.dueDate >= todayStr).length,
      atrasadas: editalReviews.filter((r) => isPendingReview(r) && r.dueDate < todayStr).length,
      ignoradas: editalReviews.filter((r) => !r.completed && r.status === "Ignorada").length,
      concluidas: editalReviews.filter((r) => r.completed).length,
    }),
    [editalReviews, todayStr]
  );

  // Sessões reais por tópico → registros de estudo abaixo de cada revisão.
  const sessionsByTopic = useMemo(() => {
    const map = new Map<string, StudySession[]>();
    studySessions.forEach((s) => {
      if (!s.topicId) return;
      const arr = map.get(s.topicId);
      if (arr) arr.push(s);
      else map.set(s.topicId, [s]);
    });
    map.forEach((arr) => arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    return map;
  }, [studySessions]);

  const groupedReviews = useMemo(() => groupReviewsByDate(filteredReviews), [filteredReviews]);

  const tabs: { key: ReviewTab; label: string }[] = [
    { key: "programadas", label: "Programadas" },
    { key: "atrasadas", label: "Atrasadas" },
    { key: "ignoradas", label: "Ignoradas" },
    { key: "concluidas", label: "Concluídas" },
  ];

  const openRegistro = (review: ScheduledReview | null) => {
    setSelectedReviewForModal(review);
    setIsRegistroOpen(true);
  };

  const handleIgnore = (rev: ScheduledReview) => {
    ignoreScheduledReview(rev.id);
    showToast("Revisão ignorada. O registro continua salvo em 'Ignoradas'.");
  };

  const handleReactivate = (rev: ScheduledReview) => {
    reactivateScheduledReview(rev.id);
    showToast("Revisão reativada! Ela voltou para a fila pendente.");
  };

  const handleReschedule = (rev: ScheduledReview) => {
    if (!rescheduleDate) return;
    rescheduleReview(rev.id, rescheduleDate);
    setManageMenuFor(null);
    showToast("Revisão reagendada com sucesso!");
  };

  const handleDelete = (rev: ScheduledReview) => {
    deleteScheduledReview(rev.id);
    setManageMenuFor(null);
    setConfirmingDeleteId(null);
    showToast("Revisão excluída.");
  };

  return (
    <div className="-m-4 min-h-full p-4 md:-m-6 md:p-6 lg:-m-7 lg:p-7">
      <div className="mx-auto max-w-7xl">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Revisões</h1>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-adicionar-estudo"
              onClick={() => openRegistro(null)}
              className="flex items-center gap-1.5 rounded-lg bg-[#527DFF] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#416CEB]"
            >
              <Plus className="h-4 w-4" />
              Adicionar Estudo
            </button>

            {/* Seletor do plano de estudos */}
            {editais.length > 0 && (
              <PlanSelector
                items={editais.map((ed) => ({ id: ed.id, title: ed.title, imageUrl: ed.imageUrl }))}
                activeId={activeEdital?.id}
                activeLabel={activeEdital?.title || "Plano"}
                imageUrl={
                  (activePlan ? getPlanImageUrl(activePlan.id) : null) ||
                  activePlan?.imageUrl ||
                  activeEdital?.imageUrl
                }
                onSelect={setActiveEditalId}
              />
            )}

            {/* Filtros */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-xs transition ${
                  showFilters
                    ? "border-[#F4B544]/40 bg-[#527DFF]/10 text-[#F4B544]"
                    : "border-[#263447] bg-[#111B2D] text-[#C4CEDB] hover:bg-[#223149]"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
                <ChevronDown className={`h-3.5 w-3.5 transition ${showFilters ? "rotate-180" : ""}`} />
              </button>

              {showFilters && (
                <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-[#263447] bg-[#1D2B40] p-3 shadow-lg">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#93A2B7]" />
                    <input
                      type="text"
                      placeholder="Buscar por tópico ou disciplina..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-[#263447] bg-[#111B2D] py-2 pl-9 pr-3 text-xs text-white placeholder:text-[#718096] focus:border-[#7DA2FF] focus:outline-none"
                    />
                  </div>
                  <select
                    value={selectedDiscipline}
                    onChange={(e) => setSelectedDiscipline(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#263447] bg-[#111B2D] px-3 py-2 text-xs font-medium text-white focus:border-[#7DA2FF] focus:outline-none"
                  >
                    <option value="all">Todas as Disciplinas</option>
                    {activeEdital?.disciplines.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Abas de categoria */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.key;
            const count = counts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition ${
                  isActive ? "bg-[#527DFF] text-white" : "bg-[#111B2D] text-[#93A2B7] hover:bg-[#223149]"
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-white/25 text-white" : "bg-[#223149] text-[#F4B544]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Área principal: grupos cronológicos */}
        <div className="mt-4 max-h-[72vh] overflow-y-auto rounded-xl border border-[#263447] bg-[#1D2B40] px-6 py-4 shadow-sm">
          {filteredReviews.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Inbox className="h-8 w-8 text-[#C4CEDB]" />
              <p className="mt-2 text-xs font-semibold text-[#93A2B7]">
                {activeSubTab === "atrasadas"
                  ? "Nenhuma revisão atrasada — tudo em dia!"
                  : activeSubTab === "ignoradas"
                  ? "Revisões ignoradas aparecerão aqui e poderão ser reativadas."
                  : activeSubTab === "concluidas"
                  ? "Revisões concluídas aparecerão aqui com seus registros."
                  : "Nenhuma revisão programada — use Adicionar Estudo para criar."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedReviews.map(([dateKey, reviews]) => {
                const parts = getDateParts(dateKey);
                const isToday = dateKey === todayStr;
                return (
                  <div key={dateKey}>
                    {/* Cabeçalho do grupo: data à esquerda + linha verde-água */}
                    <div className="flex items-center gap-3">
                      {isToday ? (
                        <span className="text-lg font-extrabold uppercase tracking-wide text-white">
                          Hoje
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xl font-bold leading-none text-white">{parts.day}</span>
                          <span className="flex flex-col text-[9px] font-bold uppercase leading-tight text-[#93A2B7]">
                            <span>
                              {parts.month}/{parts.year}
                            </span>
                            <span>{parts.weekday}</span>
                          </span>
                        </div>
                      )}
                      <div className="h-0.5 flex-1 rounded bg-[#527DFF]/40" />
                    </div>

                    {/* Linhas de revisão */}
                    <div className="mt-3 space-y-3">
                      {reviews.map((rev) => {
                        const relatedSessions = sessionsByTopic.get(rev.topicId) || [];
                        return (
                          <div key={rev.id} className="space-y-1.5">
                            {/* Linha compacta da revisão */}
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg border border-[#F4B544]/30 bg-[#527DFF]/10 px-3 py-1 text-[12px] font-semibold text-[#F4B544]">
                                {getIntervalLabel(rev.stage)}
                              </span>

                              {!rev.completed && rev.status !== "Ignorada" && (
                                <>
                                  <button
                                    type="button"
                                    title="Iniciar revisão no cronômetro"
                                    onClick={() =>
                                      launchStudySessionForTopic(rev.disciplineId, rev.topicId, "Revisão")
                                    }
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#527DFF] text-white shadow-xs transition hover:bg-[#416CEB]"
                                  >
                                    <Play className="h-3 w-3 fill-current" />
                                  </button>

                                  <button
                                    type="button"
                                    title="Registrar estudo"
                                    onClick={() => openRegistro(rev)}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#527DFF] text-white shadow-xs transition hover:bg-[#416CEB]"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    title="Ignorar revisão"
                                    onClick={() => handleIgnore(rev)}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F16D75] text-white shadow-xs transition hover:bg-[#F16D75]"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}

                              {rev.status === "Ignorada" && !rev.completed && (
                                <button
                                  type="button"
                                  title="Reativar revisão"
                                  onClick={() => handleReactivate(rev)}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#223149] text-white shadow-xs transition hover:bg-[#1B3154]"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {rev.completed && (
                                <span
                                  title="Concluída"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#527DFF] text-white shadow-xs"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              )}

                              <span className="truncate text-[12px] font-bold uppercase tracking-wide text-white">
                                {rev.disciplineName}
                              </span>

                              {/* Gerenciar: reagendar / excluir */}
                              <div className="relative ml-auto">
                                <button
                                  type="button"
                                  title="Reagendar ou excluir"
                                  onClick={() => {
                                    setManageMenuFor(manageMenuFor === rev.id ? null : rev.id);
                                    setRescheduleDate(rev.dueDate);
                                    setConfirmingDeleteId(null);
                                  }}
                                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#93A2B7] transition hover:bg-[#223149] hover:text-white"
                                >
                                  <CalendarClock className="h-4 w-4" />
                                </button>

                                {manageMenuFor === rev.id && (
                                  <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-[#263447] bg-[#1D2B40] p-3 shadow-lg">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#718096]">
                                      Reagendar
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                      <input
                                        type="date"
                                        value={rescheduleDate}
                                        onChange={(e) => setRescheduleDate(e.target.value)}
                                        className="w-full rounded-lg border border-[#263447] bg-[#111B2D] px-2 py-1.5 text-xs text-white focus:border-[#7DA2FF] focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleReschedule(rev)}
                                        className="shrink-0 rounded-lg bg-[#527DFF] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#416CEB]"
                                      >
                                        Mover
                                      </button>
                                    </div>

                                    <div className="mt-3 border-t border-[#263447] pt-2">
                                      {confirmingDeleteId === rev.id ? (
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[11px] font-semibold text-[#C4CEDB]">
                                            Excluir definitivamente?
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleDelete(rev)}
                                            className="shrink-0 rounded-lg bg-[#F16D75] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#F16D75]"
                                          >
                                            Sim
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmingDeleteId(rev.id)}
                                          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#F16D75] hover:text-[#F16D75]"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          Excluir revisão
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Registros de estudo relacionados */}
                            {relatedSessions.length > 0 ? (
                              <div className="pl-1">
                                {relatedSessions.map((s) => (
                                  <StudyRecordRow key={s.id} session={s} />
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-lg bg-[#111B2D] px-4 py-2 text-[12px] text-[#93A2B7]">
                                <span className="font-medium text-[#C4CEDB]">{rev.topicName}</span>
                                <span className="mx-2 text-[#C4CEDB]">&bull;</span>
                                Sem registro de estudo — use Registrar para lançar sua revisão.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-[#263447] bg-[#1D2B40] px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Modal compacto "Registro de Estudo" */}
      <RegistroEstudoModal
        open={isRegistroOpen}
        onClose={() => setIsRegistroOpen(false)}
        review={selectedReviewForModal}
        onSuccessToast={showToast}
      />
    </div>
  );
};
