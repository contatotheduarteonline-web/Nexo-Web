import React, { useState } from "react";
import { DisciplineDraftItem } from "../types";
import { ArrowRight, Plus, X, BookOpen, HelpCircle } from "lucide-react";

interface Step8DisciplinesProps {
  disciplinesMode?: "adicionar" | "nao_sei";
  disciplines: DisciplineDraftItem[];
  onChangeMode: (mode: "adicionar" | "nao_sei") => void;
  onAddDiscipline: (name: string) => void;
  onRemoveDiscipline: (id: string) => void;
  onNext: () => void;
}

export const Step8Disciplines: React.FC<Step8DisciplinesProps> = ({
  disciplinesMode,
  disciplines = [],
  onChangeMode,
  onAddDiscipline,
  onRemoveDiscipline,
  onNext,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onAddDiscipline(trimmed);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div id="step-8-disciplines" className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Question Header */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-semibold text-[#FF6B00] tracking-wider uppercase">
          Etapa 8 de 12
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
          Quais matérias você já pretende estudar?
        </h2>
      </div>

      {/* Two Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        <button
          type="button"
          id="btn-disciplines-add-mode"
          onClick={() => onChangeMode("adicionar")}
          className={`flex items-center gap-3 p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            disciplinesMode === "adicionar"
              ? "bg-zinc-800/90 border-[#FF6B00] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              disciplinesMode === "adicionar"
                ? "bg-[#FF6B00] text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-base font-semibold ${disciplinesMode === "adicionar" ? "text-white" : "text-zinc-200"}`}>
              Adicionar minhas disciplinas
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Informe as matérias que você já planejou
            </div>
          </div>
        </button>

        <button
          type="button"
          id="btn-disciplines-unknown-mode"
          onClick={() => onChangeMode("nao_sei")}
          className={`flex items-center gap-3 p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            disciplinesMode === "nao_sei"
              ? "bg-zinc-800/90 border-[#FF6B00] shadow-[0_0_18px_rgba(255,107,0,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              disciplinesMode === "nao_sei"
                ? "bg-[#FF6B00] text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-base font-semibold ${disciplinesMode === "nao_sei" ? "text-white" : "text-zinc-200"}`}>
              Ainda não sei
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Você pode começar e adicionar disciplinas depois
            </div>
          </div>
        </button>
      </div>

      {/* Adding disciplines section */}
      {disciplinesMode === "adicionar" && (
        <div className="mb-8 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex gap-2">
            <input
              id="input-new-discipline"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nome da disciplina (ex: Português, Direito Constitucional...)"
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] text-sm"
              autoFocus
            />
            <button
              type="button"
              id="btn-add-discipline"
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>

          {/* Chips list */}
          {disciplines.length > 0 ? (
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                Disciplinas adicionadas ({disciplines.length}):
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {disciplines.map((disc) => (
                  <span
                    key={disc.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/70 text-zinc-100 text-sm font-medium shadow-sm"
                  >
                    <span>{disc.name}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveDiscipline(disc.id)}
                      className="text-zinc-400 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                      title="Remover matéria"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">
              Nenhuma matéria adicionada ainda. Digite o nome acima e clique em Adicionar.
            </p>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          id="btn-disciplines-next"
          onClick={onNext}
          disabled={!disciplinesMode}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-[0_6px_20px_rgba(255,107,0,0.25)]"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
