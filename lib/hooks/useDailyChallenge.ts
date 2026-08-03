import { useEffect } from 'react';
import { useDailyChallengeStore } from '../../src/store/dailyChallengeStore';
import { useUserStore } from '../../src/store/userStore';

export function useDailyChallenge() {
  const user = useUserStore((s) => s.user);
  const {
    dateStr,
    sections,
    completedSections,
    currentSectionIndex,
    currentQuestionIndex,
    answers,
    isCompleted,
    isLoading,
    isSubmitting,
    rewardResult,
    loadDailyChallenge,
    submitAnswer,
    resumeProgress,
  } = useDailyChallengeStore();

  useEffect(() => {
    if (user) {
      loadDailyChallenge();
    }
  }, [user]);

  return {
    dateStr,
    sections,
    completedSections,
    currentSectionIndex,
    currentQuestionIndex,
    answers,
    isCompleted,
    isLoading,
    isSubmitting,
    rewardResult,
    submitAnswer,
    resumeProgress,
  };
}
