import React from "react";

export const NexoWatermark: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none opacity-10 dark:opacity-[0.07]"
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="nexo-pattern"
            width="220"
            height="140"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-15)"
          >
            {/* Logo Geométrico Nexo Estilizado */}
            <g transform="translate(20, 20)">
              <rect
                x="0"
                y="0"
                width="28"
                height="28"
                rx="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-[#172033] dark:text-white"
              />
              <path
                d="M7 21 L14 7 L21 21"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="14" cy="14" r="2.5" fill="#EA580C" />
            </g>

            {/* Texto "NEXO" */}
            <text
              x="58"
              y="40"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="16"
              fontWeight="800"
              letterSpacing="0.2em"
              className="fill-[#172033] dark:fill-white"
            >
              NEXO
            </text>

            {/* Ícones sutis intercalados: Relógio, Alvo, Livro */}
            <g transform="translate(140, 30)" opacity="0.6">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#172033] dark:text-white" />
              <polyline points="8 4 8 8 11 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[#172033] dark:text-white" />
            </g>

            <g transform="translate(80, 85)" opacity="0.6">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#172033] dark:text-white" />
              <circle cx="8" cy="8" r="3.5" fill="none" stroke="#EA580C" strokeWidth="1.5" />
            </g>

            <g transform="translate(170, 95)" opacity="0.5">
              <rect x="0" y="0" width="12" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#172033] dark:text-white" />
              <line x1="3" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" className="text-[#172033] dark:text-white" />
              <line x1="3" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="1.2" className="text-[#172033] dark:text-white" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nexo-pattern)" />
      </svg>
    </div>
  );
};
