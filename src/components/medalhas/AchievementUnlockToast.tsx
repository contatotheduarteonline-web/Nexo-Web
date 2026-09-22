import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAchievementQueue } from "../../context/AchievementQueueContext";
import { AchievementMedal } from "./AchievementMedal";
import { X, Check } from "lucide-react";

export const AchievementUnlockToast: React.FC = () => {
  const { currentAchievement, dismissCurrent, queueLength } = useAchievementQueue();
  const [animatedXp, setAnimatedXp] = useState(0);

  // Smooth XP count-up effect on entry
  useEffect(() => {
    if (!currentAchievement) {
      setAnimatedXp(0);
      return;
    }

    const targetXp = currentAchievement.xpReward;
    const duration = 650;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedXp(Math.round(eased * targetXp));

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [currentAchievement]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-5 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 flex flex-col items-center sm:items-end select-none"
    >
      <AnimatePresence mode="wait">
        {currentAchievement && (
          <motion.div
            key={currentAchievement.id}
            initial={{ opacity: 0, y: 36, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94, transition: { duration: 0.22, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 340, damping: 24 }}
            className="pointer-events-auto relative w-full sm:w-96 rounded-2xl border border-slate-700/80 bg-[#0B0F17]/95 p-4 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/10 overflow-hidden"
          >
            {/* Subtle specular gleam sweeping across the border */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
              className="absolute top-0 left-0 h-[2px] w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
            />

            {/* Ambient Background Warm Accent Glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#F59E0B]/15 blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={dismissCurrent}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              title="Fechar notificação"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Content Row: [MEDALHA] on the left, details on the right */}
            <div className="flex items-center gap-3.5 pr-6">
              {/* Medal with entering scale transition */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.08 }}
                className="shrink-0"
              >
                <AchievementMedal
                  badgeId={currentAchievement.badgeId}
                  category={currentAchievement.category}
                  state="unlocked"
                  size="md"
                  showCheckBadge={false}
                />
              </motion.div>

              {/* Text Information Hierarchy */}
              <div className="flex-1 min-w-0">
                {/* Header tag */}
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#FBBF24] dark:text-[#FBBF24]">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    Conquista Desbloqueada
                  </span>
                  {queueLength > 1 && (
                    <span className="text-[9px] font-mono font-semibold text-slate-400 px-1 py-0.2 rounded bg-slate-800">
                      +{queueLength - 1}
                    </span>
                  )}
                </motion.div>

                {/* Title */}
                <motion.h4
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="text-sm font-bold text-white uppercase tracking-wide truncate mt-0.5"
                >
                  {currentAchievement.title}
                </motion.h4>

                {/* Short Description */}
                {currentAchievement.desc && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.24 }}
                    className="text-[11px] text-slate-400 leading-snug truncate mt-0.5"
                  >
                    {currentAchievement.desc}
                  </motion.p>
                )}

                {/* XP Reward */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-1.5"
                >
                  <span className="inline-block font-mono text-xs font-bold text-[#FBBF24] bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md shadow-2xs">
                    +{animatedXp} XP
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Countdown Duration Bar at Bottom */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4.2, ease: "linear" }}
              className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] opacity-80"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
