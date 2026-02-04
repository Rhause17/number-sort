// HUD.tsx - Score, piece count, level info, restart butonu

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DifficultyGroup } from '../engine/types';
import { getDifficultyColor, TOTAL_LEVELS } from '../data/levels';

interface HUDProps {
  levelNumber: number;
  levelName: string;
  difficulty: DifficultyGroup;
  currentPieces: number;
  targetPieces: number;
  moveCount: number;
  isStuck: boolean;
  onRestart: () => void;
  onOpenLevelSelect?: () => void;
}

export const HUD = ({
  levelNumber,
  levelName,
  difficulty,
  currentPieces,
  targetPieces,
  moveCount,
  isStuck,
  onRestart,
  onOpenLevelSelect,
}: HUDProps) => {
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLevelClick = useCallback(() => {
    // Clear previous timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 4) {
      // Open level select
      setClickCount(0);
      onOpenLevelSelect?.();
    } else {
      // Reset after 1 second of no clicks
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1000);
    }
  }, [clickCount, onOpenLevelSelect]);
  // Calculate progress (assuming initial pieces around 8-20)
  const initialPieces = Math.max(currentPieces, targetPieces + 5);
  const progress = Math.max(0, Math.min(100, ((initialPieces - currentPieces) / (initialPieces - targetPieces)) * 100));
  const isNearTarget = currentPieces <= targetPieces + 2;
  const isComplete = currentPieces <= targetPieces;
  const difficultyColor = getDifficultyColor(difficulty);

  return (
    <div className="flex flex-col items-center gap-3 mb-4 w-full max-w-md px-4">
      {/* Level header - clickable for level select */}
      <button
        onClick={handleLevelClick}
        className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer select-none"
      >
        {/* Level number */}
        <span className="text-slate-500 text-sm font-medium">
          Level {levelNumber} / {TOTAL_LEVELS}
        </span>

        {/* Difficulty badge */}
        <span
          className="px-2 py-0.5 rounded text-xs font-semibold"
          style={{
            backgroundColor: `${difficultyColor}20`,
            color: difficultyColor,
            border: `1px solid ${difficultyColor}40`,
          }}
        >
          {difficulty}
        </span>

        {/* Click indicator */}
        {clickCount > 0 && (
          <span className="text-slate-600 text-xs">
            {clickCount}/4
          </span>
        )}
      </button>

      {/* Level name */}
      <h1 className="text-lg sm:text-xl font-semibold text-slate-200 tracking-wide">
        {levelName}
      </h1>

      {/* Progress section */}
      <div className="w-full space-y-2">
        {/* Stats row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Pieces</span>
            <span
              className={`font-bold text-lg tabular-nums ${
                isComplete
                  ? 'text-green-400'
                  : isNearTarget
                  ? 'text-yellow-400'
                  : 'text-white'
              }`}
            >
              {currentPieces}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 tabular-nums">{targetPieces}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Moves</span>
            <span className="font-bold text-white tabular-nums">{moveCount}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isComplete
                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                : isNearTarget
                ? 'linear-gradient(90deg, #eab308, #facc15)'
                : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stuck warning */}
      <AnimatePresence>
        {isStuck && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30"
          >
            <span className="text-red-400 text-sm font-medium">
              No moves left!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restart button */}
      <button
        onClick={onRestart}
        className={`
          px-5 py-2 rounded-lg text-sm font-medium
          transition-all duration-200
          ${isStuck
            ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white'
            : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white'
          }
        `}
      >
        {isStuck ? 'Restart Level' : 'Restart'}
      </button>
    </div>
  );
};
