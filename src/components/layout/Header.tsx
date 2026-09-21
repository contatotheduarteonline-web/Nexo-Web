import React, { useState, useRef, useEffect } from "react";
import { useStudy } from "../../context/StudyContext";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  Bell,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  Camera,
} from "lucide-react";
import { Logo } from "../brand/Logo";
import { ProfilePictureModal } from "../modals/ProfilePictureModal";

interface HeaderProps {
  onOpenAiModal?: () => void;
  onOpenNewEditalModal?: () => void;
  onOpenManualStudy?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const {
    setActiveTab,
    toggleSidebar,
    pendingReviewsCount,
    pendingReviewsToday,
    reminders,
  } = useStudy();

  const { user, logout, isAdmin } = useAuth();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeReminders = reminders.filter((r) => !r.isCompleted);
  const totalNotifications = pendingReviewsCount + activeReminders.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E4E7EC] bg-white px-4 md:px-6 dark:border-[#334155] dark:bg-[#1E293B] transition-colors">
      {/* Lado Esquerdo: Somente Hamburger e Logo NEXO */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          title="Alternar menu lateral"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition-colors hover:bg-[#F7F8FA] hover:text-[#172033] dark:text-[#94A3B8] dark:hover:bg-[#161B28] dark:hover:text-white cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div
          onClick={() => setActiveTab("dashboard")}
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-85"
        >
          <Logo variant="compact" size="sm" />
        </div>
      </div>

      {/* Lado Direito: Seletor de Tema, Notificações e Perfil do Usuário */}
      <div className="flex items-center gap-2.5">
        {/* Notificações Bespoke */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileMenuOpen(false);
            }}
            title="Notificações"
            className="group relative flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-[#E4E7EC] bg-[#FAFAFC] text-[#667085] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[#D0D5DD] hover:bg-white hover:text-[#172033] active:scale-95 dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#94A3B8] dark:hover:border-[#334155] dark:hover:bg-[#1E293B] dark:hover:text-white cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105" />
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-tr from-[#D97706] to-[#F59E0B] ring-2 ring-white dark:ring-[#1E293B]" />
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-[#E7EAF0] bg-white p-3 shadow-lg z-50 dark:border-[#1F2636] dark:bg-[#111520]">
              <div className="flex items-center justify-between border-b border-[#E7EAF0] pb-2.5 dark:border-[#1F2636]">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#F59E0B]" />
                  <span className="text-xs font-semibold text-[#172033] dark:text-white">
                    Notificações
                  </span>
                </div>
                {totalNotifications > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-[#F59E0B] dark:bg-[#F59E0B]/15">
                    {totalNotifications} pendente{totalNotifications > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="max-h-72 divide-y divide-[#E7EAF0] overflow-y-auto py-1 dark:divide-[#1F2636]">
                {pendingReviewsToday.length > 0 && (
                  <div
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      setActiveTab("revisoes");
                    }}
                    className="flex cursor-pointer items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors dark:hover:bg-[#1E293B]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[#F59E0B] dark:bg-[#F59E0B]/15">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-slate-900 dark:text-white">
                        {pendingReviewsToday.length} Revisões para Hoje
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Mantenha sua curva de esquecimento sob controle.
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 self-center" />
                  </div>
                )}

                {activeReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      setActiveTab("lembretes");
                    }}
                    className="flex cursor-pointer items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors dark:hover:bg-[#1E293B]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[#F59E0B] dark:bg-[#F59E0B]/15">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {reminder.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Lembrete agendado
                      </p>
                    </div>
                  </div>
                ))}

                {totalNotifications === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="mx-auto mb-1.5 h-5 w-5 text-emerald-500" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">Tudo em dia</p>
                    <p className="text-[10px]">Nenhum lembrete ou revisão pendente.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-2 text-center dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    setActiveTab("lembretes");
                  }}
                  className="text-[11px] font-medium text-[#F59E0B] hover:underline cursor-pointer"
                >
                  Ver Todos os Lembretes &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Perfil do Usuário */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
              setIsNotificationsOpen(false);
            }}
            title={user?.name || "Perfil"}
            className="flex h-9 items-center gap-2 rounded-lg p-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <div className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full p-[1.5px] bg-gradient-to-tr from-[#D97706] via-[#FCD34D] to-[#C2410C] shadow-xs">
              <div className="h-full w-full rounded-full overflow-hidden bg-white dark:bg-[#111520] flex items-center justify-center">
                <img
                  src={
                    user?.avatarUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                  }
                  alt={user?.name || "João"}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <span className="hidden sm:inline max-w-[110px] truncate text-left font-semibold text-[13px] text-[#172033] dark:text-white">
              {user?.name?.split(" ")[0] || "João"}
            </span>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-[#E7EAF0] bg-white p-1.5 shadow-lg z-50 dark:border-[#1F2636] dark:bg-[#111520]">
              {/* User Header */}
              <div className="border-b border-[#E7EAF0] px-2.5 pb-2.5 pt-2 dark:border-[#1F2636]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsProfilePictureModalOpen(true);
                    }}
                    title="Alterar foto de perfil"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F59E0B] text-xs font-bold text-white overflow-hidden">
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
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition duration-150">
                      <Camera className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#172033] dark:text-white truncate">
                      {user?.name || "Estudante"}
                    </p>
                    <p className="truncate text-[10px] text-[#667085] dark:text-[#94A3B8]">
                      {user?.email || "aluno@nexo.com"}
                    </p>
                    <div className="mt-0.5">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-700 dark:bg-[#1A2234] dark:text-slate-300">
                        {isAdmin ? (
                          <>
                            <ShieldCheck className="h-2.5 w-2.5 text-[#F59E0B]" />
                            Administrador
                          </>
                        ) : (
                          <>
                            <User className="h-2.5 w-2.5 text-slate-400" />
                            Estudante
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setActiveTab("configuracoes");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#F7F8FA] hover:text-[#172033] dark:text-slate-300 dark:hover:bg-[#161B28] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  <span>Configurações</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsProfilePictureModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#1E293B] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5 text-slate-400" />
                  <span>Foto de Perfil</span>
                </button>
              </div>

              {/* Logout Action */}
              <div className="mt-1 border-t border-slate-100 pt-1 dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Picture Change Modal */}
      <ProfilePictureModal
        isOpen={isProfilePictureModalOpen}
        onClose={() => setIsProfilePictureModalOpen(false)}
      />
    </header>
  );
};


