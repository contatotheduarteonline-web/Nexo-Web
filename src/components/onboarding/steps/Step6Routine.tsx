import React from "react";
import { RoutineType } from "../types";

interface Step6RoutineProps {
  value?: RoutineType;
  onChange: (value: RoutineType) => void;
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
}) => {
  return (
    <div id="step-6-routine" className="w-full">
      {/* Section label */}
      <p className="text-sm font-bold text-white mb-3">
        Você trabalha ou tem outra atividade além dos estudos?
      </p>

      {/* Routine Options (radio rows) */}
      <div className="space-y-3">
        {ROUTINE_OPTIONS.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              id={`routine-card-${opt.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onChange(opt)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-[#1A2A4A] border-[#527DFF]"
                  : "bg-[#172235] border-[#263447] hover:bg-[#223149] hover:border-[#39475C]"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "border-[#527DFF]" : "border-[#39475C]"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    isSelected ? "bg-[#527DFF]" : "bg-transparent"
                  }`}
                />
              </span>
              <span className={`text-sm sm:text-base font-medium ${isSelected ? "text-white font-semibold" : "text-[#C4CEDB]"}`}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
