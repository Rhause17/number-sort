// types.ts - Tüm type tanımları

// Bir parçayı temsil eder
export interface Piece {
  id: string;          // Unique ID (animasyon tracking için)
  value: number;       // 2, 4, 8, 16, 32, 64, 128, 256...
}

// Bir tüpü temsil eder
export interface Tube {
  id: string;          // Unique ID
  capacity: number;    // Max kaç parça alabilir (ör: 5)
  pieces: Piece[];     // Alt'tan üste sıralı (index 0 = en alt)
}

// Tüp konfigürasyonu (level tanımı için)
export interface TubeConfig {
  capacity: number;
  initialPieces: number[]; // Değerler listesi, alttan üste (boş tüp = [])
  row?: 'top' | 'bottom';  // Hangi satırda gösterilecek (default: 'top')
}

// Zorluk seviyeleri
export type DifficultyGroup = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master' | 'Grandmaster';

// Level tanımı
export interface Level {
  id: number;
  name: string;
  difficulty: DifficultyGroup;
  tubes: TubeConfig[];       // Başlangıç tüp konfigürasyonları
  targetPieceCount: number;  // Kazanma hedefi
}

// Oyun durumu
export interface GameState {
  level: Level;
  tubes: Tube[];
  selectedTubeId: string | null; // Seçili tüp
  moveCount: number;
  isWon: boolean;
  isAnimating: boolean;          // Animasyon sırasında input engelle
  totalPieces: number;           // Mevcut toplam parça sayısı
}

// Oyun aksiyonları
export type GameAction =
  | { type: 'SELECT_TUBE'; tubeId: string }
  | { type: 'MOVE_PIECE'; fromTubeId: string; toTubeId: string }
  | { type: 'MERGE_PIECES'; tubeId: string }
  | { type: 'CHAIN_MERGE'; tubeId: string }
  | { type: 'CHECK_WIN' }
  | { type: 'RESTART_LEVEL' }
  | { type: 'SET_ANIMATING'; value: boolean };
