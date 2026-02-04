// MergeEffect.tsx - Merge parçacık efektleri

import { motion, AnimatePresence } from 'framer-motion';
import { getColorForValue } from '../utils/colors';
import { ANIMATION_DURATIONS, ANIMATION_VALUES } from '../utils/constants';

interface MergeEffectProps {
  isActive: boolean;
  value: number; // Merge sonucu oluşan değer
  onComplete?: () => void;
}

export const MergeEffect = ({ isActive, value, onComplete }: MergeEffectProps) => {
  const color = getColorForValue(value);
  const particleCount = ANIMATION_VALUES.PARTICLE_COUNT;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isActive && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {/* Glow burst */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.2, 1.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION_DURATIONS.MERGE_GLOW / 1000 }}
            style={{
              background: `radial-gradient(circle, ${color}50 0%, transparent 70%)`,
            }}
          />

          {/* Particles */}
          {Array.from({ length: particleCount }).map((_, i) => {
            const angle = (i / particleCount) * 360;
            const radians = (angle * Math.PI) / 180;
            const distance = ANIMATION_VALUES.PARTICLE_DISTANCE;
            const x = Math.cos(radians) * distance;
            const y = Math.sin(radians) * distance;

            return (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: color,
                  marginLeft: -4,
                  marginTop: -4,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: x,
                  y: y,
                  opacity: [1, 1, 0],
                  scale: [1, 1.2, 0.3],
                }}
                transition={{
                  duration: ANIMATION_DURATIONS.PARTICLES_DURATION / 1000,
                  ease: 'easeOut',
                  delay: i * 0.02,
                }}
              />
            );
          })}

          {/* Ring burst */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              border: `2px solid ${color}`,
            }}
            initial={{ width: 10, height: 10, opacity: 0.8 }}
            animate={{
              width: 60,
              height: 60,
              opacity: 0,
            }}
            transition={{
              duration: ANIMATION_DURATIONS.MERGE_GLOW / 1000,
              ease: 'easeOut',
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
};
