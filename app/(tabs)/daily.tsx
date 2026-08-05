import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  Circle,
  Ellipse,
  G,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { colors } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';
import { secureStorage } from '../../lib/secureStorage';
import { supabase } from '../../lib/supabase';

interface SectionConfig {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  questions: Array<{
    prompt: string;
    target: string;
    options: number[];
    answer: number;
  }>;
}

const WORKOUT_SECTIONS: SectionConfig[] = [
  {
    id: 1,
    title: 'WARMUP',
    subtitle: '3 quick recall questions to ignite focus',
    icon: 'flash',
    questions: [
      { prompt: '29 - 5 = ', target: '?', options: [21, 26, 29, 24], answer: 24 },
      { prompt: '18 + 7 = ', target: '?', options: [23, 25, 27, 24], answer: 25 },
      { prompt: '6 × 8 = ', target: '?', options: [42, 48, 54, 46], answer: 48 },
    ],
  },
  {
    id: 2,
    title: 'SPEED ROUND',
    subtitle: 'Fast-paced mental math against the clock',
    icon: 'lock-outline',
    questions: [
      { prompt: '14 × 4 = ', target: '?', options: [52, 56, 60, 48], answer: 56 },
      { prompt: '81 ÷ 9 = ', target: '?', options: [7, 8, 9, 11], answer: 9 },
      { prompt: '75 - 28 = ', target: '?', options: [47, 43, 49, 45], answer: 47 },
    ],
  },
  {
    id: 3,
    title: 'ACCURACY ROUND',
    subtitle: 'Precision calculations requiring exact focus',
    icon: 'lock-outline',
    questions: [
      { prompt: '15 × 15 = ', target: '?', options: [215, 225, 235, 245], answer: 225 },
      { prompt: '144 ÷ 12 = ', target: '?', options: [10, 11, 12, 14], answer: 12 },
      { prompt: '99 + 48 = ', target: '?', options: [137, 147, 157, 149], answer: 147 },
    ],
  },
  {
    id: 4,
    title: 'FINAL PUSH',
    subtitle: 'Ultimate challenge to lock in today’s streak',
    icon: 'lock-outline',
    questions: [
      { prompt: '√196 + 6 = ', target: '?', options: [18, 20, 22, 24], answer: 20 },
      { prompt: '45 × 3 = ', target: '?', options: [125, 135, 145, 130], answer: 135 },
      { prompt: '120 - 37 = ', target: '?', options: [81, 83, 85, 87], answer: 83 },
    ],
  },
];

