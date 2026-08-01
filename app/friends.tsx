import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useFriendStore, SuggestedUser, FriendRecord, FriendRequest } from '../src/store/friendStore';

type ActiveTab = 'friends' | 'pending' | 'discover';

const ACCENT_COLORS = ['#00b4d8', '#e01e5a', '#84cc16', '#f97316', '#a855f7', '#facc15', '#0f4c5c'];

function getColor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
}

interface ScalePressableProps {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  disabled?: boolean;
}

const ScalePressable: React.FC<ScalePressableProps> = ({ onPress, style, children, disabled }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 14, stiffness: 220 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 180 }); }}
      onPress={onPress}
    >
      <Animated.View style={[style, animStyle]}>{children}</Animated.View>
    </Pressable>
  );
};

// ─── Friend Row ───────────────────────────────────────────────
function FriendRow({ friend, onChallenge }: { friend: FriendRecord; onChallenge: () => void }) {
  const color = getColor(friend.username);
  return (
    <Animated.View entering={FadeInDown.duration(250)} style={styles.listRow}>
      <View style={[styles.avatarCircle, { backgroundColor: color }]}>
        <Text style={styles.avatarLetter}>{friend.username[0]?.toUpperCase() || 'A'}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{friend.username.toUpperCase()}</Text>
        <Text style={styles.rowSub}>⚡ {friend.rating} Rating</Text>
      </View>
      <ScalePressable style={styles.challengeBtn} onPress={onChallenge}>
        <MaterialCommunityIcons name="sword-cross" size={14} color="#0d0e12" />
        <Text style={styles.challengeBtnText}>CHALLENGE</Text>
      </ScalePressable>
    </Animated.View>
  );
}

