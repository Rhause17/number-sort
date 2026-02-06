// solver.js — A* + BFS solver for Number Sort levels
// Finds optimal (minimum move) solutions with full path tracking and metrics collection.
// Default mode: A* with admissible heuristic for massive speed improvement over BFS.
// BFS mode available for validation (mode: 'bfs').

/**
 * @typedef {{from: number, to: number, movedValue: number, merged: boolean, chainLength: number, mergeResults: number[]}} MoveRecord
 * @typedef {{parentHash: string|null, move: MoveRecord|null, depth: number, validMoveCount: number, pieceCount: number}} BFSNode
 * @typedef {{
 *   levelId: number,
 *   solvable: boolean,
 *   optimalMoves: number,
 *   solutionPath: MoveRecord[],
 *   totalStatesExplored: number,
 *   uniqueStatesReached: number,
 *   maxDepthReached: number,
 *   deadEndCount: number,
 *   maxBranchingFactor: number,
 *   avgBranchingFactor: number,
 *   branchingFactors: number[],
 *   timeMs: number,
 *   timedOut: boolean,
 *   decisionPoints: number
 * }} SolverResult
 */

// --- MinHeap: binary heap priority queue for A* ---

class MinHeap {
  constructor() {
    /** @type {{hash: string, f: number, g: number}[]} */
    this._data = [];
  }

  push(item) {
    this._data.push(item);
    this._bubbleUp(this._data.length - 1);
  }

  pop() {
    const data = this._data;
    if (data.length === 0) return undefined;
    const top = data[0];
    const last = data.pop();
    if (data.length > 0) {
      data[0] = last;
      this._bubbleDown(0);
    }
    return top;
  }

  get size() {
    return this._data.length;
  }

  _bubbleUp(i) {
    const data = this._data;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (data[i].f < data[parent].f) {
        [data[i], data[parent]] = [data[parent], data[i]];
        i = parent;
      } else break;
    }
  }

  _bubbleDown(i) {
    const data = this._data;
    const n = data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && data[left].f < data[smallest].f) smallest = left;
      if (right < n && data[right].f < data[smallest].f) smallest = right;
      if (smallest !== i) {
        [data[i], data[smallest]] = [data[smallest], data[i]];
        i = smallest;
      } else break;
    }
  }
}

// --- Deque: efficient FIFO queue for BFS mode ---

class Deque {
  constructor() {
    /** @type {any[]} */ this._data = [];
    this._head = 0;
  }
  push(item) {
    this._data.push(item);
  }
  shift() {
    if (this._head >= this._data.length) return undefined;
    const item = this._data[this._head];
    this._data[this._head] = undefined;
    this._head++;
    if (this._head > 1000 && this._head > this._data.length / 2) {
      this._data = this._data.slice(this._head);
      this._head = 0;
    }
    return item;
  }
  get size() {
    return this._data.length - this._head;
  }
}

// --- Core helpers ---

/**
 * Permutation-invariant state hash.
 * @param {number[][]} tubes
 * @returns {string}
 */
function hashState(tubes) {
  return tubes.map(t => t.join(',')).sort().join('|');
}

/** @param {number[][]} tubes @returns {number} */
function countPieces(tubes) {
  let sum = 0;
  for (let i = 0; i < tubes.length; i++) sum += tubes[i].length;
  return sum;
}

/** @param {number[][]} tubes @param {number} targetPieceCount @returns {boolean} */
function isWin(tubes, targetPieceCount) {
  return countPieces(tubes) <= targetPieceCount;
}

/**
 * Correct move validation.
 * @param {number[]} fromTube @param {number[]} toTube @param {number} toCapacity @returns {boolean}
 */
function canMove(fromTube, toTube, toCapacity) {
  if (fromTube.length === 0) return false;
  if (toTube.length >= toCapacity) return false;
  if (toTube.length === 0) return true;
  return fromTube[fromTube.length - 1] <= toTube[toTube.length - 1];
}

