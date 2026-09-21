import React from "react";
import { History, ArrowUpRight } from "lucide-react";
import { StudySession } from "../../types";

interface RecentActivitiesSectionProps {
  activities: StudySession[];
  onNavigateToHistory: () => void;
}

export const RecentActivitiesSection: React.FC<RecentActivitiesSectionProps> = ({
  activities,
  onNavigateToHistory,
}) => {
  return (
    <section
      id="section-ultimas-atividades"
      className="nx-card p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-[#384154]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#384154] bg-[#171B25] text-[#A5B0C2]">
              <History className="h-4 w-4" />
            </div>
            <h3 className="font-condensed text-[19px] font-bold text-[#F5F4EF]">
              Últimas atividades
            </h3>
          </div>

          <button
            type="button"
            id="btn-historico-completo"
            onClick={onNavigateToHistory}
            className="text-[13px] font-semibold text-[#F3AA2D] hover:text-[#D98F20] hover:underline flex items-center gap-1 cursor-pointer transition-colors duration-200"
          >
            <span>Histórico</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3.5">
          {activities.length === 0 ? (
            <div className="py-7 text-center">
              <p className="text-[13px] text-[#A5B0C2]">
                Nenhuma atividade registrada ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 4).map((sess) => (
                <div
                  key={sess.id}
                  id={`activity-item-${sess.id}`}
                  className="nx-deep nx-deep-hover p-3 text-[12px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F5F4EF] truncate max-w-[220px]">
                      {sess.topicName || sess.disciplineName}
                    </span>
                    <span className="num-condensed text-[11px] font-bold text-[#F3AA2D] border border-[#F3AA2D]/25 bg-[#F3AA2D]/10 px-2 py-0.5 rounded-md">
                      {sess.durationMinutes} min
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#A5B0C2]">
                    <span className="font-medium text-[#F5F4EF]/80">
                      {sess.disciplineName}
                    </span>
                    {sess.questionsDone ? (
                      <span className="font-medium text-[#F5F4EF]">
                        {sess.questionsCorrect}/{sess.questionsDone} acertos
                      </span>
                    ) : (
                      <span>{sess.modality || "Estudo"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
