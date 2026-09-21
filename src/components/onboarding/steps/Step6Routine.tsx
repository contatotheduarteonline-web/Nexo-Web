import React from "react";
import { RoutineType } from "../types";
import { ArrowRight, Check } from "lucide-react";

interface Step6RoutineProps {
  value?: RoutineType;
  onChange: (value: RoutineType) => void;
  onNext: () => void;
}

const ROUTINE_OPTIONS: RoutineType[] = [
  "Trabalho em período integral",
  "Trabalho ou estudo meio período",
  "Estudo em período integral",
  "Minha rotina varia",
  "Prefiro informar apenas meus horários",
];

export const Step6Routine: React.FC<Step6RoutineProps> = ({
  value,
  onChange,
  onNext,
}) => {
  return (
    <div id="step-6-routine" className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#F59E0B] tracking-wider uppercase">
          Etapa 6 de 12
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          Como é sua rotina atualmente?
        </h2>
      </div>

      {/* Routine Options */}
      <div className="space-y-3 mb-8">
        {ROUTINE_OPTIONS.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              id={`routine-card-${opt.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onChange(opt)}
              className={`w-full flex items-center justify-between p-4 sm:p-4.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-zinc-800/90 border-[#F59E0B] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
                  : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
              }`}
            >
              <span className={`text-base font-medium ${isSelected ? "text-white font-semibold" : "text-zinc-200"}`}>
                {opt}
              </span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                  isSelected
                    ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                    : "border-zinc-700 bg-zinc-800/40 text-transparent"
                }`}
              >
                <Check className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end">
        <button
          type="button"
          id="btn-routine-next"
          onClick={onNext}
          disabled={!value}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#FF7A1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
