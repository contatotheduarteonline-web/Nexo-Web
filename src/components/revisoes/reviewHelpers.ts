import { ReviewInterval, StudySession } from "../../types";

/**
 * Shared display helpers for the Revisões module (page, dashboard card and
 * modal). All data shown comes from the real ScheduledReview / StudySession
 * models — no invented values.
 */

export const getIntervalLabel = (stage: ReviewInterval | undefined): string => {
  switch (stage) {
    case "24h":
    case "1d":
      return "1 dia";
    case "7d":
      return "7 dias";
    case "14d":
      return "14 dias";
    case "15d":
      return "15 dias";
    case "30d":
      return "30 dias";
    case "60d":
      return "60 dias";
    default:
      return stage ? String(stage) : "Revisão";
  }
};

const WEEKDAYS_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTHS_SHORT = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

/** Parse a YYYY-MM-DD string without timezone drift. */
export const parseYmd = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y || 2026, (m || 1) - 1, d || 1);
};

/** Split a YYYY-MM-DD string into display parts for the date group header. */
export const getDateParts = (dateStr: string) => {
  const date = parseYmd(dateStr);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: MONTHS_SHORT[date.getMonth()],
    year: String(date.getFullYear()).slice(-2),
    weekday: WEEKDAYS_SHORT[date.getDay()],
  };
};

/** dd/MM/yy label used inside study-record rows. */
export const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
};

/** "01/01/26" from a YYYY-MM-DD string, used for the full date chip. */
export const formatLongDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
};

/** 180 → "03:00:00" (matches the HH:MM:SS column of the reference layout). */
export const formatDurationClock = (minutes: number | undefined): string => {
  const total = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
};

/** Local (non-UTC) YYYY-MM-DD of a StudySession. */
export const getSessionLocalDate = (session: StudySession): string => {
  if (session.studyDate) return session.studyDate;
  const d = new Date(session.date);
  if (isNaN(d.getTime())) return session.date.split("T")[0];
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Today as local YYYY-MM-DD. */
export const getTodayLocalYmd = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const isPendingReview = (
  review: { completed: boolean; status?: string }
): boolean => !review.completed && review.status !== "Ignorada";

export const groupReviewsByDate = <T extends { dueDate: string }>(reviews: T[]): [string, T[]][] => {
  const map = new Map<string, T[]>();
  reviews.forEach((r) => {
    const key = r.dueDate;
    const arr = map.get(key);
    if (arr) arr.push(r);
    else map.set(key, [r]);
  });
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
};
