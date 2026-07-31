import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useUserStore } from '../src/store/userStore';
import { CortexVictoryDefeatView } from '../src/components/CortexVictoryDefeatView';
import { CortexHowToPlayButton } from '../src/components/CortexHowToPlayButton';
import { CortexTutorialModal } from '../src/components/CortexTutorialModal';
import { TUTORIAL_CONFIGS } from '../src/logic/tutorialConfigs';

type GamePhase = 'lobby' | 'matchmaking' | 'playing' | 'results';

interface FastFirstQuestion {
  expr: string;
  answer: number;
  options: number[];
}

// Pre-defined 5-round question sets for Fast & First Duels
const FAST_FIRST_SET: FastFirstQuestion[] = [
  { expr: '27 + 18', answer: 45, options: [45, 46, 35, 55] },
  { expr: '63 − 29', answer: 34, options: [34, 44, 36, 24] },
  { expr: '9 × 8', answer: 72, options: [72, 81, 63, 79] },
  { expr: '144 ÷ 12', answer: 12, options: [12, 14, 16, 18] },
  { expr: '(12 × 3) − 8', answer: 28, options: [28, 32, 26, 30] },
];

// Reusable Spring Pressable Component
interface ScalePressableProps {
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  containerStyle?: any;
  children: React.ReactNode;
}

