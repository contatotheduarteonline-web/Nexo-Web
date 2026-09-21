import React from "react";

export type MedalState = "locked" | "in_progress" | "unlocked";
export type MedalSize = "sm" | "md" | "lg" | "xl";

interface AchievementMedalProps {
  badgeId: string;
  category?: string;
  state?: MedalState;
  progressPercent?: number;
  size?: MedalSize;
  className?: string;
  showCheckBadge?: boolean;
}

const sizeMap: Record<MedalSize, { px: number; checkSize: number; checkOffset: number }> = {
  sm: { px: 44, checkSize: 14, checkOffset: 0 },
  md: { px: 64, checkSize: 18, checkOffset: 1 },
  lg: { px: 80, checkSize: 22, checkOffset: 2 },
  xl: { px: 112, checkSize: 26, checkOffset: 3 },
};

// Refined metallic palette per category for unlocked state
function getCategoryPalette(category: string = "progresso") {
  switch (category) {
    case "progresso":
    case "edital":
      return {
        rimOuter: "#D97706",
        rimInner: "#C2410C",
        faceFrom: "#271206",
        faceTo: "#120702",
        accent: "#FBBF24",
        accentLight: "#FED7AA",
        glow: "rgba(234, 88, 12, 0.25)",
      };
    case "questoes":
      return {
        rimOuter: "#0284C7",
        rimInner: "#0369A1",
        faceFrom: "#061C2C",
        faceTo: "#030D15",
        accent: "#38BDF8",
        accentLight: "#BAE6FD",
        glow: "rgba(2, 132, 199, 0.25)",
      };
    case "precisao":
      return {
        rimOuter: "#059669",
        rimInner: "#047857",
        faceFrom: "#062217",
        faceTo: "#02100A",
        accent: "#34D399",
        accentLight: "#A7F3D0",
        glow: "rgba(5, 150, 105, 0.25)",
      };
    case "disciplinas":
      return {
        rimOuter: "#7C3AED",
        rimInner: "#6D28D9",
        faceFrom: "#1A0E30",
        faceTo: "#0C0617",
        accent: "#A78BFA",
        accentLight: "#DDD6FE",
        glow: "rgba(124, 58, 237, 0.25)",
      };
    case "tempo":
      return {
        rimOuter: "#D97706",
        rimInner: "#B45309",
        faceFrom: "#251804",
        faceTo: "#120B02",
        accent: "#FBBF24",
        accentLight: "#FDE68A",
        glow: "rgba(217, 119, 6, 0.25)",
      };
    case "revisoes":
      return {
        rimOuter: "#0D9488",
        rimInner: "#0F766E",
        faceFrom: "#041F1C",
        faceTo: "#020F0D",
        accent: "#2DD4BF",
        accentLight: "#99F6E4",
        glow: "rgba(13, 148, 136, 0.25)",
      };
    case "simulados":
      return {
        rimOuter: "#E11D48",
        rimInner: "#BE123C",
        faceFrom: "#26060F",
        faceTo: "#120207",
        accent: "#FB7185",
        accentLight: "#FECDD3",
        glow: "rgba(225, 29, 72, 0.25)",
      };
    default:
      return {
        rimOuter: "#D97706",
        rimInner: "#C2410C",
        faceFrom: "#271206",
        faceTo: "#120702",
        accent: "#FBBF24",
        accentLight: "#FED7AA",
        glow: "rgba(234, 88, 12, 0.25)",
      };
  }
}

