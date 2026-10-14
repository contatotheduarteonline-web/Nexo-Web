import { CycleStep, WeeklyScheduleBlock } from "../types";

/**
 * Motor de agendamento do plano — mesma matemática do PlanejamentoWizard
 * (distribuição por importância × (6 − conhecimento), blocos semanais
 * distribuídos entre os dias disponíveis e ciclo intercalado).
 * Usado pelo onboarding para o plano já nascer com o Planejamento preenchido.
 */

export interface ScheduleEngineDiscipline {
  id: string;
  name: string;
  /** Importância/peso para a prova (1–5). */
  importance: number;
  /** Grau de conhecimento (1 = nunca estudei … 5 = muito bom). */
  knowledgeLevel: number;
}

export interface ScheduleEngineInput {
  disciplines: ScheduleEngineDiscipline[];
  /** Horas decimais disponíveis por dia (seg..dom). */
  dailyAvailability: Record<string, number>;
  minSessionMinutes?: number;
  maxSessionMinutes?: number;
}

export interface ScheduleEngineResult {
  cycle: CycleStep[];
  weeklySchedule: WeeklyScheduleBlock[];
  weeklyGoalHours: number;
  /** Percentual de peso por disciplina (mesma exibida na etapa de pesos). */
  weightPercentageByDiscipline: Record<string, number>;
}

const DAY_KEYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;

export function buildPlanSchedule(input: ScheduleEngineInput): ScheduleEngineResult {
  const minSessionLimit = Math.max(1, input.minSessionMinutes || 30);
  const maxSessionLimit = Math.max(minSessionLimit, input.maxSessionMinutes || 90);
  const totalWeeklyMinutes = DAY_KEYS.reduce(
    (acc, day) => acc + (Number(input.dailyAvailability[day]) || 0) * 60,
    0
  );

  const scores = input.disciplines.map((disc) => ({
    disc,
    score: Math.max(1, disc.importance * (6 - disc.knowledgeLevel)),
  }));
  const totalScore = scores.reduce((acc, item) => acc + item.score, 0) || 1;

  const weightPercentageByDiscipline: Record<string, number> = {};
  scores.forEach((item) => {
    weightPercentageByDiscipline[item.disc.id] = Math.round(
      (item.score / totalScore) * 100
    );
  });

  if (scores.length === 0 || totalWeeklyMinutes === 0) {
    return { cycle: [], weeklySchedule: [], weeklyGoalHours: 0, weightPercentageByDiscipline };
  }

  // Distribuição dos minutos da semana por disciplina
  let distributedSum = 0;
  const items = scores.map((item) => {
    const weightPercentage = Math.round((item.score / totalScore) * 100);
    let totalMinutes = Math.round((item.score / totalScore) * totalWeeklyMinutes);
    totalMinutes = Math.max(minSessionLimit, totalMinutes);
    distributedSum += totalMinutes;
    return { ...item, weightPercentage, totalMinutes };
  });

  const diff = totalWeeklyMinutes - distributedSum;
  if (diff !== 0 && items.length > 0) {
    items[0].totalMinutes = Math.max(30, items[0].totalMinutes + diff);
  }

  const withBlocks = items.map((item) => {
    const maxBlocks = Math.max(1, Math.floor(item.totalMinutes / minSessionLimit));
    const blockCount = Math.min(
      maxBlocks,
      Math.max(1, Math.round(item.totalMinutes / maxSessionLimit))
    );
    const minutesPerBlock = Math.min(
      maxSessionLimit,
      Math.max(minSessionLimit, Math.round(item.totalMinutes / blockCount))
    );
    return { ...item, blockCount, minutesPerBlock };
  });

  // Ciclo intercalado — disciplinas de maior peso primeiro
  const pools = [...withBlocks]
    .sort((a, b) => b.weightPercentage - a.weightPercentage)
    .map((d) => ({
      disciplineId: d.disc.id,
      minutes: d.minutesPerBlock,
      remaining: d.blockCount,
    }));

  const cycle: CycleStep[] = [];
  let order = 1;
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const pool of pools) {
      if (pool.remaining > 0) {
        hasMore = true;
        const cfg = input.disciplines.find((d) => d.id === pool.disciplineId);
        const item = withBlocks.find((d) => d.disc.id === pool.disciplineId);
        cycle.push({
          id: `step-auto-${order}-${Date.now()}`,
          disciplineId: pool.disciplineId,
          targetMinutes: pool.minutes,
          order,
          importance: cfg?.importance,
          knowledgeLevel: cfg?.knowledgeLevel,
          weightPercentage: item?.weightPercentage,
        });
        pool.remaining--;
        order++;
      }
    }
  }

  // Blocos semanais distribuídos entre os dias disponíveis
  const weeklySchedule: WeeklyScheduleBlock[] = [];
  let cycleIdx = 0;
  DAY_KEYS.forEach((day) => {
    let dayMinutesLeft = (Number(input.dailyAvailability[day]) || 0) * 60;
    let dayOrder = 1;
    while (dayMinutesLeft >= minSessionLimit && cycle.length > 0) {
      const step = cycle[cycleIdx % cycle.length];
      const blockDuration = Math.min(step.targetMinutes, dayMinutesLeft);
      if (blockDuration < minSessionLimit) break;
      weeklySchedule.push({
        id: `wb-auto-${day}-${dayOrder}-${Date.now()}`,
        day,
        disciplineId: step.disciplineId,
        targetMinutes: blockDuration,
        order: dayOrder,
      });
      dayMinutesLeft -= blockDuration;
      cycleIdx++;
      dayOrder++;
    }
  });

  return {
    cycle,
    weeklySchedule,
    weeklyGoalHours: Math.max(2, Math.round(totalWeeklyMinutes / 60)),
    weightPercentageByDiscipline,
  };
}
