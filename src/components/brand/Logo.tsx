import React from "react";

interface LogoProps {
  variant?: "full" | "horizontal" | "symbol" | "compact";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  themeMode?: "dark" | "light" | "auto";
  /** Torna o ícone totalmente branco (para fundos escuros). */
  iconWhite?: boolean;
  /** Exibe o wordmark "NEXO" ao lado do ícone nas variantes compactas. */
  showWordmark?: boolean;
}

const LOGO_SRC = "/nexo-logo.png";
const LOGO_WHITE_SRC = "/nexo-notification-icon.png";

/**
 * NEXO brand logo — image-based icon with optional "NEXO" wordmark.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = "horizontal",
  size = "md",
  className = "",
  themeMode = "auto",
  iconWhite = false,
  showWordmark = false,
}) => {
  const iconSizes: Record<string, string> = {
    xs: "h-5 w-5",
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
    hero: "h-20 w-20 sm:h-24 sm:w-24",
  };

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
      ? "text-white"
      : "text-white dark:text-white";

  const subtitleSlate =
    themeMode === "dark"
      ? "text-[#93A2B7]"
      : themeMode === "light"
      ? "text-[#718096]"
      : "text-[#718096] dark:text-[#93A2B7]";

  const BrandIcon: React.FC<{ sizeClass: string }> = ({ sizeClass }) => (
    <img
      src={iconWhite ? LOGO_WHITE_SRC : LOGO_SRC}
      alt="NEXO"
      className={`${sizeClass} shrink-0 object-contain ${
        iconWhite ? "" : "rounded-lg"
      }`}
      draggable={false}
    />
  );

  const Wordmark: React.FC<{ sizeClass: string }> = ({ sizeClass }) => (
    <span className={`font-black uppercase leading-none tracking-[0.14em] ${sizeClass} ${textColor}`}>
      NEXO<span className="text-[#F4B544]">.</span>
    </span>
  );

  const Subtitle: React.FC = () => (
    <span className="text-[9px] font-bold uppercase tracking-[0.24em] leading-none mt-1">
      <span className={subtitleSlate}>Plataforma</span>{" "}
      <span className="text-[#F4B544]">de Estudos</span>
    </span>
  );

  // Symbol / compact: icon only (headers, toolbars) — opcionalmente com wordmark
  if (variant === "symbol" || variant === "compact") {
    if (!showWordmark) {
      return (
        <div className={`inline-flex items-center justify-center ${className}`}>
          <BrandIcon sizeClass={iconSizes[size]} />
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <BrandIcon sizeClass={iconSizes[size]} />
        <Wordmark sizeClass={wordmarkSizes[size]} />
      </div>
    );
  }

  // Horizontal: icon + wordmark + subtitle, left-aligned
  if (variant === "horizontal") {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <BrandIcon sizeClass={iconSizes[size]} />
        <div className="inline-flex flex-col items-start justify-center">
          <Wordmark sizeClass={wordmarkSizes[size]} />
          <Subtitle />
        </div>
      </div>
    );
  }

  // Full stacked variant: centered icon + wordmark + subtitle
  return (
    <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
      <BrandIcon sizeClass={iconSizes[size]} />
      <div className="flex flex-col items-center">
        <Wordmark sizeClass={wordmarkSizes[size]} />
        <Subtitle />
      </div>
    </div>
  );
};
