import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  X,
  Upload,
  Camera,
  Trash2,
  Check,
  User,
  Shield,
  Award,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Curated Tactical / Operational Presets with SVG data URLs
const PRESET_AVATARS = [
  {
    id: "tactical-1",
    name: "Operador Tático",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "tactical-2",
    name: "Agente Federal",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "tactical-3",
    name: "Investigadora",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "tactical-4",
    name: "Delegado",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "tactical-5",
    name: "Perita Criminal",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "tactical-6",
    name: "Comandante",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
  },
];

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateProfile } = useAuth();

  const [previewUrl, setPreviewUrl] = useState<string>(user?.avatarUrl || "");
  const [customUrlInput, setCustomUrlInput] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage("");
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("A imagem deve ter no máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.onerror = () => {
      setErrorMessage("Falha ao ler o arquivo de imagem.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setPreviewUrl(customUrlInput.trim());
    setCustomUrlInput("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      await updateProfile({ avatarUrl: previewUrl });
      onClose();
    } catch (err: any) {
      setErrorMessage("Erro ao salvar foto de perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      setPreviewUrl("");
      await updateProfile({ avatarUrl: "" });
      onClose();
    } catch (err: any) {
      setErrorMessage("Erro ao remover foto de perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0F172A] space-y-6 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#249D84]/10 text-[#249D84] dark:bg-[#249D84]/20">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Foto de Perfil
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize seu avatar na plataforma e no menu superior
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current / New Avatar Preview */}
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="relative group">
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-4 border-[#249D84] bg-gradient-to-tr from-[#249D84] to-[#52E3D6] text-3xl sm:text-4xl font-black text-[#0A0D12] shadow-xl overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar Preview"
                  className="h-full w-full object-cover"
                  onError={() => {
                    setErrorMessage("Não foi possível carregar a imagem da URL fornecida.");
                    setPreviewUrl("");
                  }}
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#111827] text-white dark:bg-white dark:text-[#111827] shadow-md hover:scale-110 transition"
              title="Carregar Imagem"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {user?.name || "Operador"}
            </h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Upload Zone (Drag & Drop or Click) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? "border-[#249D84] bg-[#249D84]/10"
              : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#151D2A]/50 hover:bg-slate-100 dark:hover:bg-[#182130]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#249D84]/10 text-[#249D84] mb-2">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Clique para enviar ou arraste sua foto aqui
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            PNG, JPG, GIF ou WEBP (Máx. 5MB)
          </p>
        </div>

        {/* Preset Tactical Avatars */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Ou escolha um Avatar de Perfil:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {PRESET_AVATARS.map((avatar) => {
              const isSelected = previewUrl === avatar.url;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setPreviewUrl(avatar.url)}
                  className={`group relative flex flex-col items-center p-1.5 rounded-2xl border transition-all ${
                    isSelected
                      ? "border-[#249D84] bg-[#249D84]/10 ring-2 ring-[#249D84]/30"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#151D2A]"
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="h-11 w-11 rounded-full object-cover shadow-2xs group-hover:scale-105 transition"
                  />
                  <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate max-w-full">
                    {avatar.name.split(" ")[0]}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#249D84] text-white text-[8px]">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct URL Input */}
        <form onSubmit={handleApplyCustomUrl} className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Ou cole o Link Direto de uma Imagem:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.jpg"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151D2A] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#249D84]"
              />
            </div>
            <button
              type="submit"
              disabled={!customUrlInput.trim()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition"
            >
              Aplicar
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {user?.avatarUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover Foto
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#249D84] to-[#2EC4B6] hover:opacity-95 disabled:opacity-50 transition shadow-sm"
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Gravando...
                </span>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  Salvar Foto
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
