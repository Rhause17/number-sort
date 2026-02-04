// chainReaction.ts - Chain merge logic

import type { Tube, Piece } from './types';

/**
 * Merge step bilgisi (animasyon için)
 */
export interface MergeStep {
  fromValue: number;
  toValue: number;
}

/**
 * Unique ID generator for pieces
 */
const generatePieceId = (): string => {
  return `piece-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Bir tüpte chain reaction uygular
 * Üstteki iki parça aynıysa merge et, tekrar kontrol et (recursive)
 *
 * Örnek: [2, 2, 4, 4, 8] → merge 2+2=4 → [4, 4, 4, 8] → merge 4+4=8 → [8, 4, 8]
 * NOT: Chain sadece en üstteki parçaları kontrol eder, tüm tüpü değil
 *
 * Doğru örnek: [8, 4, 4] → üstteki iki parça 4,4 → merge → [8, 8] → merge → [16]
 *
 * @param tube - Chain reaction uygulanacak tüp
 * @returns { tube, merges } - Güncellenmiş tüp ve merge adımları
 */
export const applyChainReaction = (
  tube: Tube
): { tube: Tube; merges: MergeStep[] } => {
  const merges: MergeStep[] = [];

  // Deep copy tube
  const newTube: Tube = {
    ...tube,
    pieces: tube.pieces.map((p) => ({ ...p })),
  };

  // Loop until no more merges possible
  while (newTube.pieces.length >= 2) {
    const topIndex = newTube.pieces.length - 1;
    const secondIndex = topIndex - 1;

    const topPiece = newTube.pieces[topIndex];
    const secondPiece = newTube.pieces[secondIndex];

    // Check if top two pieces have the same value
    if (topPiece.value === secondPiece.value) {
      // Merge: remove both, add merged piece
      const fromValue = topPiece.value;
      const toValue = fromValue * 2;

      newTube.pieces.pop(); // Remove top
      newTube.pieces.pop(); // Remove second

      const mergedPiece: Piece = {
        id: generatePieceId(),
        value: toValue,
      };
      newTube.pieces.push(mergedPiece);

      // Record this merge step
      merges.push({ fromValue, toValue });

      // Continue loop to check for more chain reactions
    } else {
      // No merge possible, exit loop
      break;
    }
  }

  return { tube: newTube, merges };
};

/**
 * Chain reaction sonrası tüpü günceller ve tüm tubes array'ini döndürür
 *
 * @param tubes - Tüm tüpler
 * @param tubeId - Chain reaction uygulanacak tüp ID'si
 * @returns { tubes, merges } - Güncellenmiş tüpler ve merge adımları
 */
export const applyChainReactionToTubes = (
  tubes: Tube[],
  tubeId: string
): { tubes: Tube[]; merges: MergeStep[] } => {
  const tube = tubes.find((t) => t.id === tubeId);

  if (!tube) {
    return { tubes, merges: [] };
  }

  const { tube: updatedTube, merges } = applyChainReaction(tube);

  // Replace tube in array
  const newTubes = tubes.map((t) => (t.id === tubeId ? updatedTube : t));

  return { tubes: newTubes, merges };
};
