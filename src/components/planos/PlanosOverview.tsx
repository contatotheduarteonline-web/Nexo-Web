import React, { useState } from "react";
import { StudyPlan } from "../../types";
import { useStudy } from "../../context/StudyContext";
import { PlanCard } from "./PlanCard";
import {
  Plus,
  Layers,
  Search,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { EditPlanModal } from "../modals/EditPlanModal";
import { deletePlanImage } from "../../utils/planImageStorage";

interface PlanosOverviewProps {
  onOpenPlan: (planId: string) => void;
  onOpenCreateWizard: () => void;
}

export const PlanosOverview: React.FC<PlanosOverviewProps> = ({
  onOpenPlan,
  onOpenCreateWizard,
}) => {
  const {
    studyPlans,
    editais,
    studySessions,
    archiveStudyPlan,
    deleteStudyPlan,
  } = useStudy();

  const [activeFilter, setActiveFilter] = useState<"ativos" | "arquivados">("ativos");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<StudyPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activePlans = studyPlans.filter((p) => !p.isArchived);
  const archivedPlans = studyPlans.filter((p) => !!p.isArchived);

  const displayedPlans = (activeFilter === "ativos" ? activePlans : archivedPlans).filter(
    (p) => {
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.organ && p.organ.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.cargo && p.cargo.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchQuery;
    }
  );

  const handleArchiveToggle = (planId: string) => {
    archiveStudyPlan(planId);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    try {
      setIsDeleting(true);
      if (planToDelete.image_path) {
        await deletePlanImage(planToDelete.image_path).catch(() => {});
      }
      deleteStudyPlan(planToDelete.id);
      setPlanToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir plano:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Planos de Estudo
          </h1>
        </div>

        <button
          onClick={onOpenCreateWizard}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 active:scale-98 transition shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Criar Novo Plano</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80 shrink-0">
          <button
            onClick={() => setActiveFilter("ativos")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              activeFilter === "ativos"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <span>Meus Planos</span>
            <span className="rounded-full bg-zinc-200/70 px-1.5 py-0.2 text-[10px] dark:bg-zinc-800">
              {activePlans.length}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("arquivados")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              activeFilter === "arquivados"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Arquivados</span>
            <span className="rounded-full bg-zinc-200/70 px-1.5 py-0.2 text-[10px] dark:bg-zinc-800">
              {archivedPlans.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, órgão ou cargo..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#F59E0B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </div>
      </div>

      {/* Plans Grid or Empty State */}
      {displayedPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-[#F59E0B]">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
            {activeFilter === "ativos"
              ? "Você ainda não criou nenhum plano"
              : "Nenhum plano arquivado"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
            {activeFilter === "ativos"
              ? "Crie seu primeiro plano para começar a organizar sua preparação, disciplinas e ciclos de estudo."
              : "Os planos que você arquivar aparecerão aqui para consulta futura."}
          </p>
          {activeFilter === "ativos" && (
            <button
              onClick={onOpenCreateWizard}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Primeiro Plano</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayedPlans.map((plan) => {
            const edital = editais.find(
              (e) => e.id === plan.editalId || (plan.sourceEditalId && e.id === plan.sourceEditalId)
            );
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                edital={edital}
                studySessions={studySessions}
                onOpenPlan={onOpenPlan}
                onEditPlan={(p) => setEditingPlan(p)}
                onArchivePlan={handleArchiveToggle}
                onDeletePlan={(p) => setPlanToDelete(p)}
              />
            );
          })}
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
                Excluir plano "{planToDelete.name}"?
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Esta ação excluirá o plano de estudo. O histórico e matérias vinculadas poderão ser removidos permanentemente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition"
              >
                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
