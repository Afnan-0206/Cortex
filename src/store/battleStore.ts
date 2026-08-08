import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { bulkInsert } from '../../lib/batchUtils';
import { CircuitBreaker } from '../../lib/circuitBreaker';
import { analytics } from '../../lib/analytics';
import { notifyMatchFound } from '../../lib/notifications';
import { useUserStore } from './userStore';
import { MathQuestion } from '../types';

export interface BattlePlayer {
  id: string;
  name: string;
  rating: number;
  score: number;
  progress: number;
  streak: number;
}

const matchmakingCircuitBreaker = new CircuitBreaker<{ matchId: string; questionIds: string[] }>({
  name: 'MatchmakingService',
  failureThreshold: 3,
  timeoutMs: 5000,
  resetTimeoutMs: 10000,
  maxConcurrent: 5,
  fallback: async () => ({
    matchId: `match_offline_${Date.now()}`,
    questionIds: [],
  }),
});

interface BattleStoreState {
  matchId: string | null;
  status: 'idle' | 'searching' | 'playing' | 'complete';
  user: BattlePlayer;
  opponent: BattlePlayer;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  earnedXP: number;
  opponentSolveTimer: number;
  questions: MathQuestion[];
  questionStartedAt: string | null;
  questionIds: string[];

  startMatchmaking: (userId: string, rating: number, gameMode?: string) => Promise<void>;
  subscribeToMatch: (matchId: string) => void;
  submitAnswer: (selectedAnswer: number) => boolean;
  tickTimer: () => void;
  calculateServerTimeLeft: () => number;
  getServerTimeLeft: () => number;
  resetBattle: () => void;
}

export const generateTrickyQuestions = (count: number = 30): MathQuestion[] => {
  const questions: MathQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const type = i % 5;
    let operand1: number | string = 0;
    let operand2: number | string = 0;
    let operator: string = '+';
    let answer = 0;

    if (type === 0) {
      const a = Math.floor(Math.random() * 450) + 120;
      const b = Math.floor(Math.random() * 450) + 120;
      operand1 = a;
      operand2 = b;
      operator = '+';
      answer = a + b;
    } else if (type === 1) {
      const a = Math.floor(Math.random() * 180) + 100;
      const b = Math.floor(Math.random() * 90) + 40;
      const c = Math.floor(Math.random() * 60) + 20;
      operand1 = `${a}\n+ ${b}\n- ${c}`;
      operand2 = '';
      operator = '';
      answer = a + b - c;
    } else if (type === 2) {
      const divisors = [8, 9, 12, 14, 15, 16, 18, 25];
      const div = divisors[Math.floor(Math.random() * divisors.length)];
      const quotient = Math.floor(Math.random() * 35) + 12;
      operand1 = div * quotient;
      operand2 = div;
      operator = '÷';
      answer = quotient;
    } else if (type === 3) {
      const a = Math.floor(Math.random() * 15) + 8;
      const b = Math.floor(Math.random() * 8) + 4;
      const c = Math.floor(Math.random() * 25) + 10;
      const isSub = Math.random() > 0.5;
      operand1 = `${a} × ${b}\n${isSub ? '-' : '+'} ${c}`;
      operand2 = '';
      operator = '';
      answer = isSub ? a * b - c : a * b + c;
    } else {
      const a = Math.floor(Math.random() * 35) + 15;
      const b = Math.floor(Math.random() * 12) + 6;
      operand1 = a;
      operand2 = b;
      operator = '×';
      answer = a * b;
    }

    questions.push({
      operand1,
      operand2,
      operator,
      answer,
      difficulty: 2,
      options: [answer, answer + 10, answer - 10, answer + 2],
    });
  }

  return questions;
};

let battleChannel: any = null;

