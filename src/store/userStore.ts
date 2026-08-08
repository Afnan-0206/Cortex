import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, SessionState, Rank } from '../types';
import { getCurrentRank } from '../logic/ranks';
import {
  calculateBP,
  calculateCortexScore,
  shouldIncreaseStreak,
  calculateConsistency,
} from '../logic/scoring';
import { supabase } from '../../lib/supabase';
import { secureStorage } from '../../lib/secureStorage';

const STORAGE_KEY = 'cortex_user_profile_v3';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlete',
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
  streakFreezes: 0,
  lastFreezeGrantedStreak: 0,
  dailyRewardCycleDay: 1,
  lastDailyRewardClaimDate: null,
  badges: [],
  dailyMissions: [
    { id: 'm_workout', title: 'Complete 1 Workout', target: 1, current: 0, rewardXp: 40, claimed: false, type: 'workout' },
    { id: 'm_win_duel', title: 'Win 1 AI Duel', target: 1, current: 0, rewardXp: 40, claimed: false, type: 'win_duel' },
    { id: 'm_earn_xp', title: 'Earn 200 XP', target: 200, current: 0, rewardXp: 40, claimed: false, type: 'earn_xp' },
  ],
};

export const REWARDS_7_DAY = [
  { day: 1, xp: 50 },
  { day: 2, xp: 75 },
  { day: 3, xp: 100 },
  { day: 4, xp: 125 },
  { day: 5, xp: 150 },
  { day: 6, xp: 200 },
  { day: 7, xp: 300, badge: '7-Day Master' },
];

export interface CompleteSessionResult {
  bpEarned: number;
  didRankUp: boolean;
  oldRank: Rank;
  newRank: Rank;
  oldScore: number;
  newScore: number;
  streak: number;
}

export interface UserStore {
  // Auth State
  user: any | null;
  session: any | null;
  profile: UserProfile;
  activeSession: SessionState | null;
  isLoading: boolean;
  themeMode: 'dark' | 'light';

  // Auth Actions
  initializeAuth: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, pass: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setThemeMode: (mode: 'dark' | 'light') => void;

