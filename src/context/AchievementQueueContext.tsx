import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { GamificationBadge } from "../utils/gamificationBadges";
import { achievementAudio } from "../utils/achievementSound";

export interface AchievementUnlockItem {
  id: string; // unique toast instance id
  badgeId: string;
  title: string;
  desc: string;
  category: string;
  xpReward: number;
  unlockedAt?: string;
}

interface AchievementQueueContextType {
  currentAchievement: AchievementUnlockItem | null;
  queueLength: number;
  enqueueAchievement: (item: Omit<AchievementUnlockItem, "id">) => void;
  enqueueBadge: (badge: GamificationBadge) => void;
  dismissCurrent: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const AchievementQueueContext = createContext<AchievementQueueContextType | undefined>(undefined);

export const AchievementQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAchievement, setCurrentAchievement] = useState<AchievementUnlockItem | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => achievementAudio.isEnabled());
  const queueRef = useRef<AchievementUnlockItem[]>([]);
  const isPlayingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    achievementAudio.setEnabled(enabled);
    setSoundEnabledState(enabled);
  }, []);

  useEffect(() => {
    const handleSettingChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail) {
        setSoundEnabledState(customEvent.detail.enabled);
      }
    };
    window.addEventListener("achievement-sound-setting-changed", handleSettingChange);
    return () => {
      window.removeEventListener("achievement-sound-setting-changed", handleSettingChange);
    };
  }, []);

  const processNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      setCurrentAchievement(null);
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const nextItem = queueRef.current.shift()!;
    setCurrentAchievement(nextItem);

    // Play original, refined acoustic chime for this specific achievement
    achievementAudio.playUnlockSound();

    // Display for 4.2 seconds then slide down and trigger next in queue
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrentAchievement(null);
      // Clean 300ms gap before next badge in queue appears
      timerRef.current = setTimeout(() => {
        processNext();
      }, 300);
    }, 4200);
  }, []);

  const dismissCurrent = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentAchievement(null);
    timerRef.current = setTimeout(() => {
      processNext();
    }, 200);
  }, [processNext]);

  const enqueueAchievement = useCallback(
    (item: Omit<AchievementUnlockItem, "id">) => {
      const fullItem: AchievementUnlockItem = {
        ...item,
        id: "ach_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      };

      queueRef.current.push(fullItem);

      if (!isPlayingRef.current) {
        processNext();
      }
    },
    [processNext]
  );

  const enqueueBadge = useCallback(
    (badge: GamificationBadge) => {
      enqueueAchievement({
        badgeId: badge.id,
        title: badge.title,
        desc: badge.desc,
        category: badge.category,
        xpReward: badge.xpReward,
        unlockedAt: badge.unlockedAt || new Date().toLocaleDateString("pt-BR"),
      });
    },
    [enqueueAchievement]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AchievementQueueContext.Provider
      value={{
        currentAchievement,
        queueLength: queueRef.current.length + (currentAchievement ? 1 : 0),
        enqueueAchievement,
        enqueueBadge,
        dismissCurrent,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </AchievementQueueContext.Provider>
  );
};

export const useAchievementQueue = (): AchievementQueueContextType => {
  const context = useContext(AchievementQueueContext);
  if (!context) {
    throw new Error("useAchievementQueue must be used within an AchievementQueueProvider");
  }
  return context;
};
