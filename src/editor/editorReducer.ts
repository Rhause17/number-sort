// editorReducer.ts - Editor state management with undo/redo

import type { Level, TubeConfig, DifficultyGroup } from '../engine/types';

export interface EditorState {
  levels: Level[];
  selectedLevelId: number | null;
  selectedTubeIndex: number | null;
  selectedPieceValue: number | null;
  isDirty: boolean;
  history: Level[][];
  historyIndex: number;
  isSaving: boolean;
  error: string | null;
}

export type EditorAction =
  | { type: 'SET_LEVELS'; levels: Level[] }
  | { type: 'SELECT_LEVEL'; levelId: number | null }
  | { type: 'SELECT_TUBE'; tubeIndex: number | null }
  | { type: 'SELECT_PIECE_VALUE'; value: number | null }
  | { type: 'UPDATE_LEVEL'; level: Level }
  | { type: 'ADD_LEVEL' }
  | { type: 'DELETE_LEVEL'; levelId: number }
  | { type: 'DUPLICATE_LEVEL'; levelId: number }
  | { type: 'REORDER_LEVELS'; fromIndex: number; toIndex: number }
  | { type: 'ADD_TUBE' }
  | { type: 'DELETE_TUBE'; tubeIndex: number }
  | { type: 'UPDATE_TUBE'; tubeIndex: number; tube: TubeConfig }
  | { type: 'SET_TUBE_ROW'; tubeIndex: number; row: 'top' | 'bottom' }
  | { type: 'ADD_PIECE_TO_TUBE'; tubeIndex: number; value: number }
  | { type: 'REMOVE_PIECE_FROM_TUBE'; tubeIndex: number; pieceIndex: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_SAVING'; value: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'MARK_SAVED' };

const MAX_HISTORY = 50;

export const initialEditorState: EditorState = {
  levels: [],
  selectedLevelId: null,
  selectedTubeIndex: null,
  selectedPieceValue: 2,
  isDirty: false,
  history: [],
  historyIndex: -1,
  isSaving: false,
  error: null,
};

function pushHistory(state: EditorState, levels: Level[]): EditorState {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(levels)));
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function getNextLevelId(levels: Level[]): number {
  if (levels.length === 0) return 1;
  return Math.max(...levels.map(l => l.id)) + 1;
}

