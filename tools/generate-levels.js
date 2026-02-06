#!/usr/bin/env node
// generate-levels.js — Generates new levels (51-90) using random layout + solver verification.
// Imports existing solver.js and analyzer.js — does NOT modify any game code.
//
// Usage:
//   node tools/generate-levels.js                    # all 40 levels (51-90)
//   node tools/generate-levels.js --group 1          # group 1 only (51-60)
//   node tools/generate-levels.js --start 51 --end 60

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { solve, verifySolution, applyMove, countPieces } from './solver.js';
import {
  computeStructuralMetrics,
  computeBlockingMetrics,
  computeSolutionMetrics,
  computeBranchingMetrics,
  computeCompositeScores,
  detectIssues,
} from './analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// --- CLI args ---
const args = process.argv.slice(2);
let startId = 51, endId = 90;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--group' && args[i + 1]) {
    const g = parseInt(args[i + 1], 10);
    if (g === 1) { startId = 51; endId = 60; }
    else if (g === 2) { startId = 61; endId = 70; }
    else if (g === 3) { startId = 71; endId = 80; }
    else if (g === 4) { startId = 81; endId = 90; }
    i++;
  }
  if (args[i] === '--start' && args[i + 1]) { startId = parseInt(args[i + 1], 10); i++; }
  if (args[i] === '--end' && args[i + 1]) { endId = parseInt(args[i + 1], 10); i++; }
}

// --- Group definitions ---
const GROUPS = [
  { // Group 1: MEDIUM (51-60)
    startId: 51, endId: 60, label: 'Medium',
    tubeCount: [5, 6], emptyTubes: [0, 1], capacityRange: [4, 5],
    mustVaryCapacity: true, minCapVariants: 2,
    values: [2, 4, 8, 16], fillRange: [0.65, 0.75],
    targetPieceCount: [1, 2],
    moveRange: [10, 15], scoreRange: [36, 55],
    solverTimeout: 30000, solverMaxStates: 500_000,
  },
  { // Group 2: HARD (61-70)
    startId: 61, endId: 70, label: 'Hard',
    tubeCount: [5, 6], emptyTubes: [0, 1], capacityRange: [3, 5],
    mustVaryCapacity: true, minCapVariants: 2,
    values: [2, 4, 8, 16, 32], fillRange: [0.70, 0.82],
    targetPieceCount: [1, 2],
    moveRange: [12, 18], scoreRange: [50, 75],
    solverTimeout: 45000, solverMaxStates: 1_000_000,
  },
  { // Group 3: HARD-EXPERT (71-80)
    startId: 71, endId: 80, label: 'Hard-Expert',
    tubeCount: [5, 7], emptyTubes: [0, 0], capacityRange: [3, 5],
    mustVaryCapacity: true, minCapVariants: 2,
    values: [2, 4, 8, 16, 32], fillRange: [0.75, 0.88],
    targetPieceCount: [1, 3],
    moveRange: [14, 22], scoreRange: [55, 85],
    solverTimeout: 45000, solverMaxStates: 2_000_000,
  },
  { // Group 4: EXPERT (81-90) — tightness-based difficulty, not tube count
    startId: 81, endId: 90, label: 'Expert',
    tubeCount: [6, 7], emptyTubes: [0, 0], capacityRange: [3, 6],
    mustVaryCapacity: true, minCapVariants: 2,
    values: [2, 4, 8, 16, 32], fillRange: [0.80, 0.90],
    targetPieceCount: [2, 4],
    moveRange: [18, 28], scoreRange: [60, 100],
    solverTimeout: 45000, solverMaxStates: 1_500_000,
  },
];

// --- Lightweight A* solution verification ---
// A*'s permutation-invariant hash can cause from/to index mismatches during
// path reconstruction. Instead of strict replay, we re-solve the moves by
// matching the moved value and finding valid from/to in the current state.
function verifyAStarSolution(level, solutionPath) {
  let tubes = level.tubes.map(t =>
    (t.initialPieces || []).filter(p => p !== null && p !== undefined)
  );
  const capacities = level.tubes.map(t => t.capacity);

  for (let i = 0; i < solutionPath.length; i++) {
    const move = solutionPath[i];

    // Try the recorded from/to first
    const result = applyMove(tubes, capacities, move.from, move.to);
    if (result && result.movedValue === move.movedValue) {
      tubes = result.tubes;
      continue;
    }

    // If that fails, search for any valid move that moves the same value
    let found = false;
    for (let f = 0; f < tubes.length && !found; f++) {
      if (tubes[f].length === 0) continue;
      if (tubes[f][tubes[f].length - 1] !== move.movedValue) continue;
      for (let t = 0; t < tubes.length && !found; t++) {
        if (f === t) continue;
        const alt = applyMove(tubes, capacities, f, t);
        if (alt && alt.movedValue === move.movedValue && alt.chainLength === move.chainLength) {
          tubes = alt.tubes;
          found = true;
        }
      }
    }

    if (!found) {
      return { valid: false, failedAtStep: i, reason: `no valid move for value ${move.movedValue} at step ${i}` };
    }
  }

  const finalPieces = countPieces(tubes);

  return { valid: true, finalPieces };
}

