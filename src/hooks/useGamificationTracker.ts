import { useEffect, useRef } from "react";
import { useStudy } from "../context/StudyContext";
import { useToast } from "../context/ToastContext";
import { useAchievementQueue } from "../context/AchievementQueueContext";
import { computeGamificationData } from "../utils/gamificationBadges";

export const useGamificationTracker = () => {
  const { activeEdital, studySessions, scheduledReviews, simulados } = useStudy();
  const {
    triggerRankUpToast,
    triggerXpMilestoneToast,
    triggerDisciplineCompletedToast,
  } = useToast();
  const { enqueueBadge } = useAchievementQueue();

  const prevEditalIdRef = useRef<string | null>(null);
  const prevRankLevelRef = useRef<number | null>(null);
  const prevTotalXpRef = useRef<number | null>(null);
  const prevUnlockedBadgesRef = useRef<Set<string>>(new Set());
  const prevCompletedDisciplinesRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!activeEdital) return;

    const data = computeGamificationData(activeEdital, studySessions, scheduledReviews, simulados);
    const disciplines = activeEdital.disciplines || [];
    const topics = activeEdital.topics || [];

    const currentUnlockedBadges = new Set<string>();
    data.badges.forEach((b) => {
      if (b.unlocked) currentUnlockedBadges.add(b.id);
    });

    const currentCompletedDisciplines = new Set<string>();
    disciplines.forEach((d) => {
      const dTopics = topics.filter((t) => t.disciplineId === d.id);
      if (dTopics.length > 0 && dTopics.every((t) => t.isStudied)) {
        currentCompletedDisciplines.add(d.id);
      }
    });

    const storageKey = `concursos_known_badges_${activeEdital.id}`;
    let persistedKnownBadges = new Set<string>();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          persistedKnownBadges = new Set(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    // On initial mount or edital switch: baseline state without firing toasts.
    // Ensure all already-unlocked badges are marked as known in localStorage.
    if (!isInitializedRef.current || prevEditalIdRef.current !== activeEdital.id) {
      prevEditalIdRef.current = activeEdital.id;
      prevRankLevelRef.current = data.rankLevel;
      prevTotalXpRef.current = data.totalXp;

      // Merge current with persisted
      currentUnlockedBadges.forEach((id) => persistedKnownBadges.add(id));
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(persistedKnownBadges)));
      } catch {
        // Ignore
      }

      prevUnlockedBadgesRef.current = new Set(persistedKnownBadges);
      prevCompletedDisciplinesRef.current = currentCompletedDisciplines;
      isInitializedRef.current = true;
      return;
    }

    const prevRankLevel = prevRankLevelRef.current ?? data.rankLevel;
    const prevTotalXp = prevTotalXpRef.current ?? data.totalXp;
    const prevUnlockedBadges = prevUnlockedBadgesRef.current;
    const prevCompletedDisciplines = prevCompletedDisciplinesRef.current;

    // 1. Check for Military Rank Promotion
    if (data.rankLevel > prevRankLevel) {
      triggerRankUpToast(data.rankTitle, data.rankLevel, data.rankIcon);
    }

    // 2. Check for Major XP Increase (+150 or more or crossing milestone)
    if (data.totalXp > prevTotalXp) {
      const gained = data.totalXp - prevTotalXp;
      if (data.rankLevel <= prevRankLevel) {
        triggerXpMilestoneToast(gained, data.totalXp);
      }
    }

    // 3. Check for Newly Unlocked Badges (across all 25 achievements)
    // Must be genuinely newly unlocked (not in prevUnlockedBadges or localStorage)
    let badgesUpdated = false;
    data.badges.forEach((badge) => {
      if (badge.unlocked && !prevUnlockedBadges.has(badge.id)) {
        prevUnlockedBadges.add(badge.id);
        badgesUpdated = true;
        // Trigger the dedicated achievement notification popup + chime
        enqueueBadge(badge);
      }
    });

    if (badgesUpdated) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(prevUnlockedBadges)));
      } catch {
        // Ignore
      }
    }

    // 4. Check for Newly Completed Disciplines
    disciplines.forEach((disc) => {
      if (currentCompletedDisciplines.has(disc.id) && !prevCompletedDisciplines.has(disc.id)) {
        triggerDisciplineCompletedToast(disc.name);
      }
    });

    // Update refs for next comparison
    prevRankLevelRef.current = data.rankLevel;
    prevTotalXpRef.current = data.totalXp;
    prevCompletedDisciplinesRef.current = currentCompletedDisciplines;
  }, [
    activeEdital,
    studySessions,
    scheduledReviews,
    simulados,
    triggerRankUpToast,
    triggerXpMilestoneToast,
    triggerDisciplineCompletedToast,
    enqueueBadge,
  ]);
};
