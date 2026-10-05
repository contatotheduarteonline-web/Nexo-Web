import React from "react";
import { useStudy } from "../../context/StudyContext";
import { Clock, Timer } from "lucide-react";
import { motion } from "motion/react";

/**
 * Botão flutuante do Registro de Estudos.
 *
 * O botão não abre mais um popup intermediário. Ao clicar no relógio,
 * o usuário entra diretamente no CronometroModal em tela cheia.
 * Isso evita que o conteúdo completo do registro seja renderizado
 * dentro de uma caixa estreita e cause estouro de cards/textos.
 */
export const FloatingTimerWidget: React.FC = () => {
  const { timer, setActiveTab } = useStudy();

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab("cronometro")}
        id="floating-clock-btn"
        aria-label="Abrir Registro de Estudos em tela cheia"
        title="Abrir Registro de Estudos em tela cheia"
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
  );
};
