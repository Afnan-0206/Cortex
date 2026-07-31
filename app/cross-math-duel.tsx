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
import { generateDynamicCrossMathPuzzle, CrossMathPuzzle } from '../src/logic/crossMathGenerator';
import { CortexVictoryDefeatView } from '../src/components/CortexVictoryDefeatView';

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

export default function CrossMathDuelScreen() {
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

  // Active Cross Math Puzzle State (Generated freshly every time)
  const [puzzle, setPuzzle] = useState<CrossMathPuzzle>(generateDynamicCrossMathPuzzle());
  const [currentGrid, setCurrentGrid] = useState<(number | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  // Game Progress & Score States
  const [userSolvedCount, setUserSolvedCount] = useState(0);
  const [rivalSolvedCount, setRivalSolvedCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(35);

  // Lockout & Error States
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [errorCell, setErrorCell] = useState<{ row: number; col: number } | null>(null);

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
    
    // ALWAYS generate a fresh randomized Cross Math puzzle for the new game session!
    const freshPuzzle = generateDynamicCrossMathPuzzle();
    setPuzzle(freshPuzzle);
    setCurrentGrid(freshPuzzle.initialGrid.map((row) => [...row]));

    // Find first missing cell to select automatically
    const firstMissing = freshPuzzle.missingCells[0];
    setSelectedCell(firstMissing ? { row: firstMissing.row, col: firstMissing.col } : null);

    setPhase('matchmaking');
    setMatchStatusText('Scanning nearby Cortex challengers...');

    setTimeout(() => {
      setMatchStatusText('Match Found! Starting Cross Math Duel...');
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
    setUserSolvedCount(0);
    setRivalSolvedCount(0);
    setTimerSeconds(35);
    setIsLockedOut(false);
    setErrorCell(null);
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

          // Opponent progress simulation (every 7-9 seconds)
          if (prev % 8 === 0 && rivalSolvedCount < 4) {
            setRivalSolvedCount((r) => Math.min(4, r + 1));
          }

          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, rivalSolvedCount]);

  // User Number Selection from Keypad (1 to 9)
  const handleInputNumber = (num: number) => {
    if (!selectedCell || isLockedOut || phase !== 'playing') return;

    const { row, col } = selectedCell;
    const expectedAnswer = puzzle.solution[row][col];

    if (num === expectedAnswer) {
      // Correct placement!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const updated = currentGrid.map((r, rIdx) =>
        r.map((val, cIdx) => (rIdx === row && cIdx === col ? num : val))
      );
      setCurrentGrid(updated);

      const newSolved = userSolvedCount + 1;
      setUserSolvedCount(newSolved);

      // Find next unfilled missing cell
      const remainingMissing = puzzle.missingCells.filter(
        (cell) => updated[cell.row][cell.col] === null
      );

      if (remainingMissing.length > 0) {
        setSelectedCell({ row: remainingMissing[0].row, col: remainingMissing[0].col });
      } else {
        // User solved all missing cells! VICTORY!
        finishGame();
      }
    } else {
      // Wrong placement -> -3 seconds penalty & 1 second lockout!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setErrorCell({ row, col });
      setIsLockedOut(true);
      setTimerSeconds((t) => Math.max(1, t - 3));

      setTimeout(() => {
        setIsLockedOut(false);
        setErrorCell(null);
      }, 1000);
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

  const isWinner = userSolvedCount >= 4 || userSolvedCount >= rivalSolvedCount;

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
                <MaterialCommunityIcons name="matrix" size={14} color="#f97316" />
                <Text style={styles.badgeHeaderText}>CROSS MATH DUEL</Text>
              </View>
            </View>

            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Cross Math Duels</Text>
              <Text style={styles.heroSubtitle}>
                Arithmetic grid constraint solving. Fill cells to satisfy target equations faster!
              </Text>
            </View>

            {/* Rules Card */}
            <View style={styles.specRulesCard}>
              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="calculator" size={20} color="#f97316" />
                <Text style={styles.ruleText}>Every row and column must satisfy edge target sums</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#84cc16" />
                <Text style={styles.ruleText}>Correct placement = +1 progress</Text>
              </View>

              <View style={styles.ruleRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#ef4444" />
                <Text style={styles.ruleText}>Wrong placement = −3s penalty & 1s lockout</Text>
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
              <MaterialCommunityIcons name="matrix" size={64} color="#f97316" />
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

        {/* ── 3. PLAYING PHASE (3x3 CROSS MATH MATCH) ── */}
        {phase === 'playing' && (
          <View style={styles.gameContainer}>
            {/* Top Match Header */}
            <View style={styles.gameTopHeader}>
              <View style={styles.playerMetaRow}>
                <View style={styles.playerMetaCol}>
                  <Text style={styles.playerLabel}>You ({userSolvedCount}/4 solved)</Text>
                  <Text style={styles.userScoreText}>{userSolvedCount}</Text>
                </View>

                <View style={styles.centerRoundMeta}>
                  <Text style={styles.roundText}>Cross Math Duel</Text>
                  <Text style={styles.timerText}>00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}</Text>
                </View>

                <View style={styles.playerMetaColRight}>
                  <Text style={styles.playerLabel}>{matchedRival.name} ({rivalSolvedCount}/4 solved)</Text>
                  <Text style={styles.rivalScoreText}>{rivalSolvedCount}</Text>
                </View>
              </View>
            </View>

            {/* Center 3x3 Cross Math Grid Display with Row & Col Targets */}
            <View style={styles.crossMathSection}>
              <View style={styles.crossMathCard}>
                {currentGrid.map((row, rIdx) => (
                  <View key={rIdx} style={styles.gridRow}>
                    {row.map((val, cIdx) => {
                      const isMissing = puzzle.initialGrid[rIdx][cIdx] === null;
                      const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
                      const isError = errorCell?.row === rIdx && errorCell?.col === cIdx;

                      return (
                        <Pressable
                          key={cIdx}
                          disabled={!isMissing || isLockedOut}
                          onPress={() => setSelectedCell({ row: rIdx, col: cIdx })}
                          style={[
                            styles.gridCell,
                            isMissing && styles.cellMissing,
                            isSelected && styles.cellSelected,
                            isError && styles.cellError,
                          ]}
                        >
                          <Text
                            style={[
                              styles.gridCellText,
                              isMissing && styles.textMissing,
                              isSelected && styles.textSelected,
                              isError && styles.textError,
                            ]}
                          >
                            {val !== null ? val : '?'}
                          </Text>
                        </Pressable>
                      );
                    })}

                    {/* Edge Row Target Badge */}
                    <View style={styles.rowTargetBadge}>
                      <Text style={styles.rowTargetText}>={puzzle.rowTargets[rIdx]}</Text>
                    </View>
                  </View>
                ))}

                {/* Bottom Column Target Row */}
                <View style={styles.colTargetRow}>
                  {puzzle.colTargets.map((colTarget, cIdx) => (
                    <View key={cIdx} style={styles.colTargetBadge}>
                      <Text style={styles.colTargetText}>={colTarget}</Text>
                    </View>
                  ))}
                  <View style={{ width: 44 }} />
                </View>
              </View>
            </View>

            {/* Bottom 1 to 9 Number Picker Keypad */}
            <View style={styles.keypadSection}>
              <Text style={styles.keypadHintText}>Select number for cell [ ? ]</Text>
              <View style={styles.keypadGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <ScalePressable
                    key={num}
                    disabled={isLockedOut}
                    containerStyle={styles.keypadBtnContainer}
                    style={[styles.keypadBtn, isLockedOut && styles.keypadBtnDisabled]}
                    onPress={() => handleInputNumber(num)}
                  >
                    <Text style={styles.keypadBtnText}>{num}</Text>
                  </ScalePressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── 4. RESULTS PHASE (STANDARDIZED VICTORY / DEFEAT SCREEN) ── */}
        {phase === 'results' && (
          <CortexVictoryDefeatView
            isWinner={isWinner}
            userScore={userSolvedCount}
            opponentScore={rivalSolvedCount}
            userName="Afnan"
            opponentName={matchedRival.name}
            userAccuracy={Math.round((userSolvedCount / 4) * 100)}
            opponentAccuracy={Math.round((rivalSolvedCount / 4) * 100)}
            userAvgSpeedSeconds={parseFloat((35 - timerSeconds).toFixed(1))}
            opponentAvgSpeedSeconds={5.2}
            userStreak={userSolvedCount}
            opponentStreak={rivalSolvedCount}
            earnedXP={userSolvedCount * 30}
            earnedCoins={isWinner ? 35 : 0}
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
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f97316',
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
    backgroundColor: '#f97316',
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
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
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
    color: '#f97316',
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
    color: '#f97316',
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

  /* Cross Math 3x3 Grid Section */
  crossMathSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossMathCard: {
    backgroundColor: '#121418',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242d',
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridCell: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#171920',
    borderWidth: 1,
    borderColor: '#20242d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellMissing: {
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  cellSelected: {
    backgroundColor: 'rgba(249, 115, 22, 0.25)',
    borderColor: '#f97316',
    borderWidth: 2,
  },
  cellError: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  gridCellText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  textMissing: {
    color: '#f97316',
  },
  textSelected: {
    color: '#ffffff',
  },
  textError: {
    color: '#ef4444',
  },

  rowTargetBadge: {
    width: 44,
    alignItems: 'center',
  },
  rowTargetText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f97316',
  },

  colTargetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  colTargetBadge: {
    width: 64,
    alignItems: 'center',
  },
  colTargetText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f97316',
  },

  /* Keypad Section */
  keypadSection: {
    width: '100%',
    alignItems: 'center',
  },
  keypadHintText: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  keypadBtnContainer: {
    width: '30%',
  },
  keypadBtn: {
    height: 48,
    backgroundColor: '#171920',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadBtnDisabled: {
    opacity: 0.4,
  },
  keypadBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f97316',
  },
});
