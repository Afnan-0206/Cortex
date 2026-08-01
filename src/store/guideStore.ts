import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { analytics } from '../../lib/analytics';
import { useUserStore } from './userStore';

export type GuideStep =
  | 'IDLE'
  | 'ARENA_WELCOME'
  | 'ARENA_SELECT_MODE'
  | 'ARENA_PRESS_PLAY'
  | 'BATTLE_HINT_TIMER'
  | 'BATTLE_HINT_QUESTION'
  | 'BATTLE_COMPLETE_REWARD';

interface GuideState {
  isActive: boolean;
  currentStep: GuideStep;
  hasSeenGuide: boolean;
  rewardClaimed: boolean;
  coinsEarned: number;

  initializeGuide: () => Promise<void>;
  nextStep: () => void;
  setStep: (step: GuideStep) => void;
  completeGuideAndClaimReward: (userId: string) => Promise<{ coinsAwarded: number }>;
  skipGuide: (userId: string) => Promise<void>;
}

export const useGuideStore = create<GuideState>((set, get) => ({
  isActive: false,
  currentStep: 'IDLE',
  hasSeenGuide: false,
  rewardClaimed: false,
  coinsEarned: 0,

  initializeGuide: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_game_completed, coins')
        .eq('id', session.user.id)
        .maybeSingle();

      const isCompleted = profile?.first_game_completed ?? false;

      if (!isCompleted) {
        set({
          isActive: true,
          currentStep: 'ARENA_WELCOME',
          hasSeenGuide: false,
        });
        analytics.track('first_game_guide_started');
      } else {
        set({
          isActive: false,
          currentStep: 'IDLE',
          hasSeenGuide: true,
        });
      }
    } catch {
      // Fallback: don't block user if offline
      set({ isActive: false, currentStep: 'IDLE' });
    }
  },

  nextStep: () => {
    const { currentStep } = get();
    const sequence: GuideStep[] = [
      'ARENA_WELCOME',
      'ARENA_SELECT_MODE',
      'ARENA_PRESS_PLAY',
      'BATTLE_HINT_TIMER',
      'BATTLE_HINT_QUESTION',
      'BATTLE_COMPLETE_REWARD',
    ];
    const currentIndex = sequence.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      const next = sequence[currentIndex + 1];
      set({ currentStep: next });
    }
  },

  setStep: (step: GuideStep) => {
    set({ currentStep: step, isActive: step !== 'IDLE' });
  },

  completeGuideAndClaimReward: async (userId: string) => {
    const { rewardClaimed } = get();
    if (rewardClaimed) return { coinsAwarded: 0 };

    set({ rewardClaimed: true });
    analytics.track('first_game_guide_completed');

    try {
      // Call Supabase RPC or Direct update
      const { data } = await supabase.rpc('award_first_game_reward', { user_id: userId });
      const coinsAwarded = data?.coins_awarded ?? 100;

      // Update userStore local coins & status
      useUserStore.setState((state) => ({
        profile: {
          ...state.profile,
          first_game_completed: true,
          coins: (state.profile.coins ?? 0) + coinsAwarded,
        },
      }));

      set({
        isActive: true,
        currentStep: 'BATTLE_COMPLETE_REWARD',
        coinsEarned: coinsAwarded,
        hasSeenGuide: true,
      });

      analytics.track('first_game_reward_claimed', { coins: coinsAwarded });
      return { coinsAwarded };
    } catch (e) {
      // Offline fallback: update local store so reward displays
      useUserStore.setState((state) => ({
        profile: {
          ...state.profile,
          first_game_completed: true,
          coins: (state.profile.coins ?? 0) + 100,
        },
      }));
      set({
        isActive: true,
        currentStep: 'BATTLE_COMPLETE_REWARD',
        coinsEarned: 100,
        hasSeenGuide: true,
      });
      return { coinsAwarded: 100 };
    }
  },

  skipGuide: async (userId: string) => {
    set({ isActive: false, currentStep: 'IDLE', hasSeenGuide: true });
    analytics.track('first_game_guide_skipped');

    try {
      await supabase
        .from('profiles')
        .update({ first_game_completed: true })
        .eq('id', userId);

      useUserStore.setState((state) => ({
        profile: { ...state.profile, first_game_completed: true },
      }));
    } catch {
      // silent
    }
  },
}));
