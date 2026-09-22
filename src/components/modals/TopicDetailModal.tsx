import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { Topic, Discipline } from "../../types";
import {
  X,
  Clock,
  CheckCircle2,
  Play,
  RotateCw,
  Edit3,
  BookOpen,
  Calendar,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";

interface TopicDetailModalProps {
  topic: Topic | null;
  discipline?: Discipline;
  onClose: () => void;
  onOpenManualStudy: (disciplineId: string, topicId: string) => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  discipline,
  onClose,
  onOpenManualStudy,
}) => {
  const {
    activeEdital,
    studySessions,
    updateTopic,
    toggleTopicStudied,
    toggleTopicReviewed,
    launchStudySessionForTopic,
    createScheduledReview,
  } = useStudy();

  const [notes, setNotes] = useState(topic?.notes || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newSubtopicText, setNewSubtopicText] = useState("");

  if (!topic) return null;

  const topicSessions = studySessions.filter((s) => s.topicId === topic.id);
  const totalMinutes = topicSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const hoursFormatted = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

  const handleSaveNotes = () => {
    updateTopic(topic.id, { notes });
    setIsEditingNotes(false);
  };

  const handleAddSubtopic = () => {
    if (!newSubtopicText.trim()) return;
    const updated = [...topic.subtopics, newSubtopicText.trim()];
    updateTopic(topic.id, { subtopics: updated });
    setNewSubtopicText("");
  };

  const handleRemoveSubtopic = (index: number) => {
    const updated = topic.subtopics.filter((_, i) => i !== index);
    updateTopic(topic.id, { subtopics: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs font-bold text-sm"
              style={{ backgroundColor: discipline?.color || "#3B82F6" }}
            >
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  {discipline?.name || "Disciplina"}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.2 text-[10px] font-semibold text-white dark:bg-slate-700 dark:text-white">
                  Peso {discipline?.weight || 1}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white dark:text-white">
                {topic.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white hover:bg-slate-100 hover:text-white dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
              <span className="block text-[11px] font-semibold text-white uppercase">Tempo Estudado</span>
              <span className="text-base font-bold text-white dark:text-white">{hoursFormatted}</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
              <span className="block text-[11px] font-semibold text-white uppercase">Questões / Acerto</span>
              <span className="text-base font-bold text-white dark:text-white">
                {topic.questionsCorrect}/{topic.questionsDone} ({topic.accuracyRate}%)
              </span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
              <span className="block text-[11px] font-semibold text-white uppercase">Revisões Feitas</span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">{topic.reviewCount}x</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
              <span className="block text-[11px] font-semibold text-white uppercase">Índice de Domínio</span>
              <span
                className={`text-base font-bold ${
                  topic.masteryRate >= 75
                    ? "text-emerald-600 dark:text-emerald-400"
                    : topic.masteryRate >= 50
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-500"
                }`}
              >
                {topic.masteryRate}%
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                onClose();
                launchStudySessionForTopic(topic.disciplineId, topic.id, "Teoria");
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              Estudar no Cronômetro
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenManualStudy(topic.disciplineId, topic.id);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Clock className="h-3.5 w-3.5" />
              Lançar Estudo Manual
            </button>

            <button
              onClick={() => toggleTopicStudied(topic.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                topic.isStudied
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {topic.isStudied ? "Teoria Estudada" : "Marcar Teoria Lida"}
            </button>

            <button
              onClick={() => createScheduledReview(topic.id, "24h")}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-[#F59E0B] hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/60 dark:text-[#FBBF24] cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Agendar Revisão (24h)
            </button>
          </div>

          {/* Subtopics Checklist Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                Subtópicos & Artigos de Lei ({topic.subtopics.length})
              </h3>
            </div>

            <div className="mt-3 space-y-2">
              {topic.subtopics.length === 0 ? (
                <p className="text-xs text-white italic">
                  Nenhum subtópico cadastrado ainda para este assunto.
                </p>
              ) : (
                topic.subtopics.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-2.5 text-xs text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                      <span>{sub}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveSubtopic(idx)}
                      className="text-white hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}

              {/* Add subtopic input */}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Novo subtópico (ex: Art. 37, § 6º - Responsabilidade Civil)..."
                  value={newSubtopicText}
                  onChange={(e) => setNewSubtopicText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtopic()}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddSubtopic}
                  className="flex items-center gap-1 rounded-lg bg-[#F59E0B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D97706] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Anotações / Pegadinhas */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                Anotações, Mnemônicos & Pegadinhas
              </h3>
              {!isEditingNotes ? (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#F59E0B] hover:underline dark:text-[#FBBF24] cursor-pointer"
                >
                  <Edit3 className="h-3 w-3" /> Editar
                </button>
              ) : (
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center gap-1 rounded-md bg-[#F59E0B] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#D97706] cursor-pointer"
                >
                  Salvar
                </button>
              )}
            </div>

            <div className="mt-2.5">
              {isEditingNotes ? (
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Cuidado com a pegadinha da banca sobre prazo prescricional..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-white focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              ) : (
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-white dark:bg-slate-800/40 dark:text-white">
                  {topic.notes ? (
                    <p className="whitespace-pre-wrap">{topic.notes}</p>
                  ) : (
                    <p className="text-white italic">
                      Nenhuma anotação registrada ainda. Clique em "Editar" para adicionar mnemônicos ou súmulas.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Session History on this Topic */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
              Histórico de Sessões neste Tópico ({topicSessions.length})
            </h3>
            <div className="mt-3 space-y-2">
              {topicSessions.length === 0 ? (
                <p className="text-xs text-white italic">
                  Nenhuma sessão de estudo registrada ainda para este tópico.
                </p>
              ) : (
                topicSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {sess.modality}
                      </span>
                      <div>
                        <span className="font-semibold text-white dark:text-white">
                          {sess.durationMinutes} minutos
                        </span>
                        {sess.notes && (
                          <p className="text-[11px] text-white">{sess.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {sess.questionsDone > 0 && (
                        <span className="block font-semibold text-white dark:text-white">
                          {sess.questionsCorrect}/{sess.questionsDone} acertos
                        </span>
                      )}
                      <span className="text-[10px] text-white">
                        {new Date(sess.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-950 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-slate-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
