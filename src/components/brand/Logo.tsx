import React from "react";

interface LogoProps {
  variant?: "full" | "horizontal" | "symbol" | "compact";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  themeMode?: "dark" | "light" | "auto";
}

export const Logo: React.FC<LogoProps> = ({
  variant = "horizontal",
  size = "md",
  className = "",
  themeMode = "auto",
}) => {
  // Dimension scales
  const symbolDimensions = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
    hero: "w-28 h-28",
  };

  const NexoSymbol: React.FC<{ sizeClass: string }> = ({ sizeClass }) => (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 transition-transform duration-200`}
    >
      <defs>
        <linearGradient id="nexoGrad1" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8A00" />
          <stop offset="1" stopColor="#FF5400" />
        </linearGradient>
        <linearGradient id="nexoGrad2" x1="110" y1="10" x2="10" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA726" />
          <stop offset="1" stopColor="#E65100" />
        </linearGradient>
      </defs>

      {/* Rounded Outer Framing Rhombus / Nexus Node */}
      <rect
        x="60"
        y="14"
        width="65"
        height="65"
        rx="16"
        transform="rotate(45 60 14)"
        fill="#121620"
        stroke="url(#nexoGrad1)"
        strokeWidth="5"
      />

      {/* Inner Intersecting Node / Pathway */}
      <path
        d="M38 60 L60 38 L82 60 L60 82 Z"
        fill="none"
        stroke="#FFA726"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Modern Center Nexus Point */}
      <circle cx="60" cy="60" r="5" fill="#FFFFFF" />

      {/* Dynamic Geometric Nodes (North, East, South, West) */}
      <circle cx="60" cy="38" r="3.5" fill="#FF8A00" />
      <circle cx="82" cy="60" r="3.5" fill="#FF8A00" />
      <circle cx="60" cy="82" r="3.5" fill="#FF8A00" />
      <circle cx="38" cy="60" r="3.5" fill="#FF8A00" />
    </svg>
  );

  if (variant === "symbol" || variant === "compact") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <NexoSymbol sizeClass={symbolDimensions[size]} />
      </div>
    );
  }

  if (variant === "horizontal") {
    const textColor =
      themeMode === "dark"
        ? "text-white"
        : themeMode === "light"
        ? "text-zinc-900"
        : "text-zinc-900 dark:text-white";

    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <NexoSymbol sizeClass={symbolDimensions[size === "hero" ? "md" : size]} />
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline gap-1">
            <span className={`text-lg font-black tracking-[0.16em] ${textColor}`}>
              NEXO
            </span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#FF6B00] mt-0.5">
            ESTUDOS
          </span>
        </div>
      </div>
    );
  }

  // Full stacked variant
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <NexoSymbol sizeClass={symbolDimensions[size]} />
      <div className="mt-4 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-[0.2em] text-white">
          NEXO
        </h2>
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#FFA726]">
          Plataforma de Estudos
        </p>
      </div>
    </div>
  );
};
