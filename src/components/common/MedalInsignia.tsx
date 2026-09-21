import React from "react";
import {
  Compass,
  Target,
  Crosshair,
  Rocket,
  Flag,
  Swords,
  Trophy,
  Flame,
  Zap,
  CheckCircle2,
  Landmark,
  Crown,
  Eye,
  Sparkles,
  Diamond,
  BookCheck,
  GraduationCap,
  Castle,
  Globe,
  Clock,
  Hourglass,
  Cpu,
  Gauge,
  Brain,
  Repeat,
  FileCheck2,
  Award,
  Medal,
  Lock,
  Activity,
  LucideIcon,
  TrendingUp,
} from "lucide-react";

export type MedalTier =
  | "bronze"
  | "silver"
  | "gold"
  | "emerald"
  | "sapphire"
  | "ruby"
  | "diamond"
  | "obsidian"
  | "steel";

export interface MedalInsigniaProps {
  iconName: string;
  tier?: MedalTier;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  unlocked?: boolean;
  className?: string;
}

// Icon Mapping
const ICON_REGISTRY: Record<string, LucideIcon> = {
  // Edital & Objetivos
  compass: Compass,
  target: Target,
  crosshair: Crosshair,
  rocket: Rocket,
  flag: Flag,
  swords: Swords,
  trophy: Trophy,
  crown: Crown,

  // Questões & Precisão
  flame: Flame,
  zap: Zap,
  check: CheckCircle2,
  landmark: Landmark,
  eye: Eye,
  sparkles: Sparkles,
  diamond: Diamond,

  // Disciplinas
  book: BookCheck,
  grad: GraduationCap,
  castle: Castle,
  globe: Globe,

  // Tempo & Performance
  clock: Clock,
  hourglass: Hourglass,
  cpu: Cpu,
  gauge: Gauge,
  activity: Activity,
  trendingup: TrendingUp,

  // Revisões & Simulados
  brain: Brain,
  repeat: Repeat,
  simulado: FileCheck2,

  // Níveis de Performance
  award: Award,
  medal: Medal,
};

// Minimalist, Luxurious, Modern Metallic & Tech-Clean Themes
const TIER_STYLES: Record<
  MedalTier,
  {
    outerRing: string;
    innerPlate: string;
    iconColor: string;
    glow: string;
    accentRim: string;
    ribbonColor: string;
  }
> = {
  bronze: {
    outerRing: "border-[#C88A58]/60 bg-gradient-to-b from-[#C88A58]/20 to-[#8A4F25]/20 shadow-xs",
    innerPlate: "bg-gradient-to-b from-[#7A3F18] to-[#452008]",
    iconColor: "text-[#FCD7B6]",
    glow: "rgba(200,138,88,0.25)",
    accentRim: "border-[#E5A869]/40",
    ribbonColor: "from-[#8C4614] to-[#5C2E0B]",
  },
  silver: {
    outerRing: "border-slate-300/80 dark:border-slate-600/80 bg-gradient-to-b from-slate-200/50 to-slate-400/20 shadow-xs",
    innerPlate: "bg-gradient-to-b from-slate-600 to-slate-800",
    iconColor: "text-white",
    glow: "rgba(148,163,184,0.25)",
    accentRim: "border-white/50",
    ribbonColor: "from-[#64748B] to-[#334155]",
  },
  gold: {
    outerRing: "border-amber-400/80 bg-gradient-to-b from-amber-200/50 to-amber-500/20 shadow-xs",
    innerPlate: "bg-gradient-to-b from-amber-500 to-amber-700",
    iconColor: "text-amber-50",
    glow: "rgba(245,158,11,0.3)",
    accentRim: "border-amber-200/60",
    ribbonColor: "from-[#D4AF37] to-[#78540B]",
  },
  emerald: {
    outerRing: "border-emerald-400/80 bg-gradient-to-b from-emerald-200/40 to-emerald-500/20 shadow-xs",
    innerPlate: "bg-gradient-to-b from-emerald-500 to-emerald-700",
    iconColor: "text-emerald-50",
    glow: "rgba(16,185,129,0.3)",
    accentRim: "border-emerald-200/50",
    ribbonColor: "from-[#10B981] to-[#064E3B]",
  },
  sapphire: {
    outerRing: "border-blue-400/80 bg-gradient-to-b from-blue-200/40 to-blue-500/20 shadow-xs",
    innerPlate: "bg-gradient-to-b from-blue-500 to-blue-700",
    iconColor: "text-blue-50",
    glow: "rgba(59,130,246,0.3)",
    accentRim: "border-blue-200/50",
    ribbonColor: "from-[#3B82F6] to-[#1E3A8A]",
  },
  ruby: {
    outerRing: "border-rose-400/80 bg-gradient-to-b from-rose-200/40 to-rose-500/20 shadow-xs",
    innerPlate: "bg-gradient-to-b from-rose-500 to-rose-700",
    iconColor: "text-rose-50",
    glow: "rgba(244,63,94,0.3)",
    accentRim: "border-rose-200/50",
    ribbonColor: "from-[#F43F5E] to-[#881337]",
  },
  diamond: {
    outerRing: "border-sky-300/90 bg-gradient-to-b from-sky-100 to-sky-400/30 shadow-xs",
    innerPlate: "bg-gradient-to-b from-sky-400 to-sky-600",
    iconColor: "text-white",
    glow: "rgba(56,189,248,0.35)",
    accentRim: "border-white/60",
    ribbonColor: "from-[#38BDF8] to-[#0C4A6E]",
  },
  obsidian: {
    outerRing: "border-slate-700 bg-gradient-to-b from-slate-700/50 to-slate-900/80 shadow-xs",
    innerPlate: "bg-gradient-to-b from-slate-800 to-slate-950",
    iconColor: "text-amber-400",
    glow: "rgba(245,158,11,0.2)",
    accentRim: "border-amber-500/30",
    ribbonColor: "from-[#F59E0B] to-[#0F172A]",
  },
  steel: {
    outerRing: "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 shadow-xs",
    innerPlate: "bg-slate-200 dark:bg-slate-800",
    iconColor: "text-slate-400",
    glow: "transparent",
    accentRim: "border-slate-300 dark:border-slate-700",
    ribbonColor: "from-[#475569] to-[#1E293B]",
  },
};

