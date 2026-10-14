import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

interface StepProcessingProps {
  /** Nome do plano/cargo exibido no primeiro item do checklist. */
  planName?: string;
  /** Quantidade de disciplinas sendo organizadas no plano. */
  disciplinesCount?: number;
  /** True quando o plano realmente terminou de ser criado no banco. */
  workDone?: boolean;
  onFinished?: () => void;
}

const STAGES_COUNT = 6;
const FIRST_STAGE_MS = 2000;
const STAGE_MS = 3600; // 6 etapas ≈ 20s no total
const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const StepProcessing: React.FC<StepProcessingProps> = ({
  planName,
  disciplinesCount = 0,
  workDone = false,
  onFinished,
}) => {
  const [stage, setStage] = useState(0); // 0..6 — quantas etapas já foram concluídas
  const finishedRef = useRef(false);

  useEffect(() => {
    if (stage >= STAGES_COUNT) return;
    const delay = stage === 0 ? FIRST_STAGE_MS : STAGE_MS;
    const timer = setTimeout(() => setStage((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage >= STAGES_COUNT && workDone && !finishedRef.current) {
      finishedRef.current = true;
      onFinished?.();
    }
  }, [stage, workDone, onFinished]);

  const items = [
    `Criando seu plano para ${planName?.trim() || "você"}`,
    `Organizando suas ${disciplinesCount} ${
      disciplinesCount === 1 ? "disciplina" : "disciplinas"
    }`,
    "Priorizando o que você menos domina",
    "Distribuindo os estudos na sua semana",
    "Definindo suas metas semanais",
    "Conferindo os últimos detalhes",
  ];

  const allDone = stage >= STAGES_COUNT && workDone;
  const percent = allDone ? 100 : Math.min(99, Math.round((stage / STAGES_COUNT) * 100));
  const dashOffset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <div
      id="onboarding-processing-screen"
      className="flex flex-col items-center justify-center text-center max-w-md mx-auto px-4 py-16"
    >
      {/* Circular progress ring */}
      <div className="relative w-24 h-24 mb-8">
        <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            stroke="#1C2940"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            stroke="#2BBF8A"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white num-condensed">
          {percent}%
        </span>
      </div>

      {/* Clean Heading */}
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
        Montando seu plano
      </h2>
      <p className="text-[#93A2B7] text-sm mb-8">
        {allDone
          ? "Tudo pronto!"
          : "Isso leva alguns segundos — montando tudo com cuidado."}
      </p>

      {/* Checklist */}
      <div className="w-full max-w-sm space-y-3 text-left">
        {items.map((label, idx) => {
          const done = allDone || idx < stage;
          const active = !allDone && idx === stage;
          return (
            <div key={label} className="flex items-center gap-3">
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  done
                    ? "border-[#2BBF8A] bg-[#2BBF8A]/15 text-[#2BBF8A]"
                    : active
                    ? "border-[#2BBF8A] text-transparent animate-pulse"
                    : "border-[#263447] text-transparent"
                }`}
              >
                <Check className="w-3 h-3" />
              </span>
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  done
                    ? "text-white"
                    : active
                    ? "text-[#C4CEDB]"
                    : "text-[#5B6B82]"
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
