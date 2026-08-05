import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { analytics } from '../../lib/analytics';
import { useUserStore } from './userStore';
import { MathQuestion } from '../types';
import { getPersonalizedDifficulty } from '../utils/difficulty';

export interface DailySection {
  id: 'warmup' | 'speed' | 'accuracy' | 'final_push';
  title: string;
  subtitle: string;
  questionCount: number;
  questions: MathQuestion[];
}

export interface UserAnswerRecord {
  questionIndex: number;
  sectionId: string;
  userAnswer: number;
  correct: boolean;
  timeSpentMs: number;
}

interface DailyChallengeState {
  dateStr: string; // YYYY-MM-DD
  sections: DailySection[];
  completedSections: number; // 0 - 4
  currentSectionIndex: number; // 0 - 3
  currentQuestionIndex: number; // 0 - 14
  answers: UserAnswerRecord[];
  isCompleted: boolean;
  isLoading: boolean;
  isSubmitting: boolean;

  // Rewards resulting from server completion
  rewardResult: {
    xpEarned: number;
    coinsEarned: number;
    newStreak: number;
  } | null;

  loadDailyChallenge: () => Promise<void>;
  submitAnswer: (userAnswer: number, timeSpentMs: number) => Promise<{ correct: boolean }>;
  resumeProgress: () => Promise<void>;
  resetStore: () => void;
}

// Deterministic seed generator based on YYYY-MM-DD
function dateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generatePredefinedDailySet(dateStr: string, accuracy = 0.85): DailySection[] {
  let seed = dateSeed(dateStr);
  const nextRand = () => {
    seed += 1;
    return seededRandom(seed);
  };

  const diffLevel = getPersonalizedDifficulty(accuracy);
  const scale = diffLevel === 3 ? 1.4 : diffLevel === 1 ? 0.7 : 1.0;

  // Section 1: Warmup (3 Questions)
  const warmupQuestions: MathQuestion[] = [];
  for (let i = 0; i < 3; i++) {
    const a = Math.floor(nextRand() * 20 * scale) + 10;
    const b = Math.floor(nextRand() * 20 * scale) + 5;
    const isAdd = nextRand() > 0.4;
    const ans = isAdd ? a + b : a - b;
    warmupQuestions.push({
      operand1: a,
      operand2: b,
      operator: isAdd ? '+' : '-',
      answer: ans,
      difficulty: 1,
      options: [ans, ans + 2, Math.max(1, ans - 3), ans + 5].sort(() => nextRand() - 0.5),
    });
  }

  // Section 2: Speed Round (5 Questions)
  const speedQuestions: MathQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.floor(nextRand() * 50) + 20;
    const b = Math.floor(nextRand() * 30) + 10;
    const isAdd = nextRand() > 0.5;
    const ans = isAdd ? a + b : a - b;
    speedQuestions.push({
      operand1: a,
      operand2: b,
      operator: isAdd ? '+' : '-',
      answer: ans,
      difficulty: 2,
      options: [ans, ans + 4, Math.max(2, ans - 4), ans + 10].sort(() => nextRand() - 0.5),
    });
  }

  // Section 3: Accuracy Round (4 Questions)
  const accuracyQuestions: MathQuestion[] = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.floor(nextRand() * 12) + 6;
    const b = Math.floor(nextRand() * 8) + 3;
    const c = Math.floor(nextRand() * 15) + 5;
    const ans = a * b - c;
    accuracyQuestions.push({
      operand1: `${a} × ${b} - ${c}`,
      operand2: '',
      operator: '',
      answer: ans,
      difficulty: 3,
      options: [ans, ans + 6, ans - 6, ans + 12].sort(() => nextRand() - 0.5),
    });
  }

  // Section 4: Final Push (3 Questions)
  const finalQuestions: MathQuestion[] = [];
  for (let i = 0; i < 3; i++) {
    const a = Math.floor(nextRand() * 250) + 100;
    const b = Math.floor(nextRand() * 250) + 100;
    const ans = a + b;
    finalQuestions.push({
      operand1: a,
      operand2: b,
      operator: '+',
      answer: ans,
      difficulty: 4,
      options: [ans, ans + 10, ans - 10, ans + 100].sort(() => nextRand() - 0.5),
    });
  }

  return [
    {
      id: 'warmup',
      title: 'Warmup',
      subtitle: '3 quick recall questions to ignite focus',
      questionCount: 3,
      questions: warmupQuestions,
    },
    {
      id: 'speed',
      title: 'Speed Round',
      subtitle: '5 fast arithmetic questions under pressure',
      questionCount: 5,
      questions: speedQuestions,
    },
    {
      id: 'accuracy',
      title: 'Accuracy Round',
      subtitle: '4 multi-operator precision questions',
      questionCount: 4,
      questions: accuracyQuestions,
    },
    {
      id: 'final_push',
      title: 'Final Push',
      subtitle: '3 mental athletics challenge questions',
      questionCount: 3,
      questions: finalQuestions,
    },
  ];
}

