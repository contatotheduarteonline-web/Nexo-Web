import React, { useState, useMemo, useEffect, useRef } from "react";
import { useStudy } from "../../context/StudyContext";
import { StudyModality, StudySession } from "../../types";
import { StudySessionEditModal } from "./StudySessionEditModal";
import {
  Search,
  Trash2,
  Calendar,
  Clock,
  Target,
  Check,
  RotateCw,
  FileText,
  MoreVertical,
  ChevronDown,
  X,
  Loader2,
  Plus,
  Pencil,
} from "lucide-react";

// Helpers for dates without timezone off-by-one errors
function getSessionStudyDateStr(session: StudySession): string {
  if (session.studyDate) return session.studyDate;
  if (session.date) return session.date.split("T")[0];
  return "";
}

function getSessionCreatedAtTime(session: StudySession): number {
  if (session.createdAt) {
    const t = new Date(session.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (session.date) {
    const t = new Date(session.date).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

function formatStudyDateDisplay(session: StudySession): string {
  const ymd = getSessionStudyDateStr(session);
  if (!ymd) return "—";
  const parts = ymd.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const months = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d} ${monthName} ${y}`;
  }
  return ymd;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }
  return `${m} min`;
}

function getTodayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDaysAgoYmd(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type PeriodFilter = "all" | "today" | "7days" | "30days" | "custom";

export const HistoricoView: React.FC = () => {
  const {
    studySessions,
    scheduledReviews,
    editais,
    activeEdital,
    studyPlans,
    activePlan,
    deleteStudySession,
    setActiveTab,
  } = useStudy();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModality, setSelectedModality] = useState<string>("all");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Interaction state
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<StudySession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close menus on outside click
  const menuContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setOpenMenuSessionId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Available disciplines for filtering
  const availableDisciplines = useMemo(() => {
    const map = new Map<string, string>();
    // From active edital or plans
    const curEdital =
      activePlan && activePlan.editalId
        ? editais.find((e) => e.id === activePlan.editalId) || activeEdital
        : activeEdital;

    if (curEdital?.disciplines) {
      curEdital.disciplines.forEach((d) => map.set(d.id, d.name));
    }
    // Also include any disciplines that exist in studySessions
    studySessions.forEach((s) => {
      if (s.disciplineId && s.disciplineName && !map.has(s.disciplineId)) {
        map.set(s.disciplineId, s.disciplineName);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [editais, activeEdital, activePlan, studySessions]);

  // Modalities list
  const modalities: StudyModality[] = [
    "Teoria",
    "Questões",
    "Revisão",
    "Videoaula",
    "Lei Seca",
    "Simulado",
  ];

  // Filtering logic
  const filteredSessions = useMemo(() => {
    const todayYmd = getTodayYmd();
    const sevenDaysAgo = getDaysAgoYmd(7);
    const thirtyDaysAgo = getDaysAgoYmd(30);

    return studySessions.filter((s) => {
      // Modality filter
      if (selectedModality !== "all" && s.modality !== selectedModality) return false;

      // Discipline filter
      if (selectedDiscipline !== "all" && s.disciplineId !== selectedDiscipline) return false;

      // Period filter based on studyDate
      const studyDateStr = getSessionStudyDateStr(s);
      if (periodFilter === "today") {
        if (studyDateStr !== todayYmd) return false;
      } else if (periodFilter === "7days") {
        if (studyDateStr < sevenDaysAgo) return false;
      } else if (periodFilter === "30days") {
        if (studyDateStr < thirtyDaysAgo) return false;
      } else if (periodFilter === "custom") {
        if (customStartDate && studyDateStr < customStartDate) return false;
        if (customEndDate && studyDateStr > customEndDate) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDisc = (s.disciplineName || "").toLowerCase().includes(q);
        const matchTopic = (s.topicName || "").toLowerCase().includes(q);
        const matchNotes = (s.notes || "").toLowerCase().includes(q);
        const matchCargo = (s.cargo || "").toLowerCase().includes(q);
        if (!matchDisc && !matchTopic && !matchNotes && !matchCargo) return false;
      }

      return true;
    });
  }, [
    studySessions,
    selectedModality,
    selectedDiscipline,
    periodFilter,
    customStartDate,
    customEndDate,
    searchQuery,
  ]);

  // Strict sorting: 1. studyDate mais recente; 2. Em empate, createdAt mais recente
  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => {
      const dateA = getSessionStudyDateStr(a);
      const dateB = getSessionStudyDateStr(b);
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      const createdA = getSessionCreatedAtTime(a);
      const createdB = getSessionCreatedAtTime(b);
      return createdB - createdA;
    });
  }, [filteredSessions]);

  // Aggregated indicators for the top summary
  const totalFilteredMinutes = useMemo(() => {
    return sortedSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }, [sortedSessions]);

  const totalFilteredHoursFormatted = useMemo(() => {
    const h = Math.floor(totalFilteredMinutes / 60);
    const m = totalFilteredMinutes % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }, [totalFilteredMinutes]);

  const totalFilteredQuestions = useMemo(() => {
    return sortedSessions.reduce((acc, s) => acc + (s.questionsDone || 0), 0);
  }, [sortedSessions]);

  const totalFilteredCorrect = useMemo(() => {
    return sortedSessions.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0);
  }, [sortedSessions]);

  const averageAccuracy = useMemo(() => {
    return totalFilteredQuestions > 0
      ? Math.round((totalFilteredCorrect / totalFilteredQuestions) * 100)
      : 0;
  }, [totalFilteredQuestions, totalFilteredCorrect]);

  // Check if any filter is actively applied
  const isFiltered =
    selectedModality !== "all" ||
    selectedDiscipline !== "all" ||
    periodFilter !== "all" ||
    searchQuery.trim() !== "" ||
    customStartDate !== "" ||
    customEndDate !== "";

  const clearFilters = () => {
    setSelectedModality("all");
    setSelectedDiscipline("all");
    setPeriodFilter("all");
    setSearchQuery("");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const handleEditSession = (session: StudySession) => {
    setOpenMenuSessionId(null);
    setSessionToEdit(session);
  };

  // Execution of session deletion
  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStudySession(sessionToDelete.id);
      setSessionToDelete(null);
      setOpenMenuSessionId(null);
    } catch (err) {
      console.error("Erro ao excluir estudo:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12" ref={menuContainerRef}>
      {/* 1. NOVO CABEÇALHO LIMPO (mesmo padrão do Registro de Estudos) */}
      <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white dark:text-white">
          Histórico de Estudos
        </h1>
      </div>

      {/* 2. RESUMO SUPERIOR (compacto e elegante) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* SESSÕES */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white">
            Sessões
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-white dark:text-white">
            {sortedSessions.length}
          </div>
        </div>

        {/* TEMPO LÍQUIDO */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white">
            Tempo Líquido
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#F59E0B] dark:text-[#FBBF24]">
            {totalFilteredHoursFormatted}
          </div>
        </div>

        {/* QUESTÕES */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white">
            Questões
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-white dark:text-white">
            {totalFilteredQuestions}
          </div>
        </div>

        {/* APROVEITAMENTO */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white">
            Aproveitamento
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {averageAccuracy}%
          </div>
        </div>
      </div>

      {/* 3. ÁREA DE FILTROS COMPACTA E MODERNA */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-[#252B38] space-y-3">
        {/* Linha superior: Busca, Modalidade e Disciplina */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          {/* Busca */}
          <div className="relative sm:col-span-6 lg:col-span-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" />
            <input
              id="history-search-input"
              type="text"
              placeholder="Buscar por disciplina, assunto ou anotação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-8 text-xs text-white placeholder:text-white focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white hover:text-white dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Disciplina */}
          <div className="relative sm:col-span-3 lg:col-span-3">
            <select
              id="history-discipline-filter"
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs font-semibold text-white transition focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white cursor-pointer truncate"
            >
              <option value="all">Todas as disciplinas</option>
              {availableDisciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" />
          </div>

          {/* Modalidade */}
          <div className="relative sm:col-span-3 lg:col-span-3">
            <select
              id="history-modality-filter"
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs font-semibold text-white transition focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] dark:border-slate-800 dark:bg-[#0F172A] dark:text-white cursor-pointer"
            >
              <option value="all">Todas as modalidades</option>
              {modalities.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" />
          </div>
        </div>

        {/* Linha inferior: Filtro de Período (Pills compactas) e Limpar Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Período:
            </span>
            {(
              [
                { key: "all", label: "Todos" },
                { key: "today", label: "Hoje" },
                { key: "7days", label: "Últimos 7 dias" },
                { key: "30days", label: "Últimos 30 dias" },
                { key: "custom", label: "Personalizado" },
              ] as const
            ).map((p) => {
              const isSelected = periodFilter === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriodFilter(p.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-[#F59E0B] text-white shadow-xs"
                      : "bg-slate-100 text-white hover:bg-slate-200 dark:bg-[#0F172A] dark:text-white dark:hover:bg-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-[#F59E0B] hover:underline dark:text-[#FBBF24] cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Período Personalizado (Inputs discretos de data) */}
        {periodFilter === "custom" && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-white">De:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-white dark:border-slate-800 dark:bg-[#0F172A] dark:text-white"
            />
            <span className="text-xs text-white">Até:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-white dark:border-slate-800 dark:bg-[#0F172A] dark:text-white"
            />
          </div>
        )}
      </div>

      {/* 4. LISTA DE REGISTROS MODERNOS (Substitui completamente a tabela tradicional) */}
      {studySessions.length === 0 ? (
        /* ESTADO VAZIO LIMPO (quando não há nenhum estudo registrado) */
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <h2 className="text-base font-bold text-white dark:text-white">
            Nenhum estudo registrado
          </h2>
          <p className="mt-1 text-xs text-white dark:text-white max-w-sm mx-auto">
            Seus estudos aparecerão aqui depois que você finalizar uma sessão.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setActiveTab("cronometro")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition hover:bg-[#D97706] active:scale-98 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Registrar estudo</span>
            </button>
          </div>
        </div>
      ) : sortedSessions.length === 0 ? (
        /* VAZIO DEVIDO A FILTROS */
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <p className="text-xs font-medium text-white dark:text-white">
            Nenhum estudo encontrado com os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#F59E0B] hover:underline dark:text-[#FBBF24] cursor-pointer"
          >
            Limpar filtros aplicados
          </button>
        </div>
      ) : (
        /* LISTA DE CARDS DE ESTUDO COMPACTOS */
        <div className="space-y-3">
          {sortedSessions.map((session) => {
            // Associated scheduled reviews check
            const linkedReviews = scheduledReviews.filter(
              (r) =>
                r.sessionId === session.id ||
                r.originalSessionId === session.id ||
                r.id.startsWith(`rev-${session.id}`)
            );
            const totalReviews =
              linkedReviews.length > 0
                ? linkedReviews.length
                : session.reviewsScheduled || 0;
            const completedReviews = linkedReviews.filter((r) => r.completed).length;

            const accuracy =
              session.questionsDone > 0
                ? Math.round((session.questionsCorrect / session.questionsDone) * 100)
                : 0;

            const isMenuOpen = openMenuSessionId === session.id;
            const isExpanded = expandedSessionId === session.id;
            const hasNotes = Boolean(session.notes && session.notes.trim());

            return (
              <div
                key={session.id}
                className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#252B38] dark:hover:border-slate-700"
              >
                {/* Linha Superior: Data do Estudo & Menu 3 Pontos */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                      {formatStudyDateDisplay(session)}
                    </span>
                    <span className="text-white dark:text-white">·</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] dark:text-[#FBBF24]">
                      {session.disciplineName || "Disciplina"}
                    </span>
                  </div>

                  {/* Menu de Ação de 3 Pontos */}
                  <div className="relative">
                    <button
                      id={`session-menu-btn-${session.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuSessionId(isMenuOpen ? null : session.id);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition hover:bg-slate-100 hover:text-white dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                      title="Opções do registro"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown discreto de ações */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-[#252B38]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSession(session);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-white hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800 cursor-pointer transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Editar registro</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuSessionId(null);
                            setSessionToDelete(session);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Excluir registro</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Título do Tópico / Assunto */}
                <h3 className="mt-1 text-sm font-semibold text-white dark:text-white leading-snug">
                  {session.topicName || "Geral"}
                </h3>

                {/* Badges / Chips Discretos de Métricas e Indicadores */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {/* Modalidade */}
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-white dark:bg-[#0F172A] dark:text-white border border-slate-200/80 dark:border-slate-800">
                    {session.modality}
                  </span>

                  {/* Duração líquida */}
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-white dark:text-white">
                    <Clock className="h-3 w-3 text-white" />
                    {formatDuration(session.durationMinutes)}
                  </span>

                  {/* Questões e Aproveitamento */}
                  {session.questionsDone > 0 && (
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-white dark:text-white">
                      <Target className="h-3 w-3 text-white" />
                      <span>
                        {session.questionsCorrect}/{session.questionsDone}
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        · {accuracy}%
                      </span>
                    </span>
                  )}

                  {/* Teoria finalizada */}
                  {session.theoryCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                      <Check className="h-3 w-3 stroke-[3]" />
                      Teoria finalizada
                    </span>
                  )}

                  {/* Revisões Programadas */}
                  {totalReviews > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-[#F59E0B] border border-amber-200/70 dark:bg-amber-950/30 dark:text-[#FBBF24] dark:border-amber-900/50">
                      <RotateCw className="h-3 w-3" />
                      {completedReviews > 0
                        ? `${completedReviews}/${totalReviews} revisões`
                        : `${totalReviews} revisões programadas`}
                    </span>
                  )}

                  {/* Anotação (Chip discreto clicável para abrir detalhes) */}
                  {hasNotes && (
                    <button
                      type="button"
                      onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-white hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Anotação</span>
                    </button>
                  )}
                </div>

                {/* Detalhe Expandido de Anotações (quando acionado pelo chip) */}
                {isExpanded && hasNotes && (
                  <div className="mt-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-[#0F172A]/60">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Anotações da sessão
                      </span>
                      {session.cargo && (
                        <span className="text-white dark:text-white">
                          Cargo: {session.cargo}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-xs text-white dark:text-white leading-relaxed">
                      {session.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL COMPACTO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-[#252B38]">
            <h3 className="text-sm font-bold text-white dark:text-white">
              Excluir este registro de estudo?
            </h3>
            <p className="mt-2 text-xs text-white dark:text-white leading-relaxed">
              Essa ação também removerá os dados relacionados a este estudo.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSessionToDelete(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161C28] dark:text-white dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {sessionToEdit && (
        <StudySessionEditModal
          session={sessionToEdit}
          onClose={() => setSessionToEdit(null)}
          onSaved={() => setSessionToEdit(null)}
        />
      )}
    </div>
  );
};
