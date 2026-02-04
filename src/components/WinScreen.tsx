// WinScreen.tsx - Level tamamlama popup'ı

import { motion, AnimatePresence } from 'framer-motion';
import type { DifficultyGroup } from '../engine/types';
import { getDifficultyColor, TOTAL_LEVELS } from '../data/levels';

interface WinScreenProps {
  isVisible: boolean;
  levelNumber: number;
  levelName: string;
  difficulty: DifficultyGroup;
  moveCount: number;
  isLastLevel: boolean;
  onNextLevel: () => void;
  onPlayAgain: () => void;
}

export const WinScreen = ({
  isVisible,
  levelNumber,
  levelName,
  difficulty,
  moveCount,
  isLastLevel,
  onNextLevel,
  onPlayAgain,
}: WinScreenProps) => {
  const difficultyColor = getDifficultyColor(difficulty);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Celebration particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#22c55e', '#facc15', '#3b82f6', '#f472b6', '#a855f7'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                }}
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={{
                  y: window.innerHeight + 100,
                  opacity: [1, 1, 0],
                  scale: [1, 1.2, 0.5],
                  rotate: Math.random() * 720 - 360,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>

          {/* Modal content */}
          <motion.div
            className="relative rounded-2xl p-8 text-center mx-4 max-w-sm w-full"
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            {/* Trophy icon */}
            <motion.div
              className="text-6xl mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                damping: 10,
                stiffness: 200,
                delay: 0.1,
              }}
            >
              {isLastLevel ? '🎉' : '🏆'}
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isLastLevel ? 'Congratulations!' : `Level ${levelNumber} Completed!`}
            </motion.h2>

            {/* Subtitle for last level */}
            {isLastLevel && (
              <motion.p
                className="text-green-400 font-medium mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                All {TOTAL_LEVELS} levels completed!
              </motion.p>
            )}

            {/* Level name and difficulty */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-slate-400">{levelName}</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{
                  backgroundColor: `${difficultyColor}20`,
                  color: difficultyColor,
                  border: `1px solid ${difficultyColor}40`,
                }}
              >
                {difficulty}
              </span>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex justify-center gap-8 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{moveCount}</div>
                <div className="text-sm text-slate-500">Moves</div>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isLastLevel ? (
                <motion.button
                  onClick={onPlayAgain}
                  className="
                    w-full px-6 py-3 rounded-xl font-semibold
                    bg-gradient-to-r from-purple-500 to-pink-600
                    hover:from-purple-400 hover:to-pink-500
                    active:from-purple-600 active:to-pink-700
                    text-white shadow-lg shadow-purple-500/25
                    transition-all duration-200
                  "
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Play Again
                </motion.button>
              ) : (
                <motion.button
                  onClick={onNextLevel}
                  className="
                    w-full px-6 py-3 rounded-xl font-semibold
                    bg-gradient-to-r from-green-500 to-emerald-600
                    hover:from-green-400 hover:to-emerald-500
                    active:from-green-600 active:to-emerald-700
                    text-white shadow-lg shadow-green-500/25
                    transition-all duration-200
                  "
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next Level
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
