// Tube.tsx - Tek bir tüp componenti

import { motion } from 'framer-motion';
import type { Tube as TubeType } from '../engine/types';
import { Piece } from './Piece';
import type { PieceAnimationState } from './Piece';
import { ANIMATION_DURATIONS, ANIMATION_VALUES, GAME_CONSTANTS } from '../utils/constants';

interface TubeProps {
  tube: TubeType;
  tubeWidth: number;
  isSelected: boolean;
  isInvalidTarget: boolean;
  pieceAnimationStates: Record<string, PieceAnimationState>;
  mergingPieceId: string | null;
  hiddenPieceId: string | null;  // Piece being animated (flying)
  onClick: (tubeId: string) => void;
}

// Calculate fixed tube height based on capacity (FIXED piece size)
const calculateTubeHeight = (capacity: number): number => {
  const slotHeight = GAME_CONSTANTS.PIECE_HEIGHT + GAME_CONSTANTS.PIECE_GAP;
  return capacity * slotHeight + GAME_CONSTANTS.TUBE_PADDING + 4; // +4 for bottom cap
};

export const Tube = ({
  tube,
  tubeWidth,
  isSelected,
  isInvalidTarget,
  pieceAnimationStates,
  mergingPieceId,
  hiddenPieceId,
  onClick,
}: TubeProps) => {
  // Use FIXED piece height from constants
  const pieceHeight = GAME_CONSTANTS.PIECE_HEIGHT;
  const tubeHeight = calculateTubeHeight(tube.capacity);
  const emptySlots = tube.capacity - tube.pieces.length;

  // Shake animation for invalid moves
  const shakeAnimation = isInvalidTarget
    ? {
        x: [
          0,
          -ANIMATION_VALUES.SHAKE_DISTANCE,
          ANIMATION_VALUES.SHAKE_DISTANCE,
          -ANIMATION_VALUES.SHAKE_DISTANCE,
          ANIMATION_VALUES.SHAKE_DISTANCE,
          -ANIMATION_VALUES.SHAKE_DISTANCE * 0.5,
          ANIMATION_VALUES.SHAKE_DISTANCE * 0.5,
          0,
        ],
      }
    : { x: 0 };

  return (
    <motion.div
      className="relative cursor-pointer flex-shrink-0"
      data-tube-id={tube.id}
      style={{
        width: tubeWidth,
      }}
      onClick={() => onClick(tube.id)}
      animate={shakeAnimation}
      transition={{
        duration: ANIMATION_DURATIONS.INVALID_SHAKE / 1000,
        ease: 'easeInOut',
      }}
    >
      {/* Tube container with glass effect - FIXED SIZE based on capacity */}
      <div
        className={`
          relative flex flex-col-reverse p-2 pt-3
          rounded-t-xl rounded-b-3xl
          ${isSelected
            ? 'ring-2 ring-blue-400/80 ring-offset-2 ring-offset-slate-900'
            : ''
          }
        `}
        style={{
          height: tubeHeight,
          gap: GAME_CONSTANTS.PIECE_GAP,
          overflow: 'hidden', // Prevent scale animations from affecting size
          background: isSelected
            ? 'linear-gradient(180deg, #475569 0%, #334155 100%)'
            : 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
          boxShadow: isSelected
            ? '0 8px 24px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Glass highlight effect */}
        <div
          className="absolute top-0 left-0 right-0 h-8 rounded-t-xl pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
          }}
        />

        {/* Side reflections */}
        <div
          className="absolute top-2 bottom-4 left-1 w-1 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
          }}
        />

        {/* Pieces container - takes remaining space */}
        <div
          className="relative flex flex-col-reverse flex-1"
          style={{ gap: GAME_CONSTANTS.PIECE_GAP }}
        >
          {/* Render pieces */}
          {tube.pieces.map((piece, index) => {
            const animState = pieceAnimationStates[piece.id] ||
              (isSelected ? 'selected' : 'idle');
            const isTopPiece = index === tube.pieces.length - 1;
            const showMergeEffect = piece.id === mergingPieceId;
            const isHidden = piece.id === hiddenPieceId;

            return (
              <div
                key={piece.id}
                data-piece-id={piece.id}
                style={{ opacity: isHidden ? 0 : 1 }}
              >
                <Piece
                  piece={piece}
                  pieceHeight={pieceHeight}
                  isTopPiece={isTopPiece}
                  animationState={animState}
                  showMergeEffect={showMergeEffect}
                />
              </div>
            );
          })}

          {/* Empty slots indicator (subtle) - renders at top due to flex-col-reverse */}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="rounded-lg flex-shrink-0"
              style={{
                height: pieceHeight,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom cap / base of the tube */}
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-2 rounded-b-full"
        style={{
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 1) 100%)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
        }}
      />
    </motion.div>
  );
};
