import React from "react";

interface OnboardingProgressProps {
  currentStep: number; // 0 = welcome, 1..7 = steps (4 e 5 = Rotina em duas etapas)
}

const SECTIONS = ["Objetivo", "Concurso", "Momento", "Rotina", "Prioridades", "Início"];

// Mapeia a etapa atual para o segmento da barra (Rotina cobre 2 etapas)
const SECTION_OF_STEP: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 5, 7: 6 };

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
}) => {
  // Welcome screen has no visible progress yet
  if (currentStep <= 0) return null;

  const section = SECTION_OF_STEP[currentStep] ?? currentStep;

  return (
    <div
      id="onboarding-progress-bar-container"
      className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-8 pt-6"
    >
      <div className="grid grid-cols-6 gap-2">
        {SECTIONS.map((label, idx) => {
          const seg = idx + 1;
          const done = section > seg;
          const active = section === seg;
          return (
            <div key={label} className="flex flex-col gap-1.5 min-w-0">
              <div
                className={`h-1 rounded-full transition-colors duration-300 ${
                  done || active ? "bg-[#527DFF]" : "bg-[#263447]"
                }`}
              />
              <span
                className={`text-[11px] leading-none truncate ${
                  done
                    ? "text-[#C4CEDB]"
                    : active
                    ? "text-white font-semibold"
                    : "text-[#718096]"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
