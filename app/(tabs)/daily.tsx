import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useDailyChallenge } from '../../lib/hooks/useDailyChallenge';
import { useUserStore } from '../../src/store/userStore';

export default function DailyChallengeScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const {
    dateStr,
    sections,
    completedSections,
    currentQuestionIndex,
    isCompleted,
    isLoading,
    isSubmitting,
    rewardResult,
    submitAnswer,
    resumeProgress,
  } = useDailyChallenge();

  useFocusEffect(
    useCallback(() => {
      resumeProgress();
    }, [resumeProgress])
  );

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Format date e.g. "SATURDAY, AUG 1"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  // Find active question object
  let accumulated = 0;
  let activeQuestion: any = null;
  let activeSection: any = null;
  let activeSectionIdx = 0;
  let questionInSecIdx = 0;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (currentQuestionIndex < accumulated + sec.questionCount) {
      activeSection = sec;
      activeSectionIdx = i;
      questionInSecIdx = currentQuestionIndex - accumulated;
      activeQuestion = sec.questions[questionInSecIdx];
      break;
    }
    accumulated += sec.questionCount;
  }

  const handleOptionPress = async (optionValue: number) => {
    if (feedback !== null || !activeQuestion) return;

    setSelectedOption(optionValue);
    const res = await submitAnswer(optionValue, 1500);

    if (res.correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFeedback('correct');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setFeedback('wrong');
    }

    setTimeout(() => {
      setSelectedOption(null);
      setFeedback(null);

      if (currentQuestionIndex + 1 >= 15) {
        setShowCompletionModal(true);
      }
    }, 600);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#84cc16" />
        <Text style={styles.loadingText}>Loading Today’s Workout...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 1. HEADER WITH STREAK & REWARD PREVIEW ── */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.headerBlock}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.dateTag}>{formattedDate}</Text>
              <Text style={styles.headerTitle}>DAILY WORKOUT</Text>
            </View>

            {/* Streak Badge */}
            <View style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={18} color="#f97316" />
              <Text style={styles.streakText}>{profile.streak ?? 0} STREAK</Text>
            </View>
          </View>

          {/* Reward Preview & Streak Rule Banner */}
          <View style={{ gap: 8 }}>
            <View style={styles.rewardPreviewRow}>
              <MaterialCommunityIcons name="trophy-outline" size={14} color="#84cc16" />
              <Text style={styles.rewardPreviewText}>REWARD: +250 XP • +50 COINS</Text>
            </View>

            <View style={styles.streakNoticeBox}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#38bdf8" />
              <Text style={styles.streakNoticeText}>
                Streak advances only when the full workout is completed. Leaving mid-way saves progress but yields no streak gain.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── 2. WORKOUT SECTIONS TRACKER ── */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.sectionsTrackerContainer}>
          <Text style={styles.sectionTrackerTitle}>WORKOUT SECTIONS</Text>
          <View style={styles.sectionsGrid}>
            {sections.map((sec, idx) => {
              const isSecDone = completedSections > idx || isCompleted;
              const isSecActive = activeSectionIdx === idx && !isCompleted;
              return (
                <View
                  key={sec.id}
                  style={[
                    styles.sectionChip,
                    isSecActive && styles.sectionChipActive,
                    isSecDone && styles.sectionChipDone,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isSecDone ? 'check-circle' : isSecActive ? 'target' : 'lock-outline'}
                    size={16}
                    color={isSecDone ? '#84cc16' : isSecActive ? '#ffffff' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.sectionChipText,
                      isSecActive && styles.sectionChipTextActive,
                      isSecDone && styles.sectionChipTextDone,
                    ]}
                  >
                    {sec.title.toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── 3. ACTIVE QUESTION CARD OR WORKOUT FINISHED SUMMARY ── */}
        {isCompleted ? (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.completedBox}>
            <View style={styles.completedIconCircle}>
              <MaterialCommunityIcons name="check-bold" size={36} color="#84cc16" />
            </View>
            <Text style={styles.completedTitle}>Today's Workout Complete</Text>
            <Text style={styles.completedSub}>
              You have completed all 4 sections for {formattedDate}. Your streak is locked in!
            </Text>
            <Pressable
              style={styles.returnBtn}
              onPress={async () => {
                await useUserStore.getState().loadProfile();
                router.push('/(tabs)');
              }}
            >
              <Text style={styles.returnBtnText}>Return to Arena</Text>
            </Pressable>
          </Animated.View>
        ) : activeQuestion ? (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.questionCard}>
            {/* Active Section Info Header */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardDisciplineBadge}>
                <Text style={styles.cardDisciplineText}>
                  SECTION {activeSectionIdx + 1}/4: {activeSection?.title.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.questionCounter}>
                Q{questionInSecIdx + 1}/{activeSection?.questionCount}
              </Text>
            </View>
            <Text style={styles.sectionSubtitleText}>{activeSection?.subtitle}</Text>

            {/* Prompt Box */}
            <View style={styles.promptBox}>
              <Text style={styles.operand1Text}>{activeQuestion.operand1}</Text>
              {activeQuestion.operator ? (
                <Text style={styles.operatorText}>
                  {activeQuestion.operator} {activeQuestion.operand2}
                </Text>
              ) : null}
            </View>

            {/* Inline Answer Feedback Banner */}
            {feedback !== null && (
              <Animated.View entering={FadeInDown.duration(200)} style={[styles.feedbackBanner, feedback === 'correct' ? styles.feedbackBannerCorrect : styles.feedbackBannerWrong]}>
                <MaterialCommunityIcons
                  name={feedback === 'correct' ? 'check-circle' : 'close-circle'}
                  size={18}
                  color={feedback === 'correct' ? '#4ade80' : '#f87171'}
                />
                <Text style={[styles.feedbackBannerText, feedback === 'correct' ? styles.feedbackTextCorrect : styles.feedbackTextWrong]}>
                  {feedback === 'correct'
                    ? '✓ Correct! +10 XP'
                    : `✕ Almost — correct answer was ${activeQuestion.answer}`}
                </Text>
              </Animated.View>
            )}

            {/* Option Buttons */}
            <View style={styles.optionsGrid}>
              {activeQuestion.options.map((opt: number, i: number) => {
                const isSelected = selectedOption === opt;
                const isCorrectTarget = Number(opt) === Number(activeQuestion.answer);
                const isSelectedCorrect = feedback === 'correct' && isSelected;
                const isSelectedWrong = feedback === 'wrong' && isSelected;
                const isTargetHighlight = feedback === 'wrong' && isCorrectTarget;

                return (
                  <Pressable
                    key={i}
                    style={[
                      styles.optionBtn,
                      isSelectedCorrect && styles.optionBtnCorrect,
                      isSelectedWrong && styles.optionBtnWrong,
                      isTargetHighlight && styles.optionBtnTargetHighlight,
                    ]}
                    onPress={() => handleOptionPress(opt)}
                    disabled={feedback !== null || isSubmitting}
                  >
                    <View style={styles.optionContentRow}>
                      <Text
                        style={[
                          styles.optionText,
                          (isSelectedCorrect || isTargetHighlight) && styles.optionTextCorrect,
                          isSelectedWrong && styles.optionTextWrong,
                        ]}
                      >
                        {opt}
                      </Text>
                      {isSelectedCorrect ? (
                        <MaterialCommunityIcons name="check-circle" size={18} color="#4ade80" />
                      ) : isSelectedWrong ? (
                        <MaterialCommunityIcons name="close-circle" size={18} color="#f87171" />
                      ) : isTargetHighlight ? (
                        <MaterialCommunityIcons name="check" size={18} color="#4ade80" />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Completion Modal Overlay */}
      <Modal visible={showCompletionModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.modalCard}>
            <View style={styles.modalTrophyRing}>
              <MaterialCommunityIcons name="trophy-award" size={48} color="#84cc16" />
            </View>
            <Text style={styles.modalTitle}>Daily Workout Complete!</Text>
            <Text style={styles.modalSub}>
              You solved all 4 sections and maintained your streak.
            </Text>

            <View style={styles.rewardSummaryRow}>
              <View style={styles.rewardItem}>
                <MaterialCommunityIcons name="hexagon-outline" size={18} color="#84cc16" />
                <Text style={styles.rewardItemText}>+250 XP</Text>
              </View>
              <View style={styles.rewardItem}>
                <MaterialCommunityIcons name="circle-multiple" size={18} color="#facc15" />
                <Text style={styles.rewardItemText}>+50 Coins</Text>
              </View>
              <View style={styles.rewardItem}>
                <MaterialCommunityIcons name="fire" size={18} color="#f97316" />
                <Text style={styles.rewardItemText}>
                  🔥 {rewardResult?.newStreak ?? (profile.streak > 0 ? profile.streak : 1)} Streak
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.modalCtaBtn}
              onPress={() => {
                setShowCompletionModal(false);
                router.push('/(tabs)');
              }}
            >
              <Text style={styles.modalCtaText}>Explore Arena Modes</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#090b10' },
  loadingArea: { flex: 1, backgroundColor: '#090b10', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Header
  headerBlock: { marginBottom: 20 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  dateTag: { color: '#84cc16', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  headerTitle: { color: '#ffffff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#171920', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)' },
  streakText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  rewardPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(132, 204, 22, 0.1)', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(132, 204, 22, 0.2)' },
  rewardPreviewText: { color: '#84cc16', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  streakNoticeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(56, 189, 248, 0.08)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  streakNoticeText: { color: '#38bdf8', fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 15 },

  // Tracker
  sectionsTrackerContainer: { marginBottom: 24 },
  sectionTrackerTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  sectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionChip: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#121620', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  sectionChipActive: { borderColor: '#84cc16', backgroundColor: 'rgba(132, 204, 22, 0.12)' },
  sectionChipDone: { backgroundColor: 'rgba(132, 204, 22, 0.06)' },
  sectionChipText: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  sectionChipTextActive: { color: '#ffffff' },
  sectionChipTextDone: { color: '#84cc16' },

  // Question Card
  questionCard: { backgroundColor: '#121622', borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardDisciplineBadge: { backgroundColor: 'rgba(132, 204, 22, 0.15)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  cardDisciplineText: { color: '#84cc16', fontSize: 11, fontWeight: '800' },
  questionCounter: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  sectionSubtitleText: { color: '#64748b', fontSize: 13, marginBottom: 24 },
  promptBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#090b10', borderRadius: 20, paddingVertical: 28, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
  operand1Text: { fontSize: 32, fontWeight: '900', color: '#ffffff', textAlign: 'center' },
  operatorText: { fontSize: 32, fontWeight: '900', color: '#84cc16', textAlign: 'center', marginTop: 4 },

  // Inline Feedback Banner
  feedbackBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1 },
  feedbackBannerCorrect: { backgroundColor: 'rgba(74, 222, 128, 0.12)', borderColor: '#4ade80' },
  feedbackBannerWrong: { backgroundColor: 'rgba(248, 113, 113, 0.12)', borderColor: '#f87171' },
  feedbackBannerText: { fontSize: 13, fontWeight: '800' },
  feedbackTextCorrect: { color: '#4ade80' },
  feedbackTextWrong: { color: '#f87171' },

  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionBtn: { width: '47%', height: 60, backgroundColor: '#181e2e', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 12 },
  optionContentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
  optionBtnCorrect: { backgroundColor: 'rgba(74, 222, 128, 0.18)', borderColor: '#4ade80' },
  optionBtnWrong: { backgroundColor: 'rgba(248, 113, 113, 0.18)', borderColor: '#f87171' },
  optionBtnTargetHighlight: { backgroundColor: 'rgba(74, 222, 128, 0.12)', borderColor: '#4ade80' },
  optionText: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  optionTextCorrect: { color: '#4ade80' },
  optionTextWrong: { color: '#f87171' },

  // Completed Box
  completedBox: { backgroundColor: '#121622', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(132, 204, 22, 0.3)' },
  completedIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(132, 204, 22, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  completedTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginBottom: 8, textAlign: 'center' },
  completedSub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  returnBtn: { width: '100%', height: 50, backgroundColor: '#84cc16', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  returnBtnText: { fontSize: 16, fontWeight: '800', color: '#0d0e12' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(6, 8, 16, 0.9)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: { width: '100%', backgroundColor: '#121622', borderRadius: 28, padding: 28, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(132, 204, 22, 0.4)' },
  modalTrophyRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(132, 204, 22, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#ffffff', marginBottom: 8, textAlign: 'center' },
  modalSub: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  rewardSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, width: '100%', marginBottom: 24 },
  rewardItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.06)', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 16 },
  rewardItemText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  modalCtaBtn: { width: '100%', height: 52, backgroundColor: '#84cc16', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalCtaText: { fontSize: 16, fontWeight: '900', color: '#0d0e12' },
});
