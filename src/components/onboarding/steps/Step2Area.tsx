import React from "react";
import { ConcursoArea } from "../types";
import { ArrowRight, Check } from "lucide-react";

interface Step2AreaProps {
  value?: ConcursoArea;
  onChange: (value: ConcursoArea) => void;
  onNext: () => void;
}

const AREA_OPTIONS: ConcursoArea[] = [
  "Policial",
  "Militar",
  "Fiscal",
  "Tribunais",
  "Jurídica",
  "Administrativa",
  "Controle",
  "Educação",
  "Saúde",
  "Bancária",
  "Legislativa",
  "Outra",
  "Ainda não decidi",
];

export const Step2Area: React.FC<Step2AreaProps> = ({
  value,
  onChange,
  onNext,
}) => {
  return (
    <div id="step-2-area" className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-6 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#F59E0B] tracking-wider uppercase">
          Etapa 2 de 12
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
          Qual área mais combina com o seu objetivo?
        </h2>
      </div>

      {/* Grid of Clean Area Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 mb-8">
        {AREA_OPTIONS.map((area) => {
          const isSelected = value === area;
          return (
            <button
              key={area}
              type="button"
              id={`area-card-${area.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onChange(area)}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-zinc-800/90 border-[#F59E0B] shadow-[0_0_14px_rgba(255,107,0,0.18)]"
                  : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/40 hover:border-zinc-700"
              }`}
            >
              <span className={`text-sm sm:text-base font-medium leading-snug ${isSelected ? "text-white font-semibold" : "text-zinc-200"}`}>
                {area}
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1.5 transition-colors ${
                  isSelected
                    ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                    : "border-zinc-700 bg-zinc-800/40 text-transparent"
                }`}
              >
                <Check className="w-2.5 h-2.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end">
        <button
          type="button"
          id="btn-area-next"
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
