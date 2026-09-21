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
      className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E293B] dark:bg-[#121622]"
    >
      {/* Cabeçalho Limpo sem textos explicativos redundantes */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F0F2F5] dark:border-[#1C2333]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-[#F59E0B] dark:bg-amber-950/40 dark:text-amber-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <h2 className="text-[16px] sm:text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight">
            Planejamento de hoje
          </h2>
          {plannedBlocks.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-[#F59E0B] dark:bg-amber-950/40">
              {plannedBlocks.length} {plannedBlocks.length === 1 ? "bloco" : "blocos"}
            </span>
          )}
        </div>

        <button
          type="button"
          id="btn-gerenciar-planejamento"
          onClick={onNavigateToPlanning}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#F59E0B] hover:text-[#D97706] hover:underline cursor-pointer transition-colors"
        >
          <span>Gerenciar</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4">
        {plannedBlocks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E7EB] p-7 text-center dark:border-[#1E293B] bg-[#F8F9FB] dark:bg-[#1E293B]/30">
            <p className="text-[14px] font-semibold text-[#172033] dark:text-white">
              Nenhum bloco agendado para hoje
            </p>
            <button
              type="button"
              id="btn-configurar-planejamento"
              onClick={onNavigateToPlanning}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-[#F59E0B] px-4 py-2 text-[13px] font-semibold text-white shadow-xs transition hover:bg-[#D97706] cursor-pointer"
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
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4 transition-all duration-200 hover:border-[#F59E0B]/50 hover:bg-white hover:shadow-[0_2px_12px_rgba(249,115,22,0.06)] dark:border-[#1E293B] dark:bg-[#161D2B] dark:hover:border-[#F59E0B]/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-[#F59E0B] border border-[#E5E7EB] shadow-xs dark:bg-[#121622] dark:border-[#1E293B]">
                      {idx === 0 ? "Próximo" : `Bloco ${idx + 1}`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#667085] dark:text-[#94A3B8]">
                      <Clock className="h-3 w-3 text-[#667085] dark:text-[#94A3B8]" />
                      <span>{block.targetMinutes} min</span>
                    </span>
                  </div>

                  <h3 className="text-[15px] font-semibold text-[#172033] dark:text-white truncate">
                    {block.disciplineName}
                  </h3>
                </div>

                <button
                  type="button"
                  id={`btn-estudar-bloco-${block.id}`}
                  onClick={() => onStartStudy(block.disciplineId, block.targetMinutes)}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(249,115,22,0.2)] transition-all hover:shadow-[0_4px_12px_rgba(249,115,22,0.28)] active:scale-[0.98] cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
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
