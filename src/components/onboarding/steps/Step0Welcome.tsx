import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface Step0WelcomeProps {
  onStart: () => void;
  isStarting?: boolean;
}

export const Step0Welcome: React.FC<Step0WelcomeProps> = ({ onStart, isStarting = false }) => {
  return (
    <div
      id="step-0-welcome"
      className="flex flex-col items-center justify-center text-center max-w-xl mx-auto px-4 py-8 sm:py-12"
    >
      {/* NEXO Brand Mark */}
      <div className="mb-8 relative">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#F59E0B] via-[#FF5500] to-[#D94800] flex items-center justify-center shadow-[0_12px_36px_rgba(255,107,0,0.35)] border border-[#FF8533]/40 transition-transform duration-300 hover:scale-105">
          <span className="font-black text-4xl sm:text-5xl text-white tracking-wider select-none">
            N
          </span>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
          <Sparkles className="w-3 h-3 text-[#F59E0B]" />
          <span className="text-[10px] font-semibold text-zinc-300 tracking-wider">NEXO</span>
        </div>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-[1.15]">
        Vamos montar sua preparação.
      </h1>

      {/* Description */}
      <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-10 max-w-md">
        Responda algumas perguntas rápidas para organizarmos seu primeiro plano.
      </p>

      {/* CTA Button */}
      <button
        id="btn-onboarding-start"
        type="button"
        onClick={onStart}
        disabled={isStarting}
        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#F59E0B] hover:bg-[#FF7A1A] active:bg-[#E05300] text-white font-semibold text-base transition-all duration-200 shadow-[0_8px_24px_rgba(255,107,0,0.3)] hover:shadow-[0_12px_32px_rgba(255,107,0,0.45)] cursor-pointer disabled:opacity-50"
      >
        <span>Começar</span>
        <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
      </button>

      {/* Auxiliary text */}
      <p className="mt-4 text-xs text-zinc-500 font-normal">
        Você poderá alterar tudo depois.
      </p>
    </div>
  );
};
