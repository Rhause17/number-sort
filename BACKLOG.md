# BACKLOG - Number Sort

Tüm commit'lerin kronolojik kaydı.

---

## Commit #1 — `6d4fbfe` — Initial commit: Number Sort puzzle game

- Proje sıfırdan oluşturuldu (Vite + React + TypeScript + Tailwind)
- 50 level tasarlandı (`src/data/levels.json`)
  - Level 1-9: elle tasarlanmış tutorial/beginner seviyeler
  - Level 10-50: kurallara göre tasarlandı (chaotic placement, blocking, trap moves, progressive difficulty)
  - Tüm level'lar target=1 (toplam = 2'nin kuvveti)
- Oyun motoru: `src/engine/` (gameLogic, chainReaction, stuckDetection, types)
- Bileşenler: Board, Tube, Piece, Game, HUD, LevelSelect, WinScreen, StuckPopup, FlyingPiece, MergeEffect
- Level editörü: `src/editor/` (EditorPage, TubeEditor, ToolPalette, ActionBar, LevelSettings, solver, validation)
  - BFS solver ile minimum piece hesaplama
  - Async solver (chunked setTimeout) UI block etmeden çalışır
  - Debounced calculation (500ms) + abort signal
- İki satırlı tube layout (top/bottom row) — sadece 6+ tube olan level'larda
- Board.tsx: her iki satırda da `flex-end` ile alt kenar hizalama
- Vercel deploy konfigürasyonu (`vercel.json`)
- Express dev server (`server.js`) editör API'si için

---

## Commit #2 — `f0c1dc5` — Fix unused variable TypeScript error in TubeEditor

- `TubeEditor.tsx`: `onAddPiece` destructure edilip kullanılmıyordu → `_onAddPiece` olarak rename edildi
- Vercel production build başarılı oldu
- Deploy: https://number-sort.vercel.app

---

## Commit #3 — `8c089b4` — Add BACKLOG.md and HISTORY.md for tracking, update CLAUDE.md

- `BACKLOG.md` oluşturuldu: her commit sonrası kronolojik değişiklik kaydı
- `HISTORY.md` oluşturuldu: context compaction sırasında konuşma hafızası kaydı
- `CLAUDE.md` güncellendi: hafıza yönetimi kuralları ve güncel proje durumu eklendi

---

## Commit #4 — `238a010` — Update BACKLOG.md with commit #3 entry

- BACKLOG.md'ye commit #3 bilgileri eklendi

---

## Commit #5 — `df8670f` — Redesign levels 10-50, add difficulty analyzer

### Level Redesign (levels.json):
- Level 10-50 tamamen yeniden tasarlandı:
  - Chaotic piece placement, blocking structures, trap moves
  - Progressive difficulty (Medium → Hard → Expert → Master → Grandmaster)
  - Tüm level'lar target=1 (toplam = 2'nin kuvveti)
- Level 14: gereksiz boş tube kaldırıldı (4 → 3 tube)
- Row layout kuralı: sadece 6+ tube olan level'larda 2 satır
  - Sadece level 32 ve 34 `row` field'ları koruyor
  - Diğer tüm level'lardan `row` kaldırıldı

### Difficulty Analyzer (yeni):
- `tools/solver.js`: BFS solver
  - Mevcut editor solver'daki bug düzeltildi (canMove'da value ≤ target top kuralı eksikti)
  - Permutation-invariant state hashing (tube sırası önemsiz)
  - Empty tube equivalence pruning
  - Solution path tracking (parent pointers ile)
  - Solution verification (replay)
  - Timeout: 60s / 1M state
- `tools/analyzer.js`: Metrik hesaplama
  - Structural: fillRatio, capacityVariance, emptySlots, vs.
  - Blocking: avgBlockingDepth, mergePairsAccessible/Blocked
  - Solution: optimalMoves, totalMerges, chainReactions
  - Branching: avgBranchingFactor, deadEndRatio, decisionPointRatio
  - Composite score (0-100) two-pass min-max normalization ile
  - Issue detection (TOO_SHORT, TOO_EMPTY, LINEAR_PATH, vs.)
- `tools/analyze-all.js`: CLI runner
  - `node tools/analyze-all.js` (tüm 50 level)
  - `node tools/analyze-all.js --level N` (tek level)
  - Output: analysis/level-report.json, analysis/level-report.md, analysis/summary.md

### Analiz Sonuçları:
- 50/50 level çözülebilir
- Ortalama optimal moves: 7.6
- Ortalama fill ratio: 61%
- En yaygın sorunlar: FEW_TUBES (48), LINEAR_PATH (48), TOO_EMPTY (32), TOO_SHORT (25)
- Zorluk eğrisi: flat/mixed — iyileştirme gerekiyor
- 15 outlier (label vs computed tier uyuşmazlığı)

---

## Commit #6 — `fbb0c8f` — Add levels 51-90, add level generator with merge support

- 40 yeni level generate edildi (51-90):
  - Group 1 (51-60): Medium, 5-6 tube, values [2,4,8,16]
  - Group 2 (61-70): Hard, 5-6 tube, values [2,4,8,16,32]
  - Group 3 (71-80): Expert, 5-7 tube, values [2,4,8,16,32]
  - Group 4 (81-90): Grandmaster, 6-7 tube, values [2,4,8,16,32], tight fill
- `tools/generate-levels.js`: A* solver-verified rastgele level üretici
  - Group parametreleri: tubeCount, capacity, fill, values, moveRange, scoreRange
  - Metric checking (moves, fill ratio)
  - Composite score calculation
  - **FIX**: `new-levels.json` artık overwrite yerine merge yapıyor (mevcut level'ları korur)
- `tools/solver.js`: A* search mode eklendi (BFS'e ek olarak)
- `tools/test-solver.js`: Solver test utility
- `analysis/` klasörü: generation reports

---

## Commit #7-#9 — `5c94daf`, `d20debf`, `d6c0fb3` — UI fixes

- LevelSelect: 51-90 arası level'lar eklendi (difficultyGroups güncellendi)
- Board: 6+ tube auto-split (explicit row yoksa otomatik iki satır)
- Tube: overflow hidden → visible (lifted piece tüp üstünde görünsün)
- HUD: Level select tek tıklamayla açılır (4 tıklama kaldırıldı)
- Editor: sidebar kompakt, h-screen layout, ok tuşuyla level navigasyonu
- TubeEditor: Board.tsx ile aynı auto-split mantığı

---

## LEARNING

### targetPieceCount solver'dan alınmalı, rastgele set edilmemeli
- **Problem**: `generate-levels.js` targetPieceCount'u parametre aralığından rastgele seçiyordu (ör. [1,3]). Bu, solver'ın gerçekten ulaşabildiği minimum ile uyuşmayabilir. 12/40 level'da editörde manuel düzeltme gerekti.
- **Çözüm**: Solver çözdükten sonra, verification'ın final state'indeki gerçek piece count'u hesapla ve targetPieceCount'u buna set et. Rastgele aralık artık sadece layout üretiminde kullanılıyor, final değer her zaman solver-verified minimum.
- **Etki**: Manuel editör düzeltmesi ihtiyacı ortadan kalkar, her level otomatik olarak achievable minimum'a sahip olur.
