import React, { useState, useEffect } from "react";
import { useStudy } from "../../context/StudyContext";
import { Discipline, Topic } from "../../types";
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Edit2,
  Check,
  CheckCircle2,
  Clock,
  Circle,
  Lock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  DISTINCT_DISCIPLINE_COLORS,
  areColorsEqual,
  getNextAvailableDisciplineColor,
  normalizeHex,
} from "../../utils/disciplineColors";

interface EditDisciplineModalProps {
  discipline: Discipline | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = DISTINCT_DISCIPLINE_COLORS;

interface EditableTopicItem {
  id: string;
  name: string;
  isStudied: boolean;
  notes?: string;
  isNew?: boolean;
}

export const EditDisciplineModal: React.FC<EditDisciplineModalProps> = ({
  discipline,
  isOpen,
  onClose,
}) => {
  const {
    activeEdital,
    editais,
    updateDiscipline,
    deleteDiscipline,
    addTopic,
    updateTopic,
    deleteTopic,
  } = useStudy();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#249D84");
  const [weight, setWeight] = useState<number>(2);
  const [priority, setPriority] = useState<"alta" | "media" | "baixa">("media");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Local topics state for editing & reordering
  const [topicList, setTopicList] = useState<EditableTopicItem[]>([]);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicText, setEditingTopicText] = useState("");
  const [newTopicInput, setNewTopicInput] = useState("");
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  useEffect(() => {
    if (discipline && isOpen) {
      setName(discipline.name);
      setColor(discipline.color || "#249D84");
      setWeight(discipline.weight || 2);
      setPriority((discipline.priority as any) || "media");
      setIsConfirmingDelete(false);
      setIsAddingTopic(false);
      setNewTopicInput("");
      setEditingTopicId(null);

      // Look in activeEdital or find the edital that owns this discipline
      const targetEdital =
        activeEdital?.disciplines.some((d) => d.id === discipline.id)
          ? activeEdital
          : editais.find((e) => e.disciplines.some((d) => d.id === discipline.id)) || activeEdital;

      const currentTopics = (targetEdital?.topics || [])
        .filter((t) => t.disciplineId === discipline.id)
        .map((t) => ({
          id: t.id,
          name: t.name,
          isStudied: !!t.isStudied,
          notes: t.notes,
        }));

      setTopicList(currentTopics);
    }
  }, [discipline, isOpen, activeEdital, editais]);

  if (!isOpen || !discipline) return null;

