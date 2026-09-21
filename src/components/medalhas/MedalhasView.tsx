import React, { useState, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import { computeGamificationData, GamificationBadge } from "../../utils/gamificationBadges";
import { AchievementMedal } from "./AchievementMedal";
import { AchievementCard } from "./AchievementCard";
import { AchievementModal } from "./AchievementModal";
import { useAchievementQueue } from "../../context/AchievementQueueContext";
import {
  TrendingUp,
  CheckSquare,
  Target,
  BookOpen,
  Clock,
  RotateCw,
  FileText,
  Search,
  Check,
  Lock,
  X,
  Award,
  ChevronRight,
  Info,
  Volume2,
  VolumeX,
} from "lucide-react";

// Category icon renderer with consistent minimalist style
const CategoryIcon: React.FC<{
  category: string;
  unlocked: boolean;
  className?: string;
}> = ({ category, unlocked, className = "h-5 w-5" }) => {
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

export const MedalhasView: React.FC = () => {
  const {
    activeEdital,
    studySessions,
    scheduledReviews,
    simulados,
  } = useStudy();
  const { soundEnabled, setSoundEnabled } = useAchievementQueue();

  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalBadge, setActiveModalBadge] = useState<GamificationBadge | null>(null);

  // Derive all gamification data purely from real study metrics
  const gamification = useMemo(() => {
    return computeGamificationData(activeEdital, studySessions, scheduledReviews, simulados);
  }, [activeEdital, studySessions, scheduledReviews, simulados]);

  // Filtered badges list
  const filteredBadges = useMemo(() => {
    return gamification.badges.filter((badge) => {
      // Status filter
      if (statusFilter === "unlocked" && !badge.unlocked) return false;
      if (statusFilter === "locked" && badge.unlocked) return false;

      // Category filter
      if (categoryFilter !== "all") {
        if (categoryFilter === "progresso" && (badge.category === "progresso" || badge.category === "edital")) {
          // match
        } else if (badge.category !== categoryFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = badge.title.toLowerCase().includes(q);
        const matchesDesc = badge.desc.toLowerCase().includes(q);
        const matchesCategory = badge.categoryLabel.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesCategory;
      }

      return true;
    });
  }, [gamification.badges, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* 1. CABEÇALHO LIMPO (consistente com Registro e Histórico) */}
      <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Medalhas e Conquistas
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Acompanhe sua evolução nos estudos e desbloqueie conquistas conforme avança.
        </p>
      </div>

      {/* 2. RESUMO SUPERIOR (compacto e elegante, idêntico aos indicadores do Histórico) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* NÍVEL */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-[#0E121A]">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Nível
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
              {gamification.rankLevel}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
              {gamification.rankTitle}
            </span>
          </div>
        </div>

        {/* XP */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-[#0E121A]">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            XP
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#FF6B00] dark:text-[#FFA726]">
            {gamification.totalXp.toLocaleString("pt-BR")} XP
          </div>
        </div>

        {/* CONQUISTAS */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-[#0E121A]">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Conquistas
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {gamification.unlockedBadgesCount} / {gamification.totalBadgesCount}
          </div>
        </div>

        {/* PRECISÃO */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-[#0E121A]">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Precisão
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {gamification.accuracy}%
          </div>
        </div>
      </div>

      {/* 3. PROGRESSO PRINCIPAL & PRÓXIMAS CONQUISTAS */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-[#0E121A] space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Seu progresso
            </span>
            <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
              {gamification.globalProgressPercentage}%
            </span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            <span className="font-semibold text-slate-900 dark:text-white">
              {gamification.completedTopicsCount}
            </span>{" "}
            de {gamification.totalTopicsCount} tópicos concluídos
            {gamification.pendingTopicsCount > 0 && (
              <span className="text-slate-400 ml-1.5">
                ({gamification.pendingTopicsCount} pendentes)
              </span>
            )}
          </div>

          {/* Barra de Progresso Horizontal */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#FF6B00] transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, gamification.globalProgressPercentage))}%` }}
            />
          </div>
        </div>

        {/* PRÓXIMAS CONQUISTAS */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Próximas conquistas
            </span>
            {gamification.closestBadges.length === 0 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Todas as 25 conquistas desbloqueadas!
              </span>
            )}
          </div>

          {gamification.closestBadges.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {gamification.closestBadges.map((badge) => (
                <div
                  key={badge.id}
                  onClick={() => setActiveModalBadge(badge)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#131822] cursor-pointer hover:border-[#FF6B00]/40 transition-colors"
                >
                  <div className="shrink-0">
                    <AchievementMedal
                      badgeId={badge.id}
                      category={badge.category}
                      state="in_progress"
                      progressPercent={badge.progressPercent}
                      size="sm"
                      showCheckBadge={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {badge.title}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0 ml-1">
                        {badge.progressLabel}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-[#FF6B00]"
                        style={{ width: `${Math.min(100, Math.max(0, badge.progressPercent))}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. TIMELINE DE NÍVEIS INTUITIVA */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-[#0E121A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Linha de evolução
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Níveis de Domínio do Edital
            </h2>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#FF6B00] border border-orange-200/70 dark:bg-orange-950/40 dark:text-[#FFA726] dark:border-orange-800/60">
            <span>Nível atual:</span>
            <strong className="font-bold">{gamification.rankLevel} &bull; {gamification.rankTitle}</strong>
          </div>
        </div>

        {/* Horizontal Stepper Timeline */}
        <div className="overflow-x-auto pb-2 pt-2">
          <div className="relative min-w-[620px] px-6 py-3">
            {/* Base Gray Line between start and end nodes */}
            <div className="absolute top-[28px] left-12 right-12 h-1 rounded-full bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />

            {/* Filled Progress Line based on actual coverage % */}
            <div
              className="absolute top-[28px] left-12 h-1 rounded-full bg-[#FF6B00] -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `calc(${Math.min(100, Math.max(0, gamification.globalProgressPercentage))}% * ((100% - 96px) / 100))`,
              }}
            />

            {/* 6 Step Nodes */}
            <div className="relative z-10 flex items-start justify-between">
              {gamification.ranksHierarchy.map((rank) => {
                const isCompleted = rank.level < gamification.rankLevel;
                const isCurrent = rank.level === gamification.rankLevel;

                return (
                  <div
                    key={rank.level}
                    className="flex flex-col items-center text-center cursor-default select-none"
                    style={{ width: "92px" }}
                  >
                    {/* Node Circle */}
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        isCurrent
                          ? "bg-[#FF6B00] text-white ring-4 ring-orange-500/20 shadow-xs scale-105"
                          : isCompleted
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "bg-white text-slate-400 border-2 border-slate-200 dark:bg-[#131822] dark:border-slate-700 dark:text-slate-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        <span>{rank.level}</span>
                      )}
                    </div>

                    {/* Node Text & Details */}
                    <div className="mt-2.5 space-y-0.5">
                      <div
                        className={`text-xs ${
                          isCurrent
                            ? "font-bold text-[#FF6B00] dark:text-[#FFA726]"
                            : isCompleted
                            ? "font-semibold text-slate-800 dark:text-slate-200"
                            : "font-medium text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {rank.title}
                      </div>

                      <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {rank.reqDesc}
                      </div>

                      {isCurrent && (
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-[#FF6B00] dark:bg-orange-950/60 dark:text-[#FFA726]">
                          Atual
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Informative Context Bar below timeline */}
        <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Target className="h-4 w-4 text-[#FF6B00] shrink-0" />
            {gamification.rankLevel >= 6 ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Parabéns! Você alcançou o nível máximo cobrindo 100% dos tópicos deste planejamento.
              </span>
            ) : (
              <span>
                Próximo marco: <strong className="text-slate-900 dark:text-white font-semibold">Nível {gamification.rankLevel + 1} ({gamification.nextRankName})</strong> • Faltam <strong className="text-[#FF6B00] font-semibold">{gamification.topicsRemainingForNext} tópicos</strong> para avançar.
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Cobertura atual: <strong className="font-mono text-slate-900 dark:text-white font-semibold">{gamification.globalProgressPercentage}%</strong>
          </div>
        </div>
      </div>

      {/* 5. CATÁLOGO DE CONQUISTAS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Conquistas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {gamification.unlockedBadgesCount} de {gamification.totalBadgesCount} conquistas desbloqueadas
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Achievement Sound Preference Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                soundEnabled
                  ? "bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-slate-100 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700"
                  : "bg-slate-100/70 text-slate-400 border-slate-200/60 dark:bg-slate-900/60 dark:text-slate-500 dark:border-slate-800"
              }`}
              title={soundEnabled ? "Sons de conquistas ativados" : "Sons de conquistas desativados"}
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline">Sons:</span>
              <span className="font-semibold">{soundEnabled ? "Ligado" : "Desligado"}</span>
            </button>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conquista..."
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0E121A] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#FF6B00]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="space-y-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#131822] dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Todas ({gamification.totalBadgesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unlocked")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === "unlocked"
                  ? "bg-[#FF6B00] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#131822] dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Desbloqueadas ({gamification.unlockedBadgesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("locked")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === "locked"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#131822] dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Bloqueadas ({gamification.totalBadgesCount - gamification.unlockedBadgesCount})
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: "Todas as categorias" },
              { id: "progresso", label: "Progresso" },
              { id: "questoes", label: "Questões" },
              { id: "precisao", label: "Precisão" },
              { id: "disciplinas", label: "Disciplinas" },
              { id: "tempo", label: "Tempo" },
              { id: "revisoes", label: "Revisões" },
              { id: "simulados", label: "Simulados" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? "bg-orange-50 border-orange-300 text-[#FF6B00] dark:bg-orange-950/40 dark:border-orange-800 dark:text-[#FFA726]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0E121A] dark:text-slate-400 dark:hover:bg-[#131822]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. GRID VISUAL DE CONQUISTAS (Medalha como protagonista) */}
        {filteredBadges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
            Nenhuma conquista encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBadges.map((badge) => (
              <AchievementCard
                key={badge.id}
                badge={badge}
                onClick={() => setActiveModalBadge(badge)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 7. MODAL VISUAL DE CONQUISTA */}
      <AchievementModal
        badge={activeModalBadge}
        onClose={() => setActiveModalBadge(null)}
      />
    </div>
  );
};
