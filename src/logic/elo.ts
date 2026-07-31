/**
 * Standard Elo Rating System (K = 32)
 */
export function calculateEloChange(
  playerRating: number,
  opponentRating: number,
  score: 1 | 0 | 0.5,
  kFactor = 32
): { newRating: number; ratingDelta: number } {
  // Expected probability of player winning against opponent
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  const ratingDelta = Math.round(kFactor * (score - expectedScore));
  const newRating = playerRating + ratingDelta;

  return { newRating, ratingDelta };
}
