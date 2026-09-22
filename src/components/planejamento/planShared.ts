// Shared palette & formatting helpers for the Planejamento module

// Soft aesthetic pastel palette matching reference images
export const PASTEL_COLORS = [
  "#93C5FD", // soft blue
  "#FCA5A5", // soft coral/red
  "#FDE047", // soft warm yellow
  "#C4B5FD", // soft purple
  "#6EE7B7", // soft emerald
  "#FCD34D", // soft orange
  "#A7F3D0", // soft mint
  "#F9A8D4", // soft pink
  "#CBD5E1", // soft slate
  "#99F6E4", // soft cyan
];

export interface DisciplinePalette {
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  barBg: string;
}

export const DISCIPLINE_PALETTES: DisciplinePalette[] = [
  {
    bg: "bg-[#F3E8FF] dark:bg-[#3B1C54]/40",
    border: "border-[#E9D5FF] dark:border-[#582B7D]",
    text: "text-[#6B21A8] dark:text-[#E9D5FF]",
    badgeBg: "bg-[#E9D5FF] dark:bg-[#582B7D]",
    badgeText: "text-[#581C87] dark:text-[#F3E8FF]",
    barBg: "#C084FC",
  },
  {
    bg: "bg-[#E0F2FE] dark:bg-[#0C4A6E]/40",
    border: "border-[#BAE6FD] dark:border-[#0369A1]",
    text: "text-[#0369A1] dark:text-[#BAE6FD]",
    badgeBg: "bg-[#BAE6FD] dark:bg-[#0369A1]",
    badgeText: "text-[#075985] dark:text-[#E0F2FE]",
    barBg: "#38BDF8",
  },
  {
    bg: "bg-[#FFE4E6] dark:bg-[#881337]/40",
    border: "border-[#FECDD3] dark:border-[#BE123C]",
    text: "text-[#BE123C] dark:text-[#FECDD3]",
    badgeBg: "bg-[#FECDD3] dark:bg-[#BE123C]",
    badgeText: "text-[#9F1239] dark:text-[#FFE4E6]",
    barBg: "#FB7185",
  },
  {
    bg: "bg-[#DCFCE7] dark:bg-[#14532D]/40",
    border: "border-[#BBF7D0] dark:border-[#15803D]",
    text: "text-[#15803D] dark:text-[#BBF7D0]",
    badgeBg: "bg-[#BBF7D0] dark:bg-[#15803D]",
    badgeText: "text-[#166534] dark:text-[#DCFCE7]",
    barBg: "#4ADE80",
  },
  {
    bg: "bg-[#FEF3C7] dark:bg-[#78350F]/40",
    border: "border-[#FDE68A] dark:border-[#B45309]",
    text: "text-[#B45309] dark:text-[#FDE68A]",
    badgeBg: "bg-[#FDE68A] dark:bg-[#B45309]",
    badgeText: "text-[#92400E] dark:text-[#FEF3C7]",
    barBg: "#FBBF24",
  },
  {
    bg: "bg-[#FEF3C7] dark:bg-[#7C2D12]/40",
    border: "border-[#FED7AA] dark:border-[#C2410C]",
    text: "text-[#C2410C] dark:text-[#FED7AA]",
    badgeBg: "bg-[#FED7AA] dark:bg-[#C2410C]",
    badgeText: "text-[#9A3412] dark:text-[#FEF3C7]",
    barBg: "#FBBF24",
  },
];

// Reference-style duration: 0min, 45min -> "0h45min", 60 -> "1h", 1500 -> "25h"
export const formatDurationRef = (mins: number) => {
  const safeMins = Math.max(0, isNaN(mins) ? 0 : mins);
  const hours = Math.floor(safeMins / 60);
  const m = safeMins % 60;
  if (safeMins === 0) return "0min";
  if (m === 0) return `${hours}h`;
  return `${hours}h${m}min`;
};

export const formatDurationHM = (mins: number) => {
  const safeMins = Math.max(0, isNaN(mins) ? 0 : mins);
  const hours = Math.floor(safeMins / 60);
  const m = safeMins % 60;
  return `${hours}h${m.toString().padStart(2, "0")}min`;
};

export const formatDurationDigital = (mins: number) => {
  const safeMins = Math.max(0, isNaN(mins) ? 0 : mins);
  const hours = Math.floor(safeMins / 60);
  const m = safeMins % 60;
  return `${hours.toString().padStart(2, "0")}h${m.toString().padStart(2, "0")}min`;
};
