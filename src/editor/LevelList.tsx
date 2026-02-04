// LevelList.tsx - Level list with drag reorder support

import { useState, useRef } from 'react';
import type { Level } from '../engine/types';
import { validateLevel } from './validation';
import { getDifficultyColor } from '../data/levels';

interface LevelListProps {
  levels: Level[];
  selectedLevelId: number | null;
  onSelectLevel: (id: number) => void;
  onAddLevel: () => void;
  onDeleteLevel: (id: number) => void;
  onDuplicateLevel: (id: number) => void;
  onReorderLevels: (fromIndex: number, toIndex: number) => void;
}

export function LevelList({
  levels,
  selectedLevelId,
  onSelectLevel,
  onAddLevel,
  onDeleteLevel,
  onDuplicateLevel,
  onReorderLevels,
}: LevelListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragRef.current !== null && dragRef.current !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragRef.current !== null && dragRef.current !== toIndex) {
      onReorderLevels(dragRef.current, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Levels ({levels.length})</h2>
        <button
          onClick={onAddLevel}
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          + Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {levels.map((level, index) => {
          const validation = validateLevel(level);
          const isSelected = level.id === selectedLevelId;
          const isDragged = index === draggedIndex;
          const isDragOver = index === dragOverIndex;

          return (
            <div
              key={level.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectLevel(level.id)}
              className={`
                p-3 border-b border-slate-800 cursor-pointer transition-all
                ${isSelected ? 'bg-slate-700' : 'hover:bg-slate-800'}
                ${isDragged ? 'opacity-50' : ''}
                ${isDragOver ? 'border-t-2 border-t-blue-500' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs cursor-grab">⋮⋮</span>
                  <span className="text-slate-400 text-xs font-mono">#{level.id}</span>
                  <span className="text-white text-sm truncate max-w-[120px]">{level.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {!validation.isValid && (
                    <span className="text-red-500 text-xs" title={validation.errors.join(', ')}>!</span>
                  )}
                  {validation.warnings.length > 0 && validation.isValid && (
                    <span className="text-yellow-500 text-xs" title={validation.warnings.join(', ')}>!</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: getDifficultyColor(level.difficulty), color: 'white' }}
                >
                  {level.difficulty}
                </span>
                <span className="text-slate-500 text-xs">
                  {level.tubes.length} tubes
                </span>
              </div>

              {isSelected && (
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateLevel(level.id);
                    }}
                    className="px-2 py-0.5 text-xs bg-slate-600 hover:bg-slate-500 text-slate-300 rounded transition-colors"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this level?')) {
                        onDeleteLevel(level.id);
                      }
                    }}
                    className="px-2 py-0.5 text-xs bg-red-900 hover:bg-red-800 text-red-300 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
