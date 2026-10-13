import React, { useMemo } from "react";
import { RotateCcw, ArrowUpRight, Play, CalendarDays } from "lucide-react";
import { ScheduledReview } from "../../types";
import { getIntervalLabel } from "../revisoes/reviewHelpers";

interface ReviewsSectionProps {
  pendingReviews: ScheduledReview[]; // already filtered by edital, excludes ignored, sorted by dueDate
  onOpenReview: (review: ScheduledReview) => void;
  onNavigateToReviews: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  pendingReviews,
  onOpenReview,
  onNavigateToReviews,
}) => {
  const todayStr = useMemo(
    () =>
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
        new Date().getDate()
      ).padStart(2, "0")}`,
    []
  );

  const priorityReview = pendingReviews[0] || null;
  const others = pendingReviews.slice(1, 3);
  const otherCount = pendingReviews.length - 1;

  const statusOf = (rev: ScheduledReview) => {
    if (rev.dueDate < todayStr) {
      return { label: "Atrasada", classes: "bg-red-500/15 text-red-400 border-red-500/30" };
    }
    if (rev.dueDate === todayStr) {
      return { label: "Hoje", classes: "bg-[#F3AA2D]/15 text-[#F3AA2D] border-[#F3AA2D]/30" };
    }
    return { label: "Agendada", classes: "bg-slate-500/15 text-slate-300 border-slate-500/30" };
  };

  return (
    <section
      id="section-revisoes"
      className="nx-card p-5 sm:p-6 flex flex-col"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#384154]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-white">
            <RotateCcw className="h-4 w-4" />
          </div>
          <h2 className="font-condensed text-[19px] font-bold text-white">
            REVISÕES
          </h2>
          {pendingReviews.length > 0 && (
            <span className="rounded-full border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 px-2 py-0.5 text-[11px] font-bold text-[#F3AA2D]">
              {pendingReviews.length} {pendingReviews.length === 1 ? "pendente" : "pendentes"}
            </span>
          )}
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

      <div className="mt-4 flex-1 flex flex-col">
        {pendingReviews.length === 0 ? (
          /* Compact empty state */
          <div className="nx-deep border-dashed p-5 text-center flex-1 flex flex-col items-center justify-center">
            <p className="text-[14px] font-semibold text-white">
              Nenhuma revisão pendente
            </p>
            <p className="mt-1 text-[12px] text-white/50">
              Tudo em dia — abra o módulo para agendar ou revisar.
            </p>
            <button
              type="button"
              onClick={onNavigateToReviews}
              className="mt-3 rounded-lg border border-[#F3AA2D]/30 bg-[#F3AA2D]/10 px-3 py-1.5 text-[11px] font-bold text-[#F3AA2D] hover:bg-[#F3AA2D]/20 transition"
            >
              Abrir Revisões
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Priority review (most overdue → today → next upcoming) */}
            {priorityReview && (
              <div className="nx-deep nx-deep-hover flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0 pr-2">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="rounded-md border border-[#384154] bg-[#171B25] px-2 py-0.5 text-[10px] font-semibold text-white/80">
                      {getIntervalLabel(priorityReview.stage)}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusOf(priorityReview).classes}`}
                    >
                      {statusOf(priorityReview).label}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-white truncate">
                    {priorityReview.topicName}
                  </p>
                  <p className="text-[12px] text-white/60 truncate mt-0.5">
                    {priorityReview.disciplineName}
                    <span className="mx-1.5">&bull;</span>
                    Etapa {priorityReview.stage}
                    <span className="mx-1.5">&bull;</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {priorityReview.dueDate.split("-").reverse().join("/")}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  id={`btn-revisar-${priorityReview.id}`}
                  onClick={() => onOpenReview(priorityReview)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 px-3 py-2 text-[12px] font-bold text-[#F3AA2D] hover:bg-[#F3AA2D]/20 shrink-0 transition"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Revisar
                </button>
              </div>
            )}

            {/* Compact list of the next pending ones */}
            {others.map((rev) => {
              const status = statusOf(rev);
              return (
                <div
                  key={rev.id}
                  onClick={() => onOpenReview(rev)}
                  className="nx-deep nx-deep-hover flex items-center justify-between gap-3 p-3 cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-[12px] font-semibold text-white truncate group-hover:text-[#F3AA2D] transition-colors">
                      {rev.topicName}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">
                      {rev.disciplineName}
                      <span className="mx-1.5">&bull;</span>
                      {getIntervalLabel(rev.stage)}
                    </p>
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold shrink-0 ${status.classes}`}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}

            {otherCount > others.length && (
              <button
                type="button"
                onClick={onNavigateToReviews}
                className="w-full rounded-lg border border-dashed border-[#384154] px-3 py-2 text-[11px] font-semibold text-white/60 hover:text-[#F3AA2D] hover:border-[#F3AA2D]/40 transition"
              >
                + {otherCount - others.length} outras pendências — ver todas
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
