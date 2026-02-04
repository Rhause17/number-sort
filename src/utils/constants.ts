// constants.ts - Sabitler (animasyon süreleri vs.)

// Animasyon süreleri (ms)
export const ANIMATION_DURATIONS = {
  PIECE_SELECT: 150,        // Piece seçim animasyonu
  PIECE_MOVE: 220,          // Piece taşıma animasyonu (flying)
  PIECE_SETTLE: 80,         // Piece yerine oturma (bounce)
  MERGE_SQUISH: 80,         // Merge öncesi squish animasyonu
  MERGE_POP: 180,           // Merge pop animasyonu (0 → 1.3 → 1)
  MERGE_GLOW: 300,          // Merge glow efekti süresi
  CHAIN_HIGHLIGHT: 100,     // Chain öncesi pulse/highlight
  CHAIN_DELAY: 120,         // Chain reaction arası bekleme
  PARTICLES_DURATION: 350,  // Parçacık animasyonu süresi
  INVALID_SHAKE: 250,       // Geçersiz hamle shake animasyonu
  WIN_CELEBRATION: 500,     // Kazanma kutlama animasyonu
} as const;

// Animasyon değerleri
export const ANIMATION_VALUES = {
  SELECT_LIFT_Y: -20,       // Seçili parça yukarı kalkma (px)
  SELECT_SCALE: 1.1,        // Seçili parça büyüme
  SQUISH_SCALE: 0.85,       // Merge öncesi squish scale
  MERGE_SCALE_MAX: 1.35,    // Merge animasyonu max scale
  CHAIN_HIGHLIGHT_SCALE: 1.08, // Chain öncesi pulse scale
  SHAKE_DISTANCE: 5,        // Shake animasyonu X mesafesi (px)
  SHAKE_REPEATS: 3,         // Shake tekrar sayısı
  PARTICLE_COUNT: 6,        // Merge parçacık sayısı
  PARTICLE_DISTANCE: 40,    // Parçacık yayılma mesafesi (px)
  FLY_ARC_HEIGHT: 60,       // Uçuş arkının yüksekliği (px)
  SETTLE_BOUNCE_Y: -8,      // Yerine oturma bounce yüksekliği (px)
} as const;

// Oyun sabitleri
export const GAME_CONSTANTS = {
  MIN_TUBE_WIDTH: 60,       // Minimum tüp genişliği (px)
  MIN_PIECE_HEIGHT: 40,     // Minimum parça yüksekliği (px)
  BOARD_MAX_WIDTH: 600,     // Board max genişlik (px)
  // Fixed piece dimensions (same across all levels)
  PIECE_WIDTH: 52,          // Sabit parça genişliği (px)
  PIECE_HEIGHT: 36,         // Sabit parça yüksekliği (px)
  TUBE_WIDTH: 60,           // Sabit tüp genişliği (px)
  PIECE_GAP: 4,             // Parçalar arası boşluk (px)
  TUBE_PADDING: 16,         // Tüp iç padding (px)
  ROW_GAP: 24,              // Satırlar arası boşluk (px)
} as const;

// Easing fonksiyonları (Framer Motion)
export const EASING = {
  SELECT: 'easeOut',
  MOVE: 'easeInOut',
  SHAKE: 'easeInOut',
  MERGE_POP: [0.34, 1.56, 0.64, 1], // Bouncy easing
} as const;