  // Profile & Session Actions
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
  claim7DayReward: () => Promise<{ xpAwarded: number; badgeUnlocked?: string }>;
  updateMissionProgress: (type: 'workout' | 'win_duel' | 'earn_xp', amount?: number) => Promise<void>;
  claimMissionReward: (missionId: string) => Promise<{ xpAwarded: number }>;
  completeQuest: (questId: string) => Promise<void>;
  updateQuestProgress: (questId: string, progress: number) => Promise<void>;
  incrementStreak: () => Promise<void>;
  grantFreezeIfEligible: () => Promise<boolean>;
  consumeFreezeIfNeeded: () => Promise<boolean>;
  getAvailableFreezes: () => number;
  updateName: (newName: string) => Promise<void>;
  setLoggedInState: (isLoggedIn: boolean, email?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: DEFAULT_PROFILE,
      activeSession: null,
      isLoading: true,
      themeMode: 'dark',

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const { data } = await supabase.auth.getSession();
          const session = data?.session;
          if (session && session.user) {
            set({ session, user: session.user });
            await get().loadProfile();
          } else {
            await get().loadProfile();
          }
        } catch (e) {
          console.warn('Auth initialization error:', e);
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithEmail: async (email, password) => {
        const res = await supabase.auth.signInWithPassword({ email, password });
        const data = res?.data;
        const error = res?.error;
        if (!error && data?.session) {
          set({ session: data.session, user: data.session.user });
          await get().initializeAuth();
        }
        return { error };
      },

      signUpWithEmail: async (email, password, username) => {
        const res = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        const data = res?.data;
        const error = res?.error;
        if (!error && data?.session) {
          set({ session: data.session, user: data.session.user });
          await supabase.from('profiles').insert({
            id: data.session.user.id,
            username,
            rating: 1200,
          });
          await get().initializeAuth();
        }
        return { error };
      },

      signOut: async () => {
        try {
          await supabase.removeAllChannels();
          await supabase.auth.signOut();
        } catch {
          // silent fallback
        }
        set({ user: null, session: null, profile: DEFAULT_PROFILE, activeSession: null });
      },

      setThemeMode: (mode) => set({ themeMode: mode }),

      loadProfile: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const currentProfile = get().profile;
          const todayStr = new Date().toISOString().split('T')[0];
          const isAuthenticated = !!session;

          // The profile is already hydrated from secure storage via persist middleware.
          // Only merge authoritative server data (xp, coins, streak, best_streak, username).
          // Local-only fields (dailyProgress, dailyRewardClaimed, dailyMissions, etc.) should
          // remain from persisted storage unless server explicitly indicates a new day.

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

          const isTodayDone =
            dbDailyProgress?.is_completed === true ||
            dbProfileData?.last_daily_completed_date === todayStr ||
            (currentProfile.lastCompletedDate === todayStr && currentProfile.dailyProgress === 4);

          const isNewDay = !!currentProfile.lastCompletedDate && currentProfile.lastCompletedDate !== todayStr;

          // Daily progress: prefer server if today is done, otherwise use persisted local progress
          const dailyProgressForToday = isTodayDone
            ? 4
            : isNewDay
            ? 0
            : Math.max(dbDailyProgress?.completed_sections ?? 0, currentProfile.dailyProgress ?? 0);

          // Daily reward claimed: prefer server if today is done, otherwise use persisted value
          const dailyRewardClaimedForToday = isTodayDone
            ? true
            : isNewDay
            ? false
            : (currentProfile.dailyRewardClaimed ?? false);

          // Daily missions: reset progress on new day but preserve structure
          // Only reset current/claimed if it's a new day; otherwise keep persisted progress
          const dailyMissionsForToday = isNewDay
            ? (DEFAULT_PROFILE.dailyMissions ?? []).map((m) => ({ ...m, current: 0, claimed: false }))
            : (currentProfile.dailyMissions ?? DEFAULT_PROFILE.dailyMissions);

          // Authoritative server values take precedence for these fields
          const finalXP = Math.max(dbProfileData?.xp ?? 0, dbProfileData?.rating ?? 0, currentProfile.brainPoints ?? 0);
          const finalCoins = Math.max(dbProfileData?.coins ?? 0, currentProfile.coins ?? 0);
          const finalStreak = Math.max(dbProfileData?.streak ?? 0, currentProfile.streak ?? 0);
          const finalBestStreak = Math.max(dbProfileData?.best_streak ?? 0, currentProfile.longestStreak ?? 0, finalStreak);

          const mergedProfile: UserProfile = {
            ...DEFAULT_PROFILE,
            ...currentProfile, // persisted local state (missions, badges, quests, etc.)
            // Server-authoritative overrides
            isLoggedIn: isAuthenticated,
            name: dbProfileData?.username || currentProfile.name || 'Athlete',
            brainPoints: finalXP,
            streak: finalStreak,
            longestStreak: finalBestStreak,
            coins: finalCoins,
            // Computed daily state
            dailyProgress: dailyProgressForToday,
            dailyRewardClaimed: dailyRewardClaimedForToday,
            dailyMissions: dailyMissionsForToday,
            first_game_completed: dbProfileData?.first_game_completed ?? currentProfile.first_game_completed ?? false,
            // Streak freeze state (local only)
            streakFreezes: currentProfile.streakFreezes ?? 0,
            lastFreezeGrantedStreak: currentProfile.lastFreezeGrantedStreak ?? 0,
            // 7-day reward cycle (local only)
            dailyRewardCycleDay: currentProfile.dailyRewardCycleDay ?? 1,
            lastDailyRewardClaimDate: currentProfile.lastDailyRewardClaimDate ?? null,
            badges: currentProfile.badges ?? [],
            completedQuests: currentProfile.completedQuests ?? [],
            totalSessionsCompleted: currentProfile.totalSessionsCompleted ?? 0,
            lastCompletedDate: currentProfile.lastCompletedDate ?? null,
          };

          set({ profile: mergedProfile, isLoading: false });
          await get().consumeFreezeIfNeeded();
          await get().grantFreezeIfEligible();
        } catch (e) {
          console.warn('[userStore] loadProfile error:', e);
          set({ isLoading: false });
        }
      },

      startSession: () => {
        set({
          activeSession: {
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
      if (!state.activeSession) return state;
      return {
        activeSession: {
          ...state.activeSession,
          mathCorrect: state.activeSession.mathCorrect + (correct ? 1 : 0),
          mathTotal: state.activeSession.mathTotal + 1,
        },
      };
    });
  },

  recordLogicResult: (correct: boolean) => {
    set((state) => {
      if (!state.activeSession) return state;
      return {
        activeSession: {
          ...state.activeSession,
          logicCorrect: state.activeSession.logicCorrect + (correct ? 1 : 0),
          logicTotal: state.activeSession.logicTotal + 1,
        },
      };
    });
  },

  recordMemorySpan: (span: number) => {
    set((state) => {
      if (!state.activeSession) return state;
      return {
        activeSession: {
          ...state.activeSession,
          memorySpan: Math.max(state.activeSession.memorySpan, span),
        },
      };
    });
  },

  completeSession: async () => {
    const { profile, activeSession } = get();
    const currentSession = activeSession || {
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

    set({ profile: draftProfile, activeSession: null });

    try {
      await secureStorage.setItem(STORAGE_KEY, JSON.stringify(draftProfile));
      
      // Execute Server-Authoritative RPC (Phase 6 Security Fix)
      const { data: { session: currentAuthSession } } = await supabase.auth.getSession();
      if (currentAuthSession?.user) {
        void (async () => {
          try {
            await supabase.rpc('submit_match_result', {
              p_match_id: `session_${Date.now()}`,
              p_score: currentSession.mathCorrect + currentSession.logicCorrect,
              p_opponent_id: 'solo',
              p_is_winner: true,
            });
          } catch {
            // silent fallback
          }
        })();
      }
    } catch {
      // silent fallback
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
    set({ profile: DEFAULT_PROFILE, activeSession: null });
    await secureStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  setBP: async (bp: number) => {
    set((state) => {
      const updated = { ...state.profile, brainPoints: bp };
      secureStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return { profile: updated };
    });
  },

  incrementDailyProgress: async (amount = 1) => {
    const { profile } = get();
    const todayStr = new Date().toISOString().split('T')[0];

    if (profile.dailyProgress === 4 || profile.dailyRewardClaimed || profile.lastCompletedDate === todayStr) {
      return;
    }

    const currentProgress = profile.dailyProgress ?? 0;
    const nextProgress = Math.min(4, currentProgress + amount);

    const updatedProfile: UserProfile = {
      ...profile,
      dailyProgress: nextProgress,
      lastCompletedDate: todayStr,
    };

    set({ profile: updatedProfile });
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  claimDailyReward: async () => {
    const { profile } = get();
    const currentProgress = profile.dailyProgress ?? 0;
    if (profile.dailyRewardClaimed || currentProgress < 4) {
      return { xpEarned: 0 };
    }

    const xpEarned = 250;
    const updatedProfile: UserProfile = {
      ...profile,
      brainPoints: profile.brainPoints + xpEarned,
      dailyRewardClaimed: true,
    };

    set({ profile: updatedProfile });
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});

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
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
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
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
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
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  grantFreezeIfEligible: async () => {
    const { profile } = get();
    const streak = profile.streak || 0;
    if (streak < 7) return false;

    const milestone = Math.floor(streak / 7) * 7;
    const currentFreezes = profile.streakFreezes ?? 0;
    const lastGranted = profile.lastFreezeGrantedStreak ?? 0;

    if (milestone > lastGranted && currentFreezes < 2) {
      const updatedProfile: UserProfile = {
        ...profile,
        streakFreezes: Math.min(2, currentFreezes + 1),
        lastFreezeGrantedStreak: milestone,
      };
      set({ profile: updatedProfile });
      await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
      return true;
    }
    return false;
  },

  consumeFreezeIfNeeded: async () => {
    const { profile } = get();
    const currentFreezes = profile.streakFreezes ?? 0;
    if (currentFreezes <= 0 || profile.streak <= 0 || !profile.lastCompletedDate) {
      return false;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const last = profile.lastCompletedDate;
    if (last !== todayStr && last !== yesterdayStr) {
      // Missed more than 1 day - consume a freeze to preserve streak!
      const updatedProfile: UserProfile = {
        ...profile,
        streakFreezes: Math.max(0, currentFreezes - 1),
        lastCompletedDate: yesterdayStr, // set to yesterday so streak continues
      };
      set({ profile: updatedProfile });
      await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
      return true;
    }
    return false;
  },

  getAvailableFreezes: () => {
    return get().profile.streakFreezes ?? 0;
  },

  claim7DayReward: async () => {
    const { profile } = get();
    const todayStr = new Date().toISOString().split('T')[0];

    if (profile.lastDailyRewardClaimDate === todayStr) {
      return { xpAwarded: 0 };
    }

    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let nextDay = profile.dailyRewardCycleDay ?? 1;

    if (profile.lastDailyRewardClaimDate === yesterdayStr) {
      nextDay = nextDay >= 7 ? 1 : nextDay + 1;
    } else if (profile.lastDailyRewardClaimDate) {
      nextDay = 1; // Missed day resets reward cycle
    }

    const rewardConfig = REWARDS_7_DAY.find((r) => r.day === nextDay) || REWARDS_7_DAY[0];
    const xpAwarded = rewardConfig.xp;
    const badgeUnlocked = rewardConfig.badge;

    const updatedBadges = badgeUnlocked
      ? Array.from(new Set([...(profile.badges || []), badgeUnlocked]))
      : profile.badges || [];

    const updatedProfile: UserProfile = {
      ...profile,
      brainPoints: (profile.brainPoints || 0) + xpAwarded,
      dailyRewardCycleDay: nextDay,
      lastDailyRewardClaimDate: todayStr,
      badges: updatedBadges,
    };

    set({ profile: updatedProfile });
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});

    // Track analytics event
    try {
      const { analytics } = require('../../lib/analytics');
      analytics.track('reward_claimed', { day: nextDay, xpAwarded, badgeUnlocked });
    } catch {}

    return { xpAwarded, badgeUnlocked };
  },

  updateMissionProgress: async (type: 'workout' | 'win_duel' | 'earn_xp', amount = 1) => {
    const { profile } = get();
    const currentMissions = profile.dailyMissions || [
      { id: 'm_workout', title: 'Complete 1 Workout', target: 1, current: 0, rewardXp: 40, claimed: false, type: 'workout' },
      { id: 'm_win_duel', title: 'Win 1 AI Duel', target: 1, current: 0, rewardXp: 40, claimed: false, type: 'win_duel' },
      { id: 'm_earn_xp', title: 'Earn 200 XP', target: 200, current: 0, rewardXp: 40, claimed: false, type: 'earn_xp' },
    ];

    const updatedMissions = currentMissions.map((m) => {
      if (m.type === type && !m.claimed) {
        return { ...m, current: Math.min(m.target, m.current + amount) };
      }
      return m;
    });

    const updatedProfile: UserProfile = {
      ...profile,
      dailyMissions: updatedMissions,
    };

    set({ profile: updatedProfile });
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  claimMissionReward: async (missionId: string) => {
    const { profile } = get();
    const currentMissions = profile.dailyMissions || [];
    const targetMission = currentMissions.find((m) => m.id === missionId);

    if (!targetMission || targetMission.claimed || targetMission.current < targetMission.target) {
      return { xpAwarded: 0 };
    }

    const xpAwarded = targetMission.rewardXp;
    const updatedMissions = currentMissions.map((m) =>
      m.id === missionId ? { ...m, claimed: true } : m
    );

    const updatedProfile: UserProfile = {
      ...profile,
      brainPoints: (profile.brainPoints || 0) + xpAwarded,
      dailyMissions: updatedMissions,
    };

    set({ profile: updatedProfile });
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});

    try {
      const { analytics } = require('../../lib/analytics');
      analytics.track('reward_claimed', { missionId, xpAwarded });
    } catch {}

    return { xpAwarded };
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
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  setLoggedInState: async (isLoggedIn: boolean, email?: string, name?: string) => {
    const { profile } = get();
    const updatedProfile: UserProfile = {
      ...profile,
      isLoggedIn,
      email: email || profile.email || '',
      name: name || profile.name || 'Athlete',
    };

    set({ profile: updatedProfile });
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  logout: async () => {
    try {
      await supabase.removeAllChannels();
      await supabase.auth.signOut();
    } catch {
      // silent fallback
    }
    const updatedProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      isLoggedIn: false,
      email: '',
    };
    set({ user: null, session: null, profile: updatedProfile, activeSession: null });
  },
}),
{
  name: 'cortex_user_profile_v3',
  storage: createJSONStorage(() => secureStorage),
  partialize: (state) => ({
    profile: state.profile,
    themeMode: state.themeMode,
  }),
}
)
);

