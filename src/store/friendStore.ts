import { create } from 'zustand';
import { supabase } from '../../lib/supabase';

export interface SuggestedUser {
  id: string;
  username: string;
  rating: number;
  avatar_color: string;
  source: 'contact' | 'location' | 'online';
}

export interface FriendRecord {
  id: string;
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
  notificationsPage: number;
  hasMoreNotifications: boolean;

  loadDiscovery: (page?: number, pageSize?: number) => Promise<void>;
  loadFriends: () => Promise<void>;
  loadNotifications: (page?: number, pageSize?: number) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  sendRequest: (toUserId: string) => Promise<{ success: boolean; error?: string }>;
  respondToRequest: (requestId: string, accept: boolean) => Promise<{ success: boolean }>;
  markAllRead: () => Promise<void>;
  subscribeRealtime: () => Promise<() => void>;
}

const AVATAR_COLORS = ['#00b4d8', '#e01e5a', '#84cc16', '#f97316', '#a855f7', '#0f4c5c'];
const DEFAULT_PAGE_SIZE = 20;

export const useFriendStore = create<FriendStore>((set, get) => ({
  suggestedUsers: [],
  friends: [],
  pendingOutgoing: [],
  pendingIncoming: [],
  notifications: [],
  unreadCount: 0,
  isLoadingDiscovery: false,
  notificationsPage: 0,
  hasMoreNotifications: true,

  loadDiscovery: async (page = 0, pageSize = DEFAULT_PAGE_SIZE) => {
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

      // Single query with join to avoid N+1
      const { data: onlinePresence } = await supabase
        .from('presence')
        .select('user_id, profiles!inner(id, username, rating, avatar_color)')
        .neq('user_id', myId)
        .order('last_seen', { ascending: false })
        .limit(pageSize);

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

      // Only replace on first page, append on subsequent pages
      if (page === 0) {
        set({ suggestedUsers: Array.from(suggestedMap.values()), isLoadingDiscovery: false });
      } else {
        set(state => ({
          suggestedUsers: [...state.suggestedUsers, ...Array.from(suggestedMap.values())],
          isLoadingDiscovery: false,
        }));
      }
    } catch {
      set({ isLoadingDiscovery: false });
    }
  },

  loadFriends: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const myId = session.user.id;

      // Single query: friends + their profiles + pending requests in parallel
      const [
        { data: rawFriends },
        { data: rawOutgoing },
        { data: rawIncoming },
      ] = await Promise.all([
        supabase
          .from('friends')
          .select(`
            id,
            created_at,
            user_a,
            user_b,
            profile_a:profiles!friends_user_a_fkey(id, username, rating, avatar_color),
            profile_b:profiles!friends_user_b_fkey(id, username, rating, avatar_color)
          `)
          .or(`user_a.eq.${myId},user_b.eq.${myId}`),
        supabase
          .from('friend_requests')
          .select('id, from_user, to_user, status, created_at, profiles!friend_requests_to_user_fkey(username)')
          .eq('from_user', myId)
          .eq('status', 'pending')
          .limit(50),
        supabase
          .from('friend_requests')
          .select('id, from_user, to_user, status, created_at, profiles!friend_requests_from_user_fkey(username)')
          .eq('to_user', myId)
          .eq('status', 'pending')
          .limit(50),
      ]);

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

      const pendingOutgoing: FriendRequest[] = (rawOutgoing ?? []).map((r: any) => ({
        id: r.id,
        from_user: r.from_user,
        to_user: r.to_user,
        to_username: r.profiles?.username,
        status: r.status,
        created_at: r.created_at,
      }));

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

  loadNotifications: async (page = 0, pageSize = DEFAULT_PAGE_SIZE) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: rows, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      const notifications: AppNotification[] = rows ?? [];
      const unreadCount = notifications.filter(n => !n.read).length;

      if (page === 0) {
        set({ notifications, unreadCount, notificationsPage: 0, hasMoreNotifications: (count ?? 0) > pageSize });
      } else {
        set(state => ({
          notifications: [...state.notifications, ...notifications],
          notificationsPage: page,
          hasMoreNotifications: (count ?? 0) > (page + 1) * pageSize,
        }));
      }
    } catch {
      // silent
    }
  },

  loadMoreNotifications: async () => {
    const { notificationsPage, hasMoreNotifications, loadNotifications } = get();
    if (!hasMoreNotifications) return;
    await loadNotifications(notificationsPage + 1);
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

  subscribeRealtime: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return () => {};

    const myId = session.user.id;
    const channel = supabase
      .channel(`friend-system-realtime:${myId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${myId}` },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          set(state => ({
            notifications: [newNotif, ...state.notifications].slice(0, 100),
            unreadCount: state.unreadCount + (newNotif.read ? 0 : 1),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friends', filter: `user_a=eq.${myId}` },
        () => {
          get().loadFriends();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friends', filter: `user_b=eq.${myId}` },
        () => {
          get().loadFriends();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friend_requests', filter: `to_user=eq.${myId}` },
        () => {
          get().loadFriends();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friend_requests', filter: `from_user=eq.${myId}` },
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
