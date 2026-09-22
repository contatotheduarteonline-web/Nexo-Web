import React from "react";
import { ArrowRight, Check, Calendar as CalendarIcon } from "lucide-react";

interface Step4ExamDateProps {
  knowsExamDate?: boolean;
  examDate?: string;
  onChangeExamDateKnown: (known: boolean) => void;
  onChangeExamDate: (date: string) => void;
  onNext: () => void;
}

export const Step4ExamDate: React.FC<Step4ExamDateProps> = ({
  knowsExamDate,
  examDate = "",
  onChangeExamDateKnown,
  onChangeExamDate,
  onNext,
}) => {
  const canContinue =
    knowsExamDate === false ||
    (knowsExamDate === true && examDate.trim().length > 0);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div id="step-4-exam-date" className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#F59E0B] tracking-wider uppercase">
          Etapa 4 de 12
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          Você já sabe quando será sua prova?
        </h2>
      </div>

      {/* Two Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        <button
          type="button"
          id="btn-examdate-yes"
          onClick={() => onChangeExamDateKnown(true)}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            knowsExamDate === true
              ? "bg-zinc-800/90 border-[#F59E0B] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <span className={`text-base sm:text-lg font-medium ${knowsExamDate === true ? "text-white font-semibold" : "text-zinc-200"}`}>
            Sim
          </span>
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              knowsExamDate === true
                ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
          </div>
        </button>

        <button
          type="button"
          id="btn-examdate-no"
          onClick={() => onChangeExamDateKnown(false)}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            knowsExamDate === false
              ? "bg-zinc-800/90 border-[#F59E0B] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <span className={`text-base sm:text-lg font-medium ${knowsExamDate === false ? "text-white font-semibold" : "text-zinc-200"}`}>
            Ainda não
          </span>
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              knowsExamDate === false
                ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Date Selector - ONLY shown if YES */}
      {knowsExamDate === true && (
        <div className="mb-8 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 transition-all duration-200">
          <label htmlFor="input-onboarding-exam-date" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Data prevista da prova
          </label>
          <div className="relative">
            <input
              id="input-onboarding-exam-date"
              type="date"
              min={todayStr}
              value={examDate}
              onChange={(e) => onChangeExamDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-colors text-sm"
              autoFocus
            />
            <CalendarIcon className="absolute right-3.5 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          id="btn-exam-date-next"
          onClick={onNext}
          disabled={!canContinue || knowsExamDate === undefined}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#FF7A1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
