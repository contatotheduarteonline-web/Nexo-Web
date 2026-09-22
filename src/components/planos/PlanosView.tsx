import React, { useState, useEffect } from "react";
import { useStudy } from "../../context/StudyContext";
import { StudyPlan } from "../../types";
import { PlanosOverview } from "./PlanosOverview";
import { PlanDetailView } from "./PlanDetailView";
import { CreatePlanWizardModal } from "../modals/CreatePlanWizardModal";
import { EditPlanModal } from "../modals/EditPlanModal";
import { deletePlanImage } from "../../utils/planImageStorage";
import { AlertTriangle } from "lucide-react";

interface PlanosViewProps {
  onOpenNewTopicModal?: (disciplineId?: string) => void;
}

export const PlanosView: React.FC<PlanosViewProps> = ({ onOpenNewTopicModal }) => {
  const {
    studyPlans,
    activePlan,
    setActivePlanId,
    archiveStudyPlan,
    deleteStudyPlan,
  } = useStudy();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<StudyPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // If activePlan is set or changed externally, we can default or view
  const currentPlan = studyPlans.find((p) => p.id === selectedPlanId);

  const handleOpenPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setActivePlanId(planId);
  };

  const handleBackToOverview = () => {
    setSelectedPlanId(null);
  };

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
      if (selectedPlanId === planToDelete.id) {
        setSelectedPlanId(null);
      }
      setPlanToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir plano:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full">
      {currentPlan ? (
        <PlanDetailView
          plan={currentPlan}
          onBack={handleBackToOverview}
          onEditPlan={(p) => setEditingPlan(p)}
          onArchivePlan={handleArchiveToggle}
          onDeletePlan={(p) => setPlanToDelete(p)}
          onOpenNewTopicModal={onOpenNewTopicModal}
        />
      ) : (
        <PlanosOverview
          onOpenPlan={handleOpenPlan}
          onOpenCreateWizard={() => setIsCreateWizardOpen(true)}
        />
      )}

      {/* Create Plan Wizard Modal */}
      <CreatePlanWizardModal
        isOpen={isCreateWizardOpen}
        onClose={() => setIsCreateWizardOpen(false)}
      />

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
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#252B38] space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
                Excluir plano "{planToDelete.name}"?
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Esta ação excluirá o plano de estudo permanentemente.
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
