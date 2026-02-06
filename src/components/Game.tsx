// Game.tsx - Ana oyun container

import { useReducer, useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tube, Level, GameState } from '../engine/types';
import {
  canMovePiece,
  movePieceWithoutMerge,
  applyMerge,
  willChainMerge,
  countTotalPieces,
  checkWin,
  getTopTwoPieces,
  getTopPiece,
  generatePieceId,
} from '../engine/gameLogic';
import { isStuck as checkIsStuck } from '../engine/stuckDetection';
import { Board } from './Board';
import { HUD } from './HUD';
import { WinScreen } from './WinScreen';
import { StuckPopup } from './StuckPopup';
import { FlyingPiece } from './FlyingPiece';
import { LevelSelect } from './LevelSelect';
import type { FlyingPieceState } from './FlyingPiece';
import type { PieceAnimationState } from './Piece';
import { levels, TOTAL_LEVELS } from '../data/levels';
import { ANIMATION_DURATIONS, GAME_CONSTANTS } from '../utils/constants';

// Check if we're in test mode (from editor)
const getTestLevel = (): Level | null => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('test') === 'true') {
    const testLevelData = sessionStorage.getItem('testLevel');
    if (testLevelData) {
      try {
        return JSON.parse(testLevelData) as Level;
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Initialize tubes from level config
const initializeTubes = (level: Level): Tube[] => {
  return level.tubes.map((config, index) => ({
    id: `tube-${index}`,
    capacity: config.capacity,
    pieces: config.initialPieces.map((value) => ({
      id: generatePieceId(),
      value,
    })),
  }));
};

// Extended game state
interface ExtendedGameState extends GameState {
  isStuck: boolean;
}

// Initialize game state
const initializeGameState = (level: Level): ExtendedGameState => {
  const tubes = initializeTubes(level);
  return {
    level,
    tubes,
    selectedTubeId: null,
    moveCount: 0,
    isWon: false,
    isAnimating: false,
    totalPieces: countTotalPieces(tubes),
    isStuck: false,
  };
};

// Action types
type GameAction =
  | { type: 'SELECT_TUBE'; tubeId: string }
  | { type: 'DESELECT' }
  | { type: 'SET_TUBES'; tubes: Tube[] }
  | { type: 'INCREMENT_MOVE' }
  | { type: 'SET_ANIMATING'; value: boolean }
  | { type: 'CHECK_WIN_AND_STUCK' }
  | { type: 'LOAD_LEVEL'; level: Level }
  | { type: 'RESTART' };

// Reducer
const gameReducer = (state: ExtendedGameState, action: GameAction): ExtendedGameState => {
  switch (action.type) {
    case 'SELECT_TUBE': {
      const tube = state.tubes.find((t) => t.id === action.tubeId);
      if (!tube || tube.pieces.length === 0) {
        return state;
      }
      return { ...state, selectedTubeId: action.tubeId };
    }

    case 'DESELECT':
      return { ...state, selectedTubeId: null };

    case 'SET_TUBES':
      return {
        ...state,
        tubes: action.tubes,
        totalPieces: countTotalPieces(action.tubes),
      };

    case 'INCREMENT_MOVE':
      return { ...state, moveCount: state.moveCount + 1 };

    case 'SET_ANIMATING':
      return { ...state, isAnimating: action.value };

    case 'CHECK_WIN_AND_STUCK': {
      const isWon = checkWin(state.tubes, state.level.targetPieceCount);
      const isStuck = !isWon && checkIsStuck(state.tubes);
      return { ...state, isWon, isStuck };
    }

    case 'LOAD_LEVEL':
      return initializeGameState(action.level);

    case 'RESTART':
      return initializeGameState(state.level);

    default:
      return state;
  }
};

// Helper: delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const Game = () => {
  const testLevel = getTestLevel();
  const isTestMode = testLevel !== null;
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const level = isTestMode ? testLevel : levels[currentLevelIndex];
  const [state, dispatch] = useReducer(gameReducer, level, initializeGameState);
  const [invalidTubeId, setInvalidTubeId] = useState<string | null>(null);
  const [pieceAnimationStates, setPieceAnimationStates] = useState<Record<string, PieceAnimationState>>({});
  const [mergingPieceId, setMergingPieceId] = useState<string | null>(null);
  const [flyingPiece, setFlyingPiece] = useState<FlyingPieceState | null>(null);
  const [hiddenPieceId, setHiddenPieceId] = useState<string | null>(null);
  const [showStuckPopup, setShowStuckPopup] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [boardKey, setBoardKey] = useState(0); // For fade transition

  // Ref to track if animation is in progress (to avoid race conditions)
  const animatingRef = useRef(false);

  // Ref to resolve flying animation promise
  const flyingResolveRef = useRef<(() => void) | null>(null);

  // Show stuck popup when stuck
  useEffect(() => {
    if (state.isStuck && !state.isWon) {
      setShowStuckPopup(true);
    }
  }, [state.isStuck, state.isWon]);

  // Set animation state for specific pieces
  const setAnimState = (pieceIds: string[], animState: PieceAnimationState) => {
    setPieceAnimationStates((prev) => {
      const next = { ...prev };
      pieceIds.forEach((id) => {
        if (animState === 'idle') {
          delete next[id];
        } else {
          next[id] = animState;
        }
      });
      return next;
    });
  };

  // Clear all animation states
  const clearAnimStates = () => {
    setPieceAnimationStates({});
    setMergingPieceId(null);
    setFlyingPiece(null);
    setHiddenPieceId(null);
  };

  // Get piece element position by piece ID
  const getPieceRect = (pieceId: string): DOMRect | null => {
    const el = document.querySelector(`[data-piece-id="${pieceId}"]`);
    return el ? el.getBoundingClientRect() : null;
  };

  // Get the target position for a piece landing in a tube
  const getTargetSlotRect = (tubeId: string, tubeData: Tube): DOMRect | null => {
    const tubeEl = document.querySelector(`[data-tube-id="${tubeId}"]`);
    if (!tubeEl) return null;

    const tubeRect = tubeEl.getBoundingClientRect();
    const slotHeight = GAME_CONSTANTS.PIECE_HEIGHT + GAME_CONSTANTS.PIECE_GAP;
    const padding = 8;
    const currentPieceCount = tubeData.pieces.length;

    const innerTube = tubeEl.querySelector('div');
    const tubeHeight = innerTube?.getBoundingClientRect().height || 0;
    const bottomOffset = padding + (currentPieceCount * slotHeight) + GAME_CONSTANTS.PIECE_HEIGHT / 2;

    return new DOMRect(
      tubeRect.left + 4,
      tubeRect.top + tubeHeight - bottomOffset - GAME_CONSTANTS.PIECE_HEIGHT / 2,
      GAME_CONSTANTS.TUBE_WIDTH - 8,
      GAME_CONSTANTS.PIECE_HEIGHT
    );
  };

  // Handle flying animation complete
  const handleFlyingComplete = () => {
    setFlyingPiece(null);
    if (flyingResolveRef.current) {
      flyingResolveRef.current();
      flyingResolveRef.current = null;
    }
  };

  // Main move handler with animation orchestration
  const executeMove = useCallback(
    async (fromTubeId: string, toTubeId: string) => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      dispatch({ type: 'SET_ANIMATING', value: true });
      dispatch({ type: 'DESELECT' });

      const fromTube = state.tubes.find((t) => t.id === fromTubeId);
      const toTube = state.tubes.find((t) => t.id === toTubeId);
      if (!fromTube || !toTube) {
        animatingRef.current = false;
        dispatch({ type: 'SET_ANIMATING', value: false });
        return;
      }

      const movingPiece = getTopPiece(fromTube);
      if (!movingPiece) {
        animatingRef.current = false;
        dispatch({ type: 'SET_ANIMATING', value: false });
        return;
      }

      // Step 1: Flying animation
      const fromRect = getPieceRect(movingPiece.id);
      const toRect = getTargetSlotRect(toTubeId, toTube);

      if (fromRect && toRect) {
        setHiddenPieceId(movingPiece.id);
        setFlyingPiece({
          piece: movingPiece,
          fromRect,
          toRect,
        });

        await new Promise<void>((resolve) => {
          flyingResolveRef.current = resolve;
        });
      }

      // Step 2: Move piece in state
      let currentTubes = state.tubes;
      const moveResult = movePieceWithoutMerge(currentTubes, fromTubeId, toTubeId);
      if (!moveResult.movedPieceId) {
        setHiddenPieceId(null);
        animatingRef.current = false;
        dispatch({ type: 'SET_ANIMATING', value: false });
        return;
      }

      currentTubes = moveResult.tubes;
      setHiddenPieceId(null);
      dispatch({ type: 'SET_TUBES', tubes: currentTubes });
      dispatch({ type: 'INCREMENT_MOVE' });

      if (!moveResult.willMerge) {
        await delay(ANIMATION_DURATIONS.PIECE_SETTLE);
      }

      // Step 3: Handle merge if needed
      if (moveResult.willMerge) {
        const targetTube = currentTubes.find((t) => t.id === toTubeId)!;
        const [top, second] = getTopTwoPieces(targetTube);

        if (top && second) {
          setAnimState([top.id, second.id], 'squishing');
          await delay(ANIMATION_DURATIONS.MERGE_SQUISH);

          const mergeResult = applyMerge(currentTubes, toTubeId);
          if (mergeResult) {
            currentTubes = mergeResult.tubes;
            setAnimState([mergeResult.mergedPieceId], 'merging');
            setMergingPieceId(mergeResult.mergedPieceId);
            dispatch({ type: 'SET_TUBES', tubes: currentTubes });

            await delay(ANIMATION_DURATIONS.MERGE_POP);
            setMergingPieceId(null);
            setAnimState([mergeResult.mergedPieceId], 'idle');
          }
        }
      }

      // Step 4: Chain reaction loop
      let chainTubeId = toTubeId;
      let chainCount = 0;
      const maxChains = 10;

      while (chainCount < maxChains) {
        const tube = currentTubes.find((t) => t.id === chainTubeId);
        if (!tube || !willChainMerge(tube)) break;

        const [chainTop, chainSecond] = getTopTwoPieces(tube);
        if (!chainTop || !chainSecond) break;

        await delay(ANIMATION_DURATIONS.CHAIN_DELAY);

        setAnimState([chainTop.id, chainSecond.id], 'chainHighlight');
        await delay(ANIMATION_DURATIONS.CHAIN_HIGHLIGHT);

        setAnimState([chainTop.id, chainSecond.id], 'squishing');
        await delay(ANIMATION_DURATIONS.MERGE_SQUISH);

        const chainMergeResult = applyMerge(currentTubes, chainTubeId);
        if (chainMergeResult) {
          currentTubes = chainMergeResult.tubes;
          setAnimState([chainMergeResult.mergedPieceId], 'merging');
          setMergingPieceId(chainMergeResult.mergedPieceId);
          dispatch({ type: 'SET_TUBES', tubes: currentTubes });

          await delay(ANIMATION_DURATIONS.MERGE_POP);
          setMergingPieceId(null);
          setAnimState([chainMergeResult.mergedPieceId], 'idle');
        }

        chainCount++;
      }

      // Step 5: Final cleanup
      clearAnimStates();
      dispatch({ type: 'CHECK_WIN_AND_STUCK' });
      dispatch({ type: 'SET_ANIMATING', value: false });
      animatingRef.current = false;
    },
    [state.tubes]
  );

  // Handle tube click
  const handleTubeClick = useCallback(
    (tubeId: string) => {
      if (state.isAnimating || state.isWon || animatingRef.current) return;

      const clickedTube = state.tubes.find((t) => t.id === tubeId);
      if (!clickedTube) return;

      if (!state.selectedTubeId) {
        if (clickedTube.pieces.length > 0) {
          dispatch({ type: 'SELECT_TUBE', tubeId });
        }
        return;
      }

      if (state.selectedTubeId === tubeId) {
        dispatch({ type: 'DESELECT' });
        return;
      }

      const fromTube = state.tubes.find((t) => t.id === state.selectedTubeId);
      if (!fromTube) return;

      if (canMovePiece(fromTube, clickedTube)) {
        executeMove(state.selectedTubeId, tubeId);
      } else {
        setInvalidTubeId(tubeId);
        dispatch({ type: 'DESELECT' });
        setTimeout(() => setInvalidTubeId(null), ANIMATION_DURATIONS.INVALID_SHAKE);
      }
    },
    [state.isAnimating, state.isWon, state.selectedTubeId, state.tubes, executeMove]
  );

  // Handle restart
  const handleRestart = useCallback(() => {
    clearAnimStates();
    animatingRef.current = false;
    setShowStuckPopup(false);
    setBoardKey((k) => k + 1); // Trigger fade transition
    dispatch({ type: 'RESTART' });
  }, []);

  // Handle next level
  const handleNextLevel = useCallback(() => {
    if (currentLevelIndex < TOTAL_LEVELS - 1) {
      clearAnimStates();
      animatingRef.current = false;
      const nextIndex = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIndex);
      setBoardKey((k) => k + 1); // Trigger fade transition
      dispatch({ type: 'LOAD_LEVEL', level: levels[nextIndex] });
    }
  }, [currentLevelIndex]);

  // Handle play again (start from level 1)
  const handlePlayAgain = useCallback(() => {
    clearAnimStates();
    animatingRef.current = false;
    setCurrentLevelIndex(0);
    setBoardKey((k) => k + 1);
    dispatch({ type: 'LOAD_LEVEL', level: levels[0] });
  }, []);

  // Handle restart button in HUD (show confirmation popup)
  const handleRestartClick = useCallback(() => {
    if (state.isStuck) {
      // If stuck, restart immediately
      handleRestart();
    } else {
      // Show confirmation popup
      setShowStuckPopup(true);
    }
  }, [state.isStuck, handleRestart]);

  // Handle cancel restart popup
  const handleCancelRestart = useCallback(() => {
    setShowStuckPopup(false);
  }, []);

  // Handle open level select
  const handleOpenLevelSelect = useCallback(() => {
    setShowLevelSelect(true);
  }, []);

  // Handle select level from level select
  const handleSelectLevel = useCallback((levelIndex: number) => {
    clearAnimStates();
    animatingRef.current = false;
    setShowLevelSelect(false);
    setShowStuckPopup(false);
    setCurrentLevelIndex(levelIndex);
    setBoardKey((k) => k + 1);
    dispatch({ type: 'LOAD_LEVEL', level: levels[levelIndex] });
  }, []);

  const isLastLevel = isTestMode || currentLevelIndex === TOTAL_LEVELS - 1;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full py-4 px-4 overflow-hidden">
      {/* Test mode indicator */}
      {isTestMode && (
        <div className="fixed top-4 left-4 bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium z-50">
          Test Mode
        </div>
      )}

      {/* HUD */}
      <HUD
        levelNumber={state.level.id}
        levelName={state.level.name}
        difficulty={state.level.difficulty}
        currentPieces={state.totalPieces}
        targetPieces={state.level.targetPieceCount}
        moveCount={state.moveCount}
        isStuck={state.isStuck}
        onRestart={handleRestartClick}
        onOpenLevelSelect={isTestMode ? undefined : handleOpenLevelSelect}
      />

      {/* Board container */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={boardKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Board
              tubes={state.tubes}
              tubeConfigs={state.level.tubes}
              selectedTubeId={state.selectedTubeId}
              invalidTubeId={invalidTubeId}
              pieceAnimationStates={pieceAnimationStates}
              mergingPieceId={mergingPieceId}
              hiddenPieceId={hiddenPieceId}
              onTubeClick={handleTubeClick}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flying piece overlay */}
      {flyingPiece && (
        <FlyingPiece
          flyingState={flyingPiece}
          onAnimationComplete={handleFlyingComplete}
        />
      )}

      {/* Win popup */}
      <WinScreen
        isVisible={state.isWon}
        levelNumber={state.level.id}
        levelName={state.level.name}
        difficulty={state.level.difficulty}
        moveCount={state.moveCount}
        isLastLevel={isLastLevel}
        onNextLevel={handleNextLevel}
        onPlayAgain={handlePlayAgain}
      />

      {/* Stuck/Restart popup */}
      <StuckPopup
        isVisible={showStuckPopup && !state.isWon}
        isStuck={state.isStuck}
        onRestart={handleRestart}
        onCancel={handleCancelRestart}
      />

      {/* Level select popup */}
      <LevelSelect
        isVisible={showLevelSelect}
        currentLevel={state.level.id}
        onSelectLevel={handleSelectLevel}
        onClose={() => setShowLevelSelect(false)}
      />
    </div>
  );
};
