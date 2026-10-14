import React from "react";
import { DisciplineDraftItem, KnowledgeLevel } from "../types";

interface Step9KnowledgeProps {
  disciplines: DisciplineDraftItem[];
  onChangeLevel: (disciplineId: string, level: KnowledgeLevel) => void;
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
}) => {
  return (
    <div id="step-9-knowledge" className="w-full">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-bold text-white">
          Marque onde você está em cada disciplina
        </p>
        <span className="text-xs text-[#718096] hidden sm:block">
          Opcional — dá para marcar depois
        </span>
      </div>

      {/* Disciplines List */}
      <div className="rounded-2xl border border-[#263447] bg-[#172235] overflow-hidden">
        {disciplines.map((disc, idx) => {
          const currentLevel = disc.knowledgeLevel || "nunca_estudei";
          return (
            <div
              key={disc.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 ${
                idx > 0 ? "border-t border-[#1C2940]" : ""
              }`}
            >
              <span className="text-sm font-semibold text-white truncate">
                {disc.name}
              </span>

              {/* Levels pills */}
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {LEVEL_OPTIONS.map((lvl) => {
                  const isSelected = currentLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => onChangeLevel(disc.id, lvl.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-center transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-[#527DFF] border-[#527DFF] text-white font-semibold"
                          : "bg-[#111B2D] border-[#263447] text-[#93A2B7] hover:bg-[#223149] hover:text-white"
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
    </div>
  );
};
