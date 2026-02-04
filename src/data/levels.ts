// levels.ts - Level dataları JSON'dan okunur

import type { Level } from '../engine/types';
import levelsData from './levels.json';

export const levels: Level[] = levelsData.levels as Level[];

export const getLevelById = (id: number): Level | undefined => {
  return levels.find((level) => level.id === id);
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'Beginner':
      return '#4CAF50';
    case 'Easy':
      return '#8BC34A';
    case 'Medium':
      return '#FFC107';
    case 'Hard':
      return '#FF5722';
    case 'Expert':
      return '#9C27B0';
    case 'Master':
      return '#E91E63';
    case 'Grandmaster':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

export const TOTAL_LEVELS = levels.length;
