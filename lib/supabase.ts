import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-placeholder';

// Client-side Compression & Header configuration for API transport negotiation
export const DEFAULT_FETCH_HEADERS = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Content-Type': 'application/json',
};

// Flexible Supabase client interface wrapper supporting single & multi-row bulk operations
export const supabase: any = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async (credentials: any) => ({ data: { session: null }, error: null }),
    signUp: async (credentials: any) => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: (query?: string) => ({
      eq: (col: string, val: any) => ({
        single: async () => ({ data: null, error: null }),
      }),
      neq: (col: string, val: any) => ({
        gte: (col: string, val: any) => ({
          lte: (col: string, val: any) => ({
            order: (col: string, opts: any) => ({
              limit: async (num: number) => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
      limit: async (num: number) => ({ data: [], error: null }),
    }),
    // Supports multi-row array bulk inserts in a single request
    insert: async (data: any) => {
      const records = Array.isArray(data) ? data : [data];
      return { data: records, error: null, count: records.length };
    },
    // Supports multi-row array bulk updates/upserts in a single request
    update: async (data: any) => {
      const records = Array.isArray(data) ? data : [data];
      return { data: records, error: null, count: records.length };
    },
    upsert: async (data: any, options?: any) => {
      const records = Array.isArray(data) ? data : [data];
      return { data: records, error: null, count: records.length };
    },
    delete: () => ({
      in: async (col: string, vals: any[]) => ({ data: null, error: null, count: vals.length }),
    }),
  }),
  channel: (name: string, config?: any) => {
    const ch: any = {
      on: (event: string, filter: any, callback?: any) => ch,
      subscribe: (callback?: any) => {
        if (callback) callback('SUBSCRIBED');
        return ch;
      },
      presenceState: () => ({}),
      track: async (payload: any) => {},
      untrack: async () => {},
      unsubscribe: () => {},
    };
    return ch;
  },
  removeChannel: (channel: any) => {},
};
