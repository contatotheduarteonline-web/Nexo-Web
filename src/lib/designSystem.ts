/**
 * NEXO Design System Tokens & Utility Classes
 *
 * Centralized design system constants and class definitions ensuring
 * a cohesive, premium, and calm user experience across all modules.
 */

/**
 * LEGADO — sem uso na aplicação (fonte da verdade é src/index.css).
 * Valores alinhados à paleta semântica oficial (modo escuro único).
 */
export const NEXO_COLORS = {
  background: "#0F172A",
  surface: "#1E293B",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  border: "#384154",
  orange: "#F59E0B",
  orangeDark: "#D97706",
  success: "#249D84",
  error: "#DC4B4B",
  blueSecondary: "#3B82F6",
} as const;

export const DS = {
  // Surface Containers (Flat, 12-16px radius, subtle border, minimal shadow)
  surface:
    "rounded-2xl border border-[#E7EAF0] bg-white p-5 text-[#171B25] shadow-xs dark:border-[#1F2636] dark:bg-[#111520] dark:text-[#F1F5F9]",
  surfaceSubtle:
    "rounded-xl border border-[#E7EAF0] bg-[#F7F8FA] p-3 text-[#171B25] dark:border-[#1F2636] dark:bg-[#161B28] dark:text-[#F1F5F9]",

  // Typography Scale
  h1: "text-[24px] sm:text-[26px] font-bold tracking-tight text-[#171B25] dark:text-white leading-tight",
  h2: "text-[18px] sm:text-[19px] font-semibold text-[#171B25] dark:text-white leading-snug",
  h3: "text-[15px] sm:text-[16px] font-semibold text-[#171B25] dark:text-white",
  body: "text-[14px] text-[#171B25] dark:text-[#E2E8F0] leading-relaxed",
  bodySecondary: "text-[13px] text-[#667085] dark:text-[#94A3B8]",
  auxiliary: "text-[12px] text-[#667085] dark:text-[#94A3B8]",
  metricNumber: "text-[26px] sm:text-[30px] font-bold tracking-tight text-[#171B25] dark:text-white font-mono",

  // Buttons (clear single primary action)
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 py-2 text-[14px] font-semibold text-white shadow-xs transition hover:bg-[#D97706] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F59E0B]/50 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-3.5 py-2 text-[14px] font-medium text-[#171B25] transition hover:bg-[#F7F8FA] hover:border-[#D9DEE7] dark:border-[#1F2636] dark:bg-[#111520] dark:text-white dark:hover:bg-[#161B28] cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
  btnTertiary:
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-[#667085] transition hover:text-[#171B25] hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer",

  // Inputs
  input:
    "w-full rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-[14px] text-[#171B25] placeholder-[#667085] transition focus:border-[#F59E0B] focus:outline-hidden focus:ring-1 focus:ring-[#F59E0B] dark:border-[#1F2636] dark:bg-[#111520] dark:text-white dark:placeholder-slate-500",

  // Status Badges (restrained, non-garish)
  badgeSuccess:
    "inline-flex items-center gap-1 rounded-md bg-[#249D84]/10 px-2 py-0.5 text-[12px] font-medium text-[#249D84] dark:bg-[#249D84]/20 dark:text-[#2DD4BF]",
  badgeWarning:
    "inline-flex items-center gap-1 rounded-md bg-[#F59E0B]/10 px-2 py-0.5 text-[12px] font-medium text-[#F59E0B] dark:bg-[#F59E0B]/20 dark:text-[#FBBF24]",
  badgeNeutral:
    "inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-[#667085] dark:bg-slate-800 dark:text-slate-300",
} as const;
