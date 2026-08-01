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
import { supabase } from '../../lib/supabase';

const ASYNC_STORAGE_KEY = 'cortex_profile_v1';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  email: '',
  isLoggedIn: false,
  hasCustomUsername: false,
  brainPoints: 0,
  streak: 0,
  longestStreak: 0,
  lastCompletedDate: '',
  totalSessionsCompleted: 0,
  mathSpeed: 0,
  mathAccuracy: 0,
  logicScore: 0,
  logicAccuracy: 0,
  memorySpan: 0,
  consistency: 0,
  cortexScore: 0,
  perfectRuns: 0,
  dailyProgress: 0,
  dailyRewardClaimed: false,
  questPoints: 0,
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
  updateName: (newName: string) => Promise<void>;
  setLoggedInState: (isLoggedIn: boolean, email?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  session: null,
  isLoading: true,

  loadProfile: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jsonStr = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      const todayStr = new Date().toISOString().split('T')[0];

      const isAuthenticated = !!session;

      let dbProfileData: any = null;
      let dbDailyProgress: any = null;
      if (session?.user) {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        dbProfileData = dbProfile;

        const { data: dbDaily } = await supabase
          .from('user_daily_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('challenge_date', todayStr)
          .maybeSingle();
        dbDailyProgress = dbDaily;
      }

      const isTodayDone = dbDailyProgress?.is_completed || dbProfileData?.last_daily_completed_date === todayStr;
      const todayProgress = isTodayDone ? 4 : (dbDailyProgress ? (dbDailyProgress.completed_sections ?? 0) : 0);

      if (jsonStr) {
        const parsed: UserProfile = JSON.parse(jsonStr);

        // Purge legacy mock data if present
        if (parsed.totalSessionsCompleted === 248 || parsed.brainPoints === 1420 || parsed.streak === 17) {
          await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
          set({
            profile: {
              ...DEFAULT_PROFILE,
              isLoggedIn: isAuthenticated,
              name: dbProfileData?.username || 'Athlete',
              brainPoints: dbProfileData?.xp ?? dbProfileData?.rating ?? 0,
              streak: dbProfileData?.streak ?? 0,
              longestStreak: dbProfileData?.best_streak ?? 0,
              coins: dbProfileData?.coins ?? 0,
              dailyProgress: todayProgress,
              dailyRewardClaimed: isTodayDone,
              first_game_completed: dbProfileData?.first_game_completed ?? false,
              lastCompletedDate: isTodayDone ? todayStr : (dbProfileData?.last_daily_completed_date || ''),
            },
            isLoading: false,
          });
          return;
        }

        let dailyProgress = isTodayDone ? 4 : (dbDailyProgress ? todayProgress : (parsed.lastCompletedDate === todayStr ? (parsed.dailyProgress ?? 0) : 0));
        let dailyRewardClaimed = isTodayDone ? true : (dbDailyProgress ? isTodayDone : (parsed.lastCompletedDate === todayStr ? (parsed.dailyRewardClaimed ?? false) : false));
        let completedQuests = parsed.completedQuests ?? [];

        if (parsed.lastCompletedDate && parsed.lastCompletedDate !== todayStr && !isTodayDone && !dbDailyProgress) {
          dailyProgress = 0;
          dailyRewardClaimed = false;
          completedQuests = [];
        }

        const mergedProfile: UserProfile = {
          ...DEFAULT_PROFILE,
          ...parsed,
          isLoggedIn: isAuthenticated,
          name: dbProfileData?.username || parsed.name || 'Athlete',
          brainPoints: dbProfileData?.xp ?? dbProfileData?.rating ?? parsed.brainPoints ?? 0,
          streak: dbProfileData?.streak ?? parsed.streak ?? 0,
          longestStreak: dbProfileData?.best_streak ?? parsed.longestStreak ?? 0,
          coins: dbProfileData?.coins ?? parsed.coins ?? 0,
          dailyProgress,
          dailyRewardClaimed,
          completedQuests,
          first_game_completed: dbProfileData?.first_game_completed ?? parsed.first_game_completed ?? false,
          lastCompletedDate: isTodayDone ? todayStr : (dbProfileData?.last_daily_completed_date || parsed.lastCompletedDate || ''),
        };

        set({ profile: mergedProfile, isLoading: false });
        AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(mergedProfile)).catch(() => {});
      } else {
        const mergedProfile: UserProfile = {
          ...DEFAULT_PROFILE,
          isLoggedIn: isAuthenticated,
          name: dbProfileData?.username || 'Athlete',
          brainPoints: dbProfileData?.xp ?? dbProfileData?.rating ?? 0,
          streak: dbProfileData?.streak ?? 0,
          longestStreak: dbProfileData?.best_streak ?? 0,
          coins: dbProfileData?.coins ?? 0,
          dailyProgress: todayProgress,
          dailyRewardClaimed: isTodayDone,
          first_game_completed: dbProfileData?.first_game_completed ?? false,
          lastCompletedDate: isTodayDone ? todayStr : (dbProfileData?.last_daily_completed_date || ''),
        };
        set({ profile: mergedProfile, isLoading: false });
        AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(mergedProfile)).catch(() => {});
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
      const { data: { session: currentAuthSession } } = await supabase.auth.getSession();
      if (currentAuthSession?.user) {
        await supabase
          .from('profiles')
          .update({
            rating: draftProfile.brainPoints,
            xp: draftProfile.brainPoints,
            streak: draftProfile.streak,
            best_streak: draftProfile.longestStreak,
          })
          .eq('id', currentAuthSession.user.id);
      }
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
    const nextProgress = Math.min(4, currentProgress + amount);

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

  updateName: async (newName: string) => {
    const { profile } = get();
    const cleanName = newName.trim();
    if (!cleanName) return;

    const updatedProfile: UserProfile = {
      ...profile,
      name: cleanName,
      hasCustomUsername: true,
    };

    set({ profile: updatedProfile });
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch {
      // silent fallback
    }
  },

  setLoggedInState: async (isLoggedIn: boolean, email?: string, name?: string) => {
    const { profile } = get();
    const updatedProfile: UserProfile = {
      ...profile,
      isLoggedIn,
      email: email || profile.email || '',
      name: name || profile.name || 'Afnan',
    };

    set({ profile: updatedProfile });
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch {
      // silent fallback
    }
  },

  logout: async () => {
    try {
      await supabase.removeAllChannels();
      await supabase.auth.signOut();
    } catch {
      // silent fallback
    }
    const { profile } = get();
    const updatedProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      isLoggedIn: false,
      email: '',
    };
    set({ profile: updatedProfile, session: null });
    try {
      await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
    } catch {
      // silent fallback
    }
  },
}));
