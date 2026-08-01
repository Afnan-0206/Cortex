import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { useUserStore } from '../../src/store/userStore';
import {
  generateNeuroSprintSet,
  generatePatternForgeSet,
  generateSudokuDuelSet,
  generateCrossMathSet,
  generateKenKenSet,
  generateMathMazeSet,
  generateMindSnapSet,
  generateFlashAnzanSet,
  generateOrbitRecallSet,
  generateFocusLockSet,
  GeneratedMathQuestion,
  GeneratedLogicQuestion,
  GeneratedMemoryQuestion,
  GeneratedFocusQuestion,
  GeneratedSudokuQuestion,
  GeneratedCrossMathQuestion,
  GeneratedKenKenQuestion,
  GeneratedMathMazeQuestion,
  GeneratedMindSnapQuestion,
  GeneratedFlashAnzanQuestion,
} from '../../src/logic/questionGenerator';

interface QuestItem {
  id: string;
  name: string;
  subtitle: string;
  category: 'Math' | 'Logic' | 'Memory' | 'Focus';
  tag: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  completed: boolean;
  totalQuestions: number;
}

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
      disabled={disabled}
      style={containerStyle}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.96, { damping: 14, stiffness: 220 });
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

// Breathing Neural Video Component for Cortex Space
const BreathingOrb = () => {
  let videoUri = '';
  try {
    const { Asset } = require('expo-asset');
    videoUri = Asset.fromModule(require('../../assets/breathing.mp4'))?.uri || '';
  } catch {
    try {
      videoUri = (Image as any).resolveAssetSource?.(require('../../assets/breathing.mp4'))?.uri || '';
    } catch {
      videoUri = '';
    }
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.videoOrbWrapper}>
        <video
          src={videoUri}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 20,
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.videoOrbWrapper}>
      <Video
        source={require('../../assets/breathing.mp4')}
        style={styles.videoOrb}
        shouldPlay
        isLooping
        isMuted
        resizeMode={ResizeMode.COVER}
      />
    </View>
  );
};

