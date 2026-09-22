import React from "react";
import { ArrowUpRight } from "lucide-react";

interface EditalProgressCardProps {
  title?: string;
  cargo?: string;
  percentage: number;
  completedTopicsCount: number;
  totalTopicsCount: number;
  onNavigateToEdital: () => void;
}

export const EditalProgressCard: React.FC<EditalProgressCardProps> = ({
  title,
  cargo,
  percentage,
  completedTopicsCount,
  totalTopicsCount,
  onNavigateToEdital,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const hasEdital = Boolean(title);

  return (
    <section id="section-progresso-edital" className="nx-card p-5 sm:p-7">
      <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
        {/* Identificação do edital */}
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white">
            Progresso no edital
          </span>

          <h2 className="font-condensed mt-1.5 text-[24px] sm:text-[28px] font-bold leading-tight text-white truncate">
            {hasEdital ? title : "Nenhum edital ativo"}
          </h2>

          {hasEdital && cargo && (
            <span className="mt-2 inline-flex items-center rounded-full border border-[#384154] bg-[#2D3442] px-2.5 py-0.5 text-[11px] font-semibold text-white">
              {cargo}
            </span>
          )}
        </div>

        {/* Percentual em destaque */}
        <div className="flex shrink-0 lg:justify-end">
          <span className="num-condensed block text-[56px] sm:text-[64px] font-bold leading-none text-[#F3AA2D]">
            {hasEdital ? `${clamped}%` : "—"}
          </span>
        </div>
      </div>

      {/* Barra de progresso + informação essencial */}
      <div className="mt-5">
        <div className="h-2.5 w-full overflow-hidden rounded-full border border-[#384154] bg-[#171B25]">
          <div
            className="h-full rounded-full bg-[#F3AA2D] transition-all duration-500"
            style={{ width: `${clamped}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-[12px]">
          <span className="num-condensed font-semibold text-white truncate">
            {hasEdital
              ? `${completedTopicsCount} de ${totalTopicsCount} tópicos`
              : "Selecione um edital"}
          </span>
          <button
            type="button"
            id="btn-ver-edital"
            onClick={onNavigateToEdital}
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#F3AA2D] hover:text-[#D98F20] cursor-pointer transition-colors duration-200"
          >
            <span>Ver edital</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
