import React from "react";
import { ArrowRight } from "lucide-react";

interface Step0WelcomeProps {
  onStart: () => void;
  isStarting?: boolean;
}

const PREVIEW_ITEMS = [
  {
    number: 1,
    title: "Seu objetivo e concurso",
    description: "Buscamos o edital e as disciplinas para você",
  },
  {
    number: 2,
    title: "Sua rotina",
    description: "Quanto tempo você tem e como é a sua semana",
  },
  {
    number: 3,
    title: "Suas prioridades",
    description: "O que você já domina e o que mais cai na prova",
  },
];

export const Step0Welcome: React.FC<Step0WelcomeProps> = ({ onStart, isStarting = false }) => {
  return (
    <div
      id="step-0-welcome"
      className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12"
    >
      {/* Eyebrow */}
      <p className="text-xs font-bold tracking-widest uppercase text-[#F4B544] mb-5">
        Bem-vindo ao NEXO
      </p>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-[1.15]">
        Vamos montar seu plano de estudos, do seu jeito
      </h1>

      {/* Description */}
      <p className="text-[#93A2B7] text-base leading-relaxed mb-8">
        Leva cerca de 3 minutos. A cada resposta, você vê o seu plano tomando forma.
      </p>

      {/* Preview card */}
      <div className="rounded-2xl border border-[#263447] bg-[#172235] overflow-hidden mb-8">
        {PREVIEW_ITEMS.map((item, idx) => (
          <div
            key={item.number}
            className={`flex items-start gap-4 px-5 py-4 ${
              idx > 0 ? "border-t border-[#1C2940]" : ""
            }`}
          >
            <span className="w-8 h-8 rounded-full bg-[#1A2A4A] border border-[#3558A0] flex items-center justify-center shrink-0 num-condensed text-sm font-bold text-[#7DA2FF]">
              {item.number}
            </span>
            <div>
              <p className="text-sm sm:text-base font-semibold text-white">{item.title}</p>
              <p className="text-xs sm:text-sm text-[#93A2B7] mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div className="flex items-center gap-4">
        <button
          id="btn-onboarding-start"
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#527DFF] hover:bg-[#FF7A1A] text-white font-semibold text-base transition-all duration-200 shadow-[0_6px_20px_rgba(255,107,0,0.25)] cursor-pointer disabled:opacity-50"
        >
          <span>Começar</span>
          <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
        <span className="text-xs text-[#718096]">Você pode ajustar tudo depois</span>
      </div>
    </div>
  );
};
