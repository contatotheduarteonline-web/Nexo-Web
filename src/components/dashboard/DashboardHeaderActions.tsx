import React from "react";
import { Plus } from "lucide-react";
import { useStudy } from "../../context/StudyContext";
import { PlanSelector } from "../common/PlanSelector";

interface DashboardHeaderActionsProps {
  onOpenManualStudy: () => void;
}

export const DashboardHeaderActions: React.FC<DashboardHeaderActionsProps> = ({
  onOpenManualStudy,
}) => {
  const { studyPlans, activePlan, activeEdital, setActivePlanId, getPlanImageUrl, isPlanImageLoading } = useStudy();

  const customImageUrl = activePlan ? getPlanImageUrl(activePlan.id) : null;
  const hasCustom = Boolean(activePlan && (activePlan.hasCustomImage || activePlan.imageRef));
  const isImageLoading = hasCustom && !customImageUrl && activePlan
    ? isPlanImageLoading(activePlan.id)
    : false;
  const planImage = customImageUrl || activePlan?.imageUrl || activeEdital?.imageUrl;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        id="btn-dashboard-adicionar-estudo"
        onClick={onOpenManualStudy}
        className="nx-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-[13px] cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Adicionar Estudo
      </button>

      {/* Plano ativo */}
      <PlanSelector
        triggerId="btn-dashboard-seletor-plano"
        items={studyPlans.map((p) => ({
          id: p.id,
          title: p.name,
          imageUrl: getPlanImageUrl(p.id) || p.imageUrl,
        }))}
        activeId={activePlan?.id}
        activeLabel={activePlan?.name || "Meu Plano"}
        imageUrl={planImage}
        isLoading={isImageLoading}
        onSelect={setActivePlanId}
      />
    </div>
  );
};
