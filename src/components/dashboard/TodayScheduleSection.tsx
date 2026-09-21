import React from "react";
import { BookOpen, Clock, Play, Plus, ArrowUpRight } from "lucide-react";

export interface PlannedBlockItem {
  id: string;
  disciplineId: string;
  disciplineName: string;
  targetMinutes: number;
}

interface TodayScheduleSectionProps {
  plannedBlocks: PlannedBlockItem[];
  onStartStudy: (disciplineId: string, durationMinutes: number) => void;
  onNavigateToPlanning: () => void;
}

export const TodayScheduleSection: React.FC<TodayScheduleSectionProps> = ({
  plannedBlocks,
  onStartStudy,
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-[#A5B0C2]">
            <BookOpen className="h-4 w-4" />
          </div>
          <h2 className="font-condensed text-[19px] font-bold text-[#F5F4EF]">
            Planejamento de hoje
          </h2>
          {plannedBlocks.length > 0 && (
            <span className="rounded-full border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 px-2 py-0.5 text-[11px] font-bold text-[#F3AA2D]">
              {plannedBlocks.length} {plannedBlocks.length === 1 ? "bloco" : "blocos"}
            </span>
          )}
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
            <p className="text-[14px] font-semibold text-[#F5F4EF]">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {plannedBlocks.map((block, idx) => (
              <div
                key={block.id}
                id={`planned-block-${block.id}`}
                className="nx-deep nx-deep-hover group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:border-[#F3AA2D]/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded-md border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 px-2 py-0.5 text-[11px] font-semibold text-[#F3AA2D]">
                      {idx === 0 ? "Próximo" : `Bloco ${idx + 1}`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#A5B0C2]">
                      <Clock className="h-3 w-3 text-[#A5B0C2]" />
                      <span>{block.targetMinutes} min</span>
                    </span>
                  </div>

                  <h3 className="text-[15px] font-semibold text-[#F5F4EF] truncate">
                    {block.disciplineName}
                  </h3>
                </div>

                <button
                  type="button"
                  id={`btn-estudar-bloco-${block.id}`}
                  onClick={() => onStartStudy(block.disciplineId, block.targetMinutes)}
                  className="nx-btn-primary inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 text-[13px] cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-[#11151F]" />
                  <span>Estudar agora</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
