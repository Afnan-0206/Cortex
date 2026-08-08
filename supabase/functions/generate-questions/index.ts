// Deno Supabase Edge Function: generate-questions (Server-authoritative question generation)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type GameMode = 'sprint' | 'sudoku' | 'crossmath' | 'kenken' | 'mathmaze' | 'mindsnap' | 'flashanzan' | 'ability' | 'fastfirst';

interface GenerateQuestionsRequest {
  gameMode: GameMode;
  count?: number;
  difficulty?: number;
  userRating?: number;
}

interface MathQuestion {
  operand1: number | string;
  operand2: number | string;
  operator: string;
  answer: number;
  difficulty: number;
  options: number[];
}

interface SudokuPuzzle {
  gridSize: number;
  solution: number[][];
  initialGrid: (number | null)[][];
  missingCells: { row: number; col: number; answer: number }[];
}

interface CrossMathPuzzle {
  gridSize: number;
  solution: number[][];
  initialGrid: (number | null)[][];
  missingCells: { row: number; col: number; answer: number }[];
  rowTargets: number[];
  colTargets: number[];
}

interface KenKenPuzzle {
  gridSize: number;
  solution: number[][];
  initialGrid: (number | null)[][];
  missingCells: { row: number; col: number; answer: number }[];
  cages: { label: string; cells: { row: number; col: number }[]; target: number; operator: string }[];
}

interface MathMazePuzzle {
  startValue: number;
  targetValue: number;
  steps: { doors: { id: string; label: string; nextValue: number; isOptimal: boolean }[] }[];
  optimalStepsCount: number;
}

interface MindSnapPuzzle {
  rounds: {
    modeName: string;
    observeDurationMs: number;
    recallDurationSec: number;
    targets: { id: string; symbol: string; color: string }[];
    distractors: { id: string; symbol: string; color: string }[];
    allOptions: { id: string; symbol: string; color: string; isTarget: boolean }[];
  }[];
}

interface FlashAnzanPuzzle {
  rounds: {
    sequence: number[];
    flashSpeedMs: number;
    correctSum: number;
  }[];
}

interface AbilityPuzzle {
  rounds: {
    categoryName: string;
    question: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    observeDurationMs?: number;
    shortcutTip?: string;
  }[];
}

