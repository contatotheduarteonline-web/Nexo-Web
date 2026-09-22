import React from "react";
import { RotateCcw, ArrowUpRight } from "lucide-react";
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
      className="nx-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#384154]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-white">
            <RotateCcw className="h-4 w-4" />
          </div>
          <h2 className="font-condensed text-[19px] font-bold text-white">
            Revisões
          </h2>
          {todayReviews.length > 0 ? (
            <span className="rounded-full border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 px-2 py-0.5 text-[11px] font-bold text-[#F3AA2D]">
              {todayReviews.length} {todayReviews.length === 1 ? "pendente" : "pendentes"}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          id="btn-abrir-modulo-revisoes"
          onClick={onNavigateToReviews}
          className="text-[13px] font-semibold text-[#F3AA2D] hover:text-[#D98F20] hover:underline flex items-center gap-1 cursor-pointer transition-colors duration-200"
        >
          <span>Ver todas</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4">
        {todayReviews.length === 0 ? (
          <div className="nx-deep border-dashed p-7 text-center">
            <p className="text-[14px] font-semibold text-white">
              Nenhuma revisão pendente
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
                  className="nx-deep nx-deep-hover flex items-center justify-between p-3.5 text-[13px] hover:border-[#F3AA2D]/40 cursor-pointer group"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-white truncate group-hover:text-[#F3AA2D] transition-colors duration-200">
                      {rev.topicName}
                    </p>
                    <p className="text-[12px] text-white truncate mt-0.5">
                      {rev.disciplineName} &bull; {rev.stage ? `Etapa ${rev.stage}` : "Revisão"}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-lg border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 px-2.5 py-1 text-[12px] font-semibold text-[#F3AA2D] shrink-0">
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
