// EditorPage.tsx - Main level editor page

import { useReducer, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { editorReducer, initialEditorState } from './editorReducer';
import { LevelList } from './LevelList';
import { TubeEditor } from './TubeEditor';
import { ToolPalette } from './ToolPalette';
import { ActionBar } from './ActionBar';
import { LevelSettings } from './LevelSettings';
import { useSolver } from './useSolver';
import type { Level } from '../engine/types';

const API_URL = 'http://localhost:3002/api';

export function EditorPage() {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  const selectedLevel = state.levels.find(l => l.id === state.selectedLevelId) || null;

  // Async solver for minimum pieces calculation
  const { minPieces: solverMin, isCalculating: isSolving } = useSolver(selectedLevel);

  // Load levels on mount
  useEffect(() => {
    fetchLevels();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch({ type: 'REDO' });
        } else {
          dispatch({ type: 'UNDO' });
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (state.isDirty) {
          saveLevels();
        }
      }
      // Arrow key navigation between levels
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Don't hijack arrows when typing in an input/textarea/select
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        const currentIndex = state.levels.findIndex(l => l.id === state.selectedLevelId);
        if (currentIndex === -1) return;
        const nextIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex >= 0 && nextIndex < state.levels.length) {
          dispatch({ type: 'SELECT_LEVEL', levelId: state.levels[nextIndex].id });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isDirty, state.levels, state.selectedLevelId]);

  const fetchLevels = async () => {
    try {
      const res = await fetch(`${API_URL}/levels`);
      if (!res.ok) throw new Error('Failed to fetch levels');
      const data = await res.json();
      dispatch({ type: 'SET_LEVELS', levels: data.levels || [] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to load levels. Is the server running?' });
    }
  };

  const saveLevels = async () => {
    dispatch({ type: 'SET_SAVING', value: true });
    try {
      // Compact pieces before saving (remove nulls, pieces fall down)
      const compactedLevels = state.levels.map(level => ({
        ...level,
        tubes: level.tubes.map(tube => ({
          ...tube,
          initialPieces: tube.initialPieces.filter((p): p is number => p !== null && p !== undefined),
        })),
      }));

      const res = await fetch(`${API_URL}/levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levels: compactedLevels }),
      });
      if (!res.ok) throw new Error('Failed to save levels');
      // Update state with compacted levels
      dispatch({ type: 'SET_LEVELS', levels: compactedLevels });
      dispatch({ type: 'SET_ERROR', error: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to save levels' });
    } finally {
      dispatch({ type: 'SET_SAVING', value: false });
    }
  };

  const handleUpdateLevel = useCallback((level: Level) => {
    dispatch({ type: 'UPDATE_LEVEL', level });
  }, []);

  const handleTest = () => {
    if (selectedLevel) {
      // Store level in sessionStorage for testing
      sessionStorage.setItem('testLevel', JSON.stringify(selectedLevel));
      window.open('/?test=true', '_blank');
    }
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">
            &larr; Back to Game
          </Link>
          <h1 className="text-lg font-bold text-white">Level Editor</h1>
        </div>
        {state.isDirty && (
          <span className="text-xs text-yellow-500">Unsaved changes</span>
        )}
      </div>

      {/* Action Bar */}
      <ActionBar
        level={selectedLevel}
        isDirty={state.isDirty}
        isSaving={state.isSaving}
        canUndo={state.historyIndex > 0}
        canRedo={state.historyIndex < state.history.length - 1}
        solverMin={solverMin}
        isSolving={isSolving}
        onSave={saveLevels}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onTest={handleTest}
        onUpdateLevel={handleUpdateLevel}
      />

      {/* Error message */}
      {state.error && (
        <div className="bg-red-900/50 border-b border-red-700 px-4 py-2 text-sm text-red-300">
          {state.error}
          <button
            onClick={() => dispatch({ type: 'SET_ERROR', error: null })}
            className="ml-4 text-red-400 hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Level list sidebar */}
        <div className="w-52 flex-shrink-0">
          <LevelList
            levels={state.levels}
            selectedLevelId={state.selectedLevelId}
            onSelectLevel={(id) => dispatch({ type: 'SELECT_LEVEL', levelId: id })}
            onAddLevel={() => dispatch({ type: 'ADD_LEVEL' })}
            onDeleteLevel={(id) => dispatch({ type: 'DELETE_LEVEL', levelId: id })}
            onDuplicateLevel={(id) => dispatch({ type: 'DUPLICATE_LEVEL', levelId: id })}
            onReorderLevels={(from, to) => dispatch({ type: 'REORDER_LEVELS', fromIndex: from, toIndex: to })}
          />
        </div>

        {/* Main editor area */}
        <div className="flex-1 overflow-auto p-6">
          {selectedLevel ? (
            <div className="flex gap-6">
              {/* Tube editor + Piece palette */}
              <div className="flex-1">
                <div className="bg-slate-900/50 rounded-xl p-6 min-h-[400px]">
                  <TubeEditor
                    level={selectedLevel}
                    selectedTubeIndex={state.selectedTubeIndex}
                    selectedPieceValue={state.selectedPieceValue}
                    onSelectTube={(index) => dispatch({ type: 'SELECT_TUBE', tubeIndex: index })}
                    onAddTube={() => dispatch({ type: 'ADD_TUBE' })}
                    onDeleteTube={(index) => dispatch({ type: 'DELETE_TUBE', tubeIndex: index })}
                    onUpdateTube={(index, tube) => dispatch({ type: 'UPDATE_TUBE', tubeIndex: index, tube })}
                    onSetTubeRow={(index, row) => dispatch({ type: 'SET_TUBE_ROW', tubeIndex: index, row })}
                    onAddPiece={(tubeIndex, value) => dispatch({ type: 'ADD_PIECE_TO_TUBE', tubeIndex, value })}
                    onRemovePiece={(tubeIndex, pieceIndex) => dispatch({ type: 'REMOVE_PIECE_FROM_TUBE', tubeIndex, pieceIndex })}
                    toolPalette={
                      <ToolPalette
                        selectedValue={state.selectedPieceValue}
                        onSelectValue={(value) => dispatch({ type: 'SELECT_PIECE_VALUE', value })}
                      />
                    }
                  />
                </div>
              </div>

              {/* Right sidebar - only level settings */}
              <div className="w-72 flex-shrink-0 space-y-4">
                <LevelSettings
                  level={selectedLevel}
                  solverMin={solverMin}
                  isSolving={isSolving}
                  onUpdateLevel={handleUpdateLevel}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <p className="text-lg mb-2">Select a level to edit</p>
                <p className="text-sm">or click "Add" to create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
