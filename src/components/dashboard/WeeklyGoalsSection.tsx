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
      className="nx-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#384154]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-[#A5B0C2]">
            <Target className="h-4 w-4" />
          </div>
          <h2 className="font-condensed text-[19px] font-bold text-[#F5F4EF]">
            Meta da semana
          </h2>
        </div>

        <div className="nx-deep flex items-center gap-1 text-[12px] text-[#A5B0C2] px-2.5 py-1 rounded-lg">
          <button
            type="button"
            id="btn-semana-anterior"
            onClick={onPrevWeek}
            className="rounded p-0.5 hover:bg-[#2D3442] hover:text-[#F5F4EF] cursor-pointer transition-colors duration-200"
            title="Semana anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="num-condensed font-bold text-[#F5F4EF] px-1.5">
            {weeklyChartData.weekRangeLabel}
          </span>
          <button
            type="button"
            id="btn-proxima-semana"
            onClick={onNextWeek}
            disabled={weekOffset >= 0}
            className="rounded p-0.5 hover:bg-[#2D3442] hover:text-[#F5F4EF] disabled:opacity-30 cursor-pointer transition-colors duration-200"
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
              <span className="text-[#A5B0C2] font-medium">Horas de estudo</span>
              <div className="flex items-baseline gap-1.5">
                <span className="num-condensed text-[15px] font-bold text-[#F5F4EF]">
                  {weeklyChartData.totalWeekHoursFormatted} / {weeklyGoalHours}h
                </span>
                <span className="num-condensed text-[12px] font-bold text-[#F3AA2D]">
                  ({timeProgressPercent}%)
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full border border-[#384154] bg-[#171B25]">
              <div
                className="h-full rounded-full bg-[#F3AA2D] transition-all duration-500"
                style={{ width: `${timeProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Meta 2: Questões Resolvidas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#A5B0C2] font-medium">Questões resolvidas</span>
              <div className="flex items-baseline gap-1.5">
                <span className="num-condensed text-[15px] font-bold text-[#F5F4EF]">
                  {weeklyChartData.totalWeekQuestions} / {weeklyGoalQuestions}
                </span>
                <span className="num-condensed text-[12px] font-bold text-[#A5B0C2]">
                  ({questionsProgressPercent}%)
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full border border-[#384154] bg-[#171B25]">
              <div
                className="h-full rounded-full bg-[#7C8BA5] transition-all duration-500"
                style={{ width: `${questionsProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Gráfico de Barras dos 7 Dias */}
        <div className="nx-deep lg:col-span-6 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A5B0C2] mb-2">
            Distribuição diária
          </div>
          <div className="flex items-end justify-between gap-2 h-20 px-1 pt-2">
            {weeklyChartData.days.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                <div
                  title={`${d.label}: ${d.formatted}`}
                  className={`w-full rounded-t-sm transition-all ${
                    d.hasStudied
                      ? "bg-[#F3AA2D]"
                      : "bg-[#384154]"
                  }`}
                  style={{ height: `${Math.max(10, d.heightPercent)}%` }}
                />
                <span
                  className={`text-[10px] font-semibold tracking-tight ${
                    d.hasStudied
                      ? "text-[#F3AA2D]"
                      : "text-[#A5B0C2]"
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
