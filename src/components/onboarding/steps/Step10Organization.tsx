import React from "react";
import { OrganizationPreference } from "../types";
import { Check, Compass, Calendar, Sparkles } from "lucide-react";

interface Step10OrganizationProps {
  value?: OrganizationPreference;
  onChange: (value: OrganizationPreference) => void;
}

const ORG_CARDS: {
  id: Exclude<OrganizationPreference, "indeciso">;
  icon: React.ElementType;
  title: string;
  description: string;
  tag: string;
}[] = [
  {
    id: "ciclo",
    icon: Compass,
    title: "Ciclo de estudos",
    description: "Minhas semanas variam. Quero seguir uma sequência de disciplinas, sem dia fixo.",
    tag: "Mais flexível",
  },
  {
    id: "semanal",
    icon: Calendar,
    title: "Planejamento semanal",
    description: "Minha rotina é previsível. Quero dias e horários definidos para cada disciplina.",
    tag: "Mais estruturado",
  },
];

export const Step10Organization: React.FC<Step10OrganizationProps> = ({
  value,
  onChange,
}) => {
  return (
    <div id="step-10-organization" className="w-full">
      {/* Section label */}
      <p className="text-sm font-bold text-white mb-3">Como você prefere organizar os estudos?</p>

      {/* Two format cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3">
        {ORG_CARDS.map((card) => {
          const Icon = card.icon;
          const isSelected = value === card.id;
          return (
            <button
              key={card.id}
              type="button"
              id={`btn-org-${card.id}`}
              onClick={() => onChange(card.id)}
              className={`p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "bg-[#1A2A4A] border-[#527DFF] shadow-[0_0_18px_rgba(82,125,255,0.18)]"
                  : "bg-[#172235] border-[#263447] hover:bg-[#223149] hover:border-[#39475C]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-base font-semibold ${isSelected ? "text-white" : "text-[#C4CEDB]"}`}>
                    {card.title}
                  </div>
                  <p className="text-xs sm:text-sm text-[#93A2B7] mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                    isSelected ? "border-[#527DFF] bg-[#527DFF] text-white" : "border-[#39475C] bg-transparent"
                  }`}
                >
                  <Check className={`w-3 h-3 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                </div>
              </div>
              <span
                className={`inline-block mt-3 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                  isSelected
                    ? "bg-[#527DFF]/20 text-[#7DA2FF]"
                    : "bg-[#111B2D] text-[#93A2B7]"
                }`}
              >
                {card.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ainda não sei */}
      <button
        type="button"
        id="btn-org-indeciso"
        onClick={() => onChange("indeciso")}
        className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
          value === "indeciso"
            ? "bg-[#1A2A4A] border-[#527DFF]"
            : "bg-[#172235] border-[#263447] hover:bg-[#223149] hover:border-[#39475C]"
        }`}
      >
        <span className="flex items-center gap-3">
          <Sparkles className={`w-4 h-4 ${value === "indeciso" ? "text-[#F4B544]" : "text-[#718096]"}`} />
          <span className={`text-sm font-medium ${value === "indeciso" ? "text-white font-semibold" : "text-[#C4CEDB]"}`}>
            Ainda não sei
          </span>
        </span>
        <span className="text-xs text-[#718096]">
          O NEXO começa com uma configuração básica, que você poderá alterar.
        </span>
      </button>

      <p className="mt-3 text-xs text-[#718096]">Dá para trocar de formato a qualquer momento.</p>
    </div>
  );
};
