import React, { useRef, useState } from "react";
import { Upload, Trash2, Shield, Loader2, Check, Clock } from "lucide-react";
import { validatePlanImage, resolvePlanImageUrl } from "../../utils/planImageStorage";

interface PlanImageUploaderProps {
  currentImagePath?: string | null;
  currentImageUrl?: string | null;
  currentSavedImage?: string | null;
  previewUrl: string | null;
  isRemoved: boolean;
  isUploading: boolean;
  error?: string | null;
  onFileSelect: (file: File, preview: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export const PlanImageUploader: React.FC<PlanImageUploaderProps> = ({
  currentImagePath,
  currentImageUrl,
  currentSavedImage,
  previewUrl,
  isRemoved,
  isUploading,
  error,
  onFileSelect,
  onRemove,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Determine whether there's a saved persistent image
  const savedUrl = currentSavedImage || resolvePlanImageUrl(currentImagePath || currentImageUrl);
  const hasSavedImage = Boolean(savedUrl && !isRemoved);

  // Active visual image: preview takes precedence while editing, then saved image
  const displayUrl = isRemoved ? null : previewUrl || savedUrl || null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePlanImage(file);
    if (!validation.valid) {
      setInternalError(validation.error || "Selecione uma imagem JPG, PNG ou WebP de até 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Ephemeral object URL exclusively for temporary local preview
    const objectUrl = URL.createObjectURL(file);
    onFileSelect(file, objectUrl);
  };

  const handleChooseClick = () => {
    if (disabled || isUploading) return;
    setInternalError(null);
    fileInputRef.current?.click();
  };

  const handleRemoveClick = () => {
    if (disabled || isUploading) return;
    setInternalError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemove();
  };

  const displayError = internalError || error;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F9FAFB] p-4 dark:border-[#263447] dark:bg-[#1D2B40]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* 96x96 Image / Icon Container */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs dark:border-[#263447] dark:bg-[#1D2B40]">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Capa do Plano"
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 text-[#F4B544] dark:from-amber-500/20 dark:to-amber-600/10 dark:text-[#F4B544]">
              <Shield className="h-10 w-10 text-[#F4B544] dark:text-[#F4B544]" />
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Info & Action Buttons */}
        <div className="flex-1 space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white dark:text-white">
                Imagem do plano
              </h3>
              
              {/* Only show 'Definida' after write to Firestore has completed */}
              {hasSavedImage && !previewUrl && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-[#15382F] border border-[#2BBF8A]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#2BBF8A] dark:bg-[#2BBF8A]/15 dark:text-[#2BBF8A]">
                  <Check className="h-2.5 w-2.5" />
                  Definida
                </span>
              )}

              {/* Local unsaved preview badge */}
              {previewUrl && !isRemoved && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#342B1C] border border-[#F4B544]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#F4B544] dark:bg-[#527DFF]/15 dark:text-[#F4B544]">
                  <Clock className="h-2.5 w-2.5" />
                  Prévia selecionada (salve para persistir)
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-white dark:text-white">
              Escolha uma imagem para identificar este objetivo (JPG, PNG ou WebP até 5MB).
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={handleInputChange}
              className="hidden"
              disabled={disabled || isUploading}
            />

            <button
              type="button"
              onClick={handleChooseClick}
              disabled={disabled || isUploading}
              className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-1.5 text-xs font-bold text-[#93A2B7] shadow-2xs transition hover:bg-[#F3F4F6] disabled:opacity-50 dark:border-[#263447] dark:bg-[#1D2B40] dark:text-white dark:hover:bg-[#172235] cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processando e salvando...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 text-[#F4B544] dark:text-[#F4B544]" />
                  <span>{displayUrl ? "Trocar imagem" : "Escolher imagem"}</span>
                </>
              )}
            </button>

            {displayUrl && (
              <button
                type="button"
                onClick={handleRemoveClick}
                disabled={disabled || isUploading}
                className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#F16D75] transition hover:bg-[#3B2029] disabled:opacity-50 dark:text-[#F16D75] dark:hover:bg-[#F16D75]/30 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remover</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="mt-2.5 rounded-xl bg-[#3B2029] p-2.5 text-xs font-medium text-[#F16D75] dark:bg-[#F16D75]/40 dark:text-[#F16D75]">
          {displayError}
        </div>
      )}
    </div>
  );
};
