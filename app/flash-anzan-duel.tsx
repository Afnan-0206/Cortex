import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useUserStore } from '../src/store/userStore';
import { generateDynamicFlashAnzanPuzzle, FlashAnzanPuzzle, FlashAnzanRound } from '../src/logic/flashAnzanGenerator';
import { CortexVictoryDefeatView } from '../src/components/CortexVictoryDefeatView';
import { CortexHowToPlayButton } from '../src/components/CortexHowToPlayButton';
import { CortexTutorialModal } from '../src/components/CortexTutorialModal';
import { TUTORIAL_CONFIGS } from '../src/logic/tutorialConfigs';

type GamePhase = 'lobby' | 'matchmaking' | 'flashing' | 'answering' | 'results';

// Reusable Spring Scale Pressable
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

export default function FlashAnzanDuelScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const incrementStreak = useUserStore((state) => state.incrementStreak);
  const incrementDailyProgress = useUserStore((state) => state.incrementDailyProgress);

  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false);

  // Matchmaking States
  const [matchStatusText, setMatchStatusText] = useState('Finding player...');
  const [matchedRival, setMatchedRival] = useState<{ name: string; distance: string; elo: number }>({
    name: 'Riya',
    distance: '1.2 km away',
    elo: 1452,
  });
  const [countdownNum, setCountdownNum] = useState(3);

  // Active Flash Anzan Puzzle State (Generated freshly every time)
  const [puzzle, setPuzzle] = useState<FlashAnzanPuzzle>(generateDynamicFlashAnzanPuzzle());
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);

  // Match Scores Across 3 Rounds
  const [userRoundWins, setUserRoundWins] = useState(0);
  const [rivalRoundWins, setRivalRoundWins] = useState(0);

  // Flashing State
  const [currentFlashNum, setCurrentFlashNum] = useState<number | null>(null);
  const [flashNumIndex, setFlashNumIndex] = useState(0);

  // Answering State
  const [userInput, setUserInput] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isError, setIsError] = useState(false);



  // Launch Matchmaking & Generate Fresh Puzzle
  const handleStartMatchmaking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    // ALWAYS generate a fresh randomized Flash Anzan puzzle for the new game session!
    const freshPuzzle = generateDynamicFlashAnzanPuzzle();
    setPuzzle(freshPuzzle);
    setCurrentRoundIdx(0);
    setUserRoundWins(0);
    setRivalRoundWins(0);

    setPhase('matchmaking');
    setMatchStatusText('Scanning nearby Cortex challengers...');

    setTimeout(() => {
      setMatchStatusText('Match Found! Starting Flash Anzan Duel...');
      setTimeout(() => {
        setCountdownNum(3);
        const interval = setInterval(() => {
          setCountdownNum((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              startRound(0, freshPuzzle);
              return 0;
            }
            return prev - 1;
          });
        }, 800);
      }, 1000);
    }, 1200);
  };

  const startRound = (rIdx: number, activePuzzle: FlashAnzanPuzzle) => {
    setUserInput('');
    setIsLockedOut(false);
    setIsError(false);
    setFlashNumIndex(0);
    const roundData = activePuzzle.rounds[rIdx];
    setCurrentFlashNum(roundData.sequence[0]);
    setPhase('flashing');
  };

  // Flashing Numbers Timer Loop
  useEffect(() => {
    let timer: any;
    if (phase === 'flashing') {
      const activeRound = puzzle.rounds[currentRoundIdx];

      timer = setInterval(() => {
        setFlashNumIndex((prevIdx) => {
          const nextIdx = prevIdx + 1;
          if (nextIdx < activeRound.sequence.length) {
            setCurrentFlashNum(activeRound.sequence[nextIdx]);
            Haptics.selectionAsync().catch(() => {});
            return nextIdx;
          } else {
            clearInterval(timer);
            setCurrentFlashNum(null);
            setPhase('answering');
            return prevIdx;
          }
        });
      }, activeRound.flashSpeedMs);
    }
    return () => clearInterval(timer);
  }, [phase, currentRoundIdx, puzzle]);

  // Keypad Handlers
  const handleKeyPress = (char: string) => {
    if (isLockedOut || phase !== 'answering') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (userInput.length < 4) {
      setUserInput((prev) => prev + char);
    }
  };

  const handleDelete = () => {
    if (isLockedOut || phase !== 'answering') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setUserInput((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (isLockedOut || phase !== 'answering' || !userInput) return;

    const activeRound = puzzle.rounds[currentRoundIdx];
    const val = parseInt(userInput, 10);

    if (val === activeRound.correctSum) {
      // Correct Sum!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      evaluateRoundEnd(true);
    } else {
      // Wrong Sum!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setIsError(true);
      setIsLockedOut(true);

      setTimeout(() => {
        setIsError(false);
        setIsLockedOut(false);
        setUserInput('');
      }, 1000);
    }
  };

  const evaluateRoundEnd = (userWon: boolean) => {
    let newUserWins = userRoundWins;
    let newRivalWins = rivalRoundWins;

    if (userWon) {
      newUserWins += 1;
      setUserRoundWins(newUserWins);
    } else {
      newRivalWins += 1;
      setRivalRoundWins(newRivalWins);
    }

    if (currentRoundIdx + 1 < puzzle.rounds.length) {
      const nextIdx = currentRoundIdx + 1;
      setCurrentRoundIdx(nextIdx);
      startRound(nextIdx, puzzle);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await incrementStreak();
    await incrementDailyProgress(1);
    setPhase('results');
  };

  const handleExit = () => {
    Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const activeRound = puzzle.rounds[currentRoundIdx] || puzzle.rounds[0];
  const isWinner = userRoundWins >= rivalRoundWins;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* ── 1. LOBBY PHASE ── */}
        {phase === 'lobby' && (
          <ScrollView contentContainerStyle={styles.lobbyContent} showsVerticalScrollIndicator={false}>
            <View style={styles.topHeaderRow}>
              <Pressable style={styles.iconBackBtn} onPress={handleExit}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
              </Pressable>

              <View style={styles.badgeHeader}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color="#facc15" />
                <Text style={styles.badgeHeaderText}>MEMORY SECTION</Text>
              </View>

              <CortexHowToPlayButton onPress={() => setShowHowToPlayModal(true)} />
            </View>

            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Flash Anzan Duels</Text>
              <Text style={styles.heroSubtitle}>
                High-speed mental addition battle. Add rapidly flashing numbers in your mind!
              </Text>
            </View>

            {/* How To Play Button */}
            <ScalePressable style={styles.howToPlayBtn} onPress={() => setShowHowToPlayModal(true)}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#facc15" />
              <Text style={styles.howToPlayBtnText}>How to play?</Text>
            </ScalePressable>

            {/* Rules Card */}
            <View style={styles.specRulesCard}>
              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="flash-outline" size={20} color="#facc15" />
                <Text style={styles.ruleText}>Flash Phase: Numbers flash rapidly (0.6s–0.8s each)</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="calculator" size={20} color="#38bdf8" />
                <Text style={styles.ruleText}>Answer Phase: Enter the running total sum</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color="#84cc16" />
                <Text style={styles.ruleText}>First correct sum entry wins the round</Text>
              </View>
            </View>

            <ScalePressable style={styles.startDuelBtn} onPress={handleStartMatchmaking}>
              <Text style={styles.startDuelBtnText}>Find Opponent Now</Text>
            </ScalePressable>
          </ScrollView>
        )}

        {/* ── HOW TO PLAY OVERLAY MODAL ── */}
        <CortexTutorialModal
          visible={showHowToPlayModal}
          config={TUTORIAL_CONFIGS.flashAnzan}
          onClose={() => setShowHowToPlayModal(false)}
          onCtaPress={() => {
            setShowHowToPlayModal(false);
            if (phase === 'lobby') handleStartMatchmaking();
          }}
        />

        {/* ── 2. MATCHMAKING PHASE ── */}
        {phase === 'matchmaking' && (
          <View style={styles.matchmakingContainer}>
            <View style={styles.radarWrapper}>
              <MaterialCommunityIcons name="lightning-bolt" size={64} color="#facc15" />
            </View>

            <Text style={styles.matchmakingTitle}>{matchStatusText}</Text>
            <View style={styles.rivalBadgeCard}>
              <MaterialCommunityIcons name="account-group" size={28} color="#38bdf8" />
              <Text style={styles.rivalName}>{matchedRival.name}</Text>
              <Text style={styles.rivalMeta}>{matchedRival.distance} • {matchedRival.elo} ELO</Text>
            </View>

            {countdownNum > 0 && <Text style={styles.countdownText}>{countdownNum}</Text>}
          </View>
        )}

        {/* ── 3. PLAYING PHASE (FLASHING & ANSWERING) ── */}
        {(phase === 'flashing' || phase === 'answering') && (
          <View style={styles.gameContainer}>
            {/* Top Match Header */}
            <View style={styles.gameTopHeader}>
              <View style={styles.playerMetaRow}>
                <View style={styles.playerMetaCol}>
                  <Text style={styles.playerLabel}>You ({userRoundWins} wins)</Text>
                  <Text style={styles.userScoreText}>{userRoundWins}</Text>
                </View>

                <View style={styles.centerRoundMeta}>
                  <Text style={styles.roundTitleText}>Round {currentRoundIdx + 1}/3</Text>
                  <Text style={styles.phaseBadgeText}>
                    {phase === 'flashing' ? `⚡ FLASHING (${(activeRound.flashSpeedMs / 1000).toFixed(1)}s)` : '✍️ ENTER TOTAL'}
                  </Text>
                </View>

                <View style={styles.playerMetaColRight}>
                  <Text style={styles.playerLabel}>{matchedRival.name} ({rivalRoundWins} wins)</Text>
                  <Text style={styles.rivalScoreText}>{rivalRoundWins}</Text>
                </View>
              </View>
            </View>

            {/* Center Flashing Phase (Giant Numbers) */}
            {phase === 'flashing' && (
              <View style={styles.flashSection}>
                <Text style={styles.flashHintText}>Remember the running total...</Text>
                {currentFlashNum !== null && (
                  <Text style={styles.flashGiantText}>{currentFlashNum}</Text>
                )}
              </View>
            )}

            {/* Center Answering Phase (Keypad & Output Display) */}
            {phase === 'answering' && (
              <View style={styles.answeringSection}>
                <View style={[styles.answerBox, isError && styles.answerBoxError]}>
                  <Text style={styles.answerInputText}>{userInput || '?'}</Text>
                </View>

                {/* Keypad */}
                <View style={styles.keypadGrid}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((key) => (
                    <ScalePressable
                      key={key}
                      disabled={isLockedOut}
                      containerStyle={styles.keypadKeyContainer}
                      style={[styles.keypadKeyBtn, isLockedOut && styles.keypadBtnDisabled]}
                      onPress={() => {
                        if (key === '⌫') handleDelete();
                        else if (key === '✓') handleSubmit();
                        else handleKeyPress(key);
                      }}
                    >
                      <Text style={styles.keypadKeyText}>{key}</Text>
                    </ScalePressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── 4. RESULTS PHASE (STANDARDIZED VICTORY / DEFEAT SCREEN) ── */}
        {phase === 'results' && (
          <CortexVictoryDefeatView
            isWinner={isWinner}
            userScore={userRoundWins}
            opponentScore={rivalRoundWins}
            userName="Afnan"
            opponentName={matchedRival.name}
            userAccuracy={Math.round((userRoundWins / 3) * 100)}
            opponentAccuracy={Math.round((rivalRoundWins / 3) * 100)}
            userAvgSpeedSeconds={1.8}
            opponentAvgSpeedSeconds={2.9}
            userStreak={userRoundWins}
            opponentStreak={rivalRoundWins}
            earnedXP={isWinner ? 80 : 30}
            earnedCoins={isWinner ? 40 : 0}
            onPlayNext={handleStartMatchmaking}
            onExit={handleExit}
          />
        )}
      </SafeAreaView>
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
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#facc15',
  },

  heroBox: {
    marginBottom: 20,
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

  howToPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#121418',
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#facc15',
    marginBottom: 20,
  },
  howToPlayBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#facc15',
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
    backgroundColor: '#facc15',
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

  /* Modal Overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#121418',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#20242d',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#facc15',
    marginTop: 12,
    marginBottom: 4,
  },
  modalText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  backToGameBtn: {
    backgroundColor: '#facc15',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToGameBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
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
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
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
    color: '#facc15',
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
    color: '#facc15',
  },
  rivalScoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ef4444',
  },
  centerRoundMeta: {
    alignItems: 'center',
  },
  roundTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  phaseBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#facc15',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },

  /* Flash Section */
  flashSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashHintText: {
    fontSize: 15,
    color: '#9ca3af',
    marginBottom: 24,
  },
  flashGiantText: {
    fontSize: 96,
    fontWeight: '800',
    color: '#facc15',
  },

  /* Answering Section */
  answeringSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  answerBox: {
    width: 200,
    height: 72,
    backgroundColor: '#121418',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  answerBoxError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  answerInputText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },

  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  keypadKeyContainer: {
    width: '28%',
  },
  keypadKeyBtn: {
    height: 52,
    backgroundColor: '#171920',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadBtnDisabled: {
    opacity: 0.4,
  },
  keypadKeyText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#facc15',
  },
});
