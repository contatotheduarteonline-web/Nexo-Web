/**
 * Utilitário de gerenciamento de cores distintas para matérias e disciplinas.
 * Garante distribuição automática de cores vivas e exclusivas, sem repetição.
 */

// Paleta curada de alta distinção e contraste (32 cores exclusivas)
export const DISTINCT_DISCIPLINE_COLORS = [
  "#249D84", // Nexo Verde Esmeralda / Teal
  "#3B82F6", // Azul Vibrante
  "#8B5CF6", // Roxo Violeta
  "#EC4899", // Rosa Intenso
  "#F59E0B", // Âmbar / Dourado
  "#10B981", // Verde Menta
  "#06B6D4", // Ciano / Turquesa
  "#F59E0B", // Laranja Quente
  "#6366F1", // Índigo
  "#D946EF", // Fúcsia / Magenta
  "#14B8A6", // Verde Petróleo Claro
  "#EF4444", // Vermelho Coral
  "#84CC16", // Lima / Verde Claro
  "#A855F7", // Roxo Claro
  "#0284C7", // Azul Céu
  "#E11D48", // Rosa Rubi
  "#0D9488", // Teal Profundo
  "#7C3AED", // Violeta Escuro
  "#D97706", // Laranja Queimado
  "#4F46E5", // Índigo Escuro
  "#059669", // Verde Floresta
  "#DB2777", // Rosa Escuro
  "#2563EB", // Azul Real
  "#CA8A04", // Ouro Queimado
  "#9333EA", // Púrpura Elétrico
  "#0891B2", // Azul Ciano Oceano
  "#BE123C", // Vermelho Carmim
  "#4D7C0F", // Verde Oliva
  "#4338CA", // Azul Marinho Índigo
  "#C026D3", // Orquídea
  "#15803D", // Verde Musgo
  "#B45309", // Âmbar Escuro
];

/**
 * Normaliza uma string de cor em formato hexadecimal de 6 dígitos em minúsculo
 */
export function normalizeHex(hex: string): string {
  if (!hex) return "#249D84";
  let clean = hex.trim().toLowerCase();
  if (!clean.startsWith("#")) clean = `#${clean}`;
  if (clean.length === 4) {
    clean = `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return clean;
}

/**
 * Converte HSL para Hex (útil caso ultrapasse a quantidade de cores pré-definidas)
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toLowerCase();
}

/**
 * Verifica se duas cores são visualmente idênticas
 */
export function areColorsEqual(c1: string, c2: string): boolean {
  return normalizeHex(c1) === normalizeHex(c2);
}

/**
 * Retorna a próxima cor disponível que ainda NÃO foi utilizada
 * por nenhuma matéria existente.
 * Métrica:
 * 1. Percorre a paleta de cores distintas predefinidas.
 * 2. Caso todas já tenham sido usadas (>32 matérias), calcula cores pela proporção áurea (Golden Ratio HSL).
 */
export function getNextAvailableDisciplineColor(usedColors: string[]): string {
  const normalizedUsed = new Set(
    usedColors.filter(Boolean).map((c) => normalizeHex(c))
  );

  // 1. Tenta encontrar a primeira cor não usada da paleta padrão
  for (const color of DISTINCT_DISCIPLINE_COLORS) {
    if (!normalizedUsed.has(normalizeHex(color))) {
      return color;
    }
  }

  // 2. Se todas estiverem ocupadas, calcula nova cor única via proporção áurea
  const goldenRatio = 0.618033988749895;
  let hue = 0.35; // base
  for (let i = 0; i < 200; i++) {
    hue = (hue + goldenRatio) % 1;
    const h = Math.round(hue * 360);
    const generated = hslToHex(h, 75, 48);
    if (!normalizedUsed.has(normalizeHex(generated))) {
      return generated;
    }
  }

  return "#249D84";
}

/**
 * Garante que uma lista de matérias receba cores exclusivas sem nenhuma repetição
 */
export function ensureUniqueDisciplineColors<T extends { color?: string }>(
  items: T[]
): T[] {
  const used = new Set<string>();

  return items.map((item) => {
    const currentColor = item.color ? normalizeHex(item.color) : null;
    if (currentColor && !used.has(currentColor)) {
      used.add(currentColor);
      return { ...item, color: currentColor };
    }

    const nextColor = getNextAvailableDisciplineColor(Array.from(used));
    used.add(normalizeHex(nextColor));
    return { ...item, color: nextColor };
  });
}
