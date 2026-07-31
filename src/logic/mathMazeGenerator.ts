export interface MathMazeDoor {
  id: string;
  label: string; // e.g. "+6" or "×2" or "−4"
  op: string;
  val: number;
  nextValue: number;
  isOptimal: boolean;
}

export interface MathMazeStep {
  stepIndex: number;
  currentValue: number;
  doors: MathMazeDoor[];
}

export interface MathMazePuzzle {
  startValue: number;
  targetValue: number;
  optimalStepsCount: number;
  steps: MathMazeStep[];
}

/**
 * Generates a fresh, randomized Math Maze puzzle every time with valid operational paths to the target.
 */
export function generateDynamicMathMazePuzzle(): MathMazePuzzle {
  // Collection of Start -> Target scenarios
  const scenarios = [
    { start: 7, target: 24, steps: [
      { current: 7, doors: [
        { id: 'd1', label: '×3', op: '×', val: 3, nextValue: 21, isOptimal: true },
        { id: 'd2', label: '+5', op: '+', val: 5, nextValue: 12, isOptimal: false },
        { id: 'd3', label: '−2', op: '-', val: 2, nextValue: 5, isOptimal: false },
      ]},
      { current: 21, doors: [
        { id: 'd4', label: '+3', op: '+', val: 3, nextValue: 24, isOptimal: true },
        { id: 'd5', label: '×2', op: '×', val: 2, nextValue: 42, isOptimal: false },
        { id: 'd6', label: '−5', op: '-', val: 5, nextValue: 16, isOptimal: false },
      ]},
    ]},
    { start: 8, target: 20, steps: [
      { current: 8, doors: [
        { id: 'd1', label: '×2', op: '×', val: 2, nextValue: 16, isOptimal: true },
        { id: 'd2', label: '+2', op: '+', val: 2, nextValue: 10, isOptimal: false },
        { id: 'd3', label: '+5', op: '+', val: 5, nextValue: 13, isOptimal: false },
      ]},
      { current: 16, doors: [
        { id: 'd4', label: '+4', op: '+', val: 4, nextValue: 20, isOptimal: true },
        { id: 'd5', label: '−3', op: '-', val: 3, nextValue: 13, isOptimal: false },
        { id: 'd6', label: '×2', op: '×', val: 2, nextValue: 32, isOptimal: false },
      ]},
    ]},
    { start: 14, target: 50, steps: [
      { current: 14, doors: [
        { id: 'd1', label: '+6', op: '+', val: 6, nextValue: 20, isOptimal: true },
        { id: 'd2', label: '×2', op: '×', val: 2, nextValue: 28, isOptimal: false },
        { id: 'd3', label: '−4', op: '-', val: 4, nextValue: 10, isOptimal: false },
      ]},
      { current: 20, doors: [
        { id: 'd4', label: '×2', op: '×', val: 2, nextValue: 40, isOptimal: true },
        { id: 'd5', label: '+5', op: '+', val: 5, nextValue: 25, isOptimal: false },
        { id: 'd6', label: '−3', op: '-', val: 3, nextValue: 17, isOptimal: false },
      ]},
      { current: 40, doors: [
        { id: 'd7', label: '+10', op: '+', val: 10, nextValue: 50, isOptimal: true },
        { id: 'd8', label: '÷2', op: '÷', val: 2, nextValue: 20, isOptimal: false },
        { id: 'd9', label: '×2', op: '×', val: 2, nextValue: 80, isOptimal: false },
      ]},
    ]},
    { start: 11, target: 44, steps: [
      { current: 11, doors: [
        { id: 'd1', label: '×2', op: '×', val: 2, nextValue: 22, isOptimal: true },
        { id: 'd2', label: '+10', op: '+', val: 10, nextValue: 21, isOptimal: false },
        { id: 'd3', label: '−3', op: '-', val: 3, nextValue: 8, isOptimal: false },
      ]},
      { current: 22, doors: [
        { id: 'd4', label: '×2', op: '×', val: 2, nextValue: 44, isOptimal: true },
        { id: 'd5', label: '+12', op: '+', val: 12, nextValue: 34, isOptimal: false },
        { id: 'd6', label: '−5', op: '-', val: 5, nextValue: 17, isOptimal: false },
      ]},
    ]},
  ];

  // Pick random scenario
  const picked = scenarios[Math.floor(Math.random() * scenarios.length)];

  // Shuffle doors inside each step for variety
  const steps: MathMazeStep[] = picked.steps.map((s, idx) => ({
    stepIndex: idx,
    currentValue: s.current,
    doors: [...s.doors].sort(() => Math.random() - 0.5),
  }));

  return {
    startValue: picked.start,
    targetValue: picked.target,
    optimalStepsCount: steps.length,
    steps,
  };
}
