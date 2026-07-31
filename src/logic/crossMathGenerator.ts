export interface CrossMathPuzzle {
  gridSize: number; // 3
  solution: number[][];
  initialGrid: (number | null)[][];
  rowTargets: number[];
  colTargets: number[];
  missingCells: { row: number; col: number; answer: number }[];
}

/**
 * Generates a fresh, randomized 3x3 Cross Math puzzle with row/col targets every time.
 */
export function generateDynamicCrossMathPuzzle(): CrossMathPuzzle {
  const size = 3;
  // Generate 3x3 solution grid with distinct single digits (1 to 9)
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

  const solution: number[][] = [
    [numbers[0], numbers[1], numbers[2]],
    [numbers[3], numbers[4], numbers[5]],
    [numbers[6], numbers[7], numbers[8]],
  ];

  // Calculate Row Sum Targets
  const rowTargets = solution.map((row) => row.reduce((a, b) => a + b, 0));

  // Calculate Column Sum Targets
  const colTargets = [0, 1, 2].map((colIdx) =>
    solution.reduce((sum, row) => sum + row[colIdx], 0)
  );

  // Pick 4 missing cells
  const missingIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5).slice(0, 4);
  const missingCells: { row: number; col: number; answer: number }[] = [];
  const initialGrid: (number | null)[][] = solution.map((row) => [...row]);

  missingIndices.forEach((idx) => {
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    initialGrid[r][c] = null;
    missingCells.push({ row: r, col: c, answer: solution[r][c] });
  });

  return {
    gridSize: 3,
    solution,
    initialGrid,
    rowTargets,
    colTargets,
    missingCells,
  };
}
