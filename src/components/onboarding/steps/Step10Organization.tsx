import React from "react";
import { OrganizationPreference } from "../types";
import { ArrowRight, Check, Compass, Calendar, Sparkles } from "lucide-react";

interface Step10OrganizationProps {
  value?: OrganizationPreference;
  onChange: (value: OrganizationPreference) => void;
  onNext: () => void;
}

export const Step10Organization: React.FC<Step10OrganizationProps> = ({
  value,
  onChange,
  onNext,
}) => {
  return (
    <div id="step-10-organization" className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#F59E0B] tracking-wider uppercase">
          Etapa 10 de 12
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          Como você prefere organizar seus estudos?
        </h2>
      </div>

      {/* Options Stack */}
      <div className="space-y-3.5 mb-8">
        {/* Ciclo de estudos */}
        <button
          type="button"
          id="btn-org-ciclo"
          onClick={() => onChange("ciclo")}
          className={`w-full flex items-start justify-between p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            value === "ciclo"
              ? "bg-zinc-800/90 border-[#F59E0B] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-start gap-3.5 pr-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                value === "ciclo" ? "bg-[#F59E0B] text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-base sm:text-lg font-semibold ${value === "ciclo" ? "text-white" : "text-zinc-100"}`}>
                Ciclo de Estudos
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                Você segue uma sequência de matérias e continua de onde parou.
              </p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
              value === "ciclo"
                ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3 h-3" />
          </div>
        </button>

        {/* Planejamento Semanal */}
        <button
          type="button"
          id="btn-org-semanal"
          onClick={() => onChange("semanal")}
          className={`w-full flex items-start justify-between p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            value === "semanal"
              ? "bg-zinc-800/90 border-[#F59E0B] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-start gap-3.5 pr-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                value === "semanal" ? "bg-[#F59E0B] text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-base sm:text-lg font-semibold ${value === "semanal" ? "text-white" : "text-zinc-100"}`}>
                Planejamento Semanal
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                Você organiza matérias específicas para cada dia.
              </p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
              value === "semanal"
                ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3 h-3" />
          </div>
        </button>

        {/* Ainda não sei */}
        <button
          type="button"
          id="btn-org-indeciso"
          onClick={() => onChange("indeciso")}
          className={`w-full flex items-start justify-between p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            value === "indeciso"
              ? "bg-zinc-800/90 border-[#F59E0B] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-start gap-3.5 pr-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                value === "indeciso" ? "bg-[#F59E0B] text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-base sm:text-lg font-semibold ${value === "indeciso" ? "text-white" : "text-zinc-100"}`}>
                Ainda não sei
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                O NEXO pode começar com uma configuração básica, que você poderá alterar.
              </p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
              value === "indeciso"
                ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3 h-3" />
          </div>
        </button>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end">
        <button
          type="button"
          id="btn-org-next"
          onClick={onNext}
          disabled={!value}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#FF7A1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