export default function PuzzlesScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const incrementDailyProgress = useUserStore((state) => state.incrementDailyProgress);
  const completeQuest = useUserStore((state) => state.completeQuest);
  const updateQuestProgress = useUserStore((state) => state.updateQuestProgress);

  const questPoints = profile.questPoints ?? 0;
  const completedQuests = profile.completedQuests ?? [];
  const questProgressMap = profile.questProgress ?? {};

  const userLevel = Math.max(1, Math.floor((profile.totalSessionsCompleted || 0) / 10) + 1);

  // Active Game State
  const [activeQuestGame, setActiveQuestGame] = useState<QuestItem | null>(null);
  const [showCortexSpace, setShowCortexSpace] = useState<boolean>(false);

  // Game Engine Specific States
  const [gameStepIndex, setGameStepIndex] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameDone, setGameDone] = useState(false);
  const [memoryPhase, setMemoryPhase] = useState<'observe' | 'recall'>('observe');
  const [userSequence, setUserSequence] = useState<number[]>([]);

  // Answer Feedback States
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [feedbackState, setFeedbackState] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [correctAnswerVal, setCorrectAnswerVal] = useState<any>(null);

  // Generated Sets for All Spec Games
  const [mathSet, setMathSet] = useState<GeneratedMathQuestion[]>([]);
  const [logicSet, setLogicSet] = useState<GeneratedLogicQuestion[]>([]);
  const [memorySet, setMemorySet] = useState<GeneratedMemoryQuestion[]>([]);
  const [focusSet, setFocusSet] = useState<GeneratedFocusQuestion[]>([]);
  const [sudokuSet, setSudokuSet] = useState<GeneratedSudokuQuestion[]>([]);
  const [crossMathSet, setCrossMathSet] = useState<GeneratedCrossMathQuestion[]>([]);
  const [kenKenSet, setKenKenSet] = useState<GeneratedKenKenQuestion[]>([]);
  const [mathMazeSet, setMathMazeSet] = useState<GeneratedMathMazeQuestion[]>([]);
  const [mindSnapSet, setMindSnapSet] = useState<GeneratedMindSnapQuestion[]>([]);
  const [flashAnzanSet, setFlashAnzanSet] = useState<GeneratedFlashAnzanQuestion[]>([]);

  const baseQuestsList: Omit<QuestItem, 'completed'>[] = [
    {
      id: 'q1',
      name: 'Sprint Duels',
      subtitle: '60s Speed Arithmetic (Easy → Medium → Hard → Mixed)',
      category: 'Math',
      tag: '60s Duel',
      iconName: 'lightning-bolt',
      iconColor: '#84cc16',
      totalQuestions: 20,
    },
    {
      id: 'q1_fast',
      name: 'Fast & First Duels',
      subtitle: 'Real-time Reaction Race & 2s Penalty Lockout',
      category: 'Math',
      tag: 'Reaction',
      iconName: 'flash-outline',
      iconColor: '#38bdf8',
      totalQuestions: 5,
    },
    {
      id: 'q2',
      name: 'Sudoku Duels',
      subtitle: '4x4 Deductive Elimination Grid',
      category: 'Math',
      tag: 'Sudoku',
      iconName: 'grid',
      iconColor: '#38bdf8',
      totalQuestions: 10,
    },
    {
      id: 'q3',
      name: 'Cross Math Duels',
      subtitle: 'Arithmetic Grid Constraint Solving',
      category: 'Math',
      tag: 'CrossMath',
      iconName: 'matrix',
      iconColor: '#f97316',
      totalQuestions: 10,
    },
    {
      id: 'q4',
      name: 'KenKen Duels',
      subtitle: 'Cage Arithmetic & Combinational Logic',
      category: 'Math',
      tag: 'KenKen',
      iconName: 'shape',
      iconColor: '#a78bfa',
      totalQuestions: 10,
    },
    {
      id: 'q5',
      name: 'Math Maze',
      subtitle: 'Sequential Path Door Operations',
      category: 'Math',
      tag: 'Reaction',
      iconName: 'flash-outline',
      iconColor: '#38bdf8',
      totalQuestions: 5,
    },
    {
      id: 'q6',
      name: 'Mind Snap Duels',
      subtitle: 'Rapid Visual Memory & Symbol Matching',
      category: 'Memory',
      tag: 'Visual',
      iconName: 'eye-outline',
      iconColor: '#facc15',
      totalQuestions: 10,
    },
    {
      id: 'q7',
      name: 'Flash Anzan Duels',
      subtitle: 'Rapid Mental Calculation & Memory',
      category: 'Memory',
      tag: 'Flash',
      iconName: 'counter',
      iconColor: '#ec4899',
      totalQuestions: 10,
    },
    {
      id: 'q8',
      name: 'Ability Duels',
      subtitle: 'Abstract Sequences, Rotation & Matrix Reasoning',
      category: 'Logic',
      tag: 'IQ Duel',
      iconName: 'brain',
      iconColor: '#a78bfa',
      totalQuestions: 20,
    },
  ];

  const quests: QuestItem[] = baseQuestsList.map((q) => ({
    ...q,
    completed: completedQuests.includes(q.id),
  }));

  const handleLaunchQuest = (quest: QuestItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (quest.id === 'q1_fast') {
      router.push('/fast-first');
      return;
    }
    if (quest.id === 'q2') {
      router.push('/sudoku-duel');
      return;
    }
    if (quest.id === 'q3') {
      router.push('/cross-math-duel');
      return;
    }
    if (quest.id === 'q4') {
      router.push('/kenken-duel');
      return;
    }
    if (quest.id === 'q5') {
      router.push('/math-maze-duel');
      return;
    }

    setActiveQuestGame(quest);
    setGameStepIndex(0);
    setGameScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSelectedOption(null);
    setFeedbackState(null);
    setGameDone(false);
    setUserSequence([]);

    if (quest.id === 'q1') {
      setMathSet(generateNeuroSprintSet(userLevel, 20));
    } else if (quest.id === 'q2') {
      setSudokuSet(generateSudokuDuelSet(10));
    } else if (quest.id === 'q3') {
      setCrossMathSet(generateCrossMathSet(10));
    } else if (quest.id === 'q4') {
      setKenKenSet(generateKenKenSet(10));
    } else if (quest.id === 'q5') {
      setMathMazeSet(generateMathMazeSet(5));
    } else if (quest.id === 'q6') {
      setMindSnapSet(generateMindSnapSet(10));
      setMemoryPhase('observe');
      setTimeout(() => setMemoryPhase('recall'), 1500);
    } else if (quest.id === 'q7') {
      setFlashAnzanSet(generateFlashAnzanSet(10));
    } else if (quest.id === 'q8') {
      setLogicSet(generatePatternForgeSet(userLevel, 20));
    } else {
      setMathSet(generateNeuroSprintSet(userLevel, 20));
    }
  };

  const advanceOrFinishSet = async (nextScore: number, totalQuestions: number = 10) => {
    const nextStep = gameStepIndex + 1;
    if (activeQuestGame) {
      await updateQuestProgress(activeQuestGame.id, nextStep);
    }

    if (nextStep < totalQuestions) {
      setGameStepIndex(nextStep);
      if (activeQuestGame?.id === 'q6') {
        setMemoryPhase('observe');
        setTimeout(() => setMemoryPhase('recall'), 1500);
      }
    } else {
      setGameDone(true);
      if (activeQuestGame) {
        await completeQuest(activeQuestGame.id);
        await incrementDailyProgress(1);
      }
    }
  };

  const handleGenericAnswer = async (
    isCorrect: boolean,
    targetCorrectVal: any,
    chosenVal: any,
    totalQuestions: number = 10
  ) => {
    if (feedbackState !== null) return;

    setSelectedOption(chosenVal);
    setCorrectAnswerVal(targetCorrectVal);

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFeedbackState('correct');
      setCorrectCount((c) => c + 1);
      setGameScore((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setFeedbackState('wrong');
      setWrongCount((w) => w + 1);
    }

    setTimeout(async () => {
      setSelectedOption(null);
      setFeedbackState(null);
      await advanceOrFinishSet(gameScore + (isCorrect ? 1 : 0), totalQuestions);
    }, 800);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. CORTEX SPACE BANNER ── */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <LinearGradient
              colors={['#171b26', '#0f131d']}
              style={styles.expeditionCard}
            >
              <View style={styles.expeditionRow}>
                <View style={styles.expeditionLeft}>
                  <View style={styles.expeditionBadge}>
                    <MaterialCommunityIcons name="creation" size={14} color="#84cc16" />
                    <Text style={styles.expeditionBadgeText}>CORTEX SPACE</Text>
                  </View>

                  <Text style={styles.expeditionTitle}>Daily Expedition</Text>
                  <Text style={styles.expeditionSubtitle}>
                    {questPoints} / 30 Quest Points Earned
                  </Text>
                </View>

                {/* Interactive Breathing Neural Orb */}
                <ScalePressable onPress={() => setShowCortexSpace(true)}>
                  <BreathingOrb />
                </ScalePressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── 2. SECTION HEADER ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Cognitive Training Quests</Text>
            <View style={styles.timerTag}>
              <MaterialCommunityIcons name="clock-outline" size={13} color="#9ca3af" />
              <Text style={styles.timerTagText}>DAILY REFRESH IN 8 HR</Text>
            </View>
          </View>

          {/* ── 3. DAILY QUEST CARDS LIST ── */}
          <View style={styles.questCardsList}>
            {quests.map((quest) => {
              const rawProgress = questProgressMap[quest.id] || 0;
              const solvedCount = quest.completed ? quest.totalQuestions : Math.min(quest.totalQuestions, rawProgress);
              const fillPercent = Math.min(100, Math.round((solvedCount / quest.totalQuestions) * 100));

              return (
                <View key={quest.id} style={styles.questCard}>
                  <View style={styles.questCardLeft}>
                    <View
                      style={[
                        styles.questIconBox,
                        { backgroundColor: quest.completed ? '#12251a' : '#1a1d26' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={quest.completed ? 'check-bold' : quest.iconName}
                        size={22}
                        color={quest.completed ? '#22c55e' : quest.iconColor}
                      />
                    </View>

                    <View style={styles.questMeta}>
                      <Text style={styles.questName}>{quest.name}</Text>
                      <Text style={styles.questSubtitle}>{quest.subtitle}</Text>

                      <View style={styles.questProgressRow}>
                        <View style={styles.miniProgressTrack}>
                          <View
                            style={[
                              styles.miniProgressFill,
                              { width: `${fillPercent}%` },
                              quest.completed && { width: '100%', backgroundColor: '#22c55e' },
                            ]}
                          />
                        </View>

                        <Text
                          style={[
                            styles.questProgressText,
                            quest.completed && { color: '#22c55e' },
                          ]}
                        >
                          {quest.completed ? `${quest.totalQuestions} / ${quest.totalQuestions} ✓` : `${solvedCount} / ${quest.totalQuestions}`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <ScalePressable
                    style={[
                      styles.playBtn,
                      quest.completed && styles.playBtnCompleted,
                    ]}
                    onPress={() => handleLaunchQuest(quest)}
                  >
                    <Text
                      style={[
                        styles.playBtnText,
                        quest.completed && styles.playBtnTextCompleted,
                      ]}
                    >
                      {quest.completed ? 'Replay' : 'Play'}
                    </Text>
                  </ScalePressable>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* ── INTERACTIVE GAME MODAL ── */}
        <Modal
          visible={activeQuestGame !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveQuestGame(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setActiveQuestGame(null)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalQuestTag}>
                  <MaterialCommunityIcons
                    name={activeQuestGame?.iconName || 'brain'}
                    size={16}
                    color={activeQuestGame?.iconColor || '#84cc16'}
                  />
                  <Text style={styles.modalQuestTagText}>{activeQuestGame?.name}</Text>
                </View>

                <Pressable onPress={() => setActiveQuestGame(null)}>
                  <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
                </Pressable>
              </View>

              {!gameDone ? (
                <View style={styles.gameBody}>
                  {/* 1. Sprint Duels (q1) */}
                  {activeQuestGame?.id === 'q1' && mathSet.length > 0 && (
                    <>
                      <View style={styles.diffPillRow}>
                        <Text style={styles.diffPillText}>
                          Mode: {mathSet[gameStepIndex]?.difficulty || 'Mixed'}
                        </Text>
                      </View>
                      <Text style={styles.gameCounterText}>
                        Question {gameStepIndex + 1} of 20 • Score: {gameScore}
                      </Text>
                      <View style={styles.expressionBox}>
                        <Text style={styles.expressionText}>{mathSet[gameStepIndex]?.q}</Text>
                      </View>

                      {/* Inline Answer Feedback Banner */}
                      {feedbackState !== null && (
                        <Animated.View entering={FadeInDown.duration(200)} style={[styles.feedbackBanner, feedbackState === 'correct' ? styles.feedbackBannerCorrect : styles.feedbackBannerWrong]}>
                          <MaterialCommunityIcons
                            name={feedbackState === 'correct' ? 'check-circle' : 'close-circle'}
                            size={18}
                            color={feedbackState === 'correct' ? '#4ade80' : '#f87171'}
                          />
                          <Text style={[styles.feedbackBannerText, feedbackState === 'correct' ? styles.feedbackTextCorrect : styles.feedbackTextWrong]}>
                            {feedbackState === 'correct'
                              ? '✓ Correct! +10 XP'
                              : `✕ Almost — correct answer was ${correctAnswerVal}`}
                          </Text>
                        </Animated.View>
                      )}

                      <View style={styles.optionsGrid}>
                        {mathSet[gameStepIndex]?.options.map((opt, idx) => {
                          const isSelected = selectedOption === opt;
                          const targetAns = mathSet[gameStepIndex]?.answer;
                          const isCorrectTarget = Number(opt) === Number(targetAns);
                          const isSelectedCorrect = feedbackState === 'correct' && isSelected;
                          const isSelectedWrong = feedbackState === 'wrong' && isSelected;
                          const isTargetHighlight = feedbackState === 'wrong' && isCorrectTarget;

                          return (
                            <ScalePressable
                              key={idx}
                              disabled={feedbackState !== null}
                              containerStyle={styles.optionBtnContainer}
                              style={[
                                styles.optionBtn,
                                isSelectedCorrect && styles.optionBtnCorrect,
                                isSelectedWrong && styles.optionBtnWrong,
                                isTargetHighlight && styles.optionBtnTargetHighlight,
                              ]}
                              onPress={() => handleGenericAnswer(opt === targetAns, targetAns, opt, 20)}
                            >
                              <View style={styles.optionContentRow}>
                                <Text
                                  style={[
                                    styles.optionBtnText,
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
                            </ScalePressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* 2. Sudoku Duels (q2) */}
                  {activeQuestGame?.id === 'q2' && sudokuSet.length > 0 && (
                    <>
                      <Text style={styles.gameCounterText}>
                        Sudoku Grid {gameStepIndex + 1} of 10 • Fill Missing Number
                      </Text>
                      <View style={styles.sudokuGridContainer}>
                        {sudokuSet[gameStepIndex]?.grid.map((row, rIdx) => (
                          <View key={rIdx} style={styles.sudokuRow}>
                            {row.map((val, cIdx) => (
                              <View
                                key={cIdx}
                                style={[
                                  styles.sudokuCell,
                                  val === null && styles.sudokuCellMissing,
                                ]}
                              >
                                <Text style={styles.sudokuCellText}>
                                  {val !== null ? val : '?'}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>

                      {/* Inline Answer Feedback Banner */}
                      {feedbackState !== null && (
                        <Animated.View entering={FadeInDown.duration(200)} style={[styles.feedbackBanner, feedbackState === 'correct' ? styles.feedbackBannerCorrect : styles.feedbackBannerWrong]}>
                          <MaterialCommunityIcons
                            name={feedbackState === 'correct' ? 'check-circle' : 'close-circle'}
                            size={18}
                            color={feedbackState === 'correct' ? '#4ade80' : '#f87171'}
                          />
                          <Text style={[styles.feedbackBannerText, feedbackState === 'correct' ? styles.feedbackTextCorrect : styles.feedbackTextWrong]}>
                            {feedbackState === 'correct'
                              ? '✓ Correct! +10 XP'
                              : `✕ Almost — correct answer was ${correctAnswerVal}`}
                          </Text>
                        </Animated.View>
                      )}

                      <View style={styles.optionsGrid}>
                        {sudokuSet[gameStepIndex]?.options.map((opt, idx) => {
                          const isSelected = selectedOption === opt;
                          const targetAns = sudokuSet[gameStepIndex]?.missingCell.answer;
                          const isCorrectTarget = Number(opt) === Number(targetAns);
                          const isSelectedCorrect = feedbackState === 'correct' && isSelected;
                          const isSelectedWrong = feedbackState === 'wrong' && isSelected;
                          const isTargetHighlight = feedbackState === 'wrong' && isCorrectTarget;

                          return (
                            <ScalePressable
                              key={idx}
                              disabled={feedbackState !== null}
                              containerStyle={styles.optionBtnContainer}
                              style={[
                                styles.optionBtn,
                                isSelectedCorrect && styles.optionBtnCorrect,
                                isSelectedWrong && styles.optionBtnWrong,
                                isTargetHighlight && styles.optionBtnTargetHighlight,
                              ]}
                              onPress={() => handleGenericAnswer(opt === targetAns, targetAns, opt, 10)}
                            >
                              <View style={styles.optionContentRow}>
                                <Text
                                  style={[
                                    styles.optionBtnText,
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
                            </ScalePressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* 3. Cross Math Duels (q3) */}
                  {activeQuestGame?.id === 'q3' && crossMathSet.length > 0 && (
                    <>
                      <Text style={styles.gameCounterText}>
                        Cross Math {gameStepIndex + 1} of 10 • Satisfy Edge Targets
                      </Text>
                      <View style={styles.sudokuGridContainer}>
                        {crossMathSet[gameStepIndex]?.grid.map((row, rIdx) => (
                          <View key={rIdx} style={styles.sudokuRow}>
                            {row.map((val, cIdx) => (
                              <View key={cIdx} style={[styles.sudokuCell, val === null && styles.sudokuCellMissing]}>
                                <Text style={styles.sudokuCellText}>{val !== null ? val : '?'}</Text>
                              </View>
                            ))}
                            <View style={styles.edgeTargetBadge}>
                              <Text style={styles.edgeTargetText}>={crossMathSet[gameStepIndex]?.rowTargets[rIdx]}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                      <View style={styles.optionsGrid}>
                        {crossMathSet[gameStepIndex]?.options.map((opt, idx) => {
                          const isSelected = selectedOption === opt;
                          const targetAns = crossMathSet[gameStepIndex]?.missingCell.answer;
                          const isCorrectTarget = Number(opt) === Number(targetAns);
                          const isSelectedCorrect = feedbackState === 'correct' && isSelected;
                          const isSelectedWrong = feedbackState === 'wrong' && isSelected;
                          const isTargetHighlight = feedbackState === 'wrong' && isCorrectTarget;

                          return (
                            <ScalePressable
                              key={idx}
                              disabled={feedbackState !== null}
                              containerStyle={styles.optionBtnContainer}
                              style={[
                                styles.optionBtn,
                                isSelectedCorrect && styles.optionBtnCorrect,
                                isSelectedWrong && styles.optionBtnWrong,
                                isTargetHighlight && styles.optionBtnTargetHighlight,
                              ]}
                              onPress={() => handleGenericAnswer(opt === targetAns, targetAns, opt, 10)}
                            >
                              <View style={styles.optionContentRow}>
                                <Text
                                  style={[
                                    styles.optionBtnText,
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
                            </ScalePressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* 4. KenKen Duels (q4) */}
                  {activeQuestGame?.id === 'q4' && kenKenSet.length > 0 && (
                    <>
                      <Text style={styles.gameCounterText}>
                        KenKen Cage {gameStepIndex + 1} of 10 • Select Valid Pair
                      </Text>
                      <View style={styles.expressionBox}>
                        <Text style={styles.expressionText}>
                          Cage Target: {kenKenSet[gameStepIndex]?.cageTarget}
                        </Text>
                      </View>
                      <View style={styles.optionsGrid}>
                        {kenKenSet[gameStepIndex]?.options.map((opt, idx) => {
                          const isSelected = selectedOption === opt;
                          const targetAns = kenKenSet[gameStepIndex]?.answer;
                          const isCorrectTarget = Number(opt) === Number(targetAns);
                          const isSelectedCorrect = feedbackState === 'correct' && isSelected;
                          const isSelectedWrong = feedbackState === 'wrong' && isSelected;
                          const isTargetHighlight = feedbackState === 'wrong' && isCorrectTarget;

                          return (
                            <ScalePressable
                              key={idx}
                              disabled={feedbackState !== null}
                              containerStyle={styles.optionBtnContainer}
                              style={[
                                styles.optionBtn,
                                isSelectedCorrect && styles.optionBtnCorrect,
                                isSelectedWrong && styles.optionBtnWrong,
                                isTargetHighlight && styles.optionBtnTargetHighlight,
                              ]}
                              onPress={() => handleGenericAnswer(opt === targetAns, targetAns, opt, 10)}
                            >
                              <View style={styles.optionContentRow}>
                                <Text
                                  style={[
                                    styles.optionBtnText,
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
                            </ScalePressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* 5. Math Maze (q5) */}
                  {activeQuestGame?.id === 'q5' && mathMazeSet.length > 0 && (
                    <>
                      <Text style={styles.gameCounterText}>
                        Math Maze {gameStepIndex + 1} of 5 • Start: {mathMazeSet[gameStepIndex]?.startValue} → Target: {mathMazeSet[gameStepIndex]?.targetValue}
                      </Text>
                      <View style={styles.expressionBox}>
                        <Text style={styles.expressionText}>Select Door Path:</Text>
                      </View>
                      <View style={styles.optionsGrid}>
                        {mathMazeSet[gameStepIndex]?.steps[0].options.map((door, idx) => {
                          const isSelected = selectedOption === door.label;
                          const isSelectedCorrect = feedbackState === 'correct' && isSelected;
                          const isSelectedWrong = feedbackState === 'wrong' && isSelected;
                          const isTargetHighlight = feedbackState === 'wrong' && door.isCorrect;

                          return (
                            <ScalePressable
                              key={idx}
                              disabled={feedbackState !== null}
                              containerStyle={styles.optionBtnContainer}
                              style={[
                                styles.optionBtn,
                                isSelectedCorrect && styles.optionBtnCorrect,
                                isSelectedWrong && styles.optionBtnWrong,
                                isTargetHighlight && styles.optionBtnTargetHighlight,
                              ]}
                              onPress={() => handleGenericAnswer(door.isCorrect, 'Correct Door', door.label, 5)}
                            >
                              <View style={styles.optionContentRow}>
                                <Text
                                  style={[
                                    styles.optionBtnText,
                                    (isSelectedCorrect || isTargetHighlight) && styles.optionTextCorrect,
                                    isSelectedWrong && styles.optionTextWrong,
                                  ]}
                                >
                                  {door.label}
                                </Text>
                                {isSelectedCorrect ? (
                                  <MaterialCommunityIcons name="check-circle" size={18} color="#4ade80" />
                                ) : isSelectedWrong ? (
                                  <MaterialCommunityIcons name="close-circle" size={18} color="#f87171" />
                                ) : isTargetHighlight ? (
                                  <MaterialCommunityIcons name="check" size={18} color="#4ade80" />
                                ) : null}
                              </View>
                            </ScalePressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* 6. Mind Snap Duels (q6) */}
                  {activeQuestGame?.id === 'q6' && mindSnapSet.length > 0 && (
                    <>
                      <Text style={styles.gameCounterText}>
                        Mind Snap {gameStepIndex + 1} of 10 • {memoryPhase === 'observe' ? 'Memorize Symbols (1.5s)!' : 'Select Symbols Shown!'}
                      </Text>
                      <View style={styles.expressionBox}>
                        <Text style={styles.expressionText}>
                          {memoryPhase === 'observe'
                            ? mindSnapSet[gameStepIndex]?.flashedSymbols.join('  ')
                            : '❓  ❓  ❓  ❓'}
                        </Text>
                      </View>
                      {memoryPhase === 'recall' && (
                        <View style={styles.optionsGrid}>
                          {mindSnapSet[gameStepIndex]?.options.slice(0, 4).map((sym, idx) => {
                            const isSelected = selectedOption === sym;
                            const isCorrectTarget = mindSnapSet[gameStepIndex]?.correctSymbols.includes(sym);
                            const isSelectedCorrect = feedbackState === 'correct' && isSelected;
                            const isSelectedWrong = feedbackState === 'wrong' && isSelected;
                            const isTargetHighlight = feedbackState === 'wrong' && isCorrectTarget;

                            return (
                              <ScalePressable
                                key={idx}
                                disabled={feedbackState !== null}
                                containerStyle={styles.optionBtnContainer}
                                style={[
                                  styles.optionBtn,
                                  isSelectedCorrect && styles.optionBtnCorrect,
                                  isSelectedWrong && styles.optionBtnWrong,
                                  isTargetHighlight && styles.optionBtnTargetHighlight,
                                ]}
                                onPress={() => handleGenericAnswer(isCorrectTarget, 'Matching Symbols', sym, 10)}
                              >
                                <View style={styles.optionContentRow}>
                                  <Text
                                    style={[
                                      styles.optionBtnText,
                                      (isSelectedCorrect || isTargetHighlight) && styles.optionTextCorrect,
                                      isSelectedWrong && styles.optionTextWrong,
                                    ]}
                                  >
                                    {sym}
                                  </Text>
                                  {isSelectedCorrect ? (
                                    <MaterialCommunityIcons name="check-circle" size={18} color="#4ade80" />
                                  ) : isSelectedWrong ? (
                                    <MaterialCommunityIcons name="close-circle" size={18} color="#f87171" />
                                  ) : isTargetHighlight ? (
                                    <MaterialCommunityIcons name="check" size={18} color="#4ade80" />
                                  ) : null}
                                </View>
                              </ScalePressable>
                            );
                          })}
                        </View>
                      )}
                    </>
                  )}

                  {/* 7. Flash Anzan Duels (q7) */}
                  {activeQuestGame?.id === 'q7' && flashAnzanSet.length > 0 && (
                    <>
                      <Text style={styles.gameCounterText}>
                        Flash Anzan {gameStepIndex + 1} of 10 • Calculate Rapid Sum
                      </Text>
                      <View style={styles.expressionBox}>
                        <Text style={styles.expressionText}>
                          {flashAnzanSet[gameStepIndex]?.numbers.join(' → ')}
                        </Text>
                      </View>
                      <View style={styles.optionsGrid}>
                        {flashAnzanSet[gameStepIndex]?.options.map((opt, idx) => {
                          const isSelected = selectedOption === opt;
                          const targetAns = flashAnzanSet[gameStepIndex]?.totalSum;
                          const isCorrectTarget = Number(opt) === Number(targetAns);
                          const isSelectedCorrect = feedbackState === 'correct' && isSelected;
                          const isSelectedWrong = feedbackState === 'wrong' && isSelected;
                          const isTargetHighlight = feedbackState === 'wrong' && isCorrectTarget;

                          return (
                            <ScalePressable
                              key={idx}
                              disabled={feedbackState !== null}
                              containerStyle={styles.optionBtnContainer}
                              style={[
                                styles.optionBtn,
                                isSelectedCorrect && styles.optionBtnCorrect,
                                isSelectedWrong && styles.optionBtnWrong,
                                isTargetHighlight && styles.optionBtnTargetHighlight,
                              ]}
                              onPress={() => handleGenericAnswer(opt === targetAns, targetAns, opt, 10)}
                            >
                              <View style={styles.optionContentRow}>
                                <Text
                                  style={[
                                    styles.optionBtnText,
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
                            </ScalePressable>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* 8. Ability Duels (q8 - Sequences, Alternating, Rotation, Matrix) */}
                  {activeQuestGame?.id === 'q8' && logicSet.length > 0 && (
                    <>
                      <View style={styles.diffPillRow}>
                        <Text style={styles.diffPillText}>
                          Rule: {logicSet[gameStepIndex]?.type || 'Sequence'}
                        </Text>
                      </View>
                      <Text style={styles.gameCounterText}>
                        Ability Duel {gameStepIndex + 1} of 20 • Score: {gameScore}
                      </Text>
                      <View style={styles.expressionBox}>
                        <Text style={styles.expressionText}>
                          {logicSet[gameStepIndex]?.seq.join('\n')}
                        </Text>
                      </View>
                      <View style={styles.optionsGrid}>
                        {logicSet[gameStepIndex]?.options.map((opt, idx) => {
                          const isSelected = selectedOption === opt;
                          const targetAns = logicSet[gameStepIndex]?.answer;
                          const isCorrectTarget = String(opt) === String(targetAns);
                          const isSelectedCorrect = feedbackState === 'correct' && isSelected;
                          const isSelectedWrong = feedbackState === 'wrong' && isSelected;
                          const isTargetHighlight = feedbackState === 'wrong' && isCorrectTarget;

                          return (
                            <ScalePressable
                              key={idx}
                              disabled={feedbackState !== null}
                              containerStyle={styles.optionBtnContainer}
                              style={[
                                styles.optionBtn,
                                isSelectedCorrect && styles.optionBtnCorrect,
                                isSelectedWrong && styles.optionBtnWrong,
                                isTargetHighlight && styles.optionBtnTargetHighlight,
                              ]}
                              onPress={() => handleGenericAnswer(opt === targetAns, targetAns, opt, 20)}
                            >
                              <View style={styles.optionContentRow}>
                                <Text
                                  style={[
                                    styles.optionBtnText,
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
                            </ScalePressable>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.victoryBody}>
                  <MaterialCommunityIcons name="trophy-award" size={56} color="#facc15" />
                  <Text style={styles.victoryTitle}>QUEST COMPLETED! 🏆</Text>
                  <Text style={styles.victorySub}>
                    {activeQuestGame?.name} set finished! Performance breakdown:
                  </Text>

                  {/* Summary Stats Grid: Correct, Wrong, Accuracy */}
                  <View style={styles.summaryStatsGrid}>
                    <View style={styles.summaryStatCardGreen}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4ade80" />
                      <Text style={styles.summaryStatNumGreen}>{correctCount}</Text>
                      <Text style={styles.summaryStatLabel}>Correct</Text>
                    </View>

                    <View style={styles.summaryStatCardRed}>
                      <MaterialCommunityIcons name="close-circle" size={24} color="#f87171" />
                      <Text style={styles.summaryStatNumRed}>{wrongCount}</Text>
                      <Text style={styles.summaryStatLabel}>Wrong</Text>
                    </View>

                    <View style={styles.summaryStatCardBlue}>
                      <MaterialCommunityIcons name="percent" size={24} color="#38bdf8" />
                      <Text style={styles.summaryStatNumBlue}>
                        {Math.round((correctCount / Math.max(1, correctCount + wrongCount)) * 100)}%
                      </Text>
                      <Text style={styles.summaryStatLabel}>Accuracy</Text>
                    </View>
                  </View>

                  <ScalePressable
                    style={styles.claimQuestBtn}
                    onPress={() => setActiveQuestGame(null)}
                  >
                    <Text style={styles.claimQuestBtnText}>Claim Rewards & Finish</Text>
                  </ScalePressable>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── CORTEX SPACE BREATHING ORB FULLSCREEN MODAL ── */}
        <Modal
          visible={showCortexSpace}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCortexSpace(false)}
        >
          <View style={styles.spaceModalContainer}>
            <BreathingOrb />
            <Text style={styles.spaceTitle}>CORTEX BREATHING SPACE</Text>
            <Text style={styles.spaceSub}>Focus & synchronize your neural state before duels.</Text>
            <ScalePressable
              style={styles.closeSpaceBtn}
              onPress={() => setShowCortexSpace(false)}
            >
              <Text style={styles.closeSpaceBtnText}>Return to Quests</Text>
            </ScalePressable>
          </View>
        </Modal>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  expeditionCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#20242d',
    marginBottom: 24,
  },
  expeditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expeditionLeft: {
    flex: 1,
    paddingRight: 12,
  },
  expeditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  expeditionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#84cc16',
    letterSpacing: 0.5,
  },
  expeditionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  expeditionSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
  },

  videoOrbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(132, 204, 22, 0.4)',
  },
  videoOrb: {
    width: '100%',
    height: '100%',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  timerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#171920',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
  },

  questCardsList: {
    gap: 12,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121418',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#20242d',
  },
  questCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  questIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questMeta: {
    flex: 1,
  },
  questName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  questSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },

  questProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#20242d',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#84cc16',
    borderRadius: 2,
  },
  questProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
  },

  playBtn: {
    backgroundColor: '#84cc16',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  playBtnCompleted: {
    backgroundColor: '#1e2430',
  },
  playBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  playBtnTextCompleted: {
    color: '#84cc16',
  },

  /* Game Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#121418',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#20242d',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalQuestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalQuestTagText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  gameBody: {
    alignItems: 'center',
  },
  diffPillRow: {
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  diffPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#84cc16',
  },
  gameCounterText: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
  },
  expressionBox: {
    width: '100%',
    paddingVertical: 24,
    backgroundColor: '#171920',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#20242d',
    marginBottom: 20,
  },
  expressionText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  optionBtnContainer: {
    width: '48%',
  },
  optionBtn: {
    height: 54,
    backgroundColor: '#171920',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#20242d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  optionContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  optionBtnCorrect: {
    backgroundColor: 'rgba(74, 222, 128, 0.18)',
    borderColor: '#4ade80',
  },
  optionBtnWrong: {
    backgroundColor: 'rgba(248, 113, 113, 0.18)',
    borderColor: '#f87171',
  },
  optionBtnTargetHighlight: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: '#4ade80',
  },
  optionBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  optionTextCorrect: {
    color: '#4ade80',
  },
  optionTextWrong: {
    color: '#f87171',
  },

  // Inline Feedback Banner
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    width: '100%',
  },
  feedbackBannerCorrect: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: '#4ade80',
  },
  feedbackBannerWrong: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: '#f87171',
  },
  feedbackBannerText: {
    fontSize: 13,
    fontWeight: '800',
  },
  feedbackTextCorrect: {
    color: '#4ade80',
  },
  feedbackTextWrong: {
    color: '#f87171',
  },

  /* Sudoku & Cross Math Grids */
  sudokuGridContainer: {
    backgroundColor: '#171920',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#20242d',
    marginBottom: 20,
    gap: 6,
  },
  sudokuRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sudokuCell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1e222d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3342',
  },
  sudokuCellMissing: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  sudokuCellText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  edgeTargetBadge: {
    paddingHorizontal: 6,
  },
  edgeTargetText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f97316',
  },

  victoryBody: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  victoryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 6,
  },
  victorySub: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Summary Stats Grid
  summaryStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    marginBottom: 24,
  },
  summaryStatCardGreen: {
    flex: 1,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  summaryStatNumGreen: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4ade80',
    marginTop: 4,
  },
  summaryStatCardRed: {
    flex: 1,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  summaryStatNumRed: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f87171',
    marginTop: 4,
  },
  summaryStatCardBlue: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  summaryStatNumBlue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38bdf8',
    marginTop: 4,
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 2,
  },

  claimQuestBtn: {
    backgroundColor: '#84cc16',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  claimQuestBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },

  spaceModalContainer: {
    flex: 1,
    backgroundColor: '#0a0b0d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  spaceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 1,
  },
  spaceSub: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  closeSpaceBtn: {
    backgroundColor: '#171920',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#20242d',
  },
  closeSpaceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
