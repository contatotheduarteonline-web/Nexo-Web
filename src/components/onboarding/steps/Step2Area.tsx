import React from "react";
import { ConcursoArea } from "../types";

interface Step2AreaProps {
  value?: ConcursoArea;
  onChange: (value: ConcursoArea) => void;
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
}) => {
  return (
    <div id="step-2-area" className="w-full">
      {/* Section label */}
      <p className="text-sm font-bold text-white mb-3">E qual a área?</p>

      {/* Chips */}
      <div className="flex flex-wrap gap-2.5">
        {AREA_OPTIONS.map((area) => {
          const isSelected = value === area;
          return (
            <button
              key={area}
              type="button"
              id={`area-chip-${area.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onChange(area)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-[#527DFF] border-[#527DFF] text-white"
                  : "bg-[#172235] border-[#263447] text-[#C4CEDB] hover:border-[#527DFF]/60 hover:text-white"
              }`}
            >
              {area}
            </button>
          );
        })}
      </div>
    </div>
  );
};
