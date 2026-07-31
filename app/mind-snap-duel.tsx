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
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useUserStore } from '../src/store/userStore';
import { generateDynamicMindSnapPuzzle, MindSnapPuzzle, MindSnapItem } from '../src/logic/mindSnapGenerator';
import { CortexVictoryDefeatView } from '../src/components/CortexVictoryDefeatView';
import { CortexHowToPlayButton } from '../src/components/CortexHowToPlayButton';
import { CortexTutorialModal } from '../src/components/CortexTutorialModal';
import { TUTORIAL_CONFIGS } from '../src/logic/tutorialConfigs';

type GamePhase = 'lobby' | 'matchmaking' | 'observe' | 'recall' | 'results';

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

export default function MindSnapDuelScreen() {
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

  // Active Mind Snap Puzzle State (Generated freshly every time)
  const [puzzle, setPuzzle] = useState<MindSnapPuzzle>(generateDynamicMindSnapPuzzle());
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);

  // Match Scores Across 3 Rounds
  const [userRoundWins, setUserRoundWins] = useState(0);
  const [rivalRoundWins, setRivalRoundWins] = useState(0);

  // Current Round State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [errorItemId, setErrorItemId] = useState<string | null>(null);
  const [observeTimerMs, setObserveTimerMs] = useState(1800);
  const [recallTimerSec, setRecallTimerSec] = useState(5);

  // Request permissions on load
  useEffect(() => {
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
        await Contacts.requestPermissionsAsync();
      } catch {}
    })();
  }, []);

  // Launch Matchmaking & Generate Fresh Puzzle
  const handleStartMatchmaking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    // ALWAYS generate a fresh randomized Mind Snap puzzle for the new game session!
    const freshPuzzle = generateDynamicMindSnapPuzzle();
    setPuzzle(freshPuzzle);
    setCurrentRoundIdx(0);
    setUserRoundWins(0);
    setRivalRoundWins(0);

    setPhase('matchmaking');
    setMatchStatusText('Scanning nearby Cortex challengers...');

    setTimeout(() => {
      setMatchStatusText('Match Found! Starting Mind Snap Duel...');
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

  const startRound = (rIdx: number, activePuzzle: MindSnapPuzzle) => {
    const roundData = activePuzzle.rounds[rIdx];
    setSelectedItemIds([]);
    setErrorItemId(null);
    setObserveTimerMs(roundData.observeDurationMs);
    setRecallTimerSec(roundData.recallDurationSec);
    setPhase('observe');
  };

  // Observe Phase Countdown Timer
  useEffect(() => {
    let timeout: any;
    if (phase === 'observe') {
      const activeRound = puzzle.rounds[currentRoundIdx];
      timeout = setTimeout(() => {
        setPhase('recall');
      }, activeRound.observeDurationMs);
    }
    return () => clearTimeout(timeout);
  }, [phase, currentRoundIdx, puzzle]);

  // Recall Phase Countdown Timer
  useEffect(() => {
    let interval: any;
    if (phase === 'recall') {
      interval = setInterval(() => {
        setRecallTimerSec((prev) => {
          if (prev <= 1) {
            evaluateRoundEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  // Handle Item Tapping during Recall Phase
  const handleTapItem = (item: MindSnapItem) => {
    if (phase !== 'recall' || selectedItemIds.includes(item.id)) return;

    const activeRound = puzzle.rounds[currentRoundIdx];

    if (item.isTarget) {
      // Correct Recall!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const updated = [...selectedItemIds, item.id];
      setSelectedItemIds(updated);

      // Check if all targets found
      if (updated.length >= activeRound.targets.length) {
        evaluateRoundEnd(updated);
      }
    } else {
      // Distractor / Error!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setErrorItemId(item.id);
      setTimeout(() => setErrorItemId(null), 800);
    }
  };

  const evaluateRoundEnd = (tappedIds: string[] = selectedItemIds) => {
    const activeRound = puzzle.rounds[currentRoundIdx];
    const userSuccess = tappedIds.length >= activeRound.targets.length;

    let newUserWins = userRoundWins;
    let newRivalWins = rivalRoundWins;

    if (userSuccess) {
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
                <MaterialCommunityIcons name="brain" size={14} color="#06b6d4" />
                <Text style={styles.badgeHeaderText}>MEMORY SECTION</Text>
              </View>

              <CortexHowToPlayButton onPress={() => setShowHowToPlayModal(true)} />
            </View>

            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Mind Snap Duels</Text>
              <Text style={styles.heroSubtitle}>
                Real-time visual memory battle. Memorize symbols in seconds and recall them before your opponent!
              </Text>
            </View>

            {/* How To Play Button */}
            <ScalePressable style={styles.howToPlayBtn} onPress={() => setShowHowToPlayModal(true)}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#06b6d4" />
              <Text style={styles.howToPlayBtnText}>How to play?</Text>
            </ScalePressable>

            {/* Rules Card */}
            <View style={styles.specRulesCard}>
              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="eye-outline" size={20} color="#06b6d4" />
                <Text style={styles.ruleText}>Observe Phase: Memorize symbols shown for 1.5s–2.5s</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="gesture-tap" size={20} color="#84cc16" />
                <Text style={styles.ruleText}>Recall Phase: Tap correct items from options grid</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color="#facc15" />
                <Text style={styles.ruleText}>Best of 3 rounds wins the visual duel</Text>
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
          config={TUTORIAL_CONFIGS.mindSnap}
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
              <MaterialCommunityIcons name="brain" size={64} color="#06b6d4" />
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

        {/* ── 3. PLAYING PHASE (OBSERVE & RECALL) ── */}
        {(phase === 'observe' || phase === 'recall') && (
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
                    {phase === 'observe' ? '👁️ OBSERVE' : `🔁 RECALL (${recallTimerSec}s)`}
                  </Text>
                </View>

                <View style={styles.playerMetaColRight}>
                  <Text style={styles.playerLabel}>{matchedRival.name} ({rivalRoundWins} wins)</Text>
                  <Text style={styles.rivalScoreText}>{rivalRoundWins}</Text>
                </View>
              </View>
            </View>

            {/* Center Observe Phase (Memorize Target Symbols) */}
            {phase === 'observe' && (
              <View style={styles.observeSection}>
                <Text style={styles.modeNameText}>{activeRound.modeName}</Text>
                <Text style={styles.observeHintText}>Memorize these symbols now!</Text>

                <View style={styles.observeGrid}>
                  {activeRound.targets.map((item) => (
                    <View key={item.id} style={[styles.symbolCard, { borderColor: item.color }]}>
                      <Text style={[styles.symbolText, { color: item.color }]}>{item.symbol}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Center Recall Phase (Tap Memorized Symbols) */}
            {phase === 'recall' && (
              <View style={styles.recallSection}>
                <Text style={styles.recallHintText}>Tap all symbols that were shown!</Text>

                <View style={styles.recallGrid}>
                  {activeRound.allOptions.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const isError = errorItemId === item.id;

                    return (
                      <ScalePressable
                        key={item.id}
                        containerStyle={styles.recallCardContainer}
                        style={[
                          styles.recallCard,
                          isSelected && styles.recallCardSelected,
                          isError && styles.recallCardError,
                        ]}
                        onPress={() => handleTapItem(item)}
                      >
                        <Text style={[styles.recallSymbolText, isSelected && styles.symbolTextSelected]}>
                          {item.symbol}
                        </Text>
                      </ScalePressable>
                    );
                  })}
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
            userAvgSpeedSeconds={2.1}
            opponentAvgSpeedSeconds={3.4}
            userStreak={userRoundWins}
            opponentStreak={rivalRoundWins}
            earnedXP={isWinner ? 75 : 25}
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
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#06b6d4',
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
    borderColor: '#06b6d4',
    marginBottom: 20,
  },
  howToPlayBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#06b6d4',
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
    backgroundColor: '#06b6d4',
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

  /* Modal overlay styles */
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
    color: '#06b6d4',
    marginTop: 12,
    marginBottom: 4,
  },
  modalText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  backToGameBtn: {
    backgroundColor: '#06b6d4',
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
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
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
    color: '#06b6d4',
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
    color: '#06b6d4',
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
    color: '#06b6d4',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },

  /* Observe Section */
  observeSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#06b6d4',
    marginBottom: 4,
  },
  observeHintText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
  },
  observeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  symbolCard: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#121418',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 36,
    fontWeight: '800',
  },

  /* Recall Section */
  recallSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recallHintText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 24,
  },
  recallGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    width: '100%',
  },
  recallCardContainer: {
    width: '28%',
  },
  recallCard: {
    height: 72,
    borderRadius: 18,
    backgroundColor: '#171920',
    borderWidth: 1,
    borderColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recallCardSelected: {
    backgroundColor: '#06b6d4',
    borderColor: '#38bdf8',
  },
  recallCardError: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#ef4444',
  },
  recallSymbolText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#06b6d4',
  },
  symbolTextSelected: {
    color: '#000000',
  },
});