export const useBattleStore = create<BattleStoreState>((set, get) => ({
  matchId: null,
  status: 'idle',
  user: {
    id: 'user_local',
    name: 'Afnan',
    rating: 1420,
    score: 0,
    progress: 0,
    streak: 0,
  },
  opponent: {
    id: 'opp_riya',
    name: 'Riya',
    rating: 1452,
    score: 0,
    progress: 0,
    streak: 0,
  },
  currentQuestionIndex: 0,
  totalQuestions: 60,
  timeLeft: 60,
  earnedXP: 0,
  opponentSolveTimer: 2,
  questions: generateTrickyQuestions(30),
  questionStartedAt: null,
  questionIds: [],

  startMatchmaking: async (userId: string, rating: number, gameMode = 'sprint') => {
    set({ status: 'searching' });
    analytics.track('battle_started', { gameMode });

    try {
      // Call the real edge function for matchmaking + question generation
      const { data, error } = await supabase.functions.invoke('find-match', {
        body: { userId, rating, gameMode, matchesPlayed: 15 },
      });

      if (error) throw error;

      if (data?.status === 'matched') {
        notifyMatchFound();

        // Fetch generated questions from edge function
        const { data: questionsData, error: qError } = await supabase.functions.invoke('generate-questions', {
          body: { gameMode, count: 30, userRating: rating },
        });

        let freshQuestions = generateTrickyQuestions(30);
        let questionIds: string[] = [];

        if (!qError && questionsData?.questions) {
          freshQuestions = questionsData.questions;
          questionIds = questionsData.questionIds || [];
        }

        const userProfile = useUserStore.getState().profile;
        const userName = userProfile.name || 'Athlete';
        const userRating = userProfile.brainPoints || rating || 1200;

        set({
          matchId: data.matchId,
          status: 'playing',
          currentQuestionIndex: 0,
          questionStartedAt: new Date().toISOString(),
          timeLeft: 60,
          earnedXP: 0,
          opponentSolveTimer: 2,
          questions: freshQuestions,
          questionIds,
          user: { id: userId || 'user_local', name: userName, rating: userRating, score: 0, progress: 0, streak: 0 },
          opponent: { id: data.opponentId || 'opp_rival', name: 'Opponent', rating: data.opponentRating || userRating + 25, score: 0, progress: 0, streak: 0 },
        });

        get().subscribeToMatch(data.matchId);
      } else if (data?.status === 'queued') {
        // Wait for match - poll for match creation
        set({ status: 'searching' });
        // In production, you'd listen to realtime for match creation
        // For now, simulate finding a match after a delay
        setTimeout(() => {
          get().startMatchmaking(userId, rating, gameMode);
        }, 5000);
      }
    } catch (e) {
      console.warn('Matchmaking error:', e);
      // Fallback to local AI
      const freshQuestions = generateTrickyQuestions(30);
      const userProfile = useUserStore.getState().profile;
      const userName = userProfile.name || 'Athlete';
      const userRating = userProfile.brainPoints || rating || 1200;

      set({
        matchId: `match_offline_${Date.now()}`,
        status: 'playing',
        currentQuestionIndex: 0,
        questionStartedAt: new Date().toISOString(),
        timeLeft: 60,
        earnedXP: 0,
        opponentSolveTimer: 2,
        questions: freshQuestions,
        questionIds: [],
        user: { id: userId || 'user_local', name: userName, rating: userRating, score: 0, progress: 0, streak: 0 },
        opponent: { id: 'opp_rival', name: 'AI Rival', rating: userRating + 25, score: 0, progress: 0, streak: 0 },
      });
    }
  },

  subscribeToMatch: (matchId: string) => {
    if (battleChannel) battleChannel.unsubscribe();

    battleChannel = supabase.channel(`battle:${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_state', filter: `match_id=eq.${matchId}` }, (payload: any) => {
        const stateData = payload.new;
        if (stateData) {
          const isDone = stateData.timeLeft <= 0 || stateData.status === 'completed';
          set({
            status: isDone ? 'complete' : 'playing',
          });

          if (isDone && get().status !== 'complete') {
            analytics.track('battle_completed', { matchId });
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers', filter: `match_id=eq.${matchId}` }, (payload: any) => {
        const answerRow = payload.new;
        const currentOpponent = get().opponent;
        if (answerRow && answerRow.user_id !== get().user.id) {
          const oppScore = answerRow.correct ? currentOpponent.score + 1 : currentOpponent.score;
          set({
            opponent: {
              ...currentOpponent,
              score: oppScore,
              progress: Math.min(100, Math.round((oppScore / 20) * 100)),
            },
          });
        }
      })
      .subscribe();
  },

  calculateServerTimeLeft: () => {
    const startedAt = get().questionStartedAt;
    if (!startedAt) return 60;
    const elapsedSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, 60 - elapsedSeconds);
  },

  getServerTimeLeft: () => {
    const startedAt = get().questionStartedAt;
    if (!startedAt) return 60;
    const elapsedSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, 60 - elapsedSeconds);
  },

  tickTimer: () => {
    const state = get();
    if (state.status !== 'playing') return;

    let newTimeLeft = state.timeLeft - 1;
    if (newTimeLeft <= 0) {
      set({ timeLeft: 0, status: 'complete' });
      analytics.track('battle_completed', { matchId: state.matchId });

      if (state.matchId) {
        void (async () => {
          try {
            await supabase.rpc('submit_match_result', {
              p_match_id: state.matchId!,
              p_score: state.user.score,
              p_opponent_id: state.opponent.id,
              p_is_winner: state.user.score >= state.opponent.score,
            });
          } catch {
            // silent fallback
          }
        })();
      }

      bulkInsert('activity_feed', [
        { user_id: state.user.id, action: 'match_completed', metadata: { match_id: state.matchId, score: state.user.score, xp_earned: state.earnedXP } },
        { user_id: state.opponent.id, action: 'match_completed', metadata: { match_id: state.matchId, score: state.opponent.score, xp_earned: Math.max(10, state.earnedXP - 15) } },
      ]).catch(() => {});
      return;
    }

    const currentOpp = state.opponent;
    let nextOpponentScore = currentOpp.score;
    let oppTimer = state.opponentSolveTimer - 1;

    if (oppTimer <= 0) {
      const isOppCorrect = Math.random() < 0.82;
      nextOpponentScore = isOppCorrect ? currentOpp.score + 1 : currentOpp.score;
      oppTimer = Math.floor(Math.random() * 2) + 2;
    }

    const userProgress = Math.min(100, Math.round((state.user.score / 25) * 100));
    const oppProgress = Math.min(100, Math.round((nextOpponentScore / 25) * 100));

    set((prev) => ({
      timeLeft: newTimeLeft,
      opponentSolveTimer: oppTimer,
      user: {
        ...prev.user,
        progress: userProgress,
      },
      opponent: {
        ...prev.opponent,
        score: nextOpponentScore,
        progress: oppProgress,
      },
    }));
  },

  submitAnswer: (selectedAnswer: number) => {
    const state = get();
    if (state.status !== 'playing') return false;

    const currentQ = state.questions[state.currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQ.answer;

    const addedXP = isCorrect ? 15 : 0;
    const newStreak = isCorrect ? state.user.streak + 1 : 0;
    const newScore = isCorrect ? state.user.score + 1 : state.user.score;
    const newXP = state.earnedXP + addedXP;

    let nextIndex = state.currentQuestionIndex + 1;
    let currentQuestionsList = [...state.questions];

    if (nextIndex >= currentQuestionsList.length - 2) {
      currentQuestionsList = [...currentQuestionsList, ...generateTrickyQuestions(20)];
    }

    if (state.matchId) {
      void (async () => {
        try {
          await supabase.from('answers').insert({
            match_id: state.matchId,
            user_id: state.user.id,
            question_order: state.currentQuestionIndex + 1,
            answer: selectedAnswer.toString(),
            correct: isCorrect,
          });
        } catch {
          // silent fire-and-forget
        }
      })();
    }

    set({
      user: {
        ...state.user,
        score: newScore,
        progress: Math.min(100, Math.round((newScore / 25) * 100)),
        streak: newStreak,
      },
      currentQuestionIndex: nextIndex,
      questions: currentQuestionsList,
      earnedXP: newXP,
    });

    return isCorrect;
  },

  resetBattle: () => {
    if (battleChannel) battleChannel.unsubscribe();

    set({
      matchId: null,
      status: 'idle',
      currentQuestionIndex: 0,
      totalQuestions: 60,
      timeLeft: 60,
      earnedXP: 0,
      opponentSolveTimer: 2,
      questions: generateTrickyQuestions(30),
      questionIds: [],
      user: { id: 'user_local', name: 'Afnan', rating: 1420, score: 0, progress: 0, streak: 0 },
      opponent: { id: 'opp_riya', name: 'Riya', rating: 1452, score: 0, progress: 0, streak: 0 },
    });
  },
}));