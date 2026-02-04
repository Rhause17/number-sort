// gameLogic.ts - Core game logic (move, merge, validate)

import type { Tube, Piece } from './types';

/**
 * Bir tüpün en üst parçasını döndürür
 * @returns Piece | undefined (boş tüp için undefined)
 */
export const getTopPiece = (tube: Tube): Piece | undefined => {
  return tube.pieces[tube.pieces.length - 1];
};

/**
 * Bir tüpün en üst iki parçasını döndürür
 */
export const getTopTwoPieces = (tube: Tube): [Piece | undefined, Piece | undefined] => {
  const len = tube.pieces.length;
  return [
    len >= 1 ? tube.pieces[len - 1] : undefined,
    len >= 2 ? tube.pieces[len - 2] : undefined,
  ];
};

/**
 * Parçanın bir tüpten diğerine taşınıp taşınamayacağını kontrol eder
 *
 * Kurallar:
 * 1. fromTube boş olamaz
 * 2. toTube kapasitesi dolu olamaz
 * 3. toTube boşsa her parça konabilir
 * 4. toTube doluysa: taşınan parça değeri <= hedef tüp üst parça değeri
 */
export const canMovePiece = (fromTube: Tube, toTube: Tube): boolean => {
  // Kural 1: fromTube boş mu?
  if (fromTube.pieces.length === 0) {
    return false;
  }

  // Kural 2: toTube kapasitesi dolu mu?
  if (toTube.pieces.length >= toTube.capacity) {
    return false;
  }

  // Kural 3: toTube boş mu? → herhangi bir parça konabilir
  if (toTube.pieces.length === 0) {
    return true;
  }

  // Kural 4: fromTube'un en üst parçası <= toTube'un en üst parçası mı?
  const fromTopPiece = getTopPiece(fromTube)!;
  const toTopPiece = getTopPiece(toTube)!;

  return fromTopPiece.value <= toTopPiece.value;
};

/**
 * İki parçanın merge edilip edilemeyeceğini kontrol eder
 */
export const canMerge = (fromTube: Tube, toTube: Tube): boolean => {
  const fromTop = getTopPiece(fromTube);
  const toTop = getTopPiece(toTube);

  if (!fromTop || !toTop) return false;
  return fromTop.value === toTop.value;
};

/**
 * Unique ID generator for pieces
 */