const SIZE_MAP = {
  xs: {
    container: "w-6 h-6",
    outer: "p-[1.5px]",
    inner: "p-0.5",
    icon: "h-3 w-3",
    stars: "text-[7px]",
  },
  sm: {
    container: "w-8 h-8",
    outer: "p-[2px]",
    inner: "p-1",
    icon: "h-3.5 w-3.5",
    stars: "text-[8px]",
  },
  md: {
    container: "w-10 h-10",
    outer: "p-[2px]",
    inner: "p-1.5",
    icon: "h-4.5 w-4.5",
    stars: "text-[9px]",
  },
  lg: {
    container: "w-13 h-13",
    outer: "p-[3px]",
    inner: "p-2",
    icon: "h-6 w-6",
    stars: "text-[10px]",
  },
  xl: {
    container: "w-16 h-16",
    outer: "p-[3.5px]",
    inner: "p-2.5",
    icon: "h-7.5 w-7.5",
    stars: "text-[12px]",
  },
};

export const MedalInsignia: React.FC<MedalInsigniaProps> = ({
  iconName,
  tier = "gold",
  size = "md",
  unlocked = true,
  className = "",
}) => {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const theme = unlocked ? TIER_STYLES[tier] || TIER_STYLES.gold : TIER_STYLES.steel;
  const IconComponent = ICON_REGISTRY[iconName.toLowerCase()] || Medal;

  if (!unlocked) {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${sizeConfig.container} ${className}`}
      >
        <div
          className={`relative flex items-center justify-center w-full h-full rounded-xl border border-slate-200/80 bg-slate-100/90 dark:border-slate-800/80 dark:bg-[#121722] ${sizeConfig.outer}`}
        >
          <div
            className={`flex items-center justify-center w-full h-full rounded-lg bg-slate-200/50 dark:bg-[#0A0E17] ${sizeConfig.inner}`}
          >
            <Lock className={`${sizeConfig.icon} text-slate-400 dark:text-slate-500 stroke-[1.8]`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group ${sizeConfig.container} ${className}`}
    >
      {/* Outer Glow Halo on Hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 blur-xs transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: theme.glow }}
      />

      {/* Main Medallion Frame */}
      <div
        className={`relative flex items-center justify-center w-full h-full rounded-xl border ${theme.outerRing} ${sizeConfig.outer} transition-all duration-200 group-hover:scale-105`}
      >
        {/* Inner Plate */}
        <div
          className={`relative flex items-center justify-center w-full h-full rounded-lg ${theme.innerPlate} border ${theme.accentRim} shadow-inner ${sizeConfig.inner}`}
        >
          {/* Centered High-Definition Icon */}
          <IconComponent
            className={`relative z-10 ${sizeConfig.icon} ${theme.iconColor} stroke-[2] transition-transform duration-200 group-hover:scale-110`}
          />
        </div>
      </div>
    </div>
  );
};
