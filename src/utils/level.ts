/**
 * Utility for deriving level progression deterministically from total XP.
 * Formula: level = floor(sqrt(totalXp / 100)) + 1
 */

export function getLevel(totalXp: number): number {
  const xp = Math.max(0, totalXp || 0);
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Returns total XP required to reach a specific level.
 * Level 1 requires 0 XP. Level 2 requires 100 XP. Level 3 requires 400 XP, etc.
 */
export function getXpRequiredForLevel(level: number): number {
  const l = Math.max(1, level);
  return Math.pow(l - 1, 2) * 100;
}

/**
 * Returns XP required for the NEXT level relative to current XP.
 */
export function getXpForNextLevel(totalXp: number): number {
  const currentLevel = getLevel(totalXp);
  const nextLevelXp = getXpRequiredForLevel(currentLevel + 1);
  return nextLevelXp;
}

/**
 * Returns a value between 0 and 1 representing progress toward the next level.
 */
export function getLevelProgress(totalXp: number): number {
  const xp = Math.max(0, totalXp || 0);
  const currentLevel = getLevel(xp);
  const currentLevelBaseXp = getXpRequiredForLevel(currentLevel);
  const nextLevelXp = getXpRequiredForLevel(currentLevel + 1);

  const range = nextLevelXp - currentLevelBaseXp;
  if (range <= 0) return 1;

  const currentLevelProgressXp = xp - currentLevelBaseXp;
  return Math.min(1, Math.max(0, currentLevelProgressXp / range));
}

/**
 * Returns remaining XP needed to hit the next level.
 */
export function getXpRemainingForNextLevel(totalXp: number): number {
  const xp = Math.max(0, totalXp || 0);
  const nextLevelXp = getXpForNextLevel(xp);
  return Math.max(0, nextLevelXp - xp);
}