export default function DailyChallengeScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);

  const todayStr = new Date().toISOString().split('T')[0];
  const isAlreadyCompletedToday = profile.lastCompletedDate === todayStr;

  const [activeSectionId, setActiveSectionId] = useState<number>(1);
  const [unlockedSections, setUnlockedSections] = useState<number[]>([1]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(isAlreadyCompletedToday);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  // Sync completion state if store profile updates
  useEffect(() => {
    if (profile.lastCompletedDate === todayStr) {
      setIsCompleted(true);
    }
  }, [profile.lastCompletedDate, todayStr]);

  // Format today's date e.g. "WED, AUG 5"
  const formattedDate = new Date()
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  const currentSection = WORKOUT_SECTIONS.find((s) => s.id === activeSectionId) || WORKOUT_SECTIONS[0];
  const activeQuestion = currentSection.questions[currentQuestionIdx] || currentSection.questions[0];

  const handleOptionPress = (optionValue: number) => {
    if (feedback !== null || isCompleted || isAlreadyCompletedToday) return;

    setSelectedOption(optionValue);
    const isRight = optionValue === activeQuestion.answer;

    if (isRight) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFeedback('correct');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setFeedback('wrong');
    }

    setTimeout(() => {
      setSelectedOption(null);
      setFeedback(null);

      if (isRight) {
        if (currentQuestionIdx + 1 < currentSection.questions.length) {
          setCurrentQuestionIdx((prev) => prev + 1);
        } else {
          // Section complete
          if (activeSectionId < 4) {
            const nextSecId = activeSectionId + 1;
            setUnlockedSections((prev) => [...new Set([...prev, nextSecId])]);
            setActiveSectionId(nextSecId);
            setCurrentQuestionIdx(0);
          } else {
            // Full Workout Complete! (Lock immediately & update stores ONCE)
            setIsCompleted(true);

            const curProfile = useUserStore.getState().profile;
            const alreadyDone = curProfile.lastCompletedDate === todayStr;

            const newStreak = alreadyDone
              ? Math.max(1, curProfile.streak || 1)
              : Math.max(1, (curProfile.streak || 0) + 1);

            const newLongest = Math.max(curProfile.longestStreak || 0, newStreak);
            const newXP = (curProfile.brainPoints || 0) + 250;
            const newCoins = (curProfile.coins || 0) + 50;

            const updatedProfile = {
              ...curProfile,
              brainPoints: newXP,
              coins: newCoins,
              streak: newStreak,
              longestStreak: newLongest,
              lastCompletedDate: todayStr,
              dailyRewardClaimed: true,
              dailyProgress: 4,
            };

            // Update Zustand state & Storage
            useUserStore.setState({ profile: updatedProfile });
            secureStorage.setItem('cortex_profile_v2', JSON.stringify(updatedProfile)).catch(() => {});

            // Update daily missions
            useUserStore.getState().updateMissionProgress('workout', 1);
            useUserStore.getState().updateMissionProgress('earn_xp', 250);

            // Sync to Supabase background
            const user = useUserStore.getState().user;
            if (user?.id) {
              (async () => {
                try {
                  await supabase
                    .from('profiles')
                    .update({
                      xp: newXP,
                      coins: newCoins,
                      streak: newStreak,
                      best_streak: newLongest,
                    })
                    .eq('id', user.id);
                } catch (e) {
                  console.warn('Supabase sync error:', e);
                }
              })();
            }

            setShowCompletionModal(true);
          }
        }
      }
    }, 500);
  };

  const userHasCompletedToday = isCompleted || isAlreadyCompletedToday;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── TOP HEADER BAR ── */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.dateTagRow}>
                <MaterialCommunityIcons name="calendar-month-outline" size={14} color="#84cc16" />
                <Text style={styles.dateTagText}>{formattedDate}</Text>
              </View>
              <Text style={styles.mainTitle}>Daily Workout</Text>
              <Text style={styles.headerSubtitle}>
                Build consistency. Train your mind. Beat yesterday.
              </Text>
            </View>

            {/* Streak Pill Badge */}
            <View style={styles.streakPill}>
              <MaterialCommunityIcons name="fire" size={18} color="#f97316" />
              <Text style={styles.streakPillText}>{profile.streak || 0} STREAK</Text>
            </View>
          </View>

          {/* ── TODAY'S REWARD BANNER ── */}
          <View style={styles.rewardBanner}>
            <View style={styles.rewardLeftContent}>
              <View style={styles.trophyIconCircle}>
                <MaterialCommunityIcons name="trophy-variant" size={20} color="#84cc16" />
              </View>
              <View>
                <Text style={styles.rewardHeaderTag}>TODAY'S REWARD</Text>
                <View style={styles.rewardValuesRow}>
                  <Text style={styles.xpText}>+250 XP</Text>
                  <Text style={styles.dividerText}>|</Text>
                  <Text style={styles.coinsText}>+50 COINS</Text>
                </View>
              </View>
            </View>

            {/* 3D Brain Pedestal Graphic */}
            <View style={styles.brainGraphicWrap}>
              <Svg width={110} height={85} viewBox="0 0 110 85" fill="none">
                <Defs>
                  <RadialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#4ade80" stopOpacity="0.8" />
                    <Stop offset="70%" stopColor="#22c55e" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#166534" stopOpacity="0" />
                  </RadialGradient>
                  <LinearGradient id="pedestalTop" x1="0" y1="0" x2="100%" y2="0">
                    <Stop offset="0%" stopColor="#1e293b" />
                    <Stop offset="50%" stopColor="#475569" />
                    <Stop offset="100%" stopColor="#0f172a" />
                  </LinearGradient>
                  <LinearGradient id="brainColor" x1="0" y1="0" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#86efac" />
                    <Stop offset="50%" stopColor="#22c55e" />
                    <Stop offset="100%" stopColor="#15803d" />
                  </LinearGradient>
                </Defs>

                <Circle cx="55" cy="40" r="38" fill="url(#brainGlow)" />
                <Ellipse cx="55" cy="40" rx="42" ry="8" stroke="#84cc16" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />

                <Ellipse cx="55" cy="68" rx="36" ry="10" fill="url(#pedestalTop)" stroke="#334155" strokeWidth="1.5" />
                <Path d="M19 68 C19 76 91 76 91 68 L86 78 C86 84 24 84 24 78 Z" fill="#0f172a" stroke="#1e293b" />

                <Ellipse cx="55" cy="64" rx="28" ry="6" fill="#0284c7" opacity="0.4" />
                <Ellipse cx="55" cy="64" rx="26" ry="5" stroke="#38bdf8" strokeWidth="1.5" />

                <G transform="translate(26, 12)">
                  <Path
                    d="M28 8 C18 8 10 14 10 24 C10 32 16 38 24 40 C28 40 29 36 29 32 C29 28 24 26 24 22 C24 16 28 12 32 12 Z"
                    fill="url(#brainColor)"
                    stroke="#bbf7d0"
                    strokeWidth="1"
                  />
                  <Path
                    d="M30 8 C40 8 48 14 48 24 C48 32 42 38 34 40 C30 40 29 36 29 32 C29 28 34 26 34 22 C34 16 30 12 26 12 Z"
                    fill="url(#brainColor)"
                    stroke="#bbf7d0"
                    strokeWidth="1"
                  />
                  <Path d="M18 16 C22 18 20 24 16 26" stroke="#166534" strokeWidth="2" fill="none" />
                  <Path d="M40 16 C36 18 38 24 42 26" stroke="#166534" strokeWidth="2" fill="none" />
                  <Path d="M22 28 C26 30 24 36 18 36" stroke="#166534" strokeWidth="2" fill="none" />
                  <Path d="M36 28 C32 30 34 36 40 36" stroke="#166534" strokeWidth="2" fill="none" />
                  <Path d="M28 10 L28 38" stroke="#4ade80" strokeWidth="1.5" />
                </G>
              </Svg>
            </View>
          </View>

          {/* ── STREAK RULE NOTICE BOX ── */}
          <View style={styles.noticeBox}>
            <View style={styles.infoIconCircle}>
              <MaterialCommunityIcons name="information" size={14} color="#ffffff" />
            </View>
            <Text style={styles.noticeText}>
              Streak advances only when the full workout is completed. Leaving mid-way saves progress but yields no streak gain.
            </Text>
          </View>

          {/* ── WORKOUT SECTIONS HEADER ── */}
          <Text style={styles.sectionTrackerTitle}>WORKOUT SECTIONS</Text>
          <View style={styles.sectionsRow}>
            {WORKOUT_SECTIONS.map((sec) => {
              const isUnlocked = userHasCompletedToday || unlockedSections.includes(sec.id);
              const isActive = activeSectionId === sec.id && !userHasCompletedToday;
              const isDone = userHasCompletedToday || (unlockedSections.includes(sec.id) && sec.id < activeSectionId);

              return (
                <Pressable
                  key={sec.id}
                  onPress={() => {
                    if (isUnlocked && !userHasCompletedToday) {
                      Haptics.selectionAsync();
                      setActiveSectionId(sec.id);
                      setCurrentQuestionIdx(0);
                    }
                  }}
                  style={[
                    styles.sectionChip,
                    isActive && styles.sectionChipActive,
                    isDone && styles.sectionChipDone,
                    !isUnlocked && styles.sectionChipLocked,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isDone ? 'check-circle' : isActive ? 'flash' : 'lock-outline'}
                    size={15}
                    color={isDone ? '#84cc16' : isActive ? '#22c55e' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.sectionChipText,
                      isActive && styles.sectionChipTextActive,
                      isDone && styles.sectionChipTextDone,
                      !isUnlocked && styles.sectionChipTextLocked,
                    ]}
                  >
                    {sec.title}
                  </Text>
                  {isActive && <View style={styles.activeUnderline} />}
                </Pressable>
              );
            })}
          </View>

          {/* ── INTERACTIVE QUESTION CARD OR WORKOUT COMPLETED SUMMARY CARD ── */}
          {userHasCompletedToday ? (
            <View style={styles.completedCard}>
              <View style={styles.completedIconRing}>
                <MaterialCommunityIcons name="check-bold" size={32} color="#22c55e" />
              </View>
              <Text style={styles.completedTitleText}>Today's Workout Complete!</Text>
              <Text style={styles.completedSubtitleText}>
                You completed all 4 sections for {formattedDate}. Your streak is secured!
              </Text>

              <View style={styles.completedMetricsRow}>
                <View style={styles.metricChip}>
                  <MaterialCommunityIcons name="hexagon-outline" size={16} color="#84cc16" />
                  <Text style={styles.metricChipText}>+250 XP</Text>
                </View>
                <View style={styles.metricChip}>
                  <MaterialCommunityIcons name="star-circle-outline" size={16} color="#facc15" />
                  <Text style={styles.metricChipText}>+50 COINS</Text>
                </View>
                <View style={styles.metricChip}>
                  <MaterialCommunityIcons name="fire" size={16} color="#f97316" />
                  <Text style={styles.metricChipText}>🔥 {profile.streak || 1} Streak</Text>
                </View>
              </View>

              <Pressable
                style={styles.returnArenaBtn}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.returnArenaText}>Return to Arena</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.questionCard}>
              <View style={styles.cardTopHeaderRow}>
                <View style={styles.sectionBadgePill}>
                  <Text style={styles.sectionBadgeText}>
                    SECTION {currentSection.id}/4: {currentSection.title}
                  </Text>
                </View>
                <Text style={styles.questionCounterText}>
                  <Text style={styles.qGreenText}>Q{currentQuestionIdx + 1}</Text>/{currentSection.questions.length}
                </Text>
              </View>

              <Text style={styles.sectionSubText}>{currentSection.subtitle}</Text>

              {/* Prompt Box */}
              <View style={styles.promptDisplayBox}>
                <Text style={styles.promptFormulaText}>
                  {activeQuestion.prompt}
                  <Text style={styles.greenTargetText}>{activeQuestion.target}</Text>
                </Text>

                <View style={styles.gridDotsGraphic} pointerEvents="none">
                  {[...Array(12)].map((_, i) => (
                    <View key={i} style={styles.dotSingle} />
                  ))}
                </View>
              </View>

              {/* Option Buttons (2x2 Grid) */}
              <View style={styles.optionsGridContainer}>
                {activeQuestion.options.map((optionNum, i) => {
                  const isSelected = selectedOption === optionNum;
                  const isRight = feedback === 'correct' && isSelected;
                  const isWrong = feedback === 'wrong' && isSelected;

                  return (
                    <Pressable
                      key={i}
                      disabled={feedback !== null || userHasCompletedToday}
                      onPress={() => handleOptionPress(optionNum)}
                      style={[
                        styles.optionChoiceBtn,
                        isRight && styles.optionChoiceRight,
                        isWrong && styles.optionChoiceWrong,
                      ]}
                    >
                      <Text style={[styles.optionChoiceText, isRight && styles.textRight, isWrong && styles.textWrong]}>
                        {optionNum}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── WORKOUT COMPLETION CELEBRATION MODAL ── */}
        <Modal visible={showCompletionModal} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCardContainer}>
              <View style={styles.modalTrophyRing}>
                <MaterialCommunityIcons name="trophy-award" size={44} color="#22c55e" />
              </View>

              <Text style={styles.modalTitleText}>DAILY WORKOUT COMPLETE!</Text>
              <Text style={styles.modalSubText}>
                You completed all 4 sections for today and secured your streak.
              </Text>

              <View style={styles.rewardSummaryRow}>
                <View style={styles.rewardMetricItem}>
                  <MaterialCommunityIcons name="hexagon-outline" size={16} color="#84cc16" />
                  <Text style={styles.metricText}>+250 XP</Text>
                </View>

                <View style={styles.rewardMetricItem}>
                  <MaterialCommunityIcons name="star-circle-outline" size={16} color="#facc15" />
                  <Text style={styles.metricText}>+50 COINS</Text>
                </View>

                <View style={styles.rewardMetricItem}>
                  <MaterialCommunityIcons name="fire" size={16} color="#f97316" />
                  <Text style={styles.metricText}>🔥 {profile.streak || 1} Streak</Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowCompletionModal(false);
                }}
                style={styles.modalContinueBtn}
              >
                <Text style={styles.modalContinueText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07090e',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },

  /* Header Section */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  dateTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateTagText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: '#84cc16',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 32,
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    color: '#94a3b8',
    lineHeight: 18,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#131824',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  streakPillText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12.5,
    color: '#ffffff',
  },

  /* Reward Banner */
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#081d12',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  rewardLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardHeaderTag: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: '#4ade80',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rewardValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 20,
    color: '#ffffff',
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#22c55e',
  },
  coinsText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 20,
    color: '#facc15',
  },
  brainGraphicWrap: {
    width: 100,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Notice Box */
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0b162c',
    borderColor: '#1e3a8a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  infoIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 17,
  },

  /* Workout Sections Row */
  sectionTrackerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  sectionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative',
  },
  sectionChipActive: {
    backgroundColor: '#0d2216',
    borderColor: '#22c55e',
  },
  sectionChipDone: {
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderColor: '#84cc16',
  },
  sectionChipLocked: {
    opacity: 0.6,
  },
  sectionChipText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: '#84cc16',
  },
  sectionChipTextActive: {
    color: '#22c55e',
  },
  sectionChipTextDone: {
    color: '#84cc16',
  },
  sectionChipTextLocked: {
    color: '#64748b',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -1,
    width: 24,
    height: 3,
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },

  /* Completed Workout Card */
  completedCard: {
    backgroundColor: '#0b1220',
    borderColor: '#22c55e',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  completedIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completedTitleText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 22,
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  completedSubtitleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  completedMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 24,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricChipText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: '#ffffff',
  },
  returnArenaBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#22c55e',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnArenaText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: '#052e16',
  },

  /* Interactive Question Card */
  questionCard: {
    backgroundColor: '#0b1220',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  cardTopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionBadgePill: {
    backgroundColor: '#0d2416',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11.5,
    color: '#22c55e',
  },
  questionCounterText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    color: '#64748b',
  },
  qGreenText: {
    color: '#22c55e',
  },
  sectionSubText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    color: '#94a3b8',
    marginBottom: 20,
  },

  /* Prompt Box */
  promptDisplayBox: {
    backgroundColor: '#080c16',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  promptFormulaText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 34,
    color: '#ffffff',
  },
  greenTargetText: {
    color: '#22c55e',
  },
  gridDotsGraphic: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    width: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    opacity: 0.25,
    alignContent: 'center',
  },
  dotSingle: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22c55e',
  },

  /* Options Grid */
  optionsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionChoiceBtn: {
    width: '48%',
    height: 56,
    backgroundColor: '#111827',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChoiceRight: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
  },
  optionChoiceWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  optionChoiceText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#ffffff',
  },
  textRight: {
    color: '#22c55e',
  },
  textWrong: {
    color: '#ef4444',
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCardContainer: {
    width: '100%',
    backgroundColor: '#0b1220',
    borderColor: '#22c55e',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalTrophyRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitleText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 22,
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  rewardSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  rewardMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: '#ffffff',
  },
  modalContinueBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#22c55e',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContinueText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: '#052e16',
  },
});
