import { Rank } from '../types';

export const RANKS: Rank[] = [
  { name: 'Rookie', requiredBP: 0, icon: 'star-outline', tier: 1 },
  { name: 'Dabbler', requiredBP: 500, icon: 'psychology', tier: 2 },
  { name: 'Hobbyist', requiredBP: 1500, icon: 'lightbulb-outline', tier: 3 },
  { name: 'Enthusiast', requiredBP: 3000, icon: 'flash-on', tier: 4 },
  { name: 'Devotee', requiredBP: 5000, icon: 'auto-awesome', tier: 5 },
  { name: 'Fanatic', requiredBP: 8000, icon: 'local-fire-department', tier: 6 },
  { name: 'Expert', requiredBP: 12000, icon: 'emoji-events', tier: 7 },
  { name: 'Prodigy', requiredBP: 20000, icon: 'workspace-premium', tier: 8 },
  { name: 'Champion', requiredBP: 35000, icon: 'military-tech', tier: 9 },
  { name: 'Mastermind', requiredBP: 50000, icon: 'extension', tier: 10 },
  { name: 'Legend', requiredBP: 75000, icon: 'diamond', tier: 11 },
  { name: 'Grandmaster', requiredBP: 110000, icon: 'shield', tier: 12 },
  { name: 'Immortal', requiredBP: 150000, icon: 'whatshot', tier: 13 },
];

export function getCurrentRank(bp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (bp >= RANKS[i].requiredBP) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

export function getNextRank(bp: number): Rank | null {
  const currentRank = getCurrentRank(bp);
  const nextIndex = RANKS.findIndex((r) => r.tier === currentRank.tier) + 1;
  if (nextIndex < RANKS.length) {
    return RANKS[nextIndex];
  }
  return null;
}

export function getProgressToNext(bp: number): number {
  const currentRank = getCurrentRank(bp);
  const nextRank = getNextRank(bp);
  if (!nextRank) return 1;

  const currentBP = currentRank.requiredBP;
  const targetBP = nextRank.requiredBP;
  const progress = (bp - currentBP) / (targetBP - currentBP);
  return Math.min(1, Math.max(0, progress));
}
