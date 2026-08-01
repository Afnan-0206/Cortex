import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Modal,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useUserStore } from '../../src/store/userStore';
import { usePresence } from '../../lib/hooks/usePresence';

type ModeType = 'math' | 'puzzle' | 'memory' | 'logic';

interface DuelItem {
  id: string;
  tag?: string;
  ratingTag?: string;
  title: string;
  subtitle: string;
}

interface CategoryConfig {
  id: ModeType;
  name: string;
  count: number;
  accentColor: string;
  activeBorderColor: string;
  activeBg: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  showNewBadge?: boolean;
  duels: DuelItem[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'math',
    name: 'MATH',
    count: 996,
    accentColor: '#facc15', // Yellow
    activeBorderColor: '#facc15',
    activeBg: '#1e1c12',
    iconName: 'tune-vertical',
    duels: [
      {
        id: 'm1',
        tag: 'MATH',
        title: 'SPRINT\nDUELS',
        subtitle: 'RACE TO SOLVE THE MOST IN 1 MINUTE',
      },
      {
        id: 'm2',
        tag: 'MATH',
        title: 'FAST & FIRST\nDUELS',
        subtitle: 'BE THE FIRST TO ANSWER EACH QUESTION',
      },
    ],
  },
  {
    id: 'puzzle',
    name: 'PUZZLE',
    count: 1000,
    accentColor: '#22c55e', // Emerald Green
    activeBorderColor: '#22c55e',
    activeBg: '#12251a',
    iconName: 'view-grid-outline',
    showNewBadge: true,
    duels: [
      {
        id: 'p1',
        ratingTag: 'Rating: 1000',
        title: 'SUDOKU\nDUELS',
        subtitle: 'FILL THE GRID WITH LOGIC AND SPEED.',
      },
      {
        id: 'p2',
        ratingTag: 'Rating: 1000',
        title: 'CROSS MATH\nDUELS',
        subtitle: 'OUTSOLVE YOUR RIVAL, FILL THE GRID.',
      },
      {
        id: 'p3',
        ratingTag: 'Rating: 1000',
        title: 'KEN KEN\nDUELS',
        subtitle: 'LOGIC AND NUMBER COLLIDE IN CAGES.',
      },
      {
        id: 'p4',
        ratingTag: 'Rating: 1000',
        title: 'MATH MAZE\nDUELS',
        subtitle: 'SOLVE THE MAZE TO WIN',
      },
    ],
  },
  {
    id: 'memory',
    name: 'MEMORY',
    count: 991,
    accentColor: '#38bdf8', // Cyan / Light Blue
    activeBorderColor: '#38bdf8',
    activeBg: '#0f2232',
    iconName: 'layers-outline',
    duels: [
      {
        id: 'mem1',
        tag: 'MEMORY',
        title: 'MIND SNAP\nDUELS',
        subtitle: 'WHO CAN SNAP FASTER?',
      },
      {
        id: 'mem2',
        tag: 'MEMORY',
        title: 'FLASH ANZAN\nDUELS',
        subtitle: 'NUMBERS FLASH, SUM THEM WITH SPEED.',
      },
    ],
  },
  {
    id: 'logic',
    name: 'LOGIC',
    count: 1000,
    accentColor: '#ec4899', // Pink / Magenta
    activeBorderColor: '#ec4899',
    activeBg: '#2a1220',
    iconName: 'checkbox-multiple-blank-outline',
    duels: [
      {
        id: 'l1',
        tag: 'LOGIC',
        title: 'ABILITY\nDUELS',
        subtitle: 'SPEED MEETS FULL MATH SKILLSET.',
      },
    ],
  },
];

interface FriendData {
  id: string;
  name: string;
  handle: string;
  avatarUri: string;
}

