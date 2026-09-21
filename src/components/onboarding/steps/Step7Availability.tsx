import React from "react";
import { WeeklyAvailability, DayAvailability } from "../types";
import { ArrowRight, Clock } from "lucide-react";

interface Step7AvailabilityProps {
  value: WeeklyAvailability;
  onChange: (value: WeeklyAvailability) => void;
  onNext: () => void;
}

const DAYS_META: { key: keyof WeeklyAvailability; label: string; fullLabel: string }[] = [
  { key: "seg", label: "SEG", fullLabel: "Segunda-feira" },
  { key: "ter", label: "TER", fullLabel: "Terça-feira" },
  { key: "qua", label: "QUA", fullLabel: "Quarta-feira" },
  { key: "qui", label: "QUI", fullLabel: "Quinta-feira" },
  { key: "sex", label: "SEX", fullLabel: "Sexta-feira" },
  { key: "sab", label: "SÁB", fullLabel: "Sábado" },
  { key: "dom", label: "DOM", fullLabel: "Domingo" },
];

export const Step7Availability: React.FC<Step7AvailabilityProps> = ({
  value,
  onChange,
  onNext,
}) => {
  // Toggle day active state
  const handleToggleDay = (dayKey: keyof WeeklyAvailability) => {
    const current = value[dayKey];
    onChange({
      ...value,
      [dayKey]: {
        ...current,
        enabled: !current.enabled,
        // If enabling and hours/minutes was 0, default to 2h00
        hours: !current.enabled && current.hours === 0 && current.minutes === 0 ? 2 : current.hours,
      },
    });
  };

  // Update hours / minutes for a day
  const handleUpdateDayTime = (
    dayKey: keyof WeeklyAvailability,
    hours: number,
    minutes: number
  ) => {
    onChange({
      ...value,
      [dayKey]: {
        ...value[dayKey],
        hours: Math.max(0, Math.min(16, hours)),
        minutes: Math.max(0, Math.min(59, minutes)),
      },
    });
  };

  // Calculate total weekly minutes
  const totalWeeklyMinutes = DAYS_META.reduce((acc, { key }) => {
    const day = value[key];
    if (!day.enabled) return acc;
    return acc + day.hours * 60 + day.minutes;
  }, 0);

  const totalWeeklyHours = Math.floor(totalWeeklyMinutes / 60);
  const remainingMinutes = totalWeeklyMinutes % 60;
  const formattedWeekly = `${totalWeeklyHours}h${
    remainingMinutes > 0 ? String(remainingMinutes).padStart(2, "0") : "00"
  }`;

  const canContinue = totalWeeklyMinutes > 0;

  return (
    <div id="step-7-availability" className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-6 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#FF6B00] tracking-wider uppercase">
          Etapa 7 de 12
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          Quando você consegue estudar?
        </h2>
      </div>

      {/* Real-time Summary Card */}
      <div className="mb-6 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#FF6B00]" />
          <span className="text-sm text-zinc-300 font-medium">
            Disponibilidade semanal:
          </span>
        </div>
        <span className="text-lg sm:text-xl font-bold text-[#FF6B00] font-mono tracking-tight">
          {formattedWeekly}
        </span>
      </div>

      {/* Days List */}
      <div className="space-y-2.5 mb-8">
        {DAYS_META.map(({ key, label, fullLabel }) => {
          const day = value[key];
          return (
            <div
              key={key}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                day.enabled
                  ? "bg-zinc-800/80 border-[#FF6B00]/70 shadow-sm"
                  : "bg-zinc-900/40 border-zinc-800/60 opacity-70"
              }`}
            >
              {/* Day Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id={`toggle-day-${key}`}
                  onClick={() => handleToggleDay(key)}
                  className={`w-12 h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                    day.enabled
                      ? "bg-[#FF6B00] text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
                <span className={`text-sm font-medium ${day.enabled ? "text-white" : "text-zinc-400"}`}>
                  {fullLabel}
                </span>
              </div>

              {/* Time inputs (only enabled if day is active) */}
              {day.enabled ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-900/90 border border-zinc-700 rounded-lg px-2.5 py-1.5">
                    <input
                      type="number"
                      min={0}
                      max={16}
                      value={day.hours}
                      onChange={(e) =>
                        handleUpdateDayTime(key, parseInt(e.target.value) || 0, day.minutes)
                      }
                      className="w-10 bg-transparent text-white font-mono text-center font-bold text-sm focus:outline-none"
                    />
                    <span className="text-zinc-400 text-xs font-mono">h</span>
                    <span className="text-zinc-500 mx-1">:</span>
                    <select
                      value={day.minutes}
                      onChange={(e) =>
                        handleUpdateDayTime(key, day.hours, parseInt(e.target.value) || 0)
                      }
                      className="bg-transparent text-white font-mono text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value={0} className="bg-zinc-900 text-white">00m</option>
                      <option value={15} className="bg-zinc-900 text-white">15m</option>
                      <option value={30} className="bg-zinc-900 text-white">30m</option>
                      <option value={45} className="bg-zinc-900 text-white">45m</option>
                    </select>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="hidden sm:flex items-center gap-1">
                    {[1, 2, 3, 4].map((presetH) => (
                      <button
                        key={presetH}
                        type="button"
                        onClick={() => handleUpdateDayTime(key, presetH, 0)}
                        className={`px-2 py-1 text-[11px] rounded font-mono transition-colors ${
                          day.hours === presetH && day.minutes === 0
                            ? "bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40 font-bold"
                            : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {presetH}h
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 italic">Dia livre / Sem estudo</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end">
        <button
          type="button"
          id="btn-availability-next"
          onClick={onNext}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
