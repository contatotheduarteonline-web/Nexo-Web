import React, { useState, useEffect } from "react";
import { StudyPlan, Discipline, Topic } from "../../types";
import { useStudy } from "../../context/StudyContext";
import {
  ArrowLeft,
  Edit2,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  BookOpen,
  Layers,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  Play,
} from "lucide-react";
import { EditDisciplineModal } from "../modals/EditDisciplineModal";
import { AddDisciplineModal } from "../modals/AddDisciplineModal";

interface PlanDetailViewProps {
  plan: StudyPlan;
  onBack: () => void;
  onEditPlan: (plan: StudyPlan) => void;
  onArchivePlan: (planId: string) => void;
  onDeletePlan: (plan: StudyPlan) => void;
  onOpenNewTopicModal?: (disciplineId?: string) => void;
}

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({
  plan,
  onBack,
  onEditPlan,
  onArchivePlan,
  onDeletePlan,
  onOpenNewTopicModal,
}) => {
  const {
    editais,
    studySessions,
    launchStudySessionForTopic,
    setActiveTab,
    getPlanImageUrl,
    isPlanImageLoading,
  } = useStudy();

  const [selectedDisciplineForEdit, setSelectedDisciplineForEdit] = useState<Discipline | null>(null);
  const [isAddDisciplineOpen, setIsAddDisciplineOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Locate associated edital
  const edital = editais.find(
    (e) => e.id === plan.editalId || (plan.sourceEditalId && e.id === plan.sourceEditalId)
  );
  const disciplines = edital?.disciplines || [];
  const topics = edital?.topics || [];

  // Audit trace log
  useEffect(() => {
    console.log(
      `[AUDITORIA PLANOS - VISUALIZAÇÃO] Plano: "${plan.name}" (ID: ${plan.id}) | Edital ID: "${plan.editalId}" | Encontrado: ${
        edital ? "SIM" : "NÃO"
      } | Disciplinas: ${disciplines.length} | Tópicos: ${topics.length}`
    );
  }, [plan.id, plan.name, plan.editalId, edital, disciplines.length, topics.length]);

  const customImageUrl = getPlanImageUrl(plan.id);
  const hasCustom = Boolean(plan.hasCustomImage || plan.imageRef);
  const isImageLoading = hasCustom && !customImageUrl && isPlanImageLoading(plan.id);
  const displayImage = customImageUrl || plan.imageUrl || edital?.imageUrl;

  // Filter study sessions for this plan / edital
  const planSessions = studySessions.filter(
    (s) => s.editalId === plan.editalId || s.planningBlockId === plan.id
  );

  // 1. Horas estudadas
  const totalMinutes = planSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const formattedHours =
    totalHours > 0
      ? `${totalHours}h${remainingMins > 0 ? ` ${remainingMins}min` : ""}`
      : `${remainingMins}min`;

  // 2. Questões resolvidas e Desempenho
  let totalQuestionsDone = 0;
  let totalQuestionsCorrect = 0;

  topics.forEach((t) => {
    totalQuestionsDone += t.questionsDone || 0;
    totalQuestionsCorrect += t.questionsCorrect || 0;
  });

  planSessions.forEach((s) => {
    // If session has questions that weren't tied to an already aggregated topic
    if (!s.topicId && s.questionsDone) {
      totalQuestionsDone += s.questionsDone;
      totalQuestionsCorrect += s.questionsCorrect || 0;
    }
  });

  const accuracyPct =
    totalQuestionsDone > 0
      ? Math.round((totalQuestionsCorrect / totalQuestionsDone) * 100)
      : 0;

  // 3. Progresso do conteúdo
  const totalTopicsCount = topics.length;
  const studiedTopicsCount = topics.filter((t) => t.isStudied).length;
  const progressPct =
    totalTopicsCount > 0
      ? Math.round((studiedTopicsCount / totalTopicsCount) * 100)
      : 0;

  const isArchived = !!plan.isArchived;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar: Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850 transition"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          <span>Voltar para todos os planos</span>
        </button>

        {isArchived && (
          <span className="rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            Plano Arquivado
          </span>
        )}
      </div>

      {/* Hero Card with Plan info */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
            {/* Plan Logo / Cover */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 shadow-xs">
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
                  <Shield className="h-10 w-10" />
                </div>
              )}
            </div>

            {/* Plan Metadata */}
            <div className="space-y-1.5 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white truncate">
                {plan.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Concurso: {plan.organ || edital?.organ || "Geral"}
                </span>
                {(plan.cargo || edital?.cargo) && (
                  <>
                    <span>•</span>
                    <span>Cargo: {plan.cargo || edital?.cargo}</span>
                  </>
                )}
                <span>•</span>
                <span>{disciplines.length} disciplinas</span>
                <span>•</span>
                <span>{topics.length} tópicos</span>
              </div>

              {plan.notes && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl line-clamp-2">
                  {plan.notes}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => onEditPlan(plan)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 transition"
            >
              <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
              <span>Editar Plano</span>
            </button>

            {/* Context Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-xl border border-zinc-200 bg-white p-2.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition"
                title="Mais opções"
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
                        onArchivePlan(plan.id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {isArchived ? (
                        <>
                          <ArchiveRestore className="h-3.5 w-3.5 text-amber-500" />
                          <span>Desarquivar Plano</span>
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
        </div>
      </div>

      {/* Indicadores do Plano (Real Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Horas Estudadas */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Horas Estudadas</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-[#F59E0B]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {formattedHours}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {planSessions.length} sessões registradas
            </p>
          </div>
        </div>

        {/* Questões Resolvidas */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Questões Resolvidas</span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
              <HelpCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {totalQuestionsDone.toLocaleString()}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {totalQuestionsCorrect.toLocaleString()} acertos registrados
            </p>
          </div>
        </div>

        {/* Desempenho */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Desempenho Médio</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {accuracyPct}%
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Taxa de acertos em exercícios
            </p>
          </div>
        </div>

        {/* Progresso Geral */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Progresso Geral</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-[#F59E0B]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {progressPct}%
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {studiedTopicsCount} de {totalTopicsCount} tópicos concluídos
            </p>
          </div>
        </div>
      </div>

      {/* Disciplinas Dentro do Plano */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#F59E0B]" />
              <span>Disciplinas do Plano</span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                ({disciplines.length})
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Clique em qualquer matéria para editar tópicos, ordem e prioridades rapidamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddDisciplineOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 active:scale-98 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Disciplina</span>
            </button>
          </div>
        </div>

        {/* Empty state or Grid */}
        {disciplines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-[#F59E0B]">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
              Nenhuma disciplina cadastrada neste plano
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
              Adicione as matérias exigidas para começar a organizar sua rotina de estudos e tópicos.
            </p>
            <button
              onClick={() => setIsAddDisciplineOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Primeira Disciplina</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {disciplines.map((disc) => {
              const discTopics = topics.filter((t) => t.disciplineId === disc.id);
              const discStudiedCount = discTopics.filter((t) => t.isStudied).length;
              const discProgress =
                discTopics.length > 0
                  ? Math.round((discStudiedCount / discTopics.length) * 100)
                  : 0;

              // Disc questions & performance
              let discQuestions = 0;
              let discCorrect = 0;
              discTopics.forEach((t) => {
                discQuestions += t.questionsDone || 0;
                discCorrect += t.questionsCorrect || 0;
              });
              const discAccuracy =
                discQuestions > 0 ? Math.round((discCorrect / discQuestions) * 100) : 0;

              // Disc study time
              const discSessions = planSessions.filter(
                (s) => s.disciplineId === disc.id || s.disciplineName === disc.name
              );
              const discMinutes = discSessions.reduce(
                (acc, s) => acc + (s.durationMinutes || 0),
                0
              );
              const discHours = Math.floor(discMinutes / 60);
              const discRemMins = discMinutes % 60;
              const formattedDiscTime =
                discHours > 0
                  ? `${discHours}h${discRemMins > 0 ? ` ${discRemMins}m` : ""}`
                  : `${discRemMins}m`;

              return (
                <div
                  key={disc.id}
                  onClick={() => setSelectedDisciplineForEdit(disc)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-[#F59E0B] hover:shadow-md cursor-pointer dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div>
                    {/* Header: Color Indicator + Title + Tag */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: disc.color || "#F59E0B" }}
                        />
                        <h3 className="font-bold text-zinc-900 group-hover:text-[#F59E0B] dark:text-white dark:group-hover:text-[#FBBF24] truncate text-sm transition">
                          {disc.name}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {plan.name}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-800/50 text-center">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Tópicos</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                          {discStudiedCount}/{discTopics.length}
                        </span>
                      </div>
                      <div className="border-x border-zinc-200 dark:border-zinc-700/60">
                        <span className="text-[10px] text-zinc-400 block">Questões</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                          {discQuestions}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Desempenho</span>
                        <span className="text-xs font-bold text-[#F59E0B] dark:text-[#FBBF24]">
                          {discAccuracy}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                          {discStudiedCount} de {discTopics.length} tópicos ({discProgress}%)
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">
                          {formattedDiscTime}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${discProgress}%`,
                            backgroundColor: disc.color || "#F59E0B",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Quick edit cue */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition">
                    <span>Clique para editar tópicos</span>
                    <Edit2 className="h-3.5 w-3.5 text-zinc-400 group-hover:text-[#F59E0B] transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Discipline Modal */}
      {selectedDisciplineForEdit && (
        <EditDisciplineModal
          discipline={selectedDisciplineForEdit}
          isOpen={true}
          onClose={() => setSelectedDisciplineForEdit(null)}
        />
      )}

      {/* Add Discipline Modal */}
      {isAddDisciplineOpen && (
        <AddDisciplineModal
          isOpen={true}
          onClose={() => setIsAddDisciplineOpen(false)}
          targetEditalId={edital?.id || plan.editalId}
          targetPlanName={plan.name}
        />
      )}
    </div>
  );
};
