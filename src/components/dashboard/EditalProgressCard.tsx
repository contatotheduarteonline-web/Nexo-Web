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
  percentage,
  completedTopicsCount,
  totalTopicsCount,
  onNavigateToEdital,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const hasEdital = Boolean(title);

  return (
    <div
      id="card-progresso-edital"
      className="nx-card nx-card-hover p-5 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white">
          PROGRESSO NO EDITAL
        </span>
      </div>

      <div className="mt-4">
        <span className="num-condensed block text-[32px] font-bold leading-none text-white">
          {hasEdital ? `${clamped}%` : "0%"}
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-[#263447]">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#111B2D]">
          <div
            className="h-full rounded-full bg-[#527DFF] transition-all duration-500"
            style={{ width: `${clamped}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3 text-[12px]">
          <span className="num-condensed font-semibold text-white truncate">
            {hasEdital
              ? `${completedTopicsCount} de ${totalTopicsCount} tópicos`
              : "Selecione um edital"}
          </span>
          <button
            type="button"
            id="btn-ver-edital"
            onClick={onNavigateToEdital}
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#F4B544] hover:text-[#D97706] cursor-pointer transition-colors duration-200"
          >
            <span>Ver edital</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
