import React, { useState, useEffect } from "react";
import { useStudy } from "../../context/StudyContext";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Repeat,
  Check,
  Save,
  Key,
  Lock,
  Camera,
} from "lucide-react";
import { ProfilePictureModal } from "../modals/ProfilePictureModal";

const CARD = "rounded-2xl border border-[#384154] bg-[#171B25] p-6";
const CARD_TITLE = "text-sm font-black uppercase tracking-wider text-white";
const CARD_TEXT = "text-xs text-white/60";
const LABEL = "text-xs font-bold uppercase text-white/50";
const INPUT =
  "mt-1 w-full rounded-xl border border-[#384154] bg-[#252B38] py-2.5 px-3.5 text-xs text-white placeholder:text-white/30 focus:border-[#F3AA2D] focus:outline-hidden transition-colors";

export const ConfiguracoesView: React.FC = () => {
  const {
    userSettings,
    updateUserSettings,
  } = useStudy();

  const { user, updateProfile, isAdmin } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<"perfil" | "revisoes" | "conta">("perfil");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Profile states
  const [userName, setUserName] = useState(() => {
    const raw = user?.name || userSettings.userName || "João";
    return raw.split(" ")[0] || raw;
  });
  const [userEmail, setUserEmail] = useState(user?.email || userSettings.userEmail || "");

  // Synchronize when user changes
  useEffect(() => {
    if (user?.name) {
      const firstName = user.name.split(" ")[0] || user.name;
      setUserName(firstName);
    }
  }, [user?.name]);

  // Password & Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [securityError, setSecurityError] = useState("");

  // Review intervals
  const [reviewIntervals, setReviewIntervals] = useState<number[]>(() => {
    if (Array.isArray(userSettings.reviewIntervalsDays)) {
      return (userSettings.reviewIntervalsDays as any[]).map(Number).filter((n) => !isNaN(n));
    }
    return [1, 7, 15, 30, 60];
  });
  const [newInterval, setNewInterval] = useState<number | "">("");

  const [isSavedToast, setIsSavedToast] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserSettings({
      ...userSettings,
      userName: userName.trim(),
    });
    updateProfile({ name: userName.trim() });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError("");
    setSecuritySuccess("");

    if (!newPassword || newPassword.length < 6) {
      setSecurityError("A nova senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError("A confirmação de senha não confere.");
      return;
    }

    setSecuritySuccess("Senha atualizada com sucesso!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setSecuritySuccess(""), 3000);
  };

  const handleAddInterval = () => {
    if (typeof newInterval === "number" && newInterval > 0 && !reviewIntervals.includes(newInterval)) {
      const updated = [...reviewIntervals, newInterval].sort((a, b) => a - b);
      setReviewIntervals(updated);
      setNewInterval("");
    }
  };

  const handleRemoveInterval = (intervalToRemove: number) => {
    setReviewIntervals(reviewIntervals.filter((i) => i !== intervalToRemove));
  };

  const TAB_BUTTON = (active: boolean) =>
    `flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
      active
        ? "border-[#F3AA2D] text-[#F3AA2D]"
        : "border-transparent text-white/50 hover:text-white"
    }`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#384154] pb-4">
        <div>
          <h1 className="text-xl font-black text-white">Configurações</h1>
        </div>

        {isSavedToast && (
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-400">
            <Check className="h-4 w-4" />
            Configurações salvas!
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-[#384154] gap-2 overflow-x-auto">
        <button onClick={() => setActiveSubTab("perfil")} className={TAB_BUTTON(activeSubTab === "perfil")}>
          <User className="h-4 w-4" />
          <span>Perfil</span>
        </button>

        <button onClick={() => setActiveSubTab("revisoes")} className={TAB_BUTTON(activeSubTab === "revisoes")}>
          <Repeat className="h-4 w-4" />
          <span>Revisões Espaçadas</span>
        </button>

        <button onClick={() => setActiveSubTab("conta")} className={TAB_BUTTON(activeSubTab === "conta")}>
          <Key className="h-4 w-4" />
          <span>Segurança</span>
        </button>
      </div>

      {/* Tab: Perfil */}
      {activeSubTab === "perfil" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar / Foto de Perfil Card */}
          <div className={`${CARD} relative overflow-hidden`}>
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#F3AA2D]/[0.06] blur-2xl" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-center gap-5">
              <div className="relative group cursor-pointer shrink-0" onClick={() => setIsProfileModalOpen(true)}>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#F3AA2D] to-[#FBBF24] text-2xl font-black text-[#11151F] shadow-md overflow-hidden ring-2 ring-[#F3AA2D]/40 ring-offset-4 ring-offset-[#171B25]">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || "Perfil"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                  )}
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition duration-150"
                  title="Alterar foto"
                >
                  <Camera className="h-6 w-6" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="text-base font-bold text-white">
                  {user?.name || userName || "Operador"}
                </h3>
                <p className="text-xs text-white/50">{userEmail}</p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#F3AA2D] px-4 py-2 text-xs font-bold text-[#11151F] hover:bg-[#D98F20] transition"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Alterar Foto de Perfil
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={CARD}>
            <h3 className={CARD_TITLE}>Informações do Usuário</h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Primeiro Nome</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: João"
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL}>E-mail de Acesso</label>
                <input
                  type="email"
                  disabled
                  value={userEmail}
                  className="mt-1 w-full cursor-not-allowed rounded-xl border border-[#384154] bg-[#11151F] py-2.5 px-3.5 text-xs text-white/40"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[#F3AA2D] hover:bg-[#D98F20] px-6 py-2.5 text-xs font-bold text-[#11151F] shadow-xs transition"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Revisões */}
      {activeSubTab === "revisoes" && (
        <div className="space-y-6">
          <div className={CARD}>
            <h3 className={CARD_TITLE}>Curva do Esquecimento & Intervalos</h3>
            <p className={`mt-1 ${CARD_TEXT}`}>
              Configure a periodicidade (em dias) na qual os tópicos finalizados entrarão automaticamente na sua fila de revisões.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {reviewIntervals.map((d) => (
                <div
                  key={d}
                  className="flex items-center gap-2 rounded-xl border border-[#384154] bg-[#252B38] px-3.5 py-1.5 text-xs font-bold text-white"
                >
                  <span className="font-mono text-[#F3AA2D]">{d}</span>
                  <span className="text-white/70">{d === 1 ? "dia (24h)" : "dias"}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterval(d)}
                    className="text-white/40 hover:text-[#D84A4A] transition"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                placeholder="Ex: 45"
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value ? Number(e.target.value) : "")}
                className="w-32 rounded-xl border border-[#384154] bg-[#252B38] py-2 px-3 text-xs font-mono text-white placeholder:text-white/30 focus:border-[#F3AA2D] focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={handleAddInterval}
                className="rounded-xl border border-[#384154] bg-[#252B38] px-4 py-2 text-xs font-bold text-white hover:border-[#F3AA2D]/50 hover:text-[#F3AA2D] transition"
              >
                + Adicionar Intervalo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Segurança */}
      {activeSubTab === "conta" && (
        <div className="space-y-6">
          <div className={CARD}>
            <h3 className={CARD_TITLE}>Alterar Senha de Acesso</h3>

            {securitySuccess && (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400">
                {securitySuccess}
              </div>
            )}

            {securityError && (
              <div className="mt-3 rounded-xl border border-[#D84A4A]/40 bg-[#D84A4A]/10 p-3 text-xs font-bold text-[#D84A4A]">
                {securityError}
              </div>
            )}

            <form onSubmit={handleSavePassword} className="mt-4 space-y-4 max-w-md">
              <div>
                <label className={LABEL}>Senha Atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL}>Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL}>Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className={INPUT}
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#F3AA2D] px-5 py-2.5 text-xs font-bold text-[#11151F] hover:bg-[#D98F20] transition"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Atualizar Senha</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Picture Modal */}
      <ProfilePictureModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
