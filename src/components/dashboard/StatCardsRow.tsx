import React from "react";
import { Clock, CheckSquare } from "lucide-react";

interface StatCardsRowProps {
  todayMinutes: number;
  todaySessionsCount: number;
  todayQuestionsDone: number;
  todayQuestionsCorrect: number;
  children?: React.ReactNode;
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({
  todayMinutes,
  todaySessionsCount,
  todayQuestionsDone,
  todayQuestionsCorrect,
  children,
}) => {
  const hours = Math.floor(todayMinutes / 60);
  const minutes = todayMinutes % 60;
  const timeFormatted = `${hours}h${minutes.toString().padStart(2, "0")}min`;

  const todayQuestionsWrong = Math.max(0, todayQuestionsDone - todayQuestionsCorrect);
  const todayPercentage =
    todayQuestionsDone > 0
      ? Math.round((todayQuestionsCorrect / todayQuestionsDone) * 100)
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* 1. Tempo de estudo */}
      <div
        id="card-tempo-estudo"
        className="nx-card nx-card-hover p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-white">
            TEMPO DE ESTUDO
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-[#F3AA2D]">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4">
          <span className="num-condensed block text-[32px] font-bold leading-none text-white">
            {timeFormatted}
          </span>
        </div>

        {todaySessionsCount > 0 && (
          <div className="mt-4 pt-3 border-t border-[#384154] flex items-center gap-1.5 text-[12px] text-white">
            <span className="h-2 w-2 rounded-full shrink-0 bg-[#F3AA2D]" />
            <span className="truncate">
              {todaySessionsCount} {todaySessionsCount === 1 ? "sessão hoje" : "sessões hoje"}
            </span>
          </div>
        )}
      </div>

      {/* 2. Desempenho */}
      <div
        id="card-desempenho"
        className="nx-card nx-card-hover p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-white">
            DESEMPENHO
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-[#F3AA2D]">
            <CheckSquare className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="num-condensed text-[16px] font-bold leading-none text-[#34D399]">
              {todayQuestionsCorrect}
            </span>
            <span className="text-[13px] font-medium text-[#34D399]">Acertos</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="num-condensed text-[16px] font-bold leading-none text-[#D84A4A]">
              {todayQuestionsWrong}
            </span>
            <span className="text-[13px] font-medium text-[#D84A4A]">Erro</span>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-end">
          <span className="num-condensed text-[36px] font-bold leading-none text-white">
            {todayPercentage !== null ? `${todayPercentage}%` : "0%"}
          </span>
        </div>
      </div>

      {/* 3. Progresso no edital */}
      {children}
    </div>
  );
};
