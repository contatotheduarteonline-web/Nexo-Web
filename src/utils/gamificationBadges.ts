import { Edital, StudySession, ScheduledReview, Simulado } from "../types";
import { MedalTier } from "../components/common/MedalInsignia";

export interface GamificationBadge {
  id: string;
  category: "progresso" | "questoes" | "precisao" | "disciplinas" | "tempo" | "revisoes" | "simulados" | "edital";
  categoryLabel: string;
  title: string;
  desc: string;
  icon: string;
  tier?: MedalTier;
  unlocked: boolean;
  progressCurrent: number;
  progressMax: number;
  progressPercent: number;
  progressLabel: string;
  xpReward: number;
  unlockedAt?: string;
}

export interface RankLevelInfo {
  level: number;
  title: string;
  minPct: number;
  maxPct: number;
  reqDesc: string;
  unlocked: boolean;
  isCurrent: boolean;
}

export interface GamificationData {
  totalTopicsCount: number;
  completedTopicsCount: number;
  pendingTopicsCount: number;
  globalProgressPercentage: number;
  totalQ: number;
  totalCorr: number;
  accuracy: number;
  totalXp: number;
  rankTitle: string;
  rankLevel: number;
  rankIcon: string;
  rankTier: MedalTier;
  rankBadgeStyle: string;
  nextRankName: string;
  topicsRemainingForNext: number;
  xpRemainingEstimate: number;
  completedDisciplinesCount: number;
  ranksHierarchy: RankLevelInfo[];
  badges: GamificationBadge[];
  unlockedBadgesCount: number;
  totalBadgesCount: number;
  closestBadges: GamificationBadge[];
}

