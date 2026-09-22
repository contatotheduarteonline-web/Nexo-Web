import React from "react";

// ============================================================================
// 1. ÍCONE 3D DE RELÓGIO (TEMPO DE ESTUDO)
// Analógico-digital com anel metálico escovado, chanfro dimensional e visor LCD
// ============================================================================
export const IconClock3D: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 48,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-md transition-transform duration-300 group-hover:scale-105 ${className}`}
  >
    <defs>
      {/* Sombra de profundidade do relógio */}
      <radialGradient id="clockDropShadow" cx="50%" cy="50%" r="50%">
        <stop offset="60%" stopColor="#0F172A" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
      </radialGradient>
      {/* Anel exterior chanfrado de metal */}
      <linearGradient id="clockBezel" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="25%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="75%" stopColor="#C2410C" />
        <stop offset="100%" stopColor="#7C2D12" />
      </linearGradient>
      {/* Borda interna com brilho de aço */}
      <linearGradient id="clockRim" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="40%" stopColor="#FCD34D" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#9A3412" stopOpacity="0.8" />
      </linearGradient>
      {/* Mostrador principal profundo */}
      <radialGradient id="clockDial" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="55%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#FED7AA" />
      </radialGradient>
      {/* Reflexo de vidro cristalino */}
      <linearGradient id="clockGlass" x1="18" y1="16" x2="46" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
        <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      {/* Mostrador digital LCD no centro inferior */}
      <linearGradient id="clockLcd" x1="24" y1="36" x2="40" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>

    {/* Sombra base */}
    <ellipse cx="32" cy="56" rx="22" ry="4" fill="url(#clockDropShadow)" />

    {/* Coroa do relógio (botão superior) */}
    <rect x="29" y="4" width="6" height="5" rx="1.5" fill="#C2410C" />
    <rect x="30" y="5" width="4" height="3" rx="1" fill="#FCD34D" />

    {/* Caixa e Bezel de Metal */}
    <circle cx="32" cy="32" r="24" fill="url(#clockBezel)" />
    <circle cx="32" cy="32" r="21.5" fill="url(#clockRim)" />
    <circle cx="32" cy="32" r="19" fill="url(#clockDial)" />

    {/* Marcadores de hora (12, 3, 6, 9) */}
    <rect x="31" y="16" width="2" height="4" rx="1" fill="#C2410C" />
    <rect x="31" y="44" width="2" height="4" rx="1" fill="#C2410C" />
    <rect x="44" y="31" width="4" height="2" rx="1" fill="#C2410C" />
    <rect x="16" y="31" width="4" height="2" rx="1" fill="#C2410C" />

    {/* Pontos intermediários */}
    <circle cx="41.2" cy="22.8" r="1" fill="#D97706" opacity="0.6" />
    <circle cx="41.2" cy="41.2" r="1" fill="#D97706" opacity="0.6" />
    <circle cx="22.8" cy="41.2" r="1" fill="#D97706" opacity="0.6" />
    <circle cx="22.8" cy="22.8" r="1" fill="#D97706" opacity="0.6" />

    {/* Mini visor digital secundário (LCD) */}
    <rect x="24" y="37" width="16" height="6.5" rx="2" fill="url(#clockLcd)" stroke="#C2410C" strokeWidth="0.5" />
    <text x="32" y="42" textAnchor="middle" fill="#F59E0B" fontSize="4.5" fontFamily="monospace" fontWeight="bold">00:00</text>

    {/* Ponteiro de Horas */}
    <path d="M32 32 L38 27" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
    {/* Ponteiro de Minutos */}
    <path d="M32 32 L32 20" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
    {/* Ponteiro de Segundos (Laranja Queimado Vibrante) */}
    <path d="M32 34 L32 17" stroke="#D97706" strokeWidth="0.9" strokeLinecap="round" />

    {/* Ponto pivô central metálico */}
    <circle cx="32" cy="32" r="2.8" fill="#FCD34D" stroke="#7C2D12" strokeWidth="1" />
    <circle cx="32" cy="32" r="1" fill="#FFFFFF" />

    {/* Brilho de vidro curvo (Glare 3D) */}
    <path
      d="M17 26 C17 19 23 15 32 15 C39 15 45 18 47 23 C42 20 33 21 26 25 C21 28 18 33 17 26 Z"
      fill="url(#clockGlass)"
    />
  </svg>
);

// ============================================================================
// 2. ÍCONE 3D DE PRANCHETA & CANETA (QUESTÕES)
// Prancheta chanfrada, clipe metálico cromado, folha com relevo e caneta 3D
// ============================================================================
export const IconClipboard3D: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 48,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-md transition-transform duration-300 group-hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="boardGrad" x1="14" y1="10" x2="46" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="35%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="paperGrad" x1="18" y1="14" x2="42" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="80%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <linearGradient id="clipMetal" x1="24" y1="6" x2="36" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="40%" stopColor="#CBD5E1" />
        <stop offset="70%" stopColor="#64748B" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="penBody" x1="42" y1="26" x2="56" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#9A3412" />
      </linearGradient>
      <linearGradient id="penTip" x1="39" y1="44" x2="44" y2="49" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
    </defs>

    {/* Sombra projetada */}
    <rect x="14" y="14" width="34" height="44" rx="6" fill="#0F172A" fillOpacity="0.15" />

    {/* Tabuleiro da prancheta */}
    <rect x="12" y="10" width="34" height="44" rx="6" fill="url(#boardGrad)" />
    <rect x="13" y="11" width="32" height="42" rx="5" stroke="#93C5FD" strokeOpacity="0.4" strokeWidth="0.8" />

    {/* Folha de papel destacada */}
    <rect x="16" y="16" width="26" height="34" rx="3.5" fill="url(#paperGrad)" />
    
    {/* Linhas da folha */}
    <line x1="20" y1="24" x2="36" y2="24" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="20" y1="29" x2="34" y2="29" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="34" x2="36" y2="34" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="39" x2="30" y2="39" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />

    {/* Checkmark verde de questão respondida */}
    <circle cx="21" cy="44" r="2.5" fill="#10B981" />
    <path d="M19.8 44 L20.7 44.9 L22.3 43.3" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />

    {/* Clipe metálico de fixação */}
    <path d="M22 10 C22 7.5 25 5 30 5 C35 5 38 7.5 38 10 Z" fill="url(#clipMetal)" />
    <rect x="23" y="9" width="14" height="5" rx="1.5" fill="url(#clipMetal)" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="0.5" />
    <circle cx="30" cy="8" r="1.5" fill="#1E293B" />

    {/* Caneta 3D inclinada (em primeiro plano) */}
    <g transform="rotate(25 48 38)">
      {/* Sombra da caneta */}
      <rect x="44" y="24" width="4.5" height="22" rx="2" fill="#0F172A" fillOpacity="0.25" />
      {/* Corpo da caneta */}
      <rect x="43" y="22" width="4.5" height="22" rx="2" fill="url(#penBody)" stroke="#FED7AA" strokeWidth="0.5" />
      {/* Anel cromado central */}
      <rect x="43" y="30" width="4.5" height="1.8" fill="#F8FAFC" />
      {/* Clipe da caneta */}
      <rect x="41.5" y="24" width="1.5" height="8" rx="0.5" fill="#F8FAFC" />
      {/* Ponta metálica */}
      <path d="M43 44 L45.25 49 L47.5 44 Z" fill="url(#penTip)" />
      <circle cx="45.25" cy="49" r="0.6" fill="#1E293B" />
    </g>
  </svg>
);

// ============================================================================
// 3. ÍCONE 3D DE ALVO & DARDO (PRECISÃO)
// Multi-anéis concêntricos (ouro, verde-água vibrante, rubi) com dardo no centro
// ============================================================================
export const IconTarget3D: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 48,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-md transition-transform duration-300 group-hover:scale-105 ${className}`}
  >
    <defs>
      {/* Anel Externo Dourado Esculpido */}
      <linearGradient id="targetRingGold" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="40%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
      {/* Anel Médio Verde-Água Vibrante */}
      <radialGradient id="targetRingTeal" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#2DD4BF" />
        <stop offset="60%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#0F766E" />
      </radialGradient>
      {/* Anel Claro de Contraste */}
      <linearGradient id="targetRingWhite" x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#CCFBF1" />
      </linearGradient>
      {/* Centro / Bullseye Rubi */}
      <radialGradient id="targetBullseye" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#F87171" />
        <stop offset="45%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#991B1B" />
      </radialGradient>
      {/* Gradiente da haste do dardo */}
      <linearGradient id="dartShaft" x1="32" y1="10" x2="46" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#9A3412" />
      </linearGradient>
      {/* Aletas do dardo */}
      <linearGradient id="dartFlights" x1="42" y1="6" x2="54" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>

    {/* Sombra projetada do alvo 3D */}
    <ellipse cx="32" cy="56" rx="20" ry="4" fill="#0F172A" fillOpacity="0.2" />

    {/* Anel 1: Borda Chanfrada Dourada */}
    <circle cx="32" cy="32" r="23" fill="url(#targetRingGold)" />
    <circle cx="32" cy="32" r="21" fill="url(#targetRingTeal)" />

    {/* Anel 2: Branco Pérola */}
    <circle cx="32" cy="32" r="16" fill="url(#targetRingWhite)" />

    {/* Anel 3: Verde-Água Escuro */}
    <circle cx="32" cy="32" r="11" fill="url(#targetRingTeal)" />

    {/* Anel 4: Centro Vermelho Rubi (Bullseye) */}
    <circle cx="32" cy="32" r="6.5" fill="url(#targetBullseye)" />
    <circle cx="32" cy="32" r="2" fill="#FEF08A" />

    {/* Brilho esférico translúcido no alvo */}
    <path
      d="M16 26 C17 18 24 14 32 14 C38 14 43 17 46 22 C41 18 33 19 25 24 C20 27 17 31 16 26 Z"
      fill="#FFFFFF"
      fillOpacity="0.45"
    />

    {/* Dardo cravado no centro exato (em perspectiva) */}
    <g>
      {/* Haste do dardo projetando-se para o canto superior direito */}
      <line x1="32" y1="32" x2="48" y2="16" stroke="url(#dartShaft)" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="32" x2="34" y2="30" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Barrilete / Grip do dardo */}
      <circle cx="38" cy="26" r="2.2" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.5" />
      <circle cx="43" cy="21" r="2.2" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.5" />

      {/* Aletas da cauda do dardo (4 pontas 3D) */}
      <path d="M48 16 L54 10 L52 16 L56 18 Z" fill="url(#dartFlights)" />
      <path d="M48 16 L44 8 L49 13 Z" fill="#0284C7" />
      <path d="M48 16 L54 10" stroke="#FFFFFF" strokeWidth="0.8" />
    </g>
  </svg>
);

