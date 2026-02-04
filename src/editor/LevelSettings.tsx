// LevelSettings.tsx - Level metadata settings panel

import type { Level, DifficultyGroup } from '../engine/types';
import { validateLevel } from './validation';

interface LevelSettingsProps {
  level: Level;
  solverMin: number | null;
  isSolving: boolean;
  onUpdateLevel: (level: Level) => void;
}

const DIFFICULTIES: DifficultyGroup[] = [
  'Beginner',
  'Easy',
  'Medium',
  'Hard',
  'Expert',
  'Master',
  'Grandmaster',
];

export function LevelSettings({ level, solverMin, isSolving, onUpdateLevel }: LevelSettingsProps) {
  const validation = validateLevel(level);

  return (
    <div className="bg-slate-800 p-4 rounded-lg space-y-4">
      <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">
        Level Settings
      </h3>

      {/* Name */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Name</label>
        <input
          type="text"
          value={level.name}
          onChange={(e) => onUpdateLevel({ ...level, name: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="Level name..."
        />
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Difficulty</label>
        <select
          value={level.difficulty}
          onChange={(e) => onUpdateLevel({ ...level, difficulty: e.target.value as DifficultyGroup })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
        >
          {DIFFICULTIES.map((diff) => (
            <option key={diff} value={diff}>
              {diff}
            </option>
          ))}
        </select>
      </div>

      {/* Target Piece Count */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Target Piece Count
          <span className="ml-1">
            (min:{' '}
            {isSolving ? (
              <span className="text-blue-400 animate-pulse">...</span>
            ) : solverMin !== null ? (
              <span className="text-green-400">{solverMin}</span>
            ) : (
              <span className="text-slate-500">-</span>
            )}
            )
          </span>
        </label>
        <input
          type="number"
          min={1}
          value={level.targetPieceCount}
          onChange={(e) => onUpdateLevel({ ...level, targetPieceCount: parseInt(e.target.value) || 1 })}
          className={`w-full px-3 py-2 bg-slate-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            solverMin !== null && level.targetPieceCount < solverMin
              ? 'border-yellow-500'
              : 'border-slate-600'
          }`}
        />
        {solverMin !== null && level.targetPieceCount < solverMin && (
          <p className="text-xs text-yellow-400 mt-1">
            Below solver minimum ({solverMin}) - may be impossible
          </p>
        )}
      </div>

      {/* Validation Results */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="border-t border-slate-700 pt-3">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">Validation</h4>

          {validation.errors.map((error, i) => (
            <div key={`error-${i}`} className="flex items-start gap-2 text-xs text-red-400 mb-1">
              <span>!</span>
              <span>{error}</span>
            </div>
          ))}

          {validation.warnings.map((warning, i) => (
            <div key={`warning-${i}`} className="flex items-start gap-2 text-xs text-yellow-400 mb-1">
              <span>!</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="border-t border-slate-700 pt-3">
        <h4 className="text-xs font-semibold text-slate-400 mb-2">Statistics</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-slate-500">Total Pieces:</div>
          <div className="text-slate-300">{validation.stats.totalPieces}</div>
          <div className="text-slate-500">Total Value:</div>
          <div className="text-slate-300">{validation.stats.totalValue}</div>
          <div className="text-slate-500">Empty Tubes:</div>
          <div className="text-slate-300">{validation.stats.emptyTubes}</div>
          <div className="text-slate-500">Tube Count:</div>
          <div className="text-slate-300">{level.tubes.length}</div>
        </div>
      </div>
    </div>
  );
}
