import React from "react";

/**
 * GlobalWatermark Component
 *
 * Subtle institutional background texture featuring the NEXO Nexus node
 * and spaced branding elements. Strictly obeys the 10% opacity limit
 * (calibrated to ~4-6% actual visibility) to ensure zero competition with content,
 * zero pointer event interference, and optimal contrast in light and dark modes.
 */
export const GlobalWatermark: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden opacity-10 transition-opacity duration-300"
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="nexo-watermark-pattern"
            width="260"
            height="180"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-12)"
          >
            {/* Símbolo geométrico institucional NEXO */}
            <g transform="translate(30, 24)">
              <rect
                x="0"
                y="0"
                width="24"
                height="24"
                rx="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-[#172033] dark:text-white"
              />
              <path
                d="M6 18 L12 6 L18 18"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Tipografia institucional NEXO */}
            <text
              x="66"
              y="42"
              fontSize="16"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              letterSpacing="0.2em"
              className="fill-[#172033] dark:fill-white"
            >
              NEXO
            </text>

            {/* Ícone de Relógio Sutil */}
            <g transform="translate(175, 30)">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#172033] dark:text-white" />
              <polyline points="8 4 8 8 11 8" fill="none" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Ícone de Alvo Concéntrico Sutil */}
            <g transform="translate(85, 110)">
              <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-[#172033] dark:text-white" />
              <circle cx="9" cy="9" r="4.5" fill="none" stroke="#EA580C" strokeWidth="1.4" />
              <circle cx="9" cy="9" r="1.5" fill="currentColor" className="text-[#172033] dark:text-white" />
            </g>

            {/* Ícone de Prancheta Sutil */}
            <g transform="translate(195, 115)">
              <rect x="0" y="0" width="14" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-[#172033] dark:text-white" />
              <line x1="3.5" y1="6" x2="10.5" y2="6" stroke="#EA580C" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="3.5" y1="10" x2="10.5" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-[#172033] dark:text-white" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nexo-watermark-pattern)" className="text-[#172033] dark:text-white" />
      </svg>
    </div>
  );
};
