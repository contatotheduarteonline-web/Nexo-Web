import React, { useState, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import { useToast } from "../../context/ToastContext";
import { computeGamificationData, GamificationBadge } from "../../utils/gamificationBadges";
import { AchievementMedal } from "../medalhas/AchievementMedal";
import {
  Zap,
  Target,
  Check,
  Lock,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  CheckSquare,
  BookOpen,
  Clock,
  RotateCw,
  FileText,
  Award,
} from "lucide-react";

// Minimalist category icon
const BadgeIcon: React.FC<{ category: string; className?: string }> = ({
  category,
  className = "h-4 w-4",
}) => {
  const strokeWidth = 1.75;
  switch (category) {
    case "progresso":
    case "edital":
      return <TrendingUp className={className} strokeWidth={strokeWidth} />;
    case "questoes":
      return <CheckSquare className={className} strokeWidth={strokeWidth} />;
    case "precisao":
      return <Target className={className} strokeWidth={strokeWidth} />;
    case "disciplinas":
      return <BookOpen className={className} strokeWidth={strokeWidth} />;
    case "tempo":
      return <Clock className={className} strokeWidth={strokeWidth} />;
    case "revisoes":
      return <RotateCw className={className} strokeWidth={strokeWidth} />;
    case "simulados":
      return <FileText className={className} strokeWidth={strokeWidth} />;
    default:
      return <Award className={className} strokeWidth={strokeWidth} />;
  }
};

export const EditalGamificationCard: React.FC = () => {
  const {
    activeEdital,
    activeEditalId,
    setActiveEditalId,
    editais,
    setActiveTab,
    studySessions,
    scheduledReviews,
    simulados,
  } = useStudy();
  const { triggerRankUpToast, triggerXpMilestoneToast, triggerBadgeUnlockToast } = useToast();
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [badgeCategoryFilter, setBadgeCategoryFilter] = useState<string>("all");

  const gamification = useMemo(() => {
    return computeGamificationData(activeEdital, studySessions, scheduledReviews, simulados);
  }, [activeEdital, studySessions, scheduledReviews, simulados]);

  const {
    totalTopicsCount,
    completedTopicsCount,
    pendingTopicsCount,
    globalProgressPercentage,
    badges,
  } = gamification;

  const filteredBadges = useMemo(() => {
    if (badgeCategoryFilter === "all") return badges;
    if (badgeCategoryFilter === "unlocked") return badges.filter((b) => b.unlocked);
    if (badgeCategoryFilter === "locked") return badges.filter((b) => !b.unlocked);
    return badges.filter((b) => b.category === badgeCategoryFilter);
  }, [badges, badgeCategoryFilter]);

  const displayedBadges = useMemo(() => {
    if (showAllBadges) return filteredBadges;
    // When collapsed and on "all", show first 6 badges; otherwise if filtered, show up to 6 or all
    return filteredBadges.slice(0, 6);
  }, [filteredBadges, showAllBadges]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-2xs backdrop-blur-xs dark:border-[#1A2232] dark:bg-[#0E131F] space-y-4.5 transition-all">
      {/* 1. Header do Card com Título, Patente, Edital Selector e XP */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 dark:border-[#1A2232]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Progresso no Edital
            </span>

            {/* Nível de Domínio */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/70 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-[#FF6B00] dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-[#FFA726]"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{gamification.rankTitle}</span>
              <span className="opacity-60 text-[10px]">Nv. {gamification.rankLevel}/6</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>
              <strong className="font-semibold text-slate-900 dark:text-white">
                {completedTopicsCount}
              </strong>{" "}
              de {totalTopicsCount} tópicos concluídos
            </span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span>{pendingTopicsCount} pendentes</span>
          </div>
        </div>

        {/* Lado Direito: XP Total, Porcentagem e Atalho ao Edital */}
        <div className="flex items-center gap-4 sm:gap-5 self-start sm:self-center">
          {/* XP Pill */}
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              <Zap className="h-3 w-3 fill-amber-500" />
              {gamification.totalXp.toLocaleString("pt-BR")} XP
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {gamification.unlockedBadgesCount}/{gamification.totalBadgesCount} Conquistas
            </span>
          </div>

          {/* Porcentagem Grande */}
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {globalProgressPercentage}%
          </div>

          {/* Botão Ver Edital */}
          <button
            onClick={() => setActiveTab("edital")}
            className="hidden md:flex items-center justify-center p-2 rounded-xl border border-slate-200/80 hover:border-[#FF6B00] text-slate-400 hover:text-[#FF6B00] bg-slate-50 hover:bg-orange-50/50 dark:bg-[#161D29] dark:border-slate-800 transition"
            title="Ver Edital Completo"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Barra de Progresso com Marcos */}
      <div className="space-y-2">
        <div className="relative pt-2 pb-1">
          {/* Barra de Fundo */}
          <div className="relative h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, globalProgressPercentage))}%` }}
            />
          </div>

          {/* Labels abaixo da barra */}
          <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-2 px-0.5">
            <span>0% Início</span>
            <span className={globalProgressPercentage >= 20 ? "text-[#FF6B00] font-semibold" : ""}>
              20%
            </span>
            <span className={globalProgressPercentage >= 40 ? "text-[#FF6B00] font-semibold" : ""}>
              40%
            </span>
            <span className={globalProgressPercentage >= 60 ? "text-[#FF6B00] font-semibold" : ""}>
              60%
            </span>
            <span className={globalProgressPercentage >= 80 ? "text-[#FF6B00] font-semibold" : ""}>
              80%
            </span>
            <span className={globalProgressPercentage >= 100 ? "text-amber-500 font-semibold" : ""}>
              100%
            </span>
          </div>
        </div>

        {/* Indicador de Próximo Nível & XP restante */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#1A2232] text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Target className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>
              Próximo:{" "}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {gamification.nextRankName}
              </strong>
            </span>
          </div>

          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            {globalProgressPercentage >= 100 ? (
              <span className="font-semibold text-amber-500">🏆 100% Concluído</span>
            ) : (
              <span>
                Faltam <strong className="text-[#FF6B00] font-semibold">{gamification.topicsRemainingForNext}</strong> tópicos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Grade de Conquistas e Medalhas */}
      <div className="pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-orange-500/15 text-[#FF6B00] flex items-center justify-center">
              <Award className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Conquistas
              </span>
              <span className="ml-2 text-[10px] font-semibold text-[#FF6B00] bg-orange-500/15 px-2 py-0.5 rounded-full">
                {gamification.unlockedBadgesCount} de {gamification.totalBadgesCount}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAllBadges((prev) => !prev)}
            className="text-[11px] font-semibold text-[#FF6B00] hover:underline self-start sm:self-auto flex items-center gap-1 cursor-pointer"
          >
            <Award className="h-3 w-3" />
            {showAllBadges ? "Menos" : `Ver Todas (${gamification.totalBadgesCount})`}
          </button>
        </div>

        {/* Categorias & Filtros de Medalhas */}
        {showAllBadges && (
          <div className="flex flex-wrap items-center gap-1 mb-3 pb-2 border-b border-slate-100 dark:border-[#1A2232]">
            {[
              { key: "all", label: `Todas (${gamification.totalBadgesCount})` },
              { key: "unlocked", label: `Desbloqueadas (${gamification.unlockedBadgesCount})` },
              { key: "locked", label: `Bloqueadas (${gamification.totalBadgesCount - gamification.unlockedBadgesCount})` },
              { key: "edital", label: "Edital" },
              { key: "questoes", label: "Questões" },
              { key: "disciplinas", label: "Matérias" },
              { key: "tempo", label: "Horas" },
              { key: "revisoes", label: "Revisões" },
              { key: "simulados", label: "Simulados" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setBadgeCategoryFilter(tab.key)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  badgeCategoryFilter === tab.key
                    ? "bg-[#FF6B00] text-white shadow-2xs"
                    : "bg-slate-100 dark:bg-[#151D2C] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Grid de Medalhas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {displayedBadges.map((badge) => (
            <div
              key={badge.id}
              onClick={() => {
                if (badge.unlocked) {
                  triggerBadgeUnlockToast(badge.title, badge.icon, badge.desc);
                } else {
                  triggerXpMilestoneToast(badge.xpReward, gamification.totalXp, `Meta: ${badge.title}`);
                }
              }}
              className={`relative flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 ${
                badge.unlocked
                  ? "bg-white border-orange-500/30 dark:bg-[#0E131F] dark:border-orange-500/40 shadow-2xs"
                  : "bg-slate-50/70 border-slate-200/70 dark:bg-[#090D16] dark:border-[#1A2232] opacity-70 hover:opacity-90"
              }`}
            >
              {/* Badge Top Header */}
              <div className="w-full flex items-center justify-between text-[9px] mb-1.5">
                <span className="text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider text-[8px]">
                  {badge.categoryLabel}
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded text-[9px]">
                  +{badge.xpReward} XP
                </span>
              </div>

              {/* Medalha Visual */}
              <div className="my-1.5 flex items-center justify-center">
                <AchievementMedal
                  badgeId={badge.id}
                  category={badge.category}
                  state={badge.unlocked ? "unlocked" : badge.progressCurrent > 0 ? "in_progress" : "locked"}
                  progressPercent={badge.progressPercent}
                  size="sm"
                  showCheckBadge={false}
                />
              </div>

              {/* Título & Descrição */}
              <h4 className="text-[11px] font-semibold text-slate-900 dark:text-white leading-tight mt-1 truncate w-full">
                {badge.title}
              </h4>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {badge.desc}
              </span>

              {/* Status Footer */}
              <div className="mt-2 w-full">
                {badge.unlocked ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#FF6B00] dark:text-[#FFA726] bg-orange-500/10 px-1.5 py-0.5 rounded-md w-full justify-center">
                    <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                    Conquistada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400 bg-white dark:bg-[#121722] px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-800 w-full justify-center truncate">
                    <Lock className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate">{badge.progressLabel}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info when collapsed */}
        {!showAllBadges && gamification.totalBadgesCount > 6 && (
          <div className="mt-2.5 text-center">
            <button
              type="button"
              onClick={() => setShowAllBadges(true)}
              className="text-[11px] font-medium text-slate-500 hover:text-[#FF6B00] transition inline-flex items-center gap-1 cursor-pointer"
            >
              <span>+ {gamification.totalBadgesCount - 6} outras conquistas</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
