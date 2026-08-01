import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';

export interface SuggestedUser {
  id: string;
  username: string;
  rating: number;
  avatar_color: string;
  source: 'contact' | 'location' | 'online';
}

export interface FriendRecord {
  id: string; // friendship id
  friendId: string;
  username: string;
  rating: number;
  avatar_color: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  from_user: string;
  to_user: string;
  from_username?: string;
  to_username?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'challenge' | string;
  payload: {
    request_id?: string;
    from_user?: string;
    from_username?: string;
    [key: string]: any;
  };
  read: boolean;
  created_at: string;
}

interface FriendStore {
  suggestedUsers: SuggestedUser[];
  friends: FriendRecord[];
  pendingOutgoing: FriendRequest[];
  pendingIncoming: FriendRequest[];
  notifications: AppNotification[];
  unreadCount: number;
  isLoadingDiscovery: boolean;

  loadDiscovery: () => Promise<void>;
  loadFriends: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  sendRequest: (toUserId: string) => Promise<{ success: boolean; error?: string }>;
  respondToRequest: (requestId: string, accept: boolean) => Promise<{ success: boolean }>;
  markAllRead: () => Promise<void>;
  subscribeRealtime: () => () => void;
}

const AVATAR_COLORS = ['#00b4d8', '#e01e5a', '#84cc16', '#f97316', '#a855f7', '#0f4c5c'];

