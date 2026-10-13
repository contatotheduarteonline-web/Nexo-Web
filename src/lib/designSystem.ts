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
  background: "#0B1120",
  surface: "#172235",
  textPrimary: "#F5F7FB",
  textSecondary: "#93A2B7",
  border: "#263447",
  orange: "#F4B544",
  orangeDark: "#D97706",
  success: "#2BBF8A",
  error: "#F16D75",
  blueSecondary: "#58A6FF",
} as const;

export const DS = {
  // Surface Containers (Flat, 12-16px radius, subtle border, minimal shadow)
  surface:
    "rounded-2xl border border-[#E7EAF0] bg-white p-5 text-white shadow-xs dark:border-[#1F2636] dark:bg-[#111520] dark:text-[#F5F7FB]",
  surfaceSubtle:
    "rounded-xl border border-[#E7EAF0] bg-[#F7F8FA] p-3 text-white dark:border-[#1F2636] dark:bg-[#161B28] dark:text-[#F5F7FB]",

  // Typography Scale
  h1: "text-[24px] sm:text-[26px] font-bold tracking-tight text-white dark:text-white leading-tight",
  h2: "text-[18px] sm:text-[19px] font-semibold text-white dark:text-white leading-snug",
  h3: "text-[15px] sm:text-[16px] font-semibold text-white dark:text-white",
  body: "text-[14px] text-white dark:text-[#C4CEDB] leading-relaxed",
  bodySecondary: "text-[13px] text-[#667085] dark:text-[#93A2B7]",
  auxiliary: "text-[12px] text-[#667085] dark:text-[#93A2B7]",
  metricNumber: "text-[26px] sm:text-[30px] font-bold tracking-tight text-white dark:text-white font-mono",

  // Buttons (clear single primary action)
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#527DFF] px-4 py-2 text-[14px] font-semibold text-white shadow-xs transition hover:bg-[#416CEB] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#527DFF]/50 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-3.5 py-2 text-[14px] font-medium text-white transition hover:bg-[#F7F8FA] hover:border-[#D9DEE7] dark:border-[#1F2636] dark:bg-[#111520] dark:text-white dark:hover:bg-[#161B28] cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
  btnTertiary:
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-[#667085] transition hover:text-white hover:bg-slate-100 dark:text-[#93A2B7] dark:hover:text-white dark:hover:bg-[#172235] cursor-pointer",

  // Inputs
  input:
    "w-full rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-[14px] text-white placeholder-[#667085] transition focus:border-[#7DA2FF] focus:outline-hidden focus:ring-1 focus:ring-[#7DA2FF] dark:border-[#1F2636] dark:bg-[#111520] dark:text-white dark:placeholder-slate-500",

  // Status Badges (restrained, non-garish)
  badgeSuccess:
    "inline-flex items-center gap-1 rounded-md bg-[#2BBF8A]/10 px-2 py-0.5 text-[12px] font-medium text-[#2BBF8A] dark:bg-[#2BBF8A]/20 dark:text-[#2DD4BF]",
  badgeWarning:
    "inline-flex items-center gap-1 rounded-md bg-[#527DFF]/10 px-2 py-0.5 text-[12px] font-medium text-[#F4B544] dark:bg-[#527DFF]/20 dark:text-[#F4B544]",
  badgeNeutral:
    "inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-[#667085] dark:bg-[#172235] dark:text-[#C4CEDB]",
} as const;