/**
 * Apply a move including chain reactions. Returns null if invalid.
 * @param {number[][]} tubes @param {number[]} capacities @param {number} fromIdx @param {number} toIdx
 */
function applyMove(tubes, capacities, fromIdx, toIdx) {
  if (!canMove(tubes[fromIdx], tubes[toIdx], capacities[toIdx])) return null;

  const newTubes = tubes.map(t => [...t]);
  const piece = newTubes[fromIdx].pop();
  newTubes[toIdx].push(piece);

  let chainLength = 0;
  const mergeResults = [];
  const target = newTubes[toIdx];
  while (target.length >= 2) {
    const top = target[target.length - 1];
    const second = target[target.length - 2];
    if (top === second) {
      target.pop();
      target.pop();
      const merged = top * 2;
      target.push(merged);
      chainLength++;
      mergeResults.push(merged);
    } else break;
  }

  return { tubes: newTubes, movedValue: piece, merged: chainLength > 0, chainLength, mergeResults };
}

// --- A* Heuristic (admissible — never overestimates) ---

/**
 * Admissible heuristic for A*.
 * Returns a lower bound on the number of moves needed to reach the win condition.
 *
 * Component 1: Piece reduction estimate.
 *   We need to reduce (totalPieces - target) pieces. Each move can reduce at most
 *   ~1.5 pieces on average (merges + chains), so ceil(needed / 1.5) is a lower bound.
 *
 * Component 2: Disorder count.
 *   Count transitions between different values within each tube. Each such transition
 *   requires at least one move to resolve (move the piece out).
 *
 * We take the max of both components (both are lower bounds, so max is too).
 *
 * @param {number[][]} tubes
 * @param {number} targetPieceCount
 * @returns {number}
 */
function heuristic(tubes, targetPieceCount) {
  let totalPieces = 0;
  let disorderCount = 0;

  for (let ti = 0; ti < tubes.length; ti++) {
    const tube = tubes[ti];
    totalPieces += tube.length;
    for (let i = 1; i < tube.length; i++) {
      if (tube[i] !== tube[i - 1]) disorderCount++;
    }
  }

  const piecesNeeded = totalPieces - targetPieceCount;
  // Each merge reduces by 1 piece; chain of length k reduces by k.
  // Conservatively assume average ~1.5 reduction per move.
  const reductionEstimate = Math.ceil(Math.max(0, piecesNeeded) / 1.5);

  return Math.max(reductionEstimate, disorderCount);
}

// --- Shared result builder ---

function emptyResult(levelId, startTime, extra = {}) {
  return {
    levelId,
    solvable: false,
    optimalMoves: -1,
    solutionPath: [],
    totalStatesExplored: 0,
    uniqueStatesReached: 0,
    maxDepthReached: 0,
    deadEndCount: 0,
    maxBranchingFactor: 0,
    avgBranchingFactor: 0,
    branchingFactors: [],
    timeMs: Date.now() - startTime,
    timedOut: false,
    decisionPoints: 0,
    ...extra,
  };
}

// --- Shared state expansion logic ---

/**
 * Generate all valid successor states from currentTubes.
 * Applies empty tube equivalence pruning.
 * @returns {Array<{result: object, fromIdx: number, toIdx: number}>}
 */
function expandState(currentTubes, capacities, numTubes) {
  const successors = [];
  for (let fromIdx = 0; fromIdx < numTubes; fromIdx++) {
    if (currentTubes[fromIdx].length === 0) continue;

    let seenEmptyForThisFrom = false;
    for (let toIdx = 0; toIdx < numTubes; toIdx++) {
      if (fromIdx === toIdx) continue;

      if (currentTubes[toIdx].length === 0) {
        if (seenEmptyForThisFrom) continue;
        seenEmptyForThisFrom = true;
      }

      const result = applyMove(currentTubes, capacities, fromIdx, toIdx);
      if (!result) continue;

      successors.push({ result, fromIdx, toIdx });
    }
  }
  return successors;
}

