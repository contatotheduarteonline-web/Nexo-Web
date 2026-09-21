import React from "react";
import { GamificationBadge } from "../../utils/gamificationBadges";
import { AchievementMedal, MedalState } from "./AchievementMedal";
import { Check } from "lucide-react";

interface AchievementCardProps {
  badge: GamificationBadge;
  onClick: () => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ badge, onClick }) => {
  const medalState: MedalState = badge.unlocked
    ? "unlocked"
    : badge.progressCurrent > 0
    ? "in_progress"
    : "locked";

  const isUnlocked = badge.unlocked;
  const isInProgress = !badge.unlocked && badge.progressCurrent > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] ${
        isUnlocked
          ? "bg-white dark:bg-[#0E121A] border-slate-200/80 dark:border-slate-800/90 shadow-2xs hover:border-[#FF6B00]/60 hover:-translate-y-1 hover:shadow-md dark:hover:border-[#FF6B00]/50"
          : isInProgress
          ? "bg-white/80 dark:bg-[#0E121A]/80 border-slate-200/60 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-2xs"
          : "bg-slate-50/50 dark:bg-[#0B0F16]/50 border-slate-200/40 dark:border-slate-800/40 opacity-75 hover:opacity-100 hover:bg-white dark:hover:bg-[#0E121A] hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* Header: Category & Status */}
      <div className="w-full flex items-center justify-between gap-1 mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {badge.categoryLabel}
        </span>

        {isUnlocked ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" strokeWidth={3} />
            Desbloqueada
          </span>
        ) : isInProgress ? (
          <span className="text-[10px] font-semibold text-[#FF6B00] dark:text-[#FFA726]">
            {Math.round(badge.progressPercent)}%
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            Bloqueada
          </span>
        )}
      </div>

      {/* 1. Nome da conquista (Prioridade de Leitura) */}
      <h3
        className={`text-sm font-bold leading-tight transition-colors line-clamp-1 h-5 ${
          isUnlocked
            ? "text-slate-900 dark:text-white group-hover:text-[#FF6B00] dark:group-hover:text-[#FFA726]"
            : "text-slate-700 dark:text-slate-300"
        }`}
      >
        {badge.title}
      </h3>

      {/* 2. Medalha (Protagonista Visual com Microinteração Suave) */}
      <div className="my-2.5 py-1 transition-transform duration-200 ease-out group-hover:scale-105">
        <AchievementMedal
          badgeId={badge.id}
          category={badge.category}
          state={medalState}
          progressPercent={badge.progressPercent}
          size="lg"
        />
      </div>

      {/* Descrição Curta */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
        {badge.desc}
      </p>

      {/* 3. Progresso Real */}
      <div className="w-full mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-mono text-slate-400">Progresso</span>
          <span
            className={`font-mono font-semibold ${
              isUnlocked
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-700 dark:text-slate-200"
            }`}
          >
            {badge.progressLabel}
          </span>
        </div>

        {/* Barra de Progresso Discreta */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isUnlocked
                ? "bg-emerald-500"
                : isInProgress
                ? "bg-[#FF6B00]"
                : "bg-slate-300 dark:bg-slate-700"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, badge.progressPercent))}%` }}
          />
        </div>
      </div>

      {/* 4. XP da Conquista */}
      <div className="mt-2.5 flex items-center justify-center">
        <span
          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
            isUnlocked
              ? "bg-orange-50 text-[#FF6B00] border-orange-200 dark:bg-orange-950/50 dark:text-[#FFA726] dark:border-orange-800/60"
              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60"
          }`}
        >
          +{badge.xpReward} XP
        </span>
      </div>
    </div>
  );
};
