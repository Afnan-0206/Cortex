export interface FlashAnzanRound {
  roundIndex: number; // 0, 1, 2
  numberCount: number; // 3, 4, 5
  flashSpeedMs: number; // 800, 700, 600
  sequence: number[];
  correctSum: number;
}

export interface FlashAnzanPuzzle {
  rounds: FlashAnzanRound[];
}

/**
 * Generates a fresh, randomized 3-round Flash Anzan Mental Addition puzzle every time.
 */
export function generateDynamicFlashAnzanPuzzle(): FlashAnzanPuzzle {
  const generateRound = (index: number): FlashAnzanRound => {
    const count = index === 0 ? 3 : index === 1 ? 4 : 5;
    const speed = index === 0 ? 800 : index === 1 ? 700 : 600;

    const sequence: number[] = [];
    for (let i = 0; i < count; i++) {
      if (index === 0) {
        // Single digits 2 to 9
        sequence.push(Math.floor(Math.random() * 8) + 2);
      } else if (index === 1) {
        // Mix of single and double digits (4 to 15)
        sequence.push(Math.floor(Math.random() * 12) + 4);
      } else {
        // Double digits (10 to 25)
        sequence.push(Math.floor(Math.random() * 16) + 10);
      }
    }

    const correctSum = sequence.reduce((a, b) => a + b, 0);

    return {
      roundIndex: index,
      numberCount: count,
      flashSpeedMs: speed,
      sequence,
      correctSum,
    };
  };

  return {
    rounds: [generateRound(0), generateRound(1), generateRound(2)],
  };
}
