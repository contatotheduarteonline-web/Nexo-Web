import React, { useState, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import { Discipline, Topic } from "../../types";
import {
  Edit2,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Sparkles,
  Search,
  Globe,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { EditDisciplineModal } from "../modals/EditDisciplineModal";
import { ManualStudyModal } from "../modals/ManualStudyModal";
import { EditalInfoModal } from "../modals/EditalInfoModal";
import { AiAssistantModal } from "../ai/AiAssistantModal";
import { AddContentModal } from "../modals/AddContentModal";

export const EditalView: React.FC = () => {
  const {
    activeEdital,
    activeEditalId,
    setActiveEditalId,
    editais,
    toggleTopicStudied,
  } = useStudy();

  // Accordion state - set of expanded discipline IDs
  const [expandedDisciplineIds, setExpandedDisciplineIds] = useState<Set<string>>(() => {
    const all = new Set<string>();
    activeEdital?.disciplines.forEach((d) => all.add(d.id));
    return all;
  });

  // Modal states
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [manualStudyTopic, setManualStudyTopic] = useState<{ discId: string; topicId: string } | null>(null);
  const [isEditalInfoOpen, setIsEditalInfoOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);

  // Search filter (optional helper)
  const [searchTerm, setSearchTerm] = useState("");

  const disciplines = activeEdital?.disciplines || [];
  const topics = activeEdital?.topics || [];

  // Toggle discipline accordion
  const toggleDiscipline = (discId: string) => {
    setExpandedDisciplineIds((prev) => {
      const next = new Set(prev);
      if (next.has(discId)) next.delete(discId);
      else next.add(discId);
      return next;
    });
  };

  // Global Progress metrics
  const totalTopicsCount = topics.length;
  const completedTopicsCount = topics.filter((t) => t.isStudied).length;
  const globalProgressPercentage = totalTopicsCount > 0
    ? Math.round((completedTopicsCount / totalTopicsCount) * 100)
    : 0;

  // Calculate stats for each discipline
  const disciplineStats = useMemo(() => {
    const map = new Map<
      string,
      {
        totalTopics: number;
        completedTopics: number;
        correct: number;
        errors: number;
        totalQuestions: number;
        accuracy: number;
        progress: number;
      }
    >();

    disciplines.forEach((d) => {
      const dTopics = topics.filter((t) => t.disciplineId === d.id);
      let correct = 0;
      let totalQuestions = 0;
      let completedTopics = 0;

      dTopics.forEach((t) => {
        if (t.isStudied) completedTopics++;
        const qDone = Number(t.questionsDone) || 0;
        const qCorr = Number(t.questionsCorrect) || 0;
        totalQuestions += qDone;
        correct += qCorr;
      });

      const errors = Math.max(0, totalQuestions - correct);
      const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
      const progress = dTopics.length > 0 ? Math.round((completedTopics / dTopics.length) * 100) : 0;

      map.set(d.id, {
        totalTopics: dTopics.length,
        completedTopics,
        correct,
        errors,
        totalQuestions,
        accuracy,
        progress,
      });
    });

    return map;
  }, [disciplines, topics]);

  // Format date helper (e.g. "24/12/23")
  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "—";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    } catch {
      return "—";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      {/* Top Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
            Edital Verticalizado
          </h1>
        </div>

        {/* Action buttons on top right */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setManualStudyTopic({ discId: disciplines[0]?.id || "", topicId: "" })}
            className="flex items-center gap-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Estudo</span>
          </button>

          {/* Plano selector dropdown */}
          {editais.length > 0 && (
            <div className="relative">
              <select
                value={activeEditalId || ""}
                onChange={(e) => setActiveEditalId(e.target.value)}
                className="appearance-none rounded-xl border border-amber-500/40 bg-white dark:bg-[#0F172A] pl-8 pr-8 py-2.5 text-xs font-bold text-[#F59E0B] hover:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B] cursor-pointer shadow-2xs"
              >
                {editais.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.title}
                  </option>
                ))}
              </select>
              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#F59E0B] pointer-events-none" />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#F59E0B] pointer-events-none" />
            </div>
          )}

          <button
            onClick={() => setIsEditalInfoOpen(true)}
            className="rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-[#6B7280] hover:bg-[#F3F4F6] dark:border-[#1E293B] dark:bg-[#252B38] dark:text-[#9CA3AF] dark:hover:bg-[#1E293B]"
            title="Configurações do Edital"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* LISTA DE DISCIPLINAS (ACORDEÃO) */}
      <div className="space-y-3">
        {disciplines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center dark:border-[#1E293B] dark:bg-[#252B38]">
            <p className="text-sm font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
              Nenhuma disciplina cadastrada neste edital.
            </p>
            <button
              onClick={() => setIsAddContentOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              Adicionar Matéria / Tópicos
            </button>
          </div>
        ) : (
          disciplines.map((discipline) => {
            const stats = disciplineStats.get(discipline.id) || {
              totalTopics: 0,
              completedTopics: 0,
              correct: 0,
              errors: 0,
              totalQuestions: 0,
              accuracy: 0,
              progress: 0,
            };

            const isExpanded = expandedDisciplineIds.has(discipline.id);
            const discTopics = topics.filter((t) => t.disciplineId === discipline.id);
            const isDisciplineFullyCompleted = stats.totalTopics > 0 && stats.completedTopics === stats.totalTopics;

            return (
              <div
                key={discipline.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-2xs dark:bg-[#252B38] transition ${
                  isDisciplineFullyCompleted
                    ? "border-emerald-300/80 dark:border-emerald-900/60"
                    : "border-[#E2E8F0] dark:border-[#1E293B]"
                }`}
              >
                {/* HEADER DA DISCIPLINA (BARRA CLICÁVEL) */}
                <div
                  onClick={() => toggleDiscipline(discipline.id)}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 sm:px-6 sm:py-4.5 cursor-pointer select-none hover:bg-slate-50/70 dark:hover:bg-[#1c2429] transition"
                >
                  {/* Left: Indicador visual (pill) com a cor + Nome + Selo 100% se zerada */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-6 w-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: discipline.color || "#3B82F6" }}
                    />
                    <h3 className="text-base font-bold text-[#1F2937] dark:text-white truncate">
                      {discipline.name}
                    </h3>

                    {/* Selo Gamificado de Disciplina Zerada */}
                    {isDisciplineFullyCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300 shadow-2xs">
                        🏆 Matéria Zerada!
                      </span>
                    )}
                  </div>

                  {/* Right: 4 Bolhas de métricas + Mini barra + Lápis + Chevron */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    {/* 4 Bolhas de Métricas Alinhadas: [Acertos] [Erros] [Total] [Desempenho] */}
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/50 px-3 py-1 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      {/* Acertos (Verde) */}
                      <span className="min-w-[28px] text-center text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {stats.correct}
                      </span>
                      <span className="text-[10px] text-emerald-300 dark:text-emerald-700">|</span>

                      {/* Erros (Vermelho) */}
                      <span className="min-w-[28px] text-center text-xs font-black text-red-500 dark:text-red-400">
                        {stats.errors}
                      </span>
                      <span className="text-[10px] text-emerald-300 dark:text-emerald-700">|</span>

                      {/* Total Questões (Neutro) */}
                      <span className="min-w-[28px] text-center text-xs font-black text-[#6B7280] dark:text-[#9CA3AF]">
                        {stats.totalQuestions}
                      </span>
                      <span className="text-[10px] text-emerald-300 dark:text-emerald-700">|</span>

                      {/* Desempenho % (Neutro) */}
                      <span className="min-w-[28px] text-center text-xs font-black text-[#1F2937] dark:text-white">
                        {stats.accuracy}%
                      </span>
                    </div>

                    {/* Mini barra de progresso individual da matéria com % */}
                    <div className="flex items-center gap-2.5 min-w-[130px]">
                      <div className="h-2 w-20 sm:w-24 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1E293B]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${stats.progress}%`,
                            backgroundColor: discipline.color || "#F59E0B",
                          }}
                        />
                      </div>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-black text-white"
                        style={{
                          backgroundColor:
                            stats.progress > 0
                              ? discipline.color || "#F59E0B"
                              : "#9CA3AF",
                        }}
                      >
                        {stats.progress}%
                      </span>
                    </div>

                    {/* Ícone de Edição da Matéria */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDiscipline(discipline);
                      }}
                      className="p-1.5 text-[#9CA3AF] hover:text-[#1F2937] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Editar Disciplina"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Chevron Expandir / Recolher */}
                    <div className="text-[#9CA3AF]">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* TABELA DE TÓPICOS QUANDO EXPANDIDO */}
                {isExpanded && (
                  <div className="border-t border-[#E2E8F0] dark:border-[#1E293B]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] bg-slate-50/70 text-[#6B7280] dark:border-[#1E293B] dark:bg-[#1E293B]/60 dark:text-[#9CA3AF]">
                            <th className="py-2.5 px-4 font-bold w-12 text-center">Status</th>
                            <th className="py-2.5 px-4 font-bold min-w-[280px]">Tópico do Edital</th>
                            <th className="py-2.5 px-4 font-bold text-center w-24">Questões</th>
                            <th className="py-2.5 px-4 font-bold text-center w-24">Acertos</th>
                            <th className="py-2.5 px-4 font-bold text-center w-28">Desempenho</th>
                            <th className="py-2.5 px-4 font-bold text-center w-24">Revisões</th>
                            <th className="py-2.5 px-4 font-bold text-center w-28">Último Estudo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                          {discTopics.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-[#6B7280] dark:text-[#9CA3AF]">
                                Nenhum tópico cadastrado nesta disciplina.
                              </td>
                            </tr>
                          ) : (
                            discTopics.map((topic) => {
                              const qDone = Number(topic.questionsDone) || 0;
                              const qCorr = Number(topic.questionsCorrect) || 0;
                              const accuracy = qDone > 0 ? Math.round((qCorr / qDone) * 100) : 0;

                              return (
                                <tr
                                  key={topic.id}
                                  className="hover:bg-slate-50/50 dark:hover:bg-[#1E293B]/30 transition select-none"
                                >
                                  {/* Checkbox de Estudado */}
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleTopicStudied(topic.id)}
                                      className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                                        topic.isStudied
                                          ? "bg-[#F59E0B] border-[#F59E0B] text-white shadow-2xs"
                                          : "border-[#CBD5E1] bg-white hover:border-[#F59E0B] dark:border-[#334155] dark:bg-[#0F172A]"
                                      }`}
                                      title={topic.isStudied ? "Marcar como pendente" : "Marcar como estudado (+150 XP)"}
                                    >
                                      {topic.isStudied && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                    </button>
                                  </td>

                                  {/* Nome do Tópico com Ação para Estudar */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`font-semibold transition ${
                                          topic.isStudied
                                            ? "text-[#1F2937] dark:text-white"
                                            : "text-[#4B5563] dark:text-[#9CA3AF]"
                                        }`}
                                      >
                                        {topic.name}
                                      </span>

                                      <button
                                        onClick={() => setManualStudyTopic({ discId: discipline.id, topicId: topic.id })}
                                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 p-1 text-[#F59E0B] hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition"
                                        title="Registrar sessão de estudo neste tópico"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>

                                  {/* Total Questões */}
                                  <td className="py-3 px-4 text-center font-semibold text-[#1F2937] dark:text-white">
                                    {qDone}
                                  </td>

                                  {/* Acertos */}
                                  <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                                    {qCorr}
                                  </td>

                                  {/* Taxa de Acerto com Badge */}
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                        qDone === 0
                                          ? "bg-slate-100 text-slate-500 dark:bg-[#1E293B] dark:text-slate-400"
                                          : accuracy >= 80
                                          ? "bg-emerald-500 text-white font-bold"
                                          : accuracy >= 60
                                          ? "bg-amber-500 text-white font-bold"
                                          : "bg-red-500 text-white font-bold"
                                      }`}
                                    >
                                      {qDone > 0 ? `${accuracy}%` : "—"}
                                    </span>
                                  </td>

                                  {/* Revisões Feitas */}
                                  <td className="py-3 px-4 text-center text-[#6B7280] dark:text-[#9CA3AF] font-medium">
                                    {topic.reviewCount || 0}
                                  </td>

                                  {/* Data do Último Estudo */}
                                  <td className="py-3 px-4 text-center text-[#6B7280] dark:text-[#9CA3AF] font-medium">
                                    {formatDate(topic.lastStudiedAt)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modais Integrados */}
      {editingDiscipline && (
        <EditDisciplineModal
          discipline={editingDiscipline}
          isOpen={Boolean(editingDiscipline)}
          onClose={() => setEditingDiscipline(null)}
        />
      )}

      {manualStudyTopic && (
        <ManualStudyModal
          isOpen={Boolean(manualStudyTopic)}
          onClose={() => setManualStudyTopic(null)}
          preselectedDisciplineId={manualStudyTopic.discId}
          preselectedTopicId={manualStudyTopic.topicId}
        />
      )}

      {isEditalInfoOpen && (
        <EditalInfoModal
          isOpen={isEditalInfoOpen}
          onClose={() => setIsEditalInfoOpen(false)}
        />
      )}

      {isAiAssistantOpen && (
        <AiAssistantModal
          isOpen={isAiAssistantOpen}
          onClose={() => setIsAiAssistantOpen(false)}
        />
      )}

      {isAddContentOpen && (
        <AddContentModal
          isOpen={isAddContentOpen}
          onClose={() => setIsAddContentOpen(false)}
        />
      )}
    </div>
  );
};
