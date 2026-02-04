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
