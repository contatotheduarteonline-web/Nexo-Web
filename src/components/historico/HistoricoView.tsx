import React, { useState, useMemo, useEffect, useRef } from "react";
import { useStudy } from "../../context/StudyContext";
import { PlanSelector } from "../common/PlanSelector";
import { StudyModality, StudySession } from "../../types";
import { RegistroEstudoModal } from "../revisoes/RegistroEstudoModal";
import { StudySessionEditModal } from "./StudySessionEditModal";
import {
  Search,
  Trash2,
  Clock,
  Filter,
  ChevronDown,
  X,
  Loader2,
  Plus,
  Pencil,
  MessageSquare,
  Check,
} from "lucide-react";

// Helpers de data sem distorção de timezone
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

const MONTHS_PT = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

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

/** Formata minutos como "52h38min" (ou "25min" quando menor que 1h). */
function formatHM(minutes: number): string {
  const total = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}min`;
  return `${m}min`;
}

type PeriodFilter = "all" | "today" | "7days" | "30days" | "custom";

const MODALITY_BADGE_COLOR: Record<string, string> = {
  Teoria: "#8B5CF6",
  "Questões": "#2BBF8A",
  Revisão: "#F16D75",
  Videoaula: "#58A6FF",
  "Lei Seca": "#F4B544",
  Simulado: "#6366F1",
};

const PASTEL_FALLBACK = [
  "#58A6FF", "#2BBF8A", "#8B5CF6", "#EC4899", "#F4B544",
  "#06B6D4", "#6366F1", "#D946EF", "#F16D75", "#84CC16",
];

export const HistoricoView: React.FC = () => {
  const {
    studySessions,
    editais,
    activeEdital,
    studyPlans,
    activePlan,
    setActivePlanId,
    deleteStudySession,
    getPlanImageUrl,
    isPlanImageLoading,
  } = useStudy();

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModality, setSelectedModality] = useState<string>("all");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Interação
  const [openDropdown, setOpenDropdown] = useState<"plan" | "filters" | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<StudySession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const actionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Disciplinas do edital ativo (id → nome e cor)
  const availableDisciplines = useMemo(() => {
    const map = new Map<string, { name: string; color?: string }>();
    (activeEdital?.disciplines || []).forEach((d) => {
      map.set(d.id, { name: d.name, color: (d as { color?: string }).color });
    });
    studySessions.forEach((s) => {
      if (s.disciplineId && s.disciplineName && !map.has(s.disciplineId)) {
        map.set(s.disciplineId, { name: s.disciplineName });
      }
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [activeEdital, studySessions]);

  const disciplineColorMap = useMemo(() => {
    const map = new Map<string, string>();
    availableDisciplines.forEach((d, idx) => {
      map.set(d.id, d.color || PASTEL_FALLBACK[idx % PASTEL_FALLBACK.length]);
    });
    return map;
  }, [availableDisciplines]);

  const modalities: StudyModality[] = [
    "Teoria",
    "Questões",
    "Revisão",
    "Videoaula",
    "Lei Seca",
    "Simulado",
  ];

  // Filtragem
  const filteredSessions = useMemo(() => {
    const todayYmd = getTodayYmd();
    const sevenDaysAgo = getDaysAgoYmd(7);
    const thirtyDaysAgo = getDaysAgoYmd(30);

    return studySessions.filter((s) => {
      if (selectedModality !== "all" && s.modality !== selectedModality) return false;
      if (selectedDiscipline !== "all" && s.disciplineId !== selectedDiscipline) return false;

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

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (s.disciplineName || "").toLowerCase().includes(q) ||
          (s.topicName || "").toLowerCase().includes(q) ||
          (s.notes || "").toLowerCase().includes(q) ||
          (s.cargo || "").toLowerCase().includes(q);
        if (!match) return false;
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

  // Ordenação: studyDate desc, depois createdAt desc
  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => {
      const dateA = getSessionStudyDateStr(a);
      const dateB = getSessionStudyDateStr(b);
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return getSessionCreatedAtTime(b) - getSessionCreatedAtTime(a);
    });
  }, [filteredSessions]);

  // Agrupamento cronológico (dia → header + tempo total)
  const groupedSessions = useMemo(() => {
    const todayYmd = getTodayYmd();
    const yesterdayYmd = getDaysAgoYmd(1);
    const groups: { date: string; label: string; minutes: number; sessions: StudySession[] }[] = [];
    const byDate = new Map<string, StudySession[]>();

    sortedSessions.forEach((s) => {
      const key = getSessionStudyDateStr(s) || "—";
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(s);
    });

    byDate.forEach((sessions, date) => {
      const [y, m, d] = date.split("-");
      let label = date;
      if (date === todayYmd) label = "HOJE";
      else if (date === yesterdayYmd) label = "ONTEM";
      else if (y && m && d) label = `${d} ${MONTHS_PT[parseInt(m, 10) - 1] || m} ${y}`;
      groups.push({
        date,
        label,
        minutes: sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0),
        sessions,
      });
    });

    return groups;
  }, [sortedSessions]);

  // Cards de resumo (respeitam os filtros ativos)
  const summary = useMemo(() => {
    const totalMinutes = sortedSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const acertos = sortedSessions.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0);
    const questoes = sortedSessions.reduce((acc, s) => acc + (s.questionsDone || 0), 0);
    const erros = Math.max(0, questoes - acertos);
    const desempenho = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;

    const topics = activeEdital?.topics || [];
    const totalTopics = topics.length;
    const concluidos = topics.filter((t) => t.isStudied).length;
    const pendentes = Math.max(0, totalTopics - concluidos);
    const progresso = totalTopics > 0 ? Math.round((concluidos / totalTopics) * 100) : 0;

    const paginas = sortedSessions.reduce(
      (acc, s) =>
        s.pagesStart != null && s.pagesEnd != null && s.pagesEnd > s.pagesStart
          ? acc + (s.pagesEnd - s.pagesStart + 1)
          : acc,
      0
    );
    const paginasPorHora = totalMinutes > 0 ? paginas / (totalMinutes / 60) : 0;

    return { totalMinutes, acertos, erros, desempenho, concluidos, pendentes, progresso, paginas, paginasPorHora };
  }, [sortedSessions, activeEdital]);

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

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStudySession(sessionToDelete.id);
      setSessionToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir estudo:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const planCustomImageUrl = activePlan ? getPlanImageUrl(activePlan.id) : null;
  const planHasCustom = Boolean(activePlan && (activePlan.hasCustomImage || activePlan.imageRef));
  const planIsLoading = planHasCustom && !planCustomImageUrl && activePlan
    ? isPlanImageLoading(activePlan.id)
    : false;
  const planImage = planCustomImageUrl || activePlan?.imageUrl || activeEdital?.imageUrl;

  const selectClass =
    "w-full appearance-none rounded-lg border border-[#263447] bg-[#1D2B40] px-3 py-2 pr-8 text-[13px] font-medium text-white outline-none transition focus:border-[#527DFF] focus:ring-1 focus:ring-[#527DFF] cursor-pointer truncate";

  const outlineBtn =
    "inline-flex items-center gap-2 rounded-lg border border-[#263447] bg-[#1D2B40] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0B1120] cursor-pointer";

  return (
    <div className="space-y-5 pb-12">
      {/* ===== CABEÇALHO ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[26px] font-bold tracking-tight text-white">Histórico</h1>

        <div className="flex flex-wrap items-center gap-2.5" ref={actionsRef}>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#527DFF] px-4 py-2 text-[13px] font-semibold text-white shadow-xs transition hover:bg-[#416CEB] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Adicionar Estudo
          </button>

          {/* Plano ativo */}
          <PlanSelector
            items={studyPlans.map((p) => ({
              id: p.id,
              title: p.name,
              imageUrl: getPlanImageUrl(p.id) || p.imageUrl,
            }))}
            activeId={activePlan?.id}
            activeLabel={activePlan?.name || "Meu Plano"}
            imageUrl={planImage}
            isLoading={planIsLoading}
            onSelect={setActivePlanId}
          />

          {/* Filtros */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "filters" ? null : "filters")}
              className={outlineBtn}
            >
              <Filter className="h-4 w-4 text-[#527DFF]" />
              Filtros
              {isFiltered && <span className="h-2 w-2 rounded-full bg-[#2BBF8A]" />}
              <ChevronDown className="h-3.5 w-3.5 text-[#93A2B7]" />
            </button>
            {openDropdown === "filters" && (
              <div className="absolute right-0 top-11 z-30 w-[400px] max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border border-[#263447] bg-[#1D2B40] p-4 shadow-xl">
                {/* Busca */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#93A2B7]" />
                  <input
                    id="history-search-input"
                    type="text"
                    placeholder="Buscar por disciplina, assunto ou anotação..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-[#263447] bg-[#0B1120] py-2 pl-8 pr-8 text-[13px] text-white placeholder:text-[#5B6B80] outline-none focus:border-[#527DFF] focus:ring-1 focus:ring-[#527DFF]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5B6B80] hover:text-white cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative">
                    <select
                      id="history-discipline-filter"
                      value={selectedDiscipline}
                      onChange={(e) => setSelectedDiscipline(e.target.value)}
                      className={selectClass}
                    >
                      <option value="all">Todas as disciplinas</option>
                      {availableDisciplines.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#93A2B7]" />
                  </div>
                  <div className="relative">
                    <select
                      id="history-modality-filter"
                      value={selectedModality}
                      onChange={(e) => setSelectedModality(e.target.value)}
                      className={selectClass}
                    >
                      <option value="all">Todas as modalidades</option>
                      {modalities.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#93A2B7]" />
                  </div>
                </div>

                {/* Período */}
                <div className="flex flex-wrap items-center gap-1.5 border-t border-[#263447] pt-3">
                  {(
                    [
                      { key: "all", label: "Todos" },
                      { key: "today", label: "Hoje" },
                      { key: "7days", label: "7 dias" },
                      { key: "30days", label: "30 dias" },
                      { key: "custom", label: "Personalizado" },
                    ] as const
                  ).map((p) => {
                    const isSelected = periodFilter === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPeriodFilter(p.key)}
                        className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-[#527DFF] text-white"
                            : "bg-[#0B1120] text-white hover:bg-[#172235]"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                  {isFiltered && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="ml-auto text-[12px] font-semibold text-[#F16D75] hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {periodFilter === "custom" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] text-[#93A2B7]">De:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="rounded-lg border border-[#263447] bg-[#0B1120] px-2.5 py-1 text-[12px] text-white outline-none focus:border-[#527DFF]"
                    />
                    <span className="text-[12px] text-[#93A2B7]">Até:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="rounded-lg border border-[#263447] bg-[#0B1120] px-2.5 py-1 text-[12px] text-white outline-none focus:border-[#527DFF]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== CARDS DE RESUMO ===== */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {/* TEMPO DE ESTUDO */}
        <div className="rounded-xl border border-[#263447] bg-[#1D2B40] p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#93A2B7]">
            Tempo de Estudo
          </div>
          <div className="mt-4 flex min-h-[32px] items-end justify-end">
            <span className="num-condensed text-[22px] font-bold leading-none text-white">
              {formatHM(summary.totalMinutes)}
            </span>
          </div>
        </div>

        {/* DESEMPENHO */}
        <div className="rounded-xl border border-[#263447] bg-[#1D2B40] p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#93A2B7]">
            Desempenho
          </div>
          <div className="mt-2.5 flex min-h-[32px] items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5 pb-0.5">
              <span className="text-[12px] font-semibold text-[#2BBF8A]">
                {`${summary.acertos} Acertos`}
              </span>
              <span className="text-[12px] font-semibold text-[#F16D75]">
                {`${summary.erros} Erros`}
              </span>
            </div>
            <span className="num-condensed text-[22px] font-bold leading-none text-white">
              {summary.desempenho}%
            </span>
          </div>
        </div>

        {/* PROGRESSO NO EDITAL */}
        <div className="rounded-xl border border-[#263447] bg-[#1D2B40] p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#93A2B7]">
            Progresso no Edital
          </div>
          <div className="mt-2.5 flex min-h-[32px] items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5 pb-0.5">
              <span className="text-[12px] font-semibold text-[#2BBF8A]">
                {`${summary.concluidos} Tópicos Concluídos`}
              </span>
              <span className="text-[12px] font-semibold text-[#F16D75]">
                {`${summary.pendentes} Tópicos Pendentes`}
              </span>
            </div>
            <span className="num-condensed text-[22px] font-bold leading-none text-white">
              {summary.progresso}%
            </span>
          </div>
        </div>

        {/* PÁGINAS LIDAS */}
        <div className="rounded-xl border border-[#263447] bg-[#1D2B40] p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#93A2B7]">
            Páginas Lidas
          </div>
          <div className="mt-2.5 flex min-h-[32px] items-end justify-between gap-2">
            <span className="text-[12px] font-medium text-[#93A2B7] pb-0.5">
              {summary.paginasPorHora > 0 ? `${summary.paginasPorHora.toFixed(1)} páginas por hora` : "—"}
            </span>
            <span className="num-condensed text-[22px] font-bold leading-none text-white">
              {summary.paginas}
            </span>
          </div>
        </div>
      </div>

      {/* ===== LISTA CRONOLÓGICA ===== */}
      {studySessions.length === 0 ? (
        <div className="rounded-xl border border-[#263447] bg-[#1D2B40] p-12 text-center shadow-xs">
          <h2 className="text-base font-bold text-white">Nenhum estudo registrado</h2>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#93A2B7]">
            Seus estudos aparecerão aqui depois que você finalizar uma sessão.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#527DFF] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#416CEB] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Estudo</span>
            </button>
          </div>
        </div>
      ) : sortedSessions.length === 0 ? (
        <div className="rounded-xl border border-[#263447] bg-[#1D2B40] p-8 text-center shadow-xs">
          <p className="text-[13px] font-medium text-[#93A2B7]">
            Nenhum estudo encontrado com os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-[#527DFF] hover:underline cursor-pointer"
          >
            Limpar filtros aplicados
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedSessions.map((group) => (
            <section key={group.date}>
              {/* Header do dia com linha do tempo */}
              <div className="flex items-center gap-3 px-0.5">
                <h2 className="text-[15px] font-bold uppercase tracking-[0.08em] text-white">
                  {group.label}
                </h2>
                <div className="h-px flex-1 bg-[#263447]" />
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#93A2B7]">
                  <Clock className="h-3.5 w-3.5" />
                  {formatHM(group.minutes)}
                </span>
              </div>

              {/* Linhas do dia */}
              <div className="mt-2.5 divide-y divide-[#263447] overflow-hidden rounded-xl border border-[#263447] bg-[#1D2B40] shadow-xs">
                {group.sessions.map((session) => {
                  const accuracy =
                    session.questionsDone > 0
                      ? Math.round((session.questionsCorrect / session.questionsDone) * 100)
                      : 0;
                  const hasNotes = Boolean(session.notes && session.notes.trim());
                  const isExpanded = expandedSessionId === session.id;
                  const discColor =
                    disciplineColorMap.get(session.disciplineId) || "#58A6FF";
                  const modalityColor = MODALITY_BADGE_COLOR[session.modality] || "#64748B";

                  const perfBadge =
                    session.questionsDone > 0 ? (
                      <span
                        className={`inline-flex h-7 min-w-[36px] items-center justify-center rounded-md px-1.5 text-[12px] font-bold ${
                          accuracy >= 80
                            ? "bg-[#2BBF8A]/15 text-[#2BBF8A]"
                            : accuracy >= 60
                            ? "bg-[#F4B544]/25 text-[#F4B544]"
                            : "bg-[#F16D75]/15 text-[#F16D75]"
                        }`}
                      >
                        {accuracy}
                      </span>
                    ) : (
                      <span className="inline-flex h-7 min-w-[36px] items-center justify-center rounded-md border border-[#263447] px-1.5 text-[12px] font-bold text-[#93A2B7]">
                        0
                      </span>
                    );

                  return (
                    <div key={session.id} className="group">
                      <div className="flex items-center gap-3 px-3 py-3 transition hover:bg-[#172235]">
                        {/* Barra de cor da disciplina */}
                        <div
                          className="h-10 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: discColor }}
                        />

                        {/* Disciplina + tópico */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-bold uppercase tracking-wide text-white">
                            {session.disciplineName || "Disciplina"}
                          </div>
                          <div className="mt-0.5 truncate text-[12px] text-[#93A2B7]">
                            {session.topicName || "Geral"}
                          </div>
                        </div>

                        {/* Duração */}
                        <div className="hidden w-[96px] items-center justify-end gap-1.5 text-[12.5px] text-[#93A2B7] sm:flex">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="num-condensed">{formatHM(session.durationMinutes)}</span>
                        </div>

                        {/* Acertos */}
                        <div className="num-condensed w-9 text-center text-[13px] font-semibold text-[#2BBF8A]">
                          {session.questionsDone > 0 ? session.questionsCorrect : 0}
                        </div>

                        {/* Erros */}
                        <div className="num-condensed w-9 text-center text-[13px] font-semibold text-[#F16D75]">
                          {session.questionsDone > 0
                            ? session.questionsDone - session.questionsCorrect
                            : 0}
                        </div>

                        {/* Aproveitamento */}
                        <div className="hidden w-[52px] justify-center sm:flex">{perfBadge}</div>

                        {/* Modalidade */}
                        <span
                          className="hidden rounded-md px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-white sm:inline-flex"
                          style={{ backgroundColor: modalityColor }}
                        >
                          {session.modality}
                        </span>

                        {/* Ações */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title={hasNotes ? "Ver anotação" : "Sem anotação"}
                            onClick={() =>
                              hasNotes && setExpandedSessionId(isExpanded ? null : session.id)
                            }
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#172235] cursor-pointer ${
                              hasNotes ? "text-[#527DFF]" : "text-[#5B6B80]"
                            } ${hasNotes ? "" : "cursor-default"}`}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Editar registro"
                            onClick={() => setSessionToEdit(session)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5B6B80] transition hover:bg-[#172235] hover:text-white cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Excluir registro"
                            onClick={() => setSessionToDelete(session)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5B6B80] transition hover:bg-[#F16D75]/10 hover:text-[#F16D75] cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Anotação expandida */}
                      {isExpanded && hasNotes && (
                        <div className="border-t border-[#263447] bg-[#0B1120] px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#93A2B7]">
                              Anotações da sessão
                            </span>
                            {session.cargo && (
                              <span className="text-[11px] font-medium text-[#93A2B7]">
                                Cargo: {session.cargo}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[#C4CEDB]">
                            {session.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ===== MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ===== */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1120]/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-[#263447] bg-[#1D2B40] p-5 shadow-xl">
            <h3 className="text-[15px] font-bold text-white">
              Excluir este registro de estudo?
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#93A2B7]">
              Essa ação também removerá os dados relacionados a este estudo.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSessionToDelete(null)}
                className="rounded-lg border border-[#263447] bg-[#1D2B40] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0B1120] cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 rounded-lg bg-[#F16D75] px-4 py-2 text-[13px] font-bold text-white shadow-xs transition hover:bg-[#E45A63] active:scale-98 cursor-pointer disabled:opacity-50"
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

      {/* ===== MODAIS ===== */}
      <RegistroEstudoModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
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
