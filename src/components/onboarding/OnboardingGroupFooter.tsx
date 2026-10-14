import React from "react";
import { ArrowRight } from "lucide-react";

interface OnboardingGroupFooterProps {
  onNext: () => void;
  disabled?: boolean;
  label?: string;
  isLoading?: boolean;
}

/** Rodapé de continuação compartilhado pelas telas agrupadas do onboarding. */
export const OnboardingGroupFooter: React.FC<OnboardingGroupFooterProps> = ({
  onNext,
  disabled = false,
  label = "Continuar",
  isLoading = false,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 mt-8">
      <span className="text-xs text-[#718096] hidden sm:block">
        Você pode ajustar tudo depois
      </span>
      <button
        type="button"
        id="btn-onboarding-group-next"
        onClick={onNext}
        disabled={disabled || isLoading}
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#527DFF] hover:bg-[#FF7A1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
      >
        <span>{isLoading ? "Criando plano..." : label}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