export function computeGamificationData(
  activeEdital: Edital | undefined,
  studySessions: StudySession[] = [],
  scheduledReviews: ScheduledReview[] = [],
  simulados: Simulado[] = []
): GamificationData {
  const topics = activeEdital?.topics || [];
  const disciplines = activeEdital?.disciplines || [];

  const totalTopicsCount = topics.length;
  const completedTopicsCount = topics.filter((t) => t.isStudied).length;
  const reviewedTopicsCount = topics.filter((t) => t.isReviewed).length;
  const pendingTopicsCount = Math.max(0, totalTopicsCount - completedTopicsCount);

  const globalProgressPercentage = totalTopicsCount > 0
    ? Math.round((completedTopicsCount / totalTopicsCount) * 100)
    : 0;

  // Real questions and accuracy derived directly from study sessions (single source of truth)
  const editalSessions = activeEdital
    ? studySessions.filter((s) => s.editalId === activeEdital.id)
    : studySessions;

  const totalQ = editalSessions.reduce((acc, s) => acc + (Number(s.questionsDone) || 0), 0);
  const totalCorr = editalSessions.reduce((acc, s) => acc + (Number(s.questionsCorrect) || 0), 0);
  const accuracy = totalQ > 0 ? Math.round((totalCorr / totalQ) * 100) : 0;

  // Real studied minutes & hours
  const totalStudiedMinutes = editalSessions.reduce(
    (acc, s) => acc + (Number(s.durationMinutes) || 0),
    0
  );
  const totalStudiedHours = Math.floor(totalStudiedMinutes / 60);

  // Reviews completed
  const completedReviewsCount = scheduledReviews.filter(
    (r) => r.completed && (!activeEdital || r.editalId === activeEdital.id)
  ).length;
  const totalCompletedReviews = Math.max(reviewedTopicsCount, completedReviewsCount);

  // Simulados count
  const editalSimuladosCount = simulados.filter(
    (sim) => !activeEdital || sim.editalId === activeEdital.id
  ).length;

  // Completed disciplines count
  const completedDisciplinesCount = disciplines.filter((d) => {
    const dTopics = topics.filter((t) => t.disciplineId === d.id);
    return dTopics.length > 0 && dTopics.every((t) => t.isStudied);
  }).length;

  // Determine latest activity date for unlock timestamp
  const latestSessionDate = editalSessions.length > 0
    ? editalSessions[0]?.date || new Date().toISOString()
    : new Date().toISOString();

  const formatUnlockDate = (dateStr?: string) => {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      return isNaN(d.getTime())
        ? new Date().toLocaleDateString("pt-BR")
        : d.toLocaleDateString("pt-BR");
    } catch {
      return new Date().toLocaleDateString("pt-BR");
    }
  };

  const unlockDateStr = formatUnlockDate(latestSessionDate);

  // 6 Levels of Evolution (Início, Prática, Constância, Domínio, Especialização, Conclusão)
  let rankTitle = "Início";
  let rankLevel = 1;
  let rankIcon = "compass";
  let rankTier: MedalTier = "bronze";
  let rankBadgeStyle = "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
  let nextRankName = "Prática (20%)";
  let targetPctForNext = 20;

  if (globalProgressPercentage >= 100 && totalTopicsCount > 0) {
    rankTitle = "Conclusão";
    rankLevel = 6;
    rankIcon = "check";
    rankTier = "diamond";
    rankBadgeStyle = "bg-amber-50 text-[#F59E0B] border-amber-200 dark:bg-amber-950/40 dark:text-[#FBBF24] dark:border-amber-800";
    nextRankName = "100% Concluído";
    targetPctForNext = 100;
  } else if (globalProgressPercentage >= 80) {
    rankTitle = "Especialização";
    rankLevel = 5;
    rankIcon = "award";
    rankTier = "gold";
    rankBadgeStyle = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    nextRankName = "Conclusão (100%)";
    targetPctForNext = 100;
  } else if (globalProgressPercentage >= 60) {
    rankTitle = "Domínio";
    rankLevel = 4;
    rankIcon = "target";
    rankTier = "emerald";
    rankBadgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    nextRankName = "Especialização (80%)";
    targetPctForNext = 80;
  } else if (globalProgressPercentage >= 40) {
    rankTitle = "Constância";
    rankLevel = 3;
    rankIcon = "activity";
    rankTier = "sapphire";
    rankBadgeStyle = "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    nextRankName = "Domínio (60%)";
    targetPctForNext = 60;
  } else if (globalProgressPercentage >= 20) {
    rankTitle = "Prática";
    rankLevel = 2;
    rankIcon = "target";
    rankTier = "silver";
    rankBadgeStyle = "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
    nextRankName = "Constância (40%)";
    targetPctForNext = 40;
  }

  const ranksHierarchy: RankLevelInfo[] = [
    {
      level: 1,
      title: "Início",
      minPct: 0,
      maxPct: 19,
      reqDesc: "0–19%",
      unlocked: globalProgressPercentage >= 0,
      isCurrent: rankLevel === 1,
    },
    {
      level: 2,
      title: "Prática",
      minPct: 20,
      maxPct: 39,
      reqDesc: "20–39%",
      unlocked: globalProgressPercentage >= 20,
      isCurrent: rankLevel === 2,
    },
    {
      level: 3,
      title: "Constância",
      minPct: 40,
      maxPct: 59,
      reqDesc: "40–59%",
      unlocked: globalProgressPercentage >= 40,
      isCurrent: rankLevel === 3,
    },
    {
      level: 4,
      title: "Domínio",
      minPct: 60,
      maxPct: 79,
      reqDesc: "60–79%",
      unlocked: globalProgressPercentage >= 60,
      isCurrent: rankLevel === 4,
    },
    {
      level: 5,
      title: "Especialização",
      minPct: 80,
      maxPct: 99,
      reqDesc: "80–99%",
      unlocked: globalProgressPercentage >= 80,
      isCurrent: rankLevel === 5,
    },
    {
      level: 6,
      title: "Conclusão",
      minPct: 100,
      maxPct: 100,
      reqDesc: "100%",
      unlocked: globalProgressPercentage >= 100 && totalTopicsCount > 0,
      isCurrent: rankLevel === 6,
    },
  ];

  const nextTargetTopics = Math.ceil((targetPctForNext / 100) * totalTopicsCount);
  const topicsRemainingForNext = Math.max(0, nextTargetTopics - completedTopicsCount);
  const xpRemainingEstimate = topicsRemainingForNext * 150;

  // 25 CONQUISTAS CATALOG WITH CLEAN STUDY TERMINOLOGY
  const badges: GamificationBadge[] = [
    // 1. PROGRESSO (7 conquistas)
    {
      id: "badge-first",
      category: "progresso",
      categoryLabel: "Progresso",
      title: "Primeiro Passo",
      desc: "Conclua seu primeiro tópico.",
      icon: "trendingup",
      tier: "bronze",
      unlocked: completedTopicsCount >= 1,
      progressCurrent: Math.min(1, completedTopicsCount),
      progressMax: 1,
      progressPercent: Math.min(100, (completedTopicsCount / 1) * 100),
      progressLabel: `${Math.min(1, completedTopicsCount)} / 1`,
      xpReward: 150,
      unlockedAt: completedTopicsCount >= 1 ? unlockDateStr : undefined,
    },
    {
      id: "badge-focus",
      category: "progresso",
      categoryLabel: "Progresso",
      title: "Ritmo Inicial",
      desc: "Conclua 5 tópicos de estudo.",
      icon: "trendingup",
      tier: "bronze",
      unlocked: completedTopicsCount >= 5,
      progressCurrent: Math.min(5, completedTopicsCount),
      progressMax: 5,
      progressPercent: Math.min(100, Math.round((completedTopicsCount / 5) * 100)),
      progressLabel: `${Math.min(5, completedTopicsCount)} / 5`,
      xpReward: 200,
      unlockedAt: completedTopicsCount >= 5 ? unlockDateStr : undefined,
    },
    {
      id: "badge-consistency-15",
      category: "progresso",
      categoryLabel: "Progresso",
      title: "Constância",
      desc: "Conclua 15 tópicos de estudo.",
      icon: "trendingup",
      tier: "silver",
      unlocked: completedTopicsCount >= 15,
      progressCurrent: Math.min(15, completedTopicsCount),
      progressMax: 15,
      progressPercent: Math.min(100, Math.round((completedTopicsCount / 15) * 100)),
      progressLabel: `${Math.min(15, completedTopicsCount)} / 15`,
      xpReward: 300,
      unlockedAt: completedTopicsCount >= 15 ? unlockDateStr : undefined,
    },
    {
      id: "badge-25pct",
      category: "progresso",
      categoryLabel: "Progresso",
      title: "Um Quarto do Caminho",
      desc: "25% do planejamento concluído.",
      icon: "trendingup",
      tier: "emerald",
      unlocked: globalProgressPercentage >= 25,
      progressCurrent: Math.min(25, globalProgressPercentage),
      progressMax: 25,
      progressPercent: Math.min(100, Math.round((globalProgressPercentage / 25) * 100)),
      progressLabel: `${globalProgressPercentage}% / 25%`,
      xpReward: 350,
      unlockedAt: globalProgressPercentage >= 25 ? unlockDateStr : undefined,
    },
    {
      id: "badge-50pct",
      category: "progresso",
      categoryLabel: "Progresso",
      title: "Metade do Caminho",
      desc: "50% do planejamento concluído.",
      icon: "trendingup",
      tier: "gold",
      unlocked: globalProgressPercentage >= 50,
      progressCurrent: Math.min(50, globalProgressPercentage),
      progressMax: 50,
      progressPercent: Math.min(100, Math.round((globalProgressPercentage / 50) * 100)),
      progressLabel: `${globalProgressPercentage}% / 50%`,
      xpReward: 500,
      unlockedAt: globalProgressPercentage >= 50 ? unlockDateStr : undefined,
    },
    {
      id: "badge-75pct",
      category: "progresso",
      categoryLabel: "Progresso",
      title: "Reta Final",
      desc: "75% do planejamento concluído.",
      icon: "trendingup",
      tier: "sapphire",
      unlocked: globalProgressPercentage >= 75,
      progressCurrent: Math.min(75, globalProgressPercentage),
      progressMax: 75,
      progressPercent: Math.min(100, Math.round((globalProgressPercentage / 75) * 100)),
      progressLabel: `${globalProgressPercentage}% / 75%`,
      xpReward: 750,
      unlockedAt: globalProgressPercentage >= 75 ? unlockDateStr : undefined,
    },
    {
      id: "badge-zerado",
      category: "progresso",
      categoryLabel: "Progresso",
      title: "Domínio Completo",
      desc: "100% do planejamento concluído.",
      icon: "trendingup",
      tier: "diamond",
      unlocked: globalProgressPercentage >= 100 && totalTopicsCount > 0,
      progressCurrent: globalProgressPercentage,
      progressMax: 100,
      progressPercent: globalProgressPercentage,
      progressLabel: `${globalProgressPercentage}% / 100%`,
      xpReward: 1000,
      unlockedAt: globalProgressPercentage >= 100 && totalTopicsCount > 0 ? unlockDateStr : undefined,
    },

    // 2. QUESTÕES (5 conquistas)
    {
      id: "badge-q-10",
      category: "questoes",
      categoryLabel: "Questões",
      title: "Primeiras Questões",
      desc: "Resolva 10 questões.",
      icon: "checksquare",
      tier: "bronze",
      unlocked: totalQ >= 10,
      progressCurrent: Math.min(10, totalQ),
      progressMax: 10,
      progressPercent: Math.min(100, Math.round((totalQ / 10) * 100)),
      progressLabel: `${Math.min(10, totalQ)} / 10`,
      xpReward: 100,
      unlockedAt: totalQ >= 10 ? unlockDateStr : undefined,
    },
    {
      id: "badge-q-50",
      category: "questoes",
      categoryLabel: "Questões",
      title: "Prática Ativa",
      desc: "Resolva 50 questões.",
      icon: "checksquare",
      tier: "silver",
      unlocked: totalQ >= 50,
      progressCurrent: Math.min(50, totalQ),
      progressMax: 50,
      progressPercent: Math.min(100, Math.round((totalQ / 50) * 100)),
      progressLabel: `${Math.min(50, totalQ)} / 50`,
      xpReward: 200,
      unlockedAt: totalQ >= 50 ? unlockDateStr : undefined,
    },
    {
      id: "badge-q-100",
      category: "questoes",
      categoryLabel: "Questões",
      title: "Ritmo de Questões",
      desc: "Resolva 100 questões.",
      icon: "checksquare",
      tier: "gold",
      unlocked: totalQ >= 100,
      progressCurrent: Math.min(100, totalQ),
      progressMax: 100,
      progressPercent: Math.min(100, Math.round((totalQ / 100) * 100)),
      progressLabel: `${Math.min(100, totalQ)} / 100`,
      xpReward: 350,
      unlockedAt: totalQ >= 100 ? unlockDateStr : undefined,
    },
    {
      id: "badge-q-250",
      category: "questoes",
      categoryLabel: "Questões",
      title: "Volume de Prática",
      desc: "Resolva 250 questões.",
      icon: "checksquare",
      tier: "ruby",
      unlocked: totalQ >= 250,
      progressCurrent: Math.min(250, totalQ),
      progressMax: 250,
      progressPercent: Math.min(100, Math.round((totalQ / 250) * 100)),
      progressLabel: `${Math.min(250, totalQ)} / 250`,
      xpReward: 500,
      unlockedAt: totalQ >= 250 ? unlockDateStr : undefined,
    },
    {
      id: "badge-q-500",
      category: "questoes",
      categoryLabel: "Questões",
      title: "Grande Volume",
      desc: "Resolva 500 questões.",
      icon: "checksquare",
      tier: "obsidian",
      unlocked: totalQ >= 500,
      progressCurrent: Math.min(500, totalQ),
      progressMax: 500,
      progressPercent: Math.min(100, Math.round((totalQ / 500) * 100)),
      progressLabel: `${Math.min(500, totalQ)} / 500`,
      xpReward: 750,
      unlockedAt: totalQ >= 500 ? unlockDateStr : undefined,
    },

    // 3. PRECISÃO (3 conquistas)
    {
      id: "badge-accuracy-70",
      category: "precisao",
      categoryLabel: "Precisão",
      title: "Boa Precisão",
      desc: "70%+ em pelo menos 20 questões.",
      icon: "target",
      tier: "emerald",
      unlocked: totalQ >= 20 && accuracy >= 70,
      progressCurrent: totalQ < 20 ? totalQ : accuracy,
      progressMax: totalQ < 20 ? 20 : 70,
      progressPercent: totalQ < 20
        ? Math.min(100, Math.round((totalQ / 20) * 100))
        : Math.min(100, Math.round((accuracy / 70) * 100)),
      progressLabel: totalQ >= 20 ? `${accuracy}% / 70%` : `${totalQ} / 20 q`,
      xpReward: 250,
      unlockedAt: totalQ >= 20 && accuracy >= 70 ? unlockDateStr : undefined,
    },
    {
      id: "badge-precision-80",
      category: "precisao",
      categoryLabel: "Precisão",
      title: "Precisão Consistente",
      desc: "80%+ em pelo menos 30 questões.",
      icon: "target",
      tier: "sapphire",
      unlocked: totalQ >= 30 && accuracy >= 80,
      progressCurrent: totalQ < 30 ? totalQ : accuracy,
      progressMax: totalQ < 30 ? 30 : 80,
      progressPercent: totalQ < 30
        ? Math.min(100, Math.round((totalQ / 30) * 100))
        : Math.min(100, Math.round((accuracy / 80) * 100)),
      progressLabel: totalQ >= 30 ? `${accuracy}% / 80%` : `${totalQ} / 30 q`,
      xpReward: 400,
      unlockedAt: totalQ >= 30 && accuracy >= 80 ? unlockDateStr : undefined,
    },
    {
      id: "badge-sniper-90",
      category: "precisao",
      categoryLabel: "Precisão",
      title: "Alta Precisão",
      desc: "90%+ em pelo menos 50 questões.",
      icon: "target",
      tier: "diamond",
      unlocked: totalQ >= 50 && accuracy >= 90,
      progressCurrent: totalQ < 50 ? totalQ : accuracy,
      progressMax: totalQ < 50 ? 50 : 90,
      progressPercent: totalQ < 50
        ? Math.min(100, Math.round((totalQ / 50) * 100))
        : Math.min(100, Math.round((accuracy / 90) * 100)),
      progressLabel: totalQ >= 50 ? `${accuracy}% / 90%` : `${totalQ} / 50 q`,
      xpReward: 600,
      unlockedAt: totalQ >= 50 && accuracy >= 90 ? unlockDateStr : undefined,
    },

    // 4. DISCIPLINAS (3 conquistas)
    {
      id: "badge-disc-1",
      category: "disciplinas",
      categoryLabel: "Disciplinas",
      title: "Primeira Conclusão",
      desc: "1 disciplina concluída.",
      icon: "book",
      tier: "emerald",
      unlocked: completedDisciplinesCount >= 1,
      progressCurrent: Math.min(1, completedDisciplinesCount),
      progressMax: 1,
      progressPercent: Math.min(100, (completedDisciplinesCount / 1) * 100),
      progressLabel: `${Math.min(1, completedDisciplinesCount)} / 1`,
      xpReward: 200,
      unlockedAt: completedDisciplinesCount >= 1 ? unlockDateStr : undefined,
    },
    {
      id: "badge-disc-3",
      category: "disciplinas",
      categoryLabel: "Disciplinas",
      title: "Base Ampliada",
      desc: "3 disciplinas concluídas.",
      icon: "book",
      tier: "sapphire",
      unlocked: completedDisciplinesCount >= 3,
      progressCurrent: Math.min(3, completedDisciplinesCount),
      progressMax: 3,
      progressPercent: Math.min(100, Math.round((completedDisciplinesCount / 3) * 100)),
      progressLabel: `${Math.min(3, completedDisciplinesCount)} / 3`,
      xpReward: 400,
      unlockedAt: completedDisciplinesCount >= 3 ? unlockDateStr : undefined,
    },
    {
      id: "badge-disc-5",
      category: "disciplinas",
      categoryLabel: "Disciplinas",
      title: "Conhecimento Ampliado",
      desc: "5 disciplinas concluídas.",
      icon: "book",
      tier: "gold",
      unlocked: completedDisciplinesCount >= 5,
      progressCurrent: Math.min(5, completedDisciplinesCount),
      progressMax: 5,
      progressPercent: Math.min(100, Math.round((completedDisciplinesCount / 5) * 100)),
      progressLabel: `${Math.min(5, completedDisciplinesCount)} / 5`,
      xpReward: 600,
      unlockedAt: completedDisciplinesCount >= 5 ? unlockDateStr : undefined,
    },

    // 5. TEMPO (4 conquistas)
    {
      id: "badge-hours-1",
      category: "tempo",
      categoryLabel: "Tempo",
      title: "Primeira Hora",
      desc: "1 hora líquida de estudo.",
      icon: "clock",
      tier: "bronze",
      unlocked: totalStudiedMinutes >= 60,
      progressCurrent: Math.min(60, totalStudiedMinutes),
      progressMax: 60,
      progressPercent: Math.min(100, Math.round((totalStudiedMinutes / 60) * 100)),
      progressLabel: `${Math.min(60, totalStudiedMinutes)} / 60 min`,
      xpReward: 100,
      unlockedAt: totalStudiedMinutes >= 60 ? unlockDateStr : undefined,
    },
    {
      id: "badge-hours-10",
      category: "tempo",
      categoryLabel: "Tempo",
      title: "Tempo de Prática",
      desc: "10 horas líquidas de estudo.",
      icon: "clock",
      tier: "silver",
      unlocked: totalStudiedMinutes >= 600,
      progressCurrent: Math.min(600, totalStudiedMinutes),
      progressMax: 600,
      progressPercent: Math.min(100, Math.round((totalStudiedMinutes / 600) * 100)),
      progressLabel: `${Math.min(10, totalStudiedHours)}h / 10h`,
      xpReward: 300,
      unlockedAt: totalStudiedMinutes >= 600 ? unlockDateStr : undefined,
    },
    {
      id: "badge-hours-25",
      category: "tempo",
      categoryLabel: "Tempo",
      title: "Rotina Consolidada",
      desc: "25 horas líquidas de estudo.",
      icon: "clock",
      tier: "gold",
      unlocked: totalStudiedMinutes >= 1500,
      progressCurrent: Math.min(1500, totalStudiedMinutes),
      progressMax: 1500,
      progressPercent: Math.min(100, Math.round((totalStudiedMinutes / 1500) * 100)),
      progressLabel: `${Math.min(25, totalStudiedHours)}h / 25h`,
      xpReward: 500,
      unlockedAt: totalStudiedMinutes >= 1500 ? unlockDateStr : undefined,
    },
    {
      id: "badge-hours-50",
      category: "tempo",
      categoryLabel: "Tempo",
      title: "Dedicação",
      desc: "50 horas líquidas de estudo.",
      icon: "clock",
      tier: "obsidian",
      unlocked: totalStudiedMinutes >= 3000,
      progressCurrent: Math.min(3000, totalStudiedMinutes),
      progressMax: 3000,
      progressPercent: Math.min(100, Math.round((totalStudiedMinutes / 3000) * 100)),
      progressLabel: `${Math.min(50, totalStudiedHours)}h / 50h`,
      xpReward: 800,
      unlockedAt: totalStudiedMinutes >= 3000 ? unlockDateStr : undefined,
    },

    // 6. REVISÕES (2 conquistas)
    {
      id: "badge-rev-1",
      category: "revisoes",
      categoryLabel: "Revisões",
      title: "Primeira Revisão",
      desc: "1 revisão concluída.",
      icon: "repeat",
      tier: "silver",
      unlocked: totalCompletedReviews >= 1,
      progressCurrent: Math.min(1, totalCompletedReviews),
      progressMax: 1,
      progressPercent: Math.min(100, (totalCompletedReviews / 1) * 100),
      progressLabel: `${Math.min(1, totalCompletedReviews)} / 1`,
      xpReward: 150,
      unlockedAt: totalCompletedReviews >= 1 ? unlockDateStr : undefined,
    },
    {
      id: "badge-rev-10",
      category: "revisoes",
      categoryLabel: "Revisões",
      title: "Ciclo de Revisão",
      desc: "10 revisões concluídas.",
      icon: "repeat",
      tier: "gold",
      unlocked: totalCompletedReviews >= 10,
      progressCurrent: Math.min(10, totalCompletedReviews),
      progressMax: 10,
      progressPercent: Math.min(100, Math.round((totalCompletedReviews / 10) * 100)),
      progressLabel: `${Math.min(10, totalCompletedReviews)} / 10`,
      xpReward: 350,
      unlockedAt: totalCompletedReviews >= 10 ? unlockDateStr : undefined,
    },

    // 7. SIMULADOS (1 conquista)
    {
      id: "badge-sim-1",
      category: "simulados",
      categoryLabel: "Simulados",
      title: "Primeiro Simulado",
      desc: "1 simulado registrado.",
      icon: "filetext",
      tier: "ruby",
      unlocked: editalSimuladosCount >= 1,
      progressCurrent: Math.min(1, editalSimuladosCount),
      progressMax: 1,
      progressPercent: Math.min(100, (editalSimuladosCount / 1) * 100),
      progressLabel: `${Math.min(1, editalSimuladosCount)} / 1`,
      xpReward: 250,
      unlockedAt: editalSimuladosCount >= 1 ? unlockDateStr : undefined,
    },
  ];

  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  // XP directly calculated from unlocked achievements
  const totalXp = badges
    .filter((b) => b.unlocked)
    .reduce((acc, b) => acc + b.xpReward, 0);

  // Closest 3 locked badges for motivation
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const closestBadges = lockedBadges
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 3);

  return {
    totalTopicsCount,
    completedTopicsCount,
    pendingTopicsCount,
    globalProgressPercentage,
    totalQ,
    totalCorr,
    accuracy,
    totalXp,
    rankTitle,
    rankLevel,
    rankIcon,
    rankTier,
    rankBadgeStyle,
    nextRankName,
    topicsRemainingForNext,
    xpRemainingEstimate,
    completedDisciplinesCount,
    ranksHierarchy,
    badges,
    unlockedBadgesCount,
    totalBadgesCount: badges.length,
    closestBadges,
  };
}
