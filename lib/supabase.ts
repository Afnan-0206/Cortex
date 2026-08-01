import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Singleton guard — prevents "Multiple GoTrueClient instances" warning.
 *
 * On web, Metro's hot-reload can re-execute module code multiple times within
 * the same browser context. We store a single instance on `globalThis` so every
 * import always resolves to the same object.
 */
declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined;
}

function createSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
    },
    global: {
      headers: { 'X-Client-Info': 'cortex-mobile/1.0.0' },
    },
  });
}

export const supabase: SupabaseClient =
  globalThis.__supabaseClient ?? (globalThis.__supabaseClient = createSupabase());
