import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { GamificationToastData, GamificationToastType } from "../types";

interface ToastContextType {
  toasts: GamificationToastData[];
  showToast: (toast: Omit<GamificationToastData, "id" | "timestamp">) => void;
  dismissToast: (id: string) => void;
  triggerRankUpToast: (rankTitle: string, rankLevel: number, rankIcon: string) => void;
  triggerXpMilestoneToast: (xpGained: number, totalXp: number, label?: string) => void;
  triggerBadgeUnlockToast: (badgeTitle: string, badgeIcon: string, desc: string) => void;
  triggerDisciplineCompletedToast: (disciplineName: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<GamificationToastData[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fireConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.15, x: 0.5 },
        colors: ["#FF6B00", "#FFA726", "#F59E0B", "#8B5CF6", "#10B981"],
        disableForReducedMotion: true,
        zIndex: 9999,
      });
    } catch {
      // Ignored if canvas-confetti fails in test environment
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (toastData: Omit<GamificationToastData, "id" | "timestamp">) => {
      const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const newToast: GamificationToastData = {
        ...toastData,
        id,
        timestamp: Date.now(),
      };

      setToasts((prev) => {
        // Keep maximum 3 toasts visible at once
        const updated = [newToast, ...prev.slice(0, 2)];
        return updated;
      });

      // Auto dismiss after 4.5 seconds
      const timeout = setTimeout(() => {
        dismissToast(id);
      }, 4500);

      timeoutsRef.current.set(id, timeout);
    },
    [dismissToast]
  );

  const triggerRankUpToast = useCallback(
    (rankTitle: string, rankLevel: number, rankIcon: string) => {
      showToast({
        type: "rank_up",
        title: "Novo nível alcançado",
        subtitle: `Nível ${rankLevel}: ${rankTitle}`,
        icon: rankIcon || "trendingup",
        badgeStyle: "from-orange-500 to-amber-500",
      });
    },
    [showToast]
  );

  const triggerXpMilestoneToast = useCallback(
    (xpGained: number, totalXp: number, label?: string) => {
      showToast({
        type: "xp_milestone",
        title: label || "Progresso nos Estudos",
        subtitle: `+${xpGained.toLocaleString("pt-BR")} XP • Total: ${totalXp.toLocaleString("pt-BR")} XP`,
        icon: "zap",
        badgeStyle: "from-orange-500 to-amber-500",
      });
    },
    [showToast]
  );

  const triggerBadgeUnlockToast = useCallback(
    (badgeTitle: string, badgeIcon: string, desc: string) => {
      showToast({
        type: "badge_unlock",
        title: "Conquista Desbloqueada",
        subtitle: `${badgeTitle}: ${desc}`,
        icon: badgeIcon || "check",
        badgeStyle: "from-orange-500 to-amber-500",
      });
    },
    [showToast]
  );

  const triggerDisciplineCompletedToast = useCallback(
    (disciplineName: string) => {
      showToast({
        type: "discipline_completed",
        title: "Disciplina Concluída",
        subtitle: `Você concluiu todo o conteúdo de ${disciplineName}.`,
        icon: "book",
        badgeStyle: "from-emerald-500 to-teal-500",
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        triggerRankUpToast,
        triggerXpMilestoneToast,
        triggerBadgeUnlockToast,
        triggerDisciplineCompletedToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
