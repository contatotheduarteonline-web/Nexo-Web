import React, { useState, useEffect } from "react";
import { useStudy } from "../../context/StudyContext";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../lib/firebase";
import { StudyPlan } from "../../types";
import { X, Save, Trash2, Archive, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { PlanImageUploader } from "../planos/PlanImageUploader";
import {
  processAndCompressPlanImage,
  savePlanImageToFirestore,
  deletePlanImageFromFirestore,
} from "../../utils/planImageStorage";

interface EditPlanModalProps {
  plan: StudyPlan | null;
  onClose: () => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({ plan, onClose }) => {
  const { user } = useAuth();
  const {
    updateStudyPlan,
    deleteStudyPlan,
    archiveStudyPlan,
    getPlanImageUrl,
    setPlanImageCache,
  } = useStudy();

  const [name, setName] = useState("");
  const [organ, setOrgan] = useState("");
  const [cargo, setCargo] = useState("");
  const [banca, setBanca] = useState("");
  const [weeklyGoalHours, setWeeklyGoalHours] = useState<string | number>(20);

  // Image Upload States
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const currentSavedImage = plan
    ? getPlanImageUrl(plan.id) || plan.imageUrl || null
    : null;

  useEffect(() => {
    if (plan) {
      setName(plan.name || "");
      setOrgan(plan.organ || "");
      setCargo(plan.cargo || "");
      setBanca(plan.banca || "");
      setWeeklyGoalHours(plan.weeklyGoalHours !== undefined ? plan.weeklyGoalHours : 20);

      // Reset image states
      setSelectedImageFile(null);
      setPreviewUrl(null);
      setIsImageRemoved(false);
      setImageError(null);
      setFeedbackMessage(null);
      setIsConfirmingDelete(false);
      setIsDeleting(false);
    }
  }, [plan]);

  if (!plan) return null;

  const handleFileSelect = (file: File, objectUrl: string) => {
    setSelectedImageFile(file);
    setPreviewUrl(objectUrl);
    setIsImageRemoved(false);
    setImageError(null);
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setPreviewUrl(null);
    setIsImageRemoved(true);
    setImageError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError(null);
    setIsUploading(true);

    const uid = auth.currentUser?.uid || user?.id || plan.userId;
    if (!uid) {
      setImageError("Usuário não autenticado. Faça login novamente.");
      setIsUploading(false);
      return;
    }

    try {
      let hasCustomImage = plan.hasCustomImage;
      let imageRef = plan.imageRef;

      // 1. If a new image was selected, process and save to Firestore
      if (selectedImageFile) {
        const processed = await processAndCompressPlanImage(selectedImageFile);
        await savePlanImageToFirestore(
          uid,
          plan.id,
          processed.dataUrl,
          processed.mimeType,
          processed.sizeBytes
        );
        setPlanImageCache(plan.id, processed.dataUrl);
        hasCustomImage = true;
        imageRef = plan.id;
      } else if (isImageRemoved) {
        // 2. If the existing image was removed without replacement
        await deletePlanImageFromFirestore(uid, plan.id);
        setPlanImageCache(plan.id, null);
        hasCustomImage = false;
        imageRef = undefined;
      }

      // 3. Update the study plan in global state & persistence
      const parsedGoal =
        typeof weeklyGoalHours === "string"
          ? parseFloat(weeklyGoalHours.replace(",", ".")) || 20
          : Number(weeklyGoalHours) || 20;

      updateStudyPlan(plan.id, {
        name: name.trim() || plan.name,
        organ: organ.trim() || undefined,
        cargo: cargo.trim() || undefined,
        banca: banca.trim() || undefined,
        weeklyGoalHours: parsedGoal,
        hasCustomImage,
        imageRef,
        imageUrl: undefined,
        image_path: undefined,
      });

      setFeedbackMessage("Plano atualizado com sucesso.");
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      console.error("[NEXO PLAN IMAGE ERROR]: Erro ao salvar plano:", err);
      setImageError(err?.message || "Não foi possível salvar a imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const uid = auth.currentUser?.uid || user?.id || plan.userId;
      if (uid) {
        await deletePlanImageFromFirestore(uid, plan.id).catch(() => {});
      }
      setPlanImageCache(plan.id, null);
      deleteStudyPlan(plan.id);
      setIsConfirmingDelete(false);
      onClose();
    } catch (err) {
      console.error("Erro ao excluir plano:", err);
      deleteStudyPlan(plan.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = () => {
    archiveStudyPlan(plan.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1120]/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#263447] dark:bg-[#0B1120]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4 dark:border-[#263447]">
          <div>
            <h2 className="text-base font-bold text-white dark:text-white">
              {isConfirmingDelete ? "Excluir Plano de Estudos" : "Editar Dados do Plano"}
            </h2>
            <p className="text-xs text-white dark:text-white">
              {isConfirmingDelete
                ? "Confirmação de exclusão permanente"
                : "Atualize as informações do concurso, imagem e metas"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#718096] hover:bg-[#F1F5F9] dark:hover:bg-[#172235]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-[#15382F] p-3 text-xs font-bold text-[#2BBF8A] dark:bg-[#2BBF8A]/40 dark:text-[#2BBF8A]">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Confirmation Delete Screen */}
        {isConfirmingDelete ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3B2029] text-[#F16D75] dark:bg-[#F16D75]/40 dark:text-[#F16D75]">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-extrabold text-white dark:text-white">
                Deseja realmente excluir este plano?
              </h3>
              <p className="mt-2 max-w-md text-xs text-white dark:text-white">
                Você está prestes a excluir o plano{" "}
                <strong className="text-white dark:text-white">"{plan.name}"</strong>.
                Esta ação é irreversível e removerá as configurações e planejamento deste plano.
              </p>
            </div>

            <div className="rounded-xl border border-[#F16D75] bg-[#F16D75]/50 p-3.5 text-xs text-[#F16D75] dark:border-[#F16D75]/30 dark:bg-[#F16D75]/20 dark:text-[#F16D75]">
              ⚠️ Caso este plano esteja ativo, outro plano restante será automaticamente definido como plano ativo.
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-[#E2E8F0] pt-4 dark:border-[#263447]">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
                className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-[#F1F5F9] disabled:opacity-50 dark:border-[#263447] dark:text-[#93A2B7] dark:hover:bg-[#172235]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-xl bg-[#F16D75] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#F16D75] disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Sim, Excluir Plano</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Top Section: Plan Image Customization */}
            <PlanImageUploader
              currentSavedImage={currentSavedImage}
              previewUrl={previewUrl}
              isRemoved={isImageRemoved}
              isUploading={isUploading}
              error={imageError}
              onFileSelect={handleFileSelect}
              onRemove={handleRemoveImage}
              disabled={isUploading}
            />

            <div>
              <label className="text-xs font-bold text-white dark:text-white">
                Nome do Plano
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-2.5 text-xs text-[#93A2B7] focus:border-[#7DA2FF] focus:bg-white focus:outline-hidden dark:border-[#263447] dark:bg-[#172235] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-white dark:text-white">
                  Órgão / Instituição
                </label>
                <input
                  type="text"
                  value={organ}
                  onChange={(e) => setOrgan(e.target.value)}
                  placeholder="Ex: Órgão ou instituição..."
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-2.5 text-xs text-[#93A2B7] focus:border-[#7DA2FF] focus:bg-white focus:outline-hidden dark:border-[#263447] dark:bg-[#172235] dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white dark:text-white">
                  Cargo
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Cargo ou função pretendida..."
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-2.5 text-xs text-[#93A2B7] focus:border-[#7DA2FF] focus:bg-white focus:outline-hidden dark:border-[#263447] dark:bg-[#172235] dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white dark:text-white">
                  Banca
                </label>
                <input
                  type="text"
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                  placeholder="Ex: FGV, Cebraspe"
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-2.5 text-xs text-[#93A2B7] focus:border-[#7DA2FF] focus:bg-white focus:outline-hidden dark:border-[#263447] dark:bg-[#172235] dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white dark:text-white">
                  Meta Semanal (Horas)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 20 ou 7.5"
                  value={weeklyGoalHours}
                  onChange={(e) => setWeeklyGoalHours(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-2.5 text-xs text-[#93A2B7] focus:border-[#7DA2FF] focus:bg-white focus:outline-hidden dark:border-[#263447] dark:bg-[#172235] dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-4 dark:border-[#263447]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isUploading}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#718096] hover:bg-[#F1F5F9] disabled:opacity-50 dark:text-[#93A2B7] dark:hover:bg-[#172235]"
                >
                  <Archive className="h-3.5 w-3.5" />
                  {plan.isArchived ? "Desarquivar" : "Arquivar"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={isUploading}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#F16D75] hover:bg-[#3B2029] disabled:opacity-50 dark:hover:bg-[#F16D75]/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-[#F1F5F9] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-1.5 rounded-xl bg-[#527DFF] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#416CEB] disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