export const useFriendStore = create<FriendStore>((set, get) => ({
  suggestedUsers: [],
  friends: [],
  pendingOutgoing: [],
  pendingIncoming: [],
  notifications: [],
  unreadCount: 0,
  isLoadingDiscovery: false,

  loadDiscovery: async () => {
    set({ isLoadingDiscovery: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { set({ isLoadingDiscovery: false }); return; }
      const myId = session.user.id;

      // Build exclusion sets (self, existing friends, outgoing requests)
      const { friends, pendingOutgoing } = get();
      const friendIds = new Set(friends.map(f => f.friendId));
      const outgoingIds = new Set(pendingOutgoing.map(r => r.to_user));

      const suggestedMap = new Map<string, SuggestedUser>();

      // --- 1. Contact Discovery (opt-in) ---
      try {
        const { status: contactStatus } = await Contacts.requestPermissionsAsync();
        if (contactStatus === 'granted') {
          const { data: contactList } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers],
          });
          const phones = contactList
            .flatMap(c => c.phoneNumbers ?? [])
            .map(p => p.number?.replace(/\D/g, '') ?? '')
            .filter(p => p.length >= 10)
            .map(p => p.slice(-10));

          if (phones.length > 0) {
            const { data: matchedProfiles } = await supabase
              .from('profiles')
              .select('id, username, rating, avatar_color')
              .in('phone_last10', phones)
              .neq('id', myId)
              .limit(20);

            (matchedProfiles ?? []).forEach((p: any) => {
              if (!friendIds.has(p.id) && !outgoingIds.has(p.id)) {
                suggestedMap.set(p.id, {
                  id: p.id,
                  username: p.username,
                  rating: p.rating ?? 1200,
                  avatar_color: p.avatar_color ?? AVATAR_COLORS[0],
                  source: 'contact',
                });
              }
            });
          }
        }
      } catch {
        // contact permission denied or unavailable — skip silently
      }

      // --- 2. Location Discovery (opt-in) ---
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const lat = Math.round(loc.coords.latitude * 10) / 10; // ~11km bucket
          const lng = Math.round(loc.coords.longitude * 10) / 10;

          const { data: nearbyProfiles } = await supabase
            .from('profiles')
            .select('id, username, rating, avatar_color')
            .gte('location_lat', lat - 0.2)
            .lte('location_lat', lat + 0.2)
            .gte('location_lng', lng - 0.2)
            .lte('location_lng', lng + 0.2)
            .neq('id', myId)
            .limit(20);

          (nearbyProfiles ?? []).forEach((p: any) => {
            if (!friendIds.has(p.id) && !outgoingIds.has(p.id) && !suggestedMap.has(p.id)) {
              suggestedMap.set(p.id, {
                id: p.id,
                username: p.username,
                rating: p.rating ?? 1200,
                avatar_color: p.avatar_color ?? AVATAR_COLORS[1],
                source: 'location',
              });
            }
          });
        }
      } catch {
        // location unavailable — skip silently
      }

      // --- 3. Online Presence Fallback ---
      const { data: onlinePresence } = await supabase
        .from('presence')
        .select('user_id, profiles(id, username, rating, avatar_color)')
        .neq('user_id', myId)
        .order('last_seen', { ascending: false })
        .limit(30);

      (onlinePresence ?? []).forEach((row: any) => {
        const p = row.profiles;
        if (!p) return;
        if (!friendIds.has(p.id) && !outgoingIds.has(p.id) && !suggestedMap.has(p.id)) {
          suggestedMap.set(p.id, {
            id: p.id,
            username: p.username,
            rating: p.rating ?? 1200,
            avatar_color: p.avatar_color ?? AVATAR_COLORS[2],
            source: 'online',
          });
        }
      });

      set({ suggestedUsers: Array.from(suggestedMap.values()), isLoadingDiscovery: false });
    } catch {
      set({ isLoadingDiscovery: false });
    }
  },

  loadFriends: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const myId = session.user.id;

      // Load confirmed friends (join profile data)
      const { data: rawFriends } = await supabase
        .from('friends')
        .select(`
          id,
          created_at,
          user_a,
          user_b,
          profile_a:profiles!friends_user_a_fkey(id, username, rating, avatar_color),
          profile_b:profiles!friends_user_b_fkey(id, username, rating, avatar_color)
        `)
        .or(`user_a.eq.${myId},user_b.eq.${myId}`);

      const friends: FriendRecord[] = (rawFriends ?? []).map((row: any) => {
        const isA = row.user_a === myId;
        const friendProfile = isA ? row.profile_b : row.profile_a;
        return {
          id: row.id,
          friendId: friendProfile?.id ?? '',
          username: friendProfile?.username ?? 'Unknown',
          rating: friendProfile?.rating ?? 1200,
          avatar_color: friendProfile?.avatar_color ?? '#84cc16',
          created_at: row.created_at,
        };
      });

      // Load outgoing requests
      const { data: rawOutgoing } = await supabase
        .from('friend_requests')
        .select('id, from_user, to_user, status, created_at, profiles!friend_requests_to_user_fkey(username)')
        .eq('from_user', myId)
        .eq('status', 'pending');

      const pendingOutgoing: FriendRequest[] = (rawOutgoing ?? []).map((r: any) => ({
        id: r.id,
        from_user: r.from_user,
        to_user: r.to_user,
        to_username: r.profiles?.username,
        status: r.status,
        created_at: r.created_at,
      }));

      // Load incoming requests
      const { data: rawIncoming } = await supabase
        .from('friend_requests')
        .select('id, from_user, to_user, status, created_at, profiles!friend_requests_from_user_fkey(username)')
        .eq('to_user', myId)
        .eq('status', 'pending');

      const pendingIncoming: FriendRequest[] = (rawIncoming ?? []).map((r: any) => ({
        id: r.id,
        from_user: r.from_user,
        from_username: r.profiles?.username,
        to_user: r.to_user,
        status: r.status,
        created_at: r.created_at,
      }));

      set({ friends, pendingOutgoing, pendingIncoming });
    } catch {
      // silent
    }
  },

  loadNotifications: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: rows } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(40);

      const notifications: AppNotification[] = rows ?? [];
      const unreadCount = notifications.filter(n => !n.read).length;
      set({ notifications, unreadCount });
    } catch {
      // silent
    }
  },

  sendRequest: async (toUserId: string) => {
    try {
      const { data, error } = await supabase.rpc('send_friend_request', { p_to_user: toUserId });
      if (error) return { success: false, error: error.message };
      if (!data?.success) return { success: false, error: data?.error ?? 'Unknown error' };

      // Optimistically update outgoing pending list
      set(state => ({
        pendingOutgoing: [
          ...state.pendingOutgoing,
          { id: data.request_id, from_user: '', to_user: toUserId, status: 'pending', created_at: new Date().toISOString() },
        ],
        suggestedUsers: state.suggestedUsers.filter(u => u.id !== toUserId),
      }));

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Failed to send request' };
    }
  },

  respondToRequest: async (requestId: string, accept: boolean) => {
    try {
      const { data, error } = await supabase.rpc('respond_friend_request', {
        p_request_id: requestId,
        p_accept: accept,
      });
      if (error || !data?.success) return { success: false };

      // Reload friends and notifications after response
      await get().loadFriends();
      await get().loadNotifications();
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  markAllRead: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false);

      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // silent
    }
  },

  subscribeRealtime: () => {
    const { data: { session } } = supabase.auth.getSession() as any;

    const channel = supabase
      .channel('friend-system-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          get().loadNotifications();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friends' },
        () => {
          get().loadFriends();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friend_requests' },
        () => {
          get().loadFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
