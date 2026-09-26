import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { Clock, Timer, X, Maximize2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CronometroView } from "../cronometro/CronometroView";

/**
 * Botão flutuante original do Registro de Estudos.
 * A posição, aparência e comportamento do relógio são preservados.
 * O conteúdo do popup usa o mesmo registro completo e atualizado do sistema.
 */
export const FloatingTimerWidget: React.FC = () => {
  const { timer, setActiveTab, activeEdital } = useStudy();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const activeDiscipline = activeEdital?.disciplines.find((d) => d.id === timer.disciplineId);

  return (
    <>
      {/* Floating Action Button (Bottom Right) — estrutura original preservada */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 select-none">
        {timer.isRunning && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2D3442] text-white shadow-xl border border-[#384154] hover:border-[#4A556E] cursor-pointer transition-colors duration-200"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-black tracking-wider">{formatTime(timer.elapsedSeconds)}</span>
            <span className="text-[10px] opacity-70 font-semibold truncate max-w-[110px]">
              {activeDiscipline?.name || "Estudando"}
            </span>
          </motion.div>
        )}

        <motion.button
          type="button"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen((prev) => !prev)}
          id="floating-clock-btn"
          aria-label="Abrir Cronômetro e Registro de Estudos"
          className={`relative flex h-16 w-16 items-center justify-center rounded-2xl sm:rounded-3xl cursor-pointer select-none transition-colors duration-200 border ${
            timer.isRunning
              ? "border-emerald-400/40 bg-[#10B981] text-white shadow-[0_10px_28px_-8px_rgba(16,185,129,0.5)]"
              : "border-[#F3AA2D]/40 bg-[#F3AA2D] text-[#11151F] shadow-[0_10px_28px_-8px_rgba(243,170,45,0.5)] hover:bg-[#D98F20]"
          }`}
        >
          <div className="relative flex items-center justify-center">
            {timer.isRunning ? (
              <Timer className="h-8 w-8 stroke-[2.2]" />
            ) : (
              <Clock className="h-8 w-8 stroke-[2.2]" />
            )}

            {timer.elapsedSeconds > 0 && !timer.isRunning && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#11151F] text-[#F3AA2D] text-[9px] font-black shadow-md border border-[#384154]">
                ||
              </span>
            )}
          </div>
        </motion.button>
      </div>

      {/* Popup original — mesma moldura/header, agora com o registro completo atualizado */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-[#0d0f12]/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#384154] bg-[#11151F] text-white max-h-[92vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#384154] bg-[#171B25] px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3AA2D] text-[#11151F]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="font-condensed text-[17px] font-bold text-white">
                    Registro de Estudos
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setActiveTab("cronometro");
                    }}
                    className="p-1.5 rounded-xl text-white hover:bg-[#252B38] hover:text-white transition cursor-pointer"
                    title="Abrir Registro de Estudos em Tela Cheia"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl text-white hover:bg-[#252B38] hover:text-white transition cursor-pointer"
                    title="Fechar Janela"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 px-5 py-4 scrollbar-thin">
                <CronometroView />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
