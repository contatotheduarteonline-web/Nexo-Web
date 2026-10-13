import React, { useMemo } from "react";
import { ArrowUpRight, Play, Plus, X, MessageCircle } from "lucide-react";
import { ScheduledReview, StudySession } from "../../types";
import {
  getIntervalLabel,
  formatShortDate,
  formatDurationClock,
  getSessionLocalDate,
  groupReviewsByDate,
} from "../revisoes/reviewHelpers";

interface ReviewsSectionProps {
  pendingReviews: ScheduledReview[]; // already filtered by edital, excludes ignored, sorted by dueDate
  studySessions: StudySession[];
  onOpenReview: (review: ScheduledReview) => void; // Registrar estudo (modal compacto)
  onStartReview: (review: ScheduledReview) => void; // Iniciar no cronômetro
  onIgnoreReview: (review: ScheduledReview) => void; // Ignorar
  onNavigateToReviews: () => void;
}

const modalityBadgeClasses: Record<string, string> = {
  Teoria: "bg-violet-600 text-white",
  "Questões": "bg-teal-600 text-white",
  "Revisão": "bg-violet-600 text-white",
  "Videoaula": "bg-sky-600 text-white",
  "Lei Seca": "bg-slate-600 text-white",
  "Simulado": "bg-rose-600 text-white",
};

/** Card REVISÕES do dashboard — layout claro da referência. */
export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  pendingReviews,
  studySessions,
  onOpenReview,
  onStartReview,
  onIgnoreReview,
  onNavigateToReviews,
}) => {
  const todayStr = useMemo(
    () =>
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
        new Date().getDate()
      ).padStart(2, "0")}`,
    []
  );

  // Sessões reais por tópico, para o registro de estudo abaixo de cada revisão.
  const sessionsByTopic = useMemo(() => {
    const map = new Map<string, StudySession[]>();
    studySessions.forEach((s) => {
      if (!s.topicId) return;
      const arr = map.get(s.topicId);
      if (arr) arr.push(s);
      else map.set(s.topicId, [s]);
    });
    map.forEach((arr) => arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    return map;
  }, [studySessions]);

  const groups = useMemo(() => groupReviewsByDate(pendingReviews), [pendingReviews]);
  const visibleGroups = groups.slice(0, 3);
  const hiddenCount = pendingReviews.length - visibleGroups.reduce((acc, [, revs]) => acc + revs.length, 0);

  return (
    <section id="section-revisoes" className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <span className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Revisões</span>
        <button
          type="button"
          id="btn-abrir-modulo-revisoes"
          onClick={onNavigateToReviews}
          className="flex items-center gap-1 text-[12px] font-semibold text-slate-400 transition hover:text-teal-600"
        >
          Ver todas
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Grupos cronológicos */}
      <div className="mt-3 flex-1 overflow-y-auto">
        {pendingReviews.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            Nenhuma revisão pendente — tudo em dia!
          </p>
        ) : (
          <div className="space-y-4">
            {visibleGroups.map(([dateKey, reviews]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-3">
                  {dateKey === todayStr ? (
                    <span className="text-base font-extrabold uppercase tracking-wide text-slate-700">Hoje</span>
                  ) : (
                    <span className="text-[13px] font-bold text-slate-700">
                      {formatShortDate(dateKey)}
                    </span>
                  )}
                  <div className="h-0.5 flex-1 rounded bg-teal-400" />
                </div>

                <div className="mt-2 space-y-2">
                  {reviews.map((rev) => {
                    const record = (sessionsByTopic.get(rev.topicId) || [])[0];
                    return (
                      <div key={rev.id} className="space-y-1.5">
                        {/* Linha compacta: intervalo + ações + disciplina */}
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg border border-teal-400 bg-teal-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                            {getIntervalLabel(rev.stage)}
                          </span>
                          <button
                            type="button"
                            id={`btn-revisar-${rev.id}`}
                            title="Iniciar revisão no cronômetro"
                            onClick={() => onStartReview(rev)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white shadow-xs transition hover:bg-teal-600"
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                          </button>
                          <button
                            type="button"
                            title="Registrar estudo"
                            onClick={() => onOpenReview(rev)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white shadow-xs transition hover:bg-teal-600"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            title="Ignorar revisão"
                            onClick={() => onIgnoreReview(rev)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-400 text-white shadow-xs transition hover:bg-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <span className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-800">
                            {rev.disciplineName}
                          </span>
                        </div>

                        {/* Registro de estudo real */}
                        {record && (
                          <div className="rounded-lg bg-slate-100 px-3 py-2">
                            <div className="flex items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
                              <span className="font-semibold">
                                {formatShortDate(getSessionLocalDate(record))}
                              </span>
                              <span
                                className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  modalityBadgeClasses[record.modality] || modalityBadgeClasses.Teoria
                                }`}
                              >
                                {record.modality}
                              </span>
                              <span className="text-slate-400">{formatDurationClock(record.durationMinutes)}</span>
                              <span className="min-w-0 flex-1 truncate" title={record.topicName}>
                                {record.topicName || rev.topicName}
                              </span>
                              <span className="flex items-center" title={record.notes ? "Com comentários" : undefined}>
                                {record.notes && <MessageCircle className="h-3.5 w-3.5 text-teal-500" />}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={onNavigateToReviews}
                className="w-full rounded-lg border border-dashed border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-500 transition hover:border-teal-300 hover:text-teal-600"
              >
                + {hiddenCount} outras pendências — ver todas
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
