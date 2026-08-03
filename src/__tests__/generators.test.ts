import { generateDynamicAbilityPuzzle } from '../logic/abilityGenerator';
import { generateDynamicCrossMathPuzzle } from '../logic/crossMathGenerator';
import { generateDynamicFlashAnzanPuzzle } from '../logic/flashAnzanGenerator';
import { generateDynamicKenKenPuzzle } from '../logic/kenkenGenerator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runGeneratorsUnitTests() {
  // 1. Ability Duels generator test
  const abilityPuzzle = generateDynamicAbilityPuzzle();
  assert(abilityPuzzle.rounds.length === 5, 'Ability puzzle should generate exactly 5 rounds');
  assert(abilityPuzzle.rounds[0].options.length === 4, 'Ability round should have 4 options');

  // 2. Cross Math generator test
  const crossMathPuzzle = generateDynamicCrossMathPuzzle();
  assert(crossMathPuzzle.rowTargets.length === 3, 'CrossMath should have 3 row targets');
  assert(crossMathPuzzle.colTargets.length === 3, 'CrossMath should have 3 column targets');

  // 3. Flash Anzan generator test
  const flashAnzanPuzzle = generateDynamicFlashAnzanPuzzle();
  assert(flashAnzanPuzzle.rounds.length === 3, 'Flash Anzan should have 3 rounds');
  const sum = flashAnzanPuzzle.rounds[0].sequence.reduce((acc: number, curr: number) => acc + curr, 0);
  assert(flashAnzanPuzzle.rounds[0].correctSum === sum, 'Flash Anzan target sum should equal sequence sum');

  // 4. KenKen generator test
  const kenkenPuzzle = generateDynamicKenKenPuzzle();
  assert(kenkenPuzzle.cages.length > 0, 'KenKen should generate cages');
  assert(kenkenPuzzle.missingCells.length > 0, 'KenKen should have missing cells');

  console.log('✅ Procedural Generators Unit Tests Passed!');
}
