import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
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
import { generateDynamicMathMazePuzzle, MathMazePuzzle, MathMazeDoor } from '../src/logic/mathMazeGenerator';
import { CortexVictoryDefeatView } from '../src/components/CortexVictoryDefeatView';
import { CortexHowToPlayButton } from '../src/components/CortexHowToPlayButton';
import { CortexTutorialModal } from '../src/components/CortexTutorialModal';
import { TUTORIAL_CONFIGS } from '../src/logic/tutorialConfigs';

type GamePhase = 'lobby' | 'matchmaking' | 'playing' | 'results';

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

export default function MathMazeDuelScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const incrementStreak = useUserStore((state) => state.incrementStreak);
  const incrementDailyProgress = useUserStore((state) => state.incrementDailyProgress);

  const [phase, setPhase] = useState<GamePhase>('lobby');

  // Matchmaking States
  const [matchStatusText, setMatchStatusText] = useState('Finding player...');
  const [matchedRival, setMatchedRival] = useState<{ name: string; distance: string; elo: number }>({
    name: 'Riya',
    distance: '1.2 km away',
    elo: 1452,
  });
  const [countdownNum, setCountdownNum] = useState(3);

  // Active Math Maze Puzzle State (Generated freshly every time)
  const [puzzle, setPuzzle] = useState<MathMazePuzzle>(generateDynamicMathMazePuzzle());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [pathHistory, setPathHistory] = useState<number[]>([]);
  const [rivalValue, setRivalValue] = useState(0);

  // Game Progress & Score States
  const [timerSeconds, setTimerSeconds] = useState(28);

  // Lockout & Error States
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [errorDoorId, setErrorDoorId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

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
    
    // ALWAYS generate a fresh randomized Math Maze puzzle for the new game session!
    const freshPuzzle = generateDynamicMathMazePuzzle();
    setPuzzle(freshPuzzle);
    setCurrentStepIndex(0);
    setCurrentValue(freshPuzzle.startValue);
    setPathHistory([freshPuzzle.startValue]);
    setRivalValue(freshPuzzle.startValue);

    setPhase('matchmaking');
    setMatchStatusText('Scanning nearby Cortex challengers...');

    setTimeout(() => {
      setMatchStatusText('Match Found! Starting Math Maze Duel...');
      setTimeout(() => {
        setCountdownNum(3);
        const interval = setInterval(() => {
          setCountdownNum((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              startActualGame();
              return 0;
            }
            return prev - 1;
          });
        }, 800);
      }, 1000);
    }, 1200);
  };

  const startActualGame = () => {
    setTimerSeconds(28);
    setIsLockedOut(false);
    setErrorDoorId(null);
    setPhase('playing');
  };

  // Timer & Opponent Real-time Simulation
  useEffect(() => {
    let interval: any;
    if (phase === 'playing') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            finishGame();
            return 0;
          }

          // Opponent path progress simulation
          if (prev % 6 === 0) {
            setRivalValue((rVal) => {
              if (rVal < puzzle.targetValue) {
                return Math.min(puzzle.targetValue, rVal + Math.floor(puzzle.targetValue / puzzle.optimalStepsCount));
              }
              return rVal;
            });
          }

          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, puzzle.targetValue, puzzle.optimalStepsCount]);

  // User Operation Door Choice Selection
  const handleSelectDoor = (door: MathMazeDoor) => {
    if (isLockedOut || phase !== 'playing') return;

    if (door.isOptimal) {
      // Optimal Choice -> Advance Path!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const nextVal = door.nextValue;
      setCurrentValue(nextVal);
      setPathHistory((prev) => [...prev, nextVal]);

      if (nextVal === puzzle.targetValue || currentStepIndex + 1 >= puzzle.steps.length) {
        // Reached Target! VICTORY!
        finishGame();
      } else {
        setCurrentStepIndex((idx) => idx + 1);
      }
    } else {
      // Wrong / Sub-optimal door choice -> 2-second penalty delay!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setErrorDoorId(door.id);
      setIsLockedOut(true);
      setTimerSeconds((t) => Math.max(1, t - 2));

      setTimeout(() => {
        setIsLockedOut(false);
        setErrorDoorId(null);
      }, 2000);
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

  const currentStep = puzzle.steps[currentStepIndex] || puzzle.steps[0];
  const isWinner = currentValue >= puzzle.targetValue || currentValue >= rivalValue;

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
                <MaterialCommunityIcons name="compass-outline" size={14} color="#22c55e" />
                <Text style={styles.badgeHeaderText}>MATH MAZE DUEL</Text>
              </View>

              <CortexHowToPlayButton onPress={() => setShowTutorial(true)} />
            </View>

            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Math Maze Duels</Text>
              <Text style={styles.heroSubtitle}>
                Sequential path-finding arithmetic race. Choose operations to reach the target number!
              </Text>
            </View>

            {/* Rules Card */}
            <View style={styles.specRulesCard}>
              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="map-marker-path" size={20} color="#22c55e" />
                <Text style={styles.ruleText}>Navigate door operations to reach target value</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#84cc16" />
                <Text style={styles.ruleText}>Shortest path planning awards bonus BP</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#ef4444" />
                <Text style={styles.ruleText}>Sub-optimal door choice = 2s penalty delay</Text>
              </View>
            </View>

            <ScalePressable style={styles.startDuelBtn} onPress={handleStartMatchmaking}>
              <Text style={styles.startDuelBtnText}>Find Opponent Now</Text>
            </ScalePressable>
          </ScrollView>
        )}

        {/* ── 2. MATCHMAKING PHASE ── */}
        {phase === 'matchmaking' && (
          <View style={styles.matchmakingContainer}>
            <View style={styles.radarWrapper}>
              <MaterialCommunityIcons name="compass-outline" size={64} color="#22c55e" />
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

        {/* ── 3. PLAYING PHASE (MATH MAZE MATCH) ── */}
        {phase === 'playing' && (
          <View style={styles.gameContainer}>
            {/* Top Match Header */}
            <View style={styles.gameTopHeader}>
              <View style={styles.playerMetaRow}>
                <View style={styles.playerMetaCol}>
                  <Text style={styles.playerLabel}>You (Val: {currentValue})</Text>
                  <Text style={styles.userScoreText}>{currentValue}</Text>
                </View>

                <View style={styles.centerRoundMeta}>
                  <Text style={styles.targetBadgeText}>Target: {puzzle.targetValue}</Text>
                  <Text style={styles.timerText}>00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}</Text>
                </View>

                <View style={styles.playerMetaColRight}>
                  <Text style={styles.playerLabel}>{matchedRival.name} (Val: {rivalValue})</Text>
                  <Text style={styles.rivalScoreText}>{rivalValue}</Text>
                </View>
              </View>

              {/* Path History Indicator */}
              <View style={styles.pathHistoryRow}>
                <Text style={styles.pathHistoryText}>Path: {pathHistory.join(' → ')}</Text>
              </View>
            </View>

            {/* Center Current Value Hero Box */}
            <View style={styles.centerHeroSection}>
              <View style={styles.currentValueCard}>
                <Text style={styles.currentValBigText}>{currentValue}</Text>
                <Text style={styles.currentValSubHint}>Choose the next operation door</Text>
                {isLockedOut && (
                  <View style={styles.lockoutBadge}>
                    <Text style={styles.lockoutBadgeText}>🔒 2s PENALTY DELAY</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bottom Operation Doors Grid */}
            <View style={styles.doorsSection}>
              <View style={styles.doorsGrid}>
                {currentStep.doors.map((door) => {
                  const isError = errorDoorId === door.id;

                  return (
                    <ScalePressable
                      key={door.id}
                      disabled={isLockedOut}
                      containerStyle={styles.doorBtnContainer}
                      style={[
                        styles.doorBtn,
                        isError && styles.doorBtnError,
                        isLockedOut && styles.doorBtnDisabled,
                      ]}
                      onPress={() => handleSelectDoor(door)}
                    >
                      <Text style={styles.doorLabelText}>{door.label}</Text>
                      <Text style={styles.doorResultText}>➔ {door.nextValue}</Text>
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
            isWinner={isWinner}
            userScore={currentValue}
            opponentScore={rivalValue}
            userName="Afnan"
            opponentName={matchedRival.name}
            userAccuracy={isWinner ? 100 : 70}
            opponentAccuracy={70}
            userAvgSpeedSeconds={parseFloat((28 - timerSeconds).toFixed(1))}
            opponentAvgSpeedSeconds={6.8}
            userStreak={currentStepIndex + 1}
            opponentStreak={currentStepIndex}
            earnedXP={isWinner ? 80 : 30}
            earnedCoins={isWinner ? 40 : 0}
            onPlayNext={handleStartMatchmaking}
            onExit={handleExit}
          />
        )}
      </SafeAreaView>

      <CortexTutorialModal
        visible={showTutorial}
        config={TUTORIAL_CONFIGS.mathMaze}
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
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22c55e',
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
    backgroundColor: '#22c55e',
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
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
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
    color: '#22c55e',
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
    color: '#22c55e',
  },
  rivalScoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ef4444',
  },
  centerRoundMeta: {
    alignItems: 'center',
  },
  targetBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#84cc16',
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#facc15',
    marginTop: 4,
  },

  pathHistoryRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  pathHistoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
  },

  /* Center Hero Card Display */
  centerHeroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentValueCard: {
    width: '100%',
    backgroundColor: '#121418',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20242d',
  },
  currentValBigText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  currentValSubHint: {
    fontSize: 14,
    color: '#9ca3af',
  },

  lockoutBadge: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  lockoutBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Doors Section */
  doorsSection: {
    width: '100%',
  },
  doorsGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  doorBtnContainer: {
    flex: 1,
  },
  doorBtn: {
    height: 72,
    backgroundColor: '#171920',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  doorBtnError: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  doorBtnDisabled: {
    opacity: 0.4,
  },
  doorLabelText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#22c55e',
    marginBottom: 2,
  },
  doorResultText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
  },
});