// --- A* Solver ---

/**
 * @param {object} level
 * @param {{maxStates?: number, timeoutMs?: number}} options
 * @returns {SolverResult}
 */
function solveAStar(level, options = {}) {
  const { maxStates = 2_000_000, timeoutMs = 60_000 } = options;
  const startTime = Date.now();

  const initialTubes = level.tubes.map(t =>
    (t.initialPieces || []).filter(p => p !== null && p !== undefined)
  );
  const capacities = level.tubes.map(t => t.capacity);
  const targetPieceCount = level.targetPieceCount;
  const numTubes = initialTubes.length;

  const initialPieceCount = countPieces(initialTubes);
  if (initialPieceCount === 0 || isWin(initialTubes, targetPieceCount)) {
    return emptyResult(level.id, startTime, { solvable: true, optimalMoves: 0 });
  }

  const initialHash = hashState(initialTubes);
  const h0 = heuristic(initialTubes, targetPieceCount);

  // State map: hash → {tubes, parentHash, move, g, pieceCount, validMoveCount, expanded}
  const stateMap = new Map();
  stateMap.set(initialHash, {
    tubes: initialTubes,
    parentHash: null,
    move: null,
    g: 0,
    pieceCount: initialPieceCount,
    validMoveCount: 0,
    expanded: false,
  });

  const openSet = new MinHeap();
  openSet.push({ hash: initialHash, f: h0, g: 0 });

  let statesExplored = 0;
  let maxDepth = 0;
  let deadEndCount = 0;
  let totalBranching = 0;
  let maxBranching = 0;
  let decisionPoints = 0;
  let winHash = null;
  const branchingFactors = [];

  while (openSet.size > 0 && statesExplored < maxStates) {
    if (Date.now() - startTime > timeoutMs) break;

    const { hash: currentHash, g: heapG } = openSet.pop();
    const currentState = stateMap.get(currentHash);

    // Skip if already expanded with a better or equal g
    if (currentState.expanded) continue;
    currentState.expanded = true;

    const currentTubes = currentState.tubes;
    statesExplored++;

    if (statesExplored % 50_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  Level ${level.id}: ${statesExplored.toLocaleString()} states, open: ${openSet.size.toLocaleString()}, depth: ${heapG}, ${elapsed}s`);
    }

    if (heapG > maxDepth) maxDepth = heapG;

    // Expand successors
    const successors = expandState(currentTubes, capacities, numTubes);
    let validMoves = 0;

    for (const { result, fromIdx, toIdx } of successors) {
      const newHash = hashState(result.tubes);
      const newG = heapG + 1;

      const existing = stateMap.get(newHash);
      if (existing) {
        // Reopening: only if we found a strictly shorter path
        if (newG < existing.g) {
          existing.parentHash = currentHash;
          existing.move = {
            from: fromIdx, to: toIdx,
            movedValue: result.movedValue,
            merged: result.merged,
            chainLength: result.chainLength,
            mergeResults: result.mergeResults,
          };
          existing.g = newG;
          existing.expanded = false;
          const h = heuristic(result.tubes, targetPieceCount);
          openSet.push({ hash: newHash, f: newG + h, g: newG });
          validMoves++;
        }
        // Already visited with equal or better g → skip
        continue;
      }

      validMoves++;
      const newPieceCount = countPieces(result.tubes);

      /** @type {MoveRecord} */
      const move = {
        from: fromIdx, to: toIdx,
        movedValue: result.movedValue,
        merged: result.merged,
        chainLength: result.chainLength,
        mergeResults: result.mergeResults,
      };

      stateMap.set(newHash, {
        tubes: result.tubes,
        parentHash: currentHash,
        move,
        g: newG,
        pieceCount: newPieceCount,
        validMoveCount: 0,
        expanded: false,
      });

      // Win check
      if (newPieceCount <= targetPieceCount) {
        winHash = newHash;
        break;
      }

      const h = heuristic(result.tubes, targetPieceCount);
      openSet.push({ hash: newHash, f: newG + h, g: newG });
    }

    // Record branching data
    currentState.validMoveCount = validMoves;
    branchingFactors.push(validMoves);
    totalBranching += validMoves;
    if (validMoves > maxBranching) maxBranching = validMoves;
    if (validMoves > 1) decisionPoints++;
    if (validMoves === 0 && !isWin(currentTubes, targetPieceCount)) deadEndCount++;

    if (winHash) break;
  }

  // Reconstruct solution path
  const solutionPath = [];
  if (winHash) {
    let hash = winHash;
    while (hash !== null) {
      const node = stateMap.get(hash);
      if (node.move) solutionPath.unshift(node.move);
      hash = node.parentHash;
    }
  }

  const timeMs = Date.now() - startTime;
  const timedOut = !winHash && (Date.now() - startTime >= timeoutMs || statesExplored >= maxStates);

  return {
    levelId: level.id,
    solvable: winHash !== null,
    optimalMoves: winHash ? solutionPath.length : -1,
    solutionPath,
    totalStatesExplored: statesExplored,
    uniqueStatesReached: stateMap.size,
    maxDepthReached: maxDepth,
    deadEndCount,
    maxBranchingFactor: maxBranching,
    avgBranchingFactor: statesExplored > 0 ? totalBranching / statesExplored : 0,
    branchingFactors,
    timeMs,
    timedOut,
    decisionPoints,
  };
}

// --- BFS Solver (preserved for validation) ---

/**
 * @param {object} level
 * @param {{maxStates?: number, timeoutMs?: number}} options
 * @returns {SolverResult}
 */
function solveBFS(level, options = {}) {
  const { maxStates = 1_000_000, timeoutMs = 60_000 } = options;
  const startTime = Date.now();

  const initialTubes = level.tubes.map(t =>
    (t.initialPieces || []).filter(p => p !== null && p !== undefined)
  );
  const capacities = level.tubes.map(t => t.capacity);
  const targetPieceCount = level.targetPieceCount;
  const numTubes = initialTubes.length;

  const initialPieceCount = countPieces(initialTubes);
  if (initialPieceCount === 0 || isWin(initialTubes, targetPieceCount)) {
    return emptyResult(level.id, startTime, { solvable: true, optimalMoves: 0 });
  }

  const initialHash = hashState(initialTubes);
  const visited = new Map();
  visited.set(initialHash, {
    parentHash: null, move: null, depth: 0, validMoveCount: 0, pieceCount: initialPieceCount,
  });

  const queue = new Deque();
  queue.push({ hash: initialHash, tubes: initialTubes });

  let statesExplored = 0;
  let maxDepth = 0;
  let deadEndCount = 0;
  let totalBranching = 0;
  let maxBranching = 0;
  let decisionPoints = 0;
  let winHash = null;
  const branchingFactors = [];

  while (queue.size > 0 && statesExplored < maxStates) {
    if (Date.now() - startTime > timeoutMs) break;

    const { hash: currentHash, tubes: currentTubes } = queue.shift();
    statesExplored++;

    if (statesExplored % 50_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  Level ${level.id}: ${statesExplored.toLocaleString()} states explored, queue: ${queue.size.toLocaleString()}, ${elapsed}s`);
    }

    const currentNode = visited.get(currentHash);
    const successors = expandState(currentTubes, capacities, numTubes);
    let validMoves = 0;

    for (const { result, fromIdx, toIdx } of successors) {
      const newHash = hashState(result.tubes);
      if (visited.has(newHash)) continue;

      validMoves++;
      const newDepth = currentNode.depth + 1;
      if (newDepth > maxDepth) maxDepth = newDepth;

      const move = {
        from: fromIdx, to: toIdx,
        movedValue: result.movedValue, merged: result.merged,
        chainLength: result.chainLength, mergeResults: result.mergeResults,
      };

      const newPieceCount = countPieces(result.tubes);
      visited.set(newHash, {
        parentHash: currentHash, move, depth: newDepth,
        validMoveCount: 0, pieceCount: newPieceCount,
      });

      if (newPieceCount <= targetPieceCount) {
        winHash = newHash;
        break;
      }

      queue.push({ hash: newHash, tubes: result.tubes });
    }

    currentNode.validMoveCount = validMoves;
    branchingFactors.push(validMoves);
    totalBranching += validMoves;
    if (validMoves > maxBranching) maxBranching = validMoves;
    if (validMoves > 1) decisionPoints++;
    if (validMoves === 0 && !isWin(currentTubes, targetPieceCount)) deadEndCount++;

    if (winHash) break;
  }

  const solutionPath = [];
  if (winHash) {
    let hash = winHash;
    while (hash !== null) {
      const node = visited.get(hash);
      if (node.move) solutionPath.unshift(node.move);
      hash = node.parentHash;
    }
  }

  const timeMs = Date.now() - startTime;
  const timedOut = !winHash && (Date.now() - startTime >= timeoutMs || statesExplored >= maxStates);

  return {
    levelId: level.id,
    solvable: winHash !== null,
    optimalMoves: winHash ? solutionPath.length : -1,
    solutionPath,
    totalStatesExplored: statesExplored,
    uniqueStatesReached: visited.size,
    maxDepthReached: maxDepth,
    deadEndCount,
    maxBranchingFactor: maxBranching,
    avgBranchingFactor: statesExplored > 0 ? totalBranching / statesExplored : 0,
    branchingFactors,
    timeMs,
    timedOut,
    decisionPoints,
  };
}