export const generatePieceId = (): string => {
  return `piece-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Parçayı bir tüpten diğerine SADECE taşır (merge yapmaz)
 * Animasyon için kullanılır - önce taşı, sonra merge'i ayrı uygula
 */
export const movePieceWithoutMerge = (
  tubes: Tube[],
  fromTubeId: string,
  toTubeId: string
): {
  tubes: Tube[];
  movedPieceId: string | null;
  willMerge: boolean;
} => {
  const fromTube = tubes.find((t) => t.id === fromTubeId);
  const toTube = tubes.find((t) => t.id === toTubeId);

  if (!fromTube || !toTube) {
    return { tubes, movedPieceId: null, willMerge: false };
  }

  if (!canMovePiece(fromTube, toTube)) {
    return { tubes, movedPieceId: null, willMerge: false };
  }

  // Check if merge will happen
  const willMerge = canMerge(fromTube, toTube);

  // Deep copy tubes array
  const newTubes = tubes.map((tube) => ({
    ...tube,
    pieces: tube.pieces.map(p => ({ ...p })),
  }));

  const newFromTube = newTubes.find((t) => t.id === fromTubeId)!;
  const newToTube = newTubes.find((t) => t.id === toTubeId)!;

  // Pop piece from source tube
  const movingPiece = newFromTube.pieces.pop()!;

  // Push to target (even if will merge - we handle merge animation separately)
  newToTube.pieces.push(movingPiece);

  return {
    tubes: newTubes,
    movedPieceId: movingPiece.id,
    willMerge,
  };
};

/**
 * Belirli bir tüpte en üstteki iki parçayı merge eder
 * Yeni merge edilmiş parçayı oluşturur
 */
export const applyMerge = (
  tubes: Tube[],
  tubeId: string
): {
  tubes: Tube[];
  mergedPieceId: string;
  newValue: number;
  removedPieceIds: string[];
} | null => {
  const tube = tubes.find((t) => t.id === tubeId);
  if (!tube || tube.pieces.length < 2) return null;

  const [top, second] = getTopTwoPieces(tube);
  if (!top || !second || top.value !== second.value) return null;

  // Deep copy
  const newTubes = tubes.map((t) => ({
    ...t,
    pieces: t.pieces.map(p => ({ ...p })),
  }));

  const newTube = newTubes.find((t) => t.id === tubeId)!;

  // Remove top two pieces
  const removedTop = newTube.pieces.pop()!;
  const removedSecond = newTube.pieces.pop()!;

  // Create merged piece
  const newValue = top.value * 2;
  const mergedPiece: Piece = {
    id: generatePieceId(),
    value: newValue,
  };
  newTube.pieces.push(mergedPiece);

  return {
    tubes: newTubes,
    mergedPieceId: mergedPiece.id,
    newValue,
    removedPieceIds: [removedTop.id, removedSecond.id],
  };
};

/**
 * Bir tüpte chain merge olup olmayacağını kontrol eder
 */
export const willChainMerge = (tube: Tube): boolean => {
  if (tube.pieces.length < 2) return false;
  const [top, second] = getTopTwoPieces(tube);
  return top !== undefined && second !== undefined && top.value === second.value;
};

/**
 * Parçayı bir tüpten diğerine taşır (eski versiyon - hala kullanılabilir)
 * Merge durumunda iki parça birleşir ve değer 2x olur
 */
export const movePiece = (
  tubes: Tube[],
  fromTubeId: string,
  toTubeId: string
): {
  tubes: Tube[];
  merged: boolean;
  mergeResult?: { tubeId: string; newValue: number };
} => {
  const fromTube = tubes.find((t) => t.id === fromTubeId);
  const toTube = tubes.find((t) => t.id === toTubeId);

  if (!fromTube || !toTube) {
    return { tubes, merged: false };
  }

  if (!canMovePiece(fromTube, toTube)) {
    return { tubes, merged: false };
  }

  // Deep copy tubes array
  const newTubes = tubes.map((tube) => ({
    ...tube,
    pieces: [...tube.pieces],
  }));

  const newFromTube = newTubes.find((t) => t.id === fromTubeId)!;
  const newToTube = newTubes.find((t) => t.id === toTubeId)!;

  // Pop piece from source tube
  const movingPiece = newFromTube.pieces.pop()!;

  // Check for merge
  const toTopPiece = getTopPiece(newToTube);

  if (toTopPiece && toTopPiece.value === movingPiece.value) {
    // MERGE: Remove top piece from target, create merged piece with 2x value
    newToTube.pieces.pop();
    const mergedPiece: Piece = {
      id: generatePieceId(),
      value: movingPiece.value * 2,
    };
    newToTube.pieces.push(mergedPiece);

    return {
      tubes: newTubes,
      merged: true,
      mergeResult: {
        tubeId: toTubeId,
        newValue: mergedPiece.value,
      },
    };
  }

  // No merge: just push the piece
  newToTube.pieces.push(movingPiece);

  return {
    tubes: newTubes,
    merged: false,
  };
};

/**
 * Tüm tüplerdeki toplam parça sayısını hesaplar
 */
export const countTotalPieces = (tubes: Tube[]): number => {
  return tubes.reduce((total, tube) => total + tube.pieces.length, 0);
};

/**
 * Kazanma durumunu kontrol eder
 * totalPieces <= targetPieceCount → WIN
 */
export const checkWin = (tubes: Tube[], targetPieceCount: number): boolean => {
  const totalPieces = countTotalPieces(tubes);
  return totalPieces <= targetPieceCount;
};
