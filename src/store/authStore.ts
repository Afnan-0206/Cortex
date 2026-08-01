import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../types';

interface AuthState {
  user: any | null;
  session: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  themeMode: 'dark' | 'light';

  initializeAuth: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, pass: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setThemeMode: (mode: 'dark' | 'light') => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: {
    name: 'User',
    email: '',
    isLoggedIn: false,
    hasCustomUsername: false,
    brainPoints: 0,
    streak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
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
  },
  isLoading: false,
  themeMode: 'dark',

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await supabase.auth.getSession();
      const session: any = res?.data?.session;
      if (session && session.user) {
        set({ session, user: session.user });
        const profileRes = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const profile: any = profileRes?.data;
        if (profile) {
          set({
            profile: {
              name: profile.username || 'Afnan',
              brainPoints: profile.rating || 1200,
              streak: profile.streak || 0,
              longestStreak: profile.best_streak || 0,
              lastCompletedDate: null,
              totalSessionsCompleted: 248,
              mathSpeed: 85,
              mathAccuracy: 0.92,
              logicScore: 92,
              logicAccuracy: 0.90,
              memorySpan: 7,
              consistency: 94,
              cortexScore: 850,
              perfectRuns: 14,
              dailyProgress: 0,
              dailyRewardClaimed: false,
              questPoints: 4,
              completedQuests: [],
              questProgress: {},
            },
          });
        }
      }
    } catch (e) {
      console.warn('Auth initialization error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    const data: any = res?.data;
    const error = res?.error;
    if (!error && data?.session) {
      set({ session: data.session, user: data.session.user });
      get().initializeAuth();
    }
    return { error };
  },

  signUpWithEmail: async (email, password, username) => {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    const data: any = res?.data;
    const error = res?.error;
    if (!error && data?.session) {
      set({ session: data.session, user: data.session.user });
      await supabase.from('profiles').insert({
        id: data.session.user.id,
        username,
        rating: 1200,
      });
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
    set({ user: null, session: null, profile: null });
  },

  setThemeMode: (mode) => set({ themeMode: mode }),
}));
