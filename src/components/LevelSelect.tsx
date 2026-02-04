// LevelSelect.tsx - Level selection popup

import { motion, AnimatePresence } from 'framer-motion';
import { levels, getDifficultyColor } from '../data/levels';
import type { DifficultyGroup } from '../engine/types';

interface LevelSelectProps {
  isVisible: boolean;
  currentLevel: number;
  onSelectLevel: (levelIndex: number) => void;
  onClose: () => void;
}

const difficultyGroups: { name: DifficultyGroup; range: [number, number] }[] = [
  { name: 'Beginner', range: [1, 5] },
  { name: 'Easy', range: [6, 15] },
  { name: 'Medium', range: [16, 22] },
  { name: 'Hard', range: [23, 30] },
  { name: 'Expert', range: [31, 40] },
  { name: 'Master', range: [41, 45] },
  { name: 'Grandmaster', range: [46, 50] },
]; // v3.0 - all levels mathematically verified

export const LevelSelect = ({
  isVisible,
  currentLevel,
  onSelectLevel,
  onClose,
}: LevelSelectProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClose}
          />

          {/* Modal content */}
          <motion.div
            className="relative rounded-2xl p-6 mx-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white">Select Level</h2>
              <p className="text-slate-400 text-sm mt-1">Jump to any level</p>
            </div>

            {/* Level groups */}
            <div className="space-y-4">
              {difficultyGroups.map((group) => {
                const color = getDifficultyColor(group.name);
                const groupLevels = levels.filter(
                  (l) => l.id >= group.range[0] && l.id <= group.range[1]
                );

                return (
                  <div key={group.name}>
                    {/* Group header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        {group.name}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {group.range[0]}-{group.range[1]}
                      </span>
                    </div>

                    {/* Level buttons */}
                    <div className="flex flex-wrap gap-2">
                      {groupLevels.map((level) => {
                        const isCurrentLevel = level.id === currentLevel;
                        const levelIndex = levels.findIndex((l) => l.id === level.id);

                        return (
                          <motion.button
                            key={level.id}
                            onClick={() => onSelectLevel(levelIndex)}
                            className={`
                              w-10 h-10 rounded-lg font-semibold text-sm
                              transition-all duration-200
                              ${isCurrentLevel
                                ? 'ring-2 ring-offset-2 ring-offset-slate-900'
                                : 'hover:scale-105'
                              }
                            `}
                            style={{
                              backgroundColor: isCurrentLevel ? color : `${color}30`,
                              color: isCurrentLevel ? '#fff' : color,
                              // @ts-expect-error ringColor is a valid CSS custom property for Tailwind
                              '--tw-ring-color': isCurrentLevel ? color : undefined,
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {level.id}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close hint */}
            <p className="text-center text-slate-500 text-xs mt-6">
              Tap outside to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
