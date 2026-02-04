// validation.ts - Level validation utilities

import type { Level } from '../engine/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalPieces: number;
    totalValue: number;
    emptyTubes: number;
    theoreticalMin: number;
  };
}

// Calculate theoretical minimum using binary representation
function calculateTheoreticalMin(totalValue: number): number {
  if (totalValue <= 0) return 0;
  // Count the number of 1s in binary representation
  let count = 0;
  let n = totalValue;
  while (n > 0) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

// Check if a value is a power of 2
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export function validateLevel(level: Level): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!level.name || level.name.trim() === '') {
    errors.push('Level name is required');
  }

  if (level.tubes.length === 0) {
    errors.push('Level must have at least one tube');
  }

  if (level.tubes.length > 12) {
    warnings.push('More than 12 tubes may cause layout issues');
  }

  // Calculate stats
  let totalPieces = 0;
  let totalValue = 0;
  let emptyTubes = 0;

  for (let i = 0; i < level.tubes.length; i++) {
    const tube = level.tubes[i];

    // Capacity validation
    if (tube.capacity < 2) {
      errors.push(`Tube ${i + 1}: Capacity must be at least 2`);
    }
    if (tube.capacity > 10) {
      warnings.push(`Tube ${i + 1}: High capacity (${tube.capacity}) may cause UI issues`);
    }

    // Filter out null pieces for validation
    const validPieces = tube.initialPieces.filter((p): p is number => p !== null && p !== undefined);

    // Piece count validation
    if (validPieces.length > tube.capacity) {
      errors.push(`Tube ${i + 1}: Has ${validPieces.length} pieces but capacity is ${tube.capacity}`);
    }

    // Piece value validation
    for (let j = 0; j < validPieces.length; j++) {
      const value = validPieces[j];
      if (!isPowerOfTwo(value)) {
        errors.push(`Tube ${i + 1}, Piece ${j + 1}: Value ${value} is not a power of 2`);
      }
      if (value < 2) {
        errors.push(`Tube ${i + 1}, Piece ${j + 1}: Value must be at least 2`);
      }
      if (value > 2048) {
        warnings.push(`Tube ${i + 1}, Piece ${j + 1}: Value ${value} is very high`);
      }
      totalValue += value;
    }

    totalPieces += validPieces.length;
    if (validPieces.length === 0) {
      emptyTubes++;
    }
  }

  // Empty tube validation
  if (emptyTubes === 0 && totalPieces > 0) {
    warnings.push('No empty tubes - level may be unsolvable');
  }

  // Calculate theoretical minimum
  const theoreticalMin = calculateTheoreticalMin(totalValue);

  if (level.targetPieceCount > totalPieces) {
    errors.push(`Target (${level.targetPieceCount}) exceeds total pieces (${totalPieces})`);
  }

  if (level.targetPieceCount === totalPieces) {
    warnings.push('Target equals starting pieces - no merges needed');
  }

  // Two-row layout validation
  const topRowTubes = level.tubes.filter(t => !t.row || t.row === 'top');
  const bottomRowTubes = level.tubes.filter(t => t.row === 'bottom');

  if (bottomRowTubes.length > 0 && topRowTubes.length === 0) {
    warnings.push('All tubes are in bottom row - consider using top row');
  }

  if (topRowTubes.length > 6) {
    warnings.push(`Top row has ${topRowTubes.length} tubes - consider using two rows`);
  }

  if (bottomRowTubes.length > 6) {
    warnings.push(`Bottom row has ${bottomRowTubes.length} tubes - may cause layout issues`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalPieces,
      totalValue,
      emptyTubes,
      theoreticalMin,
    },
  };
}

// Theoretical minimum based on binary representation
export function calculateTheoreticalMinForLevel(level: Level): number {
  let totalValue = 0;
  for (const tube of level.tubes) {
    for (const piece of tube.initialPieces) {
      if (piece !== null && piece !== undefined) {
        totalValue += piece;
      }
    }
  }
  return calculateTheoreticalMin(totalValue);
}
