import React from "react";
import { Layers, Play, ArrowUpRight } from "lucide-react";

export interface UnifiedDisciplineStat {
  id: string;
  name: string;
  color: string;
  qDone: number;
  qCorrect: number;
  accuracy: number | null;
  timeFormatted: string;
  totalMinutes: number;
  studiedTopicsCount: number;
  topicsCount: number;
  topicsProgressPercent: number;
}

interface DisciplinePerformanceSectionProps {
  disciplines: UnifiedDisciplineStat[];
  onStartStudy: (disciplineId: string, durationMinutes: number) => void;
  onNavigateToDisciplines: () => void;
}

export const DisciplinePerformanceSection: React.FC<DisciplinePerformanceSectionProps> = ({
  disciplines,
  onStartStudy,
  onNavigateToDisciplines,
}) => {
  return (
    <section
      id="section-desempenho-disciplinas"
      className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E293B] dark:bg-[#121622]"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#F0F2F5] dark:border-[#1C2333]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-[#F59E0B] dark:bg-amber-950/40 dark:text-amber-400">
            <Layers className="h-4 w-4" />
          </div>
          <h2 className="text-[16px] sm:text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight">
            Desempenho por disciplina
          </h2>
        </div>

        <button
          type="button"
          id="btn-ver-detalhes-disciplinas"
          onClick={onNavigateToDisciplines}
          className="text-[13px] font-semibold text-[#F59E0B] hover:text-[#D97706] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Ver todas</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 overflow-x-auto">
        {disciplines.length === 0 ? (
          <p className="text-[14px] text-[#667085] dark:text-[#94A3B8] py-8 text-center">
            Nenhuma disciplina cadastrada no edital ativo.
          </p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:border-[#1C2333] dark:text-[#94A3B8]">
                <th className="pb-3 pr-4 font-semibold">Disciplina</th>
                <th className="pb-3 px-4 font-semibold text-center">Questões</th>
                <th className="pb-3 px-4 font-semibold text-center">Precisão</th>
                <th className="pb-3 px-4 font-semibold text-center">Tempo</th>
                <th className="pb-3 px-4 font-semibold">Progresso</th>
                <th className="pb-3 pl-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] dark:divide-[#1C2333]">
              {disciplines.map((d) => (
                <tr
                  key={d.id}
                  id={`discipline-row-${d.id}`}
                  className="transition-colors hover:bg-[#F8F9FB] dark:hover:bg-[#161D2B]/60"
                >
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: d.color || "#F59E0B" }}
                      />
                      <span className="font-semibold text-[#172033] dark:text-white">
                        {d.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-[12px] text-[#667085] dark:text-[#94A3B8]">
                    {d.qDone > 0 ? (
                      <span className="inline-flex items-center rounded-md bg-[#F8F9FB] border border-[#E5E7EB] px-2 py-0.5 dark:bg-[#1E293B] dark:border-[#1E293B]">
                        <strong className="text-[#172033] dark:text-white mr-1">{d.qDone}</strong>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-[12px]">
                    {d.accuracy !== null ? (
                      <span
                        className={
                          d.accuracy >= 70
                            ? "inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-[#16A37A] border border-emerald-200/60 dark:bg-emerald-950/40 dark:border-emerald-800/40"
                            : d.accuracy >= 50
                            ? "inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-[#F59E0B] border border-amber-200/60 dark:bg-amber-950/40 dark:border-amber-800/40"
                            : "inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 font-semibold text-[#DC4B4B] border border-red-200/60 dark:bg-red-950/40 dark:border-red-800/40"
                        }
                      >
                        {d.accuracy}%
                      </span>
                    ) : (
                      <span className="text-[#667085] dark:text-[#94A3B8]">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-[12px] text-[#172033] dark:text-white font-medium">
                    {d.timeFormatted}
                  </td>

                  <td className="py-3.5 px-4 min-w-[150px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-[#667085] dark:text-[#94A3B8] font-medium">
                        <span>
                          {d.studiedTopicsCount}/{d.topicsCount} tópicos
                        </span>
                        <span className="font-mono">{d.topicsProgressPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#1E293B]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${d.topicsProgressPercent}%`,
                            backgroundColor: d.color || "#F59E0B",
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 pl-4 text-right">
                    <button
                      type="button"
                      id={`btn-estudar-disciplina-${d.id}`}
                      onClick={() => onStartStudy(d.id, 45)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#172033] shadow-xs transition hover:border-[#F59E0B] hover:text-[#F59E0B] dark:border-[#1E293B] dark:bg-[#161D2B] dark:text-white dark:hover:border-[#F59E0B] cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Estudar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
