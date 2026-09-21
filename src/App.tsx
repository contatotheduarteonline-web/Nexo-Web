/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StudyProvider, useStudy } from "./context/StudyContext";
import { ToastProvider } from "./context/ToastContext";
import { AchievementQueueProvider } from "./context/AchievementQueueContext";
import { GamificationToastContainer } from "./components/common/GamificationToastContainer";
import { AchievementUnlockToast } from "./components/medalhas/AchievementUnlockToast";
import { useGamificationTracker } from "./hooks/useGamificationTracker";
import { LoginView } from "./components/auth/LoginView";
import { CadastroView } from "./components/auth/CadastroView";
import { FirstAccessOnboarding } from "./components/onboarding/FirstAccessOnboarding";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { DashboardView } from "./components/dashboard/DashboardView";
import { EditalView } from "./components/edital/EditalView";
import { CronometroView } from "./components/cronometro/CronometroView";
import { RevisoesView } from "./components/revisoes/RevisoesView";
import { PlanosView } from "./components/planos/PlanosView";
import { DiagnosticoView } from "./components/diagnostico/DiagnosticoView";
import { EstatisticasView } from "./components/estatisticas/EstatisticasView";
import { DisciplinasView } from "./components/disciplinas/DisciplinasView";
import { HistoricoView } from "./components/historico/HistoricoView";
import { PlanejamentoView } from "./components/planejamento/PlanejamentoView";
import { CicloView } from "./components/ciclo/CicloView";
import { QuadroSemanalView } from "./components/semanal/QuadroSemanalView";
import { SimuladosView } from "./components/simulados/SimuladosView";
import { MetasView } from "./components/metas/MetasView";
import { MedalhasView } from "./components/medalhas/MedalhasView";
import { LembretesView } from "./components/reminders/LembretesView";
import { ConfiguracoesView } from "./components/config/ConfiguracoesView";
import { GlobalWatermark } from "./components/brand/GlobalWatermark";
import { AiAssistantModal } from "./components/ai/AiAssistantModal";
import { NewEditalModal } from "./components/modals/NewEditalModal";
import { NewTopicModal } from "./components/modals/NewTopicModal";
import { ManualStudyModal } from "./components/modals/ManualStudyModal";

const AuthenticatedApp: React.FC = () => {
  const { activeTab, setActiveTab, isSidebarCollapsed, setIsSidebarCollapsed, studyPlans } = useStudy();
  const { user, isAdmin, hasSeenOnboarding, setHasSeenOnboarding } = useAuth();

  // Watch for gamification XP and Rank milestones across the entire app
  useGamificationTracker();

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNewEditalOpen, setIsNewEditalOpen] = useState(false);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [isManualStudyOpen, setIsManualStudyOpen] = useState(false);
  const [manualStudyDisciplineId, setManualStudyDisciplineId] = useState<string | undefined>(undefined);
  const [manualStudyTopicId, setManualStudyTopicId] = useState<string | undefined>(undefined);
  const [selectedDisciplineForTopic, setSelectedDisciplineForTopic] = useState<string | undefined>(undefined);

  // First Access Onboarding Guard:
  // Decided STRICTLY by users/{uid}.onboarding.completed.
  // studyPlans.length is NEVER used as a permanent condition to decide whether onboarding appears.
  // Legacy profiles without the onboarding object fall back to onboardingCompleted.
  const isOnboardingActive =
    Boolean(user) &&
    (user?.onboarding ? user.onboarding.completed === false : user?.onboardingCompleted === false);

  if (isOnboardingActive) {
    return <FirstAccessOnboarding />;
  }

  const handleOpenNewTopic = (disciplineId?: string) => {
    setSelectedDisciplineForTopic(disciplineId);
    setIsNewTopicOpen(true);
  };

  const handleOpenManualStudy = (disciplineId?: string, topicId?: string) => {
    setManualStudyDisciplineId(disciplineId);
    setManualStudyTopicId(topicId);
    setIsManualStudyOpen(true);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView onOpenManualStudy={() => handleOpenManualStudy()} />;
      case "edital":
      case "edital_verticalizado":
        return <EditalView />;
      case "cronometro":
        return <CronometroView />;
      case "revisoes":
        return <RevisoesView />;
      case "planos":
        return <PlanosView onOpenNewTopicModal={handleOpenNewTopic} />;
      case "disciplinas":
        return <DisciplinasView onOpenNewTopicModal={handleOpenNewTopic} />;
      case "diagnostico":
        return <DiagnosticoView />;
      case "estatisticas":
        return <EstatisticasView />;
      case "historico":
        return <HistoricoView />;
      case "planejamento":
        return <PlanejamentoView />;
      case "ciclo":
        return <CicloView />;
      case "quadro_semanal":
        return <QuadroSemanalView />;
      case "simulados":
        return <SimuladosView />;
      case "metas":
        return <MetasView />;
      case "medalhas":
        return <MedalhasView />;
      case "lembretes":
        return <LembretesView />;
      case "configuracoes":
        return <ConfiguracoesView />;
      default:
        return <DashboardView onOpenManualStudy={() => handleOpenManualStudy()} />;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#E9EAEC] font-sans text-[#172033] antialiased dark:bg-[#0F172A] dark:text-[#F1F5F9] relative">
      {/* Background Institutional Watermark Texture */}
      <GlobalWatermark />

      {/* Animated Gamification Toasts in Top Portal */}
      <GamificationToastContainer />

      {/* Console-Grade Achievement Unlock Popup (Bottom) */}
      <AchievementUnlockToast />

      {/* Top Header */}
      <Header
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenNewEditalModal={() => setIsNewEditalOpen(true)}
        onOpenManualStudy={() => handleOpenManualStudy()}
      />

      {/* Body Area with Sidebar and Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar below Topbar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Scrollable View Canvas */}
        <main
          className={`flex-1 overflow-y-auto bg-[#F4F5F7] p-4 md:p-6 lg:p-7 dark:bg-[#0F172A] ${
            activeTab === "dashboard" ? "dark:bg-[#0B0D14]" : ""
          }`}
        >
          <div className="mx-auto max-w-7xl">{renderActiveView()}</div>
        </main>
      </div>

      {/* Modals */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      <NewEditalModal
        isOpen={isNewEditalOpen}
        onClose={() => setIsNewEditalOpen(false)}
      />

      <NewTopicModal
        isOpen={isNewTopicOpen}
        disciplineId={selectedDisciplineForTopic}
        onClose={() => setIsNewTopicOpen(false)}
      />

      <ManualStudyModal
        isOpen={isManualStudyOpen}
        onClose={() => setIsManualStudyOpen(false)}
        preselectedDisciplineId={manualStudyDisciplineId}
        preselectedTopicId={manualStudyTopicId}
      />
    </div>
  );
};

const RootRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "cadastro">("login");

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#07090E] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide text-zinc-400">Conectando sessão segura...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === "cadastro") {
      return <CadastroView onGoToLogin={() => setAuthView("login")} />;
    }
    return <LoginView />;
  }

  return (
    <StudyProvider>
      <ToastProvider>
        <AchievementQueueProvider>
          <AuthenticatedApp />
        </AchievementQueueProvider>
      </ToastProvider>
    </StudyProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootRouter />
    </AuthProvider>
  );
}
