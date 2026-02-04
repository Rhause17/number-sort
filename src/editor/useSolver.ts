// useSolver.ts - Async solver hook with debouncing

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Level } from '../engine/types';
import { solveLevelAsync } from './solver';

interface SolverResult {
  minPieces: number | null;
  isCalculating: boolean;
}

// Serialize level for comparison (only relevant parts)
function serializeLevel(level: Level): string {
  return JSON.stringify({
    tubes: level.tubes.map(t => ({
      capacity: t.capacity,
      pieces: t.initialPieces.filter((p): p is number => p !== null && p !== undefined),
    })),
  });
}

export function useSolver(level: Level | null, debounceMs: number = 500): SolverResult {
  const [minPieces, setMinPieces] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const abortSignalRef = useRef<{ aborted: boolean }>({ aborted: false });
  const lastLevelKeyRef = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculate = useCallback(async (lvl: Level, levelKey: string) => {
    // Create new abort signal for this calculation
    const signal = { aborted: false };
    abortSignalRef.current = signal;

    setIsCalculating(true);

    try {
      const result = await solveLevelAsync(lvl, 50000, undefined, signal);

      // Only update if not aborted and level hasn't changed
      if (!signal.aborted && lastLevelKeyRef.current === levelKey) {
        setMinPieces(result);
        setIsCalculating(false);
      }
    } catch {
      if (!signal.aborted) {
        setIsCalculating(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!level) {
      setMinPieces(null);
      setIsCalculating(false);
      lastLevelKeyRef.current = '';
      return;
    }

    const levelKey = serializeLevel(level);

    // Skip if level hasn't changed
    if (levelKey === lastLevelKeyRef.current) {
      return;
    }

    // Update the key immediately
    lastLevelKeyRef.current = levelKey;

    // Abort previous calculation
    abortSignalRef.current.aborted = true;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show calculating state immediately
    setIsCalculating(true);
    setMinPieces(null);

    // Debounce the actual calculation
    timeoutRef.current = setTimeout(() => {
      calculate(level, levelKey);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [level, debounceMs, calculate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortSignalRef.current.aborted = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { minPieces, isCalculating };
}
