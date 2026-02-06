// LevelList.tsx - Level list with drag reorder support

import { useState, useRef, useCallback } from 'react';
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
  const selectedItemRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedLevelId]); // eslint-disable-line react-hooks/exhaustive-deps

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
          const diffColor = getDifficultyColor(level.difficulty);

          return (
            <div
              key={level.id}
              ref={isSelected ? selectedItemRef : undefined}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectLevel(level.id)}
              className={`
                px-2 py-1.5 border-b border-slate-800 cursor-pointer transition-all
                ${isSelected ? 'bg-slate-700' : 'hover:bg-slate-800'}
                ${isDragged ? 'opacity-50' : ''}
                ${isDragOver ? 'border-t-2 border-t-blue-500' : ''}
              `}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-xs cursor-grab leading-none">⋮⋮</span>
                <span className="text-slate-400 text-xs font-mono w-7 flex-shrink-0">#{level.id}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: diffColor }}
                  title={level.difficulty}
                />
                <span className="text-white text-xs truncate flex-1">{level.name}</span>
                <span className="text-slate-500 text-xs flex-shrink-0">{level.tubes.length}t</span>
                {!validation.isValid && (
                  <span className="text-red-500 text-xs flex-shrink-0" title={validation.errors.join(', ')}>!</span>
                )}
                {validation.warnings.length > 0 && validation.isValid && (
                  <span className="text-yellow-500 text-xs flex-shrink-0" title={validation.warnings.join(', ')}>!</span>
                )}
                {isSelected && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDuplicateLevel(level.id); }}
                      className="px-1 text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0"
                      title="Duplicate"
                    >
                      +
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm('Delete this level?')) onDeleteLevel(level.id); }}
                      className="px-1 text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                      title="Delete"
                    >
                      x
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
