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
  "Questões": "bg-[#2BBF8A] text-white",
  "Revisão": "bg-violet-600 text-white",
  "Videoaula": "bg-[#58A6FF] text-white",
  "Lei Seca": "bg-[#223149] text-white",
  "Simulado": "bg-[#F16D75] text-white",
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

  return (
    <section id="section-revisoes" className="nx-card p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#263447] pb-3">
        <span className="text-[12px] font-bold uppercase tracking-widest text-[#93A2B7]">Revisões</span>
        <button
          type="button"
          id="btn-abrir-modulo-revisoes"
          onClick={onNavigateToReviews}
          className="flex items-center gap-1 text-[12px] font-semibold text-[#93A2B7] transition hover:text-[#F4B544]"
        >
          Ver todas
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Grupos cronológicos */}
      <div className="mt-3 flex-1 overflow-y-auto">
        {pendingReviews.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#93A2B7]">
            Nenhuma revisão pendente — tudo em dia!
          </p>
        ) : (
          <div className="space-y-4">
            {visibleGroups.map(([dateKey, reviews]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-3">
                  {dateKey === todayStr ? (
                    <span className="text-base font-extrabold uppercase tracking-wide text-white">Hoje</span>
                  ) : (
                    <span className="text-[13px] font-bold text-white">
                      {formatShortDate(dateKey)}
                    </span>
                  )}
                  <div className="h-0.5 flex-1 rounded bg-[#527DFF]/40" />
                </div>

                <div className="mt-2 space-y-2">
                  {reviews.map((rev) => {
                    const record = (sessionsByTopic.get(rev.topicId) || [])[0];
                    return (
                      <div key={rev.id} className="space-y-1.5">
                        {/* Linha compacta: intervalo + ações + disciplina */}
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg border border-[#F4B544]/30 bg-[#527DFF]/10 px-3 py-1 text-[11px] font-semibold text-[#F4B544]">
                            {getIntervalLabel(rev.stage)}
                          </span>
                          <button
                            type="button"
                            id={`btn-revisar-${rev.id}`}
                            title="Iniciar revisão no cronômetro"
                            onClick={() => onStartReview(rev)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#527DFF] text-white shadow-xs transition hover:bg-[#416CEB]"
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                          </button>
                          <button
                            type="button"
                            title="Registrar estudo"
                            onClick={() => onOpenReview(rev)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#527DFF] text-white shadow-xs transition hover:bg-[#416CEB]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            title="Ignorar revisão"
                            onClick={() => onIgnoreReview(rev)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F16D75] text-white shadow-xs transition hover:bg-[#F16D75]"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <span className="truncate text-[11px] font-bold uppercase tracking-wide text-white">
                            {rev.disciplineName}
                          </span>
                        </div>

                        {/* Registro de estudo real */}
                        {record && (
                          <div className="rounded-lg bg-[#111B2D] px-3 py-2">
                            <div className="flex items-center gap-x-3 gap-y-1.5 text-[11px] text-[#C4CEDB]">
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
                              <span className="text-[#93A2B7]">{formatDurationClock(record.durationMinutes)}</span>
                              <span className="min-w-0 flex-1 truncate" title={record.topicName}>
                                {record.topicName || rev.topicName}
                              </span>
                              <span className="flex items-center" title={record.notes ? "Com comentários" : undefined}>
                                {record.notes && <MessageCircle className="h-3.5 w-3.5 text-[#F4B544]" />}
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

          </div>
        )}
      </div>
    </section>
  );
};
