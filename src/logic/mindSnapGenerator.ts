export interface MindSnapItem {
  id: string;
  symbol: string;
  color: string;
  isTarget: boolean;
}

export interface MindSnapRound {
  roundIndex: number; // 0, 1, 2
  modeName: string; // "Symbol Recall" | "Color Recall" | "Sequence Recall"
  observeDurationMs: number; // 1500, 2000, 2500
  recallDurationSec: number; // 5, 6, 8
  targets: MindSnapItem[];
  distractors: MindSnapItem[];
  allOptions: MindSnapItem[];
}

export interface MindSnapPuzzle {
  rounds: MindSnapRound[];
}

const ALL_SYMBOLS = ['★', '▲', '■', '●', '◆', '✦', '▲', '●'];
const ALL_COLORS = ['#38bdf8', '#ef4444', '#22c55e', '#facc15', '#a78bfa', '#f97316'];

/**
 * Generates a fresh, randomized 3-round Mind Snap Memory puzzle every time.
 */
export function generateDynamicMindSnapPuzzle(): MindSnapPuzzle {
  const generateRound = (index: number): MindSnapRound => {
    const observeMs = index === 0 ? 1800 : index === 1 ? 2200 : 2500;
    const recallSec = index === 0 ? 5 : index === 1 ? 6 : 8;
    const modeName = index === 0 ? 'Symbol Recall' : index === 1 ? 'Color & Shape Recall' : 'Sequence Recall';

    // Pick 4 target symbols
    const targetCount = index === 0 ? 4 : index === 1 ? 4 : 5;
    const shuffledSymbols = [...ALL_SYMBOLS].sort(() => Math.random() - 0.5);
    const shuffledColors = [...ALL_COLORS].sort(() => Math.random() - 0.5);

    const targets: MindSnapItem[] = [];
    for (let i = 0; i < targetCount; i++) {
      targets.push({
        id: `t_${index}_${i}`,
        symbol: shuffledSymbols[i],
        color: shuffledColors[i % shuffledColors.length],
        isTarget: true,
      });
    }

    // Pick 2 distractors
    const distractorSymbols = [...ALL_SYMBOLS].filter((s) => !targets.some((t) => t.symbol === s));
    const distractors: MindSnapItem[] = [
      {
        id: `d_${index}_0`,
        symbol: distractorSymbols[0] || '✦',
        color: '#9ca3af',
        isTarget: false,
      },
      {
        id: `d_${index}_1`,
        symbol: distractorSymbols[1] || '◆',
        color: '#6b7280',
        isTarget: false,
      },
    ];

    // Combine & shuffle options for recall phase
    const allOptions = [...targets, ...distractors].sort(() => Math.random() - 0.5);

    return {
      roundIndex: index,
      modeName,
      observeDurationMs: observeMs,
      recallDurationSec: recallSec,
      targets,
      distractors,
      allOptions,
    };
  };

  return {
    rounds: [generateRound(0), generateRound(1), generateRound(2)],
  };
}
