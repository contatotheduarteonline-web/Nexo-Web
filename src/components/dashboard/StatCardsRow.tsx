import React from "react";
import { Clock, CheckSquare, Target } from "lucide-react";

interface StatCardsRowProps {
  todayMinutes: number;
  todaySessionsCount: number;
  todayQuestionsDone: number;
  todayQuestionsCorrect: number;
  accuracyRate: number | null;
  overallAccuracyRate?: number;
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({
  todayMinutes,
  todaySessionsCount,
  todayQuestionsDone,
  todayQuestionsCorrect,
  accuracyRate,
  overallAccuracyRate,
}) => {
  const hours = Math.floor(todayMinutes / 60);
  const minutes = todayMinutes % 60;
  const timeFormatted = `${hours}h${minutes.toString().padStart(2, "0")}min`;

  const displayAccuracy =
    accuracyRate !== null && todayQuestionsDone > 0
      ? `${accuracyRate}%`
      : overallAccuracyRate !== undefined && overallAccuracyRate > 0
      ? `${overallAccuracyRate}%`
      : "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* 1. Tempo de estudo */}
      <div
        id="card-tempo-estudo"
        className="nx-card nx-card-hover p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#A5B0C2]">
            Tempo de estudo
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-[#F3AA2D]">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4">
          <span className="num-condensed block text-[32px] font-bold leading-none text-[#F5F4EF]">
            {timeFormatted}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#384154] flex items-center gap-1.5 text-[12px] text-[#A5B0C2]">
          <span
            className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
              todaySessionsCount > 0 ? "bg-[#F3AA2D]" : "bg-[#4A556E]"
            }`}
          />
          <span className="truncate">
            {todaySessionsCount > 0
              ? `${todaySessionsCount} ${todaySessionsCount === 1 ? "sessão hoje" : "sessões hoje"}`
              : "Sem registros hoje"}
          </span>
        </div>
      </div>

      {/* 2. Questões */}
      <div
        id="card-questoes"
        className="nx-card nx-card-hover p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#A5B0C2]">
            Questões
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-[#F3AA2D]">
            <CheckSquare className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="num-condensed block text-[32px] font-bold leading-none text-[#F5F4EF]">
            {todayQuestionsDone}
          </span>
          <span className="text-[13px] font-medium text-[#A5B0C2]">
            resolvidas
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#384154] flex items-center gap-1.5 text-[12px] text-[#A5B0C2]">
          <span
            className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
              todayQuestionsCorrect > 0 ? "bg-[#F3AA2D]" : "bg-[#4A556E]"
            }`}
          />
          <span className="truncate">
            {todayQuestionsCorrect > 0
              ? `${todayQuestionsCorrect} ${todayQuestionsCorrect === 1 ? "acerto hoje" : "acertos hoje"}`
              : "0 acertos"}
          </span>
        </div>
      </div>

      {/* 3. Precisão */}
      <div
        id="card-precisao"
        className="nx-card nx-card-hover p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#A5B0C2]">
            Precisão
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-[#F3AA2D]">
            <Target className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4">
          <span className="num-condensed block text-[32px] font-bold leading-none text-[#F5F4EF]">
            {displayAccuracy}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#384154] flex items-center gap-1.5 text-[12px] text-[#A5B0C2]">
          <span className="h-2 w-2 rounded-full bg-[#4A556E] shrink-0" />
          <span className="truncate">
            {todayQuestionsDone > 0 ? "Média de hoje" : "Média geral"}
          </span>
        </div>
      </div>
    </div>
  );
};
