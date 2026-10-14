import React, { useMemo } from "react";
import {
  DisciplineDraftItem,
  DisciplineWeightLevel,
  KnowledgeLevel,
} from "../types";
import { PASTEL_COLORS } from "../../planejamento/planShared";

interface Step8bWeightsProps {
  disciplines: DisciplineDraftItem[];
  skipped?: boolean;
  onChangeLevel: (disciplineId: string, level: DisciplineWeightLevel) => void;
  onChangeKnowledgeLevel: (disciplineId: string, level: KnowledgeLevel) => void;
  onSkip: () => void;
}

const WEIGHT_OPTIONS: DisciplineWeightLevel[] = [
  "muito_baixa",
  "baixa",
  "media",
  "alta",
  "muito_alta",
];

// Mesma escala 1–5 usada no Planejamento (importância e conhecimento).
const KNOWLEDGE_OPTIONS: KnowledgeLevel[] = [
  "nunca_estudei",
  "pouco",
  "intermediario",
  "bom",
  "muito_bom",
];

const weightToNumber = (lvl?: DisciplineWeightLevel) =>
  Math.max(1, WEIGHT_OPTIONS.indexOf(lvl || "media") + 1);

const knowledgeToNumber = (lvl?: KnowledgeLevel) =>
  Math.max(1, KNOWLEDGE_OPTIONS.indexOf(lvl || "nunca_estudei") + 1);

/**
 * Etapa de pesos do onboarding — replica o layout de relevância do
 * Planejamento (sliders de Importância + Conhecimento por disciplina,
 * com a distribuição percentual ao lado).
 */
export const Step8bWeights: React.FC<Step8bWeightsProps> = ({
  disciplines = [],
  skipped = false,
  onChangeLevel,
  onChangeKnowledgeLevel,
  onSkip,
}) => {
  // Distribuição percentual: mesma fórmula do Planejamento (importância × (6 − conhecimento))
  const distribution = useMemo(() => {
    const scored = disciplines.map((disc) => {
      const importance = weightToNumber(disc.weightLevel);
      const knowledge = knowledgeToNumber(disc.knowledgeLevel);
      const score = importance * (6 - knowledge);
      return { id: disc.id, name: disc.name, score };
    });
    const total = scored.reduce((acc, d) => acc + d.score, 0) || 1;
    return scored
      .map((d) => ({ ...d, weightPercentage: Math.round((d.score / total) * 100) }))
      .sort((a, b) => b.weightPercentage - a.weightPercentage);
  }, [disciplines]);

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

      <div className="rounded-2xl border border-[#263447] bg-[#172235] p-5">
        <p className="text-sm text-[#C4CEDB]">
          Para cada disciplina, selecione a importância (ou peso) para sua prova e seu grau
          de conhecimento:
        </p>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row">
          {/* Left: discipline cards with sliders (layout do Planejamento) */}
          <div className="flex-1 space-y-3">
            {disciplines.map((disc) => {
              const importance = weightToNumber(disc.weightLevel);
              const knowledge = knowledgeToNumber(disc.knowledgeLevel);

              return (
                <div
                  key={disc.id}
                  className="rounded-2xl border border-[#263447] bg-[#111B2D] p-4"
                >
                  <p className="text-sm font-bold text-white">{disc.name}</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#93A2B7]">
                          Importância
                        </span>
                        <span className="num-condensed text-sm font-bold text-[#F4B544]">
                          ({importance})
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={importance}
                        onChange={(e) =>
                          onChangeLevel(disc.id, WEIGHT_OPTIONS[Number(e.target.value) - 1])
                        }
                        className="mt-1.5 w-full cursor-pointer accent-[#F4B544]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#93A2B7]">
                          Conhecimento
                        </span>
                        <span className="num-condensed text-sm font-bold text-[#F4B544]">
                          ({knowledge})
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={knowledge}
                        onChange={(e) =>
                          onChangeKnowledgeLevel(
                            disc.id,
                            KNOWLEDGE_OPTIONS[Number(e.target.value) - 1]
                          )
                        }
                        className="mt-1.5 w-full cursor-pointer accent-[#F4B544]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: distribution badges (layout do Planejamento) */}
          <div className="w-full shrink-0 space-y-2 lg:w-60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#93A2B7]">
              Distribuição
            </span>
            {distribution.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: PASTEL_COLORS[idx % PASTEL_COLORS.length] }}
              >
                <span className="num-condensed text-xs font-bold text-[#0B1120]">
                  {item.weightPercentage}%
                </span>
                <span className="truncate text-[11px] font-semibold text-[#0B1120]">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
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
