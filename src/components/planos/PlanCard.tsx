import React, { useState } from "react";
import { StudyPlan, Edital, StudySession } from "../../types";
import { useStudy } from "../../context/StudyContext";
import {
  Layers,
  BookOpen,
  Clock,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Archive,
  ArchiveRestore,
  Trash2,
  ExternalLink,
  Shield,
  Award,
  Calendar,
  Sparkles,
} from "lucide-react";

interface PlanCardProps {
  plan: StudyPlan;
  edital?: Edital;
  studySessions: StudySession[];
  onOpenPlan: (planId: string) => void;
  onEditPlan: (plan: StudyPlan) => void;
  onArchivePlan: (planId: string) => void;
  onDeletePlan: (plan: StudyPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  edital,
  studySessions,
  onOpenPlan,
  onEditPlan,
  onArchivePlan,
  onDeletePlan,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Real calculations
  const disciplines = edital?.disciplines || [];
  const topics = edital?.topics || [];
  const totalDisciplines = disciplines.length;
  const totalTopics = topics.length;

  const studiedTopicsCount = topics.filter((t) => t.isStudied).length;
  const progressPct =
    totalTopics > 0 ? Math.round((studiedTopicsCount / totalTopics) * 100) : 0;

  // Real studied minutes for this plan or edital
  const planSessions = studySessions.filter(
    (s) => s.editalId === plan.editalId || s.planningBlockId === plan.id
  );
  const totalMinutes = planSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedTime = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;

  const isArchived = !!plan.isArchived;
  const { getPlanImageUrl, isPlanImageLoading } = useStudy();

  const customImageUrl = getPlanImageUrl(plan.id);
  const hasCustom = Boolean(plan.hasCustomImage || plan.imageRef);
  const isImageLoading = hasCustom && !customImageUrl && isPlanImageLoading(plan.id);
  const displayImage = customImageUrl || plan.imageUrl || edital?.imageUrl;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-[#F59E0B]/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        {/* Top bar: Image + Info + Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Logo / Cover Image */}
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
              {isImageLoading ? (
                <div className="h-full w-full animate-pulse bg-zinc-200 dark:bg-zinc-700" />
              ) : displayImage ? (
                <img
                  src={displayImage}
                  alt={plan.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/5 text-[#F59E0B]">
                  <Shield className="h-7 w-7" />
                </div>
              )}
            </div>

            {/* Title & Target */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3
                  onClick={() => onOpenPlan(plan.id)}
                  className="cursor-pointer font-bold text-zinc-900 hover:text-[#F59E0B] dark:text-white dark:hover:text-[#FBBF24] truncate transition"
                  title={plan.name}
                >
                  {plan.name}
                </h3>
                {isArchived && (
                  <span className="shrink-0 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Arquivado
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {plan.organ || edital?.organ || "Concurso Geral"}
                {plan.cargo || edital?.cargo ? ` • ${plan.cargo || edital?.cargo}` : ""}
              </p>
            </div>
          </div>

          {/* Context Options Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
              title="Opções"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenPlan(plan.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-amber-50 hover:text-[#F59E0B] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-[#FBBF24] transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#F59E0B]" />
                    <span>Abrir Plano</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEditPlan(plan);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Editar Informações</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onArchivePlan(plan.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {isArchived ? (
                      <>
                        <ArchiveRestore className="h-3.5 w-3.5 text-amber-500" />
                        <span>Desarquivar</span>
                      </>
                    ) : (
                      <>
                        <Archive className="h-3.5 w-3.5 text-amber-500" />
                        <span>Arquivar Plano</span>
                      </>
                    )}
                  </button>
                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDeletePlan(plan);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir Plano</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Badges / Metrics Stats Row */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              Disciplinas
            </span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
              {totalDisciplines}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-x border-zinc-200 dark:border-zinc-700/60">
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              Tópicos
            </span>
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
              {totalTopics}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              Estudado
            </span>
            <span className="text-xs font-bold text-[#F59E0B] dark:text-[#FBBF24]">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              Progresso do Conteúdo
            </span>
            <span className="font-bold text-zinc-900 dark:text-white">
              {progressPct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400">
          {totalTopics > 0 ? `${studiedTopicsCount} de ${totalTopics} tópicos concluídos` : "Sem tópicos cadastrados"}
        </span>

        <button
          onClick={() => onOpenPlan(plan.id)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] hover:text-[#D97706] dark:text-[#FBBF24] dark:hover:text-white transition cursor-pointer"
        >
          <span>Abrir plano</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
