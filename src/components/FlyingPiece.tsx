// FlyingPiece.tsx - Tüpler arası uçan parça animasyonu (ark ile)

import { motion } from 'framer-motion';
import type { Piece } from '../engine/types';
import { getColorForValue, getTextColorForValue } from '../utils/colors';
import { ANIMATION_DURATIONS, ANIMATION_VALUES, GAME_CONSTANTS } from '../utils/constants';

export interface FlyingPieceState {
  piece: Piece;
  fromRect: DOMRect;
  toRect: DOMRect;
}

interface FlyingPieceProps {
  flyingState: FlyingPieceState;
  onAnimationComplete: () => void;
}

export const FlyingPiece = ({ flyingState, onAnimationComplete }: FlyingPieceProps) => {
  const { piece, fromRect, toRect } = flyingState;
  const bgColor = getColorForValue(piece.value);
  const textColor = getTextColorForValue(piece.value);

  // Calculate start position (piece is already lifted due to selection)
  const startX = fromRect.left;
  const startY = fromRect.top + ANIMATION_VALUES.SELECT_LIFT_Y;

  // Calculate end position (center of target slot)
  const endX = toRect.left;
  const endY = toRect.top;

  // Calculate vertical distance for dynamic arc height
  const verticalDistance = Math.abs(endY - startY);
  const horizontalDistance = Math.abs(endX - startX);

  // Dynamic arc height: more arc for cross-row (larger vertical distance)
  // Base arc + extra based on vertical travel
  const baseArcHeight = ANIMATION_VALUES.FLY_ARC_HEIGHT;
  const extraArc = verticalDistance > 100 ? Math.min(verticalDistance * 0.3, 80) : 0;
  const arcHeight = baseArcHeight + extraArc;

  // Calculate arc midpoint (higher point for curved path)
  const midX = (startX + endX) / 2;
  // For cross-row moves, make the arc go above both points
  const highestPoint = Math.min(startY, endY);
  const midY = highestPoint - arcHeight;

  // Longer duration for cross-row movement
  const baseDuration = ANIMATION_DURATIONS.PIECE_MOVE / 1000;
  const distanceFactor = Math.max(1, (verticalDistance + horizontalDistance) / 200);
  const duration = Math.min(baseDuration * distanceFactor, 0.4); // Cap at 400ms

  return (
    <motion.div
      className="fixed flex items-center justify-center rounded-lg font-bold select-none pointer-events-none"
      style={{
        width: GAME_CONSTANTS.PIECE_WIDTH,
        height: GAME_CONSTANTS.PIECE_HEIGHT,
        backgroundColor: bgColor,
        color: textColor,
        fontSize: piece.value >= 1000 ? '0.7rem' : piece.value >= 100 ? '0.8rem' : '1rem',
        boxShadow: `0 6px 16px -4px ${bgColor}60, 0 4px 8px rgba(0,0,0,0.2)`,
        zIndex: 1000,
        left: 0,
        top: 0,
      }}
      initial={{
        x: startX,
        y: startY,
        scale: ANIMATION_VALUES.SELECT_SCALE,
      }}
      animate={{
        x: [startX, midX, endX],
        y: [startY, midY, endY],
        scale: [ANIMATION_VALUES.SELECT_SCALE, 1.05, 1],
      }}
      transition={{
        duration,
        ease: 'easeInOut',
        times: [0, 0.5, 1],
      }}
      onAnimationComplete={onAnimationComplete}
    >
      {/* Inner highlight */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
        }}
      />

      {/* Glow effect during flight */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          boxShadow: `0 0 20px ${bgColor}70`,
          opacity: 0.8,
        }}
      />

      {/* Value text */}
      <span className="relative z-10 drop-shadow-sm">{piece.value}</span>
    </motion.div>
  );
};
