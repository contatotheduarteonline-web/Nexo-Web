import React from "react";
import { PreparationMoment } from "../types";
import { ArrowRight, Check } from "lucide-react";

interface Step5MomentProps {
  value?: PreparationMoment;
  onChange: (value: PreparationMoment) => void;
  onNext: () => void;
}

const MOMENT_OPTIONS: PreparationMoment[] = [
  "Estou começando agora",
  "Já estudo algumas matérias",
  "Já tenho uma preparação avançada",
];

export const Step5Moment: React.FC<Step5MomentProps> = ({
  value,
  onChange,
  onNext,
}) => {
  return (
    <div id="step-5-moment" className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#F59E0B] tracking-wider uppercase">
          Etapa 5 de 12
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          Em que momento da preparação você está?
        </h2>
      </div>

      {/* Options Stack */}
      <div className="space-y-3.5 mb-8">
        {MOMENT_OPTIONS.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              id={`moment-card-${opt.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onChange(opt)}
              className={`w-full flex items-center justify-between p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-zinc-800/90 border-[#F59E0B] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
                  : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
              }`}
            >
              <span className={`text-base sm:text-lg font-medium ${isSelected ? "text-white font-semibold" : "text-zinc-200"}`}>
                {opt}
              </span>
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                  isSelected
                    ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                    : "border-zinc-700 bg-zinc-800/40 text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end">
        <button
          type="button"
          id="btn-moment-next"
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
