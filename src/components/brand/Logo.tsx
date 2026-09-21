import React from "react";

interface LogoProps {
  variant?: "full" | "horizontal" | "symbol" | "compact";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  themeMode?: "dark" | "light" | "auto";
}

/**
 * NEXO wordmark — white "NEXO" letters with a subtle chromatic
 * aberration (red/cyan edge shift) and an amber dot.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = "horizontal",
  size = "md",
  className = "",
  themeMode = "auto",
}) => {
  const wordmarkSizes: Record<string, string> = {
    xs: "text-sm",
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl sm:text-4xl",
    xl: "text-4xl sm:text-5xl",
    hero: "text-5xl sm:text-6xl",
  };

  const textColor =
    themeMode === "dark"
      ? "text-white"
      : themeMode === "light"
      ? "text-[#172033]"
      : "text-[#172033] dark:text-white";

  const subtitleSlate =
    themeMode === "dark"
      ? "text-slate-400"
      : themeMode === "light"
      ? "text-slate-500"
      : "text-slate-500 dark:text-slate-400";

  const Wordmark: React.FC<{ sizeClass: string }> = ({ sizeClass }) => (
    <span className="relative inline-flex items-baseline">
      <span
        className={`font-black uppercase leading-none tracking-[0.14em] ${sizeClass} ${textColor}`}
        style={{
          textShadow:
            "0.03em 0 0 rgba(255, 56, 92, 0.45), -0.03em 0 0 rgba(56, 224, 255, 0.35)",
        }}
      >
        NEXO
      </span>
      <span className="font-black leading-none text-[#fca326]">.</span>
    </span>
  );

  const Subtitle: React.FC = () => (
    <span className="text-[9px] font-bold uppercase tracking-[0.24em] leading-none mt-1">
      <span className={subtitleSlate}>Plataforma</span>{" "}
      <span className="text-[#fca326]">de Estudos</span>
    </span>
  );

  // Wordmark only (compact contexts: headers, toolbars)
  if (variant === "symbol" || variant === "compact") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <Wordmark sizeClass={wordmarkSizes[size]} />
      </div>
    );
  }

  // Horizontal: wordmark + subtitle, left-aligned
  if (variant === "horizontal") {
    return (
      <div className={`inline-flex flex-col items-start justify-center ${className}`}>
        <Wordmark sizeClass={wordmarkSizes[size]} />
        <Subtitle />
      </div>
    );
  }

  // Full stacked variant: centered wordmark + subtitle
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <Wordmark sizeClass={wordmarkSizes[size]} />
      <Subtitle />
    </div>
  );
};
