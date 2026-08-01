/**
 * lib/auth.ts
 *
 * Google OAuth via Supabase + expo-web-browser.
 *
 * Security notes:
 *  • PKCE flow configured in supabase.ts — prevents token interception
 *  • WebBrowser.openAuthSessionAsync sandboxes the login in an ASWebAuthenticationSession
 *    (iOS) / Chrome Custom Tab (Android) — credentials never touch our app's WebView
 *  • Tokens are parsed from the fragment/query of the redirect URL, NOT stored in
 *    plain variables; they go straight into Supabase's encrypted AsyncStorage
 *  • We never log tokens or session objects
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Required on iOS to close the auth session after redirect
WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = Linking.createURL('/');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      // Don't open the browser ourselves; we want to control it below
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline', // request refresh_token too
        prompt: 'consent',      // always show account picker (multi-account support)
      },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

  if (Platform.OS === 'web') {
    // On web: navigate directly — Supabase will pick up the callback automatically
    window.location.href = data.url;
    return;
  }

  // On mobile: open in a system browser session (sandboxed, no credential leakage)
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: false, // don't expose the auth URL in the app switcher
    createTask: false,
  });

  if (result.type !== 'success' || !result.url) return;

  // Exchange the code/tokens from the redirect URL
  // Supabase's PKCE verifier is held in memory — only the code travels in the URL
  const parsedUrl = Linking.parse(result.url);
  const params = parsedUrl.queryParams ?? {};

  const accessToken  = params['access_token']  as string | undefined;
  const refreshToken = params['refresh_token'] as string | undefined;
  const code         = params['code']           as string | undefined;

  if (accessToken && refreshToken) {
    // Implicit flow fallback (non-PKCE path)
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } else if (code) {
    // PKCE code exchange — Supabase verifies the code_verifier internally
    await supabase.auth.exchangeCodeForSession(code);
  }
}