  // Move topic up / down
  const moveTopic = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= topicList.length) return;

    const newList = [...topicList];
    const item = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = item;
    setTopicList(newList);
  };

  // Add new topic locally
  const handleAddNewTopic = () => {
    if (!newTopicInput.trim()) return;
    const tempId = `temp-${Date.now()}`;
    setTopicList((prev) => [
      ...prev,
      { id: tempId, name: newTopicInput.trim(), isStudied: false, isNew: true },
    ]);
    setNewTopicInput("");
    setIsAddingTopic(false);
  };

  // Toggle studied status
  const toggleTopicStatus = (id: string) => {
    setTopicList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isStudied: !t.isStudied } : t))
    );
  };

  // Remove topic
  const handleRemoveTopic = (id: string) => {
    setTopicList((prev) => prev.filter((t) => t.id !== id));
  };

  // Start inline editing of a topic
  const startEditingTopic = (item: EditableTopicItem) => {
    setEditingTopicId(item.id);
    setEditingTopicText(item.name);
  };

  // Save inline edit of topic
  const saveEditingTopic = (id: string) => {
    if (!editingTopicText.trim()) return;
    setTopicList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: editingTopicText.trim() } : t))
    );
    setEditingTopicId(null);
    setEditingTopicText("");
  };

  // Save changes to discipline and topics
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !discipline) return;

    const targetEdital =
      activeEdital?.disciplines.some((d) => d.id === discipline.id)
        ? activeEdital
        : editais.find((e) => e.disciplines.some((d) => d.id === discipline.id)) || activeEdital;

    const otherDisciplines = (targetEdital?.disciplines || []).filter(
      (d) => d.id !== discipline.id
    );
    if (otherDisciplines.some((d) => areColorsEqual(d.color || "", color))) {
      return; // Bloqueado: nunca pode repetir a cor
    }

    // 1. Update discipline info
    updateDiscipline(discipline.id, {
      name: name.trim(),
      color,
      weight,
      priority,
    });

    const existingTopics = (targetEdital?.topics || []).filter(
      (t) => t.disciplineId === discipline.id
    );
    const retainedIds = new Set(topicList.map((t) => t.id));

    // 2. Delete removed topics
    existingTopics.forEach((t) => {
      if (!retainedIds.has(t.id)) {
        deleteTopic(t.id);
      }
    });

    // 3. Update existing or create new topics
    topicList.forEach((item) => {
      if (item.isNew || item.id.startsWith("temp-")) {
        addTopic(discipline.id, item.name);
      } else {
        const original = existingTopics.find((t) => t.id === item.id);
        if (original && (original.name !== item.name || original.isStudied !== item.isStudied)) {
          updateTopic(item.id, {
            name: item.name,
            isStudied: item.isStudied,
          });
        }
      }
    });

    onClose();
  };

  // Delete entire discipline
  const handleDelete = () => {
    deleteDiscipline(discipline.id);
    setIsConfirmingDelete(false);
    onClose();
  };

  const completedCount = topicList.filter((t) => t.isStudied).length;
  const progressPct = topicList.length > 0 ? Math.round((completedCount / topicList.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header with color badge */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <span
              className="h-3.5 w-3.5 rounded-full shadow-xs"
              style={{ backgroundColor: color }}
            />
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {isConfirmingDelete ? "Excluir Disciplina" : "Editar Disciplina"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {discipline.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isConfirmingDelete ? (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
                Excluir disciplina "{discipline.name}"?
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                Todos os tópicos, histórico de estudo e métricas vinculadas a esta disciplina serão excluídos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
            {/* Input Nome */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Nome da Disciplina
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Direito Constitucional"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:border-[#249D84] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            {/* Seletor de Cor com Métrica de Cores Únicas */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Cor da Disciplina
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">
                    Cores exclusivas (sem repetição)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const otherDisciplines = (
                        (activeEdital?.disciplines.some((d) => d.id === discipline.id)
                          ? activeEdital
                          : editais.find((e) => e.disciplines.some((d) => d.id === discipline.id)) || activeEdital)?.disciplines || []
                      ).filter((d) => d.id !== discipline.id);
                      const used = otherDisciplines.map((d) => d.color || "#249D84");
                      setColor(getNextAvailableDisciplineColor(used));
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#249D84] hover:underline cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    Sugerir única
                  </button>
                </div>
              </div>

              {(() => {
                const targetEd =
                  activeEdital?.disciplines.some((d) => d.id === discipline.id)
                    ? activeEdital
                    : editais.find((e) => e.disciplines.some((d) => d.id === discipline.id)) || activeEdital;
                const otherDisciplines = (targetEd?.disciplines || []).filter(
                  (d) => d.id !== discipline.id
                );
                const colorConflict = otherDisciplines.find((d) => areColorsEqual(d.color || "", color));

                return (
                  <>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-850/50">
                      {PRESET_COLORS.map((preset) => {
                        const conflictWith = otherDisciplines.find((d) =>
                          areColorsEqual(d.color || "", preset)
                        );
                        const isTaken = Boolean(conflictWith);
                        const isSelected = areColorsEqual(color, preset);

                        return (
                          <button
                            key={preset}
                            type="button"
                            disabled={isTaken}
                            onClick={() => !isTaken && setColor(preset)}
                            style={{ backgroundColor: preset }}
                            title={
                              isTaken
                                ? `Em uso por: ${conflictWith?.name}`
                                : isSelected
                                ? "Cor selecionada"
                                : `Disponível (${preset})`
                            }
                            className={`relative h-6.5 w-6.5 rounded-full flex items-center justify-center transition-all ${
                              isTaken
                                ? "opacity-25 cursor-not-allowed"
                                : isSelected
                                ? "scale-115 ring-2 ring-offset-2 ring-[#249D84] dark:ring-offset-zinc-900 shadow-xs cursor-pointer"
                                : "hover:scale-110 opacity-90 cursor-pointer"
                            }`}
                          >
                            {isTaken && <Lock className="h-2.5 w-2.5 text-white" />}
                            {isSelected && !isTaken && (
                              <Check className="h-3 w-3 text-white stroke-[3]" />
                            )}
                          </button>
                        );
                      })}
                      <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-700">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="h-6 w-6 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                          title="Cor personalizada"
                        />
                        <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                          {normalizeHex(color)}
                        </span>
                      </div>
                    </div>

                    {colorConflict && (
                      <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                          A cor selecionada já pertence à matéria <strong>{colorConflict.name}</strong>. Matérias nunca podem repetir cor.
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Peso e Prioridade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
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
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      Peso {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-bold text-zinc-900 focus:border-[#249D84] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>

            {/* Seção TÓPICOS */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Tópicos ({topicList.length})
                  </label>
                  {topicList.length > 0 && (
                    <span className="text-[10px] font-semibold bg-[#249D84]/10 text-[#249D84] px-2 py-0.5 rounded-full">
                      {completedCount} concluídos ({progressPct}%)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingTopic(true)}
                  className="flex items-center gap-1 text-xs font-bold text-[#249D84] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Adicionar Tópico</span>
                </button>
              </div>

              {/* Add topic inline input */}
              {isAddingTopic && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#249D84] bg-[#249D84]/5 p-2 dark:bg-[#249D84]/10">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewTopic();
                      }
                    }}
                    placeholder="Nome do novo tópico..."
                    autoFocus
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewTopic}
                    className="rounded-lg bg-[#249D84] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1F826D] transition"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTopic(false);
                      setNewTopicInput("");
                    }}
                    className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Lista de Tópicos */}
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {topicList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    Nenhum tópico cadastrado nesta matéria.
                  </div>
                ) : (
                  topicList.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-850"
                    >
                      {/* Left: Reorder + Status Toggle + Topic Name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Reorder Buttons */}
                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveTopic(idx, "up")}
                            className="text-zinc-400 hover:text-zinc-800 disabled:opacity-20 dark:hover:text-white"
                            title="Mover para cima"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === topicList.length - 1}
                            onClick={() => moveTopic(idx, "down")}
                            className="text-zinc-400 hover:text-zinc-800 disabled:opacity-20 dark:hover:text-white"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Status Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleTopicStatus(item.id)}
                          className={`p-1 rounded-md transition ${
                            item.isStudied
                              ? "text-[#249D84] hover:text-[#1F826D]"
                              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                          }`}
                          title={item.isStudied ? "Marcado como concluído (clique para desmarcar)" : "Marcar como concluído"}
                        >
                          {item.isStudied ? (
                            <CheckCircle2 className="h-4 w-4 fill-[#249D84]/15" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>

                        {editingTopicId === item.id ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="text"
                              value={editingTopicText}
                              onChange={(e) => setEditingTopicText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  saveEditingTopic(item.id);
                                }
                              }}
                              autoFocus
                              className="w-full rounded-lg border border-[#249D84] bg-white px-2 py-1 text-xs text-zinc-900 dark:bg-zinc-800 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => saveEditingTopic(item.id)}
                              className="rounded p-1 text-[#249D84] hover:bg-[#249D84]/10"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`font-medium truncate ${
                              item.isStudied
                                ? "line-through text-zinc-400 dark:text-zinc-500"
                                : "text-zinc-900 dark:text-white"
                            }`}
                          >
                            {item.name}
                          </span>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {editingTopicId !== item.id && (
                          <button
                            type="button"
                            onClick={() => startEditingTopic(item)}
                            className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition"
                            title="Editar nome"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(item.id)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 transition"
                          title="Excluir tópico"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir Disciplina</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={(() => {
                    const targetEd =
                      activeEdital?.disciplines.some((d) => d.id === discipline?.id)
                        ? activeEdital
                        : editais.find((e) => e.disciplines.some((d) => d.id === discipline?.id)) || activeEdital;
                    const otherDisciplines = (targetEd?.disciplines || []).filter(
                      (d) => d.id !== discipline?.id
                    );
                    return otherDisciplines.some((d) => areColorsEqual(d.color || "", color));
                  })()}
                  className="rounded-xl bg-[#249D84] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1F826D] shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
