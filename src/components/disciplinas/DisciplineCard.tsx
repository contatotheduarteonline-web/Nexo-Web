import React from "react";
import { Discipline, Topic, StudyPlan, StudySession } from "../../types";
import {
  BookOpen,
  Edit2,
  Play,
  CheckCircle2,
  Clock,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

interface DisciplineCardProps {
  discipline: Discipline;
  planName: string;
  topics: Topic[];
  sessions: StudySession[];
  onEdit: (discipline: Discipline) => void;
  onStartStudy: (discipline: Discipline) => void;
}

export const DisciplineCard: React.FC<DisciplineCardProps> = ({
  discipline,
  planName,
  topics,
  sessions,
  onEdit,
  onStartStudy,
}) => {
  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.isStudied).length;
  const progressPct =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Questions and performance derived directly from discipline study sessions
  const questionsTotal = sessions.reduce((acc, s) => acc + (s.questionsDone || 0), 0);
  const questionsCorrect = sessions.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0);

  const accuracyPct =
    questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;

  // Study time
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedTime = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-amber-500/60 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        {/* Header: Color Accent + Name + Plan Tag */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="h-3 w-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: discipline.color || "#F59E0B" }}
            />
            <h3
              onClick={() => onEdit(discipline)}
              className="font-bold text-zinc-900 hover:text-[#F59E0B] dark:text-white dark:hover:text-[#FBBF24] truncate text-sm cursor-pointer transition"
              title={discipline.name}
            >
              {discipline.name}
            </h3>
          </div>

          <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {planName}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-2.5 text-center dark:bg-zinc-800/50">
          <div>
            <span className="text-[10px] text-zinc-400 block">Tópicos</span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
              {completedTopics}/{totalTopics}
            </span>
          </div>
          <div className="border-x border-zinc-200 dark:border-zinc-700/60">
            <span className="text-[10px] text-zinc-400 block">Questões</span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
              {questionsTotal}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block">Desempenho</span>
            <span className="text-xs font-bold text-[#F59E0B] dark:text-[#FBBF24]">
              {accuracyPct}%
            </span>
          </div>
        </div>

        {/* Progress Bar & Hours */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
              {completedTopics} de {totalTopics} tópicos ({progressPct}%)
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">
              {formattedTime} estudadas
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                backgroundColor: discipline.color || "#F59E0B",
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onEdit(discipline)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
        >
          <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
          <span>Editar</span>
        </button>

        <button
          type="button"
          onClick={() => onStartStudy(discipline)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-[#F59E0B] dark:text-[#FBBF24] hover:bg-[#F59E0B] hover:text-white dark:hover:bg-[#F59E0B] dark:hover:text-white transition"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>Iniciar Estudo</span>
        </button>
      </div>
    </div>
  );
};
