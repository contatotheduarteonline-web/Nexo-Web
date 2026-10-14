import React, { useState } from "react";
import { DisciplineDraftItem } from "../types";
import { Plus, X } from "lucide-react";

interface CatalogDisciplineOption {
  id: string;
  name: string;
  recommended: boolean;
  color: string;
}

interface Step8DisciplinesProps {
  disciplines: DisciplineDraftItem[];
  catalogDisciplines: CatalogDisciplineOption[];
  onToggleCatalogDiscipline: (item: CatalogDisciplineOption) => void;
  onAddDiscipline: (name: string) => void;
  onRemoveDiscipline: (id: string) => void;
}

export const Step8Disciplines: React.FC<Step8DisciplinesProps> = ({
  disciplines = [],
  catalogDisciplines = [],
  onToggleCatalogDiscipline,
  onAddDiscipline,
  onRemoveDiscipline,
}) => {
  const [inputValue, setInputValue] = useState("");

  const selectedIds = new Set(disciplines.map((d) => d.id));
  const selectedCount = disciplines.length;
  const customDisciplines = disciplines.filter(
    (d) => !catalogDisciplines.some((c) => c.id === d.id)
  );

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
    <div id="step-8-disciplines" className="w-full">
      {/* Question Header */}
      <div className="mb-5">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
          Com quais disciplinas você quer começar?
        </h2>
        <p className="text-sm text-[#93A2B7] mt-2">
          Escolha as disciplinas que entram no seu plano agora.
        </p>
      </div>

      {/* Selection counter */}
      <div className="mb-5 px-4 py-2.5 rounded-xl bg-[#111B2D] border border-[#263447] text-sm text-[#93A2B7]">
        <span className="font-bold text-white num-condensed">{selectedCount}</span>{" "}
        de{" "}
        <span className="font-bold text-white num-condensed">
          {catalogDisciplines.length + customDisciplines.length}
        </span>{" "}
        selecionadas
      </div>

      {/* Catalog disciplines */}
      {catalogDisciplines.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-bold text-[#93A2B7] uppercase tracking-wider mb-3">
            Disciplinas do edital
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catalogDisciplines.map((disc) => {
              const isSelected = selectedIds.has(disc.id);
              return (
                <button
                  key={disc.id}
                  type="button"
                  id={`discipline-card-${disc.id}`}
                  onClick={() => onToggleCatalogDiscipline(disc)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-[#1A2A4A] border-[#527DFF]"
                      : "bg-[#172235] border-[#263447] hover:bg-[#223149] hover:border-[#39475C]"
                  }`}
                >
                  <span
                    className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#527DFF] border-[#527DFF] text-white"
                        : "border-[#39475C] bg-transparent"
                    }`}
                  >
                    {isSelected ? (
                      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${disc.recommended ? "" : "opacity-60"}`} style={{ backgroundColor: disc.color }} />
                  <span className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-[#C4CEDB]"}`}>
                    {disc.name}
                  </span>
                  {disc.recommended && (
                    <span className="ml-auto shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#342B1C] text-[#F4B544] border border-[#725629]">
                      Recomendada
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual additions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#172235] border border-[#263447] space-y-4">
        <div className="flex gap-2">
          <input
            id="input-new-discipline"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={catalogDisciplines.length > 0 ? "Adicionar outra disciplina manualmente..." : "Nome da disciplina (ex: Português, Direito Constitucional...)"}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#111B2D] border border-[#2A3A52] text-white placeholder-[#718096] focus:outline-none focus:border-[#7DA2FF] focus:ring-1 focus:ring-[#7DA2FF]/40 text-sm"
          />
          <button
            type="button"
            id="btn-add-discipline"
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#527DFF] hover:bg-[#416CEB] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>

        {customDisciplines.length > 0 ? (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {customDisciplines.map((disc) => (
              <span
                key={disc.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111B2D] border border-[#2A3A52] text-white text-sm font-medium"
              >
                <span>{disc.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveDiscipline(disc.id)}
                  className="text-[#93A2B7] hover:text-[#F16D75] p-0.5 rounded transition-colors cursor-pointer"
                  title="Remover matéria"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#718096] italic">
            {catalogDisciplines.length > 0
              ? "Você também pode adicionar disciplinas extras manualmente."
              : "Selecione um edital na etapa Concurso ou adicione as disciplinas manualmente."}
          </p>
        )}
      </div>
    </div>
  );
};
