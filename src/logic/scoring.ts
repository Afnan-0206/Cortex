import { SessionState, UserProfile } from '../types';

export function calculateBP(session: SessionState): number {
  const mathBP = session.mathCorrect * 10;
  const logicBP = session.logicCorrect * 15;
  const memoryBP = session.memorySpan * 5;

  let total = mathBP + logicBP + memoryBP;

  // Completion bonus (+50 BP if all 3 challenges were played/attempted)
  const completedAllThree =
    session.mathTotal > 0 && session.logicTotal > 0 && session.memorySpan > 0;
  if (completedAllThree) {
    total += 50;
  }

  // Perfect run bonus (+25 BP if math 100% with at least 5 Qs, logic 100% with at least 3 Qs)
  const isPerfectMath = session.mathTotal >= 5 && session.mathCorrect === session.mathTotal;
  const isPerfectLogic = session.logicTotal >= 3 && session.logicCorrect === session.logicTotal;
  if (isPerfectMath && isPerfectLogic) {
    total += 25;
  }

  return total;
}

export function calculateCortexScore(profile: UserProfile): number {
  const mathNormalized = Math.min(100, Math.max(0, (profile.mathSpeed / 30) * 100));
  const logicNormalized = Math.min(100, Math.max(0, profile.logicScore));
  const memoryNormalized = Math.min(100, Math.max(0, (profile.memorySpan / 10) * 100));
  const consistencyNormalized = Math.min(100, Math.max(0, profile.consistency));

  const weightedSum =
    0.35 * mathNormalized +
    0.35 * logicNormalized +
    0.20 * memoryNormalized +
    0.10 * consistencyNormalized;

  const score = Math.round(weightedSum * 10);
  return Math.min(1000, Math.max(0, score));
}

function getISODateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function shouldIncreaseStreak(lastDate: string | null): boolean {
  if (!lastDate) return true;

  const todayStr = getISODateString();
  if (lastDate === todayStr) return false; // Already completed today

  const today = new Date(todayStr);
  const last = new Date(lastDate);
  const diffTime = today.getTime() - last.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  return diffDays === 1;
}

export function calculateConsistency(streak: number, totalSessions: number): number {
  return Math.min(100, streak * 5 + totalSessions * 2);
}
