// TubeEditor.tsx - Visual tube editing with two-row support

import type { ReactNode } from 'react';
import type { Level, TubeConfig } from '../engine/types';
import { getColorForValue } from '../utils/colors';
import { GAME_CONSTANTS } from '../utils/constants';

interface TubeEditorProps {
  level: Level;
  selectedTubeIndex: number | null;
  selectedPieceValue: number | null;
  onSelectTube: (index: number | null) => void;
  onAddTube: () => void;
  onDeleteTube: (index: number) => void;
  onUpdateTube: (index: number, tube: TubeConfig) => void;
  onSetTubeRow: (index: number, row: 'top' | 'bottom') => void;
  onAddPiece: (tubeIndex: number, value: number) => void;
  onRemovePiece: (tubeIndex: number, pieceIndex: number) => void;
  toolPalette?: ReactNode;
}

export function TubeEditor({
  level,
  selectedTubeIndex,
  selectedPieceValue,
  onSelectTube,
  onAddTube,
  onDeleteTube,
  onUpdateTube,
  onSetTubeRow,
  onAddPiece: _onAddPiece,
  onRemovePiece,
  toolPalette,
}: TubeEditorProps) {
  // Match Board.tsx auto-split logic: if no explicit row assignments and 6+ tubes, auto-split
  const hasExplicitRows = level.tubes.some(t => t.row === 'bottom');
  const allTubes = level.tubes.map((tube, index) => ({ tube, index }));

  let topRowTubes: typeof allTubes;
  let bottomRowTubes: typeof allTubes;

  if (hasExplicitRows) {
    topRowTubes = allTubes.filter(({ tube }) => !tube.row || tube.row === 'top');
    bottomRowTubes = allTubes.filter(({ tube }) => tube.row === 'bottom');
  } else if (level.tubes.length >= 6) {
    const splitAt = Math.ceil(level.tubes.length / 2);
    topRowTubes = allTubes.slice(0, splitAt);
    bottomRowTubes = allTubes.slice(splitAt);
  } else {
    topRowTubes = allTubes;
    bottomRowTubes = [];
  }

  const handleTubeClick = (index: number) => {
    onSelectTube(index === selectedTubeIndex ? null : index);
  };

  const handleSlotClick = (tubeIndex: number, slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const tube = level.tubes[tubeIndex];

    if (e.button === 2) {
      // Right click - remove piece (set to null, don't shift)
      if (tube.initialPieces[slotIndex] !== undefined && tube.initialPieces[slotIndex] !== null) {
        onRemovePiece(tubeIndex, slotIndex);
      }
      return;
    }

    // Left click with selected piece value
    if (selectedPieceValue) {
      const currentValue = tube.initialPieces[slotIndex];

      if (currentValue !== undefined && currentValue !== null) {
        // Replace existing piece
        const newPieces = [...tube.initialPieces];
        newPieces[slotIndex] = selectedPieceValue;
        onUpdateTube(tubeIndex, { ...tube, initialPieces: newPieces });
      } else if (slotIndex < tube.capacity) {
        // Add to empty slot (expand array if needed with nulls)
        const newPieces = [...tube.initialPieces];
        // Fill gaps with null if needed
        while (newPieces.length <= slotIndex) {
          newPieces.push(null as unknown as number);
        }
        newPieces[slotIndex] = selectedPieceValue;
        onUpdateTube(tubeIndex, { ...tube, initialPieces: newPieces });
      }
    }
  };

  const renderTube = (tube: TubeConfig, index: number) => {
    const { TUBE_WIDTH, PIECE_WIDTH, PIECE_HEIGHT, PIECE_GAP, TUBE_PADDING } = GAME_CONSTANTS;
    const isSelected = selectedTubeIndex === index;
    const tubeHeight = tube.capacity * (PIECE_HEIGHT + PIECE_GAP) + TUBE_PADDING;

    return (
      <div
        key={index}
        className={`
          relative flex flex-col items-center
          ${isSelected ? 'z-10' : ''}
        `}
      >
        {/* Tube index label */}
        <div className="text-xs text-slate-500 mb-1">#{index + 1}</div>

        {/* Tube container */}
        <div
          onContextMenu={(e) => e.preventDefault()}
          className={`
            relative rounded-lg transition-all
            ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
          `}
          style={{
            width: TUBE_WIDTH,
            height: tubeHeight,
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '2px solid rgba(71, 85, 105, 0.5)',
          }}
        >
          {/* Capacity slots */}
          {Array.from({ length: tube.capacity }).map((_, slotIndex) => {
            const piece = tube.initialPieces[slotIndex];
            const isEmpty = piece === undefined || piece === null;

            return (
              <div
                key={slotIndex}
                onClick={(e) => handleSlotClick(index, slotIndex, e)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleSlotClick(index, slotIndex, e);
                }}
                className={`
                  absolute rounded transition-all cursor-pointer
                  ${isEmpty && selectedPieceValue ? 'hover:opacity-80' : ''}
                  ${!isEmpty ? 'hover:brightness-110' : ''}
                `}
                style={{
                  width: PIECE_WIDTH,
                  height: PIECE_HEIGHT,
                  left: (TUBE_WIDTH - PIECE_WIDTH) / 2,
                  bottom: slotIndex * (PIECE_HEIGHT + PIECE_GAP) + PIECE_GAP,
                  backgroundColor: isEmpty
                    ? (selectedPieceValue ? 'rgba(71, 85, 105, 0.3)' : 'rgba(71, 85, 105, 0.15)')
                    : getColorForValue(piece),
                  border: isEmpty ? '1px dashed rgba(71, 85, 105, 0.5)' : 'none',
                }}
              >
                {!isEmpty && (
                  <span
                    className="absolute inset-0 flex items-center justify-center font-bold text-sm"
                    style={{ color: piece >= 64 ? '#fff' : '#1e293b' }}
                  >
                    {piece}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Select button below tube */}
        <button
          onClick={() => handleTubeClick(index)}
          className={`
            mt-2 px-2 py-1 text-xs rounded transition-all
            ${isSelected
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'}
          `}
        >
          {isSelected ? 'Selected' : 'Edit'}
        </button>
      </div>
    );
  };

  const renderRow = (tubes: { tube: TubeConfig; index: number }[], label: string) => (
    <div className="flex flex-col items-center">
      {label && <div className="text-xs text-slate-500 mb-2">{label}</div>}
      <div className="flex gap-4 justify-center flex-wrap items-end">
        {tubes.map(({ tube, index }) => renderTube(tube, index))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Add tube button */}
      <div className="flex justify-center">
        <button
          onClick={onAddTube}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          Add Tube
        </button>
      </div>

      {/* Top row */}
      {topRowTubes.length > 0 && renderRow(topRowTubes, bottomRowTubes.length > 0 ? 'Top Row' : '')}

      {/* Bottom row */}
      {bottomRowTubes.length > 0 && renderRow(bottomRowTubes, 'Bottom Row')}

      {/* Instructions */}
      <div className="text-center text-xs text-slate-500">
        Click empty slot to add piece • Right-click piece to remove
      </div>

      {/* Piece palette */}
      {toolPalette}

      {/* Fixed position tube settings panel */}
      <div className="bg-slate-800 p-4 rounded-lg min-h-[100px]">
        {selectedTubeIndex !== null ? (
          <>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Tube #{selectedTubeIndex + 1} Settings</h4>
            <div className="flex flex-wrap items-center gap-4">
              {/* Capacity */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Capacity:</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={level.tubes[selectedTubeIndex].capacity}
                  onChange={(e) => {
                    const newCapacity = Math.max(2, Math.min(10, parseInt(e.target.value) || 2));
                    const tube = level.tubes[selectedTubeIndex];
                    onUpdateTube(selectedTubeIndex, {
                      ...tube,
                      capacity: newCapacity,
                      initialPieces: tube.initialPieces.slice(0, newCapacity),
                    });
                  }}
                  className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>

              {/* Row selection */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Row:</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => onSetTubeRow(selectedTubeIndex, 'top')}
                    className={`px-3 py-1 text-sm rounded ${
                      !level.tubes[selectedTubeIndex].row || level.tubes[selectedTubeIndex].row === 'top'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    Top
                  </button>
                  <button
                    onClick={() => onSetTubeRow(selectedTubeIndex, 'bottom')}
                    className={`px-3 py-1 text-sm rounded ${
                      level.tubes[selectedTubeIndex].row === 'bottom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    Bottom
                  </button>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => {
                  if (confirm('Delete this tube?')) {
                    onDeleteTube(selectedTubeIndex);
                  }
                }}
                className="px-3 py-1 text-sm bg-red-900 hover:bg-red-800 text-red-300 rounded ml-auto"
              >
                Delete Tube
              </button>
            </div>
          </>
        ) : (
          <div className="text-slate-500 text-sm text-center py-4">
            Select a tube to edit its settings
          </div>
        )}
      </div>
    </div>
  );
}
