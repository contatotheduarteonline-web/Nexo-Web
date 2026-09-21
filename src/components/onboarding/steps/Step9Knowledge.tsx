import React from "react";
import { DisciplineDraftItem, KnowledgeLevel } from "../types";
import { ArrowRight } from "lucide-react";

interface Step9KnowledgeProps {
  disciplines: DisciplineDraftItem[];
  onChangeLevel: (disciplineId: string, level: KnowledgeLevel) => void;
  onNext: () => void;
}

const LEVEL_OPTIONS: { id: KnowledgeLevel; label: string }[] = [
  { id: "nunca_estudei", label: "Nunca estudei" },
  { id: "pouco", label: "Pouco" },
  { id: "intermediario", label: "Intermediário" },
  { id: "bom", label: "Bom" },
  { id: "muito_bom", label: "Muito bom" },
];

export const Step9Knowledge: React.FC<Step9KnowledgeProps> = ({
  disciplines,
  onChangeLevel,
  onNext,
}) => {
  return (
    <div id="step-9-knowledge" className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#FF6B00] tracking-wider uppercase">
          Etapa 9 de 12
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          Como você se sente em cada matéria?
        </h2>
      </div>

      {/* Disciplines List */}
      <div className="space-y-4 mb-8">
        {disciplines.map((disc) => {
          const currentLevel = disc.knowledgeLevel || "nunca_estudei";
          return (
            <div
              key={disc.id}
              className="p-4 sm:p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3"
            >
              <div className="text-base font-semibold text-white tracking-wide">
                {disc.name}
              </div>

              {/* Levels pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {LEVEL_OPTIONS.map((lvl) => {
                  const isSelected = currentLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => onChangeLevel(disc.id, lvl.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm font-semibold"
                          : "bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end">
        <button
          type="button"
          id="btn-knowledge-next"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A1A] text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
