import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

interface Step4ExamDateProps {
  knowsExamDate?: boolean;
  examDate?: string;
  onChangeExamDateKnown: (known: boolean) => void;
  onChangeExamDate: (date: string) => void;
}

export const Step4ExamDate: React.FC<Step4ExamDateProps> = ({
  knowsExamDate,
  examDate = "",
  onChangeExamDateKnown,
  onChangeExamDate,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div id="step-4-exam-date" className="w-full">
      {/* Section label */}
      <p className="text-sm font-bold text-white mb-3">Você já sabe a data da prova?</p>

      {/* Choice Chips */}
      <div className="flex flex-wrap gap-2.5 mb-3">
        <button
          type="button"
          id="btn-examdate-yes"
          onClick={() => onChangeExamDateKnown(true)}
          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer ${
            knowsExamDate === true
              ? "bg-[#527DFF] border-[#527DFF] text-white"
              : "bg-[#172235] border-[#263447] text-[#C4CEDB] hover:border-[#527DFF]/60 hover:text-white"
          }`}
        >
          Sim, já sei
        </button>
        <button
          type="button"
          id="btn-examdate-no"
          onClick={() => onChangeExamDateKnown(false)}
          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer ${
            knowsExamDate === false
              ? "bg-[#527DFF] border-[#527DFF] text-white"
              : "bg-[#172235] border-[#263447] text-[#C4CEDB] hover:border-[#527DFF]/60 hover:text-white"
          }`}
        >
          Ainda não
        </button>
      </div>

      {/* Date Selector - ONLY shown if YES */}
      {knowsExamDate === true && (
        <div className="mb-3 p-4 rounded-xl bg-[#111B2D] border border-[#263447]">
          <label htmlFor="input-onboarding-exam-date" className="block text-xs font-semibold text-[#C4CEDB] uppercase tracking-wider mb-2">
            Data prevista da prova
          </label>
          <div className="relative">
            <input
              id="input-onboarding-exam-date"
              type="date"
              min={todayStr}
              value={examDate}
              onChange={(e) => onChangeExamDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#172235] border border-[#2A3A52] text-white focus:outline-none focus:border-[#7DA2FF] focus:ring-1 focus:ring-[#7DA2FF]/40 transition-colors text-sm"
              autoFocus
            />
            <CalendarIcon className="absolute right-3.5 top-3.5 w-4 h-4 text-[#718096] pointer-events-none" />
          </div>
        </div>
      )}

      {knowsExamDate === false && (
        <p className="text-xs text-[#718096]">
          Sem problema. Quando o edital sair, é só adicionar a data dentro do NEXO.
        </p>
      )}
    </div>
  );
};
