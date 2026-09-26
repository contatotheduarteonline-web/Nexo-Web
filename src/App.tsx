/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ActiveTab } from "./types";
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
import { FloatingTimerWidget } from "./components/dashboard/FloatingTimerWidget";
import { EditalView } from "./components/edital/EditalView";
import { CronometroModal } from "./components/cronometro/CronometroModal";
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

  useGamificationTracker();

  // "Registro de Estudos" is an overlay popup on top of the last visited view.
  const [lastMainTab, setLastMainTab] = useState<ActiveTab>("dashboard");
  useEffect(() => {
    if (activeTab && activeTab !== "cronometro") {
      setLastMainTab(activeTab);
    }
  }, [activeTab]);
  const mainTab: ActiveTab = activeTab === "cronometro" ? lastMainTab : activeTab;

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNewEditalOpen, setIsNewEditalOpen] = useState(false);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [isManualStudyOpen, setIsManualStudyOpen] = useState(false);
  const [manualStudyDisciplineId, setManualStudyDisciplineId] = useState<string | undefined>(undefined);
  const [manualStudyTopicId, setManualStudyTopicId] = useState<string | undefined>(undefined);
  const [selectedDisciplineForTopic, setSelectedDisciplineForTopic] = useState<string | undefined>(undefined);

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
    switch (mainTab) {
      case "dashboard":
        return <DashboardView onOpenManualStudy={() => handleOpenManualStudy()} />;
      case "edital":
      case "edital_verticalizado":
        return <EditalView />;
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
      <GlobalWatermark />
      <GamificationToastContainer />
      <AchievementUnlockToast />

      <Header
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenNewEditalModal={() => setIsNewEditalOpen(true)}
        onOpenManualStudy={() => handleOpenManualStudy()}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          activeTab={mainTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto bg-[#F4F5F7] p-4 md:p-6 lg:p-7 dark:bg-[#11151F]">
          <div className="mx-auto max-w-7xl">{renderActiveView()}</div>
        </main>
      </div>

      {/* Mantém o relógio flutuante disponível fora da Home também. */}
      {mainTab !== "dashboard" && <FloatingTimerWidget />}

      <CronometroModal
        isOpen={activeTab === "cronometro"}
        onClose={() => setActiveTab(lastMainTab)}
      />

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
