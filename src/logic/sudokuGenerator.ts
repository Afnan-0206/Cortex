export interface SudokuPuzzle {
  gridSize: number; // 4
  solution: number[][];
  initialGrid: (number | null)[][];
  missingCells: { row: number; col: number; answer: number }[];
}

/**
 * Generates a fresh, randomized 4x4 Sudoku puzzle with 4 missing cells every time.
 */
export function generateDynamicSudokuPuzzle(): SudokuPuzzle {
  // Base 4x4 Sudoku solution template
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

  // Randomly select 4 missing cells (1 from each row or box)
  const missingCells: { row: number; col: number; answer: number }[] = [];
  const initialGrid: (number | null)[][] = solution.map((row) => [...row]);

  for (let r = 0; r < 4; r++) {
    const c = (r * 2 + Math.floor(Math.random() * 2)) % 4;
    initialGrid[r][c] = null;
    missingCells.push({ row: r, col: c, answer: solution[r][c] });
  }

  return {
    gridSize: 4,
    solution,
    initialGrid,
    missingCells,
  };
}
