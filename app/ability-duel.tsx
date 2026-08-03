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
import { generateDynamicAbilityPuzzle, AbilityPuzzle, AbilityOption, AbilityRound } from '../src/logic/abilityGenerator';
import { CortexVictoryDefeatView } from '../src/components/CortexVictoryDefeatView';
import { CortexHowToPlayButton } from '../src/components/CortexHowToPlayButton';
import { CortexTutorialModal } from '../src/components/CortexTutorialModal';
import { TUTORIAL_CONFIGS } from '../src/logic/tutorialConfigs';

type GamePhase = 'lobby' | 'matchmaking' | 'observe' | 'playing' | 'results';

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

export default function AbilityDuelScreen() {
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

  // Active Ability Puzzle State (Generated freshly every time)
  const [puzzle, setPuzzle] = useState<AbilityPuzzle>(generateDynamicAbilityPuzzle());
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);

  // Match Scores Across 5 Rounds
  const [userRoundWins, setUserRoundWins] = useState(0);
  const [rivalRoundWins, setRivalRoundWins] = useState(0);

  // Playing States
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [errorOptId, setErrorOptId] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [showTip, setShowTip] = useState<string | null>(null);


  // Launch Matchmaking & Generate Fresh Puzzle
  const handleStartMatchmaking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    // ALWAYS generate a fresh randomized Ability Duels puzzle for the new game session!
    const freshPuzzle = generateDynamicAbilityPuzzle();
    setPuzzle(freshPuzzle);
    setCurrentRoundIdx(0);
    setUserRoundWins(0);
    setRivalRoundWins(0);

    setPhase('matchmaking');
    setMatchStatusText('Scanning nearby Cortex challengers...');

    setTimeout(() => {
      setMatchStatusText('Match Found! Starting Ability Duel...');
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

  const startRound = (rIdx: number, activePuzzle: AbilityPuzzle) => {
    setSelectedOptId(null);
    setErrorOptId(null);
    setIsLockedOut(false);
    setShowTip(null);

    const roundData = activePuzzle.rounds[rIdx];

    if (roundData.categoryName === 'MEMORY' && roundData.observeDurationMs) {
      setPhase('observe');
      setTimeout(() => {
        setPhase('playing');
      }, roundData.observeDurationMs);
    } else {
      setPhase('playing');
    }
  };

  // Option selection handler
  const handleSelectOption = (opt: AbilityOption) => {
    if (isLockedOut || phase !== 'playing') return;

    const activeRound = puzzle.rounds[currentRoundIdx];

    if (opt.isCorrect) {
      // Correct Option!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSelectedOptId(opt.id);

      if (activeRound.shortcutTip) {
        setShowTip(activeRound.shortcutTip);
      }

      setTimeout(() => {
        evaluateRoundEnd(true);
      }, activeRound.shortcutTip ? 1200 : 600);
    } else {
      // Wrong Option!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setErrorOptId(opt.id);
      setIsLockedOut(true);

      setTimeout(() => {
        setErrorOptId(null);
        setIsLockedOut(false);
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
                <MaterialCommunityIcons name="checkbox-multiple-blank-outline" size={14} color="#ec4899" />
                <Text style={styles.badgeHeaderText}>LOGIC SECTION</Text>
              </View>

              <CortexHowToPlayButton onPress={() => setShowHowToPlayModal(true)} />
            </View>

            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Ability Duels</Text>
              <Text style={styles.heroSubtitle}>
                Flagship mixed-cognition battle. Switch between Math Shortcuts, Logic, Memory, Estimation & Surprise rounds!
              </Text>
            </View>

            {/* How To Play Button */}
            <ScalePressable style={styles.howToPlayBtn} onPress={() => setShowHowToPlayModal(true)}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#ec4899" />
              <Text style={styles.howToPlayBtnText}>How to play?</Text>
            </ScalePressable>

            {/* Rules Card */}
            <View style={styles.specRulesCard}>
              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="tune-vertical" size={20} color="#ec4899" />
                <Text style={styles.ruleText}>5 Rounds: Math Shortcut, Logic, Memory, Estimation, Surprise</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#facc15" />
                <Text style={styles.ruleText}>Teaches real-life Cortex calculation shortcuts</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color="#84cc16" />
                <Text style={styles.ruleText}>Best of 5 rounds wins the flagship duel</Text>
              </View>
            </View>

            <ScalePressable style={styles.startDuelBtn} onPress={handleStartMatchmaking}>
              <Text style={styles.startDuelBtnText}>Start Duel</Text>
            </ScalePressable>
          </ScrollView>
        )}

        {/* ── HOW TO PLAY OVERLAY MODAL ── */}
        <CortexTutorialModal
          visible={showHowToPlayModal}
          config={TUTORIAL_CONFIGS.ability}
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
              <MaterialCommunityIcons name="checkbox-multiple-blank-outline" size={64} color="#ec4899" />
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

        {/* ── 3. PLAYING & OBSERVE PHASE ── */}
        {(phase === 'observe' || phase === 'playing') && (
          <View style={styles.gameContainer}>
            {/* Top Match Header */}
            <View style={styles.gameTopHeader}>
              <View style={styles.playerMetaRow}>
                <View style={styles.playerMetaCol}>
                  <Text style={styles.playerLabel}>You ({userRoundWins} wins)</Text>
                  <Text style={styles.userScoreText}>{userRoundWins}</Text>
                </View>

                <View style={styles.centerRoundMeta}>
                  <Text style={styles.roundTitleText}>Round {currentRoundIdx + 1}/5</Text>
                  <Text style={styles.phaseBadgeText}>{activeRound.categoryName}</Text>
                </View>

                <View style={styles.playerMetaColRight}>
                  <Text style={styles.playerLabel}>{matchedRival.name} ({rivalRoundWins} wins)</Text>
                  <Text style={styles.rivalScoreText}>{rivalRoundWins}</Text>
                </View>
              </View>
            </View>

            {/* Observe Memory Grid for Memory Round */}
            {phase === 'observe' && (
              <View style={styles.observeSection}>
                <Text style={styles.observeHintText}>Memorize symbol locations!</Text>
                <View style={styles.symbolGrid}>
                  <View style={styles.symbolCard}><Text style={styles.symbolText}>★</Text></View>
                  <View style={styles.symbolCard}><Text style={styles.symbolText}>▲</Text></View>
                  <View style={styles.symbolCard}><Text style={styles.symbolText}>■</Text></View>
                  <View style={styles.symbolCard}><Text style={styles.symbolText}>●</Text></View>
                </View>
              </View>
            )}

            {/* Question Display & Options */}
            {phase === 'playing' && (
              <View style={styles.playingSection}>
                <View style={styles.questionCard}>
                  <Text style={styles.questionText}>{activeRound.question}</Text>
                  {showTip && (
                    <View style={styles.tipBadge}>
                      <Text style={styles.tipBadgeText}>{showTip}</Text>
                    </View>
                  )}
                </View>

                {/* 4 Choice Option Buttons */}
                <View style={styles.optionsGrid}>
                  {activeRound.options.map((opt) => {
                    const isSelected = selectedOptId === opt.id;
                    const isErr = errorOptId === opt.id;

                    return (
                      <ScalePressable
                        key={opt.id}
                        disabled={isLockedOut}
                        containerStyle={styles.optContainer}
                        style={[
                          styles.optBtn,
                          isSelected && styles.optBtnSelected,
                          isErr && styles.optBtnError,
                          isLockedOut && styles.optBtnDisabled,
                        ]}
                        onPress={() => handleSelectOption(opt)}
                      >
                        <Text style={[styles.optText, isSelected && styles.optTextSelected]}>{opt.text}</Text>
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
            userAccuracy={Math.round((userRoundWins / 5) * 100)}
            opponentAccuracy={Math.round((rivalRoundWins / 5) * 100)}
            userAvgSpeedSeconds={2.4}
            opponentAvgSpeedSeconds={3.8}
            userStreak={userRoundWins}
            opponentStreak={rivalRoundWins}
            earnedXP={isWinner ? 128 : 45}
            earnedCoins={isWinner ? 50 : 0}
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
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ec4899',
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
    borderColor: '#ec4899',
    marginBottom: 20,
  },
  howToPlayBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ec4899',
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
    backgroundColor: '#ec4899',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  startDuelBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
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
    color: '#ec4899',
    marginTop: 12,
    marginBottom: 4,
  },
  modalText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  backToGameBtn: {
    backgroundColor: '#ec4899',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToGameBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
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
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
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
    color: '#ec4899',
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
    color: '#ec4899',
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
    color: '#ec4899',
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },

  /* Memory Observe Section */
  observeSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  observeHintText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 24,
  },
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: 200,
    justifyContent: 'center',
  },
  symbolCard: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: '#121418',
    borderWidth: 1,
    borderColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 36,
    color: '#ec4899',
  },

  /* Playing Section */
  playingSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  questionCard: {
    width: '100%',
    backgroundColor: '#121418',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20242d',
    marginBottom: 24,
  },
  questionText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  tipBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tipBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#22c55e',
  },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  optContainer: {
    width: '48%',
  },
  optBtn: {
    height: 60,
    backgroundColor: '#171920',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optBtnSelected: {
    backgroundColor: '#ec4899',
  },
  optBtnError: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#ef4444',
  },
  optBtnDisabled: {
    opacity: 0.4,
  },
  optText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ec4899',
  },
  optTextSelected: {
    color: '#ffffff',
  },
});
