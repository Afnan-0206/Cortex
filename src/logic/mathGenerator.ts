import { MathQuestion } from '../types';

export function calculateMathDifficulty(brainPoints: number): number {
  return Math.min(10, Math.floor(brainPoints / 100) + 1);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateMathQuestion(difficulty: number): MathQuestion {
  const diff = Math.min(10, Math.max(1, difficulty));
  let operand1 = 0;
  let operand2 = 0;
  let operator: '+' | '-' | '×' = '+';
  let answer = 0;

  if (diff <= 3) {
    // Single-digit addition/subtraction
    operator = Math.random() > 0.5 ? '+' : '-';
    if (operator === '+') {
      operand1 = getRandomInt(2, 9);
      operand2 = getRandomInt(2, 9);
      answer = operand1 + operand2;
    } else {
      operand1 = getRandomInt(5, 18);
      operand2 = getRandomInt(1, operand1);
      answer = operand1 - operand2;
    }
  } else if (diff <= 6) {
    // Two-digit addition/subtraction
    operator = Math.random() > 0.5 ? '+' : '-';
    if (operator === '+') {
      operand1 = getRandomInt(12, 49);
      operand2 = getRandomInt(11, 49);
      answer = operand1 + operand2;
    } else {
      operand1 = getRandomInt(30, 99);
      operand2 = getRandomInt(12, operand1 - 1);
      answer = operand1 - operand2;
    }
  } else if (diff <= 9) {
    // Multiplication
    operator = '×';
    operand1 = getRandomInt(4, 12);
    operand2 = getRandomInt(4, 12);
    answer = operand1 * operand2;
  } else {
    // Mixed arithmetic
    const type = getRandomInt(1, 3);
    if (type === 1) {
      // e.g., 12 * 4 - 7
      operand1 = getRandomInt(6, 15);
      operand2 = getRandomInt(3, 8);
      operator = '×';
      const minus = getRandomInt(2, 12);
      answer = operand1 * operand2 - minus;
    } else if (type === 2) {
      // Two-digit multiplication
      operator = '×';
      operand1 = getRandomInt(12, 19);
      operand2 = getRandomInt(6, 12);
      answer = operand1 * operand2;
    } else {
      // Higher two-digit addition
      operator = '+';
      operand1 = getRandomInt(45, 95);
      operand2 = getRandomInt(35, 88);
      answer = operand1 + operand2;
    }
  }

  // Generate 3 plausible distractors
  const optionsSet = new Set<number>([answer]);
  const offsets = [-10, 10, -1, 1, -2, 2, -5, 5, -3, 3, -4, 4];
  let offsetIndex = 0;

  while (optionsSet.size < 4 && offsetIndex < offsets.length) {
    const candidate = answer + offsets[offsetIndex];
    if (candidate >= 0 && candidate !== answer) {
      optionsSet.add(candidate);
    }
    offsetIndex++;
  }

  // Fallback distractor generation
  while (optionsSet.size < 4) {
    const rand = answer + getRandomInt(-15, 15);
    if (rand >= 0) {
      optionsSet.add(rand);
    }
  }

  const options = shuffleArray(Array.from(optionsSet));

  return {
    operand1,
    operand2,
    operator,
    answer,
    difficulty: diff,
    options,
  };
}