// ============================================================================
// 4. ÍCONE 3D DE PROGRESSO NO EDITAL (TIMELINE / BARRAS 3D)
// Pilares em relevo tridimensional, curva ascendente e esfera de marco luminoso
// ============================================================================
export const IconTimeline3D: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 48,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-md transition-transform duration-300 group-hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="bar1" x1="14" y1="46" x2="22" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
      <linearGradient id="bar2" x1="26" y1="46" x2="34" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="bar3" x1="38" y1="46" x2="46" y2="14" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      <linearGradient id="trendCurve" x1="16" y1="36" x2="48" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <radialGradient id="sphereGlow" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#D97706" />
      </radialGradient>
    </defs>

    {/* Base elíptica de sustentação */}
    <ellipse cx="32" cy="50" rx="22" ry="5" fill="#0F172A" fillOpacity="0.15" />

    {/* Pilar 1 (Início) */}
    <rect x="15" y="36" width="8" height="14" rx="2.5" fill="url(#bar1)" />
    <path d="M15 38 L19 35 L23 38 L19 40 Z" fill="#FED7AA" />

    {/* Pilar 2 (Intermediário) */}
    <rect x="27" y="26" width="8" height="24" rx="2.5" fill="url(#bar2)" />
    <path d="M27 28 L31 25 L35 28 L31 30 Z" fill="#FCD34D" />

    {/* Pilar 3 (Conquista / Topo) */}
    <rect x="39" y="16" width="8" height="34" rx="2.5" fill="url(#bar3)" />
    <path d="M39 18 L43 15 L47 18 L43 20 Z" fill="#FBBF24" />

    {/* Linha da trajetória ascendente neon com halo */}
    <path
      d="M15 36 Q 28 26 44 14"
      stroke="#FDE047"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.35"
    />
    <path
      d="M15 36 Q 28 26 44 14"
      stroke="url(#trendCurve)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Esfera luminosa no topo do gráfico */}
    <circle cx="44" cy="14" r="5" fill="url(#sphereGlow)" stroke="#FFFFFF" strokeWidth="1" />
    <circle cx="43" cy="12.5" r="1.5" fill="#FFFFFF" />
  </svg>
);