function createDefaultLevel(id: number): Level {
  return {
    id,
    name: `Level ${id}`,
    difficulty: 'Easy' as DifficultyGroup,
    tubes: [
      { capacity: 5, initialPieces: [2, 2, 4, 4] },
      { capacity: 5, initialPieces: [4, 2, 2, 4] },
      { capacity: 5, initialPieces: [] },
    ],
    targetPieceCount: 2,
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_LEVELS': {
      const newState = pushHistory(state, action.levels);
      return {
        ...newState,
        levels: action.levels,
        isDirty: false,
      };
    }

    case 'SELECT_LEVEL':
      return {
        ...state,
        selectedLevelId: action.levelId,
        selectedTubeIndex: null,
      };

    case 'SELECT_TUBE':
      return {
        ...state,
        selectedTubeIndex: action.tubeIndex,
      };

    case 'SELECT_PIECE_VALUE':
      return {
        ...state,
        selectedPieceValue: action.value,
      };

    case 'UPDATE_LEVEL': {
      const newLevels = state.levels.map(l =>
        l.id === action.level.id ? action.level : l
      );
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        isDirty: true,
      };
    }

    case 'ADD_LEVEL': {
      const newId = getNextLevelId(state.levels);
      const newLevel = createDefaultLevel(newId);
      const newLevels = [...state.levels, newLevel];
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        selectedLevelId: newId,
        isDirty: true,
      };
    }

    case 'DELETE_LEVEL': {
      const newLevels = state.levels.filter(l => l.id !== action.levelId);
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        selectedLevelId: state.selectedLevelId === action.levelId ? null : state.selectedLevelId,
        isDirty: true,
      };
    }

    case 'DUPLICATE_LEVEL': {
      const levelToDupe = state.levels.find(l => l.id === action.levelId);
      if (!levelToDupe) return state;
      const newId = getNextLevelId(state.levels);
      const duplicated: Level = {
        ...JSON.parse(JSON.stringify(levelToDupe)),
        id: newId,
        name: `${levelToDupe.name} (Copy)`,
      };
      const index = state.levels.findIndex(l => l.id === action.levelId);
      const newLevels = [...state.levels];
      newLevels.splice(index + 1, 0, duplicated);
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        selectedLevelId: newId,
        isDirty: true,
      };
    }

    case 'REORDER_LEVELS': {
      const newLevels = [...state.levels];
      const [removed] = newLevels.splice(action.fromIndex, 1);
      newLevels.splice(action.toIndex, 0, removed);
      // Re-assign IDs based on order
      const reorderedLevels = newLevels.map((level, index) => ({
        ...level,
        id: index + 1,
      }));
      const newState = pushHistory(state, reorderedLevels);
      return {
        ...newState,
        levels: reorderedLevels,
        selectedLevelId: state.selectedLevelId,
        isDirty: true,
      };
    }

    case 'ADD_TUBE': {
      const level = state.levels.find(l => l.id === state.selectedLevelId);
      if (!level) return state;
      const newTube: TubeConfig = { capacity: 5, initialPieces: [] };
      const updatedLevel = {
        ...level,
        tubes: [...level.tubes, newTube],
      };
      const newLevels = state.levels.map(l =>
        l.id === updatedLevel.id ? updatedLevel : l
      );
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        selectedTubeIndex: level.tubes.length,
        isDirty: true,
      };
    }

    case 'DELETE_TUBE': {
      const level = state.levels.find(l => l.id === state.selectedLevelId);
      if (!level) return state;
      const newTubes = level.tubes.filter((_, i) => i !== action.tubeIndex);
      const updatedLevel = { ...level, tubes: newTubes };
      const newLevels = state.levels.map(l =>
        l.id === updatedLevel.id ? updatedLevel : l
      );
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        selectedTubeIndex: null,
        isDirty: true,
      };
    }

    case 'UPDATE_TUBE': {
      const level = state.levels.find(l => l.id === state.selectedLevelId);
      if (!level) return state;
      const newTubes = level.tubes.map((t, i) =>
        i === action.tubeIndex ? action.tube : t
      );
      const updatedLevel = { ...level, tubes: newTubes };
      const newLevels = state.levels.map(l =>
        l.id === updatedLevel.id ? updatedLevel : l
      );
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        isDirty: true,
      };
    }

    case 'SET_TUBE_ROW': {
      const level = state.levels.find(l => l.id === state.selectedLevelId);
      if (!level) return state;
      const newTubes = level.tubes.map((t, i) =>
        i === action.tubeIndex ? { ...t, row: action.row } : t
      );
      const updatedLevel = { ...level, tubes: newTubes };
      const newLevels = state.levels.map(l =>
        l.id === updatedLevel.id ? updatedLevel : l
      );
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        isDirty: true,
      };
    }

    case 'ADD_PIECE_TO_TUBE': {
      const level = state.levels.find(l => l.id === state.selectedLevelId);
      if (!level) return state;
      const tube = level.tubes[action.tubeIndex];
      if (!tube || tube.initialPieces.length >= tube.capacity) return state;
      const newTubes = level.tubes.map((t, i) =>
        i === action.tubeIndex
          ? { ...t, initialPieces: [...t.initialPieces, action.value] }
          : t
      );
      const updatedLevel = { ...level, tubes: newTubes };
      const newLevels = state.levels.map(l =>
        l.id === updatedLevel.id ? updatedLevel : l
      );
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        isDirty: true,
      };
    }

    case 'REMOVE_PIECE_FROM_TUBE': {
      const level = state.levels.find(l => l.id === state.selectedLevelId);
      if (!level) return state;
      const newTubes = level.tubes.map((t, i) => {
        if (i !== action.tubeIndex) return t;
        // Set to null instead of removing, so pieces above don't fall
        const newPieces = [...t.initialPieces];
        newPieces[action.pieceIndex] = null as unknown as number;
        return { ...t, initialPieces: newPieces };
      });
      const updatedLevel = { ...level, tubes: newTubes };
      const newLevels = state.levels.map(l =>
        l.id === updatedLevel.id ? updatedLevel : l
      );
      const newState = pushHistory(state, newLevels);
      return {
        ...newState,
        levels: newLevels,
        isDirty: true,
      };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        levels: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        isDirty: true,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        levels: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        isDirty: true,
      };
    }

    case 'SET_SAVING':
      return { ...state, isSaving: action.value };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'MARK_SAVED':
      return { ...state, isDirty: false };

    default:
      return state;
  }
}
