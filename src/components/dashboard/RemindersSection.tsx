import React, { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { Reminder } from "../../types";

interface RemindersSectionProps {
  reminders: Reminder[];
  onToggleReminder: (id: string) => void;
  onAddReminder: (data: { title: string; date: string }) => void;
}

export const RemindersSection: React.FC<RemindersSectionProps> = ({
  reminders,
  onToggleReminder,
  onAddReminder,
}) => {
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDate, setNewReminderDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    onAddReminder({
      title: newReminderTitle.trim(),
      date: newReminderDate,
    });
    setNewReminderTitle("");
    setIsAddingReminder(false);
  };

  return (
    <section
      id="section-lembretes"
      className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E2638] dark:bg-[#121622] flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F2F5] dark:border-[#1C2333]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#F97316] dark:bg-orange-950/40 dark:text-orange-400">
              <Calendar className="h-4 w-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#172033] dark:text-white tracking-tight">
              Lembretes
            </h3>
          </div>

          <button
            type="button"
            id="btn-adicionar-lembrete-toggle"
            onClick={() => setIsAddingReminder(!isAddingReminder)}
            className="text-[13px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar</span>
          </button>
        </div>

        {isAddingReminder && (
          <form
            onSubmit={handleSubmit}
            className="mt-3.5 rounded-xl border border-[#F97316]/30 bg-orange-50/40 p-3 text-[12px] dark:bg-[#F97316]/10"
          >
            <input
              type="text"
              required
              placeholder="Título do lembrete..."
              value={newReminderTitle}
              onChange={(e) => setNewReminderTitle(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white p-2 text-[12px] text-[#172033] outline-hidden focus:border-[#F97316] dark:border-[#1E2638] dark:bg-[#121622] dark:text-white mb-2"
            />
            <div className="flex items-center justify-between gap-2">
              <input
                type="date"
                value={newReminderDate}
                onChange={(e) => setNewReminderDate(e.target.value)}
                className="rounded-lg border border-[#E5E7EB] bg-white p-1.5 text-[11px] text-[#172033] dark:border-[#1E2638] dark:bg-[#121622] dark:text-white"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingReminder(false)}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#667085] hover:bg-black/5 dark:text-[#94A3B8] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#F97316] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#EA580C] shadow-xs transition cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-3.5">
          {reminders.length === 0 ? (
            <div className="py-7 text-center">
              <p className="text-[13px] text-[#667085] dark:text-[#94A3B8]">
                Nenhum lembrete cadastrado.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {reminders.slice(0, 4).map((rem) => (
                <div
                  key={rem.id}
                  id={`reminder-item-${rem.id}`}
                  onClick={() => onToggleReminder(rem.id)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-3 text-[12px] transition hover:border-[#F97316]/40 dark:border-[#1E2638] dark:bg-[#161D2B]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={rem.completed}
                      onChange={() => onToggleReminder(rem.id)}
                      className="h-4 w-4 rounded text-[#F97316] focus:ring-[#F97316] shrink-0 cursor-pointer"
                    />
                    <span
                      className={`truncate text-[12px] ${
                        rem.completed
                          ? "text-[#667085] line-through dark:text-slate-500"
                          : "font-semibold text-[#172033] dark:text-white"
                      }`}
                    >
                      {rem.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-[#667085] dark:text-[#94A3B8] shrink-0 bg-white dark:bg-[#121622] px-2 py-0.5 rounded border border-[#E5E7EB] dark:border-[#1E2638]">
                    {rem.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
