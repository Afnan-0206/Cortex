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
  progress: number; // 0 - 100
  streak: number;
}

// Circuit breaker instance protecting matchmaking against backend degradation
const matchmakingCircuitBreaker = new CircuitBreaker<{ matchId: string }>({
  name: 'MatchmakingService',
  failureThreshold: 3,
  timeoutMs: 3000,
  resetTimeoutMs: 5000,
  maxConcurrent: 5,
  fallback: async () => ({
    matchId: `match_offline_${Date.now()}`,
  }),
});

interface BattleStoreState {
  matchId: string | null;
  status: 'idle' | 'searching' | 'playing' | 'complete';
  user: BattlePlayer;
  opponent: BattlePlayer;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLeft: number; // 60-second duel timer
  earnedXP: number;
  opponentSolveTimer: number; // Seconds until opponent auto-solves next question
  questions: MathQuestion[];
  questionStartedAt: string | null;

  startMatchmaking: (userId: string, rating: number) => Promise<void>;
  subscribeToMatch: (matchId: string) => void;
  submitAnswer: (selectedAnswer: number) => boolean;
  tickTimer: () => void;
  calculateServerTimeLeft: () => number;
  resetBattle: () => void;
}

/**
 * Generates tricky vertical column arithmetic questions:
 * - 3-digit vertical addition (e.g. 526 + 422)
 * - Vertical mixed 3-item operations (e.g. 145 + 87 - 52)
 * - Vertical division & multiplication
 */
