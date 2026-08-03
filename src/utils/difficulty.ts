/**
 * Adaptive Difficulty Utility
 * Derives dynamic puzzle difficulty (1=easier, 2=normal, 3=harder)
 * based on user's recent accuracy percentage (0.0 to 1.0).
 */

export function getPersonalizedDifficulty(accuracy: number): number {
  const acc = Math.max(0, Math.min(1, accuracy || 0.8));

  if (acc >= 0.9) {
    return 3; // Harder
  } else if (acc >= 0.7) {
    return 2; // Normal
  } else {
    return 1; // Easier
  }
}
