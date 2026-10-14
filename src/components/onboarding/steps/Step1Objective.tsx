import React from "react";
import { ObjectiveType } from "../types";
import { Check } from "lucide-react";

interface Step1ObjectiveProps {
  value?: ObjectiveType;
  onChange: (value: ObjectiveType) => void;
}

const OBJECTIVE_OPTIONS: { id: ObjectiveType; label: string; description: string }[] = [
  { id: "Concurso Público", label: "Concursos Públicos", description: "Federal, estadual e municipal" },
  { id: "OAB", label: "OAB", description: "Exame da Ordem" },
  { id: "ENEM", label: "ENEM", description: "ENEM e vestibulares" },
  { id: "Vestibular", label: "Faculdade", description: "Disciplinas da graduação" },
  { id: "Certificação", label: "Certificação", description: "Certificações, idiomas e outros" },
  { id: "Outro", label: "Outro", description: "Outros objetivos de estudo" },
];

export const Step1Objective: React.FC<Step1ObjectiveProps> = ({
  value,
  onChange,
}) => {
  return (
    <div id="step-1-objective" className="w-full">
      {/* Question Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
          Para o que você está estudando?
        </h2>
        <p className="text-sm text-[#93A2B7] mt-2">
          Escolha o seu principal objetivo agora. Dá para criar outros planos depois.
        </p>
      </div>

      {/* Simple Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-2">
        {OBJECTIVE_OPTIONS.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              id={`objective-card-${opt.id.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onChange(opt.id)}
              className={`p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-[#1A2A4A] border-[#527DFF] shadow-[0_0_18px_rgba(82,125,255,0.18)]"
                  : "bg-[#172235] border-[#263447] hover:bg-[#223149] hover:border-[#39475C]"
              }`}
            >
              <span className={`block text-base sm:text-lg font-semibold ${isSelected ? "text-white" : "text-[#C4CEDB]"}`}>
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
