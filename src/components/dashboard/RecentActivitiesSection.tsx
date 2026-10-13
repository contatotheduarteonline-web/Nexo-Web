import React, { useMemo } from "react";
import { History, ArrowUpRight, Clock } from "lucide-react";
import { StudySession } from "../../types";
import { useStudy } from "../../context/StudyContext";

interface RecentActivitiesSectionProps {
  activities: StudySession[];
  onNavigateToHistory: () => void;
}

const PASTEL_FALLBACK = [
  "#58A6FF", "#2BBF8A", "#8B5CF6", "#EC4899", "#F4B544",
  "#06B6D4", "#6366F1", "#D946EF", "#F16D75", "#84CC16",
];

/** Formata minutos como "52h38min" (ou "25min" quando menor que 1h). */
function formatHM(minutes: number): string {
  const total = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}min`;
  return `${m}min`;
}

export const RecentActivitiesSection: React.FC<RecentActivitiesSectionProps> = ({
  activities,
  onNavigateToHistory,
}) => {
  const { activeEdital, studySessions } = useStudy();

  // Mapa de cor por disciplina (mesma lógica do Histórico de Estudos)
  const disciplineColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const disciplines = [
      ...((activeEdital?.disciplines || []) as { id: string; color?: string }[]),
      ...studySessions
        .filter((s) => s.disciplineId && s.disciplineName && !map.has(s.disciplineId))
        .map((s) => ({ id: s.disciplineId as string })),
    ];
    disciplines.forEach((d, idx) => {
      if (!map.has(d.id)) map.set(d.id, d.color || PASTEL_FALLBACK[idx % PASTEL_FALLBACK.length]);
    });
    return map;
  }, [activeEdital, studySessions]);

  return (
    <section
      id="section-ultimas-atividades"
      className="nx-card p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-[#263447]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#263447] bg-[#111B2D] text-white">
              <History className="h-4 w-4" />
            </div>
            <h3 className="font-condensed text-[15px] font-bold text-white">
              HISTÓRICO
            </h3>
          </div>

          <button
            type="button"
            id="btn-historico-completo"
            onClick={onNavigateToHistory}
            className="text-[13px] font-semibold text-[#F4B544] hover:text-[#D97706] hover:underline flex items-center gap-1 cursor-pointer transition-colors duration-200"
          >
            <span>Histórico</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3.5">
          {activities.length === 0 ? (
            <div className="rounded-xl border border-[#263447] bg-[#1D2B40] py-7 text-center">
              <p className="text-[13px] text-white">
                Nenhuma atividade registrada ainda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#263447] overflow-hidden rounded-xl border border-[#263447] bg-[#1D2B40] shadow-xs">
              {activities.slice(0, 4).map((sess) => {
                const discColor =
                  disciplineColorMap.get(sess.disciplineId || "") || "#58A6FF";
                const correct = sess.questionsDone
                  ? sess.questionsCorrect
                  : 0;
                const errors = sess.questionsDone
                  ? sess.questionsDone - sess.questionsCorrect
                  : 0;

                return (
                  <div
                    key={sess.id}
                    id={`activity-item-${sess.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#172235]"
                  >
                    {/* Barra de cor da disciplina */}
                    <div
                      className="h-9 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: discColor }}
                    />

                    {/* Disciplina + tópico */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold uppercase tracking-wide text-white">
                        {sess.disciplineName || "Disciplina"}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-[#93A2B7]">
                        {sess.topicName || sess.disciplineName || "Geral"}
                      </div>
                    </div>

                    {/* Duração + acertos */}
                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[12.5px] text-[#93A2B7]">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="num-condensed">
                          {formatHM(sess.durationMinutes)}
                        </span>
                      </div>
                      {sess.questionsDone ? (
                        <div className="num-condensed mt-0.5 text-[11px] font-semibold">
                          <span className="text-[#2BBF8A]">{correct}</span>
                          <span className="text-[#5B6B80]">/</span>
                          <span className="text-[#F16D75]">{errors}</span>
                          <span className="text-[#93A2B7]"> acertos</span>
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[11px] text-[#93A2B7]">
                          {sess.modality || "Estudo"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
