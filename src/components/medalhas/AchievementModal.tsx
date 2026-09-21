import React, { useEffect } from "react";
import { GamificationBadge } from "../../utils/gamificationBadges";
import { AchievementMedal, MedalState } from "./AchievementMedal";
import { X, Check, Lock, Zap } from "lucide-react";

interface AchievementModalProps {
  badge: GamificationBadge | null;
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ badge, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!badge) return null;

  const medalState: MedalState = badge.unlocked
    ? "unlocked"
    : badge.progressCurrent > 0
    ? "in_progress"
    : "locked";

  const isUnlocked = badge.unlocked;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-7 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-[#0F172A] text-center transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Category tag */}
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-2">
          {badge.categoryLabel}
        </div>

        {/* Large Medal */}
        <div className="flex justify-center my-4">
          <AchievementMedal
            badgeId={badge.id}
            category={badge.category}
            state={medalState}
            progressPercent={badge.progressPercent}
            size="xl"
            showCheckBadge={isUnlocked}
          />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {badge.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          {badge.desc}
        </p>

        {/* Minimalist Data Strip */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-around text-center">
          <div>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Progresso
            </span>
            <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
              {badge.progressLabel}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />

          <div>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Recompensa
            </span>
            <span className="font-mono text-sm font-bold text-[#F59E0B] dark:text-[#FBBF24] flex items-center justify-center gap-0.5">
              <Zap className="h-3 w-3 fill-current" />
              +{badge.xpReward} XP
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-5">
          {isUnlocked ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>{badge.unlockedAt ? `Desbloqueada em ${badge.unlockedAt}` : "Desbloqueada"}</span>
            </div>
          ) : medalState === "in_progress" ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-[#F59E0B] border border-amber-200/80 dark:bg-amber-950/40 dark:text-[#FBBF24] dark:border-amber-800/60">
              <span>Em progresso ({Math.round(badge.progressPercent)}%)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800">
              <Lock className="h-3 w-3" />
              <span>Bloqueada</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
