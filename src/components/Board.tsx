// Board.tsx - Tüpleri iki satırlı layout ile render eder

import { useMemo } from 'react';
import type { Tube as TubeType, TubeConfig } from '../engine/types';
import { Tube } from './Tube';
import type { PieceAnimationState } from './Piece';
import { GAME_CONSTANTS } from '../utils/constants';

interface BoardProps {
  tubes: TubeType[];
  tubeConfigs: TubeConfig[]; // Level'dan gelen row bilgisi için
  selectedTubeId: string | null;
  invalidTubeId: string | null;
  pieceAnimationStates: Record<string, PieceAnimationState>;
  mergingPieceId: string | null;
  hiddenPieceId: string | null;
  onTubeClick: (tubeId: string) => void;
}

// Tube with its row info
interface TubeWithRow {
  tube: TubeType;
  row: 'top' | 'bottom';
}

// Calculate tube height based on capacity (fixed piece size)
const calculateTubeHeight = (capacity: number): number => {
  const slotHeight = GAME_CONSTANTS.PIECE_HEIGHT + GAME_CONSTANTS.PIECE_GAP;
  return capacity * slotHeight + GAME_CONSTANTS.TUBE_PADDING + 4; // +4 for bottom cap
};

// Calculate the maximum tube height in a row
const getMaxTubeHeight = (tubes: TubeType[], tubeConfigs: TubeConfig[], row: 'top' | 'bottom'): number => {
  let maxHeight = 0;
  tubes.forEach((tube, index) => {
    const config = tubeConfigs[index];
    const tubeRow = config?.row || 'top';
    if (tubeRow === row) {
      const height = calculateTubeHeight(tube.capacity);
      if (height > maxHeight) maxHeight = height;
    }
  });
  return maxHeight;
};

export const Board = ({
  tubes,
  tubeConfigs,
  selectedTubeId,
  invalidTubeId,
  pieceAnimationStates,
  mergingPieceId,
  hiddenPieceId,
  onTubeClick,
}: BoardProps) => {
  // Split tubes into top and bottom rows
  const { topRowTubes, bottomRowTubes } = useMemo(() => {
    const top: TubeWithRow[] = [];
    const bottom: TubeWithRow[] = [];

    // Check if any tube has an explicit row assignment
    const hasExplicitRows = tubeConfigs.some(c => c.row === 'bottom');

    if (hasExplicitRows) {
      // Use explicit row assignments from level config
      tubes.forEach((tube, index) => {
        const config = tubeConfigs[index];
        const row = config?.row || 'top';
        if (row === 'bottom') {
          bottom.push({ tube, row });
        } else {
          top.push({ tube, row });
        }
      });
    } else if (tubes.length >= 6) {
      // Auto-split: first half top, second half bottom
      const splitAt = Math.ceil(tubes.length / 2);
      tubes.forEach((tube, index) => {
        if (index < splitAt) {
          top.push({ tube, row: 'top' });
        } else {
          bottom.push({ tube, row: 'bottom' });
        }
      });
    } else {
      // 5 or fewer tubes: single row
      tubes.forEach((tube) => {
        top.push({ tube, row: 'top' });
      });
    }

    return { topRowTubes: top, bottomRowTubes: bottom };
  }, [tubes, tubeConfigs]);

  // Check if we have two rows
  const hasTwoRows = bottomRowTubes.length > 0;

  // Calculate max heights for proper spacing
  const maxTopHeight = useMemo(() =>
    getMaxTubeHeight(tubes, tubeConfigs, 'top'), [tubes, tubeConfigs]);
  const maxBottomHeight = useMemo(() =>
    getMaxTubeHeight(tubes, tubeConfigs, 'bottom'), [tubes, tubeConfigs]);

  // Render a single row of tubes
  const renderRow = (rowTubes: TubeWithRow[], rowMaxHeight: number, _isBottomRow: boolean) => (
    <div
      className="flex justify-center gap-3"
      style={{
        minHeight: rowMaxHeight,
        alignItems: 'flex-end',
      }}
    >
      {rowTubes.map(({ tube }) => (
        <Tube
          key={tube.id}
          tube={tube}
          tubeWidth={GAME_CONSTANTS.TUBE_WIDTH}
          isSelected={tube.id === selectedTubeId}
          isInvalidTarget={tube.id === invalidTubeId}
          pieceAnimationStates={pieceAnimationStates}
          mergingPieceId={mergingPieceId}
          hiddenPieceId={hiddenPieceId}
          onClick={onTubeClick}
        />
      ))}
    </div>
  );

  return (
    <div
      className="relative rounded-2xl p-3 sm:p-6 w-full"
      style={{
        maxWidth: GAME_CONSTANTS.BOARD_MAX_WIDTH,
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Tubes container with rows */}
      <div
        className="relative flex flex-col"
        style={{
          gap: hasTwoRows ? GAME_CONSTANTS.ROW_GAP : 0,
        }}
      >
        {/* Top row */}
        {topRowTubes.length > 0 && renderRow(topRowTubes, maxTopHeight, false)}

        {/* Bottom row */}
        {bottomRowTubes.length > 0 && renderRow(bottomRowTubes, maxBottomHeight, true)}
      </div>
    </div>
  );
};
