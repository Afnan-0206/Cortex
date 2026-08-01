import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../supabase';
import { useAuthStore } from '../../src/store/authStore';
import { useUserStore } from '../../src/store/userStore';

export interface PresencePayload {
  user_id: string;
  username: string;
  elo_rating: number;
  online_at: string;
}

export function usePresence() {
  const { user } = useAuthStore();
  const userProfile = useUserStore((s) => s.profile);
  const [onlineUsers, setOnlineUsers] = useState<PresencePayload[]>([]);

  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      return;
    }

    const channel = supabase.channel('presence:arena', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const list = Object.values(state).flat() as any[];
      setOnlineUsers(list);
    });

    const trackUser = async () => {
      await channel.track({
        user_id: user.id,
        username: userProfile.name || user.email?.split('@')[0] || 'Athlete',
        elo_rating: userProfile.brainPoints || 1200,
        online_at: new Date().toISOString(),
      });
    };

    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await trackUser();
      }
    });

    // Handle AppState (Pause presence when backgrounded, resume when active)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        await trackUser();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        await channel.untrack();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, userProfile.name, userProfile.brainPoints]);

  return { onlineUsers };
}
