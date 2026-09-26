import React, { useEffect, useRef, useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { useAuth } from "../../context/AuthContext";
import { saveStudySessionToFirestore } from "../../lib/firestoreService";
import { StudyModality } from "../../types";
import {
  X, Clock, BookOpen, Target, RotateCw, Video, Scale, FileText,
  Play, Pause, RotateCcw, Plus, Minus, Calendar, Timer as TimerIcon,
  PenLine, CheckCircle2,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedDisciplineId?: string;
  preselectedTopicId?: string;
}

const REVIEW_OPTIONS = [1, 7, 14, 30] as const;

function ymdNow(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ptDate(value: string) {
  const [y, m, d] = value.split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

function timeLabel(minutes: number) {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`;
  return `${minutes} min`;
}

export const ManualStudyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  preselectedDisciplineId,
  preselectedTopicId,
}) => {
  const { activeEdital, finishCurrentSession } = useStudy();
  const { user } = useAuth();
  const [disciplineId, setDisciplineId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [modality, setModality] = useState<StudyModality>("Teoria");
  const [timeMode, setTimeMode] = useState<"stopwatch" | "manual">("stopwatch");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(0);
  const [studyDate, setStudyDate] = useState(ymdNow());
  const [dateMode, setDateMode] = useState<"today" | "yesterday" | "custom">("today");
  const [questionsDone, setQuestionsDone] = useState(0);
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [questionsWrong, setQuestionsWrong] = useState(0);
  const [theoryCompleted, setTheoryCompleted] = useState(false);
  const [scheduleReviews, setScheduleReviews] = useState(false);
  const [selectedReviewDays, setSelectedReviewDays] = useState<number[]>([]);
  const [material, setMaterial] = useState("");
  const [pagesStart, setPagesStart] = useState(0);
  const [pagesEnd, setPagesEnd] = useState(0);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoStart, setVideoStart] = useState("00:00:00");
  const [videoEnd, setVideoEnd] = useState("00:00:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen || !activeEdital) return;
    const d = preselectedDisciplineId || activeEdital.disciplines[0]?.id || "";
    const topics = activeEdital.topics.filter((t) => t.disciplineId === d);
    setDisciplineId(d);
    setTopicId(preselectedTopicId || topics[0]?.id || "");
    setModality("Teoria"); setTimeMode("stopwatch"); setElapsedSeconds(0); setRunning(false);
    setManualHours(0); setManualMinutes(0); setDateMode("today"); setStudyDate(ymdNow());
    setQuestionsDone(0); setQuestionsCorrect(0); setQuestionsWrong(0); setTheoryCompleted(false);
    setScheduleReviews(false); setSelectedReviewDays([]); setMaterial(""); setPagesStart(0); setPagesEnd(0);
    setVideoTitle(""); setVideoStart("00:00:00"); setVideoEnd("00:00:00"); setNotes(""); setError(null);
  }, [isOpen, activeEdital, preselectedDisciplineId, preselectedTopicId]);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => setElapsedSeconds((v) => v + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  if (!isOpen || !activeEdital) return null;

  const disciplines = activeEdital.disciplines;
  const topics = activeEdital.topics.filter((t) => t.disciplineId === disciplineId);
  const discipline = disciplines.find((d) => d.id === disciplineId);
  const topic = activeEdital.topics.find((t) => t.id === topicId);
  const durationMinutes = timeMode === "manual" ? manualHours * 60 + manualMinutes : Math.round(elapsedSeconds / 60);
  const effectiveDate = dateMode === "today" ? ymdNow() : dateMode === "yesterday" ? ymdNow(-1) : studyDate;
  const formatClock = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const toggleReview = (days: number) => {
    setSelectedReviewDays((prev) => prev.includes(days) ? prev.filter((v) => v !== days) : [...prev, days].sort((a, b) => a - b));
  };

  const handleSave = async () => {
    if (!user?.id) { setError("Sua sessão não está disponível. Faça login novamente."); return; }
    if (!disciplineId) { setError("Selecione uma disciplina."); return; }
    if (durationMinutes <= 0 && questionsDone <= 0 && questionsCorrect <= 0 && questionsWrong <= 0) {
      setError("Informe o tempo estudado ou registre questões."); return;
    }
    if (scheduleReviews && selectedReviewDays.length === 0) {
      setError("Selecione pelo menos um ciclo de revisão."); return;
    }

    setSaving(true); setError(null);
    try {
      const totalQuestions = Math.max(questionsDone, questionsCorrect + questionsWrong);
      const result = await finishCurrentSession({
        editalId: activeEdital.id,
        disciplineId,
        topicId,
        modality,
        durationMinutes: Math.max(1, durationMinutes),
        questionsDone: totalQuestions,
        questionsCorrect: Math.min(totalQuestions, questionsCorrect),
        notes,
        selectedReviewDays: scheduleReviews ? selectedReviewDays : [],
        scheduleReviews,
        studyDate: effectiveDate,
        theoryCompleted,
      });

      const enriched = {
        ...result.session,
        questionsWrong,
        material: material.trim(),
        pagesStart: Math.max(0, pagesStart),
        pagesEnd: Math.max(0, pagesEnd),
        videoTitle: videoTitle.trim(),
        videoStart,
        videoEnd,
        reviewsScheduled: result.reviews.length,
        createdReviewsCount: result.reviews.length,
        reviewDates: result.reviews.map((r) => r.dueDate),
      } as typeof result.session & { questionsWrong: number };
      await saveStudySessionToFirestore(user.id, enriched);
      setRunning(false);
      onClose();
    } catch (err) {
      console.error("Erro ao registrar estudo:", err);
      setError("Não foi possível salvar o registro. Tente novamente.");
    } finally { setSaving(false); }
  };

  const field = "mt-1.5 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#F3AA2D]";
  const buttonBase = "cursor-pointer rounded-xl border border-[#384154] bg-[#171B25] text-white transition-colors hover:border-[#F3AA2D]/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0f12]/75 p-3 backdrop-blur-md sm:p-5">
      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#384154] bg-[#11151F] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#384154] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 text-[#F3AA2D]"><Clock className="h-5 w-5" /></div><div><h2 className="text-lg font-bold text-white sm:text-xl">Registro de Estudo</h2><p className="text-[11px] text-slate-400">Preencha o estudo e salve todos os dados em um único registro.</p></div></div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-300 hover:bg-[#252B38] hover:text-white"><X className="h-5 w-5" /></button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white">Disciplina<select value={disciplineId} onChange={(e) => { setDisciplineId(e.target.value); setTopicId(activeEdital.topics.find((t) => t.disciplineId === e.target.value)?.id || ""); }} disabled={saving} className={field}>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
                <label className="text-[11px] font-bold uppercase tracking-wider text-white">Tópico<select value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={saving} className={field}><option value="">Geral / Sem tópico específico</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
              </div>

              <div><div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white">Categoria</div><div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">{([
                ["Teoria", BookOpen], ["Questões", Target], ["Revisão", RotateCw], ["Videoaula", Video], ["Lei Seca", Scale], ["Simulado", FileText]
              ] as const).map(([key, Icon]) => <button key={key} type="button" disabled={saving} onClick={() => setModality(key as StudyModality)} className={`flex items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold sm:text-xs ${modality === key ? "bg-[#F3AA2D] text-[#11151F]" : `${buttonBase}`}`}><Icon className="h-3.5 w-3.5" />{key === "Videoaula" ? "Vídeo" : key}</button>)}</div></div>

              <div className="rounded-2xl border border-[#384154] bg-[#252B38] p-4 text-center">
                <div className="mb-3 inline-flex rounded-xl border border-[#384154] bg-[#171B25] p-1"><button type="button" onClick={() => setTimeMode("stopwatch")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${timeMode === "stopwatch" ? "bg-[#F3AA2D] text-[#11151F]" : "text-white"}`}><TimerIcon className="mr-1 inline h-3.5 w-3.5" />Cronômetro</button><button type="button" onClick={() => setTimeMode("manual")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${timeMode === "manual" ? "bg-[#F3AA2D] text-[#11151F]" : "text-white"}`}><PenLine className="mr-1 inline h-3.5 w-3.5" />Tempo manual</button></div>
                {timeMode === "stopwatch" ? <><div className="font-mono text-5xl font-bold text-white">{formatClock(elapsedSeconds)}</div><div className="mt-2 text-xs text-[#F3AA2D]">{discipline?.name || "Disciplina"} · {topic?.name || "Geral"}</div><div className="mt-3 flex justify-center gap-2">{[-5, 5, 15, 30].map((m) => <button key={m} type="button" onClick={() => setElapsedSeconds((v) => Math.max(0, v + m * 60))} className={`${buttonBase} px-2.5 py-1 text-xs`}>{m > 0 ? `+${m}` : `−${Math.abs(m)}`}</button>)}</div><div className="mt-4 flex justify-center gap-2">{running ? <button type="button" onClick={() => setRunning(false)} className="rounded-xl bg-[#F3AA2D] px-6 py-2.5 text-xs font-bold text-[#11151F]"><Pause className="mr-2 inline h-4 w-4" />Pausar</button> : <button type="button" onClick={() => setRunning(true)} className="rounded-xl bg-[#F3AA2D] px-6 py-2.5 text-xs font-bold text-[#11151F]"><Play className="mr-2 inline h-4 w-4" />{elapsedSeconds ? "Continuar" : "Iniciar"}</button>}<button type="button" onClick={() => { setRunning(false); setElapsedSeconds(0); }} className={`${buttonBase} px-3`}><RotateCcw className="h-4 w-4" /></button></div></> : <div className="flex justify-center gap-3"><label className="text-[10px] font-bold text-white">HORAS<input type="number" min="0" max="23" value={manualHours} onChange={(e) => setManualHours(Math.max(0, Math.min(23, Number(e.target.value) || 0)))} className="mt-1 block h-14 w-20 rounded-xl border border-[#384154] bg-[#171B25] text-center text-2xl font-bold text-white" /></label><label className="text-[10px] font-bold text-white">MINUTOS<input type="number" min="0" max="59" value={manualMinutes} onChange={(e) => setManualMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))} className="mt-1 block h-14 w-20 rounded-xl border border-[#384154] bg-[#171B25] text-center text-2xl font-bold text-white" /></label></div>}
              </div>

              <div className="rounded-2xl border border-[#384154] bg-[#252B38] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-white">Questões</span><span className="text-xs font-bold text-[#F3AA2D]">{questionsDone ? Math.round((questionsCorrect / questionsDone) * 100) : 0}%</span></div><div className="grid grid-cols-3 gap-2.5 text-center">{([["Questões", questionsDone, setQuestionsDone, "white"], ["Acertos", questionsCorrect, setQuestionsCorrect, "green"], ["Erros", questionsWrong, setQuestionsWrong, "red"]] as const).map(([label, value, setter, tone]) => <div key={label} className="rounded-xl bg-[#171B25] p-3"><div className={`text-2xl font-bold ${tone === "green" ? "text-[#34D399]" : tone === "red" ? "text-[#F87171]" : "text-white"}`}>{value}</div><div className="text-[11px] text-slate-300">{label}</div><div className="mt-2 flex justify-center gap-1"><button type="button" onClick={() => setter((v) => Math.max(0, v - 1))} className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#384154] text-white"><Minus className="h-3 w-3" /></button><button type="button" onClick={() => setter((v) => v + 1)} className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#384154] text-white"><Plus className="h-3 w-3" /></button></div></div>)}</div></div>

              <div className="rounded-2xl border border-[#384154] bg-[#252B38] p-4"><div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-white">Data do estudo</span><div className="flex rounded-xl border border-[#384154] bg-[#171B25] p-0.5">{(["today", "yesterday", "custom"] as const).map((v) => <button key={v} type="button" onClick={() => setDateMode(v)} className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${dateMode === v ? "bg-[#F3AA2D] text-[#11151F]" : "text-white"}`}>{v === "today" ? "Hoje" : v === "yesterday" ? "Ontem" : "Outra"}</button>)}</div></div>{dateMode === "custom" && <input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} className={field} />}<div className="mt-2 flex items-center justify-between text-[11px] text-slate-300"><span><Calendar className="mr-1 inline h-3 w-3" />Data de referência</span><b className="text-white">{ptDate(effectiveDate)}</b></div></div>
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl border border-[#384154] bg-[#252B38] p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-wider text-white">Conclusão do conteúdo</div><p className="mt-1 text-xs text-slate-400">Marque somente quando o conteúdo estiver realmente concluído.</p></div><button type="button" disabled={saving} onClick={() => setTheoryCompleted((v) => !v)} className={`relative h-7 w-12 rounded-full transition ${theoryCompleted ? "bg-[#34D399]" : "bg-[#384154]"}`} aria-pressed={theoryCompleted}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${theoryCompleted ? "left-6" : "left-1"}`} /></button></div><div className="mt-3 flex items-center gap-2 text-xs font-semibold text-white"><CheckCircle2 className={`h-4 w-4 ${theoryCompleted ? "text-[#34D399]" : "text-slate-500"}`} />Teoria finalizada: {theoryCompleted ? "Sim" : "Não"}</div></div>

              <div className="rounded-2xl border border-[#384154] bg-[#252B38] p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-wider text-white">Programar revisões</div><p className="mt-1 text-xs text-slate-400">Ao ativar, escolha os ciclos que serão criados a partir da data do estudo.</p></div><button type="button" disabled={saving} onClick={() => { setScheduleReviews((v) => !v); if (scheduleReviews) setSelectedReviewDays([]); }} className={`relative h-7 w-12 rounded-full transition ${scheduleReviews ? "bg-[#F3AA2D]" : "bg-[#384154]"}`} aria-pressed={scheduleReviews}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${scheduleReviews ? "left-6" : "left-1"}`} /></button></div>{scheduleReviews && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{REVIEW_OPTIONS.map((days) => <button key={days} type="button" onClick={() => toggleReview(days)} className={`rounded-xl border px-3 py-3 text-center ${selectedReviewDays.includes(days) ? "border-[#F3AA2D] bg-[#F3AA2D]/15 text-[#F3AA2D]" : "border-[#384154] bg-[#171B25] text-white"}`}><div className="text-base font-bold">{days}</div><div className="text-[10px] uppercase">{days === 1 ? "dia" : "dias"}</div></button>)}</div>}</div>

              <div className="rounded-2xl border border-[#384154] bg-[#252B38] p-4"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-[11px] font-bold text-white">Material<input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ex.: Aula 01" className={field} /></label><div><div className="text-[11px] font-bold text-white">Páginas</div><div className="mt-1.5 grid grid-cols-2 gap-2"><input type="number" min="0" value={pagesStart} onChange={(e) => setPagesStart(Number(e.target.value) || 0)} placeholder="Início" className={field.replace("mt-1.5 ", "")} /><input type="number" min="0" value={pagesEnd} onChange={(e) => setPagesEnd(Number(e.target.value) || 0)} placeholder="Fim" className={field.replace("mt-1.5 ", "")} /></div></div></div><div className="mt-3"><div className="text-[11px] font-bold text-white">Videoaula</div><div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3"><input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Título do vídeo" className={field.replace("mt-1.5 ", "")} /><input value={videoStart} onChange={(e) => setVideoStart(e.target.value)} placeholder="Início" className={field.replace("mt-1.5 ", "")} /><input value={videoEnd} onChange={(e) => setVideoEnd(e.target.value)} placeholder="Fim" className={field.replace("mt-1.5 ", "")} /></div></div></div>

              <div className="rounded-2xl border border-[#384154] bg-[#252B38] p-4"><label className="text-[11px] font-bold uppercase tracking-wider text-white">Comentários / Anotações<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="O que você precisa lembrar deste estudo?" className="mt-2 w-full resize-none rounded-xl border border-[#384154] bg-[#171B25] p-3 text-xs text-white outline-none focus:border-[#F3AA2D]" /></label></div>
            </section>
          </div>
        </div>

        {error && <div className="border-t border-red-900/50 bg-red-950/20 px-5 py-3 text-xs font-semibold text-red-300 sm:px-6">{error}</div>}
        <footer className="flex flex-col gap-3 border-t border-[#384154] bg-[#171B25] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="text-xs text-slate-300"><b className="text-white">{ptDate(effectiveDate)}</b> · {timeLabel(durationMinutes)} · {modality}{scheduleReviews && selectedReviewDays.length ? ` · ${selectedReviewDays.length} revisão(ões)` : ""}</div><div className="flex gap-2 sm:ml-auto"><button type="button" onClick={onClose} disabled={saving} className={`${buttonBase} px-5 py-2.5 text-xs font-bold`}>Cancelar</button><button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-[#F3AA2D] px-5 py-2.5 text-xs font-bold text-[#11151F] disabled:opacity-50">{saving ? "Salvando..." : "Salvar registro"}</button></div></footer>
      </div>
    </div>
  );
};
