import { useEffect } from 'react';
import { useGuideStore, GuideStep } from '../../src/store/guideStore';
import { useAuthStore } from '../../src/store/authStore';

export function useFirstGameGuide() {
  const { user } = useAuthStore();
  const {
    isActive,
    currentStep,
    hasSeenGuide,
    rewardClaimed,
    coinsEarned,
    initializeGuide,
    nextStep,
    setStep,
    completeGuideAndClaimReward,
    skipGuide,
  } = useGuideStore();

  useEffect(() => {
    if (user && !hasSeenGuide) {
      initializeGuide();
    }
  }, [user, hasSeenGuide]);

  const handleSkip = async () => {
    if (user) {
      await skipGuide(user.id);
    }
  };

  const handleClaimFirstGameReward = async () => {
    if (user) {
      return await completeGuideAndClaimReward(user.id);
    }
    return { coinsAwarded: 0 };
  };

  return {
    isActive,
    currentStep,
    hasSeenGuide,
    rewardClaimed,
    coinsEarned,
    nextStep,
    setStep,
    claimReward: handleClaimFirstGameReward,
    skipGuide: handleSkip,
  };
}
