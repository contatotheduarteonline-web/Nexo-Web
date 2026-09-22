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
      className="nx-card p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-[#384154]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-white">
              <Calendar className="h-4 w-4" />
            </div>
            <h3 className="font-condensed text-[19px] font-bold text-white">
              LEMBRETES
            </h3>
          </div>

          <button
            type="button"
            id="btn-adicionar-lembrete-toggle"
            onClick={() => setIsAddingReminder(!isAddingReminder)}
            className="text-[13px] font-semibold text-[#F3AA2D] hover:text-[#D98F20] hover:underline flex items-center gap-1 cursor-pointer transition-colors duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar</span>
          </button>
        </div>

        {isAddingReminder && (
          <form
            onSubmit={handleSubmit}
            className="mt-3.5 rounded-xl border border-[#F3AA2D]/25 bg-[#F3AA2D]/[0.04] p-3 text-[12px]"
          >
            <input
              type="text"
              required
              placeholder="Título do lembrete..."
              value={newReminderTitle}
              onChange={(e) => setNewReminderTitle(e.target.value)}
              className="w-full rounded-lg border border-[#384154] bg-[#171B25] p-2 text-[12px] text-white placeholder:text-white outline-hidden focus:border-[#F3AA2D] transition-colors duration-200 mb-2"
            />
            <div className="flex items-center justify-between gap-2">
              <input
                type="date"
                value={newReminderDate}
                onChange={(e) => setNewReminderDate(e.target.value)}
                className="rounded-lg border border-[#384154] bg-[#171B25] p-1.5 text-[11px] text-white focus:border-[#F3AA2D] transition-colors duration-200"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingReminder(false)}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#384154] transition-colors duration-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="nx-btn-primary px-3 py-1 text-[11px] cursor-pointer"
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
              <p className="text-[13px] text-white">
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
                  className="nx-deep nx-deep-hover flex cursor-pointer items-center justify-between p-3 text-[12px] hover:border-[#F3AA2D]/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={rem.completed}
                      onChange={() => onToggleReminder(rem.id)}
                      className="h-4 w-4 rounded accent-[#F3AA2D] focus:ring-[#F3AA2D] shrink-0 cursor-pointer"
                    />
                    <span
                      className={`truncate text-[12px] ${
                        rem.completed
                          ? "text-white line-through"
                          : "font-semibold text-white"
                      }`}
                    >
                      {rem.title}
                    </span>
                  </div>
                  <span className="num-condensed text-[11px] font-semibold text-white shrink-0 bg-[#2D3442] px-2 py-0.5 rounded border border-[#384154]">
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
