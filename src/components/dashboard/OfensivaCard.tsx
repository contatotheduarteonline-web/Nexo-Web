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
      className={`nx-card nx-card-hover w-full p-5 sm:p-6 ${className}`}
    >
      {/* Topo Limpo da Ofensiva */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#384154] gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3AA2D]/20 bg-[#F3AA2D]/10 text-[#F3AA2D]">
            <Flame className="h-5 w-5 fill-[#F3AA2D] text-[#F3AA2D]" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <h2 className="font-condensed text-[19px] font-bold text-[#F5F4EF]">
              Ofensiva
            </h2>
            <span className="num-condensed text-[26px] font-bold leading-none text-[#F3AA2D]">
              {currentStreak} {currentStreak === 1 ? "dia" : "dias"}
            </span>
          </div>
        </div>

        {/* Lado Direito: Recorde e Status resumido sem poluição de texto */}
        <div className="flex items-center gap-2.5 text-[12px]">
          <div className="nx-deep flex items-center gap-1.5 px-3 py-1.5">
            <span className="text-[#A5B0C2]">Recorde:</span>
            <span className="num-condensed font-bold text-[#F5F4EF]">
              {recordStreak} {recordStreak === 1 ? "dia" : "dias"}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-colors duration-200 ${
              studiedToday
                ? "border border-emerald-400/25 bg-emerald-400/10 text-[#34D399]"
                : "border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 text-[#F3AA2D]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                studiedToday ? "bg-[#34D399]" : "bg-[#F3AA2D]"
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
                className={`relative flex flex-col items-center justify-between rounded-xl py-3.5 px-2 sm:px-3 text-center transition-colors duration-200 ${
                  day.isStudied
                    ? "border border-[#F3AA2D]/30 bg-[#F3AA2D]/[0.07]"
                    : day.isToday
                    ? "border-2 border-[#F3AA2D] bg-[#171B25]"
                    : day.isFuture
                    ? "border border-dashed border-[#384154] bg-[#171B25]/60 opacity-60"
                    : "border border-[#384154] bg-[#171B25]"
                }`}
              >
                {/* Rótulo do dia (SEG, TER, QUA...) */}
                <span
                  className={`text-[11px] font-bold tracking-wider ${
                    day.isToday
                      ? "text-[#F3AA2D]"
                      : day.isStudied
                      ? "text-[#F3AA2D]"
                      : "text-[#A5B0C2]"
                  }`}
                >
                  {day.label}
                </span>

                {/* Número do dia */}
                <span
                  className={`num-condensed my-1.5 text-[20px] sm:text-[22px] font-bold ${
                    day.isStudied
                      ? "text-[#F3AA2D]"
                      : day.isToday
                      ? "text-[#F5F4EF]"
                      : day.isFuture
                      ? "text-[#76829B]"
                      : "text-[#A5B0C2]"
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Indicador Visual Minimalista (Ícone ou Ponto Limpo) */}
                <div className="h-6 flex items-center justify-center">
                  {day.isStudied ? (
                    <div
                      title="Estudado"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F3AA2D] text-[#11151F]"
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  ) : day.isToday ? (
                    <span className="inline-flex items-center rounded-full border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 px-2 py-0.5 text-[10px] font-bold text-[#F3AA2D]">
                      Hoje
                    </span>
                  ) : day.isFuture ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#384154]" />
                  ) : (
                    <span
                      title="Sem estudo"
                      className="h-1.5 w-1.5 rounded-full bg-[#4A556E]"
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
