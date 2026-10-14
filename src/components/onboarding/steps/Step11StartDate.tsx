import React from "react";
import { StartDateOption } from "../types";
import { Check, Calendar as CalendarIcon } from "lucide-react";

interface Step11StartDateProps {
  value?: StartDateOption;
  customDate?: string;
  onChangeOption: (opt: StartDateOption) => void;
  onChangeCustomDate: (date: string) => void;
}

export const Step11StartDate: React.FC<Step11StartDateProps> = ({
  value,
  customDate = "",
  onChangeOption,
  onChangeCustomDate,
}) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const formatDisplay = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  const todayFormatted = formatDisplay(today);
  const tomorrowFormatted = formatDisplay(tomorrow);
  const todayIso = today.toISOString().split("T")[0];

  const canContinue =
    value === "hoje" ||
    value === "amanha" ||
    (value === "custom" && customDate.trim().length > 0);

  return (
    <div id="step-11-start-date" className="w-full">
      {/* Question Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
          Quando você quer começar?
        </h2>
      </div>

      {/* Options Stack */}
      <div className="space-y-3.5 mb-6">
        {/* Hoje */}
        <button
          type="button"
          id="btn-start-today"
          onClick={() => onChangeOption("hoje")}
          className={`w-full flex items-center justify-between p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            value === "hoje"
              ? "bg-zinc-800/90 border-[#F4B544] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <div>
            <div className={`text-base font-semibold ${value === "hoje" ? "text-white" : "text-zinc-200"}`}>
              Hoje
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 capitalize">
              {todayFormatted}
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              value === "hoje"
                ? "border-[#F4B544] bg-[#527DFF] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3 h-3" />
          </div>
        </button>

        {/* Amanhã */}
        <button
          type="button"
          id="btn-start-tomorrow"
          onClick={() => onChangeOption("amanha")}
          className={`w-full flex items-center justify-between p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            value === "amanha"
              ? "bg-zinc-800/90 border-[#F4B544] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <div>
            <div className={`text-base font-semibold ${value === "amanha" ? "text-white" : "text-zinc-200"}`}>
              Amanhã
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 capitalize">
              {tomorrowFormatted}
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              value === "amanha"
                ? "border-[#F4B544] bg-[#527DFF] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3 h-3" />
          </div>
        </button>

        {/* Escolher outra data */}
        <button
          type="button"
          id="btn-start-custom"
          onClick={() => onChangeOption("custom")}
          className={`w-full flex items-center justify-between p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            value === "custom"
              ? "bg-zinc-800/90 border-[#F4B544] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <div>
            <div className={`text-base font-semibold ${value === "custom" ? "text-white" : "text-zinc-200"}`}>
              Escolher outra data
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Definir uma data futura personalizada
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              value === "custom"
                ? "border-[#F4B544] bg-[#527DFF] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3 h-3" />
          </div>
        </button>
      </div>

      {/* Date input if custom */}
      {value === "custom" && (
        <div className="mb-8 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 transition-all duration-200">
          <label htmlFor="input-start-date-custom" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Data de início
          </label>
          <div className="relative">
            <input
              id="input-start-date-custom"
              type="date"
              min={todayIso}
              value={customDate}
              onChange={(e) => onChangeCustomDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white focus:outline-none focus:border-[#7DA2FF] focus:ring-1 focus:ring-[#7DA2FF] text-sm"
              autoFocus
            />
            <CalendarIcon className="absolute right-3.5 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      )}

    </div>
  );
};
