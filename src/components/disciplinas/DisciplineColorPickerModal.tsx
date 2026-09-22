import React, { useState, useEffect } from "react";
import { X, Check, Lock, Sparkles, AlertCircle } from "lucide-react";
import {
  DISTINCT_DISCIPLINE_COLORS,
  areColorsEqual,
  getNextAvailableDisciplineColor,
  normalizeHex,
} from "../../utils/disciplineColors";

export interface UsedDisciplineColor {
  id: string;
  name: string;
  color: string;
}

interface DisciplineColorPickerModalProps {
  isOpen: boolean;
  disciplineId: string;
  disciplineName: string;
  currentColor: string;
  otherDisciplines: UsedDisciplineColor[];
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

export const DisciplineColorPickerModal: React.FC<DisciplineColorPickerModalProps> = ({
  isOpen,
  disciplineId,
  disciplineName,
  currentColor,
  otherDisciplines,
  onSelectColor,
  onClose,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(currentColor || "#249D84");
  const [customHex, setCustomHex] = useState<string>(currentColor || "#249D84");

  useEffect(() => {
    if (isOpen) {
      const clean = normalizeHex(currentColor || "#249D84");
      setSelectedColor(clean);
      setCustomHex(clean);
    }
  }, [isOpen, currentColor]);

  if (!isOpen) return null;

  // Encontra se uma cor já está ocupada por OUTRA matéria
  const getDisciplineUsingColor = (colorToCheck: string): UsedDisciplineColor | undefined => {
    return otherDisciplines.find(
      (d) => d.id !== disciplineId && areColorsEqual(d.color, colorToCheck)
    );
  };

  const currentConflict = getDisciplineUsingColor(selectedColor);
  const isDuplicate = Boolean(currentConflict);

  const handleApply = (colorToApply: string) => {
    const conflict = getDisciplineUsingColor(colorToApply);
    if (conflict) return; // Regra estrita: nunca pode repetir a cor!
    onSelectColor(normalizeHex(colorToApply));
    onClose();
  };

  const handleSuggestNext = () => {
    const used = otherDisciplines
      .filter((d) => d.id !== disciplineId)
      .map((d) => d.color);
    const nextColor = getNextAvailableDisciplineColor(used);
    setSelectedColor(nextColor);
    setCustomHex(nextColor);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-[#252B38] transition-all">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span
              className="h-4 w-4 rounded-full ring-2 ring-zinc-300 dark:ring-zinc-650 shrink-0"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white dark:text-white truncate">
                Alterar Cor da Matéria
              </h3>
              <p className="text-xs text-white dark:text-white truncate">
                {disciplineName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white hover:bg-zinc-100 hover:text-white dark:hover:bg-zinc-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Prévia e Métrica */}
        <div className="my-3.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-full shadow-sm flex items-center justify-center text-white"
              style={{ backgroundColor: selectedColor }}
            >
              <Check className="h-4 w-4 drop-shadow-xs" />
            </div>
            <div>
              <span className="text-xs font-bold text-white dark:text-white block">
                {isDuplicate ? "Cor em conflito" : "Cor exclusiva selecionada"}
              </span>
              <span className="text-[11px] font-mono text-white">
                {normalizeHex(selectedColor).toUpperCase()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSuggestNext}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#249D84] hover:text-[#1d7e6a] bg-[#249D84]/10 hover:bg-[#249D84]/20 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            title="Calcular próxima cor única automaticamente"
          >
            <Sparkles className="h-3 w-3" />
            Sugerir automática
          </button>
        </div>

        {/* Alerta de conflito de cor */}
        {isDuplicate && currentConflict && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">Cor não permitida (repetida):</p>
              <p className="text-[11px] mt-0.5">
                Esta cor já pertence à matéria{" "}
                <span className="font-bold underline">{currentConflict.name}</span>. Cada matéria deve possuir uma cor única e exclusiva.
              </p>
            </div>
          </div>
        )}

        {/* Grade de Cores da Paleta */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
              Paleta de Cores Disponíveis
            </label>
            <span className="text-[10px] text-white">
              {otherDisciplines.length} matérias cadastradas
            </span>
          </div>

          <div className="grid grid-cols-8 gap-2 p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50">
            {DISTINCT_DISCIPLINE_COLORS.map((preset) => {
              const conflictWith = getDisciplineUsingColor(preset);
              const isTaken = Boolean(conflictWith);
              const isCurrent = areColorsEqual(selectedColor, preset);

              return (
                <button
                  key={preset}
                  type="button"
                  disabled={isTaken}
                  onClick={() => {
                    if (!isTaken) {
                      setSelectedColor(preset);
                      setCustomHex(preset);
                    }
                  }}
                  style={{ backgroundColor: preset }}
                  title={
                    isTaken
                      ? `Indisponível: já em uso por "${conflictWith?.name}"`
                      : isCurrent
                      ? "Cor selecionada"
                      : `Disponível (${preset})`
                  }
                  className={`relative h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                    isTaken
                      ? "opacity-25 cursor-not-allowed grayscale-30"
                      : isCurrent
                      ? "scale-115 ring-2 ring-offset-2 ring-[#249D84] dark:ring-offset-zinc-900 shadow-md cursor-pointer"
                      : "hover:scale-110 cursor-pointer shadow-2xs opacity-90 hover:opacity-100"
                  }`}
                >
                  {isTaken && <Lock className="h-3 w-3 text-white drop-shadow-xs" />}
                  {isCurrent && !isTaken && <Check className="h-3.5 w-3.5 text-white drop-shadow-xs stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seleção Manual / Hex */}
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedColor(val);
                setCustomHex(val);
              }}
              className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
              title="Seletor livre de cor"
            />
            <input
              type="text"
              value={customHex}
              maxLength={7}
              onChange={(e) => {
                const val = e.target.value;
                setCustomHex(val);
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                  setSelectedColor(val);
                }
              }}
              placeholder="#000000"
              className="w-24 font-mono text-xs uppercase rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDuplicate}
              onClick={() => handleApply(selectedColor)}
              className="rounded-xl bg-[#249D84] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#1f8771] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
            >
              Aplicar Cor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
