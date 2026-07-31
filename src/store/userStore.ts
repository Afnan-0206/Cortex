import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, SessionState, Rank } from '../types';
import { getCurrentRank } from '../logic/ranks';
import {
  calculateBP,
  calculateCortexScore,
  shouldIncreaseStreak,
  calculateConsistency,
} from '../logic/scoring';

const ASYNC_STORAGE_KEY = 'cortex_profile_v1';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Afnan',
  brainPoints: 1420,
  streak: 17,
  longestStreak: 17,
  lastCompletedDate: new Date().toISOString().split('T')[0],
  totalSessionsCompleted: 248,
  mathSpeed: 85,
  mathAccuracy: 0.92,
  logicScore: 92,
  logicAccuracy: 0.9,
  memorySpan: 7,
  consistency: 94,
  cortexScore: 850,
  perfectRuns: 14,
  dailyProgress: 3,
  dailyRewardClaimed: false,
  questPoints: 4,
  completedQuests: [],
  questProgress: {},
};

interface CompleteSessionResult {
  bpEarned: number;
  didRankUp: boolean;
  oldRank: Rank;
  newRank: Rank;
  oldScore: number;
  newScore: number;
  streak: number;
}

interface UserStore {
  profile: UserProfile;
  session: SessionState | null;
  isLoading: boolean;

  loadProfile: () => Promise<void>;
  startSession: () => void;
  recordMathResult: (correct: boolean) => void;
  recordLogicResult: (correct: boolean) => void;
  recordMemorySpan: (span: number) => void;
  completeSession: () => Promise<CompleteSessionResult>;
  resetProfile: () => Promise<void>;
  setBP: (bp: number) => Promise<void>;
  incrementDailyProgress: (amount?: number) => Promise<void>;
  claimDailyReward: () => Promise<{ xpEarned: number }>;
  completeQuest: (questId: string) => Promise<void>;
  updateQuestProgress: (questId: string, progress: number) => Promise<void>;
  incrementStreak: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  session: null,
  isLoading: true,

  loadProfile: async () => {
    try {
      const jsonStr = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      const todayStr = new Date().toISOString().split('T')[0];

      if (jsonStr) {
        const parsed: UserProfile = JSON.parse(jsonStr);
        let dailyProgress = parsed.dailyProgress ?? 3;
        let dailyRewardClaimed = parsed.dailyRewardClaimed ?? false;
        let completedQuests = parsed.completedQuests ?? [];

        // Reset daily challenge if it's a new day
        if (parsed.lastCompletedDate && parsed.lastCompletedDate !== todayStr) {
          dailyProgress = 0;
          dailyRewardClaimed = false;
          completedQuests = [];
        }

        set({
          profile: {
            ...DEFAULT_PROFILE,
            ...parsed,
            dailyProgress,
            dailyRewardClaimed,
            completedQuests,
          },
          isLoading: false,
        });
      } else {
        set({ profile: DEFAULT_PROFILE, isLoading: false });
      }
    } catch {
      set({ profile: DEFAULT_PROFILE, isLoading: false });
    }
  },

  startSession: () => {
    set({
      session: {
        startedAt: Date.now(),
        mathCorrect: 0,
        mathTotal: 0,
        logicCorrect: 0,
        logicTotal: 0,
        memorySpan: 0,
        bpEarned: 0,
      },
    });
  },

