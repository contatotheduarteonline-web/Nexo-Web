import React from "react";
import { Bell, Clock, Calendar, CheckCircle2, ChevronRight } from "lucide-react";
import type { ScheduledReview, Reminder } from "../../types";

interface NotificationsPanelProps {
  pendingReviews: ScheduledReview[];
  activeReminders: Reminder[];
  onClose: () => void;
  onNavigate: (tab: "revisoes" | "lembretes") => void;
}

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}`;
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  pendingReviews,
  activeReminders,
  onClose,
  onNavigate,
}) => {
  const total = pendingReviews.length + activeReminders.length;

  const go = (tab: "revisoes" | "lembretes") => {
    onClose();
    onNavigate(tab);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-[360px] overflow-hidden rounded-2xl border border-[#384154] bg-[#11151F] shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#384154] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#F3AA2D]/25 bg-[#F3AA2D]/10">
            <Bell className="h-3.5 w-3.5 text-[#F3AA2D]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Notificações
          </span>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            total > 0
              ? "border border-[#F3AA2D]/30 bg-[#F3AA2D]/10 text-[#F3AA2D]"
              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {total > 0 ? `${total} pendente${total > 1 ? "s" : ""}` : "Em dia"}
        </span>
      </div>

      {/* Body */}
      {total === 0 ? (
        <div className="px-6 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="mt-3 text-sm font-bold text-white">Tudo em dia</p>
          <p className="mt-1 text-[11px] text-white/50">
            Nenhuma revisão ou lembrete pendente. Sua rotina está em ordem.
          </p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {/* Revisões */}
          {pendingReviews.length > 0 && (
            <div className="border-b border-[#384154] py-2">
              <p className="px-4 py-1 text-[9px] font-black uppercase tracking-widest text-[#F3AA2D]">
                Revisões para hoje
              </p>
              {pendingReviews.slice(0, 3).map((review) => (
                <div
                  key={review.id}
                  onClick={() => go("revisoes")}
                  className="mx-1.5 flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[#252B38]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#F3AA2D]/25 bg-[#F3AA2D]/10">
                    <Clock className="h-3.5 w-3.5 text-[#F3AA2D]" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-xs font-semibold text-white">
                      {review.topicName}
                    </p>
                    <p className="truncate text-[10px] text-white/50">
                      {review.disciplineName} · ciclo {review.stage}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30" />
                </div>
              ))}
              {pendingReviews.length > 3 && (
                <p className="px-4 pt-1 text-[10px] text-white/40">
                  + {pendingReviews.length - 3} revisão{pendingReviews.length - 3 > 1 ? "ões" : ""} agendada{pendingReviews.length - 3 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Lembretes */}
          {activeReminders.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1 text-[9px] font-black uppercase tracking-widest text-[#F3AA2D]">
                Lembretes
              </p>
              {activeReminders.slice(0, 3).map((reminder) => (
                <div
                  key={reminder.id}
                  onClick={() => go("lembretes")}
                  className="mx-1.5 flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[#252B38]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#384154] bg-[#171B25]">
                    <Calendar className="h-3.5 w-3.5 text-white/70" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-xs font-semibold text-white">
                      {reminder.title}
                    </p>
                    <p className="text-[10px] text-white/50">
                      {reminder.date ? `Agendado para ${formatDate(reminder.date)}` : "Lembrete ativo"}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30" />
                </div>
              ))}
              {activeReminders.length > 3 && (
                <p className="px-4 pt-1 text-[10px] text-white/40">
                  + {activeReminders.length - 3} lembrete{activeReminders.length - 3 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="grid grid-cols-2 gap-2 border-t border-[#384154] p-3">
        <button
          type="button"
          onClick={() => go("revisoes")}
          className="rounded-xl border border-[#384154] bg-[#171B25] px-3 py-2 text-[11px] font-bold text-white/70 transition hover:border-[#F3AA2D]/40 hover:text-[#F3AA2D] cursor-pointer"
        >
          Ver Revisões &rarr;
        </button>
        <button
          type="button"
          onClick={() => go("lembretes")}
          className="rounded-xl border border-[#384154] bg-[#171B25] px-3 py-2 text-[11px] font-bold text-white/70 transition hover:border-[#F3AA2D]/40 hover:text-[#F3AA2D] cursor-pointer"
        >
          Ver Lembretes &rarr;
        </button>
      </div>
    </div>
  );
};
