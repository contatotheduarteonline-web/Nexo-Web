import React, { useState, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import { useAuth } from "../../context/AuthContext";
import { computeGamificationData } from "../../utils/gamificationBadges";
import { ReviewDetailModal } from "../revisoes/ReviewDetailModal";
import { FloatingTimerWidget } from "./FloatingTimerWidget";
import { ScheduledReview } from "../../types";

import { StatCardsRow } from "./StatCardsRow";
import { EditalProgressCard } from "./EditalProgressCard";
import { OfensivaCard } from "./OfensivaCard";
import { TodayScheduleSection, PlannedBlockItem } from "./TodayScheduleSection";
import { ReviewsSection } from "./ReviewsSection";
import { DisciplinePerformanceSection, UnifiedDisciplineStat } from "./DisciplinePerformanceSection";
import { WeeklyGoalsSection, WeeklyChartData } from "./WeeklyGoalsSection";
import { RecentActivitiesSection } from "./RecentActivitiesSection";
import { RemindersSection } from "./RemindersSection";

interface DashboardViewProps {
  onOpenManualStudy: () => void;
}

function getLocalStudyDate(session: { studyDate?: string; date: string }): string {
  if (session.studyDate) return session.studyDate;
  const date = new Date(session.date);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayLocalYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenManualStudy }) => {
  const {
    activeEdital,
    activePlan,
    userSettings,
    studySessions,
    scheduledReviews,
    simulados,
    setActiveTab,
    reminders,
    toggleReminder,
    addReminder,
    setTimerConfig,
  } = useStudy();

  const { user } = useAuth();

  // Offset for weekly chart navigation
  const [weekOffset, setWeekOffset] = useState(0);

  // Review Detail Modal
  const [selectedReviewForModal, setSelectedReviewForModal] = useState<ScheduledReview | null>(null);

  // Greeting & User Name
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const userName = user?.name ? user.name.split(" ")[0] : "Estudante";

  // Gamification Computation (strictly for progress percentage and streaks)
  const gamification = useMemo(() => {
    return computeGamificationData(activeEdital, studySessions, scheduledReviews, simulados);
  }, [activeEdital, studySessions, scheduledReviews, simulados]);

  // Today's Study Sessions and metrics derived from the user's local study date.
  // Using studyDate avoids the UTC/local-time rollover bug that made evening studies
  // appear as 0h/0 questions on the Home dashboard.
  const todaySessions = useMemo(() => {
    const todayStr = getTodayLocalYmd();
    return studySessions.filter((s) => getLocalStudyDate(s) === todayStr);
  }, [studySessions]);

  const todayMinutes = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [todaySessions]);

  const todayQuestionsDone = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.questionsDone || 0), 0);
  }, [todaySessions]);

  const todayQuestionsCorrect = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0);
  }, [todaySessions]);

  // Handle Quick Start Study for a planned block or discipline
  const handleStartStudy = (disciplineId: string, durationMinutes: number = 60) => {
    const disc = activeEdital?.disciplines.find((d) => d.id === disciplineId);
    if (!disc) {
      onOpenManualStudy();
      return;
    }

    const firstTopic =
      activeEdital?.topics.find((t) => t.disciplineId === disc.id && !t.isStudied) ||
      activeEdital?.topics.find((t) => t.disciplineId === disc.id);

    setTimerConfig({
      disciplineId: disc.id,
      disciplineName: disc.name,
      topicId: firstTopic?.id || "",
      topicName: firstTopic?.name || "Estudo da Disciplina",
      modality: "Teoria",
      targetMinutes: durationMinutes,
      mode: "stopwatch",
      elapsedSeconds: 0,
      isRunning: false,
      startedAt: undefined,
    });

    // Abrir o cronômetro NÃO inicia a contagem.
    // O aluno decide quando começar pelo botão "Iniciar".
    setActiveTab("cronometro");
  };

  // Minutes studied today per discipline (for the progress bars)
  const studiedMinutesByDiscipline = useMemo(() => {
    const map = new Map<string, number>();
    todaySessions.forEach((s) => {
      const key = s.disciplineId || s.disciplineName;
      map.set(key, (map.get(key) || 0) + s.durationMinutes);
    });
    return map;
  }, [todaySessions]);

  // Planned blocks for today (completely generic, derived from activePlan or activeEdital)
  const todayPlannedBlocks: PlannedBlockItem[] = useMemo(() => {
    let list: PlannedBlockItem[] = [];

    if (activePlan) {
      const isWeekly = activePlan.organizationType === "semanal";
      if (isWeekly) {
        const dayKeys: Array<"dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab"> = [
          "dom", "seg", "ter", "qua", "qui", "sex", "sab"
        ];
        const todayKey = dayKeys[new Date().getDay()];
        const todaySchedule = (activePlan.weeklySchedule || []).filter((b) => b.day === todayKey);

        if (todaySchedule.length > 0) {
          list = todaySchedule.map((b) => {
            const disc = activeEdital?.disciplines.find((d) => d.id === b.disciplineId);
            return {
              id: b.id,
              disciplineId: b.disciplineId,
              disciplineName: disc?.name || "Disciplina",
              targetMinutes: b.targetMinutes || 60,
              color: disc?.color,
              studiedMinutes: studiedMinutesByDiscipline.get(b.disciplineId) || 0,
            };
          });
        }
      } else {
        const cycle = activePlan.cycle || [];
        if (cycle.length > 0) {
          const currIdx = activePlan.currentCycleIndex || 0;
          const currentStep = cycle[currIdx % cycle.length];
          const nextStep = cycle[(currIdx + 1) % cycle.length];

          const steps = [currentStep, nextStep].filter(Boolean);
          list = steps.map((step) => {
            const disc = activeEdital?.disciplines.find((d) => d.id === step.disciplineId);
            return {
              id: step.id,
              disciplineId: step.disciplineId,
              disciplineName: disc?.name || "Disciplina",
              targetMinutes: step.targetMinutes || 60,
              color: disc?.color,
              studiedMinutes: studiedMinutesByDiscipline.get(step.disciplineId) || 0,
            };
          });
        }
      }
    }

    // Se o plano não possuir blocos agendados hoje, mas o edital ativo tiver disciplinas cadastradas
    if (list.length === 0 && activeEdital && activeEdital.disciplines.length > 0) {
      const fallbackDiscs = activeEdital.disciplines.slice(0, 2);
      list = fallbackDiscs.map((d) => ({
        id: `block-${d.id}`,
        disciplineId: d.id,
        disciplineName: d.name,
        targetMinutes: 60,
        color: d.color,
        studiedMinutes: studiedMinutesByDiscipline.get(d.id) || 0,
      }));
    }

    return list;
  }, [activePlan, activeEdital, studiedMinutesByDiscipline]);

  // Today's Scheduled Reviews (Clean filtered list)
  const todayReviews = useMemo(() => {
    const todayStr = getTodayLocalYmd();
    return scheduledReviews.filter(
      (r) => (!activeEdital || r.editalId === activeEdital.id) && !r.completed && r.dueDate <= todayStr
    );
  }, [scheduledReviews, activeEdital]);

  // Unified Discipline Performance (Combines Questions, Accuracy, Time and Topic Progress)
  const unifiedDisciplineStats: UnifiedDisciplineStat[] = useMemo(() => {
    if (!activeEdital) return [];

    return activeEdital.disciplines.map((disc) => {
      const discTopics = activeEdital.topics.filter((t) => t.disciplineId === disc.id);
      const discSessions = studySessions.filter(
        (s) => s.disciplineId === disc.id || s.disciplineName === disc.name
      );

      const qDone = discSessions.reduce((acc, s) => acc + (s.questionsDone || 0), 0);
      const qCorrect = discSessions.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0);

      const totalMinutes = discSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      const hoursInt = Math.floor(totalMinutes / 60);
      const minsInt = totalMinutes % 60;
      const timeFormatted = `${hoursInt}h${minsInt.toString().padStart(2, "0")}m`;

      const accuracy = qDone > 0 ? Math.round((qCorrect / qDone) * 100) : null;
      const studiedTopicsCount = discTopics.filter((t) => t.isStudied).length;
      const topicsProgressPercent =
        discTopics.length > 0 ? Math.round((studiedTopicsCount / discTopics.length) * 100) : 0;

      return {
        id: disc.id,
        name: disc.name,
        color: disc.color || "#F59E0B",
        qDone,
        qCorrect,
        accuracy,
        timeFormatted,
        totalMinutes,
        studiedTopicsCount,
        topicsCount: discTopics.length,
        topicsProgressPercent,
      };
    });
  }, [activeEdital, studySessions]);

  // Weekly Goals & Chart calculation
  const weeklyChartData: WeeklyChartData = useMemo(() => {
    const daysLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + weekOffset * 7;

    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekRangeLabel = `${monday.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })} – ${sunday.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;

    const dayMinutes = [0, 0, 0, 0, 0, 0, 0];
    const dayQuestions = [0, 0, 0, 0, 0, 0, 0];

    studySessions.forEach((s) => {
      const sDate = new Date(s.date);
      if (sDate >= monday && sDate <= sunday) {
        const jsDay = sDate.getDay();
        const chartIdx = jsDay === 0 ? 6 : jsDay - 1;
        dayMinutes[chartIdx] += s.durationMinutes;
        dayQuestions[chartIdx] += s.questionsDone || 0;
      }
    });

    const totalWeekMinutes = dayMinutes.reduce((a, b) => a + b, 0);
    const totalWeekQuestions = dayQuestions.reduce((a, b) => a + b, 0);
    const maxMinute = Math.max(...dayMinutes, 120);

    return {
      weekRangeLabel,
      totalWeekHoursFormatted: `${Math.floor(totalWeekMinutes / 60)}h${(totalWeekMinutes % 60)
        .toString()
        .padStart(2, "0")}m`,
      totalWeekHoursNumber: (totalWeekMinutes / 60).toFixed(1),
      totalWeekQuestions,
      days: daysLabels.map((label, idx) => ({
        label,
        minutes: dayMinutes[idx],
        questions: dayQuestions[idx],
        heightPercent: Math.min(100, Math.max(8, Math.round((dayMinutes[idx] / maxMinute) * 100))),
        formatted: `${Math.floor(dayMinutes[idx] / 60)}h${(dayMinutes[idx] % 60)
          .toString()
          .padStart(2, "0")}m`,
        hasStudied: dayMinutes[idx] > 0,
      })),
    };
  }, [studySessions, weekOffset]);

  // Recent Study Sessions (Clean 4 items)
  const recentActivities = useMemo(() => {
    return studySessions
      .filter((s) => !activeEdital || s.editalId === activeEdital.id)
      .slice(0, 4);
  }, [studySessions, activeEdital]);

  // Handle Quick Reminder Creation
  const handleAddReminder = (data: { title: string; category: "INSCRICOES" | "PROVAS" | "PAGAMENTOS"; date: string }) => {
    addReminder({
      title: data.title,
      category: data.category,
      date: data.date,
      completed: false,
      editalId: activeEdital?.id,
    });
  };

  return (
    <div className="nx-home relative space-y-6 pb-20 max-w-7xl mx-auto lg:space-y-7">
      {/* ========================================================================= */}
      {/* CABEÇALHO                                                                 */}
      {/* ========================================================================= */}
      <div className="relative pt-1 pb-1">
        <h1 className="font-condensed text-[32px] sm:text-[36px] font-bold leading-tight tracking-[0.01em]">
          <span className="text-white">{greeting}, </span>
          <span className="text-white">{userName}</span>
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* 1. INDICADORES DE HOJE: TEMPO, DESEMPENHO E PROGRESSO NO EDITAL          */}
      {/* ========================================================================= */}
      <StatCardsRow
        todayMinutes={todayMinutes}
        todaySessionsCount={todaySessions.length}
        todayQuestionsDone={todayQuestionsDone}
        todayQuestionsCorrect={todayQuestionsCorrect}
      >
        <EditalProgressCard
          title={activeEdital?.title}
          cargo={activeEdital?.cargo}
          percentage={gamification.globalProgressPercentage}
          completedTopicsCount={gamification.completedTopicsCount}
          totalTopicsCount={gamification.totalTopicsCount}
          onNavigateToEdital={() => setActiveTab("edital")}
        />
      </StatCardsRow>

      {/* ========================================================================= */}
      {/* 2. OFENSIVA                                                               */}
      {/* ========================================================================= */}
      <OfensivaCard />

      {/* ========================================================================= */}
      {/* 3 E 4. GRID: PLANEJAMENTO E REVISÕES                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <TodayScheduleSection
          plannedBlocks={todayPlannedBlocks}
          onStartStudy={handleStartStudy}
          onOpenManualStudy={onOpenManualStudy}
          onNavigateToPlanning={() => setActiveTab("planejamento")}
        />

        <ReviewsSection
          todayReviews={todayReviews}
          onOpenReview={(rev) => setSelectedReviewForModal(rev)}
          onNavigateToReviews={() => setActiveTab("revisoes")}
        />
      </div>

      {/* ========================================================================= */}
      {/* 6. DESEMPENHO POR DISCIPLINA                                              */}
      {/* ========================================================================= */}
      <DisciplinePerformanceSection
        disciplines={unifiedDisciplineStats}
        onStartStudy={handleStartStudy}
        onNavigateToDisciplines={() => setActiveTab("disciplinas")}
      />

      {/* ========================================================================= */}
      {/* 7. META DA SEMANA                                                         */}
      {/* ========================================================================= */}
      <WeeklyGoalsSection
        weeklyChartData={weeklyChartData}
        weeklyGoalHours={userSettings?.weeklyGoalHours || 20}
        weeklyGoalQuestions={userSettings?.weeklyGoalQuestions || 100}
        weekOffset={weekOffset}
        onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
        onNextWeek={() => setWeekOffset((prev) => Math.min(0, prev + 1))}
      />

      {/* ========================================================================= */}
      {/* 8 E 9. GRID: ÚLTIMAS ATIVIDADES E LEMBRETES                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 10. Últimas atividades */}
        <RecentActivitiesSection
          activities={recentActivities}
          onNavigateToHistory={() => setActiveTab("historico")}
        />

        {/* 11. Lembretes */}
        <RemindersSection
          reminders={reminders}
          onToggleReminder={toggleReminder}
          onAddReminder={handleAddReminder}
        />
      </div>

      {/* Review Detail Modal */}
      {selectedReviewForModal && (
        <ReviewDetailModal
          review={selectedReviewForModal}
          onClose={() => setSelectedReviewForModal(null)}
        />
      )}

      {/* Floating Clock / Study Tracker Widget in Bottom Right */}
      <FloatingTimerWidget />
    </div>
  );
};