// ============================================================================
// 5. ÍCONE 3D PARA HISTÓRIA DE RORAIMA
// Pergaminho antigo enrolado, pena clássica de escrever dourada e selo de cera
// ============================================================================
export const IconScrollHistory3D: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 48,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-md transition-transform duration-300 group-hover:scale-105 ${className}`}
  >
    <defs>
      <linearGradient id="scrollPaper" x1="14" y1="12" x2="46" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="50%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="quillGold" x1="30" y1="8" x2="52" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="35%" stopColor="#FDE047" />
        <stop offset="70%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <radialGradient id="waxSeal" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#F87171" />
        <stop offset="50%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </radialGradient>
    </defs>

    {/* Sombra base */}
    <ellipse cx="30" cy="52" rx="20" ry="4" fill="#0F172A" fillOpacity="0.2" />

    {/* Pergaminho Aberto */}
    <path
      d="M14 16 C14 12 18 10 24 11 L42 14 C46 15 48 18 48 22 L46 46 C46 50 42 52 36 51 L18 48 C14 47 14 44 14 40 Z"
      fill="url(#scrollPaper)"
      stroke="#D97706"
      strokeWidth="0.8"
    />

    {/* Rolos superiores e inferiores */}
    <ellipse cx="20" cy="12" rx="6" ry="2.5" fill="#D97706" />
    <ellipse cx="40" cy="49" rx="6" ry="2.5" fill="#B45309" />

    {/* Linhas de caligrafia antiga no pergaminho */}
    <path d="M20 22 Q 28 21 38 23" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M20 28 Q 29 27 40 29" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M20 34 Q 27 33 36 35" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

    {/* Selo de Cera Vermelho Imperial no canto inferior */}
    <circle cx="25" cy="43" r="5.5" fill="url(#waxSeal)" stroke="#991B1B" strokeWidth="0.8" />
    <circle cx="25" cy="43" r="3.2" fill="none" stroke="#FEE2E2" strokeWidth="0.8" opacity="0.8" />

    {/* Pena de Escrever Dourada (Quill) */}
    <g>
      {/* Corpo da Pena */}
      <path
        d="M52 8 C52 8 46 16 42 26 C40 31 38 38 37 44 L36 46 L38 43 C42 35 48 24 53 14 C55 10 54 8 52 8 Z"
        fill="url(#quillGold)"
      />
      {/* Ranhuras aerodinâmicas da pena */}
      <line x1="48" y1="14" x2="43" y2="18" stroke="#78350F" strokeWidth="0.8" />
      <line x1="45" y1="21" x2="40" y2="24" stroke="#78350F" strokeWidth="0.8" />
      <line x1="42" y1="29" x2="38" y2="31" stroke="#78350F" strokeWidth="0.8" />
      {/* Ponta da pena de metal escuro */}
      <polygon points="36,46 38,43 35,47" fill="#1E293B" />
    </g>
  </svg>
);

// ============================================================================
// 6. ÍCONE 3D PARA GEOGRAFIA DE RORAIMA
// Globo terrestre dimensional esférico com meridianos e bússola náutica de latão
// ============================================================================
export const IconGlobeGeography3D: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 48,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-md transition-transform duration-300 group-hover:scale-105 ${className}`}
  >
    <defs>
      {/* Oceano 3D azul profundo */}
      <radialGradient id="globeOcean" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="50%" stopColor="#2563EB" />
        <stop offset="90%" stopColor="#1E3A8A" />
        <stop offset="100%" stopColor="#0F172A" />
      </radialGradient>
      {/* Continentes esmeralda vibrante */}
      <linearGradient id="globeLand" x1="16" y1="16" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#86EFAC" />
        <stop offset="60%" stopColor="#22C55E" />
        <stop offset="100%" stopColor="#15803D" />
      </linearGradient>
      {/* Bússola e Suporte de Latão Metálico */}
      <linearGradient id="brassSupport" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="40%" stopColor="#EAB308" />
        <stop offset="80%" stopColor="#A16207" />
        <stop offset="100%" stopColor="#713F12" />
      </linearGradient>
    </defs>

    {/* Sombra base */}
    <ellipse cx="32" cy="56" rx="18" ry="4" fill="#0F172A" fillOpacity="0.2" />

    {/* Base e Pedestal do Globo */}
    <ellipse cx="32" cy="54" rx="12" ry="3.5" fill="url(#brassSupport)" />
    <rect x="30.5" y="44" width="3" height="9" fill="url(#brassSupport)" />

    {/* Arco Semi-meridiano de Latão (Suporte externo) */}
    <path
      d="M17 30 C17 18 25 10 37 10"
      stroke="url(#brassSupport)"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <path
      d="M17 30 C17 42 25 48 37 48"
      stroke="url(#brassSupport)"
      strokeWidth="3.2"
      strokeLinecap="round"
    />

    {/* Esfera do Globo */}
    <circle cx="32" cy="28" r="16" fill="url(#globeOcean)" />

    {/* Silhueta dos Continentes (América do Sul / Roraima) */}
    <path
      d="M26 19 C28 17 32 18 34 20 C36 22 35 25 33 28 C32 31 34 35 32 38 C30 40 28 36 27 33 C25 30 24 24 26 19 Z"
      fill="url(#globeLand)"
      opacity="0.95"
    />
    {/* Ponto focal Roraima (Norte do Brasil) */}
    <circle cx="31" cy="23" r="1.8" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="0.6" />

    {/* Meridianos e Paralelos sutis */}
    <ellipse cx="32" cy="28" rx="8" ry="15.5" fill="none" stroke="#93C5FD" strokeWidth="0.7" opacity="0.4" />
    <line x1="16" y1="28" x2="48" y2="28" stroke="#93C5FD" strokeWidth="0.7" opacity="0.4" />

    {/* Reflexo de Luz Esférica 3D */}
    <path
      d="M20 22 C21 16 26 13 32 13 C36 13 39 15 41 18 C37 15 31 16 25 20 C22 22 21 26 20 22 Z"
      fill="#FFFFFF"
      fillOpacity="0.5"
    />

    {/* Rosa dos Ventos / Bússola sobreposta no canto inferior direito */}
    <g transform="translate(38, 34) scale(0.42)">
      <circle cx="20" cy="20" r="18" fill="#0F172A" stroke="url(#brassSupport)" strokeWidth="3" />
      <polygon points="20,5 24,18 20,15 16,18" fill="#EF4444" />
      <polygon points="20,35 24,22 20,25 16,22" fill="#E2E8F0" />
      <polygon points="35,20 22,24 25,20 22,16" fill="#CBD5E1" />
      <polygon points="5,20 18,24 15,20 18,16" fill="#CBD5E1" />
      <circle cx="20" cy="20" r="2.5" fill="#EAB308" />
    </g>
  </svg>
);

