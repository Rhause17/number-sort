// testUtils.ts - Console test utilities (development only)

import type { Tube, Piece } from './types';
import { canMovePiece, movePiece, countTotalPieces, checkWin, getTopPiece } from './gameLogic';
import { applyChainReaction } from './chainReaction';
import { isStuck, getAvailableMoves } from './stuckDetection';

// Helper: Create a piece
const piece = (value: number, id?: string): Piece => ({
  id: id || `p-${value}-${Math.random().toString(36).substr(2, 5)}`,
  value,
});

// Helper: Create a tube
const tube = (id: string, capacity: number, values: number[]): Tube => ({
  id,
  capacity,
  pieces: values.map((v) => piece(v)),
});

// Helper: Print tube state
const printTube = (t: Tube): string => {
  const pieces = t.pieces.map((p) => p.value).join(', ');
  return `${t.id} [${pieces}] (${t.pieces.length}/${t.capacity})`;
};

const printTubes = (tubes: Tube[]): void => {
  console.log('--- Tubes ---');
  tubes.forEach((t) => console.log(printTube(t)));
  console.log(`Total pieces: ${countTotalPieces(tubes)}`);
  console.log('-------------');
};

/**
 * Run all tests
 */
export const runAllTests = (): void => {
  console.log('========== GAME LOGIC TESTS ==========\n');

  // Test 1: canMovePiece - basic cases
  console.log('TEST 1: canMovePiece basic cases');
  const tubeA = tube('A', 5, [4, 2]);
  const tubeB = tube('B', 5, [8, 4]);
  const tubeC = tube('C', 5, []);
  const tubeD = tube('D', 2, [8, 8]); // Full

  console.log('A:', printTube(tubeA));
  console.log('B:', printTube(tubeB));
  console.log('C:', printTube(tubeC));
  console.log('D:', printTube(tubeD));

  console.log('A→B (2→4):', canMovePiece(tubeA, tubeB), '(expected: true)');
  console.log('B→A (4→2):', canMovePiece(tubeB, tubeA), '(expected: false)');
  console.log('A→C (2→empty):', canMovePiece(tubeA, tubeC), '(expected: true)');
  console.log('C→A (empty→):', canMovePiece(tubeC, tubeA), '(expected: false)');
  console.log('A→D (to full):', canMovePiece(tubeA, tubeD), '(expected: false)');
  console.log('');

  // Test 2: movePiece - no merge
  console.log('TEST 2: movePiece - no merge');
  let tubes = [tube('A', 5, [4, 2]), tube('B', 5, [8, 4]), tube('C', 5, [])];
  printTubes(tubes);

  console.log('Move A→B (2 onto 4):');
  let result = movePiece(tubes, 'A', 'B');
  tubes = result.tubes;
  console.log('Merged:', result.merged, '(expected: false)');
  printTubes(tubes);

  // Test 3: movePiece - with merge
  console.log('TEST 3: movePiece - with merge');
  tubes = [tube('A', 5, [4, 2]), tube('B', 5, [8, 2])];
  printTubes(tubes);

  console.log('Move A→B (2 merge 2):');
  result = movePiece(tubes, 'A', 'B');
  tubes = result.tubes;
  console.log('Merged:', result.merged, '(expected: true)');
  console.log('Merge result:', result.mergeResult);
  printTubes(tubes);

  // Test 4: chainReaction
  console.log('TEST 4: applyChainReaction');
  const chainTube = tube('X', 5, [16, 4, 4]); // Should chain: 4+4=8, then stop (8≠16)
  console.log('Before:', printTube(chainTube));
  const chainResult = applyChainReaction(chainTube);
  console.log('After:', printTube(chainResult.tube));
  console.log('Merges:', chainResult.merges);
  console.log('');

  // Test 5: Long chain reaction (2→4→8→16)
  console.log('TEST 5: Long chain reaction');
  const longChainTube = tube('Y', 5, [2, 2, 2, 2]); // 2+2=4, 4+2=NO, so: 2,2,2,2 → 4,2,2 → NO
  // Actually: [2,2,2,2] → top two are 2,2 → merge → [2,2,4] → top two are 2,4 → NO
  console.log('Before:', printTube(longChainTube));
  const longChainResult = applyChainReaction(longChainTube);
  console.log('After:', printTube(longChainResult.tube));
  console.log('Merges:', longChainResult.merges);
  console.log('');

  // Test 5b: Proper long chain
  console.log('TEST 5b: Proper long chain (8,4,2,2)');
  const properChain = tube('Z', 5, [8, 4, 2, 2]); // 2+2=4, 4+4=8, 8+8=16
  console.log('Before:', printTube(properChain));
  const properChainResult = applyChainReaction(properChain);
  console.log('After:', printTube(properChainResult.tube));
  console.log('Merges:', properChainResult.merges);
  console.log('');

  // Test 6: isStuck
  console.log('TEST 6: isStuck detection');
  const notStuckTubes = [tube('A', 3, [4, 2]), tube('B', 3, [8]), tube('C', 3, [])];
  console.log('Not stuck scenario:');
  printTubes(notStuckTubes);
  console.log('isStuck:', isStuck(notStuckTubes), '(expected: false)');
  console.log('Available moves:', getAvailableMoves(notStuckTubes));
  console.log('');

  // Stuck scenario: all tubes full, no valid moves
  const stuckTubes = [
    tube('A', 2, [2, 8]), // top: 8
    tube('B', 2, [4, 16]), // top: 16
  ];
  console.log('Stuck scenario (all full, no valid moves):');
  printTubes(stuckTubes);
  console.log('isStuck:', isStuck(stuckTubes), '(expected: true)');
  console.log('Available moves:', getAvailableMoves(stuckTubes));
  console.log('');

  // Test 7: checkWin
  console.log('TEST 7: checkWin');
  const winTubes = [tube('A', 5, [16]), tube('B', 5, [32]), tube('C', 5, [])];
  console.log('Win scenario (2 pieces, target: 3):');
  printTubes(winTubes);
  console.log('checkWin (target 3):', checkWin(winTubes, 3), '(expected: true)');
  console.log('checkWin (target 1):', checkWin(winTubes, 1), '(expected: false)');
  console.log('');

  console.log('========== ALL TESTS COMPLETE ==========');
};

// Export for console access
export const testHelpers = {
  piece,
  tube,
  printTube,
  printTubes,
  canMovePiece,
  movePiece,
  countTotalPieces,
  checkWin,
  getTopPiece,
  applyChainReaction,
  isStuck,
  getAvailableMoves,
  runAllTests,
};

// Make available on window for console testing
if (typeof window !== 'undefined') {
  (window as unknown as { gameTest: typeof testHelpers }).gameTest = testHelpers;
}
