import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useToast } from "../../context/ToastContext";
import { MedalInsignia, MedalTier } from "./MedalInsignia";
import { X, Zap, Sparkles } from "lucide-react";

export const GamificationToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      id="gamification-toast-portal"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[94vw] max-w-lg pointer-events-none flex flex-col gap-2.5 items-center select-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isRankUp = toast.type === "rank_up";
          const isXp = toast.type === "xp_milestone";
          const isBadge = toast.type === "badge_unlock";
          const isDisc = toast.type === "discipline_completed";

          // Border & Glow configurations
          let borderColor = "border-amber-400/80 dark:border-amber-500/80";
          let shadowGlow = "shadow-[0_10px_35px_-5px_rgba(245,158,11,0.35)]";
          let badgeBg = "bg-amber-500 text-white";
          let medalTier: MedalTier = "gold";
          let medalIcon = "zap";

          if (isRankUp) {
            borderColor = "border-[#2EC4B6]/90 dark:border-[#2EC4B6]";
            shadowGlow = "shadow-[0_10px_35px_-5px_rgba(46,196,182,0.4)]";
            badgeBg = "bg-gradient-to-r from-[#249D84] to-[#2EC4B6] text-white";
            medalTier = "diamond";
            medalIcon = "trophy";
          } else if (isBadge) {
            borderColor = "border-purple-500/80 dark:border-purple-400/80";
            shadowGlow = "shadow-[0_10px_35px_-5px_rgba(168,85,247,0.35)]";
            badgeBg = "bg-gradient-to-r from-purple-600 to-indigo-600 text-white";
            medalTier = "gold";
            medalIcon = toast.icon || "medal";
          } else if (isDisc) {
            borderColor = "border-emerald-500/80 dark:border-emerald-400/80";
            shadowGlow = "shadow-[0_10px_35px_-5px_rgba(16,185,129,0.35)]";
            badgeBg = "bg-gradient-to-r from-emerald-600 to-teal-600 text-white";
            medalTier = "emerald";
            medalIcon = "book";
          } else if (isXp) {
            medalTier = "gold";
            medalIcon = "zap";
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -35, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border ${borderColor} bg-white/95 dark:bg-[#111622]/95 backdrop-blur-xl p-3.5 sm:p-4 text-slate-900 dark:text-white ${shadowGlow} transition-all`}
            >
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#249D84] via-amber-400 to-[#2EC4B6]" />

              <div className="flex items-start gap-3.5">
                {/* Visual Realistic Metallic Medal Avatar */}
                <div className="relative flex-shrink-0">
                  <MedalInsignia
                    iconName={medalIcon}
                    tier={medalTier}
                    size="md"
                    unlocked={true}
                  />

                  {/* Sparkle badge in corner */}
                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-2xs">
                    <Sparkles className="h-2.5 w-2.5" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeBg} shadow-2xs`}>
                      {toast.title}
                    </span>

                    {toast.xpBonus && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700">
                        <Zap className="h-2.5 w-2.5 fill-current" />
                        +{toast.xpBonus} XP
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug mt-1 line-clamp-2">
                    {toast.subtitle || toast.description}
                  </p>
                </div>

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="absolute top-2.5 right-2.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                  title="Fechar Notificação"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Animated Progress Timer Bar at the bottom */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4.5, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#249D84] to-[#2EC4B6] opacity-70"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