// ─── Pending Request Row ───────────────────────────────────────
function PendingRow({
  request,
  direction,
  onAccept,
  onDecline,
}: {
  request: FriendRequest;
  direction: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const username = direction === 'incoming' ? (request.from_username ?? 'Unknown') : (request.to_username ?? 'Unknown');
  const color = getColor(username);
  return (
    <Animated.View entering={FadeInDown.duration(250)} style={styles.listRow}>
      <View style={[styles.avatarCircle, { backgroundColor: color }]}>
        <Text style={styles.avatarLetter}>{username[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{username.toUpperCase()}</Text>
        <Text style={[styles.rowSub, direction === 'incoming' ? { color: '#84cc16' } : { color: '#6b7280' }]}>
          {direction === 'incoming' ? 'Wants to be your friend' : 'Request sent'}
        </Text>
      </View>
      {direction === 'incoming' ? (
        <View style={styles.requestBtns}>
          <ScalePressable style={styles.acceptBtn} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onAccept?.(); }}>
            <MaterialCommunityIcons name="check" size={14} color="#0d0e12" />
          </ScalePressable>
          <ScalePressable style={styles.declineBtn} onPress={() => { Haptics.selectionAsync(); onDecline?.(); }}>
            <MaterialCommunityIcons name="close" size={14} color="#f87171" />
          </ScalePressable>
        </View>
      ) : (
        <View style={styles.sentBadge}>
          <Text style={styles.sentBadgeText}>SENT</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Discover Card ─────────────────────────────────────────────
function DiscoverCard({ user, isSent, onSend }: { user: SuggestedUser; isSent: boolean; onSend: () => void }) {
  const color = getColor(user.username);
  const sourceLabel = user.source === 'contact' ? '📱 In Your Contacts' : user.source === 'location' ? '📍 Nearby' : '🟢 Online Now';
  return (
    <Animated.View entering={FadeInDown.duration(250)} style={styles.discoverCard}>
      <View style={[styles.discoverAvatar, { backgroundColor: color }]}>
        <Text style={styles.discoverAvatarLetter}>{user.username[0]?.toUpperCase() || 'A'}</Text>
      </View>
      <Text style={styles.discoverName} numberOfLines={1}>{user.username.toUpperCase()}</Text>
      <Text style={styles.discoverRating}>⚡ {user.rating}</Text>
      <Text style={styles.discoverSource}>{sourceLabel}</Text>
      <ScalePressable
        style={[styles.discoverSendBtn, isSent && styles.discoverSendBtnSent]}
        disabled={isSent}
        onPress={() => { Haptics.selectionAsync(); onSend(); }}
      >
        <MaterialCommunityIcons name={isSent ? 'check' : 'account-plus'} size={13} color={isSent ? '#6b7280' : '#84cc16'} />
        <Text style={[styles.discoverSendText, isSent && { color: '#6b7280' }]}>
          {isSent ? 'REQUESTED' : 'ADD FRIEND'}
        </Text>
      </ScalePressable>
    </Animated.View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function FriendsScreen() {
  const router = useRouter();
  const {
    suggestedUsers, friends, pendingIncoming, pendingOutgoing,
    isLoadingDiscovery, loadDiscovery, loadFriends, sendRequest, respondToRequest,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('friends');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      loadFriends();
      loadDiscovery();
    }, [])
  );

  const outgoingIds = new Set(pendingOutgoing.map(r => r.to_user));
  const allSentIds = new Set([...sentIds, ...outgoingIds]);

  const handleSend = async (userId: string) => {
    setSentIds(prev => new Set([...prev, userId]));
    await sendRequest(userId);
  };

  const handleAccept = async (requestId: string) => {
    const result = await respondToRequest(requestId, true);
    if (!result.success) Alert.alert('Error', 'Could not accept request. Try again.');
  };

  const handleDecline = async (requestId: string) => {
    await respondToRequest(requestId, false);
  };

  const pendingCount = pendingIncoming.length + pendingOutgoing.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>SQUAD</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {([
          { id: 'friends', label: `FRIENDS${friends.length > 0 ? ` (${friends.length})` : ''}`, icon: 'account-group' },
          { id: 'pending', label: `PENDING${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: 'account-clock' },
          { id: 'discover', label: 'DISCOVER', icon: 'compass-outline' },
        ] as const).map(tab => (
          <Pressable
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
          >
            <MaterialCommunityIcons name={tab.icon as any} size={16} color={activeTab === tab.id ? '#84cc16' : '#6b7280'} />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── MY FRIENDS TAB ── */}
        {activeTab === 'friends' && (
          <View>
            {friends.length === 0 ? (
              <Animated.View entering={FadeInUp.duration(300)} style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group-outline" size={48} color="#374151" />
                <Text style={styles.emptyTitle}>No Friends Yet</Text>
                <Text style={styles.emptySub}>Discover players and send friend requests to build your squad.</Text>
                <ScalePressable style={styles.emptyAction} onPress={() => { Haptics.selectionAsync(); setActiveTab('discover'); }}>
                  <Text style={styles.emptyActionText}>DISCOVER PLAYERS →</Text>
                </ScalePressable>
              </Animated.View>
            ) : (
              friends.map(friend => (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  onChallenge={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/(tabs)/battle');
                  }}
                />
              ))
            )}
          </View>
        )}

        {/* ── PENDING TAB ── */}
        {activeTab === 'pending' && (
          <View>
            {pendingIncoming.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>INCOMING REQUESTS</Text>
                {pendingIncoming.map(req => (
                  <PendingRow
                    key={req.id}
                    request={req}
                    direction="incoming"
                    onAccept={() => handleAccept(req.id)}
                    onDecline={() => handleDecline(req.id)}
                  />
                ))}
              </View>
            )}
            {pendingOutgoing.length > 0 && (
              <View>
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>SENT REQUESTS</Text>
                {pendingOutgoing.map(req => (
                  <PendingRow key={req.id} request={req} direction="outgoing" />
                ))}
              </View>
            )}
            {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && (
              <Animated.View entering={FadeInUp.duration(300)} style={styles.emptyState}>
                <MaterialCommunityIcons name="account-clock-outline" size={48} color="#374151" />
                <Text style={styles.emptyTitle}>No Pending Requests</Text>
                <Text style={styles.emptySub}>When someone sends you a friend request, it will appear here.</Text>
              </Animated.View>
            )}
          </View>
        )}

        {/* ── DISCOVER TAB ── */}
        {activeTab === 'discover' && (
          <View>
            {isLoadingDiscovery ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#84cc16" />
                <Text style={styles.loadingText}>Discovering players near you…</Text>
              </View>
            ) : suggestedUsers.length === 0 ? (
              <Animated.View entering={FadeInUp.duration(300)} style={styles.emptyState}>
                <MaterialCommunityIcons name="compass-outline" size={48} color="#374151" />
                <Text style={styles.emptyTitle}>No Players Found</Text>
                <Text style={styles.emptySub}>Enable contacts or location access to discover players you know.</Text>
              </Animated.View>
            ) : (
              <View style={styles.discoverGrid}>
                {suggestedUsers.map(user => (
                  <DiscoverCard
                    key={user.id}
                    user={user}
                    isSent={allSentIds.has(user.id)}
                    onSend={() => handleSend(user.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#090b10' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    color: '#ffffff',
    fontSize: 24,
    letterSpacing: 4,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f1116',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: '#84cc16' },
  tabLabel: { fontFamily: 'Inter_800ExtraBold', color: '#6b7280', fontSize: 9, letterSpacing: 0.5 },
  tabLabelActive: { color: '#84cc16' },

  // Scroll content
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },

  // List row (friends & pending)
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171920',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: 'Inter_800ExtraBold', color: '#ffffff', fontSize: 18 },
  rowInfo: { flex: 1 },
  rowName: { fontFamily: 'Inter_800ExtraBold', color: '#ffffff', fontSize: 13 },
  rowSub: { fontFamily: 'Inter_500Medium', color: '#6b7280', fontSize: 11, marginTop: 2 },

  // Challenge button
  challengeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#84cc16',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  challengeBtnText: { fontFamily: 'Inter_800ExtraBold', color: '#0d0e12', fontSize: 9, letterSpacing: 0.5 },

  // Request buttons
  requestBtns: { flexDirection: 'row', gap: 6 },
  acceptBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#84cc16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1a0f0f',
    borderWidth: 1,
    borderColor: '#f87171',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentBadge: {
    backgroundColor: '#1a1f2e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  sentBadgeText: { fontFamily: 'Inter_800ExtraBold', color: '#6b7280', fontSize: 9 },

  // Discover grid
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  discoverCard: {
    width: '47%',
    backgroundColor: '#171920',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 14,
    alignItems: 'center',
  },
  discoverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  discoverAvatarLetter: { fontFamily: 'Inter_800ExtraBold', color: '#ffffff', fontSize: 22 },
  discoverName: { fontFamily: 'Inter_800ExtraBold', color: '#ffffff', fontSize: 12, textAlign: 'center' },
  discoverRating: { fontFamily: 'Inter_500Medium', color: '#6b7280', fontSize: 10, marginTop: 2 },
  discoverSource: { fontFamily: 'Inter_500Medium', color: '#84cc16', fontSize: 9, marginTop: 4, textAlign: 'center' },
  discoverSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f1116',
    borderWidth: 1,
    borderColor: '#2d3342',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 10,
    width: '100%',
    justifyContent: 'center',
  },
  discoverSendBtnSent: { borderColor: '#374151', backgroundColor: '#0c0e12' },
  discoverSendText: { fontFamily: 'Inter_800ExtraBold', color: '#84cc16', fontSize: 9 },

  // Section label
  sectionLabel: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#4b5563',
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: 'Inter_800ExtraBold', color: '#ffffff', fontSize: 18 },
  emptySub: { fontFamily: 'Inter_500Medium', color: '#6b7280', fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
  emptyAction: {
    backgroundColor: '#84cc16',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  emptyActionText: { fontFamily: 'Inter_800ExtraBold', color: '#0d0e12', fontSize: 12 },

  // Loading
  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 14 },
  loadingText: { fontFamily: 'Inter_500Medium', color: '#6b7280', fontSize: 13 },
});