interface FastFirstQuestion {
  expr: string;
  answer: number;
  options: number[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { gameMode, count = 30, difficulty = 2, userRating = 1200 } = await req.json() as GenerateQuestionsRequest;

    let questions: any;

    switch (gameMode) {
      case 'sprint':
      case 'fastfirst':
        questions = generateMathQuestions(count, difficulty);
        break;
      case 'sudoku':
        questions = generateSudokuPuzzles(count);
        break;
      case 'crossmath':
        questions = generateCrossMathPuzzles(count);
        break;
      case 'kenken':
        questions = generateKenKenPuzzles(count);
        break;
      case 'mathmaze':
        questions = generateMathMazePuzzles(count);
        break;
      case 'mindsnap':
        questions = generateMindSnapPuzzles(count);
        break;
      case 'flashanzan':
        questions = generateFlashAnzanPuzzles(count);
        break;
      case 'ability':
        questions = generateAbilityPuzzles(count);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid game mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Store questions in database for verification
    const { data: questionRecords, error } = await supabaseClient
      .from('questions')
      .insert(questions.map((q: any, i: number) => ({
        type: gameMode,
        prompt: JSON.stringify(q),
        options: JSON.stringify(q.options ?? []),
        answer: JSON.stringify(q.answer ?? q.solution ?? q.correctSum ?? q.targetValue),
        difficulty,
      })))
      .select('id');

    if (error) {
      console.warn('Failed to store questions:', error);
    }

    const responsePayload = JSON.stringify({
      questions: questions.slice(0, count),
      questionIds: questionRecords?.map((r: any) => r.id) ?? [],
    });

    return new Response(responsePayload, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ==================== MATH QUESTIONS (Sprint / Fast & First) ====================
function generateMathQuestions(count: number, difficulty: number): MathQuestion[] {
  const questions: MathQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const type = i % 5;
    let operand1: number | string = 0;
    let operand2: number | string = 0;
    let operator: string = '+';
    let answer = 0;

    if (type === 0) {
      // 3-Digit Vertical Addition
      const a = Math.floor(Math.random() * 450) + 120;
      const b = Math.floor(Math.random() * 450) + 120;
      operand1 = a;
      operand2 = b;
      operator = '+';
      answer = a + b;
    } else if (type === 1) {
      // Mixed 3-Item Vertical Expression
      const a = Math.floor(Math.random() * 180) + 100;
      const b = Math.floor(Math.random() * 90) + 40;
      const c = Math.floor(Math.random() * 60) + 20;
      operand1 = `${a}\n+ ${b}\n- ${c}`;
      operand2 = '';
      operator = '';
      answer = a + b - c;
    } else if (type === 2) {
      // Tricky Division
      const divisors = [8, 9, 12, 14, 15, 16, 18, 25];
      const div = divisors[Math.floor(Math.random() * divisors.length)];
      const quotient = Math.floor(Math.random() * 35) + 12;
      operand1 = div * quotient;
      operand2 = div;
      operator = '÷';
      answer = quotient;
    } else if (type === 3) {
      // Mixed Multiplication + Subtraction
      const a = Math.floor(Math.random() * 15) + 8;
      const b = Math.floor(Math.random() * 8) + 4;
      const c = Math.floor(Math.random() * 25) + 10;
      const isSub = Math.random() > 0.5;
      operand1 = `${a} × ${b}\n${isSub ? '-' : '+'} ${c}`;
      operand2 = '';
      operator = '';
      answer = isSub ? a * b - c : a * b + c;
    } else {
      // 2-Digit Multiplication
      const a = Math.floor(Math.random() * 35) + 15;
      const b = Math.floor(Math.random() * 12) + 6;
      operand1 = a;
      operand2 = b;
      operator = '×';
      answer = a * b;
    }

    questions.push({
      operand1,
      operand2,
      operator,
      answer,
      difficulty,
      options: [answer, answer + 10, answer - 10, answer + 2],
    });
  }

  return questions;
}

// ==================== SUDOKU PUZZLES ====================
function generateSudokuPuzzles(count: number): SudokuPuzzle[] {
  const puzzles: SudokuPuzzle[] = [];
  const baseTemplates = [
    [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]],
    [[2, 4, 1, 3], [1, 3, 2, 4], [4, 2, 3, 1], [3, 1, 4, 2]],
    [[4, 1, 2, 3], [2, 3, 4, 1], [3, 4, 1, 2], [1, 2, 3, 4]],
  ];

  for (let p = 0; p < count; p++) {
    const template = baseTemplates[Math.floor(Math.random() * baseTemplates.length)];
    const digits = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const mapDigit = (val: number) => digits[val - 1];
    const solution = template.map((row) => row.map((val) => mapDigit(val)));

    const initialGrid: (number | null)[][] = solution.map((row) => [...row]);
    const missingCells: { row: number; col: number; answer: number }[] = [];

    for (let r = 0; r < 4; r++) {
      const c = (r * 2 + Math.floor(Math.random() * 2)) % 4;
      initialGrid[r][c] = null;
      missingCells.push({ row: r, col: c, answer: solution[r][c] });
    }

    puzzles.push({
      gridSize: 4,
      solution,
      initialGrid,
      missingCells,
    });
  }

  return puzzles;
}

// ==================== CROSS MATH PUZZLES ====================
function generateCrossMathPuzzles(count: number): CrossMathPuzzle[] {
  const puzzles: CrossMathPuzzle[] = [];

  for (let p = 0; p < count; p++) {
    // Generate a valid 3x3 grid with row/col targets
    const grid: number[][] = [];
    const rowTargets: number[] = [];
    const colTargets: number[] = [0, 0, 0];

    for (let r = 0; r < 3; r++) {
      const row: number[] = [];
      let rowSum = 0;
      for (let c = 0; c < 3; c++) {
        const val = Math.floor(Math.random() * 9) + 1;
        row.push(val);
        rowSum += val;
        colTargets[c] += val;
      }
      grid.push(row);
      rowTargets.push(rowSum);
    }

    // Create initial grid with 4 missing cells
    const initialGrid: (number | null)[][] = grid.map((row) => [...row]);
    const missingCells: { row: number; col: number; answer: number }[] = [];

    const missingCount = 4;
    const positions = new Set<string>();
    while (missingCells.length < missingCount) {
      const r = Math.floor(Math.random() * 3);
      const c = Math.floor(Math.random() * 3);
      const key = `${r},${c}`;
      if (!positions.has(key)) {
        positions.add(key);
        initialGrid[r][c] = null;
        missingCells.push({ row: r, col: c, answer: grid[r][c] });
      }
    }

    puzzles.push({
      gridSize: 3,
      solution: grid,
      initialGrid,
      missingCells,
      rowTargets,
      colTargets,
    });
  }

  return puzzles;
}

// ==================== KENKEN PUZZLES ====================
function generateKenKenPuzzles(count: number): KenKenPuzzle[] {
  const puzzles: KenKenPuzzle[] = [];
  const baseTemplates = [
    [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]],
    [[2, 4, 1, 3], [1, 3, 2, 4], [4, 2, 3, 1], [3, 1, 4, 2]],
    [[4, 1, 2, 3], [2, 3, 4, 1], [3, 4, 1, 2], [1, 2, 3, 4]],
  ];

  for (let p = 0; p < count; p++) {
    const template = baseTemplates[Math.floor(Math.random() * baseTemplates.length)];
    const digits = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const mapDigit = (val: number) => digits[val - 1];
    const solution = template.map((row) => row.map((val) => mapDigit(val)));

    const initialGrid: (number | null)[][] = solution.map((row) => [...row]);
    const missingCells: { row: number; col: number; answer: number }[] = [];

    // Create 2-3 cages
    const cages: { label: string; cells: { row: number; col: number }[]; target: number; operator: string }[] = [];
    const operators = ['+', '-', '×', '÷'];

    for (let cageIdx = 0; cageIdx < 3; cageIdx++) {
      const r1 = Math.floor(Math.random() * 4);
      const c1 = Math.floor(Math.random() * 4);
      const r2 = Math.floor(Math.random() * 4);
      const c2 = Math.floor(Math.random() * 4);

      if (r1 === r2 && c1 === c2) continue;

      const v1 = solution[r1][c1];
      const v2 = solution[r2][c2];
      const op = operators[Math.floor(Math.random() * operators.length)];
      let target = 0;
      let label = '';

      switch (op) {
        case '+':
          target = v1 + v2;
          label = `${target}+`;
          break;
        case '-':
          target = Math.abs(v1 - v2);
          label = `${target}−`;
          break;
        case '×':
          target = v1 * v2;
          label = `${target}×`;
          break;
        case '÷':
          target = Math.max(v1, v2) / Math.min(v1, v2);
          label = `${target}÷`;
          break;
      }

      initialGrid[r1][c1] = null;
      initialGrid[r2][c2] = null;
      missingCells.push({ row: r1, col: c1, answer: v1 });
      missingCells.push({ row: r2, col: c2, answer: v2 });

      cages.push({
        label,
        cells: [{ row: r1, col: c1 }, { row: r2, col: c2 }],
        target,
        operator: op,
      });
    }

    puzzles.push({
      gridSize: 4,
      solution,
      initialGrid,
      missingCells,
      cages,
    });
  }

  return puzzles;
}

// ==================== MATH MAZE PUZZLES ====================
function generateMathMazePuzzles(count: number): MathMazePuzzle[] {
  const puzzles: MathMazePuzzle[] = [];

  for (let p = 0; p < count; p++) {
    const startValue = Math.floor(Math.random() * 20) + 10;
    let targetValue = startValue;
    const steps: { doors: { id: string; label: string; nextValue: number; isOptimal: boolean }[] }[] = [];
    let currentValue = startValue;
    const optimalPath: number[] = [];
    const stepCount = Math.floor(Math.random() * 3) + 3; // 3-5 steps

    for (let s = 0; s < stepCount; s++) {
      const operations = [
        { op: '+', val: Math.floor(Math.random() * 10) + 1 },
        { op: '-', val: Math.floor(Math.random() * 10) + 1 },
        { op: '×', val: Math.floor(Math.random() * 4) + 2 },
        { op: '÷', val: [2, 3, 4, 5][Math.floor(Math.random() * 4)] },
      ];

      const doors = operations.map((o, i) => {
        let nextVal = currentValue;
        if (o.op === '+') nextVal += o.val;
        else if (o.op === '-') nextVal -= o.val;
        else if (o.op === '×') nextVal *= o.val;
        else if (o.op === '÷') nextVal = Math.floor(nextVal / o.val);

        return {
          id: `door_${s}_${i}`,
          label: `${o.op}${o.val}`,
          nextValue: nextVal,
          isOptimal: false,
        };
      });

      // Pick one optimal door
      const optimalIdx = Math.floor(Math.random() * doors.length);
      doors[optimalIdx].isOptimal = true;
      currentValue = doors[optimalIdx].nextValue;
      optimalPath.push(currentValue);

      steps.push({ doors });
    }

    targetValue = currentValue;

    puzzles.push({
      startValue,
      targetValue,
      steps,
      optimalStepsCount: stepCount,
    });
  }

  return puzzles;
}

// ==================== MIND SNAP PUZZLES ====================
function generateMindSnapPuzzles(count: number): MindSnapPuzzle[] {
  const symbols = ['★', '▲', '■', '●', '◆', '♥', '♠', '♣', '♦', '☀', '☁', '☂', '☃', '☄', '★', '☆'];
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d8ea', '#ffd3b6', '#ffaaa5'];

  const puzzles: MindSnapPuzzle[] = [];

  for (let p = 0; p < count; p++) {
    const rounds = [];

    for (let r = 0; r < 3; r++) {
      const targetCount = r + 2; // 2, 3, 4 targets
      const distractorCount = 4 - targetCount;
      const selectedSymbols = symbols.sort(() => Math.random() - 0.5).slice(0, targetCount);
      const selectedDistractors = symbols.sort(() => Math.random() - 0.5).slice(targetCount, 4);

      const targets = selectedSymbols.map((s, i) => ({
        id: `target_${r}_${i}`,
        symbol: s,
        color: colors[i % colors.length],
      }));

      const distractors = selectedDistractors.map((s, i) => ({
        id: `distractor_${r}_${i}`,
        symbol: s,
        color: colors[(i + targetCount) % colors.length],
      }));

      const allOptions = [...targets, ...distractors].sort(() => Math.random() - 0.5).map((o, i) => ({
        ...o,
        isTarget: 'symbol' in o && targets.some(t => t.id === o.id),
      }));

      rounds.push({
        modeName: ['Symbol Recall', 'Color & Shape Recall', 'Sequence Recall'][r],
        observeDurationMs: [2500, 2000, 1500][r],
        recallDurationSec: [5, 6, 7][r],
        targets,
        allOptions: allOptions as any,
      });
    }

    puzzles.push({ rounds });
  }

  return puzzles;
}

// ==================== FLASH ANZAN PUZZLES ====================
function generateFlashAnzanPuzzles(count: number): FlashAnzanPuzzle[] {
  const puzzles: FlashAnzanPuzzle[] = [];

  for (let p = 0; p < count; p++) {
    const rounds = [];

    for (let r = 0; r < 3; r++) {
      const sequenceLength = [5, 6, 7][r];
      const flashSpeedMs = [800, 700, 600][r];
      const sequence: number[] = [];
      let sum = 0;

      for (let i = 0; i < sequenceLength; i++) {
        const val = Math.floor(Math.random() * 20) + 1;
        sequence.push(val);
        sum += val;
      }

      rounds.push({
        sequence,
        flashSpeedMs,
        correctSum: sum,
      });
    }

    puzzles.push({ rounds });
  }

  return puzzles;
}

// ==================== ABILITY PUZZLES ====================
function generateAbilityPuzzles(count: number): AbilityPuzzle[] {
  const puzzles: AbilityPuzzle[] = [];

  for (let p = 0; p < count; p++) {
    const rounds = [];

    // Round 1: Math Shortcut
    rounds.push({
      categoryName: 'MATH SHORTCUT',
      question: '48 × 25 = ?',
      options: [
        { id: 'a1', text: '1200', isCorrect: true },
        { id: 'a2', text: '1100', isCorrect: false },
        { id: 'a3', text: '1300', isCorrect: false },
        { id: 'a4', text: '1000', isCorrect: false },
      ],
      shortcutTip: '×25 = ×100 ÷ 4 → 4800 ÷ 4 = 1200',
    });

    // Round 2: Logic
    rounds.push({
      categoryName: 'LOGIC',
      question: 'If A > B and B > C, then A ? C',
      options: [
        { id: 'b1', text: '>', isCorrect: true },
        { id: 'b2', text: '<', isCorrect: false },
        { id: 'b3', text: '=', isCorrect: false },
        { id: 'b4', text: '?', isCorrect: false },
      ],
    });

    // Round 3: Memory
    rounds.push({
      categoryName: 'MEMORY',
      question: 'Recall the sequence: ★ ▲ ■',
      options: [
        { id: 'c1', text: '★ ▲ ■', isCorrect: true },
        { id: 'c2', text: '▲ ★ ■', isCorrect: false },
        { id: 'c3', text: '■ ▲ ★', isCorrect: false },
        { id: 'c4', text: '★ ■ ▲', isCorrect: false },
      ],
      observeDurationMs: 2000,
    });

    // Round 4: Estimation
    rounds.push({
      categoryName: 'ESTIMATION',
      question: '≈ 147 × 23',
      options: [
        { id: 'd1', text: '3381', isCorrect: true },
        { id: 'd2', text: '2800', isCorrect: false },
        { id: 'd3', text: '4000', isCorrect: false },
        { id: 'd4', text: '2500', isCorrect: false },
      ],
      shortcutTip: '150 × 23 = 3450, minus 3×23 = 3381',
    });

    // Round 5: Surprise
    rounds.push({
      categoryName: 'SURPRISE',
      question: 'Next in sequence: 2, 6, 12, 20, ?',
      options: [
        { id: 'e1', text: '30', isCorrect: true },
        { id: 'e2', text: '28', isCorrect: false },
        { id: 'e3', text: '32', isCorrect: false },
        { id: 'e4', text: '24', isCorrect: false },
      ],
    });

    puzzles.push({ rounds });
  }

  return puzzles;
}

// ==================== FAST FIRST QUESTIONS ====================
function generateFastFirstQuestions(count: number): FastFirstQuestion[] {
  const questionPool: FastFirstQuestion[] = [
    { expr: '27 + 18', answer: 45, options: [45, 46, 35, 55] },
    { expr: '63 − 29', answer: 34, options: [34, 44, 36, 24] },
    { expr: '9 × 8', answer: 72, options: [72, 81, 63, 79] },
    { expr: '144 ÷ 12', answer: 12, options: [12, 14, 16, 18] },
    { expr: '(12 × 3) − 8', answer: 28, options: [28, 32, 26, 30] },
    { expr: '56 + 37', answer: 93, options: [93, 83, 103, 91] },
    { expr: '81 − 48', answer: 33, options: [33, 43, 23, 35] },
    { expr: '7 × 12', answer: 84, options: [84, 74, 94, 78] },
    { expr: '100 ÷ 4', answer: 25, options: [25, 35, 15, 20] },
    { expr: '15 × 6 + 10', answer: 100, options: [100, 90, 110, 85] },
  ];

  return questionPool.sort(() => Math.random() - 0.5).slice(0, count);
}