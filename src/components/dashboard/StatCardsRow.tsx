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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tempo de estudo */}
      <div
        id="card-tempo-estudo"
        className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E2638] dark:bg-[#121622] flex flex-col justify-between transition-all duration-200 hover:border-[#D1D5DB] dark:hover:border-[#2A3447]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#667085] dark:text-[#94A3B8]">
            Tempo de estudo
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#F97316] dark:bg-orange-950/40 dark:text-orange-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <span className="text-[26px] font-bold text-[#172033] dark:text-white font-mono tracking-tight">
            {timeFormatted}
          </span>
        </div>

        <div className="mt-3.5 pt-3 border-t border-[#F0F2F5] dark:border-[#1C2333] flex items-center gap-1.5 text-[12px] text-[#667085] dark:text-[#94A3B8]">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              todaySessionsCount > 0 ? "bg-[#10B981]" : "bg-[#CBD5E1] dark:bg-[#334155]"
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
        className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E2638] dark:bg-[#121622] flex flex-col justify-between transition-all duration-200 hover:border-[#D1D5DB] dark:hover:border-[#2A3447]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#667085] dark:text-[#94A3B8]">
            Questões
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400">
            <CheckSquare className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[26px] font-bold text-[#172033] dark:text-white font-mono tracking-tight">
            {todayQuestionsDone}
          </span>
          <span className="text-[13px] font-medium text-[#667085] dark:text-[#94A3B8]">
            resolvidas
          </span>
        </div>

        <div className="mt-3.5 pt-3 border-t border-[#F0F2F5] dark:border-[#1C2333] flex items-center gap-1.5 text-[12px] text-[#667085] dark:text-[#94A3B8]">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              todayQuestionsCorrect > 0 ? "bg-[#10B981]" : "bg-[#CBD5E1] dark:bg-[#334155]"
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
        className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E2638] dark:bg-[#121622] flex flex-col justify-between transition-all duration-200 hover:border-[#D1D5DB] dark:hover:border-[#2A3447]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#667085] dark:text-[#94A3B8]">
            Precisão
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#10B981] dark:bg-emerald-950/40 dark:text-emerald-400">
            <Target className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <span className="text-[26px] font-bold text-[#172033] dark:text-white font-mono tracking-tight">
            {displayAccuracy}
          </span>
        </div>

        <div className="mt-3.5 pt-3 border-t border-[#F0F2F5] dark:border-[#1C2333] flex items-center gap-1.5 text-[12px] text-[#667085] dark:text-[#94A3B8]">
          <span className="h-2 w-2 rounded-full bg-[#10B981] shrink-0" />
          <span className="truncate">
            {todayQuestionsDone > 0 ? "Média de hoje" : "Média geral"}
          </span>
        </div>
      </div>

      {/* 4. Progresso no edital */}
      <div
        id="card-progresso-edital"
        className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E2638] dark:bg-[#121622] flex flex-col justify-between transition-all duration-200 hover:border-[#D1D5DB] dark:hover:border-[#2A3447]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#667085] dark:text-[#94A3B8]">
            Progresso no edital
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#F97316] dark:bg-orange-950/40 dark:text-orange-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[26px] font-bold text-[#EA580C] font-mono tracking-tight">
              {globalProgressPercentage}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#1E2638]">
            <div
              className="h-full bg-gradient-to-r from-[#F97316] to-[#EA580C] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, globalProgressPercentage))}%` }}
            />
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-[#F0F2F5] dark:border-[#1C2333] flex items-center justify-between text-[12px] text-[#667085] dark:text-[#94A3B8]">
          <span className="truncate">
            {completedTopicsCount} de {totalTopicsCount} tópicos
          </span>
          <button
            type="button"
            id="btn-link-edital"
            onClick={onNavigateToEdital}
            className="text-[#F97316] hover:underline font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Ver edital &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
