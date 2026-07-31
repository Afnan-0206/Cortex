import { MemorySequence } from '../types';

export function generateMemorySequence(span: number): MemorySequence {
  const length = Math.min(10, Math.max(3, span));
  const sequence: number[] = [];

  for (let i = 0; i < length; i++) {
    const digit = Math.floor(Math.random() * 10);
    sequence.push(digit);
  }

  const displayTime = length * 800; // 800ms per digit

  return {
    sequence,
    displayTime,
  };
}
