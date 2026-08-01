import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useUserStore } from '../../src/store/userStore';

interface LeagueTier {
  id: string;
  name: string;
  minElo: number;
  activeAthletes: number;
  status: 'current' | 'locked' | 'unlocked';
}

interface ContestItem {
  id: string;
  title: string;
  host: string;
  reward: string;
  time: string;
}

// Reusable Spring Scale Pressable
interface ScalePressableProps {
  onPress: () => void;
  style?: any;
  containerStyle?: any;
  children: React.ReactNode;
}

const ScalePressable: React.FC<ScalePressableProps> = ({
  onPress,
  style,
  containerStyle,
  children,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={containerStyle}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 14, stiffness: 220 });
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

export default function CompeteScreen() {
  const [selectedLeague, setSelectedLeague] = useState<string>('gold');
  const [showOpeningSoonModal, setShowOpeningSoonModal] = useState<boolean>(false);
  const [selectedContest, setSelectedContest] = useState<ContestItem | null>(null);
  const [isNotified, setIsNotified] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState({ days: 4, hours: 18, minutes: 42, seconds: 20 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const leagues: LeagueTier[] = [
    { id: 'bronze', name: 'Bronze League', minElo: 1000, activeAthletes: 14200, status: 'unlocked' },
    { id: 'silver', name: 'Silver League', minElo: 1200, activeAthletes: 8900, status: 'unlocked' },
    { id: 'gold', name: 'Gold League', minElo: 1400, activeAthletes: 4200, status: 'current' },
    { id: 'diamond', name: 'Diamond League', minElo: 1600, activeAthletes: 1100, status: 'locked' },
    { id: 'ruby', name: 'Ruby Grandmaster', minElo: 1800, activeAthletes: 240, status: 'locked' },
  ];

  const upcomingContests: ContestItem[] = [
    {
      id: 'c1',
      title: 'National Math Olympiad Sprint',
      host: 'MATIKS League',
      reward: '5,000 XP + Hoodie',
      time: 'Today at 8:00 PM',
    },
    {
      id: 'c2',
      title: 'Inter-College Speed Duel',
      host: 'IIT Bombay Chapter',
      reward: '3,000 XP',
      time: 'Tomorrow at 6:00 PM',
    },
    {
      id: 'c3',
      title: 'World Speed Arithmetic Cup',
      host: 'Global Cortex Federation',
      reward: '10,000 XP + Trophy',
      time: 'Sunday at 5:00 PM',
    },
  ];

  const handleRegisterPress = (contest: ContestItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedContest(contest);
    setShowOpeningSoonModal(true);
  };

  const handleToggleNotify = () => {
    if (!isNotified) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.selectionAsync();
    }
    setIsNotified(!isNotified);
  };

  const profile = useUserStore((state) => state.profile);
  const rating = profile.brainPoints ?? 0;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <Text style={styles.caption}>Skill-Bucket Leagues</Text>
          <Text style={styles.title}>Compete & Contests</Text>
          <Text style={styles.subtitle}>
            Official MATIKS platform and college competitive tournaments.
          </Text>
        </Animated.View>

        {/* ── SEASON 1 OPENING SOON COUNTDOWN RIBBON ── */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.launchRibbon}>
          <View style={styles.launchRibbonTop}>
            <View style={styles.openingPillTag}>
              <View style={styles.livePulseDot} />
              <Text style={styles.openingPillText}>OPENING SOON</Text>
            </View>
            <Text style={styles.launchTimerText}>
              {timeLeft.days}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
            </Text>
          </View>
          <Text style={styles.launchRibbonSub}>
            Season 1 Tournament Registrations & Grandmaster Leagues open in {timeLeft.days} days!
          </Text>
        </Animated.View>

        {/* ── CURRENT LEAGUE HIGHLIGHT ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <View style={styles.currentLeagueCard}>
            <View style={styles.leagueHeaderRow}>
              <View>
                <Text style={styles.currentCaption}>ACTIVE DIVISION</Text>
                <Text style={styles.currentName}>{rating >= 1500 ? 'Gold' : rating >= 1000 ? 'Silver' : 'Bronze'} Division ({rating} Rating)</Text>
              </View>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>{rating > 0 ? '#14 Global' : 'Unranked'}</Text>
              </View>
            </View>

            <Text style={styles.leagueBody}>
              Top 10% advance to Diamond Division at 1,600 ELO rating points.
            </Text>
          </View>
        </Animated.View>

        {/* ── LEAGUES TIER SELECTOR ── */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)}>
          <Text style={styles.sectionTitle}>League Tiers</Text>
          <View style={styles.leaguesList}>
            {leagues.map((item) => {
              const isSelected = selectedLeague === item.id;
              const isLocked = item.status === 'locked';

              return (
                <ScalePressable
                  key={item.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedLeague(item.id);
                  }}
                  style={[styles.tierRow, isSelected && styles.tierRowSelected]}
                >
                  <MaterialCommunityIcons
                    name={isLocked ? 'lock-outline' : 'trophy-outline'}
                    size={20}
                    color={isSelected ? '#facc15' : isLocked ? '#6b7280' : '#84cc16'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tierName, isSelected && styles.tierNameSelected]}>
                      {item.name}
                    </Text>
                    {isLocked && (
                      <Text style={styles.lockedTagText}>Opening Soon in Season 1</Text>
                    )}
                  </View>
                  <Text style={styles.tierElo}>{item.minElo}+ ELO</Text>
                </ScalePressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── HOSTED CONTESTS SECTION (OPENING SOON) ── */}
        <Animated.View entering={FadeInUp.delay(200).duration(300)}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Hosted Contests</Text>
            <View style={styles.openingSoonTag}>
              <Text style={styles.openingSoonTagText}>OPENING SOON 🔒</Text>
            </View>
          </View>

          <View style={styles.contestsList}>
            {upcomingContests.map((c) => (
              <View key={c.id} style={styles.contestCard}>
                <View style={styles.contestRow}>
                  <View style={styles.contestMeta}>
                    <Text style={styles.contestHost}>{c.host}</Text>
                    <Text style={styles.contestTitle}>{c.title}</Text>
                    <Text style={styles.contestTime}>{c.time}</Text>
                  </View>
                  <Text style={styles.contestReward}>{c.reward}</Text>
                </View>

                {/* Register Contest Button -> Opening Soon Trigger */}
                <ScalePressable
                  style={styles.registerBtn}
                  onPress={() => handleRegisterPress(c)}
                >
                  <MaterialCommunityIcons name="lock-clock" size={16} color="#ffffff" />
                  <Text style={styles.registerBtnText}>
                    Register Contest (Opening Soon)
                  </Text>
                </ScalePressable>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── OPENING SOON REGISTRATION MODAL ── */}
      <Modal
        visible={showOpeningSoonModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOpeningSoonModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOpeningSoonModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e: GestureResponderEvent) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Tournament Registration</Text>
              <Pressable onPress={() => setShowOpeningSoonModal(false)}>
                <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
              </Pressable>
            </View>

            <View style={styles.contestDetailBox}>
              <View style={styles.modalBadgeRow}>
                <View style={styles.openingSoonBadgeModal}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color="#facc15" />
                  <Text style={styles.openingSoonBadgeModalText}>OPENING SOON 🔒</Text>
                </View>
                <Text style={styles.contestRewardModal}>{selectedContest?.reward}</Text>
              </View>

              <Text style={styles.modalContestTitle}>{selectedContest?.title}</Text>
              <Text style={styles.modalContestHost}>Host: {selectedContest?.host} • {selectedContest?.time}</Text>

              <Text style={styles.modalContestBody}>
                Official MATIKS platform tournament registration opens automatically when Season 1 launches in {timeLeft.days} days!
              </Text>
            </View>

            {/* Actions */}
            <ScalePressable
              style={[styles.notifyModalBtn, isNotified && styles.notifyModalBtnActive]}
              onPress={handleToggleNotify}
            >
              <MaterialCommunityIcons
                name={isNotified ? 'check-circle' : 'bell-ring-outline'}
                size={18}
                color={isNotified ? '#22c55e' : '#000000'}
              />
              <Text style={[styles.notifyModalBtnText, isNotified && styles.notifyModalBtnTextActive]}>
                {isNotified ? "YOU'RE ON THE VIP LAUNCH LIST ✓" : 'GET NOTIFIED AT LAUNCH'}
              </Text>
            </ScalePressable>

            <ScalePressable
              style={styles.closeModalBtn}
              onPress={() => setShowOpeningSoonModal(false)}
            >
              <Text style={styles.closeModalBtnText}>CLOSE</Text>
            </ScalePressable>
          </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 95,
  },

  // ── HEADER ──
  header: {
    marginBottom: 18,
  },
  caption: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 32,
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    lineHeight: 18,
  },

  // ── LAUNCH RIBBON ──
  launchRibbon: {
    backgroundColor: '#171920',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 16,
    marginBottom: 20,
  },
  launchRibbonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  openingPillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#262210',
    borderColor: '#facc15',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#facc15',
  },
  openingPillText: {
    fontFamily: 'Outfit_900Black',
    color: '#facc15',
    fontSize: 9,
  },
  launchTimerText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#ffffff',
    fontSize: 13,
  },
  launchRibbonSub: {
    fontFamily: 'Inter_500Medium',
    color: '#9ca3af',
    fontSize: 11,
    lineHeight: 15,
  },

  // ── CURRENT LEAGUE HIGHLIGHT ──
  currentLeagueCard: {
    backgroundColor: '#171920',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 20,
    marginBottom: 24,
  },
  leagueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currentCaption: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 10,
    color: '#6b7280',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  currentName: {
    fontFamily: 'Outfit_900Black',
    fontSize: 18,
    color: '#ffffff',
  },
  rankBadge: {
    backgroundColor: '#20242e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d3342',
  },
  rankBadgeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  leagueBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },

  // ── LEAGUE TIERS ──
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 12,
  },
  openingSoonTag: {
    backgroundColor: '#262210',
    borderColor: '#facc15',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  openingSoonTagText: {
    fontFamily: 'Outfit_900Black',
    color: '#facc15',
    fontSize: 9,
  },
  leaguesList: {
    backgroundColor: '#171920',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262934',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#262934',
    gap: 12,
  },
  tierRowSelected: {
    backgroundColor: '#20242e',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tierName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#9ca3af',
  },
  tierNameSelected: {
    fontFamily: 'Outfit_900Black',
    color: '#ffffff',
  },
  lockedTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#6b7280',
    marginTop: 1,
  },
  tierElo: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: '#6b7280',
  },

  // ── HOSTED CONTESTS ──
  contestsList: {
    gap: 14,
  },
  contestCard: {
    backgroundColor: '#171920',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 18,
  },
  contestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  contestMeta: {
    flex: 1,
    marginRight: 12,
  },
  contestHost: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  contestTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 17,
    color: '#ffffff',
    marginBottom: 4,
  },
  contestTime: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#9ca3af',
  },
  contestReward: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: '#22c55e',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    backgroundColor: '#20242e',
    borderWidth: 1,
    borderColor: '#2d3342',
    borderRadius: 12,
  },
  registerBtnText: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#ffffff',
    fontSize: 12,
  },

  // Modal
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
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalHeaderTitle: {
    fontFamily: 'Inter_900Black',
    color: '#ffffff',
    fontSize: 18,
  },
  contestDetailBox: {
    backgroundColor: '#0d0e12',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262934',
    marginBottom: 16,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  openingSoonBadgeModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#262210',
    borderColor: '#facc15',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  openingSoonBadgeModalText: {
    fontFamily: 'Inter_900Black',
    color: '#facc15',
    fontSize: 9,
  },
  contestRewardModal: {
    fontFamily: 'Inter_900Black',
    color: '#22c55e',
    fontSize: 12,
  },
  modalContestTitle: {
    fontFamily: 'Inter_900Black',
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 4,
  },
  modalContestHost: {
    fontFamily: 'Inter_700Bold',
    color: '#6b7280',
    fontSize: 11,
    marginBottom: 10,
  },
  modalContestBody: {
    fontFamily: 'Inter_500Medium',
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
  },
  notifyModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#facc15',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },
  notifyModalBtnActive: {
    backgroundColor: '#12251a',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  notifyModalBtnText: {
    fontFamily: 'Inter_900Black',
    color: '#000000',
    fontSize: 12,
  },
  notifyModalBtnTextActive: {
    color: '#22c55e',
  },
  closeModalBtn: {
    backgroundColor: '#20242e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeModalBtnText: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#9ca3af',
    fontSize: 12,
  },
});
