// Piece.tsx - Tek bir parça componenti

import { motion } from 'framer-motion';
import type { Piece as PieceType } from '../engine/types';
import { getColorForValue, getTextColorForValue } from '../utils/colors';
import { ANIMATION_DURATIONS, ANIMATION_VALUES, GAME_CONSTANTS, EASING } from '../utils/constants';
import { MergeEffect } from './MergeEffect';

export type PieceAnimationState =
  | 'idle'
  | 'selected'
  | 'squishing'
  | 'merging'
  | 'chainHighlight'
  | 'exiting';

interface PieceProps {
  piece: PieceType;
  pieceHeight?: number;
  isTopPiece: boolean;
  animationState?: PieceAnimationState;
  showMergeEffect?: boolean;
  onMergeEffectComplete?: () => void;
}

export const Piece = ({
  piece,
  pieceHeight = GAME_CONSTANTS.MIN_PIECE_HEIGHT,
  isTopPiece,
  animationState = 'idle',
  showMergeEffect = false,
  onMergeEffectComplete,
}: PieceProps) => {
  const bgColor = getColorForValue(piece.value);
  const textColor = getTextColorForValue(piece.value);
  const isLifted = animationState === 'selected' && isTopPiece;

  // Determine scale based on animation state
  const getScale = () => {
    switch (animationState) {
      case 'selected':
        return isTopPiece ? ANIMATION_VALUES.SELECT_SCALE : 1;
      case 'squishing':
        return ANIMATION_VALUES.SQUISH_SCALE;
      case 'merging':
        return ANIMATION_VALUES.MERGE_SCALE_MAX;
      case 'chainHighlight':
        return ANIMATION_VALUES.CHAIN_HIGHLIGHT_SCALE;
      default:
        return 1;
    }
  };

  // Determine Y position
  const getY = () => {
    if (animationState === 'selected' && isTopPiece) {
      return ANIMATION_VALUES.SELECT_LIFT_Y;
    }
    return 0;
  };

  // Get transition based on state
  const getTransition = () => {
    switch (animationState) {
      case 'squishing':
        return {
          duration: ANIMATION_DURATIONS.MERGE_SQUISH / 1000,
          ease: 'easeIn' as const,
        };
      case 'merging':
        return {
          duration: ANIMATION_DURATIONS.MERGE_POP / 1000,
          ease: EASING.MERGE_POP as [number, number, number, number],
        };
      case 'chainHighlight':
        return {
          duration: ANIMATION_DURATIONS.CHAIN_HIGHLIGHT / 1000,
          ease: 'easeOut' as const,
        };
      default:
        return {
          type: 'spring' as const,
          stiffness: 400,
          damping: 25,
        };
    }
  };

  return (
    <div
      className="relative"
      style={{
        height: pieceHeight,
        width: '100%',
      }}
    >
      <motion.div
        key={piece.id}
        className="absolute inset-0 flex items-center justify-center rounded-lg font-bold select-none"
        style={{
          backgroundColor: bgColor,
          color: textColor,
          fontSize: piece.value >= 1000
            ? `${pieceHeight * 0.4}px`
            : piece.value >= 100
            ? `${pieceHeight * 0.45}px`
            : `${pieceHeight * 0.5}px`,
          boxShadow: isLifted || animationState === 'chainHighlight'
            ? `0 6px 16px -4px ${bgColor}60, 0 4px 8px -2px rgba(0,0,0,0.2)`
            : animationState === 'merging'
            ? `0 0 24px ${bgColor}80`
            : `0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)`,
          transformOrigin: 'center center',
        }}
        initial={animationState === 'merging' ? { scale: 0, opacity: 0 } : false}
        animate={{
          y: getY(),
          scale: getScale(),
          opacity: animationState === 'exiting' ? 0 : 1,
        }}
        exit={{
          scale: 0.5,
          opacity: 0,
          transition: { duration: 0.1 }
        }}
        transition={getTransition()}
        whileTap={animationState === 'idle' ? { scale: 0.95 } : undefined}
      >
        {/* Inner highlight */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }}
        />

        {/* Glow effect for selected/highlighted piece - static glow, no infinite animation */}
        {(isLifted || animationState === 'chainHighlight') && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              boxShadow: `0 0 20px ${bgColor}80`,
              opacity: 0.8,
            }}
          />
        )}

        {/* Merge effect particles */}
        <MergeEffect
          isActive={showMergeEffect}
          value={piece.value}
          onComplete={onMergeEffectComplete}
        />

        {/* Value text */}
        <motion.span
          className="relative z-10 drop-shadow-sm"
          initial={animationState === 'merging' ? { scale: 0 } : false}
          animate={{ scale: 1 }}
          transition={animationState === 'merging' ? {
            delay: 0.1,
            type: 'spring',
            stiffness: 500,
            damping: 15,
          } : undefined}
        >
          {piece.value}
        </motion.span>
      </motion.div>
    </div>
  );
};
