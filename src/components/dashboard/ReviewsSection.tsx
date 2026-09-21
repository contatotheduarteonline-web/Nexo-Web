import React from "react";
import { RotateCcw, CheckCircle2, ArrowUpRight } from "lucide-react";
import { ScheduledReview } from "../../types";

interface ReviewsSectionProps {
  todayReviews: ScheduledReview[];
  onOpenReview: (review: ScheduledReview) => void;
  onNavigateToReviews: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  todayReviews,
  onOpenReview,
  onNavigateToReviews,
}) => {
  return (
    <section
      id="section-revisoes"
      className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E293B] dark:bg-[#121622]"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#F0F2F5] dark:border-[#1C2333]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-[#F59E0B] dark:bg-amber-950/40 dark:text-amber-400">
            <RotateCcw className="h-4 w-4" />
          </div>
          <h2 className="text-[16px] sm:text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight">
            Revisões
          </h2>
          {todayReviews.length > 0 ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-[#F59E0B] dark:bg-amber-950/40">
              {todayReviews.length} {todayReviews.length === 1 ? "pendente" : "pendentes"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#16A37A] dark:bg-emerald-950/40 dark:border-emerald-800/40">
              <CheckCircle2 className="h-3 w-3" />
              <span>Em dia</span>
            </span>
          )}
        </div>

        <button
          type="button"
          id="btn-abrir-modulo-revisoes"
          onClick={onNavigateToReviews}
          className="text-[13px] font-semibold text-[#F59E0B] hover:text-[#D97706] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Ver todas</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4">
        {todayReviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E7EB] p-7 text-center dark:border-[#1E293B] bg-[#F8F9FB] dark:bg-[#1E293B]/30">
            <p className="text-[14px] font-semibold text-[#172033] dark:text-white">
              Todas as revisões estão em dia
            </p>
            <p className="text-[12px] text-[#667085] dark:text-[#94A3B8] mt-1">
              Nenhuma pendência agendada para hoje.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {todayReviews.slice(0, 6).map((rev) => (
                <div
                  key={rev.id}
                  id={`review-item-${rev.id}`}
                  onClick={() => onOpenReview(rev)}
                  className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-3.5 text-[13px] transition hover:border-[#F59E0B]/40 hover:bg-white dark:border-[#1E293B] dark:bg-[#161D2B] cursor-pointer group"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-[#172033] dark:text-white truncate group-hover:text-[#F59E0B] transition-colors">
                      {rev.topicName}
                    </p>
                    <p className="text-[12px] text-[#667085] dark:text-[#94A3B8] truncate mt-0.5">
                      {rev.disciplineName} &bull; {rev.stage ? `Etapa ${rev.stage}` : "Revisão"}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-[#F59E0B] dark:bg-amber-950/40 shrink-0">
                    Revisar &rarr;
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
