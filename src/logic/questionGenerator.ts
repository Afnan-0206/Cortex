import { renderCache, CacheOptions } from '../../lib/renderCache';

export interface GeneratedMathQuestion {
  q: string;
  options: number[];
  answer: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
}

export interface GeneratedLogicQuestion {
  type?: 'Sequence' | 'Alternating' | 'Rotation' | 'Matrix';
  seq: string[];
  options: string[];
  answer: string;
}

export interface GeneratedMemoryQuestion {
  length: number;
  sequence: number[];
  planetColors: string[];
}

export interface GeneratedFocusQuestion {
  targetIndex: number;
  shapes: { icon: string; color: string; isTarget: boolean }[];
}

export interface GeneratedSudokuQuestion {
  gridSize: number; // 4 or 6
  grid: (number | null)[][];
  solution: number[][];
  missingCell: { row: number; col: number; answer: number };
  options: number[];
}

export interface GeneratedCrossMathQuestion {
  grid: (number | null)[][];
  rowTargets: number[];
  colTargets: number[];
  missingCell: { row: number; col: number; answer: number };
  options: number[];
}

export interface GeneratedKenKenQuestion {
  cageTarget: string; // e.g. "6+" or "12×"
  op: '+' | '-' | '×' | '÷';
  targetValue: number;
  options: string[]; // e.g. ["1 & 5", "2 & 4", "3 & 3", "2 & 5"]
  answer: string;
}

export interface GeneratedMathMazeQuestion {
  startValue: number;
  targetValue: number;
  steps: {
    options: { label: string; op: string; val: number; nextVal: number; isCorrect: boolean }[];
  }[];
}

export interface GeneratedMindSnapQuestion {
  flashedSymbols: string[];
  options: string[];
  correctSymbols: string[];
}

export interface GeneratedFlashAnzanQuestion {
  numbers: number[];
  totalSum: number;
  options: number[];
  flashSpeedMs: number;
}

// 1. NEURO SPRINT GENERATOR (Easy, Medium, Hard, Mixed Difficulty)
export function generateNeuroSprintSet(level: number = 1, count: number = 20, cacheOpts?: CacheOptions): GeneratedMathQuestion[] {
  const cacheKey = `neuro_sprint_level_${level}_count_${count}`;
  const cached = renderCache.get<GeneratedMathQuestion[]>(cacheKey, cacheOpts);
  if (cached) return cached;

  const questions: GeneratedMathQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const diffType = i % 4; // 0: Easy, 1: Medium, 2: Hard, 3: Mixed
    let expr = '';
    let ans = 0;
    let difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed' = 'Easy';

    if (diffType === 0) {
      // Easy: 7 + 5, 14 - 6
      difficulty = 'Easy';
      const isAdd = Math.random() > 0.5;
      if (isAdd) {
        const a = Math.floor(Math.random() * 9) + 2;
        const b = Math.floor(Math.random() * 9) + 2;
        expr = `${a} + ${b}`;
        ans = a + b;
      } else {
        const b = Math.floor(Math.random() * 8) + 2;
        const a = b + Math.floor(Math.random() * 9) + 1;
        expr = `${a} − ${b}`;
        ans = a - b;
      }
    } else if (diffType === 1) {
      // Medium: 27 + 18, 63 - 29
      difficulty = 'Medium';
      const isAdd = Math.random() > 0.5;
      if (isAdd) {
        const a = Math.floor(Math.random() * 35) + 15;
        const b = Math.floor(Math.random() * 35) + 15;
        expr = `${a} + ${b}`;
        ans = a + b;
      } else {
        const b = Math.floor(Math.random() * 30) + 15;
        const a = b + Math.floor(Math.random() * 35) + 10;
        expr = `${a} − ${b}`;
        ans = a - b;
      }
    } else if (diffType === 2) {
      // Hard: 48 × 3, 144 ÷ 12
      difficulty = 'Hard';
      const isMult = Math.random() > 0.5;
      if (isMult) {
        const a = Math.floor(Math.random() * 30) + 12;
        const b = Math.floor(Math.random() * 7) + 3;
        expr = `${a} × ${b}`;
        ans = a * b;
      } else {
        const b = Math.floor(Math.random() * 12) + 4;
        ans = Math.floor(Math.random() * 15) + 6;
        const a = b * ans;
        expr = `${a} ÷ ${b}`;
      }
    } else {
      // Mixed: (12 × 3) − 8
      difficulty = 'Mixed';
      const a = Math.floor(Math.random() * 12) + 4;
      const b = Math.floor(Math.random() * 5) + 2;
      const c = Math.floor(Math.random() * 15) + 3;
      expr = `(${a} × ${b}) − ${c}`;
      ans = a * b - c;
    }

    // Build 4 options
    const distractors = new Set<number>();
    distractors.add(ans + 1);
    distractors.add(ans - 1);
    distractors.add(ans + 10);
    distractors.add(ans - 10);
    distractors.add(ans + 2);
    distractors.add(ans - 2);

    const optionList = Array.from(distractors).filter((d) => d !== ans && d >= 0).slice(0, 3);
    const options = [...optionList, ans].sort(() => Math.random() - 0.5);

    questions.push({ q: expr, options, answer: ans, difficulty });
  }

  renderCache.set(cacheKey, questions, cacheOpts);
  return questions;
}

