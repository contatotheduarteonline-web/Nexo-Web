import React from "react";
import { Target, ChevronLeft, ChevronRight } from "lucide-react";

export interface WeeklyDayData {
  label: string;
  minutes: number;
  questions: number;
  heightPercent: number;
  formatted: string;
  hasStudied: boolean;
}

export interface WeeklyChartData {
  weekRangeLabel: string;
  totalWeekHoursFormatted: string;
  totalWeekHoursNumber: string;
  totalWeekQuestions: number;
  days: WeeklyDayData[];
}

interface WeeklyGoalsSectionProps {
  weeklyChartData: WeeklyChartData;
  weeklyGoalHours: number;
  weeklyGoalQuestions: number;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export const WeeklyGoalsSection: React.FC<WeeklyGoalsSectionProps> = ({
  weeklyChartData,
  weeklyGoalHours,
  weeklyGoalQuestions,
  weekOffset,
  onPrevWeek,
  onNextWeek,
}) => {
  const hoursNum = parseFloat(weeklyChartData.totalWeekHoursNumber) || 0;
  const timeProgressPercent = Math.min(100, Math.round((hoursNum / Math.max(1, weeklyGoalHours)) * 100));
  const questionsProgressPercent = Math.min(
    100,
    Math.round((weeklyChartData.totalWeekQuestions / Math.max(1, weeklyGoalQuestions)) * 100)
  );

  return (
    <section
      id="section-meta-semana"
      className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E2638] dark:bg-[#121622]"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#F0F2F5] dark:border-[#1C2333]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400">
            <Target className="h-4 w-4" />
          </div>
          <h2 className="text-[16px] sm:text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight">
            Meta da semana
          </h2>
        </div>

        <div className="flex items-center gap-1 text-[12px] text-[#667085] dark:text-[#94A3B8] bg-[#F8F9FB] dark:bg-[#181F2E] px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#1E2638]">
          <button
            type="button"
            id="btn-semana-anterior"
            onClick={onPrevWeek}
            className="rounded p-0.5 hover:bg-white dark:hover:bg-[#131824] cursor-pointer transition"
            title="Semana anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="font-medium text-[#172033] dark:text-white font-mono px-1.5">
            {weeklyChartData.weekRangeLabel}
          </span>
          <button
            type="button"
            id="btn-proxima-semana"
            onClick={onNextWeek}
            disabled={weekOffset >= 0}
            className="rounded p-0.5 hover:bg-white dark:hover:bg-[#131824] disabled:opacity-30 cursor-pointer transition"
            title="Próxima semana"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Metas: Barras de progresso numéricas */}
        <div className="lg:col-span-6 space-y-4">
          {/* Meta 1: Tempo de Estudo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#667085] dark:text-[#94A3B8] font-medium">Horas de estudo</span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="font-semibold text-[#172033] dark:text-white">
                  {weeklyChartData.totalWeekHoursFormatted} / {weeklyGoalHours}h
                </span>
                <span className="text-[11px] font-bold text-[#F97316]">
                  ({timeProgressPercent}%)
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#1E2638]">
              <div
                className="h-full bg-gradient-to-r from-[#F97316] to-[#EA580C] rounded-full transition-all duration-500"
                style={{ width: `${timeProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Meta 2: Questões Resolvidas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#667085] dark:text-[#94A3B8] font-medium">Questões resolvidas</span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="font-semibold text-[#172033] dark:text-white">
                  {weeklyChartData.totalWeekQuestions} / {weeklyGoalQuestions}
                </span>
                <span className="text-[11px] font-bold text-[#2563EB]">
                  ({questionsProgressPercent}%)
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#1E2536]">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                style={{ width: `${questionsProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Gráfico de Barras dos 7 Dias */}
        <div className="lg:col-span-6 rounded-xl bg-[#F8F9FB] dark:bg-[#181F2E]/40 p-4 border border-[#E5E7EB] dark:border-[#1E2638]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8] mb-2">
            Distribuição diária
          </div>
          <div className="flex items-end justify-between gap-2 h-20 px-1 pt-2">
            {weeklyChartData.days.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                <div
                  title={`${d.label}: ${d.formatted}`}
                  className={`w-full rounded-t-sm transition-all ${
                    d.hasStudied
                      ? "bg-gradient-to-t from-[#EA580C] to-[#F97316]"
                      : "bg-[#E5E7EB] dark:bg-[#1E2638]"
                  }`}
                  style={{ height: `${Math.max(10, d.heightPercent)}%` }}
                />
                <span
                  className={`text-[10px] font-semibold tracking-tight ${
                    d.hasStudied
                      ? "text-[#F97316] dark:text-orange-400"
                      : "text-[#667085] dark:text-[#94A3B8]"
                  }`}
                >
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
