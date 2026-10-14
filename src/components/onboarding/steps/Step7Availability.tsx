import React from "react";
import { WeeklyAvailability } from "../types";
import { Info, Minus, Plus } from "lucide-react";

interface Step7AvailabilityProps {
  value: WeeklyAvailability;
  onChange: (value: WeeklyAvailability) => void;
}

const DAYS_META: { key: keyof WeeklyAvailability; label: string }[] = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

const STEP_MINUTES = 30;
const MAX_MINUTES = 16 * 60;

export const Step7Availability: React.FC<Step7AvailabilityProps> = ({
  value,
  onChange,
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

  // Adjust a day's total time in fixed steps (±30min)
  const handleAdjustDayTime = (
    dayKey: keyof WeeklyAvailability,
    direction: 1 | -1
  ) => {
    const day = value[dayKey];
    const total = Math.max(0, Math.min(MAX_MINUTES, day.hours * 60 + day.minutes + direction * STEP_MINUTES));
    onChange({
      ...value,
      [dayKey]: {
        ...day,
        enabled: total > 0,
        hours: Math.floor(total / 60),
        minutes: total % 60,
      },
    });
  };

  // Format "2h00min" / "0h"
  const formatTime = (hours: number, minutes: number) =>
    minutes > 0 || hours > 0 ? `${hours}h${String(minutes).padStart(2, "0")}min` : "0h";

  // Calculate total weekly minutes
  const totalWeeklyMinutes = DAYS_META.reduce((acc, { key }) => {
    const day = value[key];
    if (!day.enabled) return acc;
    return acc + day.hours * 60 + day.minutes;
  }, 0);

  const formattedWeekly = `${Math.floor(totalWeeklyMinutes / 60)}h${String(
    totalWeeklyMinutes % 60
  ).padStart(2, "0")}`;

  return (
    <div id="step-7-availability" className="w-full">
      {/* Question Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
          Quais dias e quanto tempo em cada um?
        </h2>
        <p className="text-sm text-[#93A2B7] mt-2 max-w-xl">
          Seja realista: um plano que cabe na sua semana rende mais do que um
          plano ideal.
        </p>
      </div>

      {/* Info callout */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--info-border)] bg-[var(--info-soft)] p-4">
        <Info className="w-4.5 h-4.5 text-[var(--info)] shrink-0 mt-0.5" />
        <p className="text-[13px] leading-relaxed text-[#C4CEDB]">
          Quem trabalha em período integral costuma render de 2 a 3h por dia
          útil e de 3 a 5h nos fins de semana.
        </p>
      </div>

      {/* Days List */}
      <div className="rounded-2xl border border-[#263447] bg-[#172235] overflow-hidden mb-8">
        {DAYS_META.map(({ key, label }, index) => {
          const day = value[key];
          return (
            <div
              key={key}
              className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 transition-colors ${
                index > 0 ? "border-t border-[#1C2940]" : ""
              } ${day.enabled ? "bg-[#172235]" : "bg-[#101827]"}`}
            >
              {/* Day switch + label */}
              <button
                type="button"
                id={`toggle-day-${key}`}
                onClick={() => handleToggleDay(key)}
                className="flex items-center gap-3 cursor-pointer group shrink-0"
              >
                <span
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    day.enabled
                      ? "bg-[#527DFF]"
                      : "bg-[#111B2D] border border-[#39475C] group-hover:border-[#527DFF]/60"
                  }`}
                >
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      day.enabled ? "left-[calc(100%-1.25rem)]" : "left-1"
                    }`}
                  />
                </span>
                <span
                  className={`text-sm font-semibold transition-colors ${
                    day.enabled ? "text-white" : "text-[#718096]"
                  }`}
                >
                  {label}
                </span>
              </button>

              {/* Time stepper */}
              <div
                className={`flex items-center rounded-xl border border-[#263447] bg-[#111B2D] px-1.5 py-1.5 ${
                  day.enabled ? "" : "opacity-50"
                }`}
              >
                <button
                  type="button"
                  id={`step-down-${key}`}
                  onClick={() => handleAdjustDayTime(key, -1)}
                  disabled={!day.enabled}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#93A2B7] hover:text-white hover:bg-[#223149] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={`Diminuir tempo de ${label}`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-20 text-center text-sm font-bold text-white font-mono">
                  {formatTime(day.hours, day.minutes)}
                </span>
                <button
                  type="button"
                  id={`step-up-${key}`}
                  onClick={() => handleAdjustDayTime(key, 1)}
                  disabled={!day.enabled}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#93A2B7] hover:text-white hover:bg-[#223149] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={`Aumentar tempo de ${label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly total */}
      <p className="text-sm text-[#93A2B7]">
        Total:{" "}
        <span className="num-condensed font-bold text-[#F4B544]">
          {formattedWeekly}
        </span>{" "}
        por semana
      </p>
    </div>
  );
};