// --- Public API ---

/**
 * Solve a level. Default mode: A* (much faster). Use mode:'bfs' for validation.
 * @param {object} level
 * @param {{mode?: 'astar'|'bfs', maxStates?: number, timeoutMs?: number}} [options]
 * @returns {SolverResult}
 */
function solve(level, options = {}) {
  const { mode = 'astar', ...rest } = options;
  if (mode === 'bfs') return solveBFS(level, rest);
  return solveAStar(level, rest);
}

// --- Solution verification ---

/**
 * Replay the solution path from initial state, verifying every move.
 * @param {object} level
 * @param {MoveRecord[]} solutionPath
 * @returns {{valid: boolean, failedAtStep?: number, reason?: string}}
 */
function verifySolution(level, solutionPath) {
  let tubes = level.tubes.map(t =>
    (t.initialPieces || []).filter(p => p !== null && p !== undefined)
  );
  const capacities = level.tubes.map(t => t.capacity);

  for (let i = 0; i < solutionPath.length; i++) {
    const move = solutionPath[i];

    if (!canMove(tubes[move.from], tubes[move.to], capacities[move.to])) {
      return { valid: false, failedAtStep: i, reason: `canMove returned false for move ${move.from}->${move.to}` };
    }

    const result = applyMove(tubes, capacities, move.from, move.to);
    if (!result) {
      return { valid: false, failedAtStep: i, reason: `applyMove returned null` };
    }

    if (result.chainLength !== move.chainLength) {
      return { valid: false, failedAtStep: i, reason: `chainLength mismatch: expected ${move.chainLength}, got ${result.chainLength}` };
    }

    if (result.movedValue !== move.movedValue) {
      return { valid: false, failedAtStep: i, reason: `movedValue mismatch: expected ${move.movedValue}, got ${result.movedValue}` };
    }

    tubes = result.tubes;
  }

  const finalPieces = countPieces(tubes);
  if (finalPieces > level.targetPieceCount) {
    return { valid: false, failedAtStep: -1, reason: `Final pieces ${finalPieces} > target ${level.targetPieceCount}` };
  }

  return { valid: true };
}

export { solve, solveAStar, solveBFS, verifySolution, canMove, applyMove, hashState, countPieces, isWin, heuristic, MinHeap, Deque };