export const AchievementMedal: React.FC<AchievementMedalProps> = ({
  badgeId,
  category = "progresso",
  state = "locked",
  progressPercent = 0,
  size = "md",
  className = "",
  showCheckBadge = true,
}) => {
  const { px, checkSize, checkOffset } = sizeMap[size];
  const isUnlocked = state === "unlocked";
  const isInProgress = state === "in_progress";
  const isLocked = state === "locked";

  const palette = getCategoryPalette(category);

  // Outer progress track calculation (radius = 46.5 on 100x100 viewBox)
  const radius = 46.5;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // Colors for inner vector artwork
  const strokeColor = isUnlocked ? palette.accent : isInProgress ? "#94A3B8" : "#475569";
  const fillColor = isUnlocked ? palette.accentLight : isInProgress ? "#CBD5E1" : "#334155";
  const highlight = isUnlocked ? "#FFFFFF" : isInProgress ? "#F1F5F9" : "#64748B";

  // Individual Tailored Vector Emblem
  const renderEmblem = () => {
    switch (badgeId) {
      // 1. PROGRESSO
      case "badge-first": // Primeiro Passo: pedras de início + bússola ascendente com estrela guia
        return (
          <g>
            <path
              d="M34 68 L44 56 L56 56 L66 68"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M40 56 L46 45 L54 45 L60 56"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="45" r="4.5" fill={fillColor} />
            <path
              d="M50 24 L52.5 32 L60 34 L52.5 36 L50 44 L47.5 36 L40 34 L47.5 32 Z"
              fill={isUnlocked ? highlight : strokeColor}
            />
          </g>
        );

      case "badge-focus": // Ritmo Inicial: 3 pilares de aceleração escalonados
        return (
          <g>
            <rect x="33" y="56" width="9" height="16" rx="2" fill={strokeColor} />
            <rect x="45.5" y="44" width="9" height="28" rx="2" fill={strokeColor} />
            <rect x="58" y="32" width="9" height="40" rx="2" fill={fillColor} />
            <path
              d="M30 46 L47 32 L69 22"
              fill="none"
              stroke={isUnlocked ? highlight : strokeColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <polygon points="66,18 73,21 68,27" fill={isUnlocked ? highlight : strokeColor} />
          </g>
        );

      case "badge-consistency-15": // Constância: ciclo contínuo em lemniscata com nós de ritmo
        return (
          <g>
            <path
              d="M35 50 C35 42 42 42 46 46 L54 54 C58 58 65 58 65 50 C65 42 58 42 54 46 L46 54 C42 58 35 58 35 50 Z"
              fill="none"
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="35" cy="50" r="3.5" fill={fillColor} />
            <circle cx="50" cy="50" r="2.5" fill={isUnlocked ? highlight : strokeColor} />
            <circle cx="65" cy="50" r="3.5" fill={fillColor} />
          </g>
        );

      case "badge-25pct": // Um Quarto do Caminho: medidor radial 25% com quadrante destacado
        return (
          <g>
            <circle cx="50" cy="50" r="22" fill="none" stroke={strokeColor} strokeWidth="3" strokeOpacity="0.3" />
            <path
              d="M50 28 A22 22 0 0 1 72 50"
              fill="none"
              stroke={fillColor}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line x1="50" y1="50" x2="50" y2="33" stroke={isUnlocked ? highlight : strokeColor} strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="50" r="4.5" fill={isUnlocked ? highlight : strokeColor} />
            <line x1="50" y1="23" x2="50" y2="27" stroke={strokeColor} strokeWidth="2" />
            <line x1="77" y1="50" x2="73" y2="50" stroke={strokeColor} strokeWidth="2" />
          </g>
        );

      case "badge-50pct": // Metade do Caminho: medidor 50% dividido pelo meridiano
        return (
          <g>
            <circle cx="50" cy="50" r="22" fill="none" stroke={strokeColor} strokeWidth="3" strokeOpacity="0.3" />
            <path
              d="M28 50 A22 22 0 0 1 72 50"
              fill="none"
              stroke={fillColor}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line x1="26" y1="50" x2="74" y2="50" stroke={strokeColor} strokeWidth="2" strokeDasharray="2 3" />
            <circle cx="50" cy="50" r="5" fill={isUnlocked ? highlight : strokeColor} />
            <line x1="50" y1="50" x2="50" y2="30" stroke={isUnlocked ? highlight : strokeColor} strokeWidth="3" strokeLinecap="round" />
          </g>
        );

      case "badge-75pct": // Reta Final: medidor 75% com nó farol de conclusão
        return (
          <g>
            <circle cx="50" cy="50" r="22" fill="none" stroke={strokeColor} strokeWidth="3" strokeOpacity="0.3" />
            <path
              d="M50 72 A22 22 0 1 1 72 50"
              fill="none"
              stroke={fillColor}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="5" fill={strokeColor} />
            <line x1="50" y1="50" x2="68" y2="50" stroke={isUnlocked ? highlight : strokeColor} strokeWidth="3" strokeLinecap="round" />
            <circle cx="72" cy="50" r="3.5" fill={isUnlocked ? highlight : strokeColor} />
          </g>
        );

      case "badge-zerado": // Domínio Completo: Coroa de Louros com Sol Radiante Central
        return (
          <g>
            <path
              d="M30 52 C30 64 40 72 50 72 C60 72 70 64 70 52"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <ellipse cx="32" cy="46" rx="4" ry="2" transform="rotate(-30 32 46)" fill={fillColor} />
            <ellipse cx="33" cy="56" rx="4" ry="2" transform="rotate(15 33 56)" fill={fillColor} />
            <ellipse cx="39" cy="65" rx="4" ry="2" transform="rotate(45 39 65)" fill={fillColor} />
            <ellipse cx="68" cy="46" rx="4" ry="2" transform="rotate(30 68 46)" fill={fillColor} />
            <ellipse cx="67" cy="56" rx="4" ry="2" transform="rotate(-15 67 56)" fill={fillColor} />
            <ellipse cx="61" cy="65" rx="4" ry="2" transform="rotate(-45 61 65)" fill={fillColor} />
            <polygon
              points="50,28 53,37 62,38 55,44 58,52 50,47 42,52 45,44 38,38 47,37"
              fill={isUnlocked ? highlight : strokeColor}
            />
            <path
              d="M45 44 L48 48 L56 39"
              fill="none"
              stroke={isUnlocked ? "#120B07" : "#0F172A"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );

      // 2. QUESTÕES
      case "badge-q-10": // Primeiras Questões: folha técnica de gabarito com primeiro acerto
        return (
          <g>
            <rect x="34" y="28" width="32" height="44" rx="4" fill="none" stroke={strokeColor} strokeWidth="3" />
            <line x1="42" y1="38" x2="58" y2="38" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="42" y1="48" x2="58" y2="48" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="42" y1="58" x2="52" y2="58" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="56" cy="58" r="5" fill={fillColor} />
            <path d="M54 58 L55.5 59.5 L58.5 56.5" fill="none" stroke={isUnlocked ? highlight : "#0F172A"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );

      case "badge-q-50": // Prática Ativa: caneta técnica traçando gabarito com precisão
        return (
          <g>
            <circle cx="36" cy="38" r="3" fill={strokeColor} />
            <circle cx="46" cy="38" r="3" fill={fillColor} />
            <circle cx="56" cy="38" r="3" fill={strokeColor} />
            <circle cx="36" cy="50" r="3" fill={fillColor} />
            <circle cx="46" cy="50" r="3" fill={fillColor} />
            <circle cx="56" cy="50" r="3" fill={strokeColor} />
            <path d="M40 68 L64 36 L70 42 L46 74 Z" fill={strokeColor} />
            <polygon points="40,68 37,76 46,74" fill={isUnlocked ? highlight : fillColor} />
            <path
              d="M32 58 L40 66 L58 48"
              fill="none"
              stroke={isUnlocked ? highlight : strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );

      case "badge-q-100": // Ritmo de Questões: vetor elétrico cortando bloco de questões
        return (
          <g>
            <rect x="38" y="32" width="28" height="36" rx="3" fill="none" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <rect x="34" y="36" width="28" height="36" rx="3" fill="none" stroke={strokeColor} strokeWidth="2.5" />
            <polygon
              points="53,24 40,46 49,46 45,68 62,44 53,44"
              fill={isUnlocked ? highlight : fillColor}
              stroke={strokeColor}
              strokeWidth="1.5"
            />
          </g>
        );

      case "badge-q-250": // Volume de Prática: matriz hexagonal com alvo concêntrico
        return (
          <g>
            <polygon points="50,26 68,36 68,58 50,68 32,58 32,36" fill="none" stroke={strokeColor} strokeWidth="3" />
            <polygon points="50,34 60,40 60,54 50,60 40,54 40,40" fill="none" stroke={fillColor} strokeWidth="2.5" />
            <circle cx="50" cy="47" r="5" fill={isUnlocked ? highlight : strokeColor} />
            <line x1="50" y1="20" x2="50" y2="26" stroke={strokeColor} strokeWidth="2.5" />
            <line x1="50" y1="68" x2="50" y2="74" stroke={strokeColor} strokeWidth="2.5" />
          </g>
        );

      case "badge-q-500": // Grande Volume: monumento em camadas com diamante de topo
        return (
          <g>
            <rect x="28" y="62" width="44" height="8" rx="2" fill={strokeColor} />
            <rect x="34" y="52" width="32" height="8" rx="2" fill={strokeColor} />
            <rect x="40" y="42" width="20" height="8" rx="2" fill={fillColor} />
            <polygon
              points="50,24 58,36 50,42 42,36"
              fill={isUnlocked ? highlight : fillColor}
              stroke={strokeColor}
              strokeWidth="2"
            />
            <line x1="50" y1="24" x2="50" y2="42" stroke={strokeColor} strokeWidth="1.5" />
          </g>
        );

      // 3. PRECISÃO
      case "badge-accuracy-70": // Boa Precisão: mira com 3 anéis e pontuação calibrada
        return (
          <g>
            <circle cx="50" cy="50" r="23" fill="none" stroke={strokeColor} strokeWidth="2.5" />
            <circle cx="50" cy="50" r="15" fill="none" stroke={fillColor} strokeWidth="2.5" />
            <circle cx="50" cy="50" r="6" fill={isUnlocked ? highlight : strokeColor} />
            <line x1="50" y1="21" x2="50" y2="29" stroke={strokeColor} strokeWidth="2.5" />
            <line x1="50" y1="71" x2="50" y2="79" stroke={strokeColor} strokeWidth="2.5" />
            <line x1="21" y1="50" x2="29" y2="50" stroke={strokeColor} strokeWidth="2.5" />
            <line x1="71" y1="50" x2="79" y2="50" stroke={strokeColor} strokeWidth="2.5" />
          </g>
        );

      case "badge-precision-80": // Precisão Consistente: mira óptica de alta precisão
        return (
          <g>
            <circle cx="50" cy="50" r="24" fill="none" stroke={strokeColor} strokeWidth="3" />
            <circle cx="50" cy="50" r="14" fill="none" stroke={fillColor} strokeWidth="2.5" />
            <line x1="50" y1="20" x2="50" y2="80" stroke={strokeColor} strokeWidth="2" strokeDasharray="3 4" />
            <line x1="20" y1="50" x2="80" y2="50" stroke={strokeColor} strokeWidth="2" strokeDasharray="3 4" />
            <polygon points="50,44 56,50 50,56 44,50" fill={isUnlocked ? highlight : strokeColor} />
          </g>
        );

      case "badge-sniper-90": // Alta Precisão: retículo ótico militar com diamante central
        return (
          <g>
            <circle cx="50" cy="50" r="24" fill="none" stroke={strokeColor} strokeWidth="3" />
            <circle cx="50" cy="50" r="12" fill="none" stroke={fillColor} strokeWidth="2" />
            <line x1="50" y1="20" x2="50" y2="80" stroke={isUnlocked ? highlight : strokeColor} strokeWidth="2" />
            <line x1="20" y1="50" x2="80" y2="50" stroke={isUnlocked ? highlight : strokeColor} strokeWidth="2" />
            <line x1="46" y1="36" x2="54" y2="36" stroke={fillColor} strokeWidth="1.5" />
            <line x1="46" y1="64" x2="54" y2="64" stroke={fillColor} strokeWidth="1.5" />
            <line x1="36" y1="46" x2="36" y2="54" stroke={fillColor} strokeWidth="1.5" />
            <line x1="64" y1="46" x2="64" y2="54" stroke={fillColor} strokeWidth="1.5" />
            <circle cx="50" cy="50" r="3.5" fill={isUnlocked ? highlight : fillColor} />
          </g>
        );

      // 4. DISCIPLINAS
      case "badge-disc-1": // Primeira Conclusão: coluna monolítica com pedestal e capitel
        return (
          <g>
            <rect x="36" y="68" width="28" height="6" rx="1.5" fill={strokeColor} />
            <rect x="40" y="64" width="20" height="4" fill={strokeColor} />
            <rect x="43" y="32" width="14" height="32" rx="1" fill={fillColor} />
            <line x1="47" y1="34" x2="47" y2="62" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="53" y1="34" x2="53" y2="62" stroke={strokeColor} strokeWidth="1.5" />
            <rect x="40" y="28" width="20" height="4" fill={strokeColor} />
            <polygon points="50,18 64,28 36,28" fill={isUnlocked ? highlight : strokeColor} />
          </g>
        );

      case "badge-disc-3": // Base Ampliada: tríptico com 3 pilares conectados
        return (
          <g>
            <rect x="26" y="68" width="48" height="5" rx="1.5" fill={strokeColor} />
            <rect x="30" y="34" width="9" height="34" rx="1" fill={strokeColor} />
            <rect x="45.5" y="30" width="9" height="38" rx="1" fill={fillColor} />
            <rect x="61" y="34" width="9" height="34" rx="1" fill={strokeColor} />
            <rect x="26" y="26" width="48" height="5" rx="1.5" fill={strokeColor} />
            <polygon points="50,16 68,26 32,26" fill={isUnlocked ? highlight : strokeColor} />
          </g>
        );

      case "badge-disc-5": // Conhecimento Ampliado: prisma pentagonal com facetas radiantes
        return (
          <g>
            <polygon points="50,22 74,38 65,68 35,68 26,38" fill="none" stroke={strokeColor} strokeWidth="3" />
            <line x1="50" y1="22" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" />
            <line x1="74" y1="38" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" />
            <line x1="65" y1="68" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" />
            <line x1="35" y1="68" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" />
            <line x1="26" y1="38" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" />
            <circle cx="50" cy="48" r="5" fill={isUnlocked ? highlight : fillColor} />
          </g>
        );

      // 5. TEMPO
      case "badge-hours-1": // Primeira Hora: mostrador de 60 min marcando 1 hora
        return (
          <g>
            <circle cx="50" cy="50" r="22" fill="none" stroke={strokeColor} strokeWidth="3" />
            <line x1="50" y1="28" x2="50" y2="32" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="72" y1="50" x2="68" y2="50" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="50" y1="72" x2="50" y2="68" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="28" y1="50" x2="32" y2="50" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="50" y1="50" x2="50" y2="34" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="50" x2="60" y2="44" stroke={isUnlocked ? highlight : strokeColor} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="4.5" fill={isUnlocked ? highlight : strokeColor} />
          </g>
        );

      case "badge-hours-10": // Tempo de Prática: cronômetro com arco de 10h destacado
        return (
          <g>
            <circle cx="50" cy="52" r="21" fill="none" stroke={strokeColor} strokeWidth="3" />
            <rect x="47" y="24" width="6" height="5" rx="1.5" fill={strokeColor} />
            <path
              d="M50 31 A21 21 0 0 1 71 52"
              fill="none"
              stroke={fillColor}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line x1="50" y1="52" x2="64" y2="40" stroke={isUnlocked ? highlight : strokeColor} strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="52" r="4" fill={isUnlocked ? highlight : strokeColor} />
          </g>
        );

      case "badge-hours-25": // Rotina Consolidada: ampulheta com fluxo contínuo de tempo
        return (
          <g>
            <path
              d="M34 28 L66 28 L54 48 L66 68 L34 68 L46 48 Z"
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M42 34 L58 34 L50 46 Z" fill={fillColor} />
            <polygon points="50,54 58,64 42,64" fill={isUnlocked ? highlight : fillColor} />
            <line x1="50" y1="46" x2="50" y2="54" stroke={isUnlocked ? highlight : strokeColor} strokeWidth="2" strokeDasharray="1 2" />
          </g>
        );

      case "badge-hours-50": // Dedicação: cronômetro solar com 8 raios de constância
        return (
          <g>
            <circle cx="50" cy="50" r="16" fill="none" stroke={strokeColor} strokeWidth="3" />
            <circle cx="50" cy="50" r="6" fill={isUnlocked ? highlight : fillColor} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1="50"
                y1="25"
                x2="50"
                y2="20"
                stroke={isUnlocked ? highlight : strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
          </g>
        );

      // 6. REVISÕES
      case "badge-rev-1": // Primeira Revisão: seta circular contínua com nó de retenção
        return (
          <g>
            <path
              d="M50 28 A20 20 0 1 1 30 50"
              fill="none"
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <polygon points="26,44 32,54 38,46" fill={isUnlocked ? highlight : strokeColor} />
            <circle cx="50" cy="50" r="7" fill={fillColor} />
            <path d="M47 50 L49.5 52.5 L53.5 48" fill="none" stroke={isUnlocked ? "#041F1C" : "#0F172A"} strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case "badge-rev-10": // Ciclo de Revisão: órbita tríplice de repetição espaçada
        return (
          <g>
            <circle cx="50" cy="50" r="20" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="4 4" />
            <circle cx="50" cy="30" r="5" fill={fillColor} />
            <circle cx="67" cy="60" r="5" fill={fillColor} />
            <circle cx="33" cy="60" r="5" fill={fillColor} />
            <path
              d="M50 35 L64 56 L36 56 Z"
              fill="none"
              stroke={isUnlocked ? highlight : strokeColor}
              strokeWidth="2"
            />
            <circle cx="50" cy="50" r="3" fill={isUnlocked ? highlight : strokeColor} />
          </g>
        );

      // 7. SIMULADOS
      case "badge-sim-1": // Primeiro Simulado: brasão com documento e selo estrela
        return (
          <g>
            <polygon points="50,22 72,30 72,58 50,74 28,58 28,30" fill="none" stroke={strokeColor} strokeWidth="3" />
            <line x1="38" y1="40" x2="62" y2="40" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="38" y1="48" x2="62" y2="48" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <polygon
              points="50,54 52,60 58,60 53,64 55,70 50,66 45,70 47,64 42,60 48,60"
              fill={isUnlocked ? highlight : fillColor}
            />
          </g>
        );

      default:
        return (
          <g>
            <circle cx="50" cy="50" r="16" fill="none" stroke={strokeColor} strokeWidth="3" />
            <circle cx="50" cy="50" r="6" fill={fillColor} />
          </g>
        );
    }
  };

  // Distinct outer framing silhouette based on achievement category
  const renderFramingSilhouette = () => {
    // 1. Progress / General: Reeded coin rim with 16 precision notches
    if (category === "progresso" || category === "edital") {
      return (
        <g>
          {/* Milled coin edge notches */}
          {[...Array(16)].map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="6"
              x2="50"
              y2="9"
              stroke={isUnlocked ? palette.rimInner : "#334155"}
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${i * 22.5} 50 50)`}
            />
          ))}
          {/* Outer circle */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill={isUnlocked ? `url(#unlockedFace-${badgeId})` : `url(#lockedFace-${badgeId})`}
            stroke={isUnlocked ? `url(#unlockedRim-${badgeId})` : isInProgress ? "#475569" : "#334155"}
            strokeWidth={isUnlocked ? "3" : "2"}
          />
          {/* Inner groove */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={isUnlocked ? palette.rimInner : isInProgress ? "#334155" : "#1E293B"}
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
        </g>
      );
    }

    // 2. Questões: Octagonal cut coin
    if (category === "questoes") {
      return (
        <g>
          <polygon
            points="50,6 81,19 94,50 81,81 50,94 19,81 6,50 19,19"
            fill={isUnlocked ? `url(#unlockedFace-${badgeId})` : `url(#lockedFace-${badgeId})`}
            stroke={isUnlocked ? `url(#unlockedRim-${badgeId})` : isInProgress ? "#475569" : "#334155"}
            strokeWidth={isUnlocked ? "3" : "2"}
            strokeLinejoin="round"
          />
          <polygon
            points="50,12 77,23 88,50 77,77 50,88 23,77 12,50 23,23"
            fill="none"
            stroke={isUnlocked ? palette.rimInner : isInProgress ? "#334155" : "#1E293B"}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeOpacity="0.7"
          />
        </g>
      );
    }

    // 3. Precisão: Precision Reticle dial with 4 extended caliper lugs
    if (category === "precisao") {
      return (
        <g>
          {/* Caliper ticks */}
          <line x1="50" y1="4" x2="50" y2="10" stroke={isUnlocked ? palette.accent : "#475569"} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="90" x2="50" y2="96" stroke={isUnlocked ? palette.accent : "#475569"} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="4" y1="50" x2="10" y2="50" stroke={isUnlocked ? palette.accent : "#475569"} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="90" y1="50" x2="96" y2="50" stroke={isUnlocked ? palette.accent : "#475569"} strokeWidth="2.5" strokeLinecap="round" />
          <circle
            cx="50"
            cy="50"
            r="43"
            fill={isUnlocked ? `url(#unlockedFace-${badgeId})` : `url(#lockedFace-${badgeId})`}
            stroke={isUnlocked ? `url(#unlockedRim-${badgeId})` : isInProgress ? "#475569" : "#334155"}
            strokeWidth={isUnlocked ? "3" : "2"}
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={isUnlocked ? palette.rimInner : isInProgress ? "#334155" : "#1E293B"}
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeOpacity="0.8"
          />
        </g>
      );
    }

    // 4. Disciplinas: Hexagonal prism
    if (category === "disciplinas") {
      return (
        <g>
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            fill={isUnlocked ? `url(#unlockedFace-${badgeId})` : `url(#lockedFace-${badgeId})`}
            stroke={isUnlocked ? `url(#unlockedRim-${badgeId})` : isInProgress ? "#475569" : "#334155"}
            strokeWidth={isUnlocked ? "3" : "2"}
            strokeLinejoin="round"
          />
          <polygon
            points="50,13 82,31 82,69 50,87 18,69 18,31"
            fill="none"
            stroke={isUnlocked ? palette.rimInner : isInProgress ? "#334155" : "#1E293B"}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeOpacity="0.7"
          />
        </g>
      );
    }

    // 5. Tempo: Chronometer bezel with knurled crown
    if (category === "tempo") {
      return (
        <g>
          {/* Top crown */}
          <rect x="46" y="2" width="8" height="5" rx="1.5" fill={isUnlocked ? palette.rimOuter : "#475569"} />
          <circle
            cx="50"
            cy="50"
            r="43"
            fill={isUnlocked ? `url(#unlockedFace-${badgeId})` : `url(#lockedFace-${badgeId})`}
            stroke={isUnlocked ? `url(#unlockedRim-${badgeId})` : isInProgress ? "#475569" : "#334155"}
            strokeWidth={isUnlocked ? "3" : "2"}
          />
          {/* 12 hour notches around bezel */}
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="9"
              x2="50"
              y2="12"
              stroke={isUnlocked ? palette.accent : "#475569"}
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
          <circle
            cx="50"
            cy="50"
            r="37"
            fill="none"
            stroke={isUnlocked ? palette.rimInner : isInProgress ? "#334155" : "#1E293B"}
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
        </g>
      );
    }

    // 6. Revisões: Orbital loop bands
    if (category === "revisoes") {
      return (
        <g>
          <ellipse
            cx="50"
            cy="50"
            rx="46"
            ry="46"
            fill="none"
            stroke={isUnlocked ? palette.rimInner : "#334155"}
            strokeWidth="1"
            strokeDasharray="6 6"
          />
          <circle
            cx="50"
            cy="50"
            r="43"
            fill={isUnlocked ? `url(#unlockedFace-${badgeId})` : `url(#lockedFace-${badgeId})`}
            stroke={isUnlocked ? `url(#unlockedRim-${badgeId})` : isInProgress ? "#475569" : "#334155"}
            strokeWidth={isUnlocked ? "3" : "2"}
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={isUnlocked ? palette.rimInner : isInProgress ? "#334155" : "#1E293B"}
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
        </g>
      );
    }

    // 7. Simulados: Heraldic Shield
    if (category === "simulados") {
      return (
        <g>
          <polygon
            points="50,6 88,20 80,74 50,94 20,74 12,20"
            fill={isUnlocked ? `url(#unlockedFace-${badgeId})` : `url(#lockedFace-${badgeId})`}
            stroke={isUnlocked ? `url(#unlockedRim-${badgeId})` : isInProgress ? "#475569" : "#334155"}
            strokeWidth={isUnlocked ? "3" : "2"}
            strokeLinejoin="round"
          />
          <polygon
            points="50,13 81,25 74,70 50,87 26,70 19,25"
            fill="none"
            stroke={isUnlocked ? palette.rimInner : isInProgress ? "#334155" : "#1E293B"}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeOpacity="0.7"
          />
        </g>
      );
    }

    // Fallback circle
    return (
      <g>
        <circle
          cx="50"
          cy="50"
          r="44"
          fill={isUnlocked ? `url(#unlockedFace-${badgeId})` : `url(#lockedFace-${badgeId})`}
          stroke={isUnlocked ? `url(#unlockedRim-${badgeId})` : isInProgress ? "#475569" : "#334155"}
          strokeWidth={isUnlocked ? "3" : "2"}
        />
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke={isUnlocked ? palette.rimInner : isInProgress ? "#334155" : "#1E293B"}
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />
      </g>
    );
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible transition-transform duration-200"
      >
        <defs>
          {/* Unlocked Rim Gradient */}
          <linearGradient id={`unlockedRim-${badgeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.accentLight} />
            <stop offset="45%" stopColor={palette.rimOuter} />
            <stop offset="100%" stopColor={palette.rimInner} />
          </linearGradient>

          {/* Unlocked Face Radial Gradient */}
          <radialGradient id={`unlockedFace-${badgeId}`} cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor={palette.faceFrom} />
            <stop offset="100%" stopColor={palette.faceTo} />
          </radialGradient>

          {/* Locked Face Neutral Brushed Metallic Finish */}
          <radialGradient id={`lockedFace-${badgeId}`} cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="60%" stopColor="#141D2B" />
            <stop offset="100%" stopColor="#0B0F17" />
          </radialGradient>

          {/* In-Progress Track Ring Gradient */}
          <linearGradient id={`progressRim-${badgeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FFB300" />
          </linearGradient>

          {/* Specular Sheen Highlight */}
          <linearGradient id={`sheen-${badgeId}`} x1="0%" y1="0%" x2="50%" y2="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Halo Glow for Unlocked Medals (Discrete & Controlled) */}
        {isUnlocked && (
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke={palette.glow}
            strokeWidth="3"
            className="blur-xs"
          />
        )}

        {/* In-progress Background Track Ring */}
        {isInProgress && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="3"
          />
        )}

        {/* Tailored Category Framing Silhouette */}
        {renderFramingSilhouette()}

        {/* Circular Progress Indicator Arc for In-Progress State */}
        {isInProgress && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={`url(#progressRim-${badgeId})`}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
        )}

        {/* Tailored Central Vector Emblem */}
        <g id={`emblem-${badgeId}`}>
          {renderEmblem()}
        </g>

        {/* Specular Light Sweep (unlocked only) */}
        {isUnlocked && (
          <path
            d="M18 36 A44 44 0 0 1 64 12 C52 24 32 32 18 36 Z"
            fill={`url(#sheen-${badgeId})`}
            pointerEvents="none"
          />
        )}
      </svg>

      {/* Checkmark Status Badge in Corner for Unlocked Medals */}
      {isUnlocked && showCheckBadge && (
        <div
          className="absolute rounded-full flex items-center justify-center font-bold text-white shadow-xs bg-emerald-500 ring-2 ring-white dark:ring-[#0F172A]"
          style={{
            bottom: checkOffset,
            right: checkOffset,
            width: checkSize,
            height: checkSize,
            fontSize: Math.max(8, Math.round(checkSize * 0.58)),
          }}
          title="Desbloqueada"
        >
          ✓
        </div>
      )}
    </div>
  );
};