  recordMathResult: (correct: boolean) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          mathCorrect: state.session.mathCorrect + (correct ? 1 : 0),
          mathTotal: state.session.mathTotal + 1,
        },
      };
    });
  },

  recordLogicResult: (correct: boolean) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          logicCorrect: state.session.logicCorrect + (correct ? 1 : 0),
          logicTotal: state.session.logicTotal + 1,
        },
      };
    });
  },

  recordMemorySpan: (span: number) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          memorySpan: Math.max(state.session.memorySpan, span),
        },
      };
    });
  },

  completeSession: async () => {
    const { profile, session } = get();
    const currentSession = session || {
      startedAt: Date.now(),
      mathCorrect: 0,
      mathTotal: 0,
      logicCorrect: 0,
      logicTotal: 0,
      memorySpan: 0,
      bpEarned: 0,
    };

    const bpEarned = calculateBP(currentSession);
    const oldBP = profile.brainPoints;
    const newBP = oldBP + bpEarned;

    const oldRank = getCurrentRank(oldBP);
    const newRank = getCurrentRank(newBP);
    const didRankUp = newRank.tier > oldRank.tier;

    // Streak calculation
    let newStreak = profile.streak;
    const todayStr = new Date().toISOString().split('T')[0];

    if (profile.lastCompletedDate === todayStr) {
      newStreak = profile.streak > 0 ? profile.streak : 1;
    } else if (shouldIncreaseStreak(profile.lastCompletedDate)) {
      newStreak = profile.streak + 1;
    } else {
      newStreak = 1;
    }

    const newLongestStreak = Math.max(profile.longestStreak, newStreak);
    const newTotalSessions = profile.totalSessionsCompleted + 1;

    // Performance metric updates
    const sessionMathAccuracy =
      currentSession.mathTotal > 0
        ? currentSession.mathCorrect / currentSession.mathTotal
        : 0;
    const sessionMathSpeed = currentSession.mathCorrect * 2;

    const updatedMathSpeed = Math.round(
      profile.totalSessionsCompleted === 0
        ? sessionMathSpeed
        : profile.mathSpeed * 0.7 + sessionMathSpeed * 0.3
    );

    const updatedMathAccuracy =
      profile.totalSessionsCompleted === 0
        ? sessionMathAccuracy
        : Number((profile.mathAccuracy * 0.7 + sessionMathAccuracy * 0.3).toFixed(2));

    const sessionLogicAcc =
      currentSession.logicTotal > 0
        ? currentSession.logicCorrect / currentSession.logicTotal
        : 0;

    const sessionLogicScore = Math.round(sessionLogicAcc * 100);

    const updatedLogicScore =
      profile.totalSessionsCompleted === 0
        ? sessionLogicScore
        : Math.round(profile.logicScore * 0.7 + sessionLogicScore * 0.3);

    const updatedLogicAccuracy =
      profile.totalSessionsCompleted === 0
        ? sessionLogicAcc
        : Number((profile.logicAccuracy * 0.7 + sessionLogicAcc * 0.3).toFixed(2));

    const updatedMemorySpan = Math.max(profile.memorySpan, currentSession.memorySpan);
    const updatedConsistency = calculateConsistency(newStreak, newTotalSessions);

    const isPerfect =
      currentSession.mathTotal >= 5 &&
      currentSession.mathCorrect === currentSession.mathTotal &&
      currentSession.logicTotal >= 3 &&
      currentSession.logicCorrect === currentSession.logicTotal;

    const updatedPerfectRuns = profile.perfectRuns + (isPerfect ? 1 : 0);

    // Auto increment daily challenge progress
    const updatedDailyProgress = Math.min(6, (profile.dailyProgress ?? 0) + 1);

    const draftProfile: UserProfile = {
      ...profile,
      brainPoints: newBP,
      streak: newStreak,
      longestStreak: newLongestStreak,
      lastCompletedDate: todayStr,
      totalSessionsCompleted: newTotalSessions,
      mathSpeed: updatedMathSpeed,
      mathAccuracy: updatedMathAccuracy,
      logicScore: updatedLogicScore,
      logicAccuracy: updatedLogicAccuracy,
      memorySpan: updatedMemorySpan,
      consistency: updatedConsistency,
      cortexScore: 0,
      perfectRuns: updatedPerfectRuns,
      dailyProgress: updatedDailyProgress,
      dailyRewardClaimed: profile.dailyRewardClaimed ?? false,
    };

    const oldScore = profile.cortexScore;
    const newScore = calculateCortexScore(draftProfile);
    draftProfile.cortexScore = newScore;

    set({ profile: draftProfile, session: null });

    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(draftProfile));
    } catch {
      // silent
    }

    return {
      bpEarned,
      didRankUp,
      oldRank,
      newRank,
      oldScore,
      newScore,
      streak: newStreak,
    };
  },

  resetProfile: async () => {
    set({ profile: DEFAULT_PROFILE, session: null });
    try {
      await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
    } catch {
      // silent
    }
  },

  setBP: async (bp: number) => {
    set((state) => {
      const updated = { ...state.profile, brainPoints: bp };
      AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return { profile: updated };
    });
  },

  incrementDailyProgress: async (amount = 1) => {
    const { profile } = get();
    const todayStr = new Date().toISOString().split('T')[0];
    const currentProgress = profile.dailyProgress ?? 0;
    const nextProgress = Math.min(6, currentProgress + amount);

    const updatedProfile: UserProfile = {
      ...profile,
      dailyProgress: nextProgress,
      lastCompletedDate: todayStr,
    };

    set({ profile: updatedProfile });

    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch {
      // silent fallback
    }
  },

  claimDailyReward: async () => {
    const { profile } = get();
    const currentProgress = profile.dailyProgress ?? 0;
    if (profile.dailyRewardClaimed || currentProgress < 6) {
      return { xpEarned: 0 };
    }

    const xpEarned = 250;
    const updatedProfile: UserProfile = {
      ...profile,
      brainPoints: profile.brainPoints + xpEarned,
      dailyRewardClaimed: true,
    };

    set({ profile: updatedProfile });

    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch {
      // silent fallback
    }

    return { xpEarned };
  },

  completeQuest: async (questId: string) => {
    const { profile } = get();
    const existing = profile.completedQuests ?? [];

    const nextCompleted = existing.includes(questId) ? existing : [...existing, questId];
    const nextQuestPoints = Math.min(30, (profile.questPoints ?? 0) + 1);
    const nextXP = profile.brainPoints + 50;

    const todayStr = new Date().toISOString().split('T')[0];
    let newStreak = profile.streak;
    if (profile.lastCompletedDate !== todayStr) {
      newStreak = (profile.streak || 0) + 1;
    }
    const newLongest = Math.max(profile.longestStreak || 0, newStreak);

    const updatedProfile: UserProfile = {
      ...profile,
      completedQuests: nextCompleted,
      questPoints: nextQuestPoints,
      brainPoints: nextXP,
      streak: newStreak,
      longestStreak: newLongest,
      lastCompletedDate: todayStr,
      totalSessionsCompleted: (profile.totalSessionsCompleted || 0) + 1,
    };

    set({ profile: updatedProfile });

    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch {
      // silent fallback
    }
  },

  updateQuestProgress: async (questId: string, progress: number) => {
    const { profile } = get();
    const currentMap = profile.questProgress ?? {};
    const updatedMap = { ...currentMap, [questId]: Math.max(currentMap[questId] || 0, progress) };

    const updatedProfile: UserProfile = {
      ...profile,
      questProgress: updatedMap,
    };

    set({ profile: updatedProfile });
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch {
      // silent fallback
    }
  },

  incrementStreak: async () => {
    const { profile } = get();
    const todayStr = new Date().toISOString().split('T')[0];
    if (profile.lastCompletedDate === todayStr) return;

    const newStreak = (profile.streak || 0) + 1;
    const newLongest = Math.max(profile.longestStreak || 0, newStreak);

    const updatedProfile: UserProfile = {
      ...profile,
      streak: newStreak,
      longestStreak: newLongest,
      lastCompletedDate: todayStr,
      totalSessionsCompleted: (profile.totalSessionsCompleted || 0) + 1,
    };

    set({ profile: updatedProfile });
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch {
      // silent fallback
    }
  },
}));
