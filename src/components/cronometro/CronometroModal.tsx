import React, { useEffect } from "react";
import { X } from "lucide-react";
import { ManualStudyModal } from "../modals/ManualStudyModal";

interface CronometroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Registro de Estudos como overlay popup.
 * O popup antigo agora utiliza o mesmo formulário completo do Registro de Estudo,
 * garantindo que qualquer entrada por "Iniciar Estudo" / "Estudar" tenha os
 * mesmos campos, revisões e sincronização do registro principal.
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
    <ManualStudyModal
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};
