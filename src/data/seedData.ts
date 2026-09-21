import { Edital, StudyPlan, StudySession, ScheduledReview, Simulado, Reminder, UserSettings } from "../types";

export const INITIAL_EDITAIS: Edital[] = [];

export const INITIAL_STUDY_PLANS: StudyPlan[] = [];

export const INITIAL_STUDY_SESSIONS: StudySession[] = [];

export const INITIAL_SCHEDULED_REVIEWS: ScheduledReview[] = [];

export const INITIAL_SIMULADOS: Simulado[] = [];

export const INITIAL_REMINDERS: Reminder[] = [];

export const INITIAL_USER_SETTINGS: UserSettings = {
  name: "Estudante NEXO",
  email: "estudante@nexoestudos.com.br",
  dailyGoalHours: 0,
  weeklyGoalQuestions: 0,
  weeklyGoalHours: 0,
  reviewIntervals: ["1 dia", "7 dias", "15 dias", "30 dias", "60 dias"],
  theme: "light",
  notificationsEnabled: true,
};