export const useDailyChallengeStore = create<DailyChallengeState>((set, get) => ({
  dateStr: new Date().toISOString().split('T')[0],
  sections: [],
  completedSections: 0,
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  answers: [],
  isCompleted: false,
  isLoading: true,
  isSubmitting: false,
  rewardResult: null,

  loadDailyChallenge: async () => {
    set({ isLoading: true });
    const todayStr = new Date().toISOString().split('T')[0];
    const userProfile = useUserStore.getState().profile;
    const generatedSections = generatePredefinedDailySet(todayStr, userProfile.mathAccuracy || 0.85);
    const isProfileTodayDone =
      userProfile.lastCompletedDate === todayStr &&
      (userProfile.dailyRewardClaimed || userProfile.dailyProgress === 4);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({
          dateStr: todayStr,
          sections: generatedSections,
          completedSections: isProfileTodayDone ? 4 : 0,
          currentQuestionIndex: isProfileTodayDone ? 15 : 0,
          isCompleted: isProfileTodayDone,
          isLoading: false,
        });
        return;
      }

      // Query database progress for today
      const { data: dbProgress } = await supabase
        .from('user_daily_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('challenge_date', todayStr)
        .maybeSingle();

      const isDone = (dbProgress?.is_completed ?? false) || isProfileTodayDone;

      if (dbProgress || isDone) {
        set({
          dateStr: todayStr,
          sections: generatedSections,
          completedSections: isDone ? 4 : (dbProgress?.completed_sections ?? 0),
          currentQuestionIndex: isDone ? 15 : (dbProgress?.current_question_index ?? 0),
          answers: dbProgress?.user_answers ?? [],
          isCompleted: isDone,
          isLoading: false,
        });
      } else {
        set({
          dateStr: todayStr,
          sections: generatedSections,
          completedSections: 0,
          currentQuestionIndex: 0,
          answers: [],
          isCompleted: false,
          isLoading: false,
        });
      }
    } catch {
      set({
        dateStr: todayStr,
        sections: generatedSections,
        completedSections: isProfileTodayDone ? 4 : 0,
        currentQuestionIndex: isProfileTodayDone ? 15 : 0,
        isCompleted: isProfileTodayDone,
        isLoading: false,
      });
    }
  },

  submitAnswer: async (userAnswer: number, timeSpentMs: number) => {
    const {
      sections,
      currentQuestionIndex,
      answers,
      dateStr,
      completedSections,
      isCompleted,
    } = get();

    if (isCompleted) return { correct: true };

    // Find current question across 4 sections
    let accumulated = 0;
    let targetQuestion: MathQuestion | null = null;
    let currentSecId = 'warmup';
    let currentSecIdx = 0;

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (currentQuestionIndex < accumulated + sec.questionCount) {
        targetQuestion = sec.questions[currentQuestionIndex - accumulated];
        currentSecId = sec.id;
        currentSecIdx = i;
        break;
      }
      accumulated += sec.questionCount;
    }

    if (!targetQuestion) return { correct: false };

    const correct = Number(userAnswer) === Number(targetQuestion.answer);
    const newRecord: UserAnswerRecord = {
      questionIndex: currentQuestionIndex,
      sectionId: currentSecId,
      userAnswer,
      correct,
      timeSpentMs,
    };

    const nextAnswers = [...answers, newRecord];
    const nextQuestionIndex = currentQuestionIndex + 1;

    // Check section boundaries (Warmup: 3, Speed: 8, Accuracy: 12, Final: 15)
    let nextCompletedSections = completedSections;
    if (nextQuestionIndex >= 3 && completedSections < 1) nextCompletedSections = 1;
    if (nextQuestionIndex >= 8 && completedSections < 2) nextCompletedSections = 2;
    if (nextQuestionIndex >= 12 && completedSections < 3) nextCompletedSections = 3;
    if (nextQuestionIndex >= 15) nextCompletedSections = 4;

    const isFinished = nextQuestionIndex >= 15;

    set({
      answers: nextAnswers,
      currentQuestionIndex: nextQuestionIndex,
      currentSectionIndex: currentSecIdx,
      completedSections: nextCompletedSections,
    });

    // Sync progress to Supabase asynchronously
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('user_daily_progress').upsert({
          user_id: session.user.id,
          challenge_date: dateStr,
          completed_sections: nextCompletedSections,
          current_question_index: nextQuestionIndex,
          user_answers: nextAnswers,
          is_completed: isFinished,
          completed_at: isFinished ? new Date().toISOString() : null,
        });

        if (isFinished) {
          set({ isSubmitting: true });
          const totalQ = sections.reduce((acc, sec) => acc + sec.questionCount, 0);
          let calculatedStreak = Math.max(1, (useUserStore.getState().profile.streak ?? 0) + 1);

          try {
            const { data: rpcRes } = await supabase.rpc('complete_daily_challenge', {
              p_user_id: session.user.id,
              p_challenge_date: dateStr,
              p_answers: nextAnswers,
              p_completed_sections: sections.length,
              p_total_questions: totalQ,
            });

            if (rpcRes) {
              calculatedStreak = rpcRes.new_streak || Math.max(1, useUserStore.getState().profile.streak ?? 1);
              const updatedP = {
                ...useUserStore.getState().profile,
                streak: calculatedStreak,
                longestStreak: rpcRes.new_best_streak || useUserStore.getState().profile.longestStreak || calculatedStreak,
                brainPoints: rpcRes.total_xp || (useUserStore.getState().profile.brainPoints ?? 0) + 250,
                coins: rpcRes.total_coins || (useUserStore.getState().profile.coins ?? 0) + 50,
                dailyProgress: 4,
                dailyRewardClaimed: true,
                lastCompletedDate: dateStr,
              };
              useUserStore.setState({ profile: updatedP });
            } else {
              const updatedP = {
                ...useUserStore.getState().profile,
                streak: calculatedStreak,
                brainPoints: (useUserStore.getState().profile.brainPoints ?? 0) + 250,
                coins: (useUserStore.getState().profile.coins ?? 0) + 50,
                dailyProgress: 4,
                dailyRewardClaimed: true,
                lastCompletedDate: dateStr,
              };
              useUserStore.setState({ profile: updatedP });
            }
          } catch {
            const updatedP = {
              ...useUserStore.getState().profile,
              streak: calculatedStreak,
              brainPoints: (useUserStore.getState().profile.brainPoints ?? 0) + 250,
              coins: (useUserStore.getState().profile.coins ?? 0) + 50,
              dailyProgress: 4,
              dailyRewardClaimed: true,
              lastCompletedDate: dateStr,
            };
            useUserStore.setState({ profile: updatedP });
          }

          set({
            isCompleted: true,
            isSubmitting: false,
            rewardResult: {
              xpEarned: 250,
              coinsEarned: 50,
              newStreak: calculatedStreak,
            },
          });
          analytics.track('daily_challenge_completed', { streak: calculatedStreak });
        }
      } else if (isFinished) {
        // Guest/offline completion
        const calculatedStreak = Math.max(1, (useUserStore.getState().profile.streak ?? 0) + 1);
        useUserStore.setState((state) => ({
          profile: {
            ...state.profile,
            streak: calculatedStreak,
            dailyProgress: 4,
            dailyRewardClaimed: true,
          },
        }));
        set({
          isCompleted: true,
          isSubmitting: false,
          rewardResult: {
            xpEarned: 250,
            coinsEarned: 50,
            newStreak: calculatedStreak,
          },
        });
      }
    } catch {
      if (isFinished) {
        const calculatedStreak = Math.max(1, (useUserStore.getState().profile.streak ?? 0) + 1);
        useUserStore.setState((state) => ({
          profile: {
            ...state.profile,
            streak: calculatedStreak,
            dailyProgress: 4,
            dailyRewardClaimed: true,
          },
        }));
        set({
          isCompleted: true,
          isSubmitting: false,
          rewardResult: {
            xpEarned: 250,
            coinsEarned: 50,
            newStreak: calculatedStreak,
          },
        });
      }
    }

    return { correct };
  },

  resumeProgress: async () => {
    await get().loadDailyChallenge();
  },

  resetStore: () => {
    set({
      dateStr: new Date().toISOString().split('T')[0],
      sections: [],
      completedSections: 0,
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      answers: [],
      isCompleted: false,
      isLoading: false,
      isSubmitting: false,
      rewardResult: null,
    });
  },
}));
