import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../supabase';
import { useAuthStore } from '../../src/store/authStore';
import { useUserStore } from '../../src/store/userStore';

export function useAuthGate() {
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  
  const { session, user, initializeAuth } = useAuthStore();
  const { setLoggedInState, updateName } = useUserStore();

  useEffect(() => {
    let isMounted = true;

    // Initial auth check
    initializeAuth().finally(() => {
      if (isMounted) setIsInitializing(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        if (currentSession?.user) {
          const u = currentSession.user;
          const name = u.user_metadata?.full_name
            ?? u.user_metadata?.username
            ?? u.user_metadata?.name
            ?? (u.email?.split('@')[0] ?? 'User');
          const userEmail = u.email ?? '';

          useAuthStore.setState({ session: currentSession, user: u });
          await updateName(name);
          await setLoggedInState(true, userEmail, name);
        } else {
          useAuthStore.setState({ session: null, user: null });
          await setLoggedInState(false, '', '');
        }

        if (event === 'SIGNED_OUT') {
          useUserStore.getState().logout();
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!session && inTabsGroup) {
      // Redirect to login if unauthenticated and trying to access tabs
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to tabs if authenticated and sitting on login/auth
      router.replace('/(tabs)');
    }
  }, [session, isInitializing, segments]);

  return {
    isInitializing,
    session,
    user,
    isAuthenticated: !!session,
  };
}
