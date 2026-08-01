export interface AnswerCheckResult {
  isCorrect: boolean;
  correctAnswer: number | string;
  userAnswer: number | string;
}

/**
 * Robustly checks if a user's answer matches the target correct answer.
 * Handles numeric values with floating-point tolerance as well as string comparisons.
 */
export function checkAnswer(
  correctAnswer: number | string,
  userAnswer: number | string,
  tolerance: number = 0.01
): AnswerCheckResult {
  if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
    return { isCorrect: false, correctAnswer, userAnswer: '' };
  }

  const normUser = String(userAnswer).trim().toLowerCase();
  const normCorrect = String(correctAnswer).trim().toLowerCase();

  // Numeric comparison
  const numUser = parseFloat(normUser);
  const numCorrect = parseFloat(normCorrect);

  if (!isNaN(numUser) && !isNaN(numCorrect)) {
    const isCorrect = Math.abs(numUser - numCorrect) <= tolerance;
    return { isCorrect, correctAnswer: numCorrect, userAnswer: numUser };
  }

  // String comparison
  return {
    isCorrect: normUser === normCorrect,
    correctAnswer: normCorrect,
    userAnswer: normUser,
  };
}
