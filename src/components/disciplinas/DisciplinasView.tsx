import React, { useState, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import { Discipline, Topic, StudyPlan } from "../../types";
import { DisciplineCard } from "./DisciplineCard";
import { DisciplinesTableView } from "./DisciplinesTableView";
import { EditDisciplineModal } from "../modals/EditDisciplineModal";
import { AddDisciplineModal } from "../modals/AddDisciplineModal";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Layers,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";

interface DisciplinasViewProps {
  onOpenNewTopicModal?: (disciplineId?: string) => void;
}

export const DisciplinasView: React.FC<DisciplinasViewProps> = ({
  onOpenNewTopicModal,
}) => {
  const {
    studyPlans,
    editais,
    activeEdital,
    studySessions,
    setActiveTab,
    launchStudySessionForTopic,
  } = useStudy();

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed" | "not_started">("all");
  const [sortBy, setSortBy] = useState<"name" | "time" | "progress" | "questions">("name");

  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [isAddDisciplineOpen, setIsAddDisciplineOpen] = useState(false);

  // Collect all disciplines paired with their parent plan and edital
  interface DisciplineWithPlan {
    discipline: Discipline;
    plan: StudyPlan | null;
    editalId: string;
    topics: Topic[];
  }

  const allDisciplinesWithPlans = useMemo(() => {
    const list: DisciplineWithPlan[] = [];

    // Map plans to editais
    studyPlans.forEach((plan) => {
      const edital = editais.find((e) => e.id === plan.editalId);
      if (edital) {
        edital.disciplines.forEach((disc) => {
          const discTopics = edital.topics.filter((t) => t.disciplineId === disc.id);
          list.push({
            discipline: disc,
            plan,
            editalId: edital.id,
            topics: discTopics,
          });
        });
      }
    });

    // Also include editais not tied to a formal plan (if any)
    editais.forEach((edital) => {
      const isAlreadyInPlan = studyPlans.some((p) => p.editalId === edital.id);
      if (!isAlreadyInPlan) {
        edital.disciplines.forEach((disc) => {
          const discTopics = edital.topics.filter((t) => t.disciplineId === disc.id);
          list.push({
            discipline: disc,
            plan: null,
            editalId: edital.id,
            topics: discTopics,
          });
        });
      }
    });

    return list;
  }, [studyPlans, editais]);

  // Filtered & Sorted disciplines
  const filteredDisciplines = useMemo(() => {
    return allDisciplinesWithPlans
      .filter(({ discipline, plan, topics }) => {
        // Plan filter
        if (selectedPlanId !== "all") {
          if (!plan || plan.id !== selectedPlanId) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = discipline.name.toLowerCase().includes(q);
          const matchesPlan = plan?.name.toLowerCase().includes(q) || false;
          if (!matchesName && !matchesPlan) return false;
        }

        // Status filter
        const totalTopics = topics.length;
        const completedTopics = topics.filter((t) => t.isStudied).length;

        if (statusFilter === "completed") {
          return totalTopics > 0 && completedTopics === totalTopics;
        }
        if (statusFilter === "not_started") {
          return totalTopics === 0 || completedTopics === 0;
        }
        if (statusFilter === "in_progress") {
          return completedTopics > 0 && completedTopics < totalTopics;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.discipline.name.localeCompare(b.discipline.name);
        }
        if (sortBy === "progress") {
          const pctA =
            a.topics.length > 0
              ? a.topics.filter((t) => t.isStudied).length / a.topics.length
              : 0;
          const pctB =
            b.topics.length > 0
              ? b.topics.filter((t) => t.isStudied).length / b.topics.length
              : 0;
          return pctB - pctA;
        }
        if (sortBy === "questions") {
          const qA = a.topics.reduce((acc, t) => acc + (t.questionsDone || 0), 0);
          const qB = b.topics.reduce((acc, t) => acc + (t.questionsDone || 0), 0);
          return qB - qA;
        }
        if (sortBy === "time") {
          const sessionsA = studySessions.filter(
            (s) => s.disciplineId === a.discipline.id || s.disciplineName === a.discipline.name
          );
          const timeA = sessionsA.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
          const sessionsB = studySessions.filter(
            (s) => s.disciplineId === b.discipline.id || s.disciplineName === b.discipline.name
          );
          const timeB = sessionsB.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
          return timeB - timeA;
        }
        return 0;
      });
  }, [allDisciplinesWithPlans, selectedPlanId, searchQuery, statusFilter, sortBy, studySessions]);

  // Target plan for new discipline
  const defaultTargetEditalId =
    (selectedPlanId !== "all" && studyPlans.find((p) => p.id === selectedPlanId)?.editalId) ||
    activeEdital?.id ||
    editais[0]?.id ||
    "";
  const defaultTargetPlanName =
    (selectedPlanId !== "all" && studyPlans.find((p) => p.id === selectedPlanId)?.name) ||
    studyPlans[0]?.name;

  const handleStartStudy = (discipline: Discipline) => {
    const parentEdital = editais.find((e) => e.disciplines.some((d) => d.id === discipline.id));
    const firstTopic = parentEdital?.topics.find((t) => t.disciplineId === discipline.id);
    if (firstTopic) {
      launchStudySessionForTopic(discipline.id, firstTopic.id);
    } else {
      launchStudySessionForTopic(discipline.id);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Disciplinas
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Acompanhe todas as matérias dos seus planos em um único lugar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                viewMode === "cards"
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                viewMode === "table"
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
              title="Visualização em Tabela"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tabela</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddDisciplineOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-98 transition shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Disciplina</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome da disciplina ou plano..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#F59E0B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Plan Filter */}
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 focus:border-[#F59E0B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="all">Todos os Planos ({studyPlans.length})</option>
            {studyPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 focus:border-[#F59E0B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="all">Todos os Status</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluídas</option>
            <option value="not_started">Não Iniciadas</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 focus:border-[#F59E0B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="name">Ordem Alfabética</option>
            <option value="progress">Maior Progresso</option>
            <option value="questions">Mais Questões</option>
            <option value="time">Mais Tempo Estudado</option>
          </select>
        </div>
      </div>

      {/* Main Content: Cards or Table */}
      {filteredDisciplines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-[#F59E0B]">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
            Nenhuma disciplina encontrada
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
            {allDisciplinesWithPlans.length === 0
              ? "As disciplinas aparecerão aqui quando forem adicionadas aos seus planos de estudo."
              : "Nenhuma matéria corresponde aos filtros selecionados."}
          </p>
          {allDisciplinesWithPlans.length === 0 && (
            <button
              onClick={() => setActiveTab("planos")}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition"
            >
              <Layers className="h-4 w-4" />
              <span>Ir para Planos</span>
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <DisciplinesTableView
            onOpenNewTopicModal={(discId) => onOpenNewTopicModal?.(discId)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDisciplines.map(({ discipline, plan, topics }) => {
            const discSessions = studySessions.filter(
              (s) => s.disciplineId === discipline.id || s.disciplineName === discipline.name
            );
            return (
              <DisciplineCard
                key={discipline.id}
                discipline={discipline}
                planName={plan?.name || "Geral"}
                topics={topics}
                sessions={discSessions}
                onEdit={(d) => setEditingDiscipline(d)}
                onStartStudy={(d) => handleStartStudy(d)}
              />
            );
          })}
        </div>
      )}

      {/* Edit Discipline Modal */}
      {editingDiscipline && (
        <EditDisciplineModal
          discipline={editingDiscipline}
          isOpen={true}
          onClose={() => setEditingDiscipline(null)}
        />
      )}

      {/* Add Discipline Modal */}
      {isAddDisciplineOpen && defaultTargetEditalId && (
        <AddDisciplineModal
          isOpen={true}
          onClose={() => setIsAddDisciplineOpen(false)}
          targetEditalId={defaultTargetEditalId}
          targetPlanName={defaultTargetPlanName}
        />
      )}
    </div>
  );
};
