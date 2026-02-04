// stuckDetection.ts - Stuck durumu kontrolü

import type { Tube } from './types';
import { canMovePiece } from './gameLogic';

/**
 * Oyuncunun stuck durumunda olup olmadığını kontrol eder
 * Hiçbir hamle yapılamıyorsa → stuck
 *
 * Tüm (from, to) tüp kombinasyonlarını kontrol eder
 * Herhangi bir geçerli hamle varsa → not stuck
 *
 * Edge cases:
 * - Tüm tüpler boş → stuck (hamle yok)
 * - Tek parçalı tek tüp, diğerleri boş → not stuck (boş tüpe taşınabilir)
 * - Tüm tüpler dolu ve hiçbir parça taşınamaz → stuck
 *
 * @param tubes - Tüm tüpler
 * @returns boolean - true ise oyuncu stuck durumunda
 */
export const isStuck = (tubes: Tube[]): boolean => {
  // Parça yoksa stuck değil (oyun bitti veya başlamadı)
  const hasAnyPiece = tubes.some((tube) => tube.pieces.length > 0);
  if (!hasAnyPiece) {
    return false;
  }

  // Tüm (from, to) kombinasyonlarını kontrol et
  for (const fromTube of tubes) {
    // Boş tüpten parça alınamaz, skip
    if (fromTube.pieces.length === 0) {
      continue;
    }

    for (const toTube of tubes) {
      // Aynı tüpe taşıma yok
      if (fromTube.id === toTube.id) {
        continue;
      }

      // Geçerli bir hamle varsa → not stuck
      if (canMovePiece(fromTube, toTube)) {
        return false;
      }
    }
  }

  // Hiçbir geçerli hamle bulunamadı → stuck
  return true;
};

/**
 * Mümkün olan tüm hamleleri listeler
 * Debug ve hint sistemi için kullanılabilir
 *
 * @param tubes - Tüm tüpler
 * @returns Array of { fromTubeId, toTubeId }
 */
export const getAvailableMoves = (
  tubes: Tube[]
): Array<{ fromTubeId: string; toTubeId: string }> => {
  const moves: Array<{ fromTubeId: string; toTubeId: string }> = [];

  for (const fromTube of tubes) {
    if (fromTube.pieces.length === 0) {
      continue;
    }

    for (const toTube of tubes) {
      if (fromTube.id === toTube.id) {
        continue;
      }

      if (canMovePiece(fromTube, toTube)) {
        moves.push({
          fromTubeId: fromTube.id,
          toTubeId: toTube.id,
        });
      }
    }
  }

  return moves;
};
