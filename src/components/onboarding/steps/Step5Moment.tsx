import React from "react";
import { PreparationMoment } from "../types";
import { Check } from "lucide-react";

interface Step5MomentProps {
  value?: PreparationMoment;
  onChange: (value: PreparationMoment) => void;
}

const MOMENT_OPTIONS: { id: PreparationMoment; label: string; description: string }[] = [
  { id: "Estou começando agora", label: "Estou começando agora", description: "Ainda não estudei as matérias" },
  { id: "Já estudo algumas matérias", label: "Já estudei algumas matérias", description: "Estou no meio do caminho" },
  { id: "Já tenho uma preparação avançada", label: "Já tenho uma preparação avançada", description: "Falta pouco para a prova" },
];

export const Step5Moment: React.FC<Step5MomentProps> = ({
  value,
  onChange,
}) => {
  return (
    <div id="step-5-moment" className="w-full">
      {/* Question Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
          Em que momento dos estudos você está?
        </h2>
        <p className="text-sm text-[#93A2B7] mt-2">
          Assim o plano não te faz recomeçar o que você já viu.
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {MOMENT_OPTIONS.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              id={`moment-card-${opt.id.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onChange(opt.id)}
              className={`p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-[#1A2A4A] border-[#527DFF] shadow-[0_0_18px_rgba(82,125,255,0.18)]"
                  : "bg-[#172235] border-[#263447] hover:bg-[#223149] hover:border-[#39475C]"
              }`}
            >
              <span className={`block text-base font-semibold ${isSelected ? "text-white" : "text-[#C4CEDB]"}`}>
                {opt.label}
              </span>
              <span className="block text-xs text-[#93A2B7] mt-0.5">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
