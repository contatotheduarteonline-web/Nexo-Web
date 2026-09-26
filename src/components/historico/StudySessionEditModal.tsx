import React, { useMemo, useState } from "react";
import { X, Save, Loader2, CalendarDays, BookOpen, CheckCircle2, FileText, Video, RotateCw } from "lucide-react";
import { StudyModality, StudySession } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useStudy } from "../../context/StudyContext";
import { db } from "../../lib/firebase";
import { doc, writeBatch } from "firebase/firestore";

interface Props { session: StudySession; onClose: () => void; onSaved: () => void; }
const REVIEW_OPTIONS = [1, 7, 14, 30] as const;
const modalities: StudyModality[] = ["Teoria", "Questões", "Revisão", "Videoaula", "Lei Seca", "Simulado"];

function getInitialDate(session: StudySession) {
  if (session.studyDate) return session.studyDate;
  const d = new Date(session.date);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}
function toIso(ymd: string) { return new Date(`${ymd}T12:00:00`).toISOString(); }
function dueDate(base: string, days: number) { const d = new Date(`${base}T12:00:00`); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
function dayDiff(a: string, b: string) { return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000); }

export const StudySessionEditModal: React.FC<Props> = ({ session, onClose, onSaved }) => {
  const { user } = useAuth();
  const { activeEdital, scheduledReviews } = useStudy();
  const [studyDate, setStudyDate] = useState(getInitialDate(session));
  const [disciplineId, setDisciplineId] = useState(session.disciplineId || "");
  const [topicId, setTopicId] = useState(session.topicId || "");
  const [durationMinutes, setDurationMinutes] = useState(String(Math.max(0, session.durationMinutes || 0)));
  const [modality, setModality] = useState<StudyModality>(session.modality);
  const [questionsDone, setQuestionsDone] = useState(String(Math.max(0, session.questionsDone || 0)));
  const [questionsCorrect, setQuestionsCorrect] = useState(String(Math.max(0, session.questionsCorrect || 0)));
  const [questionsWrong, setQuestionsWrong] = useState(String(Math.max(0, (session as StudySession & { questionsWrong?: number }).questionsWrong ?? ((session.questionsDone || 0) - (session.questionsCorrect || 0)))));
  const [notes, setNotes] = useState(session.notes || "");
  const [theoryCompleted, setTheoryCompleted] = useState(Boolean(session.theoryCompleted));
  const [scheduleReviews, setScheduleReviews] = useState((session.reviewsScheduled || 0) > 0);
  const [selectedReviewDays, setSelectedReviewDays] = useState<number[]>(() => {
    const existing = scheduledReviews.filter((r) => (r.sessionId === session.id || r.originalSessionId === session.id) && !r.completed);
    const values = existing.map((r) => r.intervalDays ?? dayDiff(getInitialDate(session), r.dueDate)).filter((n) => REVIEW_OPTIONS.includes(n as any));
    return Array.from(new Set(values));
  });
  const [material, setMaterial] = useState((session as StudySession & { material?: string }).material || "");
  const [pagesStart, setPagesStart] = useState(String((session as StudySession & { pagesStart?: number }).pagesStart ?? 0));
  const [pagesEnd, setPagesEnd] = useState(String((session as StudySession & { pagesEnd?: number }).pagesEnd ?? 0));
  const [videoTitle, setVideoTitle] = useState((session as StudySession & { videoTitle?: string }).videoTitle || "");
  const [videoStart, setVideoStart] = useState((session as StudySession & { videoStart?: string }).videoStart || "00:00:00");
  const [videoEnd, setVideoEnd] = useState((session as StudySession & { videoEnd?: string }).videoEnd || "00:00:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disciplines = activeEdital?.disciplines || [];
  const topics = activeEdital?.topics.filter((t) => t.disciplineId === disciplineId) || [];
  const parsedDone = useMemo(() => Math.max(0, Math.floor(Number(questionsDone) || 0)), [questionsDone]);
  const parsedCorrect = useMemo(() => Math.min(parsedDone, Math.max(0, Math.floor(Number(questionsCorrect) || 0))), [parsedDone, questionsCorrect]);
  const parsedWrong = useMemo(() => Math.max(0, Math.floor(Number(questionsWrong) || 0)), [questionsWrong]);

  const toggleReview = (days: number) => setSelectedReviewDays((prev) => prev.includes(days) ? prev.filter((v) => v !== days) : [...prev, days].sort((a, b) => a - b));

  const handleSave = async () => {
    if (!user?.id) { setError("Sua sessão de login não está disponível. Faça login novamente."); return; }
    if (!studyDate) { setError("Informe a data do estudo."); return; }
    if (!disciplineId) { setError("Selecione uma disciplina."); return; }
    if (scheduleReviews && selectedReviewDays.length === 0) { setError("Selecione pelo menos um ciclo de revisão."); return; }
    setSaving(true); setError(null);
    try {
      const batch = writeBatch(db);
      const pendingExisting = scheduledReviews.filter((r) => (r.sessionId === session.id || r.originalSessionId === session.id) && !r.completed);
      pendingExisting.forEach((r) => batch.delete(doc(db, "users", user.id, "scheduledReviews", r.id)));

      const selectedDiscipline = disciplines.find((d) => d.id === disciplineId);
      const selectedTopic = activeEdital?.topics.find((t) => t.id === topicId);
      const nowIso = new Date().toISOString();
      const newReviews = scheduleReviews ? selectedReviewDays.map((days) => ({
        id: `rev-${session.id}-${days}d`, userId: user.id, planId: session.planId, planName: session.planName,
        cargo: session.cargo, cargoId: session.cargoId, editalId: session.editalId, disciplineId,
        disciplineName: selectedDiscipline?.name || session.disciplineName, topicId: topicId || session.topicId || "",
        topicName: selectedTopic?.name || session.topicName || "Geral", sessionId: session.id, originalSessionId: session.id,
        stage: `${days}d`, intervalDays: days, dueDate: dueDate(studyDate, days), status: "Pendente" as const, completed: false,
        notes: notes.trim() || undefined, createdAt: nowIso,
      })) : [];
      newReviews.forEach((r) => batch.set(doc(db, "users", user.id, "scheduledReviews", r.id), r, { merge: true }));

      const totalQuestions = Math.max(parsedDone, parsedCorrect + parsedWrong);
      const updatedSession = {
        ...session, userId: user.id, studyDate, date: toIso(studyDate), disciplineId,
        disciplineName: selectedDiscipline?.name || session.disciplineName, topicId: topicId || undefined,
        topicName: selectedTopic?.name || "Geral", durationMinutes: Math.max(0, Math.floor(Number(durationMinutes) || 0)),
        modality, questionsDone: totalQuestions, questionsCorrect: parsedCorrect, questionsWrong: parsedWrong,
        notes: notes.trim(), theoryCompleted, material: material.trim(),
        pagesStart: Math.max(0, Math.floor(Number(pagesStart) || 0)), pagesEnd: Math.max(0, Math.floor(Number(pagesEnd) || 0)),
        videoTitle: videoTitle.trim(), videoStart, videoEnd,
        reviewsScheduled: newReviews.length, createdReviewsCount: newReviews.length, reviewDates: newReviews.map((r) => r.dueDate),
      } as StudySession & { questionsWrong: number };
      batch.set(doc(db, "users", user.id, "studySessions", session.id), updatedSession, { merge: true });
      await batch.commit();
      onSaved(); onClose();
    } catch (err) {
      console.error("Erro ao editar estudo:", err);
      setError("Não foi possível salvar a alteração. Tente novamente.");
    } finally { setSaving(false); }
  };

  const field = "mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#F59E0B]";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
    <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#252B38] shadow-2xl" role="dialog" aria-modal="true">
      <header className="flex items-center justify-between border-b border-slate-700 px-5 py-4 sm:px-6"><div><h2 className="text-lg font-bold text-white">Editar registro de estudo</h2><p className="mt-1 text-xs text-slate-400">Todos os campos do registro podem ser modificados e sincronizados.</p></div><button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"><X className="h-5 w-5" /></button></header>
      <div className="overflow-y-auto px-5 py-5 sm:px-6"><div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="space-y-4">
          <label className="text-[11px] font-bold uppercase text-white">Data do estudo<input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} disabled={saving} className={field} /></label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-[11px] font-bold uppercase text-white">Disciplina<select value={disciplineId} onChange={(e) => { setDisciplineId(e.target.value); setTopicId(activeEdital?.topics.find((t) => t.disciplineId === e.target.value)?.id || ""); }} disabled={saving} className={field}>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><label className="text-[11px] font-bold uppercase text-white">Tópico<select value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={saving} className={field}><option value="">Geral / Sem tópico</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></div>
          <label className="text-[11px] font-bold uppercase text-white">Categoria<select value={modality} onChange={(e) => setModality(e.target.value as StudyModality)} disabled={saving} className={field}>{modalities.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
          <label className="text-[11px] font-bold uppercase text-white">Tempo de estudo (minutos)<input type="number" min="0" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} disabled={saving} className={field} /></label>
          <div className="rounded-xl border border-slate-700 bg-[#171B25] p-4"><div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-white">Questões</div><div className="grid grid-cols-3 gap-2"><label className="text-[10px] font-bold text-white">QUESTÕES<input type="number" min="0" value={questionsDone} onChange={(e) => setQuestionsDone(e.target.value)} className={field} /></label><label className="text-[10px] font-bold text-emerald-400">ACERTOS<input type="number" min="0" value={questionsCorrect} onChange={(e) => setQuestionsCorrect(e.target.value)} className={field} /></label><label className="text-[10px] font-bold text-red-400">ERROS<input type="number" min="0" value={questionsWrong} onChange={(e) => setQuestionsWrong(e.target.value)} className={field} /></label></div></div>
        </section>
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-[#171B25] p-4"><label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-white"><input type="checkbox" checked={theoryCompleted} onChange={(e) => setTheoryCompleted(e.target.checked)} disabled={saving} className="h-4 w-4 accent-amber-500" /><CheckCircle2 className="h-4 w-4 text-emerald-400" />Teoria finalizada</label></div>
          <div className="rounded-xl border border-slate-700 bg-[#171B25] p-4"><label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-white"><span className="flex items-center gap-2"><RotateCw className="h-4 w-4 text-amber-400" />Programar revisões</span><input type="checkbox" checked={scheduleReviews} onChange={(e) => { setScheduleReviews(e.target.checked); if (!e.target.checked) setSelectedReviewDays([]); }} disabled={saving} className="h-5 w-5 accent-amber-500" /></label>{scheduleReviews && <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{REVIEW_OPTIONS.map((days) => <button key={days} type="button" onClick={() => toggleReview(days)} className={`rounded-xl border px-3 py-3 ${selectedReviewDays.includes(days) ? "border-amber-400 bg-amber-500/15 text-amber-300" : "border-slate-700 bg-[#0F172A] text-white"}`}><b>{days}</b><span className="ml-1 text-xs">{days === 1 ? "dia" : "dias"}</span></button>)}</div>}</div>
          <div className="rounded-xl border border-slate-700 bg-[#171B25] p-4"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-[11px] font-bold text-white"><BookOpen className="mr-1 inline h-3.5 w-3.5" />Material<input value={material} onChange={(e) => setMaterial(e.target.value)} className={field} placeholder="Ex.: Aula 01" /></label><div><div className="text-[11px] font-bold text-white"><FileText className="mr-1 inline h-3.5 w-3.5" />Páginas</div><div className="grid grid-cols-2 gap-2"><input type="number" min="0" value={pagesStart} onChange={(e) => setPagesStart(e.target.value)} className={field} placeholder="Início" /><input type="number" min="0" value={pagesEnd} onChange={(e) => setPagesEnd(e.target.value)} className={field} placeholder="Fim" /></div></div></div><div className="mt-3"><div className="text-[11px] font-bold text-white"><Video className="mr-1 inline h-3.5 w-3.5" />Videoaula</div><div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} className={field} placeholder="Título" /><input value={videoStart} onChange={(e) => setVideoStart(e.target.value)} className={field} placeholder="Início" /><input value={videoEnd} onChange={(e) => setVideoEnd(e.target.value)} className={field} placeholder="Fim" /></div></div></div>
          <label className="text-[11px] font-bold uppercase text-white">Comentários / Anotações<textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${field} resize-none`} /></label>
        </section>
      </div></div>
      {error && <div className="border-t border-red-900/50 bg-red-950/30 px-5 py-3 text-xs font-semibold text-red-300">{error}</div>}
      <footer className="flex flex-col-reverse gap-2 border-t border-slate-700 bg-[#171B25] px-5 py-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-bold text-white">Cancelar</button><button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Salvando..." : "Salvar alterações"}</button></footer>
    </div>
  </div>;
};
