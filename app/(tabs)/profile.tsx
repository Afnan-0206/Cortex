import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Switch,
  Share,
  Linking,
  Image,
  TextInput,
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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../src/store/userStore';
import { useSettings } from '../../lib/hooks/useSettings';
import { executeOptimisticAction } from '../../lib/optimisticManager';

// Reusable Spring Pressable Component
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

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const logout = useUserStore((state) => state.logout);
  const { settings, updateSettingField, updateUsername } = useSettings();

  // Modal & Toggles State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Edit Username Modal State
  const [editNameModal, setEditNameModal] = useState(false);
  const [editNameInput, setEditNameInput] = useState(profile.name || 'User');

  const handleCopyHandle = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedHandle(true);
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  const handleAction = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (type === 'leaderboard') {
      router.push('/leaderboard');
    } else if (type === 'practice') {
      router.push('/battle');
    } else {
      setActiveModal(type);
    }
  };

  const handleSaveName = async () => {
    const clean = editNameInput.trim();
    if (clean) {
      await updateUsername(clean);
    }
    setEditNameModal(false);
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const currentUsername = profile.name || 'User';
  const avatarLetter = currentUsername[0]?.toUpperCase() || 'U';
  const handleName = `@${currentUsername.toLowerCase().replace(/\s+/g, '_')}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. REALISTIC HERO PROFILE CARD ── */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(132, 204, 22, 0.12)', 'rgba(23, 25, 32, 0.95)', '#171920']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.topGlossyRim} />

          <View style={styles.profileHeaderRow}>
            {/* Avatar Circle with Edit Icon */}
            <Pressable
              style={styles.avatarWrapper}
              onPress={() => {
                setEditNameInput(currentUsername);
                setEditNameModal(true);
              }}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="pencil" size={10} color="#84cc16" />
              </View>
            </Pressable>

            {/* Name, Handle & League */}
            <View style={styles.identityDetails}>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={() => {
                  setEditNameInput(currentUsername);
                  setEditNameModal(true);
                }}
              >
                <Text style={styles.username}>{currentUsername.toUpperCase()}</Text>
                <MaterialCommunityIcons name="pencil-circle" size={18} color="#84cc16" />
              </Pressable>

              <Pressable style={styles.handlePill} onPress={handleCopyHandle}>
                <Text style={styles.handleText}>
                  {copiedHandle ? 'COPIED TO CLIPBOARD ✓' : handleName}
                </Text>
                {!copiedHandle && (
                  <MaterialCommunityIcons name="content-copy" size={12} color="#6b7280" />
                )}
              </Pressable>

              <Text style={styles.leagueTag}>
                {profile.email ? `Account: ${profile.email}` : 'Bronze Division • Rookie Athlete'}
              </Text>
            </View>
          </View>

          {/* Quick Stats Metrics Row */}
          <View style={styles.statsPillGrid}>
            <View style={styles.statPillItem}>
              <MaterialCommunityIcons name="fire" size={16} color="#f97316" />
              <Text style={styles.statPillValue}>{profile.streak ?? 0} STREAK</Text>
            </View>

            <View style={styles.statPillItem}>
              <MaterialCommunityIcons name="hexagon-outline" size={14} color="#84cc16" />
              <Text style={styles.statPillValue}>{profile.brainPoints ?? 0} XP</Text>
            </View>

            <View style={styles.statPillItem}>
              <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#22c55e" />
              <Text style={styles.statPillValue}>{profile.totalSessionsCompleted ?? 0} SESSIONS</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── 2. BENTO CONTROL HUBS (MODERN ATHLETIC ARENA UX) ── */}

        {/* HUB 1: SOCIAL & SQUAD BENTO */}
        <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.bentoSection}>
          <Text style={styles.bentoSectionTitle}>SQUAD & SOCIAL HUB</Text>

          <View style={styles.bentoGridRow}>
            {/* Friends Bento Card */}
            <ScalePressable
              containerStyle={{ flex: 1 }}
              style={styles.bentoCard}
              onPress={() => handleAction('friends')}
            >
              <View style={[styles.bentoIconWrap, { backgroundColor: '#0f2232' }]}>
                <MaterialCommunityIcons name="account-group-outline" size={22} color="#38bdf8" />
              </View>
              <Text style={styles.bentoCardTitle}>Friends & Squad</Text>
              <Text style={styles.bentoCardSub}>3 Active Online</Text>
            </ScalePressable>

            {/* Messages Bento Card */}
            <ScalePressable
              containerStyle={{ flex: 1 }}
              style={styles.bentoCard}
              onPress={() => handleAction('messages')}
            >
              <View style={[styles.bentoIconWrap, { backgroundColor: '#211832' }]}>
                <MaterialCommunityIcons name="message-text-outline" size={22} color="#a78bfa" />
              </View>
              <Text style={styles.bentoCardTitle}>Duel Messages</Text>
              <Text style={styles.bentoCardSub}>Chat with rivals</Text>
            </ScalePressable>
          </View>
        </Animated.View>

        {/* HUB 2: PLAY & COMPETITIVE ARENA */}
        <Animated.View entering={FadeInUp.delay(190).duration(300)} style={styles.bentoSection}>
          <Text style={styles.bentoSectionTitle}>ARENA & TRAINING</Text>

          <View style={styles.bentoGridRow}>
            {/* Solo Practice */}
            <ScalePressable
              containerStyle={{ flex: 1 }}
              style={styles.bentoCard}
              onPress={() => handleAction('practice')}
            >
              <View style={[styles.bentoIconWrap, { backgroundColor: '#2a1220' }]}>
                <MaterialCommunityIcons name="dumbbell" size={22} color="#ec4899" />
              </View>
              <Text style={styles.bentoCardTitle}>Solo Drills</Text>
              <Text style={styles.bentoCardSub}>Speed Workout</Text>
            </ScalePressable>

            {/* Global Leaderboard */}
            <ScalePressable
              containerStyle={{ flex: 1 }}
              style={styles.bentoCard}
              onPress={() => handleAction('leaderboard')}
            >
              <View style={[styles.bentoIconWrap, { backgroundColor: '#2b1b10' }]}>
                <MaterialCommunityIcons name="podium" size={22} color="#f97316" />
              </View>
              <Text style={styles.bentoCardTitle}>Global Rankings</Text>
              <Text style={styles.bentoCardSub}>Top Athletes</Text>
            </ScalePressable>
          </View>
        </Animated.View>

        {/* HUB 3: COMMUNITY & BROADCASTS */}
        <Animated.View entering={FadeInUp.delay(230).duration(300)} style={styles.bentoSection}>
          <Text style={styles.bentoSectionTitle}>COMMUNITY & MEDIA</Text>

          <View style={styles.bentoGridRow}>
            {/* About Cortex Card */}
            <ScalePressable
              containerStyle={{ flex: 1 }}
              style={styles.bentoCard}
              onPress={() => handleAction('about_cortex')}
            >
              <View style={[styles.bentoIconWrap, { backgroundColor: '#1e1b2e' }]}>
                <MaterialCommunityIcons name="brain" size={22} color="#a78bfa" />
              </View>
              <Text style={styles.bentoCardTitle}>Serious Minds</Text>
              <Text style={styles.bentoCardSub}>Cortex Manifesto</Text>
            </ScalePressable>

            {/* Matiks TV */}
            <ScalePressable
              containerStyle={{ flex: 1 }}
              style={styles.bentoCard}
              onPress={() => handleAction('matiks_tv')}
            >
              <View style={[styles.bentoIconWrap, { backgroundColor: '#2d1416' }]}>
                <MaterialCommunityIcons name="television-play" size={22} color="#ef4444" />
              </View>
              <Text style={styles.bentoCardTitle}>Matiks TV</Text>
              <Text style={styles.bentoCardSub}>Live Replays</Text>
            </ScalePressable>

            {/* Refer & Earn */}
            <ScalePressable
              containerStyle={{ flex: 1 }}
              style={styles.bentoCard}
              onPress={() => handleAction('refer')}
            >
              <View style={[styles.bentoIconWrap, { backgroundColor: '#262210' }]}>
                <MaterialCommunityIcons name="chart-pie" size={22} color="#22c55e" />
              </View>
              <Text style={styles.bentoCardTitle}>Earn 50 Pies</Text>
              <Text style={styles.bentoCardSub}>Invite Friends</Text>
            </ScalePressable>
          </View>
        </Animated.View>

        {/* HUB 4: APP CONTROLS & SUPPORT */}
        <Animated.View entering={FadeInUp.delay(270).duration(300)} style={styles.bentoSection}>
          <Text style={styles.bentoSectionTitle}>SETTINGS & SUPPORT</Text>

          <View style={styles.controlsListCard}>
            <View style={styles.controlRow}>
              <View style={styles.controlMeta}>
                <MaterialCommunityIcons name="bell-outline" size={18} color="#84cc16" style={{ marginRight: 10 }} />
                <Text style={styles.controlTitle}>Daily Streak Reminders (8:00 PM)</Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  updateSettingField('notificationsEnabled', val);
                }}
                trackColor={{ false: '#20242e', true: '#84cc16' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.controlDivider} />

            <View style={styles.controlRow}>
              <View style={styles.controlMeta}>
                <MaterialCommunityIcons name="vibrate" size={18} color="#38bdf8" style={{ marginRight: 10 }} />
                <Text style={styles.controlTitle}>Haptic Vibration Feedback</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={(val) => {
                  executeOptimisticAction({
                    actionName: 'Haptic Feedback',
                    previousState: hapticsEnabled,
                    optimisticState: val,
                    applyState: setHapticsEnabled,
                    serverTask: async () => {
                      // Simulates async storage/backend settings sync
                      await new Promise((resolve) => setTimeout(resolve, 300));
                    },
                  });
                }}
                trackColor={{ false: '#20242e', true: '#84cc16' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.controlDivider} />

            <View style={styles.controlRow}>
              <View style={styles.controlMeta}>
                <MaterialCommunityIcons name="volume-high" size={18} color="#facc15" style={{ marginRight: 10 }} />
                <Text style={styles.controlTitle}>Game Audio & Sound FX</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setSoundEnabled(val);
                }}
                trackColor={{ false: '#20242e', true: '#84cc16' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.controlDivider} />

            <Pressable
              style={styles.controlRow}
              onPress={() => {
                setEditNameInput(currentUsername);
                setEditNameModal(true);
              }}
            >
              <View style={styles.controlMeta}>
                <MaterialCommunityIcons name="account-edit-outline" size={18} color="#84cc16" style={{ marginRight: 10 }} />
                <Text style={styles.controlTitle}>Edit Player Username</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />
            </Pressable>

            <View style={styles.controlDivider} />

            <Pressable style={styles.controlRow} onPress={handleSignOut}>
              <View style={styles.controlMeta}>
                <MaterialCommunityIcons name="logout" size={18} color="#ef4444" style={{ marginRight: 10 }} />
                <Text style={[styles.controlTitle, { color: '#ef4444' }]}>Sign Out Account</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#ef4444" />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── 4. FOOTER SLOGAN & BRAND SIGNATURE ── */}
        <Animated.View entering={FadeInUp.delay(310).duration(300)} style={styles.footerBrand}>
          <Text style={styles.sloganText1}>TRAIN YOUR BRAIN.</Text>
          <View style={styles.sloganRow2}>
            <Text style={styles.sloganGreen}>BATTLE </Text>
            <Text style={styles.sloganText2}>YOUR BEST.</Text>
          </View>

          <Text style={styles.versionLabel}>VERSION 1.26.9 • MATIKS ENGINE</Text>
        </Animated.View>
      </ScrollView>

      {/* ── INTERACTIVE FUNCTION MODALS ── */}

      {/* Friends Modal */}
      <Modal
        visible={activeModal === 'friends'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveModal(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Squad & Friends 👥</Text>
            <Text style={styles.modalSub}>
              Connect with mental athletes worldwide and challenge them to live 1v1 duels.
            </Text>

            <ScalePressable
              style={styles.modalPrimaryBtn}
              onPress={async () => {
                Haptics.selectionAsync();
                await Share.share({
                  message: '🧠 Challenge me on Cortex: @affu._123! Join my squad: https://cortex.app/u/affu_123',
                });
              }}
            >
              <MaterialCommunityIcons name="share-variant" size={16} color="#000000" />
              <Text style={styles.modalPrimaryBtnText}>SHARE SQUAD CODE</Text>
            </ScalePressable>

            <ScalePressable style={styles.modalCloseBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalCloseBtnText}>CLOSE</Text>
            </ScalePressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* About Cortex Brand Manifesto Modal */}
      <Modal
        visible={activeModal === 'about_cortex'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveModal(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Cortex: Where Serious Minds Hang Out 🧠</Text>
            <Text style={styles.modalSub}>
              Play fun Math, Memory and Puzzle Duels and boost your brain daily.{'\n\n'}
              Cortex isn't your usual brain-training app; it's where clean, editorial design meets high-intensity mental athletics. Compete with intent in 1v1 live duels, cross-math grids, pattern puzzles, and memory sprints.{'\n\n'}
              Science + Discipline = Cortex. Built by engineers and cognition nerds to turn your screen time into training, not just time killed.
            </Text>
            <ScalePressable style={styles.modalPrimaryBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalPrimaryBtnText}>ENTER ARENA</Text>
            </ScalePressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Messages Modal */}
      <Modal
        visible={activeModal === 'messages'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveModal(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Duel Messages 💬</Text>
            <Text style={styles.modalSub}>No unread duel chats right now. Challenge rivals in the Arena to start chatting!</Text>
            <ScalePressable style={styles.modalCloseBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalCloseBtnText}>CLOSE</Text>
            </ScalePressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Matiks TV / Community Modals */}
      <Modal
        visible={activeModal === 'matiks_tv' || activeModal === 'refer'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveModal(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {activeModal === 'matiks_tv' ? 'Matiks Esports TV 📺' : 'Refer & Earn 🥧'}
            </Text>
            <Text style={styles.modalSub}>
              {activeModal === 'matiks_tv'
                ? 'Watch live grandmaster duels, speed arithmetic championship replays, and strategy breakdowns.'
                : 'Invite friends to Matiks! Earn 50 PIES for every friend who completes their first duel.'}
            </Text>

            <ScalePressable
              style={styles.modalPrimaryBtn}
              onPress={async () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (activeModal === 'refer') {
                  await Share.share({ message: '🧠 Join me on Cortex and earn 50 Pies! https://cortex.app/invite' });
                }
                setActiveModal(null);
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>
                {activeModal === 'refer' ? 'SHARE INVITE LINK' : 'WATCH NOW'}
              </Text>
            </ScalePressable>

            <ScalePressable style={styles.modalCloseBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalCloseBtnText}>CLOSE</Text>
            </ScalePressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Username Modal */}
      <Modal
        visible={editNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setEditNameModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditNameModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit Player Username ✏️</Text>
            <Text style={styles.modalSub}>Update the username shown on your profile and leaderboards:</Text>
            
            <TextInput
              style={{
                height: 48,
                backgroundColor: '#12141a',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#84cc16',
                paddingHorizontal: 14,
                color: '#ffffff',
                fontSize: 15,
                fontWeight: '700',
                marginBottom: 16,
              }}
              value={editNameInput}
              onChangeText={setEditNameInput}
              placeholder="Enter new username"
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={20}
            />

            <ScalePressable style={styles.modalPrimaryBtn} onPress={handleSaveName}>
              <Text style={styles.modalPrimaryBtnText}>SAVE USERNAME</Text>
            </ScalePressable>

            <ScalePressable style={styles.modalCloseBtn} onPress={() => setEditNameModal(false)}>
              <Text style={styles.modalCloseBtnText}>CANCEL</Text>
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
    paddingTop: 12,
    paddingBottom: 95,
  },

  // ── 0. TAGLINE BAR ──
  taglineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#171920',
    borderColor: '#262934',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  taglineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#84cc16',
  },
  taglineText: {
    fontFamily: 'Outfit_900Black',
    color: '#84cc16',
    fontSize: 11,
    letterSpacing: 1.5,
  },

  // ── 1. HERO PROFILE CARD ──
  profileCard: {
    backgroundColor: '#171920',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 18,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  topGlossyRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0080ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarLetter: {
    fontFamily: 'Inter_900Black',
    color: '#ffffff',
    fontSize: 28,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0d0e12',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#84cc16',
  },
  identityDetails: {
    flex: 1,
  },
  username: {
    fontFamily: 'Outfit_900Black',
    color: '#ffffff',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  handlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  handleText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#9ca3af',
    fontSize: 11,
  },
  leagueTag: {
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
    fontSize: 11,
    marginTop: 3,
  },
  statsPillGrid: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#0d0e12',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#20242e',
  },
  statPillItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  statPillValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#ffffff',
    fontSize: 11,
  },

  // ── 2. STREAK WIDGET CARD ──
  widgetCard: {
    backgroundColor: '#171920',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  widgetLeftGraphic: {
    marginRight: 14,
  },
  widgetGraphicBox: {
    width: 90,
    height: 84,
    borderRadius: 16,
    padding: 8,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  widgetMascotText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#ffffff',
    fontSize: 14,
  },
  widgetMascotSub: {
    fontFamily: 'Inter_700Bold',
    color: '#ffedd5',
    fontSize: 9,
  },
  coolSunglasses: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 3,
  },
  lens: {
    width: 12,
    height: 8,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  widgetContent: {
    flex: 1,
  },
  widgetTitle: {
    fontFamily: 'Outfit_900Black',
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 2,
  },
  widgetSub: {
    fontFamily: 'Inter_500Medium',
    color: '#9ca3af',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  widgetCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0d0e12',
    borderWidth: 1.5,
    borderColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 7,
  },
  widgetCtaBtnInstalled: {
    borderColor: '#22c55e',
    backgroundColor: '#12251a',
  },
  widgetCtaText: {
    fontFamily: 'Outfit_900Black',
    color: '#ffffff',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  widgetCtaTextInstalled: {
    color: '#22c55e',
  },

  // ── 3. BENTO CONTROL HUBS ──
  bentoSection: {
    marginBottom: 20,
  },
  bentoSectionTitle: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#6b7280',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  bentoGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoCard: {
    backgroundColor: '#171920',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262934',
    padding: 14,
    alignItems: 'flex-start',
  },
  bentoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bentoCardTitle: {
    fontFamily: 'Outfit_900Black',
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 2,
  },
  bentoCardSub: {
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
    fontSize: 10,
  },

  // Controls List
  controlsListCard: {
    backgroundColor: '#171920',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262934',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  controlMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  controlTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    fontSize: 12,
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#20242e',
  },

  // ── 4. FOOTER BRAND ──
  footerBrand: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  brandTagline: {
    fontFamily: 'Outfit_900Black',
    color: '#84cc16',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 8,
  },
  sloganText1: {
    fontFamily: 'BebasNeue_400Regular',
    color: '#374151',
    fontSize: 34,
    letterSpacing: 1,
    lineHeight: 34,
  },
  sloganRow2: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sloganGreen: {
    fontFamily: 'BebasNeue_400Regular',
    color: '#84cc16',
    fontSize: 34,
    letterSpacing: 1,
    lineHeight: 34,
  },
  sloganText2: {
    fontFamily: 'BebasNeue_400Regular',
    color: '#374151',
    fontSize: 34,
    letterSpacing: 1,
    lineHeight: 34,
  },
  versionLabel: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#4b5563',
    fontSize: 10,
    marginTop: 10,
    letterSpacing: 0.5,
  },

  // Modals
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
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262934',
  },
  modalTitle: {
    fontFamily: 'Outfit_900Black',
    color: '#ffffff',
    fontSize: 20,
    marginBottom: 6,
  },
  modalSub: {
    fontFamily: 'Inter_500Medium',
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#84cc16',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    fontFamily: 'Outfit_900Black',
    color: '#000000',
    fontSize: 12,
  },
  modalCloseBtn: {
    backgroundColor: '#20242e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#9ca3af',
    fontSize: 12,
  },
});