// --- Helpers ---

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Layout generation ---

/**
 * Generate a random level layout for a given group config.
 * Returns a level object or null if generation fails.
 */
function generateLayout(id, group) {
  const tubeCount = randInt(group.tubeCount[0], group.tubeCount[1]);
  const emptyTubeTarget = randInt(group.emptyTubes[0], group.emptyTubes[1]);

  // Generate capacities with required variance
  let capacities;
  for (let attempt = 0; attempt < 20; attempt++) {
    capacities = [];
    for (let i = 0; i < tubeCount; i++) {
      capacities.push(randInt(group.capacityRange[0], group.capacityRange[1]));
    }
    // Check capacity variance
    if (group.mustVaryCapacity) {
      const uniqueCaps = new Set(capacities);
      if (uniqueCaps.size >= group.minCapVariants) break;
    } else {
      break;
    }
  }

  const totalCapacity = capacities.reduce((a, b) => a + b, 0);
  const fillTarget = randFloat(group.fillRange[0], group.fillRange[1]);
  let totalPieces = Math.round(totalCapacity * fillTarget);

  // Reserve empty tubes
  const filledTubes = tubeCount - emptyTubeTarget;
  if (totalPieces < filledTubes) totalPieces = filledTubes; // at least 1 piece per filled tube

  // Pick values to use (randomize subset size)
  const numValues = randInt(
    Math.min(3, group.values.length),
    Math.min(group.values.length, 5)
  );
  const selectedValues = shuffle(group.values).slice(0, numValues).sort((a, b) => a - b);

  // Target piece count
  const targetPieceCount = randInt(group.targetPieceCount[0], group.targetPieceCount[1]);

  // Distribute pieces into tubes ensuring no adjacent same values
  const tubes = [];
  for (let i = 0; i < tubeCount; i++) {
    tubes.push([]);
  }

  // Determine which tubes are "filled" and which are empty
  const tubeIndices = shuffle([...Array(tubeCount).keys()]);
  const emptyTubeIndices = new Set(tubeIndices.slice(0, emptyTubeTarget));
  const filledTubeIndices = tubeIndices.slice(emptyTubeTarget);

  // Place pieces one at a time, respecting constraints
  let piecesPlaced = 0;
  let stuckCount = 0;
  const maxStuck = totalPieces * 10;

  while (piecesPlaced < totalPieces && stuckCount < maxStuck) {
    // Pick a random filled tube that has room
    const candidates = filledTubeIndices.filter(ti => tubes[ti].length < capacities[ti]);
    if (candidates.length === 0) break; // all full

    const ti = pick(candidates);
    const tube = tubes[ti];

    // Pick a value that doesn't match the current top
    const topVal = tube.length > 0 ? tube[tube.length - 1] : null;
    const validValues = selectedValues.filter(v => v !== topVal);

    if (validValues.length === 0) {
      stuckCount++;
      continue;
    }

    tube.push(pick(validValues));
    piecesPlaced++;
  }

  if (piecesPlaced < totalPieces * 0.8) return null; // too many failures

  // Build level object
  const level = {
    id,
    name: '', // filled later
    difficulty: group.label,
    targetPieceCount,
    tubes: capacities.map((cap, i) => ({
      capacity: cap,
      initialPieces: tubes[i],
    })),
  };

  return level;
}

// --- Level names ---
const ADJECTIVES = [
  'Twisted', 'Frozen', 'Shattered', 'Crimson', 'Silent', 'Blazing', 'Fractured',
  'Sunken', 'Hollow', 'Rusted', 'Gilded', 'Molten', 'Crystal', 'Shadow', 'Iron',
  'Obsidian', 'Emerald', 'Storm', 'Thorn', 'Void', 'Ancient', 'Shifting', 'Burning',
  'Glass', 'Steel', 'Phantom', 'Toxic', 'Frozen', 'Wicked', 'Dark', 'Neon', 'Hidden',
  'Broken', 'Golden', 'Silver', 'Cosmic', 'Mystic', 'Savage', 'Rapid', 'Distant',
];
const NOUNS = [
  'Maze', 'Tower', 'Abyss', 'Vault', 'Forge', 'Gate', 'Pit', 'Bridge', 'Summit',
  'Depths', 'Spire', 'Throne', 'Cavern', 'Rift', 'Passage', 'Citadel', 'Arena',
  'Pinnacle', 'Labyrinth', 'Chamber', 'Corridor', 'Path', 'Domain', 'Nexus', 'Core',
  'Edge', 'Peak', 'Basin', 'Crypt', 'Den', 'Furnace', 'Haven', 'Sanctum', 'Trail',
  'Wall', 'Canyon', 'Chasm', 'Hollow', 'Ridge', 'Gauntlet',
];
const usedNames = new Set();

