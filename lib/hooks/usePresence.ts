import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

export interface PresencePayload {
  user_id: string;
  username: string;
  elo_rating: number;
  online_at: string;
}

export function usePresence() {
  const { user, profile } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState<PresencePayload[]>([
    { user_id: '1', username: 'Riya', elo_rating: 1452, online_at: new Date().toISOString() },
    { user_id: '2', username: 'Marcus', elo_rating: 1510, online_at: new Date().toISOString() },
    { user_id: '3', username: 'Siddharth', elo_rating: 1390, online_at: new Date().toISOString() },
    { user_id: '4', username: 'Elena', elo_rating: 1620, online_at: new Date().toISOString() },
  ]);

  useEffect(() => {
    if (!user) return;

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
      if (list.length > 0) {
        setOnlineUsers(list);
      }
    });

    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id || 'user_local',
          username: profile?.name || 'Afnan',
          elo_rating: profile?.brainPoints || 1420,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  return { onlineUsers };
}
