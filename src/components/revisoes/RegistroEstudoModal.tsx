import React, { useEffect, useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { ScheduledReview, StudyModality, StudySession } from "../../types";
import { getTodayLocalYmd } from "./reviewHelpers";
import { X, CalendarCheck2, ChevronDown, Plus, Pause, Play, RotateCcw } from "lucide-react";

/**
 * Modal compacto "Registro de Estudo" (layout claro da referência).
 * Aberto com uma revisão: pré-preenche categoria/disciplina/tópico/data e,
 * ao salvar, conclui a revisão mantendo o vínculo e o algoritmo espaçado.
 * Aberto pelo botão "Adicionar Estudo": registra a sessão e, se marcado,
 * programa revisões pelos intervalos escolhidos.
 */

const MODALITIES: StudyModality[] = [
  "Teoria",
  "Questões",
  "Revisão",
  "Videoaula",
  "Lei Seca",
  "Simulado",
];

const DEFAULT_CHIPS = [1, 7, 15, 30, 60];
const EXTRA_CHIPS = [120, 245];

const parseTimeToMinutes = (text: string): number => {
  const m = text.trim().match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};

const addDaysYmd = (base: string, days: number): string => {
  const [y, mo, d] = base.split("-").map(Number);
  const date = new Date(y, (mo || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

const underlineInput =
  "w-full border-0 border-b border-[#263447] bg-transparent px-1 py-1.5 text-sm text-white placeholder:text-[#718096] focus:border-[#7DA2FF] focus:outline-none rounded-none";

interface RegistroEstudoModalProps {
  open: boolean;
  onClose: () => void;
  review?: ScheduledReview | null;
  onSuccessToast?: (msg: string) => void;
  preselectedDisciplineId?: string;
  preselectedTopicId?: string;
  preselectedModality?: StudyModality;
  /** Aberto pelo cronômetro: pré-preenche o tempo decorrido e zera o timer ao salvar. */
  fromTimer?: boolean;
}

export const RegistroEstudoModal: React.FC<RegistroEstudoModalProps> = ({
  open,
  onClose,
  review,
  onSuccessToast,
  preselectedDisciplineId,
  preselectedTopicId,
  preselectedModality,
  fromTimer,
}) => {
  const {
    activeEdital,
    timer,
    startTimer,
    pauseTimer,
    resetTimer,
    logStudySession,
    finishCurrentSession,
    completeScheduledReview,
    updateScheduledReview,
    createScheduledReview,
  } = useStudy();

  const todayStr = getTodayLocalYmd();
  const yesterdayStr = addDaysYmd(todayStr, -1);

  const [dateMode, setDateMode] = useState<"hoje" | "ontem" | "outro">("hoje");
  const [customDate, setCustomDate] = useState(todayStr);
  const [modality, setModality] = useState<StudyModality>("Teoria");
  const [disciplineId, setDisciplineId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [timeText, setTimeText] = useState("00:00:00");
  const [material, setMaterial] = useState("");
  const [theoryCompleted, setTheoryCompleted] = useState(false);
  const [scheduleReviews, setScheduleReviews] = useState(true);
  const [chips, setChips] = useState<number[]>(DEFAULT_CHIPS);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [pagesStart, setPagesStart] = useState("");
  const [pagesEnd, setPagesEnd] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoStart, setVideoStart] = useState("");
  const [videoEnd, setVideoEnd] = useState("");
  const [comments, setComments] = useState("");
  const [saveAndCreateNew, setSaveAndCreateNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Prefill: com revisão vinculada, categoria/disciplina/tópico/data já vêm prontos.
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setSaveAndCreateNew(false);
    setDateMode("hoje");
    setCustomDate(todayStr);
    setTimeText("00:00:00");
    setMaterial("");
    setTheoryCompleted(false);
    setTotalQuestoes(0);
    setAcertos(0);
    setErros(0);
    setPagesStart("");
    setPagesEnd("");
    setVideoTitle("");
    setVideoStart("");
    setVideoEnd("");
    setComments("");
    if (review) {
      setModality("Revisão");
      setDisciplineId(review.disciplineId);
      setTopicId(review.topicId);
      setScheduleReviews(false);
      setChips(DEFAULT_CHIPS);
      if (review.durationMinutes) setTimeText(review.durationMinutes >= 60 ? `${Math.floor(review.durationMinutes / 60)}:${String(review.durationMinutes % 60).padStart(2, "0")}:00` : `${review.durationMinutes}:00`);
    } else {
      setModality(fromTimer ? timer.modality || "Teoria" : preselectedModality || "Teoria");
      setDisciplineId(preselectedDisciplineId || activeEdital?.disciplines[0]?.id || "");
      setTopicId(preselectedTopicId || "");
      setScheduleReviews(true);
      setChips(DEFAULT_CHIPS);
      if (fromTimer && timer.elapsedSeconds > 0) {
        const sec = timer.elapsedSeconds;
        setTimeText(
          `${Math.floor(sec / 3600)}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}:${String(
            sec % 60
          ).padStart(2, "0")}`
        );
      }
      if (fromTimer && timer.questionsDone > 0) {
        setTotalQuestoes(Math.max(0, timer.questionsDone || 0));
        setAcertos(Math.max(0, timer.questionsCorrect || 0));
        setErros(Math.max(0, timer.questionsDone - (timer.questionsCorrect || 0)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, review?.id]);

  const topics = (activeEdital?.topics || []).filter((t) => t.disciplineId === disciplineId);
  const studyDate = dateMode === "hoje" ? todayStr : dateMode === "ontem" ? yesterdayStr : customDate;

  if (!open) return null;

  const handleAddChip = () => {
    const next = EXTRA_CHIPS.find((c) => !chips.includes(c)) || (chips[chips.length - 1] || 0) + 30;
    setChips([...chips, next].sort((a, b) => a - b));
  };

  const handleSave = async () => {
    if (!studyDate) {
      setFormError("Informe a data do estudo.");
      return;
    }
    if (!disciplineId || !topicId) {
      setFormError("Selecione a disciplina e o tópico.");
      return;
    }
    const disc = activeEdital?.disciplines.find((d) => d.id === disciplineId);
    const topic = activeEdital?.topics.find((t) => t.id === topicId);
    if (!disc || !topic) {
      setFormError("Disciplina ou tópico inválido.");
      return;
    }

    const durationMinutes = parseTimeToMinutes(timeText);
    // Total é independente: usa o valor informado; sem total, assume acertos+erros.
    const qDone = totalQuestoes > 0 ? totalQuestoes : Math.max(0, acertos) + Math.max(0, erros);
    if (durationMinutes <= 0 && qDone <= 0) {
      setFormError("Informe o tempo estudado ou registre questões.");
      return;
    }

    setSaving(true);
    try {
    const sessionData: Omit<StudySession, "id"> = {
      editalId: review?.editalId || activeEdital?.id || "",
      disciplineId: disc.id,
      disciplineName: disc.name,
      topicId: topic.id,
      topicName: topic.name,
      date: new Date(`${studyDate}T12:00:00`).toISOString(),
      studyDate,
      durationMinutes,
      modality,
      questionsDone: qDone,
      questionsCorrect: Math.max(0, acertos),
      questionsWrong: Math.max(0, erros) > 0 ? Math.max(0, erros) : undefined,
      notes: comments,
      material: material || undefined,
      pagesStart: pagesStart ? Number(pagesStart) : undefined,
      pagesEnd: pagesEnd ? Number(pagesEnd) : undefined,
      videoTitle: videoTitle || undefined,
      videoStart: videoStart || undefined,
      videoEnd: videoEnd || undefined,
      theoryCompleted: theoryCompleted || undefined,
    };

    if (review) {
      // Registra a sessão completa (com material, páginas, videoaula e comentários).
      logStudySession(sessionData);

      // Mantém o vínculo: conclui a revisão (gera o próximo ciclo) e grava as métricas nela.
      completeScheduledReview(review.id, { logAsSession: false, notes: comments });
      updateScheduledReview(review.id, {
        ...(durationMinutes > 0 ? { durationMinutes } : {}),
        ...(qDone > 0 ? { questionsDone: qDone, questionsCorrect: Math.max(0, acertos) } : {}),
      });
      onSuccessToast?.("Registro salvo! Revisão concluída e próximo ciclo programado.");
    } else {
      // Fluxo padrão: mesma persistência do registro manual/cronômetro (finishCurrentSession
      // salva a sessão, cria as revisões dos ciclos escolhidos e zera o timer ativo).
      await finishCurrentSession({
        editalId: review?.editalId || activeEdital?.id || "",
        disciplineId: disc.id,
        topicId: topic.id,
        modality,
        durationMinutes,
        questionsDone: qDone,
        questionsCorrect: Math.max(0, acertos),
        questionsWrong: Math.max(0, erros) > 0 ? Math.max(0, erros) : undefined,
        notes: comments,
        studyDate,
        theoryCompleted,
        scheduleReviews,
        selectedReviewDays: chips,
      });
      onSuccessToast?.(
        scheduleReviews && chips.length > 0
          ? "Registro salvo e revisões programadas!"
          : "Registro de estudo salvo!"
      );
    }
    } finally {
      setSaving(false);
    }

    if (saveAndCreateNew) {
      setTimeText("00:00:00");
      setMaterial("");
      setTheoryCompleted(false);
      setTotalQuestoes(0);
      setAcertos(0);
      setErros(0);
      setPagesStart("");
      setPagesEnd("");
      setVideoTitle("");
      setVideoStart("");
      setVideoEnd("");
      setComments("");
      setTopicId("");
      setFormError(null);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1120]/40 p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#263447] bg-[#1D2B40] p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-bold text-white">Registro de Estudo</h2>
          <button type="button" onClick={onClose} className="p-1 text-[#93A2B7] hover:text-white" title="Fechar">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Data: HOJE / ONTEM / OUTRO */}
        <div className="mt-4 flex items-center gap-3">
          <CalendarCheck2 className="h-5 w-5 text-white" />
          {(["hoje", "ontem", "outro"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDateMode(mode)}
              className={`rounded-md px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                dateMode === mode
                  ? "bg-[#527DFF] text-white"
                  : "bg-[#111B2D] text-[#93A2B7] hover:bg-[#223149]"
              }`}
            >
              {mode === "hoje" ? "Hoje" : mode === "ontem" ? "Ontem" : "Outro"}
            </button>
          ))}
          {dateMode === "outro" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="rounded-md border border-[#263447] bg-[#111B2D] px-2 py-1.5 text-xs text-white focus:border-[#7DA2FF] focus:outline-none"
            />
          )}
        </div>

        {/* Linha 1: Categoria / Disciplina / Tempo */}
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_1.4fr_0.8fr]">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#93A2B7]">Categoria</label>
            <div className="relative">
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as StudyModality)}
                className={`${underlineInput} appearance-none pr-6`}
              >
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F4B544]" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#93A2B7]">Disciplina</label>
            <div className="relative">
              <select
                value={disciplineId}
                onChange={(e) => {
                  setDisciplineId(e.target.value);
                  setTopicId("");
                }}
                className={`${underlineInput} appearance-none pr-6`}
              >
                <option value="">Selecione...</option>
                {(activeEdital?.disciplines || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F4B544]" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#93A2B7]">Tempo de estudo</label>
            <input
              type="text"
              value={timeText}
              onChange={(e) => setTimeText(e.target.value)}
              placeholder="00:00:00"
              className={underlineInput}
            />
            {fromTimer && (
              <div className="mt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (timer.isRunning) {
                      const sec = timer.elapsedSeconds;
                      setTimeText(
                        `${Math.floor(sec / 3600)}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`
                      );
                      pauseTimer();
                    } else {
                      startTimer();
                    }
                  }}
                  title={timer.isRunning ? "Pausar contagem" : "Retomar contagem"}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-[#111B2D] text-[#93A2B7] hover:bg-[#223149] hover:text-white"
                >
                  {timer.isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetTimer();
                    setTimeText("00:00:00");
                  }}
                  title="Zerar contagem"
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-[#111B2D] text-[#93A2B7] hover:bg-[#223149] hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                {timer.isRunning && (
                  <span className="text-[10px] font-semibold text-[#2BBF8A]">Contando…</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Linha 2: Tópico / Material */}
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-[2fr_1fr]">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#93A2B7]">Tópico</label>
            <div className="relative">
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className={`${underlineInput} appearance-none pr-6`}
              >
                <option value="">Selecione...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F4B544]" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#93A2B7]">Material</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Ex.: Aula 01"
              className={underlineInput}
            />
          </div>
        </div>

        {/* Opções de conclusão e planejamento */}
        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#93A2B7]">
            <input
              type="checkbox"
              checked={theoryCompleted}
              onChange={(e) => setTheoryCompleted(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#39475C] text-[#F4B544] focus:ring-[#7DA2FF]"
            />
            Teoria finalizada
          </label>

          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#93A2B7]">
            <input
              type="checkbox"
              checked={scheduleReviews}
              onChange={(e) => setScheduleReviews(e.target.checked)}
              disabled={!!review}
              className="h-3.5 w-3.5 rounded border-[#39475C] text-[#F4B544] focus:ring-[#7DA2FF] disabled:opacity-50"
            />
            Programar revisões
          </label>

          {scheduleReviews && !review && (
            <div className="flex flex-wrap items-center gap-1.5 pl-6">
              {chips.map((days) => (
                <span
                  key={days}
                  className="flex items-center gap-1 rounded-md border border-[#F4B544]/30 bg-[#527DFF]/10 px-2 py-1 text-[11px] font-bold text-[#F4B544]"
                >
                  {days}d
                  <button
                    type="button"
                    onClick={() => setChips(chips.filter((c) => c !== days))}
                    className="text-[#F4B544] hover:text-[#F4B544]"
                    title="Remover intervalo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={handleAddChip}
                title="Adicionar intervalo"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[#527DFF] text-white hover:bg-[#416CEB]"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Métricas: Questões / Páginas / Videoaulas */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border-2 border-[#263447] bg-[#111B2D] p-3">
            <p className="text-center text-[10px] font-bold uppercase tracking-wide text-[#93A2B7]">
              Questões · Total / Acertos / Erros
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <input
                type="number"
                min={0}
                value={totalQuestoes}
                onChange={(e) => setTotalQuestoes(Math.max(0, parseInt(e.target.value) || 0))}
                title="Total de questões (independente)"
                className="w-14 border-0 border-b border-[#263447] bg-transparent py-1 text-center text-sm font-semibold text-white focus:border-[#7DA2FF] focus:outline-none"
              />
              <input
                type="number"
                min={0}
                value={acertos}
                onChange={(e) => setAcertos(Math.max(0, parseInt(e.target.value) || 0))}
                title="Acertos (independente)"
                className="w-14 border-0 border-b border-[#263447] bg-transparent py-1 text-center text-sm font-semibold text-[#2BBF8A] focus:border-[#7DA2FF] focus:outline-none"
              />
              <input
                type="number"
                min={0}
                value={erros}
                onChange={(e) => setErros(Math.max(0, parseInt(e.target.value) || 0))}
                title="Erros (independente)"
                className="w-14 border-0 border-b border-[#263447] bg-transparent py-1 text-center text-sm font-semibold text-[#F16D75] focus:border-[#7DA2FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border-2 border-[#263447] bg-[#111B2D] p-3">
            <p className="text-center text-[10px] font-bold uppercase tracking-wide text-[#93A2B7]">
              Páginas · Início / Fim
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <input
                type="number"
                min={0}
                value={pagesStart}
                onChange={(e) => setPagesStart(e.target.value)}
                placeholder="0"
                className="w-14 border-0 border-b border-[#2A3A52] bg-transparent py-1 text-center text-sm font-semibold text-[#F5F7FB] placeholder:text-[#93A2B7] focus:border-[#7DA2FF] focus:outline-none"
              />
              <input
                type="number"
                min={0}
                value={pagesEnd}
                onChange={(e) => setPagesEnd(e.target.value)}
                placeholder="0"
                className="w-14 border-0 border-b border-[#2A3A52] bg-transparent py-1 text-center text-sm font-semibold text-[#F5F7FB] placeholder:text-[#93A2B7] focus:border-[#7DA2FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border-2 border-[#263447] bg-[#111B2D] p-3">
            <p className="text-center text-[10px] font-bold uppercase tracking-wide text-[#93A2B7]">
              Videoaulas · Título / Início / Fim
            </p>
            <div className="mt-2 grid grid-cols-3 items-center gap-2">
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Vídeo 01"
                className="w-full border-0 border-b border-[#263447] bg-transparent py-1 text-xs text-white placeholder:text-[#718096] focus:border-[#7DA2FF] focus:outline-none"
              />
              <input
                type="text"
                value={videoStart}
                onChange={(e) => setVideoStart(e.target.value)}
                placeholder="00:00:00"
                className="w-full border-0 border-b border-[#263447] bg-transparent py-1 text-xs text-white placeholder:text-[#718096] focus:border-[#7DA2FF] focus:outline-none"
              />
              <input
                type="text"
                value={videoEnd}
                onChange={(e) => setVideoEnd(e.target.value)}
                placeholder="00:00:00"
                className="w-full border-0 border-b border-[#263447] bg-transparent py-1 text-xs text-white placeholder:text-[#718096] focus:border-[#7DA2FF] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Comentários */}
        <div className="mt-5">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[#93A2B7]">Comentários</label>
          <textarea
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="mt-1 w-full resize-y border-0 border-b border-[#263447] bg-transparent px-1 py-1.5 text-sm text-white focus:border-[#7DA2FF] focus:outline-none"
          />
        </div>

        {formError && (
          <p className="mt-3 text-xs font-semibold text-[#F16D75]">{formError}</p>
        )}

        {/* Rodapé */}
        <div className="mt-6 flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#93A2B7]">
            <input
              type="checkbox"
              checked={saveAndCreateNew}
              onChange={(e) => setSaveAndCreateNew(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#39475C] text-[#F4B544] focus:ring-[#7DA2FF]"
            />
            Salvar e criar novo
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#263447] px-6 py-2 text-sm font-bold text-[#C4CEDB] hover:bg-[#223149]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !disciplineId || !topicId}
              className="rounded-lg bg-[#527DFF] px-8 py-2 text-sm font-bold text-white transition enabled:hover:bg-[#416CEB] disabled:cursor-not-allowed disabled:bg-[#527DFF]/40"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
