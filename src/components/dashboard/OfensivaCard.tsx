import React, { useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import { Flame, Check } from "lucide-react";

/**
 * Retorna a data local no formato YYYY-MM-DD sem distorção de timezone
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Extrai a chave YYYY-MM-DD segura de qualquer sessão de estudos
 */
export function extractSessionDateKey(session: { studyDate?: string; date?: string }): string {
  if (session.studyDate && session.studyDate.length >= 10) {
    return session.studyDate.slice(0, 10);
  }
  if (session.date && session.date.length >= 10) {
    if (session.date.includes("T")) {
      const d = new Date(session.date);
      if (!isNaN(d.getTime())) {
        return getLocalDateString(d);
      }
    }
    return session.date.slice(0, 10);
  }
  return "";
}

interface OfensivaCardProps {
  className?: string;
}

export const OfensivaCard: React.FC<OfensivaCardProps> = ({ className = "" }) => {
  const { studySessions } = useStudy();

  // 1. Mapeamento de todos os dias com estudo (Set de YYYY-MM-DD)
  const studiedDatesSet = useMemo(() => {
    const set = new Set<string>();
    studySessions.forEach((session) => {
      const key = extractSessionDateKey(session);
      if (key) {
        set.add(key);
      }
    });
    return set;
  }, [studySessions]);

  // 2. Cálculo da sequência atual e do recorde histórico
  const { currentStreak, recordStreak } = useMemo(() => {
    const today = new Date();
    const todayStr = getLocalDateString(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    // --- Sequência Atual ---
    let curr = 0;
    let cursor = new Date(today);

    if (studiedDatesSet.has(todayStr)) {
      while (studiedDatesSet.has(getLocalDateString(cursor))) {
        curr++;
        cursor.setDate(cursor.getDate() - 1);
      }
    } else if (studiedDatesSet.has(yesterdayStr)) {
      cursor = new Date(yesterday);
      while (studiedDatesSet.has(getLocalDateString(cursor))) {
        curr++;
        cursor.setDate(cursor.getDate() - 1);
      }
    } else {
      curr = 0;
    }

    // --- Recorde Histórico ---
    const sortedDates: string[] = [...studiedDatesSet].sort();
    let maxRecord = 0;
    let runningStreak = 0;
    let previousDate: Date | null = null;

    for (const dateStr of sortedDates) {
      const [y, m, d] = dateStr.split("-").map(Number);
      const currentDate = new Date(y, m - 1, d);

      if (!previousDate) {
        runningStreak = 1;
      } else {
        const diffMs = currentDate.getTime() - previousDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          runningStreak++;
        } else if (diffDays > 1) {
          runningStreak = 1;
        }
      }

      if (runningStreak > maxRecord) {
        maxRecord = runningStreak;
      }
      previousDate = currentDate;
    }

    return {
      currentStreak: curr,
      recordStreak: Math.max(maxRecord, curr),
    };
  }, [studiedDatesSet]);

  // 3. Dias da Semana Atual (SEG a DOM)
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda...
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

    const monday = new Date(today.getFullYear(), today.getMonth(), diffToMonday);
    const labels = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

    return labels.map((label, idx) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
      const dateKey = getLocalDateString(d);
      const isStudied = studiedDatesSet.has(dateKey);
      const isToday = dateKey === todayStr;
      const isFuture = dateKey > todayStr;

      return {
        label,
        dayNumber: d.getDate(),
        dateKey,
        isStudied,
        isToday,
        isFuture,
      };
    });
  }, [studiedDatesSet]);

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const studiedToday = studiedDatesSet.has(todayStr);

  return (
    <section
      id="section-ofensiva-semana"
      className={`w-full rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E293B] dark:bg-[#121622] transition-all duration-200 hover:border-[#D1D5DB] dark:hover:border-[#2A3447] ${className}`}
    >
      {/* Topo Limpo da Ofensiva */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#F0F2F5] dark:border-[#1C2333] gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-[#F59E0B] dark:bg-amber-950/40 dark:text-amber-400">
            <Flame className="h-5 w-5 fill-[#F59E0B] text-[#F59E0B]" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[16px] sm:text-[17px] font-semibold text-[#172033] dark:text-white tracking-tight">
              Ofensiva
            </h2>
            <span className="text-[22px] sm:text-[24px] font-extrabold text-[#F59E0B] font-mono tracking-tight">
              {currentStreak} {currentStreak === 1 ? "dia" : "dias"}
            </span>
            <span className="text-[12px] font-medium text-[#667085] dark:text-[#94A3B8]">
              sequência atual
            </span>
          </div>
        </div>

        {/* Lado Direito: Recorde e Status resumido sem poluição de texto */}
        <div className="flex items-center gap-2.5 text-[12px]">
          <div className="flex items-center gap-1.5 rounded-lg bg-[#F8F9FB] px-3 py-1.5 border border-[#E5E7EB] dark:bg-[#1E293B] dark:border-[#1E293B]">
            <span className="text-[#667085] dark:text-[#94A3B8]">Recorde:</span>
            <span className="font-semibold text-[#172033] dark:text-white font-mono">
              {recordStreak} {recordStreak === 1 ? "dia" : "dias"}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
              studiedToday
                ? "bg-emerald-50 text-[#16A37A] border border-emerald-200/60 dark:bg-emerald-950/40 dark:border-emerald-800/40"
                : "bg-amber-50 text-[#F59E0B] border border-amber-200/60 dark:bg-amber-950/40 dark:border-amber-800/40"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                studiedToday ? "bg-[#10B981]" : "bg-[#F59E0B] animate-pulse"
              }`}
            />
            <span>{studiedToday ? "Hoje concluído" : "Pendente hoje"}</span>
          </div>
        </div>
      </div>

      {/* Grid Semanal Limpo (sem repetição do texto 'Pendente' / 'Estudado') */}
      <div className="mt-5">
        <div className="grid grid-cols-7 gap-2 sm:gap-3 md:gap-4">
          {currentWeekDays.map((day) => {
            return (
              <div
                key={day.dateKey}
                id={`ofensiva-dia-${day.label.toLowerCase()}`}
                className={`relative flex flex-col items-center justify-between rounded-xl py-3.5 px-2 sm:px-3 text-center transition-all duration-200 ${
                  day.isStudied
                    ? "bg-amber-50/70 border border-amber-200/80 shadow-xs dark:bg-amber-950/30 dark:border-amber-900/50"
                    : day.isToday
                    ? "border-2 border-[#F59E0B] bg-white shadow-xs dark:bg-[#161D2B]"
                    : day.isFuture
                    ? "border border-dashed border-[#E5E7EB] bg-[#F8F9FB]/60 dark:border-[#1E293B] dark:bg-[#1E293B]/20 opacity-50"
                    : "border border-[#E5E7EB] bg-[#F8F9FB] dark:border-[#1E293B] dark:bg-[#1E293B]/50"
                }`}
              >
                {/* Rótulo do dia (SEG, TER, QUA...) */}
                <span
                  className={`text-[11px] font-bold tracking-wider ${
                    day.isToday
                      ? "text-[#F59E0B] dark:text-amber-400 font-extrabold"
                      : day.isStudied
                      ? "text-[#D97706] dark:text-amber-300"
                      : "text-[#667085] dark:text-[#94A3B8]"
                  }`}
                >
                  {day.label}
                </span>

                {/* Número do dia */}
                <span
                  className={`my-1.5 text-[18px] sm:text-[21px] font-bold font-mono tracking-tight ${
                    day.isStudied
                      ? "text-[#D97706] dark:text-amber-400"
                      : day.isToday
                      ? "text-[#172033] dark:text-white"
                      : day.isFuture
                      ? "text-[#94A3B8] dark:text-[#475467]"
                      : "text-[#667085] dark:text-[#94A3B8]"
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Indicador Visual Minimalista (Ícone ou Ponto Limpo) */}
                <div className="h-6 flex items-center justify-center">
                  {day.isStudied ? (
                    <div
                      title="Estudado"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B] text-white shadow-xs"
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  ) : day.isToday ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-[#F59E0B] dark:bg-amber-950/60">
                      Hoje
                    </span>
                  ) : day.isFuture ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D1D5DB]/50 dark:bg-[#334155]/40" />
                  ) : (
                    <span
                      title="Sem estudo"
                      className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1] dark:bg-[#334155]"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