const SUGGESTED_FRIENDS: FriendData[] = [
  {
    id: 'f1',
    name: 'VIRAT',
    handle: '@zzxzx1zx10',
    avatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'f2',
    name: 'Ann_Jones',
    handle: '@nagatoro_he...',
    avatarUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'f3',
    name: 'Rhythm',
    handle: '@a_rhythm_99',
    avatarUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
];

// Reusable Spring Pressable Component for smooth scale transitions on tap
interface ScalePressableProps {
  onPress: () => void;
  style?: any;
  containerStyle?: any;
  children: React.ReactNode;
  activeScale?: number;
}

const ScalePressable: React.FC<ScalePressableProps> = ({
  onPress,
  style,
  containerStyle,
  children,
  activeScale = 0.96,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={containerStyle}
      onPressIn={() => {
        scale.value = withSpring(activeScale, { damping: 14, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0, { damping: 12, stiffness: 180 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
};

// Pulsing Online Green Dot Component
const PulsingOnlineDot = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(1.0, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.onlineDot, animatedStyle]} />;
};

// Real Dynamic Animated Progress Bar Component
interface AnimatedProgressBarProps {
  current: number;
  total?: number;
  claimed?: boolean;
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  current,
  total = 6,
  claimed = false,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    const targetFraction = Math.min(1, Math.max(0, current / total));
    progress.value = withSpring(targetFraction, { damping: 15, stiffness: 120 });
  }, [current, total]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${Math.max(12, progress.value * 100)}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          claimed && { backgroundColor: '#22c55e' },
          animatedStyle,
        ]}
      >
        <Text style={styles.progressText}>
          {current}/{total}
        </Text>
      </Animated.View>
      <View
        style={[
          styles.trophyBadge,
          current >= total && !claimed && { backgroundColor: '#84cc16' },
          claimed && { backgroundColor: '#15803d' },
        ]}
      >
        <MaterialCommunityIcons
          name={claimed ? 'check-bold' : 'trophy-outline'}
          size={14}
          color={current >= total && !claimed ? '#000000' : '#84cc16'}
        />
      </View>
    </View>
  );
};

// Mascot Graphic Component with floating micro-animation
const AnimatedMascot = () => {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(3, { duration: 1400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[mascotStyles.container, animatedStyle]}>
      {/* Pi Body / Lightning Bolt Shape */}
      <View style={mascotStyles.headBar}>
        {/* Face */}
        <View style={mascotStyles.eyeRow}>
          <View style={mascotStyles.eye}>
            <View style={mascotStyles.pupil} />
          </View>
          <View style={mascotStyles.eye}>
            <View style={mascotStyles.pupil} />
          </View>
        </View>
        <View style={mascotStyles.smile} />
        {/* Pi Symbol Tag on Head */}
        <Text style={mascotStyles.piTagText}>π</Text>
      </View>
      {/* Left Leg Stem */}
      <View style={mascotStyles.leftLeg}>
        <View style={mascotStyles.shoe} />
      </View>
      {/* Right Leg Stem */}
      <View style={mascotStyles.rightLeg}>
        <View style={mascotStyles.shoe} />
      </View>
      {/* Running Arms */}
      <View style={mascotStyles.leftArm} />
      <View style={mascotStyles.rightArm} />
    </Animated.View>
  );
};

const mascotStyles = StyleSheet.create({
  container: {
    width: 80,
    height: 100,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headBar: {
    width: 64,
    height: 48,
    backgroundColor: '#84cc16',
    borderRadius: 14,
    transform: [{ rotate: '-12deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 8,
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#101216',
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  eye: {
    width: 10,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 5,
    height: 6,
    backgroundColor: '#000000',
    borderRadius: 3,
  },
  smile: {
    width: 12,
    height: 4,
    borderBottomWidth: 2,
    borderColor: '#000000',
    borderRadius: 2,
    marginTop: 2,
  },
  piTagText: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontFamily: 'Inter_900Black',
    fontSize: 10,
    color: '#000000',
  },
  leftLeg: {
    position: 'absolute',
    bottom: 12,
    left: 18,
    width: 10,
    height: 36,
    backgroundColor: '#84cc16',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#101216',
    transform: [{ rotate: '25deg' }],
  },
  rightLeg: {
    position: 'absolute',
    bottom: 8,
    right: 18,
    width: 10,
    height: 38,
    backgroundColor: '#84cc16',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#101216',
    transform: [{ rotate: '-35deg' }],
  },
  shoe: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 18,
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  leftArm: {
    position: 'absolute',
    top: 22,
    left: 2,
    width: 18,
    height: 8,
    backgroundColor: '#84cc16',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#101216',
    transform: [{ rotate: '-30deg' }],
  },
  rightArm: {
    position: 'absolute',
    top: 22,
    right: 2,
    width: 18,
    height: 8,
    backgroundColor: '#84cc16',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#101216',
    transform: [{ rotate: '40deg' }],
  },
});

export default function ArenaHomeScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const loadProfile = useUserStore((state) => state.loadProfile);
  const incrementDailyProgress = useUserStore((state) => state.incrementDailyProgress);
  const claimDailyReward = useUserStore((state) => state.claimDailyReward);
  const { onlineUsers } = usePresence();

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const [selectedMode, setSelectedMode] = useState<ModeType>('math');
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);

  const dailyProgress = profile.dailyProgress ?? 0;
  const dailyRewardClaimed = profile.dailyRewardClaimed ?? false;
  const displayXP = profile.brainPoints ?? 0;
  const displayStreak = profile.streak ?? 0;

  const activeCategory = CATEGORIES.find((c) => c.id === selectedMode) || CATEGORIES[0];

  const handleCategoryPress = (modeId: ModeType) => {
    Haptics.selectionAsync();
    setSelectedMode(modeId);
  };

  const handleSendRequest = (friendId: string) => {
    Haptics.selectionAsync();
    setSentRequests((prev) => ({ ...prev, [friendId]: !prev[friendId] }));
  };

  const handleSimulateDailyProgress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await incrementDailyProgress(1);
  };

  const handleClaimReward = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = await claimDailyReward();
    if (result.xpEarned > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleShareWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = `🧠 Challenge me on Cortex! Matiks just feels better with your friends. Join now: https://cortex.app/invite`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({ message });
      }
    } catch {
      await Share.share({ message });
    }
  };

  const handleGeneralShare = async () => {
    Haptics.selectionAsync();
    await Share.share({
      message: '🧠 Join my Cortex squad and battle in mental math & puzzle duels! https://cortex.app/invite',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. TOP HEADER / STATS CAPSULE ── */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.topHeaderRow}>
          {/* Main Capsule Container */}
          <View style={styles.statsCapsule}>
            {/* Coins Pill */}
            <View style={styles.statPillGreen}>
              <View style={styles.greenTargetCircle}>
                <MaterialCommunityIcons name="circle-multiple" size={12} color="#ffffff" />
              </View>
              <Text style={styles.statPillValue}>{profile.coins ?? 0}</Text>
            </View>

            {/* Streak Flame Pill */}
            <View style={styles.statPillItem}>
              <MaterialCommunityIcons name="fire" size={16} color="#ffffff" />
              <Text style={styles.statPillValue}>{displayStreak}</Text>
            </View>

            {/* XP Bronze Pill */}
            <View style={styles.statPillBronze}>
              <MaterialCommunityIcons name="hexagon-outline" size={14} color="#ffffff" />
              <Text style={styles.xpText}>{displayXP} XP</Text>
            </View>
          </View>

          {/* Right Chat Icon Button */}
          <ScalePressable
            onPress={() => {
              Haptics.selectionAsync();
              setShowChatModal(true);
            }}
            style={styles.chatButton}
          >
            <MaterialCommunityIcons name="message-outline" size={18} color="#ffffff" />
          </ScalePressable>
        </Animated.View>

        {/* Official Brand Tagline Banner */}
        <Animated.View entering={FadeInDown.delay(40).duration(300)} style={styles.brandBannerRow}>
          <Text style={styles.brandMainTitle}>CORTEX</Text>
          <Text style={styles.brandMainSub}>WHERE SERIOUS MINDS HANG OUT</Text>
        </Animated.View>

        {/* ── 2. STORIES / USER AVATARS CAROUSEL ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.storiesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesScroll}
          >
            {/* Story 1: YOU */}
            <View style={styles.storyItem}>
              <View style={[styles.avatarCircle, { backgroundColor: '#84cc16' }]}>
                <Text style={styles.avatarLetter}>{profile.name?.[0]?.toUpperCase() || 'U'}</Text>
                <PulsingOnlineDot />
              </View>
              <Text style={styles.storyName}>YOU</Text>
            </View>

            {/* Live Realtime Presence Online Users */}
            {onlineUsers.map((u, i) => {
              if (u.username === profile.name) return null;
              const colors = ['#00b4d8', '#0f4c5c', '#e01e5a', '#4a2810', '#84cc16'];
              const bg = colors[i % colors.length];
              return (
                <View key={u.user_id || i} style={styles.storyItem}>
                  <View style={[styles.avatarCircle, { backgroundColor: bg }]}>
                    <Text style={styles.avatarLetter}>{u.username?.[0]?.toUpperCase() || 'A'}</Text>
                    <PulsingOnlineDot />
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {(u.username || 'Athlete').toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── 3. TIMER BADGE & DAILY CHALLENGES CARD (REAL INTERACTIVE) ── */}
        <View style={styles.timerRow}>
          <View style={styles.timerBadge}>
            <MaterialCommunityIcons name="clock-outline" size={13} color="#9ca3af" />
            <Text style={styles.timerText}>13:07</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(250)} style={styles.dailyCard}>
          <ScalePressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/(tabs)/daily');
            }}
          >
            <View style={styles.dailyCardHeader}>
              <View>
                <Text style={styles.dailyTitle}>TODAY'S DAILY WORKOUT</Text>
                <Text style={styles.dailySubtitle}>
                  {profile.dailyRewardClaimed || profile.dailyProgress === 4
                    ? 'Today’s Workout Completed (+250 XP • +50 Coins)'
                    : '4-Section Workout • Complete all sections to advance streak'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#84cc16" />
            </View>

            {/* Real Section Progress Bar */}
            <AnimatedProgressBar
              current={profile.dailyRewardClaimed || profile.dailyProgress === 4 ? 4 : (profile.dailyProgress ?? 0)}
              total={4}
              claimed={profile.dailyRewardClaimed || profile.dailyProgress === 4 ? true : false}
            />
          </ScalePressable>
        </Animated.View>

        {/* ── 5. DUELS CATEGORY SELECTOR ── */}
        <View style={styles.duelsSection}>
          <Text style={styles.sectionLabel}>DUELS</Text>
          
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedMode === cat.id;
              return (
                <ScalePressable
                  key={cat.id}
                  containerStyle={{ flex: 1 }}
                  onPress={() => handleCategoryPress(cat.id)}
                  style={[
                    styles.categoryTile,
                    isSelected && {
                      borderColor: cat.activeBorderColor,
                      backgroundColor: cat.activeBg,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: isSelected ? cat.accentColor : '#20242e' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={cat.iconName}
                      size={20}
                      color={isSelected ? '#000000' : cat.accentColor}
                    />
                    {isSelected && (
                      <View style={styles.countBadgePill}>
                        <Text style={styles.countBadgeText}>{cat.count}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      { color: isSelected ? cat.accentColor : '#6b7280' },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </ScalePressable>
              );
            })}
          </View>
        </View>

        {/* Optional 'NEW' badge row for Puzzle category */}
        {activeCategory.showNewBadge && (
          <View style={styles.newBadgeRow}>
            <View style={styles.newBadgePill}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
        )}

        {/* ── 6. DYNAMIC DUEL CARDS ── */}
        <Animated.View
          key={selectedMode}
          entering={FadeInRight.duration(220)}
          style={styles.duelsTray}
        >
          {activeCategory.duels.map((duel) => (
            <ScalePressable
              key={duel.id}
              style={styles.duelCard}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await incrementDailyProgress(1);
                if (duel.id === 'm2') {
                  router.push('/fast-first');
                } else if (duel.id === 'p1') {
                  router.push('/sudoku-duel');
                } else if (duel.id === 'p2') {
                  router.push('/cross-math-duel');
                } else if (duel.id === 'p3') {
                  router.push('/kenken-duel');
                } else if (duel.id === 'p4') {
                  router.push('/math-maze-duel');
                } else if (duel.id === 'mem1') {
                  router.push('/mind-snap-duel');
                } else if (duel.id === 'mem2') {
                  router.push('/flash-anzan-duel');
                } else if (duel.id === 'l1') {
                  router.push('/ability-duel');
                } else {
                  router.push({
                    pathname: '/battle',
                    params: {
                      title: duel.title,
                      subtitle: duel.subtitle,
                      category: activeCategory.name,
                      tag: duel.tag || duel.ratingTag || '1 MIN DUEL',
                    },
                  });
                }
              }}
            >
              <View style={styles.duelHeaderRow}>
                {duel.ratingTag ? (
                  <View style={styles.ratingBadgePill}>
                    <Text style={styles.ratingBadgeText}>{duel.ratingTag}</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.modeTagPill,
                      {
                        borderColor: activeCategory.accentColor,
                        backgroundColor: activeCategory.activeBg,
                      },
                    ]}
                  >
                    <Text style={[styles.modeTagText, { color: activeCategory.accentColor }]}>
                      {duel.tag}
                    </Text>
                  </View>
                )}

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={activeCategory.accentColor}
                />
              </View>

              <Text style={styles.duelTitle}>{duel.title}</Text>
              <Text style={styles.duelSubtitle}>{duel.subtitle}</Text>
            </ScalePressable>
          ))}
        </Animated.View>

        {/* ── 7. SUGGESTED FRIENDS SECTION ── */}
        <View style={styles.friendsSection}>
          <View style={styles.friendsHeaderRow}>
            <Text style={styles.sectionLabel}>SUGGESTED FRIENDS</Text>
            <ScalePressable onPress={() => router.push('/profile')}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </ScalePressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsScroll}
          >
            {SUGGESTED_FRIENDS.map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <Image source={{ uri: friend.avatarUri }} style={styles.friendAvatar} />
                <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
                <Text style={styles.friendHandle} numberOfLines={1}>{friend.handle}</Text>

                <ScalePressable
                  style={[
                    styles.sendRequestBtn,
                    sentRequests[friend.id] && { borderColor: '#84cc16', backgroundColor: '#182414' },
                  ]}
                  onPress={() => handleSendRequest(friend.id)}
                >
                  <MaterialCommunityIcons
                    name={sentRequests[friend.id] ? 'check' : 'account-plus'}
                    size={14}
                    color="#84cc16"
                  />
                  <Text style={styles.sendRequestText}>
                    {sentRequests[friend.id] ? 'SENT' : 'SEND REQUEST'}
                  </Text>
                </ScalePressable>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── 8. SHARE THE CHALLENGE BANNER ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(300)} style={styles.shareBannerCard}>
          <View style={styles.shareLeftContent}>
            <Text style={styles.shareTitle}>SHARE THE CHALLENGE</Text>
            <Text style={styles.shareSubtitle}>
              Matiks just feels better with your friends
            </Text>

            <View style={styles.earnTagRow}>
              <Text style={styles.earnTagText}>EARN 50 PIES</Text>
              <View style={styles.pieBadgeIcon}>
                <MaterialCommunityIcons name="chart-pie" size={12} color="#22c55e" />
              </View>
            </View>

            {/* Buttons Row */}
            <View style={styles.shareActionsRow}>
              <ScalePressable
                style={styles.inviteFriendBtn}
                onPress={handleShareWhatsApp}
              >
                <MaterialCommunityIcons name="whatsapp" size={16} color="#25d366" />
                <Text style={styles.inviteFriendText}>INVITE FRIEND</Text>
              </ScalePressable>

              <ScalePressable
                style={styles.shareIconSquareBtn}
                onPress={handleGeneralShare}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={16} color="#ffffff" />
              </ScalePressable>
            </View>
          </View>

          {/* Right Mascot Illustration */}
          <View style={styles.mascotPositioner}>
            <AnimatedMascot />
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── REAL DAILY CHALLENGES INTERACTIVE MODAL ── */}
      <Modal
        visible={showDailyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDailyModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDailyModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dailyModalHeaderRow}>
              <Text style={styles.dailyModalTitle}>Daily Challenges 🏆</Text>
              <Pressable onPress={() => setShowDailyModal(false)}>
                <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
              </Pressable>
            </View>

            <View style={styles.dailyStatusBadgeBox}>
              <Text style={styles.dailyStatusBigText}>
                {dailyProgress} / 6 Completed
              </Text>
              <Text style={styles.dailyStatusSubText}>
                {dailyRewardClaimed
                  ? 'Awesome! You earned +250 XP today.'
                  : dailyProgress >= 6
                  ? 'All 6 challenges completed! Claim your reward now.'
                  : 'Play duels & solve puzzles to unlock your +250 XP reward!'}
              </Text>
            </View>

            {/* Active Quests List */}
            <View style={styles.questsList}>
              <View style={styles.questRow}>
                <MaterialCommunityIcons name="sword-cross" size={18} color="#facc15" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.questTitle}>Duel Runner (Math & Puzzles)</Text>
                  <Text style={styles.questSub}>Play 2 duels in Arena</Text>
                </View>
                <Text style={styles.questProgressTag}>
                  {dailyProgress >= 2 ? '2/2 ✓' : `${Math.min(2, dailyProgress)}/2`}
                </Text>
              </View>

              <View style={styles.questRow}>
                <MaterialCommunityIcons name="lightning-bolt" size={18} color="#38bdf8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.questTitle}>Speed Master</Text>
                  <Text style={styles.questSub}>Answer 2 rapid questions</Text>
                </View>
                <Text style={styles.questProgressTag}>
                  {dailyProgress >= 4 ? '2/2 ✓' : `${Math.max(0, Math.min(2, dailyProgress - 2))}/2`}
                </Text>
              </View>

              <View style={styles.questRow}>
                <MaterialCommunityIcons name="brain" size={18} color="#ec4899" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.questTitle}>Brain Fitness</Text>
                  <Text style={styles.questSub}>Complete 2 brain challenges</Text>
                </View>
                <Text style={styles.questProgressTag}>
                  {dailyProgress >= 6 ? '2/2 ✓' : `${Math.max(0, Math.min(2, dailyProgress - 4))}/2`}
                </Text>
              </View>
            </View>

            {/* Actions inside Modal */}
            {dailyProgress >= 6 && !dailyRewardClaimed ? (
              <ScalePressable style={styles.claimRewardBtn} onPress={handleClaimReward}>
                <MaterialCommunityIcons name="trophy" size={18} color="#000000" />
                <Text style={styles.claimRewardText}>CLAIM +250 XP REWARD 🏆</Text>
              </ScalePressable>
            ) : dailyRewardClaimed ? (
              <View style={styles.claimedSuccessBadge}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#22c55e" />
                <Text style={styles.claimedSuccessText}>REWARD CLAIMED! (+250 XP)</Text>
              </View>
            ) : (
              <View style={styles.modalActionGroup}>
                <ScalePressable
                  style={styles.playDuelModalBtn}
                  onPress={() => {
                    setShowDailyModal(false);
                    router.push('/battle');
                  }}
                >
                  <Text style={styles.playDuelModalText}>PLAY DUEL</Text>
                </ScalePressable>

                <ScalePressable
                  style={styles.simulateBtn}
                  onPress={handleSimulateDailyProgress}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={16} color="#84cc16" />
                  <Text style={styles.simulateText}>SIMULATE PROGRESS (+1)</Text>
                </ScalePressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Chat / Message Modal */}
      <Modal
        visible={showChatModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChatModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowChatModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Messages & Squad Chat</Text>
            <Text style={styles.modalSub}>No new messages right now. Challenge a friend to start a duel chat!</Text>
            <ScalePressable style={styles.closeModalBtn} onPress={() => setShowChatModal(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </ScalePressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d0e12',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },

  // ── 1. TOP HEADER ──
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandBannerRow: {
    alignItems: 'center',
    marginVertical: 6,
    marginBottom: 14,
  },
  brandMainTitle: {
    fontFamily: 'BebasNeue_400Regular',
    color: '#ffffff',
    fontSize: 28,
    letterSpacing: 4,
  },
  brandMainSub: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#84cc16',
    fontSize: 9,
    letterSpacing: 2,
    marginTop: -2,
  },
  statsCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171920',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262934',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  statPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101216',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 5,
  },
  greenTargetCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  statPillValue: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#ffffff',
    fontSize: 13,
  },
  statPillBronze: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8c4e36',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  xpText: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#ffffff',
    fontSize: 11,
  },
  chatButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#171920',
    borderWidth: 1,
    borderColor: '#262934',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 2. STORIES ──
  storiesContainer: {
    marginBottom: 8,
  },
  storiesScroll: {
    gap: 16,
    paddingRight: 10,
  },
  storyItem: {
    alignItems: 'center',
    width: 58,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontFamily: 'Inter_900Black',
    color: '#ffffff',
    fontSize: 22,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  onlineDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0d0e12',
    zIndex: 10,
  },
  storyName: {
    fontFamily: 'Inter_700Bold',
    color: '#9ca3af',
    fontSize: 9,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── 3. TIMER ──
  timerRow: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1e26',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  timerText: {
    fontFamily: 'Inter_700Bold',
    color: '#9ca3af',
    fontSize: 11,
  },

  // ── 4. DAILY CHALLENGES CARD ──
  dailyCard: {
    backgroundColor: '#171920',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 16,
    marginBottom: 20,
  },
  dailyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyTitle: {
    fontFamily: 'Outfit_900Black',
    color: '#ffffff',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  dailySubtitle: {
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  progressTrack: {
    height: 36,
    backgroundColor: '#0f1116',
    borderRadius: 18,
    marginTop: 14,
    padding: 3,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#84cc16',
    borderRadius: 15,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  progressText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#000000',
    fontSize: 12,
  },
  trophyBadge: {
    position: 'absolute',
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1a1d26',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 5. DUELS SECTION ──
  duelsSection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6b7280',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryTile: {
    flex: 1,
    backgroundColor: '#171920',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262934',
    paddingVertical: 12,
    alignItems: 'center',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  countBadgePill: {
    position: 'absolute',
    bottom: 3,
    backgroundColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  countBadgeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#ffffff',
    fontSize: 8,
  },
  categoryName: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 11,
    marginTop: 8,
  },
  newBadgeRow: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  newBadgePill: {
    backgroundColor: '#2e1065',
    borderColor: '#8b5cf6',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontFamily: 'Outfit_900Black',
    color: '#a78bfa',
    fontSize: 10,
  },

  // ── 6. DUEL CARDS ──
  duelsTray: {
    marginBottom: 14,
  },
  duelCard: {
    backgroundColor: '#171920',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 16,
    marginBottom: 14,
  },
  duelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeTagPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modeTagText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 9,
  },
  ratingBadgePill: {
    backgroundColor: '#12251a',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingBadgeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#22c55e',
    fontSize: 9,
  },
  duelTitle: {
    fontFamily: 'BebasNeue_400Regular',
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: 0.8,
    marginTop: 10,
  },
  duelSubtitle: {
    fontFamily: 'Inter_700Bold',
    color: '#6b7280',
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 8,
  },

  // ── 7. SUGGESTED FRIENDS ──
  friendsSection: {
    marginTop: 6,
    marginBottom: 20,
  },
  friendsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#84cc16',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  friendsScroll: {
    gap: 12,
    paddingRight: 10,
  },
  friendCard: {
    width: 136,
    backgroundColor: '#171920',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 12,
    alignItems: 'center',
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 8,
  },
  friendName: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
  },
  friendHandle: {
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
  },
  sendRequestBtn: {
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
  sendRequestText: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#84cc16',
    fontSize: 9,
  },

  // ── 8. SHARE THE CHALLENGE BANNER ──
  shareBannerCard: {
    backgroundColor: '#171920',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  shareLeftContent: {
    flex: 1,
    paddingRight: 60,
  },
  shareTitle: {
    fontFamily: 'Inter_900Black',
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  shareSubtitle: {
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  earnTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  earnTagText: {
    fontFamily: 'Inter_900Black',
    color: '#22c55e',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  pieBadgeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0f2918',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  inviteFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f1116',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inviteFriendText: {
    fontFamily: 'Inter_900Black',
    color: '#ffffff',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  shareIconSquareBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0f1116',
    borderWidth: 1,
    borderColor: '#2d3342',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotPositioner: {
    position: 'absolute',
    right: 4,
    bottom: -4,
  },

  // Modals & Quests
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#171920',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262934',
  },
  dailyModalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dailyModalTitle: {
    fontFamily: 'Inter_900Black',
    color: '#ffffff',
    fontSize: 20,
  },
  dailyStatusBadgeBox: {
    backgroundColor: '#0f1116',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222734',
    marginBottom: 16,
  },
  dailyStatusBigText: {
    fontFamily: 'Inter_900Black',
    color: '#84cc16',
    fontSize: 22,
    marginBottom: 4,
  },
  dailyStatusSubText: {
    fontFamily: 'Inter_500Medium',
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
  },
  questsList: {
    gap: 10,
    marginBottom: 18,
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#12141a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#20242e',
  },
  questTitle: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#ffffff',
    fontSize: 13,
  },
  questSub: {
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
    fontSize: 11,
    marginTop: 1,
  },
  questProgressTag: {
    fontFamily: 'Inter_900Black',
    color: '#84cc16',
    fontSize: 12,
  },
  modalActionGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  playDuelModalBtn: {
    flex: 1,
    backgroundColor: '#84cc16',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playDuelModalText: {
    fontFamily: 'Inter_900Black',
    color: '#000000',
    fontSize: 13,
  },
  simulateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#12141a',
    borderColor: '#84cc16',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  simulateText: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#84cc16',
    fontSize: 11,
  },
  claimRewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#84cc16',
    borderRadius: 12,
    paddingVertical: 14,
  },
  claimRewardText: {
    fontFamily: 'Inter_900Black',
    color: '#000000',
    fontSize: 14,
  },
  claimedSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#12251a',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  claimedSuccessText: {
    fontFamily: 'Inter_900Black',
    color: '#22c55e',
    fontSize: 13,
  },
  modalTitle: {
    fontFamily: 'Inter_900Black',
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 8,
  },
  modalSub: {
    fontFamily: 'Inter_500Medium',
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeModalBtn: {
    backgroundColor: '#84cc16',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeModalText: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#000000',
    fontSize: 12,
  },
});
