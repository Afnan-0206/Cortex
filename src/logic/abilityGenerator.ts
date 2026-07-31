export interface AbilityOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AbilityRound {
  roundIndex: number; // 0..4
  categoryName: 'MATH SHORTCUT' | 'LOGIC PATTERN' | 'MEMORY' | 'ESTIMATION' | 'SURPRISE';
  question: string;
  shortcutTip?: string;
  options: AbilityOption[];
  observeDurationMs?: number; // For memory round
}

export interface AbilityPuzzle {
  rounds: AbilityRound[];
}

/**
 * Generates a fresh, randomized 5-round Ability Duels puzzle every time.
 */
export function generateDynamicAbilityPuzzle(): AbilityPuzzle {
  // Round 1: Math Shortcut
  const mathShortcutScenarios = [
    {
      q: '48 × 25 = ?',
      tip: 'Cortex Shortcut: 25 = 100 ÷ 4 → 4800 ÷ 4 = 1200',
      ans: '1200',
      opts: ['1200', '1250', '1000', '1400'],
    },
    {
      q: '36 × 25 = ?',
      tip: 'Cortex Shortcut: 36 × 100 ÷ 4 = 3600 ÷ 4 = 900',
      ans: '900',
      opts: ['900', '950', '850', '1000'],
    },
    {
      q: '64 × 50 = ?',
      tip: 'Cortex Shortcut: 50 = 100 ÷ 2 → 6400 ÷ 2 = 3200',
      ans: '3200',
      opts: ['3200', '3100', '3400', '3000'],
    },
    {
      q: '54 × 11 = ?',
      tip: 'Cortex Shortcut: Put 5+4=9 in the middle → 594',
      ans: '594',
      opts: ['594', '584', '604', '544'],
    },
  ];
  const r1Picked = mathShortcutScenarios[Math.floor(Math.random() * mathShortcutScenarios.length)];
  const r1: AbilityRound = {
    roundIndex: 0,
    categoryName: 'MATH SHORTCUT',
    question: r1Picked.q,
    shortcutTip: r1Picked.tip,
    options: r1Picked.opts.map((opt) => ({
      id: `r1_${opt}`,
      text: opt,
      isCorrect: opt === r1Picked.ans,
    })).sort(() => Math.random() - 0.5),
  };

  // Round 2: Logic Pattern
  const logicPatternScenarios = [
    {
      q: '1, 4, 2, 8, 3, 12, ?',
      ans: '4',
      opts: ['4', '16', '5', '14'],
    },
    {
      q: '2, 5, 4, 10, 6, 15, ?',
      ans: '8',
      opts: ['8', '20', '7', '18'],
    },
    {
      q: '▲, ■, ▲, ■, ?',
      ans: '▲',
      opts: ['▲', '■', '●', '◆'],
    },
    {
      q: '3, 6, 5, 10, 9, 18, ?',
      ans: '17',
      opts: ['17', '36', '19', '20'],
    },
  ];
  const r2Picked = logicPatternScenarios[Math.floor(Math.random() * logicPatternScenarios.length)];
  const r2: AbilityRound = {
    roundIndex: 1,
    categoryName: 'LOGIC PATTERN',
    question: r2Picked.q,
    options: r2Picked.opts.map((opt) => ({
      id: `r2_${opt}`,
      text: opt,
      isCorrect: opt === r2Picked.ans,
    })).sort(() => Math.random() - 0.5),
  };

  // Round 3: Memory Position Recall
  const memoryScenarios = [
    {
      q: 'Which symbol was in the bottom-left?',
      ans: '■',
      opts: ['★', '■', '▲', '●'],
    },
    {
      q: 'Which symbol was in the top-right?',
      ans: '▲',
      opts: ['▲', '★', '■', '●'],
    },
  ];
  const r3Picked = memoryScenarios[Math.floor(Math.random() * memoryScenarios.length)];
  const r3: AbilityRound = {
    roundIndex: 2,
    categoryName: 'MEMORY',
    question: r3Picked.q,
    observeDurationMs: 2000,
    options: r3Picked.opts.map((opt) => ({
      id: `r3_${opt}`,
      text: opt,
      isCorrect: opt === r3Picked.ans,
    })).sort(() => Math.random() - 0.5),
  };

  // Round 4: Estimation
  const estimationScenarios = [
    {
      q: '198 × 49 ≈ ?',
      tip: 'Cortex Estimate: 200 × 50 = 10,000',
      ans: '10,000',
      opts: ['10,000', '5,000', '20,000', '50,000'],
    },
    {
      q: '299 × 31 ≈ ?',
      tip: 'Cortex Estimate: 300 × 30 = 9,000',
      ans: '9,000',
      opts: ['9,000', '6,000', '12,000', '15,000'],
    },
    {
      q: '402 × 19 ≈ ?',
      tip: 'Cortex Estimate: 400 × 20 = 8,000',
      ans: '8,000',
      opts: ['8,000', '4,000', '16,000', '10,000'],
    },
  ];
  const r4Picked = estimationScenarios[Math.floor(Math.random() * estimationScenarios.length)];
  const r4: AbilityRound = {
    roundIndex: 3,
    categoryName: 'ESTIMATION',
    question: r4Picked.q,
    shortcutTip: r4Picked.tip,
    options: r4Picked.opts.map((opt) => ({
      id: `r4_${opt}`,
      text: opt,
      isCorrect: opt === r4Picked.ans,
    })).sort(() => Math.random() - 0.5),
  };

  // Round 5: Surprise / Real-Life Shortcut
  const surpriseScenarios = [
    {
      q: '15% off a ₹240 item. You save?',
      tip: '10% = ₹24, 5% = ₹12 → ₹36',
      ans: '₹36',
      opts: ['₹36', '₹24', '₹40', '₹30'],
    },
    {
      q: '20% tip on a ₹450 bill = ?',
      tip: '10% = ₹45 → 20% = ₹90',
      ans: '₹90',
      opts: ['₹90', '₹80', '₹100', '₹75'],
    },
    {
      q: '3 → 9, 4 → 16, 5 → ?',
      tip: 'Hidden Rule: Square the number',
      ans: '25',
      opts: ['25', '20', '30', '15'],
    },
  ];
  const r5Picked = surpriseScenarios[Math.floor(Math.random() * surpriseScenarios.length)];
  const r5: AbilityRound = {
    roundIndex: 4,
    categoryName: 'SURPRISE',
    question: r5Picked.q,
    shortcutTip: r5Picked.tip,
    options: r5Picked.opts.map((opt) => ({
      id: `r5_${opt}`,
      text: opt,
      isCorrect: opt === r5Picked.ans,
    })).sort(() => Math.random() - 0.5),
  };

  return {
    rounds: [r1, r2, r3, r4, r5],
  };
}
