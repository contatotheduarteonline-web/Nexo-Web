import React from "react";
import { BookOpen, Clock, Play, Plus, ArrowUpRight } from "lucide-react";

export interface PlannedBlockItem {
  id: string;
  disciplineId: string;
  disciplineName: string;
  targetMinutes: number;
  color?: string;
  studiedMinutes?: number;
}

interface TodayScheduleSectionProps {
  plannedBlocks: PlannedBlockItem[];
  onStartStudy: (disciplineId: string, durationMinutes: number) => void;
  onOpenManualStudy: () => void;
  onNavigateToPlanning: () => void;
}

const formatMinutes = (m: number) =>
  m < 60 ? `${m}min` : `${Math.floor(m / 60)}h${(m % 60).toString().padStart(2, "0")}min`;

export const TodayScheduleSection: React.FC<TodayScheduleSectionProps> = ({
  plannedBlocks,
  onStartStudy,
  onOpenManualStudy,
  onNavigateToPlanning,
}) => {
  return (
    <section
      id="section-planejamento-hoje"
      className="nx-card p-5 sm:p-6"
    >
      {/* Cabeçalho Limpo sem textos explicativos redundantes */}
      <div className="flex items-center justify-between pb-4 border-b border-[#384154]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <h2 className="font-condensed text-[19px] font-bold text-white">
            PLANEJAMENTO
          </h2>
        </div>

        <button
          type="button"
          id="btn-gerenciar-planejamento"
          onClick={onNavigateToPlanning}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#F3AA2D] hover:text-[#D98F20] hover:underline cursor-pointer transition-colors duration-200"
        >
          <span>Gerenciar</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4">
        {plannedBlocks.length === 0 ? (
          <div className="nx-deep border-dashed p-7 text-center">
            <p className="text-[14px] font-semibold text-white">
              Nenhum bloco agendado para hoje
            </p>
            <button
              type="button"
              id="btn-configurar-planejamento"
              onClick={onNavigateToPlanning}
              className="nx-btn-primary mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 text-[13px] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Configurar planejamento</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plannedBlocks.map((block, idx) => {
              const studied = block.studiedMinutes || 0;
              const progress = Math.min(
                100,
                block.targetMinutes > 0 ? Math.round((studied / block.targetMinutes) * 100) : 0
              );
              const color = block.color || "#F3AA2D";

              return (
                <div
                  key={block.id}
                  id={`planned-block-${block.id}`}
                  className={`nx-deep relative overflow-hidden p-4 pl-5 ${
                    idx > 0 ? "nx-deep-hover cursor-pointer hover:border-[#F3AA2D]/40" : ""
                  }`}
                  onClick={idx > 0 ? () => onStartStudy(block.disciplineId, block.targetMinutes) : undefined}
                >
                  {/* Indicador vertical da disciplina */}
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: color }}
                  />

                  {/* Cabeçalho: disciplina + tempo */}
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[14px] font-semibold text-white truncate">
                      {block.disciplineName}
                    </h3>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-white">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="num-condensed font-bold">
                        {studied}min / {formatMinutes(block.targetMinutes)}
                      </span>
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#171B25]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: color }}
                    />
                  </div>

                  {/* Ações da primeira matéria (expandida) */}
                  {idx === 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        id={`btn-estudar-bloco-${block.id}`}
                        onClick={() => onStartStudy(block.disciplineId, block.targetMinutes)}
                        className="nx-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-[#11151F]" />
                        <span>Iniciar Estudo</span>
                      </button>
                      <button
                        type="button"
                        id="btn-estudo-manual-planejamento"
                        onClick={onOpenManualStudy}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#384154] bg-[#171B25] px-4 py-2 text-[13px] font-semibold text-white hover:border-[#F3AA2D]/40 hover:text-[#F3AA2D] cursor-pointer transition-colors duration-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Adicionar Estudo Manualmente</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
