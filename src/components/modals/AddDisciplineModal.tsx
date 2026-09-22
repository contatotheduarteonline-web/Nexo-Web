import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { Discipline } from "../../types";
import { X, Plus, Sparkles, BookOpen, Layers } from "lucide-react";

interface AddDisciplineModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEditalId: string;
  targetPlanName?: string;
}

const PRESET_COLORS = [
  "#249D84",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
];

export const AddDisciplineModal: React.FC<AddDisciplineModalProps> = ({
  isOpen,
  onClose,
  targetEditalId,
  targetPlanName,
}) => {
  const { addDiscipline, addTopic } = useStudy();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#249D84");
  const [weight, setWeight] = useState<number>(2);
  const [priority, setPriority] = useState<"alta" | "media" | "baixa">("media");
  const [initialTopicsText, setInitialTopicsText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetEditalId) return;

    const newDiscId = `disc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const created = addDiscipline({
      id: newDiscId,
      editalId: targetEditalId,
      name: name.trim(),
      color,
      iconName: "BookOpen",
      priority,
      difficulty: "medio",
      weight,
      targetHours: 30,
      studiedHours: 0,
    });

    // Add initial topics if provided
    const lines = initialTopicsText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      lines.forEach((topicName) => {
        addTopic(created.id, topicName);
      });
    }

    // Reset & close
    setName("");
    setInitialTopicsText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h2 className="text-base font-bold text-white dark:text-white">
              Adicionar Nova Disciplina
            </h2>
            {targetPlanName && (
              <p className="text-xs text-white dark:text-white">
                Vinculando ao plano: <span className="font-semibold text-white dark:text-white">{targetPlanName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white hover:bg-zinc-200 hover:text-white dark:text-white dark:hover:bg-zinc-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nome */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                Nome da Disciplina *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Criminologia, Direito Penal Militar..."
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#249D84] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            {/* Cor */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                Cor de Identificação
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    style={{ backgroundColor: preset }}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      color === preset
                        ? "scale-115 ring-2 ring-offset-2 ring-[#249D84] dark:ring-offset-zinc-900"
                        : "hover:scale-105 opacity-80"
                    }`}
                  />
                ))}
                <div className="flex items-center gap-1.5 ml-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                    title="Cor personalizada"
                  />
                  <span className="font-mono text-[10px] text-white dark:text-white">
                    {color}
                  </span>
                </div>
              </div>
            </div>

            {/* Peso e Prioridade */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                  Peso no Ciclo
                </label>
                <div className="mt-1.5 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  {[1, 2, 3].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeight(w)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                        weight === w
                          ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                          : "text-white hover:text-white dark:text-white dark:hover:text-white"
                      }`}
                    >
                      Peso {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-bold text-white focus:border-[#249D84] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>

            {/* Tópicos Iniciais */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                  Tópicos Iniciais (Opcional)
                </label>
                <span className="text-[10px] text-white">Um por linha</span>
              </div>
              <textarea
                value={initialTopicsText}
                onChange={(e) => setInitialTopicsText(e.target.value)}
                rows={3}
                placeholder="Ex:&#10;Teoria Geral do Crime&#10;Tipicidade e Ilicitude&#10;Culpabilidade"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-white focus:border-[#249D84] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#249D84] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1F826D] shadow-xs transition"
              >
                Adicionar Disciplina
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};