export const generateTrickyQuestions = (count: number = 30): MathQuestion[] => {
  const questions: MathQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const type = i % 5;
    let operand1: number | string = 0;
    let operand2: number | string = 0;
    let operator: string = '+';
    let answer = 0;

    if (type === 0) {
      // 1. 3-Digit Vertical Addition (e.g. 526 + 422 = 948)
      const a = Math.floor(Math.random() * 450) + 120;
      const b = Math.floor(Math.random() * 450) + 120;
      operand1 = a;
      operand2 = b;
      operator = '+';
      answer = a + b;
    } else if (type === 1) {
      // 2. Mixed 3-Item Vertical Expression (e.g. 145 + 87 - 52 = 180)
      const a = Math.floor(Math.random() * 180) + 100;
      const b = Math.floor(Math.random() * 90) + 40;
      const c = Math.floor(Math.random() * 60) + 20;
      operand1 = `${a}\n+ ${b}\n- ${c}`;
      operand2 = '';
      operator = '';
      answer = a + b - c;
    } else if (type === 2) {
      // 3. Tricky Division (e.g. 384 ÷ 12 = 32)
      const divisors = [8, 9, 12, 14, 15, 16, 18, 25];
      const div = divisors[Math.floor(Math.random() * divisors.length)];
      const quotient = Math.floor(Math.random() * 35) + 12;
      operand1 = div * quotient;
      operand2 = div;
      operator = '÷';
      answer = quotient;
    } else if (type === 3) {
      // 4. Mixed Multiplication + Subtraction (e.g. 14 × 6 - 18 = 66)
      const a = Math.floor(Math.random() * 15) + 8;
      const b = Math.floor(Math.random() * 8) + 4;
      const c = Math.floor(Math.random() * 25) + 10;
      const isSub = Math.random() > 0.5;
      operand1 = `${a} × ${b}\n${isSub ? '-' : '+'} ${c}`;
      operand2 = '';
      operator = '';
      answer = isSub ? a * b - c : a * b + c;
    } else {
      // 5. Vertical 2-Digit Multiplication (e.g. 35 × 11 = 385)
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
let answersChannel: any = null;

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
  timeLeft: 60, // 60-second total duel timer
  earnedXP: 0,
  opponentSolveTimer: 2,
  questions: generateTrickyQuestions(30),
  questionStartedAt: null,

  startMatchmaking: async (userId: string, rating: number) => {
    set({ status: 'searching' });
    analytics.track('battle_started');

    try {
      const res = await matchmakingCircuitBreaker.execute(async () => {
        const matchId = `match_${Date.now()}`;
        return { matchId };
      });

      notifyMatchFound();

      const freshQuestions = generateTrickyQuestions(30);
      const userProfile = useUserStore.getState().profile;
      const userName = userProfile.name || 'Athlete';
      const userRating = userProfile.brainPoints || rating || 1200;

      set({
        matchId: res.matchId,
        status: 'playing',
        currentQuestionIndex: 0,
        questionStartedAt: new Date().toISOString(),
        timeLeft: 60, // 60-second duel
        earnedXP: 0,
        opponentSolveTimer: 2,
        questions: freshQuestions,
        user: { id: userId || 'user_local', name: userName, rating: userRating, score: 0, progress: 0, streak: 0 },
        opponent: { id: 'opp_rival', name: 'Rival Athlete', rating: userRating + 25, score: 0, progress: 0, streak: 0 },
      });

      get().subscribeToMatch(res.matchId);
    } catch (e) {
      console.warn('Matchmaking error:', e);
    }
  },

  subscribeToMatch: (matchId: string) => {
    if (battleChannel) battleChannel.unsubscribe();
    if (answersChannel) answersChannel.unsubscribe();

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
      .subscribe();

    answersChannel = supabase.channel(`answers:${matchId}`)
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

  tickTimer: () => {
    const state = get();
    if (state.status !== 'playing') return;

    // 1. 60-Second Match Timer Countdown
    let newTimeLeft = state.timeLeft - 1;
    if (newTimeLeft <= 0) {
      // 60-second time expired -> Finish match and record results
      set({ timeLeft: 0, status: 'complete' });
      analytics.track('battle_completed', { matchId: state.matchId });
      if (state.matchId) {
        bulkInsert('activity_feed', [
          { user_id: state.user.id, action: 'match_completed', metadata: { match_id: state.matchId, score: state.user.score, xp_earned: state.earnedXP } },
          { user_id: state.opponent.id, action: 'match_completed', metadata: { match_id: state.matchId, score: state.opponent.score, xp_earned: Math.max(10, state.earnedXP - 15) } },
        ]).catch(() => {});
      }
      return;
    }

    // 2. Independent Opponent Auto-Solver Engine
    // Opponent solves questions every 2-3 seconds independently during 60s
    const currentOpp = state.opponent;
    let nextOpponentScore = currentOpp.score;
    let oppTimer = state.opponentSolveTimer - 1;

    if (oppTimer <= 0) {
      const isOppCorrect = Math.random() < 0.82;
      nextOpponentScore = isOppCorrect ? currentOpp.score + 1 : currentOpp.score;
      oppTimer = Math.floor(Math.random() * 2) + 2; // 2 to 3 seconds
    }

    const userProgress = Math.min(100, Math.round((state.user.score / 25) * 100));
    const oppProgress = Math.min(100, Math.round((nextOpponentScore / 25) * 100));

    set({
      timeLeft: newTimeLeft,
      opponentSolveTimer: oppTimer,
      user: {
        ...state.user,
        progress: userProgress,
      },
      opponent: {
        ...currentOpp,
        score: nextOpponentScore,
        progress: oppProgress,
      },
    });
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

    // If we're reaching the end of generated questions, append 20 more so the stream never runs out in 60s
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
    if (answersChannel) answersChannel.unsubscribe();

    set({
      matchId: null,
      status: 'idle',
      currentQuestionIndex: 0,
      totalQuestions: 60,
      timeLeft: 60,
      earnedXP: 0,
      opponentSolveTimer: 2,
      questions: generateTrickyQuestions(30),
      user: { id: 'user_local', name: 'Afnan', rating: 1420, score: 0, progress: 0, streak: 0 },
      opponent: { id: 'opp_riya', name: 'Riya', rating: 1452, score: 0, progress: 0, streak: 0 },
    });
  },
}));
