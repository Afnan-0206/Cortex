import { LogicPuzzle } from '../types';

function shuffleWithIndex<T>(items: T[], correctItem: T): { options: T[]; correctIndex: number } {
  const options = [...items];
  // Fisher-Yates shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const correctIndex = options.indexOf(correctItem);
  return { options, correctIndex };
}

export function generateLogicPuzzle(puzzleIndex?: number): LogicPuzzle {
  const templates = [
    // Type 1: Arithmetic (+2, +3, +5, +10)
    () => {
      const step = [2, 3, 4, 5, 10][Math.floor(Math.random() * 5)];
      const start = Math.floor(Math.random() * 10) + 1;
      const seq = [start, start + step, start + 2 * step, start + 3 * step];
      const answer = start + 4 * step;
      const optionsPool = [answer, answer + step, answer - step, answer + 2];
      const { options, correctIndex } = shuffleWithIndex(Array.from(new Set(optionsPool)), answer);
      return {
        sequence: [...seq, '?'],
        options,
        correctIndex,
      };
    },
    // Type 2: Letter gap (A, C, E, G -> I or B, D, F, H -> J)
    () => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const startIdx = Math.floor(Math.random() * 10);
      const step = Math.random() > 0.5 ? 2 : 3;
      const seq = [
        alphabet[startIdx],
        alphabet[startIdx + step],
        alphabet[startIdx + 2 * step],
        alphabet[startIdx + 3 * step],
      ];
      const answer = alphabet[startIdx + 4 * step];
      const distractor1 = alphabet[startIdx + 4 * step + 1] || 'Z';
      const distractor2 = alphabet[startIdx + 4 * step - 1] || 'A';
      const distractor3 = alphabet[startIdx + 4 * step + 2] || 'Y';

      const pool = Array.from(new Set([answer, distractor1, distractor2, distractor3]));
      const { options, correctIndex } = shuffleWithIndex(pool, answer);
      return {
        sequence: [...seq, '?'],
        options,
        correctIndex,
      };
    },
    // Type 3: Perfect Squares (1, 4, 9, 16 -> 25, or 4, 9, 16, 25 -> 36)
    () => {
      const start = Math.floor(Math.random() * 3) + 1;
      const seq = [start ** 2, (start + 1) ** 2, (start + 2) ** 2, (start + 3) ** 2];
      const answer = (start + 4) ** 2;
      const pool = [answer, (start + 4) ** 2 + 5, (start + 4) ** 2 - 4, (start + 5) ** 2];
      const { options, correctIndex } = shuffleWithIndex(Array.from(new Set(pool)), answer);
      return {
        sequence: [...seq, '?'],
        options,
        correctIndex,
      };
    },
    // Type 4: Geometric Doubling (3, 6, 12, 24 -> 48)
    () => {
      const start = Math.floor(Math.random() * 5) + 1;
      const seq = [start, start * 2, start * 4, start * 8];
      const answer = start * 16;
      const pool = [answer, answer + start * 4, answer - start * 2, answer * 2];
      const { options, correctIndex } = shuffleWithIndex(Array.from(new Set(pool)), answer);
      return {
        sequence: [...seq, '?'],
        options,
        correctIndex,
      };
    },
    // Type 5: Fibonacci (1, 1, 2, 3, 5 -> 8 or 2, 3, 5, 8 -> 13)
    () => {
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 3) + 1;
      const c = a + b;
      const d = b + c;
      const e = c + d;
      const answer = d + e;
      const seq = [a, b, c, d, e];
      const pool = [answer, answer + 2, answer - 3, answer + 5];
      const { options, correctIndex } = shuffleWithIndex(Array.from(new Set(pool)), answer);
      return {
        sequence: [...seq, '?'],
        options,
        correctIndex,
      };
    },
  ];

  const index =
    typeof puzzleIndex === 'number'
      ? puzzleIndex % templates.length
      : Math.floor(Math.random() * templates.length);

  return templates[index]();
}
