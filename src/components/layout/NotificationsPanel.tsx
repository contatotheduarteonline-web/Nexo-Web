import React from "react";
import { BellOff, Clock, Calendar, ChevronRight } from "lucide-react";
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
    <div className="absolute right-0 top-full mt-2 w-[360px] overflow-hidden rounded-2xl border border-[#263447] bg-[#101827] shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#263447] px-4 py-3">
        <span className="text-sm font-bold text-white">Notificações</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-semibold text-[#93A2B7] transition-colors hover:text-[#527DFF] cursor-pointer"
        >
          Fechar painel
        </button>
      </div>

      {/* Body */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <BellOff className="h-8 w-8 text-[#5A6B84]" strokeWidth={1.75} />
          <p className="mt-4 text-sm text-[#93A2B7]">Nenhuma notificação por aqui.</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {/* Revisões */}
          {pendingReviews.length > 0 && (
            <div className="border-b border-[#263447] py-2">
              <p className="px-4 py-1 text-[9px] font-black uppercase tracking-widest text-[#F4B544]">
                Revisões para hoje
              </p>
              {pendingReviews.slice(0, 3).map((review) => (
                <div
                  key={review.id}
                  onClick={() => go("revisoes")}
                  className="mx-1.5 flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[#1D2B40]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#F4B544]/25 bg-[#527DFF]/10">
                    <Clock className="h-3.5 w-3.5 text-[#F4B544]" />
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
              <p className="px-4 py-1 text-[9px] font-black uppercase tracking-widest text-[#F4B544]">
                Lembretes
              </p>
              {activeReminders.slice(0, 3).map((reminder) => (
                <div
                  key={reminder.id}
                  onClick={() => go("lembretes")}
                  className="mx-1.5 flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[#1D2B40]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#263447] bg-[#111B2D]">
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
      <div className="flex items-center justify-center gap-1.5 border-t border-[#263447] px-4 py-3">
        <Clock className="h-4 w-4 text-[#93A2B7]" />
        <span className="text-[11px] text-[#93A2B7]">
          Mostrando as dos últimos 30 dias.
        </span>
        <button
          type="button"
          onClick={() => go("revisoes")}
          className="text-[11px] font-semibold text-[#C4CEDB] transition-colors hover:text-[#527DFF] cursor-pointer"
        >
          Ver todas
        </button>
      </div>
    </div>
  );
};
