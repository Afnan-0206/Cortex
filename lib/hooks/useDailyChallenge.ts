import { useEffect } from 'react';
import { useDailyChallengeStore } from '../../src/store/dailyChallengeStore';
import { useAuthStore } from '../../src/store/authStore';

export function useDailyChallenge() {
  const { user } = useAuthStore();
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
