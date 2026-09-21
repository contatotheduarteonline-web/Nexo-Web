import React from "react";
import {
  Home,
  Layers,
  BookOpen,
  FileCheck,
  CalendarRange,
  Timer,
  RotateCcw,
  History,
  TrendingUp,
  Award,
  Medal,
  Target,
  Bell,
  Settings,
} from "lucide-react";
import { ActiveTab } from "../../types";
import { useStudy } from "../../context/StudyContext";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { pendingReviewsCount } = useStudy();
  const { isAdmin } = useAuth();

  const menuSections = [
    {
      title: "PRINCIPAL",
      items: [
        { id: "dashboard", label: "Home", icon: Home },
        { id: "planos", label: "Planos", icon: Layers },
        { id: "disciplinas", label: "Disciplinas", icon: BookOpen },
      ],
    },
    {
      title: "EDITAL",
      items: [
        { id: "edital", label: "Edital", icon: FileCheck },
      ],
    },
    {
      title: "ROTINA",
      items: [
        { id: "planejamento", label: "Planejamento", icon: CalendarRange },
        { id: "cronometro", label: "Registro de Estudos", icon: Timer },
        {
          id: "revisoes",
          label: "Revisões",
          icon: RotateCcw,
          badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
        },
        { id: "historico", label: "Histórico", icon: History },
      ],
    },
    {
      title: "DESEMPENHO",
      items: [
        { id: "medalhas", label: "Medalhas e Conquistas", icon: Medal },
        { id: "estatisticas", label: "Estatísticas", icon: TrendingUp },
        { id: "simulados", label: "Simulados", icon: Award },
        { id: "metas", label: "Metas", icon: Target },
      ],
    },
    {
      title: "ORGANIZAÇÃO",
      items: [
        { id: "lembretes", label: "Lembretes", icon: Bell },
      ],
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId as ActiveTab);
    setIsCollapsed(true);
  };

  return (
    <>
      {/* Backdrop overlay when sidebar is open */}
      {!isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          className="fixed inset-0 top-16 z-30 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex w-[230px] flex-col justify-between border-r border-[#E4E7EC] bg-white shadow-xl transition-transform duration-200 ease-in-out dark:border-[#334155] dark:bg-[#1E293B] select-none ${
          isCollapsed ? "-translate-x-full pointer-events-none" : "translate-x-0"
        }`}
      >
        {/* Lista de Navegação */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4 scrollbar-thin">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              {/* Título de Seção */}
              <div className="px-2.5 pb-1 pt-1.5">
                <span className="text-[10px] font-semibold tracking-wider text-[#667085] uppercase dark:text-[#94A3B8]">
                  {section.title}
                </span>
              </div>

              {/* Itens do Menu */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected =
                    activeTab === item.id ||
                    (item.id === "edital" && activeTab === "edital_verticalizado") ||
                    (item.id === "planejamento" &&
                      (activeTab === "ciclo" || activeTab === "quadro_semanal"));

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`relative flex h-9 w-full items-center justify-between rounded-lg px-2.5 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#FEF3C7] text-[#F59E0B] font-medium dark:bg-[#F59E0B]/10 dark:text-[#F59E0B]"
                          : "text-[#667085] hover:bg-[#F7F8FA] hover:text-[#172033] dark:text-[#94A3B8] dark:hover:bg-[#161B28] dark:hover:text-white font-normal"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                          <Icon
                            className={`h-4 w-4 ${
                              isSelected
                                ? "text-[#F59E0B]"
                                : "text-[#667085] dark:text-[#94A3B8]"
                            }`}
                          />
                        </div>

                        <span className="truncate text-xs">{item.label}</span>
                      </div>

                      {/* Badge de Notificação / Revisões */}
                      {item.badge !== undefined && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[9px] font-semibold text-[#F59E0B] dark:bg-[#F59E0B]/20 dark:text-[#FBBF24]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Configurações */}
        <div className="border-t border-[#E7EAF0] p-2 dark:border-[#1F2636]">
          <button
            type="button"
            onClick={() => handleSelectTab("configuracoes")}
            className={`relative flex h-9 w-full items-center justify-between rounded-lg px-2.5 transition-colors cursor-pointer ${
              activeTab === "configuracoes"
                ? "bg-[#FEF3C7] text-[#F59E0B] font-medium dark:bg-[#F59E0B]/10 dark:text-[#F59E0B]"
                : "text-[#667085] hover:bg-[#F7F8FA] hover:text-[#172033] dark:text-[#94A3B8] dark:hover:bg-[#161B28] dark:hover:text-white font-normal"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Settings
                  className={`h-4 w-4 ${
                    activeTab === "configuracoes"
                      ? "text-[#F59E0B]"
                      : "text-[#667085] dark:text-[#94A3B8]"
                  }`}
                />
              </div>
              <span className="truncate text-xs">Configurações</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