// 2. ABILITY DUELS (Pattern Forge / Logic - Sequence, Alternating, Rotation, Matrix)
export function generatePatternForgeSet(level: number = 1, count: number = 20): GeneratedLogicQuestion[] {
  const puzzles: GeneratedLogicQuestion[] = [];
  const shapePool = ['▲', '■', '●', '◆', '★'];
  const arrowPool = ['⬆', '↗', '➡', '↘', '⬇', '↙', '⬅', '↖'];

  for (let i = 0; i < count; i++) {
    const type = i % 4;

    if (type === 0) {
      // Sequence: 2, 4, 8, 16, ? -> 32
      const mult = (i % 3) + 2;
      const start = Math.floor(Math.random() * 3) + 2;
      const s1 = start;
      const s2 = s1 * mult;
      const s3 = s2 * mult;
      const s4 = s3 * mult;
      const ans = s4 * mult;

      puzzles.push({
        type: 'Sequence',
        seq: [`${s1}`, `${s2}`, `${s3}`, `${s4}`, '?'],
        answer: `${ans}`,
        options: [`${ans}`, `${ans - mult}`, `${ans + mult * 2}`, `${ans / 2}`].sort(() => Math.random() - 0.5),
      });
    } else if (type === 1) {
      // Alternating Pattern: 1, 4, 2, 8, 3, 12, ? -> 4
      const step = (i % 3) + 1;
      const seq = ['1', `${1 * 4}`, '2', `${2 * 4}`, '3', `${3 * 4}`, '?'];
      const ans = '4';
      puzzles.push({
        type: 'Alternating',
        seq,
        answer: ans,
        options: ['4', '16', '5', '8'].sort(() => Math.random() - 0.5),
      });
    } else if (type === 2) {
      // Shape Rotation: ⬆ ➡ ⬇ ? -> ⬅
      const seq = ['⬆', '➡', '⬇', '?'];
      const ans = '⬅';
      puzzles.push({
        type: 'Rotation',
        seq,
        answer: ans,
        options: ['⬅', '↖', '↗', '⬆'].sort(() => Math.random() - 0.5),
      });
    } else {
      // Matrix Reasoning: Row 1: ▲ ▲ ▲ | Row 2: ■ ■ ■ | Row 3: ● ● ? -> ●
      const s1 = shapePool[i % shapePool.length];
      const s2 = shapePool[(i + 1) % shapePool.length];
      const s3 = shapePool[(i + 2) % shapePool.length];
      const seq = [
        `R1: ${s1} ${s1} ${s1}`,
        `R2: ${s2} ${s2} ${s2}`,
        `R3: ${s3} ${s3} ?`,
      ];
      const ans = s3;
      puzzles.push({
        type: 'Matrix',
        seq,
        answer: ans,
        options: [s3, s1, s2, '◆'].sort(() => Math.random() - 0.5),
      });
    }
  }

  return puzzles;
}

