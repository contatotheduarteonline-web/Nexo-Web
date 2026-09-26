import React, { useMemo, useState } from "react";
import { X, Save, Loader2, CalendarDays, Clock3, BookOpen, Target, CheckCircle2, FileText, Video } from "lucide-react";
import { StudyModality, StudySession } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { saveStudySessionToFirestore } from "../../lib/firestoreService";

interface StudySessionEditModalProps {
  session: StudySession;
  onClose: () => void;
  onSaved: () => void;
}

const modalities: StudyModality[] = [
  "Teoria",
  "Questões",
  "Revisão",
  "Videoaula",
  "Lei Seca",
  "Simulado",
];

function getInitialDate(session: StudySession): string {
  if (session.studyDate) return session.studyDate;
  const parsed = new Date(session.date);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalNoonIso(dateYmd: string): string {
  return new Date(`${dateYmd}T12:00:00`).toISOString();
}

export const StudySessionEditModal: React.FC<StudySessionEditModalProps> = ({
  session,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const [studyDate, setStudyDate] = useState(getInitialDate(session));
  const [durationMinutes, setDurationMinutes] = useState(String(Math.max(0, session.durationMinutes || 0)));
  const [modality, setModality] = useState<StudyModality>(session.modality);
  const [questionsDone, setQuestionsDone] = useState(String(Math.max(0, session.questionsDone || 0)));
  const [questionsCorrect, setQuestionsCorrect] = useState(String(Math.max(0, session.questionsCorrect || 0)));
  const [notes, setNotes] = useState(session.notes || "");
  const [theoryCompleted, setTheoryCompleted] = useState(Boolean(session.theoryCompleted));
  const [material, setMaterial] = useState((session as StudySession & { material?: string }).material || "");
  const [pagesStart, setPagesStart] = useState(String((session as StudySession & { pagesStart?: number }).pagesStart ?? 0));
  const [pagesEnd, setPagesEnd] = useState(String((session as StudySession & { pagesEnd?: number }).pagesEnd ?? 0));
  const [videoTitle, setVideoTitle] = useState((session as StudySession & { videoTitle?: string }).videoTitle || "");
  const [videoStart, setVideoStart] = useState((session as StudySession & { videoStart?: string }).videoStart || "00:00:00");
  const [videoEnd, setVideoEnd] = useState((session as StudySession & { videoEnd?: string }).videoEnd || "00:00:00");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedQuestionsDone = useMemo(() => Math.max(0, Math.floor(Number(questionsDone) || 0)), [questionsDone]);
  const parsedQuestionsCorrect = useMemo(
    () => Math.min(parsedQuestionsDone, Math.max(0, Math.floor(Number(questionsCorrect) || 0))),
    [parsedQuestionsDone, questionsCorrect]
  );

  const handleSave = async () => {
    if (!user?.id) {
      setError("Sua sessão de login não está disponível. Faça login novamente e tente salvar.");
      return;
    }
    if (!studyDate) {
      setError("Informe a data do estudo.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedSession: StudySession = {
        ...session,
        userId: user.id,
        studyDate,
        date: toLocalNoonIso(studyDate),
        durationMinutes: Math.max(0, Math.floor(Number(durationMinutes) || 0)),
        modality,
        questionsDone: parsedQuestionsDone,
        questionsCorrect: parsedQuestionsCorrect,
        notes: notes.trim(),
        theoryCompleted,
        material: material.trim(),
        pagesStart: Math.max(0, Math.floor(Number(pagesStart) || 0)),
        pagesEnd: Math.max(0, Math.floor(Number(pagesEnd) || 0)),
        videoTitle: videoTitle.trim(),
        videoStart,
        videoEnd,
      };

      await saveStudySessionToFirestore(user.id, updatedSession);
      onSaved();
      onClose();
    } catch (err) {
      console.error("Erro ao editar estudo:", err);
      setError("Não foi possível salvar a alteração. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-study-title"
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#252B38] p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-study-title" className="text-base font-bold text-white">
              Editar estudo
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Altere o registro e salve. O histórico e os indicadores da Home serão atualizados.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            aria-label="Fechar edição"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 max-h-[70vh] overflow-y-auto pr-1">
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-300">
            <CalendarDays className="h-4 w-4" />
            <span>Edite o registro completo do estudo e salve todas as informações.</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-200">
            Data do estudo
            <input
              type="date"
              value={studyDate}
              onChange={(e) => setStudyDate(e.target.value)}
              disabled={isSaving}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none transition focus:border-[#F59E0B]"
            />
          </label>

          <label className="text-xs font-semibold text-slate-200">
            Tempo (minutos)
            <input
              type="number"
              min="0"
              step="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              disabled={isSaving}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none transition focus:border-[#F59E0B]"
            />
          </label>

          <label className="text-xs font-semibold text-slate-200 sm:col-span-2">
            Modalidade
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value as StudyModality)}
              disabled={isSaving}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none transition focus:border-[#F59E0B]"
            >
              {modalities.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-slate-200">
            Questões feitas
            <input
              type="number"
              min="0"
              step="1"
              value={questionsDone}
              onChange={(e) => setQuestionsDone(e.target.value)}
              disabled={isSaving}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none transition focus:border-[#F59E0B]"
            />
          </label>

          <label className="text-xs font-semibold text-slate-200">
            Acertos
            <input
              type="number"
              min="0"
              max={parsedQuestionsDone}
              step="1"
              value={questionsCorrect}
              onChange={(e) => setQuestionsCorrect(e.target.value)}
              disabled={isSaving}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none transition focus:border-[#F59E0B]"
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-xs font-semibold text-slate-200 sm:col-span-2">
            <input type="checkbox" checked={theoryCompleted} onChange={(e) => setTheoryCompleted(e.target.checked)} disabled={isSaving} className="h-4 w-4 accent-[#F59E0B]" />
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Teoria finalizada
          </label>

          <label className="text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Material</span>
            <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} disabled={isSaving} placeholder="Ex.: Aula 01" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]" />
          </label>

          <div className="text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Páginas</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <input type="number" min="0" value={pagesStart} onChange={(e) => setPagesStart(e.target.value)} disabled={isSaving} placeholder="Início" className="w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]" />
              <input type="number" min="0" value={pagesEnd} onChange={(e) => setPagesEnd(e.target.value)} disabled={isSaving} placeholder="Fim" className="w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]" />
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-200 sm:col-span-2">
            <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Videoaula</span>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input type="text" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} disabled={isSaving} placeholder="Título do vídeo" className="w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]" />
              <input type="text" value={videoStart} onChange={(e) => setVideoStart(e.target.value)} disabled={isSaving} placeholder="00:00:00" className="w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]" />
              <input type="text" value={videoEnd} onChange={(e) => setVideoEnd(e.target.value)} disabled={isSaving} placeholder="00:00:00" className="w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]" />
            </div>
          </div>

          <label className="text-xs font-semibold text-slate-200 sm:col-span-2">
            Anotação
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSaving}
              rows={4}
              placeholder="Adicione uma observação sobre este estudo..."
              className="mt-1.5 w-full resize-y rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F59E0B]"
            />
          </label>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-700 bg-[#161C28] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-[#FBBF24] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
};
