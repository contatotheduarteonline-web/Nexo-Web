import React from "react";
import { Clock, CheckSquare, Target, TrendingUp } from "lucide-react";

interface StatCardsRowProps {
  todayMinutes: number;
  todaySessionsCount: number;
  todayQuestionsDone: number;
  todayQuestionsCorrect: number;
  accuracyRate: number | null;
  overallAccuracyRate?: number;
  globalProgressPercentage: number;
  completedTopicsCount: number;
  totalTopicsCount: number;
  onNavigateToEdital: () => void;
  currentStreakDays?: number;
  recordStreakDays?: number;
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({
  todayMinutes,
  todaySessionsCount,
  todayQuestionsDone,
  todayQuestionsCorrect,
  accuracyRate,
  overallAccuracyRate,
  globalProgressPercentage,
  completedTopicsCount,
  totalTopicsCount,
  onNavigateToEdital,
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
    <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Tempo de estudo */}
      <div
        id="card-tempo-estudo"
        className="nx-card nx-card-hover p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#8FA0B8]">
            Tempo de estudo
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F3AA2D]/20 bg-[#F3AA2D]/10 text-[#F3AA2D]">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4">
          <span className="num-condensed block text-[32px] font-bold leading-none text-[#F5F4EF]">
            {timeFormatted}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#232A3A] flex items-center gap-1.5 text-[12px] text-[#8FA0B8]">
          <span
            className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
              todaySessionsCount > 0 ? "bg-[#F3AA2D]" : "bg-[#33415A]"
            }`}
          />
          <span className="truncate">
            {todaySessionsCount > 0
              ? `${todaySessionsCount} ${
                  todaySessionsCount === 1 ? "sessão hoje" : "sessões hoje"
                }`
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
          <span className="text-[12px] font-semibold text-[#8FA0B8]">
            Questões
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F3AA2D]/20 bg-[#F3AA2D]/10 text-[#F3AA2D]">
            <CheckSquare className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="num-condensed block text-[32px] font-bold leading-none text-[#F5F4EF]">
            {todayQuestionsDone}
          </span>
          <span className="text-[13px] font-medium text-[#8FA0B8]">
            resolvidas
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#232A3A] flex items-center gap-1.5 text-[12px] text-[#8FA0B8]">
          <span
            className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
              todayQuestionsCorrect > 0 ? "bg-[#F3AA2D]" : "bg-[#33415A]"
            }`}
          />
          <span className="truncate">
            {todayQuestionsCorrect > 0
              ? `${todayQuestionsCorrect} ${
                  todayQuestionsCorrect === 1 ? "acerto hoje" : "acertos hoje"
                }`
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
          <span className="text-[12px] font-semibold text-[#8FA0B8]">
            Precisão
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F3AA2D]/20 bg-[#F3AA2D]/10 text-[#F3AA2D]">
            <Target className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4">
          <span className="num-condensed block text-[32px] font-bold leading-none text-[#F5F4EF]">
            {displayAccuracy}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#232A3A] flex items-center gap-1.5 text-[12px] text-[#8FA0B8]">
          <span className="h-2 w-2 rounded-full bg-[#33415A] shrink-0" />
          <span className="truncate">
            {todayQuestionsDone > 0 ? "Média de hoje" : "Média geral"}
          </span>
        </div>
      </div>

      {/* 4. Progresso no edital — indicador-chave em âmbar */}
      <div
        id="card-progresso-edital"
        className="nx-card nx-card-hover p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#8FA0B8]">
            Progresso no edital
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F3AA2D]/20 bg-[#F3AA2D]/10 text-[#F3AA2D]">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="num-condensed block text-[32px] font-bold leading-none text-[#F3AA2D]">
              {globalProgressPercentage}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-[#222836] bg-[#0C0E14]">
            <div
              className="h-full rounded-full bg-[#F3AA2D] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, globalProgressPercentage))}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#232A3A] flex items-center justify-between text-[12px] text-[#8FA0B8]">
          <span className="truncate">
            {completedTopicsCount} de {totalTopicsCount} tópicos
          </span>
          <button
            type="button"
            id="btn-link-edital"
            onClick={onNavigateToEdital}
            className="text-[#F3AA2D] hover:text-[#D98F20] hover:underline font-semibold shrink-0 cursor-pointer transition-colors duration-200"
          >
            Ver edital &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
