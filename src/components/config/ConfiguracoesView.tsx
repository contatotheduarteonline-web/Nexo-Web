import React, { useState, useEffect } from "react";
import { useStudy } from "../../context/StudyContext";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Settings,
  Clock,
  Target,
  Repeat,
  Download,
  Upload,
  RotateCcw,
  Check,
  Shield,
  Save,
  Key,
  LogOut,
  Trash2,
  Lock,
  Camera,
  Database,
  CheckCircle2,
} from "lucide-react";
import { ProfilePictureModal } from "../modals/ProfilePictureModal";

export const ConfiguracoesView: React.FC = () => {
  const {
    userSettings,
    updateUserSettings,
    exportBackup,
    importBackup,
    resetToInitialData,
  } = useStudy();

  const { user, logout, updateProfile, isAdmin } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<"perfil" | "revisoes" | "conta" | "dados">("perfil");
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackup(content);
        if (success) {
          alert("Backup do NEXO restaurado com sucesso!");
        } else {
          alert("Erro: Arquivo de backup inválido.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 dark:border-[#292929]">
        <div>
          <h1 className="text-xl font-black text-[#111111] dark:text-white">
            Configurações
          </h1>
        </div>

        {isSavedToast && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            Configurações salvas!
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-2 overflow-x-auto dark:border-[#292929]">
        <button
          onClick={() => setActiveSubTab("perfil")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === "perfil"
              ? "border-[#F59E0B] text-[#F59E0B] dark:border-[#F59E0B] dark:text-white"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] dark:text-[#A6A6A6] dark:hover:text-white"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Perfil</span>
        </button>

        <button
          onClick={() => setActiveSubTab("revisoes")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === "revisoes"
              ? "border-[#F59E0B] text-[#F59E0B] dark:border-[#F59E0B] dark:text-white"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] dark:text-[#A6A6A6] dark:hover:text-white"
          }`}
        >
          <Repeat className="h-4 w-4" />
          <span>Revisões Espaçadas</span>
        </button>

        <button
          onClick={() => setActiveSubTab("conta")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === "conta"
              ? "border-[#F59E0B] text-[#F59E0B] dark:border-[#F59E0B] dark:text-white"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] dark:text-[#A6A6A6] dark:hover:text-white"
          }`}
        >
          <Key className="h-4 w-4" />
          <span>Conta & Segurança</span>
        </button>

        <button
          onClick={() => setActiveSubTab("dados")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === "dados"
              ? "border-[#F59E0B] text-[#F59E0B] dark:border-[#F59E0B] dark:text-white"
              : "border-transparent text-[#6B6B6B] hover:text-[#111111] dark:text-[#A6A6A6] dark:hover:text-white"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Backup & Dados</span>
        </button>
      </div>

      {/* Tab: Perfil */}
      {activeSubTab === "perfil" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar / Foto de Perfil Card */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 dark:border-[#292929] dark:bg-[#0F172A] flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative group cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#FBBF24] text-2xl font-black text-white shadow-md overflow-hidden border-2 border-[#F59E0B]">
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
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition duration-150"
                title="Alterar foto"
              >
                <Camera className="h-6 w-6" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] dark:text-white">
                Foto de Perfil do Operador
              </h3>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A6A6A6]">
                Faça o upload de uma foto própria ou selecione um dos avatares táticos disponíveis.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-[#F59E0B] dark:text-[#FBBF24] hover:bg-amber-500/20 transition"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Alterar Foto de Perfil
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 dark:border-[#292929] dark:bg-[#0F172A]">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] dark:text-white">
              Informações do Usuário
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase text-[#6B6B6B] dark:text-[#A6A6A6]">
                  Primeiro Nome
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: João"
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 px-3.5 text-xs text-[#111111] focus:border-[#F59E0B] focus:bg-white focus:outline-hidden dark:border-[#292929] dark:bg-[#1E293B] dark:text-white dark:focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#6B6B6B] dark:text-[#A6A6A6]">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  disabled
                  value={userEmail}
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#E8E8E8] py-2.5 px-3.5 text-xs text-[#6B6B6B] cursor-not-allowed dark:border-[#292929] dark:bg-[#101010] dark:text-[#6B6B6B]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-6 py-2.5 text-xs font-bold text-white shadow-xs"
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
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 dark:border-[#292929] dark:bg-[#0F172A]">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] dark:text-white">
              Curva do Esquecimento & Intervalos
            </h3>
            <p className="mt-1 text-xs text-[#6B6B6B] dark:text-[#A6A6A6]">
              Configure a periodicidade (em dias) na qual os tópicos finalizados entrarão automaticamente na sua fila de revisões.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {reviewIntervals.map((d) => (
                <div
                  key={d}
                  className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-1.5 text-xs font-bold text-[#111111] dark:border-[#292929] dark:bg-[#1E293B] dark:text-white"
                >
                  <span className="font-mono">{d} {d === 1 ? "dia (24h)" : `dias`}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterval(d)}
                    className="text-[#6B6B6B] hover:text-red-500"
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
                className="w-32 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-mono text-[#111111] focus:border-[#F59E0B] focus:bg-white focus:outline-hidden dark:border-[#292929] dark:bg-[#1E293B] dark:text-white dark:focus:border-[#F59E0B]"
              />
              <button
                type="button"
                onClick={handleAddInterval}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-black hover:bg-amber-50 hover:text-[#F59E0B] hover:border-amber-300 dark:border-[#292929] dark:bg-[#1E293B] dark:text-white dark:hover:bg-[#292929]"
              >
                + Adicionar Intervalo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Conta & Segurança */}
      {activeSubTab === "conta" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 dark:border-[#292929] dark:bg-[#0F172A]">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] dark:text-white">
              Alterar Senha de Acesso
            </h3>

            {securitySuccess && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                {securitySuccess}
              </div>
            )}

            {securityError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                {securityError}
              </div>
            )}

            <form onSubmit={handleSavePassword} className="mt-4 space-y-4 max-w-md">
              <div>
                <label className="text-xs font-bold uppercase text-[#6B6B6B] dark:text-[#A6A6A6]">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 px-3.5 text-xs text-[#111111] focus:border-[#111111] focus:bg-white focus:outline-hidden dark:border-[#292929] dark:bg-[#1E293B] dark:text-white dark:focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#6B6B6B] dark:text-[#A6A6A6]">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 px-3.5 text-xs text-[#111111] focus:border-[#111111] focus:bg-white focus:outline-hidden dark:border-[#292929] dark:bg-[#1E293B] dark:text-white dark:focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#6B6B6B] dark:text-[#A6A6A6]">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 px-3.5 text-xs text-[#111111] focus:border-[#111111] focus:bg-white focus:outline-hidden dark:border-[#292929] dark:bg-[#1E293B] dark:text-white dark:focus:border-white"
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#242424] dark:bg-white dark:text-[#111111] dark:hover:bg-[#E5E5E5]"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Atualizar Senha</span>
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-950/10">
            <h3 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400">
              Zona de Ação Crítica
            </h3>
            <p className="mt-1 text-xs text-[#6B6B6B] dark:text-[#A6A6A6]">
              Encerre sessões ativas ou desconecte sua conta com segurança.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-[#292929] dark:bg-[#0F172A] dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" />
                <span>Desconectar em Todos os Dispositivos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backup & Dados */}
      {activeSubTab === "dados" && (
        <div className="space-y-6">
          {/* Automatic Protection Card */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 dark:border-[#292929] dark:bg-[#0F172A]">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Database className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] dark:text-white">
                    Backup & Sincronização Inteligente
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    100% Automático
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#6B6B6B] dark:text-[#A6A6A6]">
                  Todos os seus editais verticalizados, horas de estudo, questões resolvidas, revisões espaçadas, ciclo e simulados são salvos e preservados automaticamente em segundo plano pela inteligência da plataforma, sem necessidade de ações manuais.
                </p>
              </div>
            </div>
          </div>

          {/* Manual Export & Restore Card */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 dark:border-[#292929] dark:bg-[#0F172A]">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] dark:text-white">
              Exportação & Restauração Manual de Arquivos
            </h3>
            <p className="mt-1 text-xs text-[#6B6B6B] dark:text-[#A6A6A6]">
              Exporte uma cópia avulsa em formato JSON para transferir entre computadores ou importe um arquivo salvo anteriormente.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={exportBackup}
                className="flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#242424] dark:bg-white dark:text-[#111111] dark:hover:bg-[#E5E5E5]"
              >
                <Download className="h-4 w-4" />
                <span>Exportar Arquivo Local (JSON)</span>
              </button>

              <label
                htmlFor="config-backup-file-input"
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-2.5 text-xs font-bold text-[#111111] hover:bg-[#E8E8E8] dark:border-[#292929] dark:bg-[#1E293B] dark:text-white dark:hover:bg-[#292929]"
              >
                <Upload className="h-4 w-4" />
                <span>Importar Arquivo JSON</span>
                <input
                  id="config-backup-file-input"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Clean slate & Reset */}
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 dark:border-red-900/30 dark:bg-red-950/10">
            <h3 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400">
              Gerenciamento e Limpeza de Dados do Usuário
            </h3>
            <p className="mt-1 text-xs text-[#6B6B6B] dark:text-[#A6A6A6]">
              Opções para apagar histórico, zerar horas e questões acumuladas ou reiniciar sua conta completamente limpa (clean slate).
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Deseja apagar todo o histórico de estudos e sessões cronometradas?")) {
                    resetToInitialData();
                    alert("Histórico e registros zerados com sucesso!");
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Zerar Todos os Dados & Histórico</span>
              </button>
            </div>
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
