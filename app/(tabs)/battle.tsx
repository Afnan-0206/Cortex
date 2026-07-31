import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

import { colors } from '../../src/theme';
import { useBattleStore } from '../../src/store/battleStore';
import { CortexCard } from '../../src/components/CortexCard';
import { CortexButton } from '../../src/components/CortexButton';
import { ProgressBar } from '../../src/components/ProgressBar';
import { CortexVictoryDefeatView } from '../../src/components/CortexVictoryDefeatView';
import { CortexHowToPlayButton } from '../../src/components/CortexHowToPlayButton';
import { CortexTutorialModal } from '../../src/components/CortexTutorialModal';
import { TUTORIAL_CONFIGS } from '../../src/logic/tutorialConfigs';

export default function BattleScreen() {
  const router = useRouter();
  const battle = useBattleStore();
  const [userInput, setUserInput] = useState<string>('');
  const [inputErrorFlash, setInputErrorFlash] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  const currentQ = battle.questions[battle.currentQuestionIndex] || battle.questions[0];

  // Progressive Urgency Pulse Anim for timer
  const timerPulseScale = useSharedValue(1);

  // Active game timer countdown effect (60s duel)
  useEffect(() => {
    if (battle.status !== 'playing') return;

    const interval = setInterval(() => {
      battle.tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [battle.status, battle.currentQuestionIndex, battle.timeLeft]);

  useEffect(() => {
    if (battle.status === 'playing' && battle.timeLeft <= 10) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      timerPulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 250 }),
          withTiming(1.0, { duration: 250 })
        ),
        -1,
        true
      );
    } else {
      timerPulseScale.value = 1;
    }
  }, [battle.timeLeft, battle.status]);

  const animatedTimerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulseScale.value }],
  }));

  // Handle Numeric Keypad Input (0-9, Backspace, Submit)
  const handleKeypadPress = (key: string) => {
    if (battle.status !== 'playing') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (key === '⌫') {
      setUserInput((prev) => prev.slice(0, -1));
      return;
    }

    if (key === '✓') {
      // Manual submit check
      const numericVal = parseFloat(userInput);
      if (numericVal === currentQ.answer) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        battle.submitAnswer(numericVal);
        setUserInput('');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setInputErrorFlash(true);
        setTimeout(() => {
          setInputErrorFlash(false);
          setUserInput('');
        }, 300);
      }
      return;
    }

    const nextVal = userInput + key;
    setUserInput(nextVal);

    // Auto-advance if answer matches exactly
    const numericVal = parseFloat(nextVal);
    if (numericVal === currentQ.answer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => {
        battle.submitAnswer(numericVal);
        setUserInput('');
      }, 120);
    }
  };

  const handleExit = () => {
    battle.resetBattle();
    setUserInput('');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Format question into vertical column calculation lines
  const formatVerticalLines = () => {
    if (typeof currentQ.operand1 === 'string' && currentQ.operand1.includes('\n')) {
      return currentQ.operand1.split('\n');
    }
    if (currentQ.operand2 !== '' && currentQ.operand2 !== undefined) {
      return [`${currentQ.operand1}`, `${currentQ.operator} ${currentQ.operand2}`];
    }
    return [`${currentQ.operand1}`];
  };

  // 1. IDLE STATE
  if (battle.status === 'idle') {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.topBar}>
            <Pressable style={styles.closeBtn} onPress={handleExit}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
            <CortexHowToPlayButton onPress={() => setShowTutorial(true)} />
          </View>

          <View style={styles.idleContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="sword-cross" size={44} color={colors.primary} />
            </View>

            <Text style={styles.idleTitle}>60s Sprint Math Duel</Text>
            <Text style={styles.idleSub}>
              Solve as many vertical column & mixed math calculations as you can in 60 seconds!
            </Text>

            <CortexButton
              label="Start 60s Duel"
              onPress={() => battle.startMatchmaking(battle.user.id, battle.user.rating)}
              variant="primary"
              style={styles.idleCta}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // 2. SEARCHING STATE
  if (battle.status === 'searching') {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.searchingContainer}>
            <View style={styles.searchingPulseCircle}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.searchingTitle}>Finding Opponent…</Text>
            <Text style={styles.searchingSub}>Rating range ±50 ELO</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // 3. COMPLETE STATE (STANDARDIZED VICTORY / DEFEAT SCREEN)
  if (battle.status === 'complete') {
    const isWinner = battle.user.score >= battle.opponent.score;
    const userTotalScore = Math.max(0, battle.user.score * 100 + battle.earnedXP);
    const userAccuracy = Math.round((battle.user.score / Math.max(1, battle.user.score + 2)) * 100);
    const oppAccuracy = Math.min(100, Math.round((battle.opponent.score / Math.max(1, battle.opponent.score + 3)) * 100));
    const userAvgSpeed = parseFloat((60 / Math.max(1, battle.user.score)).toFixed(1));
    const oppAvgSpeed = parseFloat((60 / Math.max(1, battle.opponent.score)).toFixed(1));
    const userStreak = battle.user.streak || battle.user.score;
    const oppStreak = battle.opponent.streak || battle.opponent.score;
    const coinsEarned = isWinner ? Math.max(15, Math.floor(userTotalScore / 20)) : 0;

    return (
      <CortexVictoryDefeatView
        isWinner={isWinner}
        userScore={battle.user.score}
        opponentScore={battle.opponent.score}
        userName={battle.user.name}
        opponentName={battle.opponent.name}
        userAccuracy={userAccuracy}
        opponentAccuracy={oppAccuracy}
        userAvgSpeedSeconds={userAvgSpeed}
        opponentAvgSpeedSeconds={oppAvgSpeed}
        userStreak={userStreak}
        opponentStreak={oppStreak}
        earnedXP={battle.earnedXP}
        earnedCoins={coinsEarned}
        onPlayNext={() => {
          battle.resetBattle();
          setUserInput('');
          battle.startMatchmaking(battle.user.id, battle.user.rating);
        }}
        onExit={handleExit}
      />
    );
  }

  // 4. PLAYING STATE (60-SECOND DUEL WITH VERTICAL ARITHMETIC & NUMERIC KEYPAD)
  const isLowTime = battle.timeLeft <= 10;
  const isMidTime = battle.timeLeft <= 20 && battle.timeLeft > 10;
  const verticalLines = formatVerticalLines();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* ── TOP HEADER WITH MINIMAL SCORE & 60s TIMER ── */}
        <View style={styles.clockHeader}>
          <View style={styles.headerTopRow}>
            <Text style={styles.playerName}>Afnan vs {battle.opponent.name}</Text>
            <Pressable onPress={handleExit} style={styles.quitBtn}>
              <Text style={styles.quitText}>Surrender</Text>
            </Pressable>
            <Text style={styles.scoreText}>
              {battle.user.score} - {battle.opponent.score}
            </Text>
            <CortexHowToPlayButton onPress={() => setShowTutorial(true)} />
          </View>

          {/* Centered 60-Second Game Clock */}
          <Animated.Text
            style={[
              styles.gameClock,
              isMidTime && styles.gameClockAmber,
              isLowTime && styles.gameClockRed,
              animatedTimerStyle,
            ]}
          >
            00:{battle.timeLeft < 10 ? `0${battle.timeLeft}` : battle.timeLeft}
          </Animated.Text>

          {/* Live Score Progress Bars */}
          <View style={styles.progressRow}>
            <View style={styles.progressCol}>
              <ProgressBar progress={battle.user.progress / 100} height={4} />
            </View>
            <View style={styles.progressCol}>
              <ProgressBar progress={battle.opponent.progress / 100} height={4} />
            </View>
          </View>
        </View>

        {/* ── VERTICAL COLUMN ARITHMETIC HERO CARD ── */}
        <View style={styles.heroSection}>
          <Text style={styles.counterText}>
            Question {battle.currentQuestionIndex + 1} • Solve Fast!
          </Text>

          <CortexCard style={styles.verticalCard} padding={28}>
            <View style={styles.verticalLinesBox}>
              {verticalLines.map((line, idx) => (
                <Text key={idx} style={styles.verticalLineText}>
                  {line}
                </Text>
              ))}
            </View>

            {/* Column Line */}
            <View style={styles.columnDividerLine} />

            {/* Glowing Answer Input Display Box */}
            <View style={[styles.inputBox, inputErrorFlash && styles.inputBoxError]}>
              <Text style={styles.inputText}>
                {userInput ? userInput : <Text style={styles.inputPlaceholder}>_</Text>}
              </Text>
            </View>
          </CortexCard>
        </View>

        {/* ── CUSTOM NUMERIC KEYPAD (0-9, BACKSPACE, SUBMIT) ── */}
        <View style={styles.keypadSection}>
          <View style={styles.keypadGrid}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((key) => (
              <Pressable
                key={key}
                style={[
                  styles.keypadBtn,
                  key === '✓' && styles.keypadSubmitBtn,
                  key === '⌫' && styles.keypadDelBtn,
                ]}
                onPress={() => handleKeypadPress(key)}
              >
                <Text
                  style={[
                    styles.keypadBtnText,
                    key === '✓' && styles.keypadSubmitBtnText,
                  ]}
                >
                  {key}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
  },

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  idleContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  idleSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  idleCta: {
    width: '100%',
  },

  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  searchingPulseCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(132, 204, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  searchingTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  searchingSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },

  /* Results Top Bar */
  resultsTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },

  scrollContent: {
    paddingBottom: 16,
  },

  /* Hero Banner */
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  meshContainer: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    opacity: 0.15,
  },
  meshTriangle: {
    width: '100%',
    height: '100%',
    transform: [{ rotate: '45deg' }],
  },
  meshTriangleWin: {
    backgroundColor: '#d97706',
  },
  meshTriangleLoss: {
    backgroundColor: '#475569',
  },

  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  victoryTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 34,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  titleWin: {
    color: '#ea580c',
  },
  titleLoss: {
    color: '#475569',
  },

  victorySub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#334155',
    marginBottom: 6,
  },

  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  coinsText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#b45309',
  },

  boostRow: {
    marginBottom: 16,
  },
  boostText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#ea580c',
  },

  bannerCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bannerCtaWin: {
    backgroundColor: '#84cc16',
  },
  bannerCtaLoss: {
    backgroundColor: '#f97316',
  },
  bannerCtaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },

  bannerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldTrophyBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyStarBadge: {
    position: 'absolute',
    top: 26,
    backgroundColor: '#d97706',
    borderRadius: 12,
    padding: 3,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: -10,
    left: -10,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: -6,
    right: -6,
  },

  trophyWrapperLoss: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-18deg' }],
  },
  silverTrophyBase: {
    opacity: 0.85,
  },
  leaf1: {
    position: 'absolute',
    top: -12,
    right: -10,
  },
  leaf2: {
    position: 'absolute',
    bottom: -8,
    left: -12,
  },

  /* Data Comparison Section */
  dataComparisonSection: {
    paddingHorizontal: 16,
  },
  sectionHeaderTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 12,
  },

  comparisonCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleRed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNameText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },
  totalScoreLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },

  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  blueScoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 36,
    color: '#3b82f6',
  },
  redScoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 36,
    color: '#ef4444',
  },

  dualBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  blueBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 5,
  },
  redBarFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 5,
  },
  barDivider: {
    width: 4,
  },

  /* Metrics Card */
  metricsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricRow: {
    marginBottom: 18,
  },
  metricRowLast: {
    marginBottom: 0,
  },
  metricLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  blueMetricText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#3b82f6',
  },
  redMetricText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ef4444',
  },
  dualBarTrackSub: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  blueBarFillSub: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  redBarFillSub: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 3,
  },

  /* Fixed Footer */
  resultsFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    gap: 8,
  },
  actionBtn: {
    width: '100%',
  },

  /* Clock Header */
  clockHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  playerName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  quitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  quitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  scoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 24,
    color: colors.textPrimary,
  },

  gameClock: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 32,
    lineHeight: 36,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  gameClockAmber: {
    color: colors.warning,
  },
  gameClockRed: {
    color: colors.error,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  progressCol: {
    flex: 1,
  },

  /* Vertical Column Arithmetic Card */
  heroSection: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  verticalCard: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: 36,
    paddingVertical: 24,
  },
  verticalLinesBox: {
    alignItems: 'flex-end',
    width: '100%',
  },
  verticalLineText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 42,
    lineHeight: 48,
    color: colors.textPrimary,
    textAlign: 'right',
    letterSpacing: 2,
  },
  columnDividerLine: {
    width: '100%',
    height: 3,
    backgroundColor: colors.textPrimary,
    marginVertical: 12,
    borderRadius: 2,
  },
  inputBox: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  inputBoxError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  inputText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 32,
    color: colors.primary,
    letterSpacing: 3,
  },
  inputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.25)',
  },

  /* Custom Numeric Keypad Section */
  keypadSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  keypadBtn: {
    width: '31%',
    height: 58,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadSubmitBtn: {
    backgroundColor: '#84cc16',
    borderColor: '#84cc16',
  },
  keypadDelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  keypadBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: colors.textPrimary,
  },
  keypadSubmitBtnText: {
    color: '#000000',
    fontWeight: '800',
  },
});