// 3. SUDOKU DUELS GENERATOR (4x4 Mini Sudoku)
export function generateSudokuDuelSet(count: number = 10): GeneratedSudokuQuestion[] {
  const puzzles: GeneratedSudokuQuestion[] = [];

  for (let i = 0; i < count; i++) {
    // Standard 4x4 Sudoku Solution
    const baseSolution = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ];

    // Pick missing cell
    const targetRow = i % 4;
    const targetCol = (i * 2 + 1) % 4;
    const targetAnswer = baseSolution[targetRow][targetCol];

    const puzzleGrid: (number | null)[][] = baseSolution.map((row, r) =>
      row.map((val, c) => (r === targetRow && c === targetCol ? null : val))
    );

    puzzles.push({
      gridSize: 4,
      grid: puzzleGrid,
      solution: baseSolution,
      missingCell: { row: targetRow, col: targetCol, answer: targetAnswer },
      options: [1, 2, 3, 4].sort(() => Math.random() - 0.5),
    });
  }

  return puzzles;
}

// 4. CROSS MATH DUELS GENERATOR
export function generateCrossMathSet(count: number = 10): GeneratedCrossMathQuestion[] {
  const questions: GeneratedCrossMathQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const gridSolution = [
      [4, 5, 6],
      [3, 8, 2],
      [1, 7, 9],
    ];

    const targetRow = i % 3;
    const targetCol = (i + 1) % 3;
    const answer = gridSolution[targetRow][targetCol];

    const rowTargets = gridSolution.map((row) => row.reduce((a, b) => a + b, 0));
    const colTargets = [0, 1, 2].map((colIdx) =>
      gridSolution.reduce((sum, row) => sum + row[colIdx], 0)
    );

    const puzzleGrid: (number | null)[][] = gridSolution.map((row, r) =>
      row.map((val, c) => (r === targetRow && c === targetCol ? null : val))
    );

    const dist = [answer + 1, answer - 1, answer + 2].filter((v) => v > 0 && v <= 9);
    const options = [answer, ...dist].slice(0, 4).sort(() => Math.random() - 0.5);

    questions.push({
      grid: puzzleGrid,
      rowTargets,
      colTargets,
      missingCell: { row: targetRow, col: targetCol, answer },
      options,
    });
  }

  return questions;
}

// 5. KENKEN DUELS GENERATOR
export function generateKenKenSet(count: number = 10): GeneratedKenKenQuestion[] {
  const questions: GeneratedKenKenQuestion[] = [];
  const cages = [
    { target: '6+', op: '+' as const, value: 6, answer: '1 & 5', options: ['1 & 5', '2 & 4', '3 & 3', '2 & 5'] },
    { target: '12×', op: '×' as const, value: 12, answer: '3 & 4', options: ['3 & 4', '2 & 6', '1 & 12', '4 & 4'] },
    { target: '7-', op: '-' as const, value: 7, answer: '9 & 2', options: ['9 & 2', '8 & 1', '10 & 3', '7 & 1'] },
    { target: '5÷', op: '÷' as const, value: 5, answer: '15 & 3', options: ['15 & 3', '10 & 2', '20 & 4', '25 & 5'] },
  ];

  for (let i = 0; i < count; i++) {
    const picked = cages[i % cages.length];
    questions.push({
      cageTarget: picked.target,
      op: picked.op,
      targetValue: picked.value,
      answer: picked.answer,
      options: [...picked.options].sort(() => Math.random() - 0.5),
    });
  }

  return questions;
}

// 6. MATH MAZE GENERATOR
export function generateMathMazeSet(count: number = 5): GeneratedMathMazeQuestion[] {
  const mazes: GeneratedMathMazeQuestion[] = [];

  for (let i = 0; i < count; i++) {
    mazes.push({
      startValue: 18,
      targetValue: 20,
      steps: [
        {
          options: [
            { label: '÷3', op: '÷', val: 3, nextVal: 6, isCorrect: true },
            { label: '−5', op: '−', val: 5, nextVal: 13, isCorrect: false },
            { label: '×2', op: '×', val: 2, nextVal: 36, isCorrect: false },
          ],
        },
        {
          options: [
            { label: '+4', op: '+', val: 4, nextVal: 10, isCorrect: true },
            { label: '×3', op: '×', val: 3, nextVal: 18, isCorrect: false },
            { label: '−2', op: '−', val: 2, nextVal: 4, isCorrect: false },
          ],
        },
        {
          options: [
            { label: '×2', op: '×', val: 2, nextVal: 20, isCorrect: true },
            { label: '+5', op: '+', val: 5, nextVal: 15, isCorrect: false },
            { label: '−3', op: '−', val: 3, nextVal: 7, isCorrect: false },
          ],
        },
      ],
    });
  }

  return mazes;
}

