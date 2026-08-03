import { calculateBP, shouldIncreaseStreak } from '../logic/scoring';
import { getCurrentRank } from '../logic/ranks';
import { calculateEloChange } from '../logic/elo';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runScoringUnitTests() {
  // 1. Brain Points calculation
  const session = {
    startedAt: Date.now() - 60000,
    mathCorrect: 10,
    mathTotal: 10,
    logicCorrect: 5,
    logicTotal: 5,
    memorySpan: 7,
    bpEarned: 0,
  };
  const bp = calculateBP(session);
  assert(bp > 0, 'calculateBP should return positive brain points');

  // 2. ELO Rating calculation
  const eloWin = calculateEloChange(1400, 1400, 1);
  assert(eloWin.ratingDelta > 0, 'Winning against equal rating should gain ELO');

  const eloLoss = calculateEloChange(1400, 1400, 0);
  assert(eloLoss.ratingDelta < 0, 'Losing against equal rating should lose ELO');

  // 3. Rank Tier mapping
  const rankDabbler = getCurrentRank(1100);
  assert(rankDabbler.name === 'Dabbler', 'Rating 1100 should map to Dabbler tier');

  const rankHobbyist = getCurrentRank(1600);
  assert(rankHobbyist.name === 'Hobbyist', 'Rating 1600 should map to Hobbyist tier');

  // 4. Streak Detection
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  assert(shouldIncreaseStreak(yesterday) === true, 'Yesterday date should increase streak');
  assert(shouldIncreaseStreak('2020-01-01') === false, 'Stale date should not increase streak');

  console.log('✅ Scoring & ELO Unit Tests Passed!');
}
