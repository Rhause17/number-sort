// solver.ts - Level solver to find actual minimum pieces achievable

import type { Level } from '../engine/types';

interface SolverState {
  tubes: number[][]; // Each tube is array of piece values (bottom to top)
  pieceCount: number;
}

// Serialize state for memoization
function serializeState(tubes: number[][]): string {
  return tubes.map(t => t.join(',')).join('|');
}

// Count total pieces
function countPieces(tubes: number[][]): number {
  return tubes.reduce((sum, tube) => sum + tube.length, 0);
}

// Check if we can move from one tube to another
function canMove(fromTube: number[], toTube: number[], toCapacity: number): boolean {
  if (fromTube.length === 0) return false;
  if (toTube.length >= toCapacity) return false;
  return true;
}

// Apply a move and return new tube state (with merges applied)
function applyMove(
  tubes: number[][],
  capacities: number[],
  fromIdx: number,
  toIdx: number
): number[][] | null {
  const fromTube = tubes[fromIdx];
  const toTube = tubes[toIdx];
  const toCapacity = capacities[toIdx];

  if (!canMove(fromTube, toTube, toCapacity)) return null;

  // Clone tubes
  const newTubes = tubes.map(t => [...t]);

  // Move piece
  const piece = newTubes[fromIdx].pop()!;
  newTubes[toIdx].push(piece);

  // Apply merges (chain reaction)
  let merged = true;
  while (merged) {
    merged = false;
    const tube = newTubes[toIdx];
    if (tube.length >= 2) {
      const top = tube[tube.length - 1];
      const second = tube[tube.length - 2];
      if (top === second) {
        tube.pop();
        tube.pop();
        tube.push(top * 2);
        merged = true;
      }
    }
  }

  return newTubes;
}

// Synchronous solver (for small levels or when blocking is OK)
export function solveLevel(level: Level, maxIterations: number = 50000): number {
  // Filter out null pieces and create initial state
  const initialTubes = level.tubes.map(tube =>
    tube.initialPieces.filter((p): p is number => p !== null && p !== undefined)
  );
  const capacities = level.tubes.map(tube => tube.capacity);

  const initialPieceCount = countPieces(initialTubes);
  if (initialPieceCount === 0) return 0;

  let minPieces = initialPieceCount;
  const visited = new Set<string>();

  const queue: SolverState[] = [{
    tubes: initialTubes,
    pieceCount: initialPieceCount,
  }];

  visited.add(serializeState(initialTubes));

  let iterations = 0;

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;

    // Get state with minimum pieces (greedy approach)
    queue.sort((a, b) => a.pieceCount - b.pieceCount);
    const current = queue.shift()!;

    // Update minimum
    if (current.pieceCount < minPieces) {
      minPieces = current.pieceCount;
    }

    // Early termination - can't do better than 1
    if (minPieces === 1) break;

    // Generate all possible moves
    for (let fromIdx = 0; fromIdx < current.tubes.length; fromIdx++) {
      for (let toIdx = 0; toIdx < current.tubes.length; toIdx++) {
        if (fromIdx === toIdx) continue;

        const newTubes = applyMove(current.tubes, capacities, fromIdx, toIdx);
        if (!newTubes) continue;

        const stateKey = serializeState(newTubes);
        if (visited.has(stateKey)) continue;

        visited.add(stateKey);
        const newPieceCount = countPieces(newTubes);

        queue.push({
          tubes: newTubes,
          pieceCount: newPieceCount,
        });
      }
    }
  }

  return minPieces;
}

// Async solver that yields to the main thread periodically
export function solveLevelAsync(
  level: Level,
  maxIterations: number = 50000,
  onProgress?: (progress: number) => void,
  signal?: { aborted: boolean }
): Promise<number> {
  return new Promise((resolve) => {
    // Filter out null pieces and create initial state
    const initialTubes = level.tubes.map(tube =>
      tube.initialPieces.filter((p): p is number => p !== null && p !== undefined)
    );
    const capacities = level.tubes.map(tube => tube.capacity);

    const initialPieceCount = countPieces(initialTubes);
    if (initialPieceCount === 0) {
      resolve(0);
      return;
    }

    let minPieces = initialPieceCount;
    const visited = new Set<string>();

    const queue: SolverState[] = [{
      tubes: initialTubes,
      pieceCount: initialPieceCount,
    }];

    visited.add(serializeState(initialTubes));

    let iterations = 0;
    const CHUNK_SIZE = 500; // Process this many iterations before yielding

    const processChunk = () => {
      // Check if aborted
      if (signal?.aborted) {
        resolve(minPieces);
        return;
      }

      const chunkEnd = Math.min(iterations + CHUNK_SIZE, maxIterations);

      while (queue.length > 0 && iterations < chunkEnd) {
        iterations++;

        // Sort less frequently for performance
        if (iterations % 100 === 0) {
          queue.sort((a, b) => a.pieceCount - b.pieceCount);
        }

        const current = queue.shift()!;

        if (current.pieceCount < minPieces) {
          minPieces = current.pieceCount;
        }

        if (minPieces === 1) {
          resolve(1);
          return;
        }

        for (let fromIdx = 0; fromIdx < current.tubes.length; fromIdx++) {
          for (let toIdx = 0; toIdx < current.tubes.length; toIdx++) {
            if (fromIdx === toIdx) continue;

            const newTubes = applyMove(current.tubes, capacities, fromIdx, toIdx);
            if (!newTubes) continue;

            const stateKey = serializeState(newTubes);
            if (visited.has(stateKey)) continue;

            visited.add(stateKey);
            const newPieceCount = countPieces(newTubes);

            queue.push({
              tubes: newTubes,
              pieceCount: newPieceCount,
            });
          }
        }
      }

      // Report progress
      if (onProgress) {
        onProgress(iterations / maxIterations);
      }

      // Check if done
      if (queue.length === 0 || iterations >= maxIterations) {
        resolve(minPieces);
        return;
      }

      // Yield to main thread and continue
      setTimeout(processChunk, 0);
    };

    // Start processing
    setTimeout(processChunk, 0);
  });
}