// 7. MIND SNAP MEMORY GENERATOR
export function generateMindSnapSet(count: number = 10): GeneratedMindSnapQuestion[] {
  const rounds: GeneratedMindSnapQuestion[] = [];
  const symbolPool = ['★', '▲', '■', '●', '◆', '○', '⬟', '✦'];

  for (let i = 0; i < count; i++) {
    const numSymbols = Math.min(6, 4 + Math.floor(i / 3));
    const shuffled = [...symbolPool].sort(() => Math.random() - 0.5);
    const flashedSymbols = shuffled.slice(0, numSymbols);
    const options = [...symbolPool].sort(() => Math.random() - 0.5);

    rounds.push({
      flashedSymbols,
      options,
      correctSymbols: flashedSymbols,
    });
  }

  return rounds;
}

// 8. FLASH ANZAN MEMORY GENERATOR
export function generateFlashAnzanSet(count: number = 10): GeneratedFlashAnzanQuestion[] {
  const questions: GeneratedFlashAnzanQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const diff = i % 3; // 0: Easy, 1: Medium, 2: Hard
    let numbers: number[] = [];
    let speedMs = 1000;

    if (diff === 0) {
      // Easy: 3 -> 5 -> 2 = 10
      numbers = [3, 5, 2];
      speedMs = 1000;
    } else if (diff === 1) {
      // Medium: 12 -> 7 -> 9 -> 4 = 32
      numbers = [12, 7, 9, 4];
      speedMs = 800;
    } else {
      // Hard: 25 -> 18 -> 7 -> 16 -> 9 = 75
      numbers = [25, 18, 7, 16, 9];
      speedMs = 600;
    }

    const totalSum = numbers.reduce((a, b) => a + b, 0);
    const options = [
      totalSum,
      totalSum + 2,
      totalSum - 3,
      totalSum + 5,
    ].sort(() => Math.random() - 0.5);

    questions.push({
      numbers,
      totalSum,
      options,
      flashSpeedMs: speedMs,
    });
  }

  return questions;
}

// Legacy Orbit Recall & Focus Lock
export function generateOrbitRecallSet(level: number = 1, count: number = 20): GeneratedMemoryQuestion[] {
  const rounds: GeneratedMemoryQuestion[] = [];
  const colors = ['#38bdf8', '#22c55e', '#ef4444', '#facc15', '#a78bfa', '#f97316'];

  for (let i = 0; i < count; i++) {
    const seqLen = Math.min(7, 3 + Math.floor(i / 5) + Math.floor(level / 2));
    const sequence: number[] = [];
    for (let s = 0; s < seqLen; s++) {
      sequence.push(Math.floor(Math.random() * 4) + 1);
    }
    rounds.push({
      length: seqLen,
      sequence,
      planetColors: colors.slice(0, 4),
    });
  }

  return rounds;
}

export function generateFocusLockSet(level: number = 1, count: number = 20): GeneratedFocusQuestion[] {
  const rounds: GeneratedFocusQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const targetIdx = Math.floor(Math.random() * 3);
    const shapes = [
      { icon: 'hexagon-outline', color: '#ef4444', isTarget: false },
      { icon: 'hexagon-outline', color: '#a78bfa', isTarget: false },
      { icon: 'hexagon-outline', color: '#facc15', isTarget: false },
    ];
    shapes[targetIdx] = { icon: 'hexagon', color: '#22c55e', isTarget: true };
    rounds.push({ targetIndex: targetIdx, shapes });
  }
  return rounds;
}