function generateName() {
  for (let i = 0; i < 100; i++) {
    const name = `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  return `Level ${Date.now()}`;
}

// --- Metric checking ---

function checkMetrics(level, solverResult, group) {
  const structural = computeStructuralMetrics(level);
  const blocking = computeBlockingMetrics(level);
  const solution = computeSolutionMetrics(solverResult);
  const branching = computeBranchingMetrics(solverResult);

  const reasons = [];

  // Move count
  if (solution.optimalMoves < group.moveRange[0]) {
    reasons.push(`moves too low: ${solution.optimalMoves}, need >=${group.moveRange[0]}`);
  }
  if (solution.optimalMoves > group.moveRange[1]) {
    reasons.push(`moves too high: ${solution.optimalMoves}, need <=${group.moveRange[1]}`);
  }

  // Fill ratio
  if (structural.fillRatio < group.fillRange[0] - 0.05) {
    reasons.push(`fill too low: ${(structural.fillRatio * 100).toFixed(0)}%`);
  }

  return { pass: reasons.length === 0, reasons, structural, blocking, solution, branching };
}

// --- Main generation loop ---

function main() {
  console.log(`\nNumber Sort Level Generator`);
  console.log(`===========================`);
  console.log(`Generating levels ${startId}-${endId}...\n`);

  const acceptedLevels = [];
  const generationLog = [];
  const totalStart = Date.now();

  for (let id = startId; id <= endId; id++) {
    // Find which group this id belongs to
    const group = GROUPS.find(g => id >= g.startId && id <= g.endId);
    if (!group) {
      console.log(`[Level ${id}] No group defined, skipping.`);
      generationLog.push({ id, status: 'skipped', reason: 'no group' });
      continue;
    }

    console.log(`[Level ${id}] Group: ${group.label} (${group.startId}-${group.endId})`);

    let accepted = false;
    let attempts = 0;
    const maxAttempts = 200;
    // After 100 attempts, relax constraints
    const relaxAt = 100;

    while (!accepted && attempts < maxAttempts) {
      attempts++;

      // Generate random layout
      const effectiveGroup = attempts > relaxAt ? {
        ...group,
        moveRange: [group.moveRange[0] - 3, group.moveRange[1] + 5],
        fillRange: [group.fillRange[0] - 0.05, group.fillRange[1] + 0.05],
      } : group;

      const level = generateLayout(id, effectiveGroup);
      if (!level) continue;

      // Solve (always A*)
      const solverResult = solve(level, {
        mode: 'astar',
        timeoutMs: group.solverTimeout,
        maxStates: group.solverMaxStates,
      });

      if (!solverResult.solvable || solverResult.timedOut) {
        if (attempts % 25 === 0) {
          console.log(`  Attempt ${attempts}/${maxAttempts} — REJECTED (unsolvable/timeout)`);
        }
        continue;
      }

      // Verify solution (using A*-aware verifier that handles permutation-invariant hash)
      const verification = verifyAStarSolution(level, solverResult.solutionPath);
      if (!verification.valid) {
        if (attempts % 25 === 0) {
          console.log(`  Attempt ${attempts}/${maxAttempts} — VERIFICATION FAILED: ${verification.reason}`);
        }
        continue;
      }

      // Check metrics
      const check = checkMetrics(level, solverResult, effectiveGroup);
      if (!check.pass) {
        if (attempts % 25 === 0) {
          console.log(`  Attempt ${attempts}/${maxAttempts} — REJECTED (${check.reasons[0]})`);
        }
        continue;
      }

      // ACCEPTED — set targetPieceCount to actual solver minimum
      level.targetPieceCount = verification.finalPieces;
      level.name = generateName();

      // Map difficulty label based on actual group
      if (group.label === 'Medium') level.difficulty = 'Medium';
      else if (group.label === 'Hard') level.difficulty = 'Hard';
      else if (group.label === 'Hard-Expert') level.difficulty = 'Expert';
      else if (group.label === 'Expert') level.difficulty = 'Grandmaster';

      acceptedLevels.push({
        level,
        solverResult,
        structural: check.structural,
        blocking: check.blocking,
        solution: check.solution,
        branching: check.branching,
        attempts,
      });

      const fill = (check.structural.fillRatio * 100).toFixed(0);
      const branch = check.branching.avgBranchingFactor.toFixed(2);
      const deadEnd = (check.branching.deadEndRatio * 100).toFixed(1);
      console.log(`  Attempt ${attempts}/${maxAttempts} — ACCEPTED (${level.difficulty}, moves: ${check.solution.optimalMoves}, fill: ${fill}%, branch: ${branch}, deadEnd: ${deadEnd}%, minPieces: ${level.targetPieceCount})`);

      accepted = true;
      generationLog.push({ id, status: 'accepted', attempts, moves: check.solution.optimalMoves, fill: check.structural.fillRatio });
    }

    if (!accepted) {
      console.log(`  *** FAILED after ${maxAttempts} attempts — skipping Level ${id}`);
      generationLog.push({ id, status: 'failed', attempts: maxAttempts });
    }
  }

  const totalTime = Date.now() - totalStart;
  console.log(`\n--- Generation complete: ${acceptedLevels.length} levels in ${(totalTime / 1000).toFixed(1)}s ---\n`);

  // --- Compute composite scores for all accepted levels ---
  if (acceptedLevels.length > 0) {
    const allRawMetrics = acceptedLevels.map(a => ({
      structural: a.structural,
      blocking: a.blocking,
      solution: a.solution,
      branching: a.branching,
    }));
    const compositeScores = computeCompositeScores(allRawMetrics);
    acceptedLevels.forEach((a, i) => {
      a.composite = compositeScores[i];
    });
  }

  // --- Write outputs ---
  const analysisDir = path.join(projectRoot, 'analysis');
  if (!fs.existsSync(analysisDir)) fs.mkdirSync(analysisDir, { recursive: true });

  // 1. new-levels.json — merge with existing levels (append, don't overwrite)
  const levelsJson = acceptedLevels.map(a => a.level);
  const jsonPath = path.join(analysisDir, 'new-levels.json');
  let existingLevels = [];
  if (fs.existsSync(jsonPath)) {
    try {
      existingLevels = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log(`  Loaded ${existingLevels.length} existing levels from new-levels.json`);
    } catch (e) {
      console.warn(`  Warning: could not parse existing new-levels.json, starting fresh`);
    }
  }
  // Replace levels with same ID, append new ones
  const mergedMap = new Map(existingLevels.map(l => [l.id, l]));
  for (const l of levelsJson) {
    mergedMap.set(l.id, l);
  }
  const mergedLevels = [...mergedMap.values()].sort((a, b) => a.id - b.id);
  fs.writeFileSync(jsonPath, JSON.stringify(mergedLevels, null, 2));
  console.log(`Written: ${jsonPath} (${mergedLevels.length} total levels, ${levelsJson.length} new/updated)`);

  // 2. new-levels-report.md
  let report = '# New Levels Report (51-90)\n\n';
  report += `Generated: ${new Date().toISOString()} | Total time: ${(totalTime / 1000).toFixed(1)}s\n\n---\n\n`;

  for (const a of acceptedLevels) {
    const { level, solution, structural, branching, composite, attempts } = a;
    const fill = (structural.fillRatio * 100).toFixed(0);
    const branch = branching.avgBranchingFactor.toFixed(2);
    const deadEnd = (branching.deadEndRatio * 100).toFixed(1);
    const chainFreq = solution.totalChainReactions > 0
      ? (solution.optimalMoves / solution.totalChainReactions).toFixed(1)
      : 'none';

    report += `### Level ${level.id}: ${level.name}\n`;
    report += `**Tier: ${composite.tier} (${composite.compositeScore}/100)**\n`;
    report += `**Optimal Moves: ${solution.optimalMoves} | Fill: ${fill}% | Tubes: ${structural.tubeCount} | Branching: avg ${branch}**\n`;
    report += `**Dead-Ends: ${deadEnd}% | Chain Freq: every ${chainFreq} moves**\n`;
    report += `**Generation: accepted on attempt ${attempts}**\n\n`;

    // Tube layout
    report += '| Tube | Capacity | Pieces | Fill |\n';
    report += '|------|----------|--------|------|\n';
    for (let ti = 0; ti < level.tubes.length; ti++) {
      const t = level.tubes[ti];
      const pcs = t.initialPieces.length;
      const f = pcs > 0 ? `${((pcs / t.capacity) * 100).toFixed(0)}%` : 'empty';
      report += `| T${ti} | ${t.capacity} | [${t.initialPieces.join(', ')}] | ${f} |\n`;
    }
    report += '\n---\n\n';
  }

  const reportPath = path.join(analysisDir, 'new-levels-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`Written: ${reportPath}`);

  // 3. generation-summary.md
  let summary = '# Generation Summary\n\n';
  summary += `Generated: ${new Date().toISOString()} | Total time: ${(totalTime / 1000).toFixed(1)}s\n\n`;

  const accepted = generationLog.filter(l => l.status === 'accepted');
  const failed = generationLog.filter(l => l.status === 'failed');
  const skipped = generationLog.filter(l => l.status === 'skipped');

  summary += `## Overview\n\n`;
  summary += `| Metric | Value |\n`;
  summary += `|--------|-------|\n`;
  summary += `| Total Requested | ${endId - startId + 1} |\n`;
  summary += `| Accepted | ${accepted.length} |\n`;
  summary += `| Failed | ${failed.length} |\n`;
  summary += `| Skipped | ${skipped.length} |\n`;
  summary += `| Avg Attempts | ${accepted.length > 0 ? (accepted.reduce((s, l) => s + l.attempts, 0) / accepted.length).toFixed(1) : '-'} |\n\n`;

  // Group breakdown
  summary += `## By Group\n\n`;
  summary += `| Group | Label | Requested | Accepted | Failed | Avg Attempts |\n`;
  summary += `|-------|-------|-----------|----------|--------|-------------|\n`;
  for (const g of GROUPS) {
    if (g.startId < startId || g.endId > endId) continue;
    const gAccepted = accepted.filter(l => l.id >= g.startId && l.id <= g.endId);
    const gFailed = failed.filter(l => l.id >= g.startId && l.id <= g.endId);
    const total = Math.min(g.endId, endId) - Math.max(g.startId, startId) + 1;
    const avgAtt = gAccepted.length > 0 ? (gAccepted.reduce((s, l) => s + l.attempts, 0) / gAccepted.length).toFixed(1) : '-';
    summary += `| ${g.startId}-${g.endId} | ${g.label} | ${total} | ${gAccepted.length} | ${gFailed.length} | ${avgAtt} |\n`;
  }
  summary += '\n';

  // Tier distribution of new levels
  if (acceptedLevels.length > 0) {
    summary += `## Tier Distribution (New Levels)\n\n`;
    const tiers = { tutorial: 0, easy: 0, medium: 0, hard: 0, expert: 0 };
    for (const a of acceptedLevels) tiers[a.composite.tier]++;
    summary += `| Tier | Count |\n`;
    summary += `|------|-------|\n`;
    for (const [t, c] of Object.entries(tiers)) {
      summary += `| ${t} | ${c} |\n`;
    }
    summary += '\n';

    // Stats
    summary += `## New Level Stats\n\n`;
    const moves = acceptedLevels.map(a => a.solution.optimalMoves);
    const fills = acceptedLevels.map(a => a.structural.fillRatio);
    const branches = acceptedLevels.map(a => a.branching.avgBranchingFactor);
    const scores = acceptedLevels.map(a => a.composite.compositeScore);

    summary += `| Metric | Min | Avg | Max |\n`;
    summary += `|--------|-----|-----|-----|\n`;
    summary += `| Optimal Moves | ${Math.min(...moves)} | ${(moves.reduce((a, b) => a + b, 0) / moves.length).toFixed(1)} | ${Math.max(...moves)} |\n`;
    summary += `| Fill Ratio | ${(Math.min(...fills) * 100).toFixed(0)}% | ${(fills.reduce((a, b) => a + b, 0) / fills.length * 100).toFixed(0)}% | ${(Math.max(...fills) * 100).toFixed(0)}% |\n`;
    summary += `| Branching Factor | ${Math.min(...branches).toFixed(2)} | ${(branches.reduce((a, b) => a + b, 0) / branches.length).toFixed(2)} | ${Math.max(...branches).toFixed(2)} |\n`;
    summary += `| Composite Score | ${Math.min(...scores)} | ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)} | ${Math.max(...scores)} |\n`;
    summary += '\n';
  }

  // Failed levels
  if (failed.length > 0) {
    summary += `## Failed Levels\n\n`;
    for (const f of failed) {
      summary += `- Level ${f.id}: failed after ${f.attempts} attempts\n`;
    }
    summary += '\n';
  }

  const summaryPath = path.join(analysisDir, 'generation-summary.md');
  fs.writeFileSync(summaryPath, summary);
  console.log(`Written: ${summaryPath}`);
}

main();
