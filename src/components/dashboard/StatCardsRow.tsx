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

        <div className="mt-4 pt-3 border-t border-[#384154] flex items-center gap-1.5 text-[12px] text-white">
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

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="num-condensed block text-[32px] font-bold leading-none text-white">
            {todayQuestionsDone}
          </span>
          <span className="text-[13px] font-medium text-white">
            resolvidas
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#384154] flex items-center gap-1.5 text-[12px] text-white">
          <span
            className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
              todayQuestionsCorrect > 0 ? "bg-[#F3AA2D]" : "bg-[#4A556E]"
            }`}
          />
          <span className="truncate">
            {todayQuestionsCorrect} {todayQuestionsCorrect === 1 ? "acerto" : "acertos"}
            {" · "}
            {todayQuestionsWrong} {todayQuestionsWrong === 1 ? "erro" : "erros"}
            {" · "}
            {todayPercentage !== null ? `${todayPercentage}%` : "—"}
          </span>
        </div>
      </div>

      {/* 3. Progresso no edital */}
      {children}
    </div>
  );
};
