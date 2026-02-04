// ActionBar.tsx - Save, test, validate action buttons

import type { Level } from '../engine/types';
import { validateLevel } from './validation';

interface ActionBarProps {
  level: Level | null;
  isDirty: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  solverMin: number | null;
  isSolving: boolean;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTest: () => void;
  onUpdateLevel: (level: Level) => void;
}

export function ActionBar({
  level,
  isDirty,
  isSaving,
  canUndo,
  canRedo,
  solverMin,
  isSolving,
  onSave,
  onUndo,
  onRedo,
  onTest,
  onUpdateLevel,
}: ActionBarProps) {
  const validation = level ? validateLevel(level) : null;

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            canUndo
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            canRedo
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>

        <div className="w-px h-6 bg-slate-700 mx-2" />

        {/* Save */}
        <button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            isDirty && !isSaving
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : isDirty ? 'Save All' : 'Saved'}
        </button>

        {/* Test level */}
        {level && (
          <button
            onClick={onTest}
            disabled={!validation?.isValid}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              validation?.isValid
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
            title={validation?.isValid ? 'Test this level in game' : 'Fix errors first'}
          >
            Test Level
          </button>
        )}
      </div>

      {/* Validation status */}
      {level && validation && (
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>Pieces: {validation.stats.totalPieces}</span>
            <span>Value: {validation.stats.totalValue}</span>
            {/* Solver min with loading indicator */}
            <span className="flex items-center gap-1">
              <span className="text-slate-500">Min:</span>
              {isSolving ? (
                <span className="text-blue-400 animate-pulse">...</span>
              ) : solverMin !== null ? (
                <span className="text-green-400 font-medium">{solverMin}</span>
              ) : (
                <span className="text-slate-500">-</span>
              )}
            </span>
          </div>

          {/* Auto-calculate target button */}
          {solverMin !== null && level.targetPieceCount !== solverMin && !isSolving && (
            <button
              onClick={() => {
                onUpdateLevel({ ...level, targetPieceCount: solverMin });
              }}
              className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 text-white rounded"
              title="Set target to solver minimum"
            >
              Auto Target
            </button>
          )}

          {/* Validation indicators */}
          {validation.errors.length > 0 ? (
            <div className="flex items-center gap-1 text-red-400">
              <span className="text-sm">!</span>
              <span className="text-xs">{validation.errors.length} error(s)</span>
            </div>
          ) : validation.warnings.length > 0 ? (
            <div className="flex items-center gap-1 text-yellow-400">
              <span className="text-sm">!</span>
              <span className="text-xs">{validation.warnings.length} warning(s)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-400">
              <span className="text-sm">✓</span>
              <span className="text-xs">Valid</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
