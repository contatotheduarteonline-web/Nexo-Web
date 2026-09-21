import React, { useState, useEffect } from "react";
import { useStudy } from "../../context/StudyContext";
import { StudyModality } from "../../types";
import {
  X,
  Clock,
  BookOpen,
  HelpCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCw,
} from "lucide-react";

interface ManualStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDisciplineId?: string;
  preselectedTopicId?: string;
}

export const ManualStudyModal: React.FC<ManualStudyModalProps> = ({
  isOpen,
  onClose,
  preselectedDisciplineId,
  preselectedTopicId,
}) => {
  const { activeEdital, logStudySession } = useStudy();

  const [disciplineId, setDisciplineId] = useState<string>("");
  const [topicId, setTopicId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [durationMinutes, setDurationMinutes] = useState<number>(50);
  const [modality, setModality] = useState<StudyModality>("Teoria");
  const [questionsDone, setQuestionsDone] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [scheduleReview, setScheduleReview] = useState<boolean>(true);

  // Set defaults when opening
  useEffect(() => {
    if (isOpen && activeEdital) {
      const discId = preselectedDisciplineId || activeEdital.disciplines[0]?.id || "";
      setDisciplineId(discId);

      const availableTopics = activeEdital.topics.filter((t) => t.disciplineId === discId);
      const topId = preselectedTopicId || availableTopics[0]?.id || "";
      setTopicId(topId);

      setDate(new Date().toISOString().split("T")[0]);
      setDurationMinutes(50);
      setModality("Teoria");
      setQuestionsDone(0);
      setQuestionsCorrect(0);
      setNotes("");
      setScheduleReview(true);
    }
  }, [isOpen, activeEdital, preselectedDisciplineId, preselectedTopicId]);

  // When discipline changes, update topic dropdown
  const handleDisciplineChange = (newDiscId: string) => {
    setDisciplineId(newDiscId);
    const available = activeEdital?.topics.filter((t) => t.disciplineId === newDiscId) || [];
    setTopicId(available[0]?.id || "");
  };

  if (!isOpen || !activeEdital) return null;

  const disciplines = activeEdital.disciplines;
  const currentDisciplineTopics = activeEdital.topics.filter((t) => t.disciplineId === disciplineId);

  const selectedDiscipline = disciplines.find((d) => d.id === disciplineId);
  const selectedTopic = activeEdital.topics.find((t) => t.id === topicId);

  const accuracyPct =
    questionsDone > 0 ? Math.round((questionsCorrect / questionsDone) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplineId) {
      alert("Selecione uma disciplina.");
      return;
    }

    if (durationMinutes <= 0 && questionsDone <= 0) {
      alert("Informe a duração em minutos ou a quantidade de questões.");
      return;
    }

    logStudySession({
      editalId: activeEdital.id,
      disciplineId,
      disciplineName: selectedDiscipline?.name || "Disciplina",
      topicId,
      topicName: selectedTopic?.name || "Geral",
      date: new Date(date).toISOString(),
      durationMinutes: Number(durationMinutes) || 0,
      modality,
      questionsDone: Number(questionsDone) || 0,
      questionsCorrect: Number(questionsCorrect) || 0,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-[#FF6B00] border border-orange-500/30 shadow-xs dark:bg-orange-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Estudo Manual
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lance estudos realizados offline, leituras ou baterias de questões
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Row 1: Disciplina & Assunto */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Disciplina <span className="text-red-500">*</span>
              </label>
              <select
                value={disciplineId}
                onChange={(e) => handleDisciplineChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              >
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (Peso {d.weight})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assunto / Tópico
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Geral / Sem tópico específico</option>
                {currentDisciplineTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Data, Duração e Modalidade */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Data do Estudo
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tempo Líquido (minutos)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Ex: 50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Modalidade
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as StudyModality)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Teoria">📖 Teoria</option>
                <option value="Questões">📝 Questões</option>
                <option value="Revisão">🔄 Revisão</option>
                <option value="Lei Seca">⚖️ Lei Seca</option>
                <option value="Videoaula">🎥 Videoaula</option>
                <option value="Simulado">🎯 Simulado</option>
              </select>
            </div>
          </div>

          {/* Row 3: Bateria de Questões */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Exercícios & Questões Resolvidas
            </span>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Total Feitas
                </label>
                <input
                  type="number"
                  min="0"
                  value={questionsDone}
                  onChange={(e) => {
                    const done = Math.max(0, parseInt(e.target.value) || 0);
                    setQuestionsDone(done);
                    if (questionsCorrect > done) setQuestionsCorrect(done);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Acertos
                </label>
                <input
                  type="number"
                  min="0"
                  max={questionsDone}
                  value={questionsCorrect}
                  onChange={(e) => {
                    const correct = Math.max(0, parseInt(e.target.value) || 0);
                    setQuestionsCorrect(correct);
                    if (correct > questionsDone) setQuestionsDone(correct);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-emerald-600 focus:border-emerald-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500">
                  Aproveitamento
                </label>
                <div className="mt-1 flex h-[34px] items-center justify-center rounded-lg bg-slate-200/70 font-bold text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                  {accuracyPct}%
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Observações / Artigos de Lei / Pegadinhas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Focar nas exceções do art. 5º; mnemônico LIMPE..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Footer Buttons */}
          <div className="mt-6 flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Atualiza edital e estatísticas imediatamente
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] hover:from-[#E05D00] hover:to-[#FF6B00] px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Salvar Registro
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
