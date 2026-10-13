import React, { useState, useRef, useEffect } from "react";
import { Globe, Plus, Check, ChevronDown } from "lucide-react";
import { useStudy } from "../../context/StudyContext";

interface DashboardHeaderActionsProps {
  onOpenManualStudy: () => void;
}

export const DashboardHeaderActions: React.FC<DashboardHeaderActionsProps> = ({
  onOpenManualStudy,
}) => {
  const { studyPlans, activePlan, activeEdital, setActivePlanId, getPlanImageUrl, isPlanImageLoading } = useStudy();
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const customImageUrl = activePlan ? getPlanImageUrl(activePlan.id) : null;
  const hasCustom = Boolean(activePlan && (activePlan.hasCustomImage || activePlan.imageRef));
  const isImageLoading = hasCustom && !customImageUrl && activePlan
    ? isPlanImageLoading(activePlan.id)
    : false;
  const planImage = customImageUrl || activePlan?.imageUrl || activeEdital?.imageUrl;

  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

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
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          id="btn-dashboard-seletor-plano"
          onClick={() => setOpenDropdown((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#263447] bg-[#1D2B40] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0B1120] cursor-pointer"
        >
          {isImageLoading ? (
            <span className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-[#263447]" />
          ) : planImage ? (
            <img
              src={planImage}
              alt={activePlan?.name || "Plano"}
              className="h-5 w-5 shrink-0 rounded-full object-cover"
            />
          ) : (
            <Globe className="h-4 w-4 shrink-0 text-[#527DFF]" />
          )}
          <span className="max-w-[160px] truncate">{activePlan?.name || "Meu Plano"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#93A2B7]" />
        </button>
        {openDropdown && (
          <div className="absolute right-0 top-11 z-30 w-64 rounded-xl border border-[#263447] bg-[#1D2B40] p-1.5 shadow-xl">
            {studyPlans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePlanId(p.id);
                  setOpenDropdown(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white transition hover:bg-[#0B1120] cursor-pointer"
              >
                <span className="truncate">{p.name}</span>
                {p.id === activePlan?.id && <Check className="h-4 w-4 text-[#2BBF8A]" />}
              </button>
            ))}
            {studyPlans.length === 0 && (
              <span className="block px-3 py-2 text-[12px] text-[#93A2B7]">
                Nenhum plano criado
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
