#!/usr/bin/env node
// test-solver.js — Compare BFS vs A* solver on multiple levels for correctness and speed.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { solve, verifySolution } from './solver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const levelsData = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src', 'data', 'levels.json'), 'utf8'));
const levels = levelsData.levels;

// Test levels: small, medium, larger
const testIds = [1, 3, 5, 7, 10, 12, 20, 31, 32, 34, 50];

console.log('=== A* vs BFS Optimality + Speed Comparison ===\n');
console.log('Level | BFS Moves | A* Moves | Match | BFS States | A* States | Speedup | BFS ms | A* ms');
console.log('------|-----------|----------|-------|------------|-----------|---------|--------|------');

let allMatch = true;

for (const id of testIds) {
  const level = levels.find(l => l.id === id);
  if (!level) { console.log(`Level ${id} not found`); continue; }

  const bfs = solve(level, { mode: 'bfs', timeoutMs: 120000, maxStates: 2_000_000 });
  const astar = solve(level, { mode: 'astar', timeoutMs: 120000, maxStates: 2_000_000 });

  const match = bfs.optimalMoves === astar.optimalMoves;
  if (!match) allMatch = false;

  const speedup = bfs.totalStatesExplored > 0 && astar.totalStatesExplored > 0
    ? (bfs.totalStatesExplored / astar.totalStatesExplored).toFixed(1) + 'x'
    : '-';

  console.log(
    `${String(id).padStart(5)} | ` +
    `${String(bfs.optimalMoves).padStart(9)} | ` +
    `${String(astar.optimalMoves).padStart(8)} | ` +
    `${match ? '  ok  ' : 'FAIL! '} | ` +
    `${String(bfs.totalStatesExplored.toLocaleString()).padStart(10)} | ` +
    `${String(astar.totalStatesExplored.toLocaleString()).padStart(9)} | ` +
    `${speedup.padStart(7)} | ` +
    `${String(bfs.timeMs).padStart(6)} | ` +
    `${String(astar.timeMs).padStart(5)}`
  );

  // Verify A* solution
  if (astar.solvable) {
    const v = verifySolution(level, astar.solutionPath);
    if (!v.valid) {
      console.log(`  !! A* VERIFICATION FAILED for Level ${id}: ${v.reason}`);
      allMatch = false;
    }
  }
}

console.log('\n' + (allMatch ? 'ALL TESTS PASSED' : '!! SOME TESTS FAILED !!'));
