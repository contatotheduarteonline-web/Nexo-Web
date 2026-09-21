import React, { useState, useEffect } from "react";
import { useStudy } from "../../context/StudyContext";
import { Plus, Trash2, X } from "lucide-react";

interface NewTopicModalProps {
  isOpen: boolean;
  disciplineId?: string;
  onClose: () => void;
}

export const NewTopicModal: React.FC<NewTopicModalProps> = ({
  isOpen,
  disciplineId: initialDisciplineId,
  onClose,
}) => {
  const { activeEdital, addTopic } = useStudy();

  const [disciplineId, setDisciplineId] = useState(initialDisciplineId || "");
  const [topicName, setTopicName] = useState("");
  const [subtopics, setSubtopics] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialDisciplineId) {
      setDisciplineId(initialDisciplineId);
    } else if (activeEdital && activeEdital.disciplines.length > 0) {
      setDisciplineId(activeEdital.disciplines[0].id);
    }
  }, [initialDisciplineId, activeEdital]);

  if (!isOpen) return null;

  const handleAddSubtopicField = () => {
    setSubtopics([...subtopics, ""]);
  };

  const handleSubtopicChange = (index: number, val: string) => {
    const updated = [...subtopics];
    updated[index] = val;
    setSubtopics(updated);
  };

  const handleRemoveSubtopic = (index: number) => {
    setSubtopics(subtopics.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !disciplineId) {
      alert("Preencha o nome do tópico e selecione a disciplina.");
      return;
    }

    const cleanSubtopics = subtopics.map((s) => s.trim()).filter((s) => s.length > 0);

    addTopic({
      disciplineId,
      name: topicName.trim(),
      subtopics: cleanSubtopics,
      notes: notes.trim(),
      isStudied: false,
      isReviewed: false,
      reviewCount: 0,
      questionsDone: 0,
      questionsCorrect: 0,
      accuracyRate: 0,
      masteryRate: 0,
    });

    setTopicName("");
    setSubtopics([""]);
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Adicionar Assunto / Tópico do Edital
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Disciplina Pertencente
            </label>
            <select
              value={disciplineId}
              onChange={(e) => setDisciplineId(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {activeEdital?.disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Nome do Tópico / Conteúdo
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Direitos e Deveres Individuais e Coletivos (Art. 5º da CF)"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Subtópicos Detalhados
              </label>
              <button
                type="button"
                onClick={handleAddSubtopicField}
                className="flex items-center gap-1 text-[11px] font-bold text-[#F59E0B] hover:underline cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Adicionar Subtópico
              </button>
            </div>

            <div className="mt-2 space-y-2 max-h-36 overflow-y-auto pr-1">
              {subtopics.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Subtópico ${idx + 1} (Ex: Mandado de Segurança, Habeas Corpus...)`}
                    value={sub}
                    onChange={(e) => handleSubtopicChange(idx, e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 p-2 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {subtopics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtopic(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Anotações Iniciais de Lei Seca / Pegadinhas (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Atenção ao Art. 5º, XI (Inviolabilidade do domicílio à noite apenas com flagrante ou desastre)."
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-4 py-2 font-bold text-white shadow-md shadow-amber-500/25 transition cursor-pointer"
            >
              Salvar no Edital
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
