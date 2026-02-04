// StuckPopup.tsx - Stuck/Restart popup

import { motion, AnimatePresence } from 'framer-motion';

interface StuckPopupProps {
  isVisible: boolean;
  isStuck: boolean; // true = no moves, false = user initiated restart
  onRestart: () => void;
  onCancel: () => void;
}

export const StuckPopup = ({
  isVisible,
  isStuck,
  onRestart,
  onCancel,
}: StuckPopupProps) => {
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
            onClick={onCancel}
          />

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
            {/* Icon */}
            <motion.div
              className="text-5xl mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                damping: 12,
                stiffness: 200,
                delay: 0.1,
              }}
            >
              {isStuck ? '😵' : '🔄'}
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-xl sm:text-2xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {isStuck ? 'No Moves Left!' : 'Restart Level?'}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-slate-400 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isStuck
                ? "You're stuck. Try again with a different strategy."
                : 'Your progress will be lost.'}
            </motion.p>

            {/* Action buttons */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <motion.button
                onClick={onRestart}
                className={`
                  w-full px-6 py-3 rounded-xl font-semibold
                  ${isStuck
                    ? 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 shadow-red-500/25'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-blue-500/25'
                  }
                  active:scale-95
                  text-white shadow-lg
                  transition-all duration-200
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Restart Level
              </motion.button>

              {!isStuck && (
                <motion.button
                  onClick={onCancel}
                  className="
                    w-full px-6 py-3 rounded-xl font-semibold
                    bg-slate-800 hover:bg-slate-700
                    text-slate-300 hover:text-white
                    transition-all duration-200
                  "
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue Playing
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
