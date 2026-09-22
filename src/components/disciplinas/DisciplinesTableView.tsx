import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { Discipline } from "../../types";
import {
  BookOpen,
  Clock,
  TrendingUp,
  HelpCircle,
  Play,
  Settings2,
  ChevronRight,
  Plus,
  BarChart2,
  Filter,
} from "lucide-react";
import { EditDisciplineModal } from "../modals/EditDisciplineModal";

interface DisciplinesTableViewProps {
  onSelectDisciplineDetail?: (disciplineId: string) => void;
  onOpenNewTopicModal: (disciplineId?: string) => void;
}

export const DisciplinesTableView: React.FC<DisciplinesTableViewProps> = ({
  onSelectDisciplineDetail,
  onOpenNewTopicModal,
}) => {
  const {
    activeEdital,
    studySessions,
    launchStudySessionForTopic,
    setActiveTab,
  } = useStudy();

  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null);

  if (!activeEdital) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center dark:border-[#1E293B] dark:bg-[#252B38]">
        <BookOpen className="mx-auto h-8 w-8 text-white" />
        <h3 className="mt-3 text-sm font-bold text-white dark:text-white">
          Nenhum Edital Ativo
        </h3>
        <p className="mt-1 text-xs text-white dark:text-white">
          Selecione ou crie um edital para gerenciar disciplinas e assuntos.
        </p>
      </div>
    );
  }

  // Calculate table metrics per discipline
  const disciplinesStats = activeEdital.disciplines.map((disc) => {
    const topics = activeEdital.topics.filter((t) => t.disciplineId === disc.id);
    const studiedTopics = topics.filter((t) => t.isStudied).length;
    const coveragePct = topics.length > 0 ? Math.round((studiedTopics / topics.length) * 100) : 0;

    const sessions = studySessions.filter(
      (s) => s.disciplineId === disc.id || s.disciplineName === disc.name
    );
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    const questionsDone = sessions.reduce((acc, s) => acc + (s.questionsDone || 0), 0);
    const questionsCorrect = sessions.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0);
    const questionsWrong = Math.max(0, questionsDone - questionsCorrect);
    const accuracyRate = questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 100) : 0;

    const hoursFormatted = `${Math.floor(totalMinutes / 60)}h${(totalMinutes % 60).toString().padStart(2, "0")}m`;

    return {
      discipline: disc,
      topics,
      topicsCount: topics.length,
      studiedTopics,
      coveragePct,
      totalMinutes,
      hoursFormatted,
      questionsDone,
      questionsCorrect,
      questionsWrong,
      accuracyRate,
    };
  });

  const selectedStats = disciplinesStats.find((s) => s.discipline.id === selectedDisciplineId);

  return (
    <div className="space-y-4">
      {/* Disciplines Data Table */}
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-[#1E293B] dark:bg-[#252B38]">
        <div className="border-b border-[#E2E8F0] bg-[#F8FAFC]/60 px-4 py-3 dark:border-[#1E293B] dark:bg-[#0F172A]/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
            Quadro Comparativo de Desempenho
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]/30 text-[10px] font-bold uppercase tracking-wider text-[#737D89] dark:border-[#1E293B] dark:bg-[#0F172A]/20 dark:text-[#94A3B8]">
              <tr>
                <th className="px-4 py-2.5">Disciplina</th>
                <th className="px-3 py-2.5 text-center">Peso</th>
                <th className="px-3 py-2.5">Tempo</th>
                <th className="px-3 py-2.5 text-center text-[#58B989]">Acertos</th>
                <th className="px-3 py-2.5 text-center text-[#DB7979]">Erros</th>
                <th className="px-3 py-2.5 text-center">Questões</th>
                <th className="px-3 py-2.5 text-center">% Acertos</th>
                <th className="px-4 py-2.5">Progresso</th>
                <th className="px-4 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
              {disciplinesStats.map((row) => {
                const isSelected = selectedDisciplineId === row.discipline.id;
                return (
                  <tr
                    key={row.discipline.id}
                    onClick={() => setSelectedDisciplineId(isSelected ? null : row.discipline.id)}
                    className={`cursor-pointer transition hover:bg-amber-50/50 dark:hover:bg-[#1E293B] ${
                      isSelected ? "bg-amber-50/80 dark:bg-amber-500/15" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: row.discipline.color }}
                        />
                        <div>
                          <span className="font-semibold text-white dark:text-white">
                            {row.discipline.name}
                          </span>
                          <span className="block text-[10px] text-white">
                            {row.topicsCount} tópicos
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-[#1E293B] dark:text-white">
                        {row.discipline.weight}x
                      </span>
                    </td>

                    <td className="px-3 py-3 font-mono font-medium text-white dark:text-white">
                      {row.hoursFormatted}
                    </td>

                    <td className="px-3 py-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.questionsCorrect}
                    </td>

                    <td className="px-3 py-3 text-center font-semibold text-rose-500">
                      {row.questionsWrong}
                    </td>

                    <td className="px-3 py-3 text-center font-medium text-white dark:text-white">
                      {row.questionsDone}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                          row.accuracyRate >= 80
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : row.accuracyRate >= 65
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
                        }`}
                      >
                        {row.accuracyRate}%
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] text-white">
                          <span>{row.studiedTopics}/{row.topicsCount}</span>
                          <span className="font-semibold text-white dark:text-white">{row.coveragePct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${row.coveragePct}%`,
                              backgroundColor: row.discipline.color,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => launchStudySessionForTopic(row.discipline.id, undefined, "Teoria")}
                          title="Estudar agora"
                          className="flex items-center gap-1 rounded-md bg-[#F59E0B] hover:bg-[#D97706] p-1.5 text-white shadow-xs"
                        >
                          <Play className="h-3 w-3 fill-white" />
                        </button>
                        <button
                          onClick={() => setEditingDiscipline(row.discipline)}
                          title="Editar disciplina"
                          className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-black dark:border-slate-800 dark:bg-[#252B38] dark:text-slate-400 dark:hover:text-white"
                        >
                          <Settings2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Accordion / Panel of the Selected Discipline */}
      {selectedStats && (
        <div className="rounded-xl border border-amber-500/40 bg-white p-4 shadow-xs dark:border-amber-500/40 dark:bg-[#252B38]">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center dark:border-[#1E293B]">
            <div className="flex items-center gap-2.5">
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: selectedStats.discipline.color }}
              />
              <h3 className="text-sm font-bold text-white dark:text-white">
                {selectedStats.discipline.name} — Tópicos e Assuntos
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenNewTopicModal(selectedStats.discipline.id)}
                className="flex items-center gap-1 rounded-lg bg-[#F59E0B] px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#D97706]"
              >
                <Plus className="h-3 w-3" /> Novo Assunto
              </button>
            </div>
          </div>

          {/* Topics Breakdown List */}
          <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
            {selectedStats.topics.map((t, idx) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-xs transition dark:bg-[#0F172A]"
              >
                <div className="flex items-center gap-2.5 truncate max-w-[280px] sm:max-w-[400px]">
                  <span className="font-bold text-white">{idx + 1}.</span>
                  <span className="font-medium text-white dark:text-white truncate">
                    {t.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white">
                    {t.questionsCorrect}/{t.questionsDone} q ({t.accuracyRate}%)
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      t.isStudied
                        ? "bg-amber-50 text-[#F59E0B] border border-amber-500/30 dark:bg-amber-500/15 dark:text-[#FBBF24]"
                        : "bg-slate-200 text-white dark:bg-slate-800 dark:text-white"
                    }`}
                  >
                    {t.isStudied ? "✓ Estudado" : "○ Pendente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
};
