# Number Sort — Technical Specification

## Tech Stack
- **Framework**: React 18+ with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React useState + useReducer (basit tutmak için)
- **Deployment**: Vercel
- **Package Manager**: npm

## Proje Yapısı

```
number-sort/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Game.tsx              # Ana oyun container
│   │   ├── Board.tsx             # Tüpleri render eder
│   │   ├── Tube.tsx              # Tek bir tüp componenti
│   │   ├── Piece.tsx             # Tek bir parça componenti
│   │   ├── HUD.tsx               # Score, piece count, restart butonu
│   │   └── WinScreen.tsx         # Level tamamlama ekranı
│   ├── engine/
│   │   ├── types.ts              # Tüm type tanımları
│   │   ├── gameLogic.ts          # Core game logic (move, merge, validate)
│   │   ├── chainReaction.ts      # Chain merge logic
│   │   └── stuckDetection.ts     # Stuck durumu kontrolü
│   ├── data/
│   │   └── levels.ts             # Level tanımları
│   ├── utils/
│   │   ├── colors.ts             # Piece renk haritası
│   │   └── constants.ts          # Sabitler (animasyon süreleri vs.)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/
│   ├── GAME_DESIGN.md
│   ├── TECH_SPEC.md
│   └── LEVEL_FORMAT.md
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── vercel.json
```

## Core Types

```typescript
// Bir parçayı temsil eder
interface Piece {
  id: string;          // Unique ID (animasyon tracking için)
  value: number;       // 2, 4, 8, 16, 32, 64, 128, 256...
}

// Bir tüpü temsil eder
interface Tube {
  id: string;          // Unique ID
  capacity: number;    // Max kaç parça alabilir (ör: 5)
  pieces: Piece[];     // Alt'tan üste sıralı (index 0 = en alt)
}

// Level tanımı
interface Level {
  id: number;
  name: string;
  tubes: TubeConfig[];     // Başlangıç tüp konfigürasyonları
  targetPieceCount: number; // Kazanma hedefi
}

interface TubeConfig {
  capacity: number;
  initialPieces: number[]; // Değerler listesi, alttan üste (boş tüp = [])
}

// Oyun durumu
interface GameState {
  level: Level;
  tubes: Tube[];
  selectedTubeId: string | null; // Seçili tüp
  moveCount: number;
  isWon: boolean;
  isAnimating: boolean;          // Animasyon sırasında input engelle
  totalPieces: number;           // Mevcut toplam parça sayısı
}

// Oyun aksiyonları
type GameAction =
  | { type: 'SELECT_TUBE'; tubeId: string }
  | { type: 'MOVE_PIECE'; fromTubeId: string; toTubeId: string }
  | { type: 'MERGE_PIECES'; tubeId: string }
  | { type: 'CHAIN_MERGE'; tubeId: string }
  | { type: 'CHECK_WIN' }
  | { type: 'RESTART_LEVEL' }
  | { type: 'SET_ANIMATING'; value: boolean };
```

## Core Logic — Pseudo Code

### canMovePiece(fromTube, toTube): boolean
```
1. fromTube boş mu? → false
2. toTube kapasitesi dolu mu? → false
3. toTube boş mu? → true (herhangi bir parça konabilir)
4. fromTube'un en üst parçası <= toTube'un en üst parçası mı? → true/false
```

### movePiece(fromTube, toTube): { newFromTube, newToTube, merged: boolean }
```
1. canMovePiece kontrolü
2. Parçayı fromTube'dan pop et
3. toTube boş mu? → direkt push
4. toTube'un en üstü aynı değer mi? → MERGE (iki parça → bir parça, değer 2x)
5. Farklı değer (ama kural uygun) → direkt push
6. Return updated tubes + merge oldu mu bilgisi
```

### checkChainReaction(tube): Tube
```
1. Tüpte en az 2 parça var mı? → yoksa return
2. En üst iki parça aynı değer mi?
3. Evetse → merge et, tekrar kontrol (recursive/loop)
4. Hayırsa → return
```

### isStuck(gameState): boolean
```
1. Tüm tüp çiftlerini kontrol et
2. Herhangi bir (from, to) çifti için canMovePiece true dönüyorsa → not stuck
3. Hiçbir hamle yoksa → stuck
```

### checkWin(gameState): boolean
```
1. totalPieces <= level.targetPieceCount → WIN
```

## Animasyon Planı (Framer Motion)

| Animasyon | Süre | Easing | Detay |
|-----------|------|--------|-------|
| Piece Select | 150ms | easeOut | Y: -20px, scale: 1.1 |
| Piece Move | 300ms | easeInOut | Position tween (ark) |
| Merge Pop | 250ms | spring | Scale: 1.0 → 1.3 → 1.0 |
| Chain Delay | 200ms | - | Her chain step arası bekleme |
| Invalid Shake | 300ms | easeInOut | X: ±5px, 3 tekrar |
| Win Celebration | 500ms | - | Scale + opacity + confetti |

## State Flow

```
User taps Tube A → SELECT_TUBE(A)
  → A'nın en üst parçası highlight olur

User taps Tube B → 
  if canMovePiece(A, B):
    SET_ANIMATING(true)
    → Move animasyonu
    → MOVE_PIECE(A, B)
    → if merged: Merge animasyonu
    → CHAIN_MERGE(B) → chain animasyonları
    → CHECK_WIN
    → SET_ANIMATING(false)
  else:
    → Invalid shake animasyonu
    → Seçim iptal (selectedTubeId = null)

User taps Tube A again → deselect (selectedTubeId = null)
```

## Responsive Design
- Desktop: Tüpler yan yana, parçalar net görünür
- Mobile: Tüpler daha küçük ama yine yan yana, tap-friendly hitbox'lar
- Minimum tüp genişliği: 60px
- Minimum parça yüksekliği: 40px
- Board ortalanmış, max-width: 600px
