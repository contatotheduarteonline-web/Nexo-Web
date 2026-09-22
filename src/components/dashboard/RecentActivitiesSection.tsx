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
      className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.015)] dark:border-[#1E2638] dark:bg-[#121622] flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F2F5] dark:border-[#1C2333]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#F97316] dark:bg-orange-950/40 dark:text-orange-400">
              <History className="h-4 w-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#172033] dark:text-white tracking-tight">
              Últimas atividades
            </h3>
          </div>

          <button
            type="button"
            id="btn-historico-completo"
            onClick={onNavigateToHistory}
            className="text-[13px] font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Histórico</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3.5">
          {activities.length === 0 ? (
            <div className="py-7 text-center">
              <p className="text-[13px] text-[#667085] dark:text-[#94A3B8]">
                Nenhuma atividade registrada ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 4).map((sess) => (
                <div
                  key={sess.id}
                  id={`activity-item-${sess.id}`}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-3 text-[12px] transition hover:border-[#D1D5DB] dark:border-[#1E2638] dark:bg-[#161D2B]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#172033] dark:text-white truncate max-w-[220px]">
                      {sess.topicName || sess.disciplineName}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#F97316] bg-orange-50 px-2 py-0.5 rounded-md dark:bg-orange-950/40">
                      {sess.durationMinutes} min
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#667085] dark:text-[#94A3B8]">
                    <span className="font-medium text-[#172033]/80 dark:text-white/80">
                      {sess.disciplineName}
                    </span>
                    {sess.questionsDone ? (
                      <span className="font-medium text-[#172033] dark:text-white">
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