// ============================================================================
// 7. BRASÃO DE NÍVEL / XP (APRENDIZ)
// Brasão heráldico dourado com acabamento dimensional e monograma 'A'
// ============================================================================
export const IconApprenticeBadge: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 18,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id="badgeGold" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    {/* Escudo Heráldico */}
    <path
      d="M12 2 L4 5 V11 C4 16.5 7.4 20.8 12 22 C16.6 20.8 20 16.5 20 11 V5 L12 2 Z"
      fill="url(#badgeGold)"
      stroke="#78350F"
      strokeWidth="1"
    />
    <path
      d="M12 3.8 L5.8 6.2 V11 C5.8 15.4 8.5 19 12 20.2 C15.5 19 18.2 15.4 18.2 11 V6.2 L12 3.8 Z"
      fill="#451A03"
    />
    {/* Monograma 'A' de Aprendiz */}
    <text
      x="12"
      y="14.5"
      textAnchor="middle"
      fill="#FDE047"
      fontSize="9.5"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
    >
      A
    </text>
  </svg>
);

// ============================================================================
// 8. ANEL DE METAL PRECIOSO COM LEDS (REVISÕES)
// Anel chanfrado circular com marcadores de luz embutidos e núcleo vítreo
// ============================================================================
export const IconReviewPreciousRing: React.FC<{
  className?: string;
  size?: number;
  progressPercent?: number;
}> = ({ className = "", size = 68, progressPercent = 100 }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="ringGoldMetal" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <radialGradient id="ringCoreGlow" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="60%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </radialGradient>
        </defs>

        {/* Trilho de base com ranhura de metal escura */}
        <circle cx="32" cy="32" r={radius} stroke="#1E293B" strokeWidth="5.5" opacity="0.25" />

        {/* Anel de metal com preenchimento */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="url(#ringGoldMetal)"
          strokeWidth="4.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
        />

        {/* LEDs embutidos nos 4 quadrantes */}
        <circle cx="32" cy="8" r="1.8" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.6" className="animate-pulse" />
        <circle cx="56" cy="32" r="1.8" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.6" />
        <circle cx="32" cy="56" r="1.8" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.6" />
        <circle cx="8" cy="32" r="1.8" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.6" />

        {/* Núcleo esmeralda vítreo */}
        <circle cx="32" cy="32" r="15" fill="url(#ringCoreGlow)" />
        <circle cx="32" cy="32" r="13" stroke="#A7F3D0" strokeWidth="0.8" opacity="0.6" />
      </svg>

      {/* Ícone central de repetição / checkmark */}
      <div className="absolute flex items-center justify-center text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </div>
  );
};
