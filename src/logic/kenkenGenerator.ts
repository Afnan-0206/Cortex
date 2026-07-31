export interface KenKenCage {
  id: string;
  label: string; // e.g. "3+" or "12×" or "3−" or "2÷"
  target: number;
  op: '+' | '-' | '×' | '÷';
  cells: { row: number; col: number }[];
}

export interface KenKenPuzzle {
  gridSize: number; // 4
  solution: number[][];
  cages: KenKenCage[];
  initialGrid: (number | null)[][];
  missingCells: { row: number; col: number; answer: number }[];
}

/**
 * Generates a fresh, randomized 4x4 KenKen puzzle with cages every time.
 */
export function generateDynamicKenKenPuzzle(): KenKenPuzzle {
  // Base 4x4 Sudoku solutions for valid row/col uniqueness
  const baseTemplates = [
    [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ],
    [
      [2, 4, 1, 3],
      [1, 3, 2, 4],
      [4, 2, 3, 1],
      [3, 1, 4, 2],
    ],
    [
      [4, 1, 2, 3],
      [2, 3, 4, 1],
      [3, 4, 1, 2],
      [1, 2, 3, 4],
    ],
  ];

  // Pick random base template
  const template = baseTemplates[Math.floor(Math.random() * baseTemplates.length)];

  // Random digit permutation mapping (e.g. 1->3, 2->1, 3->4, 4->2)
  const digits = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
  const mapDigit = (val: number) => digits[val - 1];

  const solution: number[][] = template.map((row) => row.map((val) => mapDigit(val)));

  // Define Cages based on current solution
  // Cage 1: Top-Left Pair (Row 0, Col 0 & Col 1) -> Addition (+)
  const v1 = solution[0][0];
  const v2 = solution[0][1];
  const cage1: KenKenCage = {
    id: 'c1',
    label: `${v1 + v2}+`,
    target: v1 + v2,
    op: '+',
    cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  };

  // Cage 2: Top-Right Pair (Row 0, Col 2 & Col 3) -> Division (÷) or Subtraction (-)
  const v3 = solution[0][2];
  const v4 = solution[0][3];
  const isDiv = Math.max(v3, v4) % Math.min(v3, v4) === 0;
  const cage2: KenKenCage = {
    id: 'c2',
    label: isDiv ? `${Math.max(v3, v4) / Math.min(v3, v4)}÷` : `${Math.abs(v3 - v4)}−`,
    target: isDiv ? Math.max(v3, v4) / Math.min(v3, v4) : Math.abs(v3 - v4),
    op: isDiv ? '÷' : '-',
    cells: [{ row: 0, col: 2 }, { row: 0, col: 3 }],
  };

  // Cage 3: Row 1 Pair (Row 1, Col 0 & Col 1) -> Multiplication (×)
  const v5 = solution[1][0];
  const v6 = solution[1][1];
  const cage3: KenKenCage = {
    id: 'c3',
    label: `${v5 * v6}×`,
    target: v5 * v6,
    op: '×',
    cells: [{ row: 1, col: 0 }, { row: 1, col: 1 }],
  };

  // Cage 4: Row 1-2 Vertical Pair (Row 1, Col 2 & Row 2, Col 2) -> Subtraction (-)
  const v7 = solution[1][2];
  const v8 = solution[2][2];
  const cage4: KenKenCage = {
    id: 'c4',
    label: `${Math.abs(v7 - v8)}−`,
    target: Math.abs(v7 - v8),
    op: '-',
    cells: [{ row: 1, col: 2 }, { row: 2, col: 2 }],
  };

  // Cage 5: Bottom Left Pair (Row 2, Col 0 & Row 3, Col 0) -> Addition (+)
  const v9 = solution[2][0];
  const v10 = solution[3][0];
  const cage5: KenKenCage = {
    id: 'c5',
    label: `${v9 + v10}+`,
    target: v9 + v10,
    op: '+',
    cells: [{ row: 2, col: 0 }, { row: 3, col: 0 }],
  };

  // Cage 6: Bottom Right Block (Row 3, Col 2 & Col 3) -> Addition (+)
  const v11 = solution[3][2];
  const v12 = solution[3][3];
  const cage6: KenKenCage = {
    id: 'c6',
    label: `${v11 + v12}+`,
    target: v11 + v12,
    op: '+',
    cells: [{ row: 3, col: 2 }, { row: 3, col: 3 }],
  };

  const cages = [cage1, cage2, cage3, cage4, cage5, cage6];

  // Pick 4 missing cells
  const missingIndices = [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 14, 15].sort(() => Math.random() - 0.5).slice(0, 4);
  const missingCells: { row: number; col: number; answer: number }[] = [];
  const initialGrid: (number | null)[][] = solution.map((row) => [...row]);

  missingIndices.forEach((idx) => {
    const r = Math.floor(idx / 4);
    const c = idx % 4;
    initialGrid[r][c] = null;
    missingCells.push({ row: r, col: c, answer: solution[r][c] });
  });

  return {
    gridSize: 4,
    solution,
    cages,
    initialGrid,
    missingCells,
  };
}
