import React from "react";
import { OnboardingDraft } from "../types";
import { Sparkles, ArrowRight } from "lucide-react";

interface Step12SummaryProps {
  draft: OnboardingDraft;
  weeklyHoursFormatted: string;
  startDateFormatted: string;
  examDateFormatted?: string;
  onCreatePlan: () => void;
  isCreating?: boolean;
}

export const Step12Summary: React.FC<Step12SummaryProps> = ({
  draft,
  weeklyHoursFormatted,
  startDateFormatted,
  examDateFormatted,
  onCreatePlan,
  isCreating = false,
}) => {
  // Format organ/cargo
  const organCargoText = [draft.organ?.trim(), draft.cargo?.trim()]
    .filter(Boolean)
    .join(" - ");

  // Organization label
  const organizationLabel =
    draft.organization === "semanal"
      ? "Planejamento Semanal"
      : draft.organization === "indeciso"
      ? "Configuração básica (ajustável)"
      : "Ciclo de Estudos";

  // Number of disciplines
  const disciplinesCount = draft.disciplines?.length || 0;
  const disciplinesText =
    disciplinesCount === 0
      ? "Nenhuma por enquanto (adicionar depois)"
      : disciplinesCount === 1
      ? "1 matéria adicionada"
      : `${disciplinesCount} matérias adicionadas`;

  return (
    <div id="step-12-summary" className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Title & Subtitle */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#F59E0B] tracking-wider uppercase">
          Etapa 12 de 12 • Resumo
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          Seu primeiro plano está pronto para ser criado.
        </h2>
        <p className="text-zinc-400 text-sm mt-2">
          Revise as informações principais antes de inicializar sua rotina.
        </p>
      </div>

      {/* Clean Structured Summary Card */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 divide-y divide-zinc-800/80 mb-8 shadow-xl">
        {/* Objetivo */}
        <div className="py-3.5 flex items-center justify-between first:pt-0">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Objetivo
          </span>
          <span className="text-sm font-semibold text-white">
            {draft.objective || "Não informado"}
          </span>
        </div>

        {/* Área (se informada) */}
        {draft.area && (
          <div className="py-3.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Área
            </span>
            <span className="text-sm font-semibold text-white">
              {draft.area}
            </span>
          </div>
        )}

        {/* Órgão / Cargo (se informado) */}
        {organCargoText && (
          <div className="py-3.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Concurso / Cargo
            </span>
            <span className="text-sm font-semibold text-white text-right max-w-[60%] truncate">
              {organCargoText}
            </span>
          </div>
        )}

        {/* Data da Prova (se informada) */}
        {examDateFormatted && (
          <div className="py-3.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Data da Prova
            </span>
            <span className="text-sm font-semibold text-white">
              {examDateFormatted}
            </span>
          </div>
        )}

        {/* Carga Semanal */}
        <div className="py-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Carga Semanal
          </span>
          <span className="text-sm font-bold text-[#F59E0B] font-mono">
            {weeklyHoursFormatted}
          </span>
        </div>

        {/* Disciplinas */}
        <div className="py-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Disciplinas
          </span>
          <span className="text-sm font-semibold text-white">
            {disciplinesText}
          </span>
        </div>

        {/* Organização */}
        <div className="py-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Organização
          </span>
          <span className="text-sm font-semibold text-white">
            {organizationLabel}
          </span>
        </div>

        {/* Início */}
        <div className="py-3.5 flex items-center justify-between last:pb-0">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Data de Início
          </span>
          <span className="text-sm font-semibold text-white">
            {startDateFormatted}
          </span>
        </div>
      </div>

      {/* Primary CTA Button: Criar meu plano */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          id="btn-create-my-plan"
          onClick={onCreatePlan}
          disabled={isCreating}
          className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#F59E0B] hover:bg-[#FF7A1A] active:bg-[#E05300] disabled:opacity-50 text-white font-semibold text-base transition-all duration-200 cursor-pointer shadow-[0_8px_24px_rgba(255,107,0,0.35)]"
        >
          <span>Criar meu plano</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-zinc-500 text-center">
          Você poderá editar ou adicionar matérias a qualquer momento.
        </p>
      </div>
    </div>
  );
};
