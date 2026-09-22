import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface StepProcessingProps {
  onFinished: () => void;
}

export const StepProcessing: React.FC<StepProcessingProps> = ({ onFinished }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Discreet progression sequence over ~1.3 seconds
    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 850);
    const t3 = setTimeout(() => {
      setStage(3);
      onFinished();
    }, 1350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinished]);

  return (
    <div
      id="onboarding-processing-screen"
      className="flex flex-col items-center justify-center text-center max-w-md mx-auto px-4 py-16"
    >
      {/* Brand Mark with subtle pulse */}
      <div className="mb-8 relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#E05300] flex items-center justify-center shadow-[0_12px_36px_rgba(255,107,0,0.35)] border border-[#FF8533]/40 animate-pulse">
          <span className="font-black text-4xl text-white select-none">
            N
          </span>
        </div>
      </div>

      {/* Clean Heading */}
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
        Preparando seu espaço de estudos...
      </h2>
      <p className="text-zinc-400 text-sm mb-8">
        Organizando seu primeiro plano e sua rotina personalizada.
      </p>

      {/* Discrete Progress Indicator */}
      <div className="w-full max-w-xs space-y-2.5">
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FFA043] transition-all duration-300 ease-out"
            style={{ width: stage === 0 ? "35%" : stage === 1 ? "75%" : "100%" }}
          />
        </div>

        {/* Step details */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
          <Check className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>
            {stage === 0
              ? "Salvando seu plano..."
              : stage === 1
              ? "Organizando sua rotina..."
              : "Pronto!"}
          </span>
        </div>
      </div>
    </div>
  );
};
