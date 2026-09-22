import React, { useState, useEffect, useRef } from "react";
import { useStudy } from "../../context/StudyContext";
import { StudyModality } from "../../types";
import {
  X,
  Clock,
  BookOpen,
  Target,
  RotateCw,
  Video,
  Scale,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Calendar,
  Timer as TimerIcon,
  PenLine,
  CheckCircle2,
} from "lucide-react";

interface ManualStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDisciplineId?: string;
  preselectedTopicId?: string;
}

// ---------- Date helpers (local, no timezone drift) ----------
function getTodayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getYesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDatePtBr(ymd: string): string {
  const [y, m, d] = ymd.split("T")[0].split("-");
  if (y && m && d) return `${d}/${m}/${y}`;
  return ymd;
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
  const [modality, setModality] = useState<StudyModality>("Teoria");

  // Time mode: local stopwatch or manual entry
  const [timeMode, setTimeMode] = useState<"stopwatch" | "manual">("stopwatch");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [manualHours, setManualHours] = useState<number>(0);
  const [manualMinutes, setManualMinutes] = useState<number>(0);

  // Questions: three independent counters
  const [questionsDone, setQuestionsDone] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);
  const [questionsWrong, setQuestionsWrong] = useState<number>(0);

  // Study date
  const [dateSelectionType, setDateSelectionType] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState<string>(getTodayYmd());

  // Notes
  const [notes, setNotes] = useState<string>("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set defaults when opening
  useEffect(() => {
    if (isOpen && activeEdital) {
      const discId = preselectedDisciplineId || activeEdital.disciplines[0]?.id || "";
      setDisciplineId(discId);

      const availableTopics = activeEdital.topics.filter((t) => t.disciplineId === discId);
      const topId = preselectedTopicId || availableTopics[0]?.id || "";
      setTopicId(topId);

      setModality("Teoria");
      setTimeMode("stopwatch");
      setElapsedSeconds(0);
      setIsRunning(false);
      setManualHours(0);
      setManualMinutes(0);
      setQuestionsDone(0);
      setQuestionsCorrect(0);
      setQuestionsWrong(0);
      setDateSelectionType("today");
      setCustomDate(getTodayYmd());
      setNotes("");
    }
  }, [isOpen, activeEdital, preselectedDisciplineId, preselectedTopicId]);

  // Local stopwatch loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

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

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleAdjustMinutes = (mins: number) => {
    setElapsedSeconds((prev) => Math.max(0, prev + mins * 60));
  };

  // Questions handlers — each counter is fully independent
  const handleAddDone = () => setQuestionsDone((p) => p + 1);
  const handleSubtractDone = () => setQuestionsDone((p) => Math.max(0, p - 1));
  const handleAddCorrect = () => setQuestionsCorrect((p) => p + 1);
  const handleSubtractCorrect = () => setQuestionsCorrect((p) => Math.max(0, p - 1));
  const handleAddWrong = () => setQuestionsWrong((p) => p + 1);
  const handleSubtractWrong = () => setQuestionsWrong((p) => Math.max(0, p - 1));

  const effectiveStudyDate =
    dateSelectionType === "today"
      ? getTodayYmd()
      : dateSelectionType === "yesterday"
      ? getYesterdayYmd()
      : customDate || getTodayYmd();

  const durationMinutes =
    timeMode === "manual"
      ? Math.max(0, manualHours * 60 + manualMinutes)
      : Math.round(elapsedSeconds / 60);

  const durationLabel =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? ` ${durationMinutes % 60}min` : ""}`
      : `${durationMinutes} min`;

  const appendQuickTag = (tagText: string) => {
    setNotes((prev) => {
      const prefix = prev.trim() ? `${prev.trim()} ` : "";
      return `${prefix}[${tagText}] `;
    });
  };

  const modalities: { key: StudyModality; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: "Teoria", label: "Teoria", icon: BookOpen },
    { key: "Questões", label: "Questões", icon: Target },
    { key: "Revisão", label: "Revisão", icon: RotateCw },
    { key: "Videoaula", label: "Vídeo", icon: Video },
    { key: "Lei Seca", label: "Lei Seca", icon: Scale },
    { key: "Simulado", label: "Simulado", icon: FileText },
  ];

  const handleFinish = () => {
    if (!disciplineId) {
      alert("Selecione uma disciplina.");
      return;
    }
    if (
      durationMinutes <= 0 &&
      questionsDone <= 0 &&
      questionsCorrect <= 0 &&
      questionsWrong <= 0
    ) {
      alert("Informe o tempo estudado ou registre questões para salvar.");
      return;
    }

    logStudySession({
      editalId: activeEdital.id,
      disciplineId,
      disciplineName: selectedDiscipline?.name || "Disciplina",
      topicId,
      topicName: selectedTopic?.name || "Geral",
      date: new Date(`${effectiveStudyDate}T12:00:00`).toISOString(),
      durationMinutes: Math.max(1, durationMinutes),
      modality,
      questionsDone,
      questionsCorrect,
      notes,
    });

    setIsRunning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0f12]/70 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#384154] bg-[#11151F] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#384154] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 text-[#F3AA2D]">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="font-condensed text-[20px] font-bold text-white">
              Registro de Estudos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white hover:bg-[#252B38] hover:text-white cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Disciplina & Tópico */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-white">
                Disciplina
              </label>
              <select
                value={disciplineId}
                onChange={(e) => handleDisciplineChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#384154] bg-[#252B38] px-3 py-2.5 text-xs font-semibold text-white focus:border-[#F3AA2D] focus:outline-none cursor-pointer"
              >
                {disciplines.length === 0 ? (
                  <option value="">Nenhuma disciplina</option>
                ) : (
                  disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-white">
                Tópico
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#384154] bg-[#252B38] px-3 py-2.5 text-xs font-semibold text-white focus:border-[#F3AA2D] focus:outline-none cursor-pointer"
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

          {/* Modalidades */}
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {modalities.map((item) => {
              const IconComp = item.icon;
              const isSelected = modality === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setModality(item.key)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#F3AA2D] text-[#11151F]"
                      : "border border-[#384154] bg-[#252B38] text-white hover:border-[#F3AA2D]/40"
                  }`}
                >
                  <IconComp className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cronômetro / Tempo manual */}
          <div className="nx-card p-5 text-center">
            {/* Alternador */}
            <div className="mb-4 inline-flex items-center rounded-xl border border-[#384154] bg-[#171B25] p-1">
              <button
                type="button"
                onClick={() => setTimeMode("stopwatch")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  timeMode === "stopwatch"
                    ? "bg-[#F3AA2D] text-[#11151F]"
                    : "text-white hover:text-white"
                }`}
              >
                <TimerIcon className="h-3.5 w-3.5" />
                <span>Cronômetro</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeMode("manual")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  timeMode === "manual"
                    ? "bg-[#F3AA2D] text-[#11151F]"
                    : "text-white hover:text-white"
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>Registrar tempo manual</span>
              </button>
            </div>

            {timeMode === "stopwatch" ? (
              <>
                {/* Display do tempo */}
                <div className="num-condensed text-[56px] font-bold leading-none tracking-tight text-white">
                  {formatTime(elapsedSeconds)}
                </div>

                {/* Disciplina e tópico em foco */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#F3AA2D]">
                    {selectedDiscipline?.name || "Disciplina"}
                  </div>
                  <div className="mt-0.5 text-[13px] font-medium text-white">
                    {selectedTopic?.name || "Geral"}
                  </div>
                </div>

                {/* Ajustes rápidos */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                  {[-5, 5, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleAdjustMinutes(mins)}
                      className="rounded-lg border border-[#384154] bg-[#171B25] px-2.5 py-1 font-mono text-white hover:border-[#F3AA2D]/40 hover:text-[#F3AA2D] cursor-pointer transition-colors"
                    >
                      {mins > 0 ? `+${mins}` : `−${Math.abs(mins)}`}
                    </button>
                  ))}
                </div>

                {/* Ações */}
                <div className="mt-5 flex items-center justify-center gap-3">
                  {isRunning ? (
                    <button
                      type="button"
                      onClick={() => setIsRunning(false)}
                      className="nx-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-[13px]"
                    >
                      <Pause className="h-4 w-4 fill-[#11151F]" />
                      Pausar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRunning(true)}
                      className="nx-btn-primary inline-flex items-center gap-2 px-7 py-2.5 text-[13px]"
                    >
                      <Play className="h-4 w-4 fill-[#11151F]" />
                      {elapsedSeconds > 0 ? "Continuar" : "Iniciar"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRunning(false);
                      setElapsedSeconds(0);
                    }}
                    className="rounded-xl border border-[#384154] px-3.5 py-2.5 text-white hover:border-[#F3AA2D]/40 hover:text-white cursor-pointer transition-colors"
                    title="Zerar"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Tempo estudado
                </span>
                <div className="mt-3 flex items-center justify-center gap-2.5">
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={manualHours}
                      onChange={(e) =>
                        setManualHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))
                      }
                      className="num-condensed h-16 w-[72px] rounded-2xl border border-[#384154] bg-[#171B25] text-center text-[32px] font-bold text-white focus:border-[#F3AA2D] focus:outline-none"
                    />
                    <span className="mt-1 text-[10px] font-bold text-white">Horas</span>
                  </div>
                  <span className="num-condensed text-[32px] font-bold text-white">:</span>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={manualMinutes}
                      onChange={(e) =>
                        setManualMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
                      }
                      className="num-condensed h-16 w-[72px] rounded-2xl border border-[#384154] bg-[#171B25] text-center text-[32px] font-bold text-white focus:border-[#F3AA2D] focus:outline-none"
                    />
                    <span className="mt-1 text-[10px] font-bold text-white">Minutos</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Questões */}
          <div className="nx-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                Questões
              </span>
              {questionsDone > 0 && (
                <span className="text-xs font-bold text-[#F3AA2D]">
                  {Math.round((questionsCorrect / questionsDone) * 100)}% aproveitamento
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5 text-center">
              {/* Questões */}
              <div className="nx-deep rounded-xl p-3">
                <div className="num-condensed text-[24px] font-bold text-white">
                  {questionsDone}
                </div>
                <div className="mt-0.5 text-[11px] text-white">Questões</div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={handleSubtractDone}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#384154] text-white hover:border-[#F3AA2D]/40 cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDone}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#384154] text-white hover:bg-[#4A556E] cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Acertos */}
              <div className="nx-deep rounded-xl p-3">
                <div className="num-condensed text-[24px] font-bold text-[#34D399]">
                  {questionsCorrect}
                </div>
                <div className="mt-0.5 text-[11px] text-[#34D399]/70">Acertos</div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={handleSubtractCorrect}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#384154] text-white hover:border-[#34D399]/40 cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCorrect}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#34D399] text-white cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Erros */}
              <div className="nx-deep rounded-xl p-3">
                <div className="num-condensed text-[24px] font-bold text-[#F87171]">
                  {questionsWrong}
                </div>
                <div className="mt-0.5 text-[11px] text-[#F87171]/70">Erros</div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={handleSubtractWrong}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#384154] text-white hover:border-[#F87171]/40 cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleAddWrong}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F87171] text-white cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data do estudo */}
          <div className="nx-card p-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white">
                Data do estudo
              </label>
              <div className="flex items-center rounded-xl border border-[#384154] bg-[#171B25] p-0.5">
                {(["today", "yesterday", "custom"] as const).map((type) => {
                  const label =
                    type === "today" ? "Hoje" : type === "yesterday" ? "Ontem" : "Outra data";
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDateSelectionType(type)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        dateSelectionType === type
                          ? "bg-[#F3AA2D] text-[#11151F]"
                          : "text-white hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {dateSelectionType === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="mt-3 w-full rounded-xl border border-[#384154] bg-[#171B25] px-3 py-2 text-xs font-semibold text-white focus:border-[#F3AA2D] focus:outline-none cursor-pointer"
              />
            )}

            <div className="mt-3 flex items-center justify-between border-t border-[#384154] pt-2.5 text-[11px] text-white">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-white" />
                Data de referência:
              </span>
              <span className="font-semibold text-white">
                {formatDatePtBr(effectiveStudyDate)}
              </span>
            </div>
          </div>

          {/* Anotações */}
          <div className="nx-card p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Anotações
            </h3>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que você precisa lembrar deste estudo?"
              className="mt-2 w-full resize-none rounded-xl border border-[#384154] bg-[#171B25] p-2.5 text-xs text-white placeholder:text-white focus:border-[#F3AA2D] focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Lei Seca", "Pegadinha", "Ponto-chave", "Dúvida"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => appendQuickTag(tag)}
                  className="rounded-lg border border-[#384154] bg-[#171B25] px-2 py-1 text-[11px] font-medium text-white hover:border-[#F3AA2D]/40 hover:text-[#F3AA2D] cursor-pointer transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: resumo + finalizar */}
        <div className="flex items-center justify-between gap-4 border-t border-[#384154] bg-[#171B25] px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white">
            <span className="font-semibold text-white">
              {formatDatePtBr(effectiveStudyDate)}
            </span>
            <span>·</span>
            <span className="font-semibold text-white">{durationLabel}</span>
            <span>·</span>
            <span>{modality}</span>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="nx-btn-primary inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-[13px] font-bold"
          >
            <CheckCircle2 className="h-4 w-4" />
            Finalizar estudo
          </button>
        </div>
      </div>
    </div>
  );
};