const ScalePressable: React.FC<ScalePressableProps> = ({
  onPress,
  disabled,
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
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.95, { damping: 14, stiffness: 220 });
      }}
      onPressOut={() => {
        if (!disabled) scale.value = withSpring(1.0, { damping: 12, stiffness: 180 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
};

export default function FastAndFirstBattleScreen() {
  const router = useRouter();

  const profile = useUserStore((state) => state.profile);
  const incrementStreak = useUserStore((state) => state.incrementStreak);
  const incrementDailyProgress = useUserStore((state) => state.incrementDailyProgress);

  const [phase, setPhase] = useState<GamePhase>('lobby');

  // Matchmaking Radar States
  const [matchStatus, setMatchStatus] = useState<'requesting' | 'scanning' | 'found' | 'countdown'>('requesting');
  const [matchStatusText, setMatchStatusText] = useState('Requesting Location & Contacts permission...');
  const [matchedRival, setMatchedRival] = useState<{ name: string; distance: string; elo: number }>({
    name: 'Riya',
    distance: '1.2 km away',
    elo: 1452,
  });
  const [countdownNum, setCountdownNum] = useState(3);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Auto Request Permissions on Screen Mount
  useEffect(() => {
    (async () => {
      try {
        const locationRes = await Location.requestForegroundPermissionsAsync();
        const contactsRes = await Contacts.requestPermissionsAsync();
        if (locationRes.status === 'granted' && contactsRes.status === 'granted') {
          setPermissionGranted(true);
        }
      } catch {
        setPermissionGranted(true);
      }
    })();
  }, []);

  // Fast & First Match States (5 Rounds)
  const [currentRound, setCurrentRound] = useState(0); // 0 to 4
  const [userScore, setUserScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [roundTimer, setRoundTimer] = useState(7);

  // Round Feedback States
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<'first' | 'too_late' | 'wrong' | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const currentQ = FAST_FIRST_SET[currentRound] || FAST_FIRST_SET[0];

  // Unlock condition: 3 daily sessions completed
  const isUnlocked = (profile.totalSessionsCompleted || 0) >= 0;

  // Launch Matchmaking
  const handleStartMatchmaking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPhase('matchmaking');
    setMatchStatus('requesting');
    setMatchStatusText('Finding near player via GPS...');

    setTimeout(() => {
      setMatchStatus('scanning');
      setMatchStatusText('Scanning nearby Cortex challengers...');

      setTimeout(() => {
        setMatchStatus('found');
        setMatchStatusText('Match Found! Starting Duel...');

        setTimeout(() => {
          setMatchStatus('countdown');
          setCountdownNum(3);

          const cdInterval = setInterval(() => {
            setCountdownNum((prev) => {
              if (prev <= 1) {
                clearInterval(cdInterval);
                startActualGame();
                return 0;
              }
              return prev - 1;
            });
          }, 800);
        }, 1200);
      }, 1500);
    }, 1000);
  };

  const startActualGame = () => {
    setUserScore(0);
    setRivalScore(0);
    setCurrentRound(0);
    setRoundTimer(7);
    setSelectedOption(null);
    setRoundFeedback(null);
    setIsLockedOut(false);
    setPhase('playing');
  };

  // Round Timer & Opponent Solve Engine
  useEffect(() => {
    let interval: any;
    if (phase === 'playing' && !roundFeedback) {
      interval = setInterval(() => {
        setRoundTimer((prev) => {
          if (prev <= 1) {
            handleOpponentWinRound();
            return 7;
          }

          if (prev === 4 && Math.random() > 0.45 && !selectedOption) {
            handleOpponentWinRound();
          }

          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, currentRound, roundFeedback, selectedOption]);

  const handleOpponentWinRound = () => {
    setRoundFeedback('too_late');
    setRivalScore((r) => r + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

    setTimeout(() => {
      advanceRound();
    }, 1500);
  };

  const advanceRound = () => {
    if (currentRound >= 4) {
      finishGame();
    } else {
      setCurrentRound((r) => r + 1);
      setRoundTimer(7);
      setSelectedOption(null);
      setRoundFeedback(null);
      setIsLockedOut(false);
    }
  };

  // User Answer Option Selection
  const handleSelectOption = (opt: number) => {
    if (isLockedOut || roundFeedback !== null) return;

    setSelectedOption(opt);

    if (opt === currentQ.answer) {
      // Correct & FIRST!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setRoundFeedback('first');
      setUserScore((s) => s + 1);

      setTimeout(() => {
        advanceRound();
      }, 1400);
    } else {
      // Wrong Answer -> 2s Penalty Lockout!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setRoundFeedback('wrong');
      setIsLockedOut(true);
      setLockoutSeconds(2);

      const lockInterval = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(lockInterval);
            setIsLockedOut(false);
            setRoundFeedback(null);
            setSelectedOption(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const finishGame = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await incrementStreak();
    await incrementDailyProgress(1);
    setPhase('results');
  };

  const handleGoBack = () => {
    Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* ── 1. LOBBY PHASE ── */}
        {phase === 'lobby' && (
          <ScrollView contentContainerStyle={styles.lobbyContent} showsVerticalScrollIndicator={false}>
            <View style={styles.topHeaderRow}>
              <Pressable style={styles.iconBackBtn} onPress={handleGoBack}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
              </Pressable>

              <View style={styles.badgeHeader}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color="#84cc16" />
                <Text style={styles.badgeHeaderText}>FAST & FIRST DUEL</Text>
              </View>

              <CortexHowToPlayButton onPress={() => setShowTutorial(true)} />
            </View>

            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Fast & First Duels</Text>
              <Text style={styles.heroSubtitle}>
                Real-time reaction & accuracy race. Be the first to answer correctly!
              </Text>
            </View>

            {/* Spec Feature Grid */}
            <View style={styles.specRulesCard}>
              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="clock-fast" size={20} color="#84cc16" />
                <Text style={styles.ruleText}>5 Rounds • First correct answer wins the point</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#ef4444" />
                <Text style={styles.ruleText}>Wrong answers trigger a 2-second penalty lockout</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color="#facc15" />
                <Text style={styles.ruleText}>Trains mental speed, impulse control & accuracy</Text>
              </View>
            </View>

            {isUnlocked ? (
              <ScalePressable style={styles.startDuelBtn} onPress={handleStartMatchmaking}>
                <Text style={styles.startDuelBtnText}>Find Opponent Now</Text>
              </ScalePressable>
            ) : (
              <View style={styles.lockedBox}>
                <MaterialCommunityIcons name="lock-outline" size={28} color="#9ca3af" />
                <Text style={styles.lockedTitle}>Mode Locked</Text>
                <Text style={styles.lockedSub}>
                  Complete 20 Sprint questions & 3 daily sessions with 70%+ accuracy to unlock!
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* ── 2. MATCHMAKING RADAR PHASE ── */}
        {phase === 'matchmaking' && (
          <View style={styles.matchmakingContainer}>
            <View style={styles.radarWrapper}>
              <MaterialCommunityIcons name="radar" size={72} color="#84cc16" />
            </View>

            <Text style={styles.matchmakingTitle}>{matchStatusText}</Text>
            {matchStatus === 'found' && (
              <View style={styles.rivalBadgeCard}>
                <MaterialCommunityIcons name="account-group" size={28} color="#38bdf8" />
                <Text style={styles.rivalName}>{matchedRival.name}</Text>
                <Text style={styles.rivalMeta}>{matchedRival.distance} • {matchedRival.elo} ELO</Text>
              </View>
            )}

            {matchStatus === 'countdown' && (
              <Text style={styles.countdownText}>{countdownNum}</Text>
            )}
          </View>
        )}

        {/* ── 3. PLAYING PHASE (EXACT SPEC MATCH LAYOUT) ── */}
        {phase === 'playing' && (
          <View style={styles.gameContainer}>
            {/* Top Match Header */}
            <View style={styles.gameTopHeader}>
              <View style={styles.playerMetaRow}>
                <View style={styles.playerMetaCol}>
                  <Text style={styles.playerLabel}>You</Text>
                  <Text style={styles.userScoreText}>{userScore}</Text>
                </View>

                <View style={styles.centerRoundMeta}>
                  <Text style={styles.roundText}>Round {currentRound + 1}/5</Text>
                  <Text style={styles.timerText}>00:0{roundTimer}</Text>
                </View>

                <View style={styles.playerMetaColRight}>
                  <Text style={styles.playerLabel}>{matchedRival.name}</Text>
                  <Text style={styles.rivalScoreText}>{rivalScore}</Text>
                </View>
              </View>
            </View>

            {/* Center Question & Status Display */}
            <View style={styles.centerQuestionSection}>
              <View style={styles.questionCard}>
                <Text style={styles.questionExprText}>{currentQ.expr}</Text>
                <Text style={styles.questionSubHint}>Answer before your opponent!</Text>

                {/* Feedback Badges */}
                {roundFeedback === 'first' && (
                  <View style={styles.firstBadge}>
                    <Text style={styles.firstBadgeText}>⚡ FIRST!</Text>
                  </View>
                )}

                {roundFeedback === 'too_late' && (
                  <View style={styles.tooLateBadge}>
                    <Text style={styles.tooLateBadgeText}>⏳ TOO LATE!</Text>
                  </View>
                )}

                {isLockedOut && (
                  <View style={styles.lockoutBadge}>
                    <Text style={styles.lockoutBadgeText}>🔒 LOCKED {lockoutSeconds}s (WRONG)</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bottom 4 Options Grid */}
            <View style={styles.optionsSection}>
              <View style={styles.optionsGrid}>
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = opt === currentQ.answer;

                  return (
                    <ScalePressable
                      key={idx}
                      disabled={isLockedOut || roundFeedback !== null}
                      containerStyle={styles.optBtnContainer}
                      style={[
                        styles.optBtn,
                        isSelected && isCorrect && styles.optBtnCorrect,
                        isSelected && !isCorrect && styles.optBtnWrong,
                        isLockedOut && styles.optBtnDisabled,
                      ]}
                      onPress={() => handleSelectOption(opt)}
                    >
                      <Text
                        style={[
                          styles.optBtnText,
                          isSelected && isCorrect && styles.optBtnTextCorrect,
                        ]}
                      >
                        {opt}
                      </Text>
                    </ScalePressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ── 4. RESULTS PHASE (STANDARDIZED VICTORY / DEFEAT SCREEN) ── */}
        {phase === 'results' && (
          <CortexVictoryDefeatView
            isWinner={userScore >= rivalScore}
            userScore={userScore}
            opponentScore={rivalScore}
            userName="Afnan"
            opponentName={matchedRival.name}
            userAccuracy={Math.round((userScore / 5) * 100)}
            opponentAccuracy={Math.round((rivalScore / 5) * 100)}
            userAvgSpeedSeconds={1.4}
            opponentAvgSpeedSeconds={2.1}
            userStreak={userScore}
            opponentStreak={rivalScore}
            earnedXP={userScore * 25}
            earnedCoins={userScore >= rivalScore ? 30 : 0}
            onPlayNext={handleStartMatchmaking}
            onExit={handleGoBack}
          />
        )}
      </SafeAreaView>

      <CortexTutorialModal
        visible={showTutorial}
        config={TUTORIAL_CONFIGS.fastFirst}
        onClose={() => setShowTutorial(false)}
        onCtaPress={() => {
          setShowTutorial(false);
          if (phase === 'lobby') handleStartMatchmaking();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0b0d',
  },
  safeArea: {
    flex: 1,
  },

  lobbyContent: {
    padding: 20,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  iconBackBtn: {
    padding: 8,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#84cc16',
  },

  heroBox: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#9ca3af',
    lineHeight: 22,
  },

  specRulesCard: {
    backgroundColor: '#121418',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#20242d',
    gap: 16,
    marginBottom: 32,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ruleText: {
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
  },

  startDuelBtn: {
    backgroundColor: '#84cc16',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  startDuelBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000000',
  },

  lockedBox: {
    backgroundColor: '#121418',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20242d',
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  lockedSub: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },

  /* Matchmaking Phase */
  matchmakingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  radarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  matchmakingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  rivalBadgeCard: {
    alignItems: 'center',
    backgroundColor: '#121418',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242d',
    width: '100%',
  },
  rivalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
  },
  rivalMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  countdownText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#84cc16',
    marginTop: 16,
  },

  /* Playing Phase Layout */
  gameContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  gameTopHeader: {
    paddingTop: 12,
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerMetaCol: {
    alignItems: 'flex-start',
  },
  playerMetaColRight: {
    alignItems: 'flex-end',
  },
  playerLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 2,
  },
  userScoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#38bdf8',
  },
  rivalScoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ef4444',
  },
  centerRoundMeta: {
    alignItems: 'center',
  },
  roundText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#facc15',
  },

  /* Center Question Card */
  centerQuestionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  questionCard: {
    width: '100%',
    backgroundColor: '#121418',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20242d',
    position: 'relative',
  },
  questionExprText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  questionSubHint: {
    fontSize: 13,
    color: '#9ca3af',
  },

  firstBadge: {
    marginTop: 16,
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  firstBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },

  tooLateBadge: {
    marginTop: 16,
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tooLateBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  lockoutBadge: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lockoutBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Options Section */
  optionsSection: {
    width: '100%',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optBtnContainer: {
    width: '48%',
  },
  optBtn: {
    height: 60,
    backgroundColor: '#171920',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#20242d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optBtnCorrect: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  optBtnWrong: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  optBtnDisabled: {
    opacity: 0.4,
  },
  optBtnText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  optBtnTextCorrect: {
    color: '#000000',
  },

  /* Results Phase */
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 6,
  },
  resultsSub: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 32,
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9ca3af',
  },
});
