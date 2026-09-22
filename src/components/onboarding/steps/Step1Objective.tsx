import React from "react";
import { ObjectiveType } from "../types";
import { ArrowRight, Check } from "lucide-react";

interface Step1ObjectiveProps {
  value?: ObjectiveType;
  onChange: (value: ObjectiveType) => void;
  onNext: () => void;
}

const OBJECTIVE_OPTIONS: { id: ObjectiveType; label: string }[] = [
  { id: "Concurso Público", label: "Concurso Público" },
  { id: "OAB", label: "OAB" },
  { id: "ENEM", label: "ENEM" },
  { id: "Vestibular", label: "Vestibular" },
  { id: "Certificação", label: "Certificação" },
  { id: "Outro", label: "Outro" },
];

export const Step1Objective: React.FC<Step1ObjectiveProps> = ({
  value,
  onChange,
  onNext,
}) => {
  const handleSelect = (opt: ObjectiveType) => {
    onChange(opt);
  };

  return (
    <div id="step-1-objective" className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#FF6B00] tracking-wider uppercase">
          Etapa 1 de 12
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          O que você está se preparando para fazer?
        </h2>
      </div>

      {/* Simple Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        {OBJECTIVE_OPTIONS.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              id={`objective-card-${opt.id.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => handleSelect(opt.id)}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-zinc-800/90 border-[#FF6B00] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
                  : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
              }`}
            >
              <span className={`text-base sm:text-lg font-medium ${isSelected ? "text-white font-semibold" : "text-zinc-200"}`}>
                {opt.label}
              </span>
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "border-[#FF6B00] bg-[#FF6B00] text-white"
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
          id="btn-objective-next"
          onClick={onNext}
          disabled={!value}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
