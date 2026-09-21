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
      className="nx-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#232A3A]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2A3040] bg-[#0C0E14] text-[#8FA0B8]">
            <Layers className="h-4 w-4" />
          </div>
          <h2 className="font-condensed text-[19px] font-bold text-[#F5F4EF]">
            Desempenho por disciplina
          </h2>
        </div>

        <button
          type="button"
          id="btn-ver-detalhes-disciplinas"
          onClick={onNavigateToDisciplines}
          className="text-[13px] font-semibold text-[#F3AA2D] hover:text-[#D98F20] hover:underline flex items-center gap-1 cursor-pointer transition-colors duration-200"
        >
          <span>Ver todas</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 overflow-x-auto">
        {disciplines.length === 0 ? (
          <p className="text-[14px] text-[#8FA0B8] py-8 text-center">
            Nenhuma disciplina cadastrada no edital ativo.
          </p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#232A3A] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B8]">
                <th className="pb-3 pr-4 font-semibold">Disciplina</th>
                <th className="pb-3 px-4 font-semibold text-center">Questões</th>
                <th className="pb-3 px-4 font-semibold text-center">Precisão</th>
                <th className="pb-3 px-4 font-semibold text-center">Tempo</th>
                <th className="pb-3 px-4 font-semibold">Progresso</th>
                <th className="pb-3 pl-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232A3A]">
              {disciplines.map((d) => (
                <tr
                  key={d.id}
                  id={`discipline-row-${d.id}`}
                  className="transition-colors duration-200 hover:bg-[#232A3A]/40"
                >
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color || "#F3AA2D" }}
                      />
                      <span className="font-semibold text-[#F5F4EF]">
                        {d.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center text-[12px] text-[#8FA0B8]">
                    {d.qDone > 0 ? (
                      <span className="nx-deep inline-flex items-center rounded-md px-2 py-0.5">
                        <strong className="num-condensed text-[13px] font-bold text-[#F5F4EF] mr-1">{d.qDone}</strong>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center text-[12px]">
                    {d.accuracy !== null ? (
                      <span
                        className={
                          d.accuracy >= 70
                            ? "inline-flex items-center rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 font-semibold text-[#34D399]"
                            : d.accuracy >= 50
                            ? "inline-flex items-center rounded-md border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 px-2 py-0.5 font-semibold text-[#F3AA2D]"
                            : "inline-flex items-center rounded-md border border-[#D84A4A]/25 bg-[#D84A4A]/10 px-2 py-0.5 font-semibold text-[#D84A4A]"
                        }
                      >
                        {d.accuracy}%
                      </span>
                    ) : (
                      <span className="text-[#8FA0B8]">—</span>
                    )}
                  </td>

                  <td className="num-condensed py-3.5 px-4 text-center text-[13px] text-[#F5F4EF] font-bold">
                    {d.timeFormatted}
                  </td>

                  <td className="py-3.5 px-4 min-w-[150px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-[#8FA0B8] font-medium">
                        <span>
                          {d.studiedTopicsCount}/{d.topicsCount} tópicos
                        </span>
                        <span className="num-condensed text-[#F5F4EF] font-bold">{d.topicsProgressPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full border border-[#222836] bg-[#0C0E14]">
                        <div
                          className="h-full rounded-full bg-[#F3AA2D] transition-all duration-500"
                          style={{
                            width: `${d.topicsProgressPercent}%`,
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
                      className="nx-deep nx-deep-hover inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[#F5F4EF] hover:border-[#F3AA2D]/50 hover:text-[#F3AA2D] cursor-pointer"
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
