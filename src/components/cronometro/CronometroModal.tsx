import React, { useEffect } from "react";
import { X } from "lucide-react";
import { CronometroView } from "./CronometroView";

interface CronometroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Registro de Estudos as an overlay popup.
 * Opened by "Iniciar Estudo" / "Estudar" actions — no longer a sidebar destination.
 */
export const CronometroModal: React.FC<CronometroModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0f12]/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#384154] bg-[#11151F] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#384154] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#F3AA2D]" />
            <h2 className="text-sm font-bold tracking-wide text-white uppercase">
              Registro de Estudos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white transition hover:bg-[#252B38] hover:text-white cursor-pointer"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-5 scrollbar-thin">
          <CronometroView />
        </div>
      </div>
    </div>
  );
};
