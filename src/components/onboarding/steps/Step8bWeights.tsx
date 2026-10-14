import React from "react";
import { DisciplineDraftItem, DisciplineWeightLevel } from "../types";

interface Step8bWeightsProps {
  disciplines: DisciplineDraftItem[];
  skipped?: boolean;
  onChangeLevel: (disciplineId: string, level: DisciplineWeightLevel) => void;
  onSkip: () => void;
}

const WEIGHT_OPTIONS: { id: DisciplineWeightLevel; label: string }[] = [
  { id: "muito_baixa", label: "Muito baixa" },
  { id: "baixa", label: "Baixa" },
  { id: "media", label: "Média" },
  { id: "alta", label: "Alta" },
  { id: "muito_alta", label: "Muito alta" },
];

export const Step8bWeights: React.FC<Step8bWeightsProps> = ({
  disciplines = [],
  skipped = false,
  onChangeLevel,
  onSkip,
}) => {
  return (
    <div id="step-8b-weights" className="w-full">
      {/* Section header */}
      <div className="mb-5">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          Quanto cada disciplina pesa na prova?
        </h3>
        <p className="text-sm text-[#93A2B7] mt-1">
          Consulte o edital ou provas anteriores. Na dúvida, pule esta etapa.
        </p>
      </div>

      {/* Disciplines List */}
      <div className="rounded-2xl border border-[#263447] bg-[#172235] overflow-hidden">
        {disciplines.map((disc, idx) => {
          const currentLevel = disc.weightLevel || "media";
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

              {/* Weights pills */}
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {WEIGHT_OPTIONS.map((lvl) => {
                  const isSelected = !skipped && currentLevel === lvl.id;
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

      {/* Skip action / skipped state */}
      {skipped ? (
        <p className="mt-4 text-xs text-[#718096]">
          Pesos pulados — usaremos os pesos do edital e o seu nível de conhecimento. Você pode ajustar acima quando quiser.
        </p>
      ) : (
        <button
          type="button"
          id="btn-skip-weights"
          onClick={onSkip}
          className="mt-4 text-sm font-semibold text-[#2BBF8A] hover:text-[#3ED9A4] transition-colors cursor-pointer"
        >
          Não sei os pesos — pular esta etapa
        </button>
      )}
    </div>
  );
};
