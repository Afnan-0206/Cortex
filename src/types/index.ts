import { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export type ChallengeType = 'math' | 'logic' | 'memory';

export interface UserProfile {
  name?: string;
  brainPoints: number;
  streak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // ISO date string (YYYY-MM-DD)
  totalSessionsCompleted: number;
  mathSpeed: number;        // best correct answers per minute
  mathAccuracy: number;     // 0-1
  logicScore: number;       // 0-100
  logicAccuracy: number;    // 0-1
  memorySpan: number;       // longest sequence length
  consistency: number;      // 0-100
  cortexScore: number;      // 0-1000
  perfectRuns: number;      // lifetime perfect sessions
  dailyProgress: number;    // 0-6 completed daily challenges
  dailyRewardClaimed: boolean; // whether daily reward has been claimed
  questPoints: number;      // 0-30 monthly expedition quest points
  completedQuests: string[]; // IDs of completed quests today
  questProgress: Record<string, number>; // per-quest completed questions count (0-20)
}

export interface SessionState {
  startedAt: number;
  mathCorrect: number;
  mathTotal: number;
  logicCorrect: number;
  logicTotal: number;
  memorySpan: number;
  bpEarned: number;
}

export interface Rank {
  name: string;
  requiredBP: number;
  icon: MaterialIconName;
  tier: number;
}

export interface MathQuestion {
  operand1: number | string;
  operand2?: number | string;
  operator: '+' | '-' | '×' | '÷' | string;
  answer: number;
  difficulty: number;
  options: number[];
}

export interface LogicPuzzle {
  sequence: (number | string)[];
  options: (number | string)[];
  correctIndex: number;
}

export interface MemorySequence {
  sequence: number[]; // digits 0-9
  displayTime: number; // ms = length * 800
}
