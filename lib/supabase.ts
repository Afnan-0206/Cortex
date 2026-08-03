import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Singleton guard — prevents "Multiple GoTrueClient instances" warning during dev hot-reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined;
}

function createSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: secureStorage,
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
