import React, { useState } from "react";
import { X, Layers, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface BatchTopicsModalProps {
  isOpen: boolean;
  disciplineName: string;
  onClose: () => void;
  onAddTopics: (topics: string[]) => void;
}

export const BatchTopicsModal: React.FC<BatchTopicsModalProps> = ({
  isOpen,
  disciplineName,
  onClose,
  onAddTopics,
}) => {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const validTopics = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleConfirm = () => {
    if (validTopics.length > 0) {
      onAddTopics(validTopics);
      setText("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
      <div className="w-full max-w-2xl sm:max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#249D84]/10 p-2.5 text-[#249D84]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Adicionar Tópicos em Lote
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Disciplina:{" "}
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {disciplineName}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Cole ou digite os tópicos (um por linha):
            </label>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                  validTopics.length > 0
                    ? "bg-[#249D84]/15 text-[#249D84] dark:bg-[#249D84]/25"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {validTopics.length > 0 && <CheckCircle2 className="h-3 w-3" />}
                {validTopics.length}{" "}
                {validTopics.length === 1 ? "tópico detectado" : "tópicos detectados"}
              </span>
              {text.trim() && (
                <button
                  type="button"
                  onClick={() => setText("")}
                  className="text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1 transition cursor-pointer"
                  title="Limpar texto"
                >
                  <Trash2 className="h-3 w-3" />
                  Limpar
                </button>
              )}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && validTopics.length > 0) {
                e.preventDefault();
                handleConfirm();
              }
            }}
            placeholder={
              "Exemplo:\n1. Interpretação e compreensão de textos\n2. Ortografia oficial e acentuação gráfica\n3. Emprego das classes de palavras\n4. Concordância verbal e nominal\n5. Regência verbal e nominal\n6. Crase"
            }
            rows={13}
            className="w-full min-h-[280px] sm:min-h-[340px] rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs sm:text-sm font-mono leading-relaxed text-zinc-900 focus:border-[#249D84] focus:bg-white focus:outline-hidden dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900 resize-y shadow-inner"
          />

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              Cada linha não vazia será convertida em um tópico individual na ordem fornecida.
            </span>
            <span className="hidden sm:inline font-mono text-[10px]">
              Dica: Ctrl + Enter para confirmar
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={validTopics.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-[#249D84] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1f8771] disabled:opacity-50 disabled:pointer-events-none transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Adicionar {validTopics.length > 0 ? `${validTopics.length} Tópicos` : "Tópicos"}
          </button>
        </div>
      </div>
    </div>
  );
};

