import React, { useEffect, useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { Logo } from "../brand/Logo";
import { Pause, Play, Square, Minus, Maximize2, X } from "lucide-react";

/**
 * Tela flutuante do cronômetro (estilo "estudei"): contagem real e verdadeira,
 * baseada em startedAt (Date.now) — continua contando mesmo com a aba em
 * segundo plano. Só encerra no "PARAR E SALVAR", que devolve o tempo decorrido.
 */

const pad = (n: number) => String(n).padStart(2, "0");

const formatElapsed = (sec: number) =>
  `${Math.floor(sec / 3600)}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;

interface TimerOverlayProps {
  open: boolean;
  disciplineName?: string;
  /** Chamado ao "PARAR E SALVAR" com o tempo decorrido; o overlay se fecha. */
  onStop: (elapsedSeconds: number) => void;
  /** Fecha a tela flutuante sem parar a contagem (continua em segundo plano). */
  onClose: () => void;
}

export const TimerOverlay: React.FC<TimerOverlayProps> = ({ open, disciplineName, onStop, onClose }) => {
  const { timer, startTimer, pauseTimer } = useStudy();
  const [minimized, setMinimized] = useState(false);

  // Ao abrir, garante a contagem ativa (retoma de onde parou, sem zerar).
  useEffect(() => {
    if (open && !timer.isRunning) startTimer();
    if (!open) setMinimized(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const sec = timer.elapsedSeconds;
  const timeText = formatElapsed(sec);

  const handleStop = () => {
    const elapsed = timer.elapsedSeconds;
    pauseTimer();
    onStop(elapsed);
  };

  // Minimizada: pílula flutuante no canto, continuando a contar em segundo plano.
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[70] flex items-center gap-3 rounded-full border border-[#263447] bg-[#111B2D]/95 px-4 py-2.5 shadow-2xl">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#2BBF8A]" />
        <span className="min-w-[4.5rem] text-center text-sm font-bold tabular-nums text-white">
          {pad(Math.floor(sec / 3600))}:{pad(Math.floor((sec % 3600) / 60))}:{pad(sec % 60)}
        </span>
        <button
          type="button"
          onClick={() => setMinimized(false)}
          title="Expandir cronômetro"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1D2B40] text-[#93A2B7] hover:text-white"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleStop}
          title="Parar e salvar"
          className="flex items-center gap-1.5 rounded-full bg-[#2BBF8A] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0B1120] hover:brightness-110"
        >
          <Square className="h-3 w-3" />
          Parar e salvar
        </button>
      </div>
    );
  }

  // Tela cheia flutuante sobre o app.
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0B1120]/85">
      <div className="flex justify-end gap-3 p-5">
        <button
          type="button"
          onClick={() => setMinimized(true)}
          title="Minimizar (continua contando)"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111B2D] text-[#93A2B7] hover:bg-[#223149] hover:text-white"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Fechar (continua contando)"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111B2D] text-[#93A2B7] hover:bg-[#223149] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <Logo variant="full" size="md" className="mb-6" />
        <p className="text-sm font-medium text-[#93A2B7]">Você está estudando:</p>
        <p className="mt-1 text-xl font-bold text-white">{disciplineName || "—"}</p>

        <div className="mt-8 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[#1D2B40]">
          <div className="h-full rounded-full bg-[#527DFF] transition-all" style={{ width: `${(sec % 60) * (100 / 60)}%` }} />
        </div>

        <p className="num-condensed mt-6 text-[64px] font-black tabular-nums leading-none text-white sm:text-[96px]">
          {timeText}
        </p>

        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => (timer.isRunning ? pauseTimer() : startTimer())}
            title={timer.isRunning ? "Pausar contagem" : "Retomar contagem"}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1D2B40] text-white hover:bg-[#223149]"
          >
            {timer.isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={handleStop}
            title="Parar e salvar"
            className="flex items-center gap-2 rounded-full bg-[#2BBF8A] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0B1120] hover:brightness-110"
          >
            <Square className="h-4 w-4" />
            Parar e salvar
          </button>
        </div>
      </div>
    </div>
  );
};
