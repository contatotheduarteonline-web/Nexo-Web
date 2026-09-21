import React from "react";
import { ArrowRight, Check, BookOpen, Shield } from "lucide-react";
import { useStudy } from "../../../context/StudyContext";

interface Step3SpecificGoalProps {
  knowsSpecificGoal?: boolean;
  organ?: string;
  cargo?: string;
  banca?: string;
  onChangeGoalKnown: (known: boolean) => void;
  onChangeOrgan: (organ: string) => void;
  onChangeCargo: (cargo: string) => void;
  onChangeBanca: (banca: string) => void;
  onNext: () => void;
}

export const Step3SpecificGoal: React.FC<Step3SpecificGoalProps> = ({
  knowsSpecificGoal,
  organ = "",
  cargo = "",
  banca = "",
  onChangeGoalKnown,
  onChangeOrgan,
  onChangeCargo,
  onChangeBanca,
  onNext,
}) => {
  const { catalogEditais } = useStudy();

  // If user says "Sim, já sei", they should at least provide organ or cargo to continue, or if "Ainda estou decidindo", they can proceed immediately.
  const canContinue =
    knowsSpecificGoal === false ||
    (knowsSpecificGoal === true && (organ.trim().length > 0 || cargo.trim().length > 0));

  return (
    <div id="step-3-specific-goal" className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#FF6B00] tracking-wider uppercase">
          Etapa 3 de 12
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          Você já sabe qual concurso ou cargo quer estudar?
        </h2>
      </div>

      {/* Two Simple Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        <button
          type="button"
          id="btn-goal-yes"
          onClick={() => onChangeGoalKnown(true)}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            knowsSpecificGoal === true
              ? "bg-zinc-800/90 border-[#FF6B00] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <span className={`text-base sm:text-lg font-medium ${knowsSpecificGoal === true ? "text-white font-semibold" : "text-zinc-200"}`}>
            Sim, já sei
          </span>
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              knowsSpecificGoal === true
                ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
          </div>
        </button>

        <button
          type="button"
          id="btn-goal-deciding"
          onClick={() => onChangeGoalKnown(false)}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            knowsSpecificGoal === false
              ? "bg-zinc-800/90 border-[#FF6B00] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <span className={`text-base sm:text-lg font-medium ${knowsSpecificGoal === false ? "text-white font-semibold" : "text-zinc-200"}`}>
            Ainda estou decidindo
          </span>
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              knowsSpecificGoal === false
                ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Manual Input Fields / Catalog Selector - ONLY shown if YES */}
      {knowsSpecificGoal === true && (
        <div className="space-y-4 mb-8 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 transition-all duration-200">
          {/* Catalog Status Info */}
          {catalogEditais.length === 0 ? (
            <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/60 text-xs text-zinc-400 flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#FF6B00] shrink-0" />
              <span>Nenhum edital oficial cadastrado ainda. Preencha os campos abaixo para configurar seu concurso:</span>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Editais Oficiais Disponíveis no Catálogo
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {catalogEditais.map((ed) => (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => {
                      onChangeOrgan(ed.institution || ed.title);
                      if (ed.board) onChangeBanca(ed.board);
                    }}
                    className="p-2.5 text-left rounded-xl border border-zinc-700/70 bg-zinc-800/50 hover:border-[#FF6B00] hover:bg-zinc-800 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                      <span className="text-xs font-semibold text-white truncate">
                        {ed.institution}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 truncate block mt-0.5">
                      Ed. {ed.editalNumber}/{ed.year} • {ed.board || "Banca a definir"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label htmlFor="input-onboarding-organ" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Órgão / Concurso
            </label>
            <input
              id="input-onboarding-organ"
              type="text"
              value={organ}
              onChange={(e) => onChangeOrgan(e.target.value)}
              placeholder="Ex: Órgão ou instituição desejada..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-colors text-sm"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="input-onboarding-cargo" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Cargo
            </label>
            <input
              id="input-onboarding-cargo"
              type="text"
              value={cargo}
              onChange={(e) => onChangeCargo(e.target.value)}
              placeholder="Ex: Cargo ou função pretendida..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-colors text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="input-onboarding-banca" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Banca
              </label>
              <span className="text-[11px] text-zinc-500">Opcional</span>
            </div>
            <input
              id="input-onboarding-banca"
              type="text"
              value={banca}
              onChange={(e) => onChangeBanca(e.target.value)}
              placeholder="Ex: Cebraspe, FGV, FCC, Vunesp, etc."
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-colors text-sm"
            />
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          id="btn-specific-goal-next"
          onClick={onNext}
          disabled={!canContinue || knowsSpecificGoal === undefined}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
