# HISTORY - Conversation Log

Bu dosya context compaction sırasında güncellenir. Yeni session'larda buradan okunarak hafıza korunur.

---

## Session 1 — Proje Oluşturma (Önceki session, compaction'dan önce)

### Yapılanlar:
1. **Oyun motoru yazıldı**: Piece merging, chain reaction, stuck detection
2. **React bileşenleri**: Board, Tube, Piece (animasyonlu), Game, HUD, LevelSelect, WinScreen, StuckPopup
3. **Level editörü oluşturuldu**: `/editor` rotası, Express API ile JSON read/write
   - Visual tube editing, piece palette, drag-drop
   - BFS solver: minimum achievable piece count hesaplama
   - Async solver: UI block etmeden çalışır (chunked setTimeout)
   - Validation: power-of-2 totals, adjacent same values, empty tubes
   - Undo/redo desteği
4. **50 level tasarlandı** (levels.json)
5. **İlk 9 level** elle tasarlandı (tutorial/beginner)

### Kullanıcı Kuralları (Level Tasarımı):
- Target piece count = 1 (toplam = 2'nin kuvveti)
- Chaotic piece placement (sıralı yerleştirme yasak)
- Tube'lar %70-80+ dolu olmalı
- Blocking structures (küçük parçalar büyüklerin altında)
- Trap moves (bariz ilk hamle çıkmaza götürmeli)
- Stratejik narrow tube'lar (capacity 3)
- Uzun çözüm yolları (medium: 8-12, hard: 12-18, expert: 18-25+)
- Tüm piece değerleri 2'nin kuvveti (2, 4, 8, 16, 32, 64, 128)
- Dikey komşu aynı değerler yasak
- Hamle kuralı: taşınan piece değeri ≤ hedef top piece değeri

### Level Grupları:
- Level 10-20: 2,4,8,16 kullanır (total=32)
- Level 21-30: 2,4,8,16,32 kullanır (total=64)
- Level 31-35: total=128
- Level 36-45: 64 kullanır (total=128)
- Level 46-50: 128 kullanır (total=256)

---

## Session 2 — Level Düzeltmeleri ve Deploy

### Yapılanlar:
1. **Level 10-50 yeniden tasarlandı** — chaotic, blocking, trap moves kurallarına uygun
2. **Power-of-2 total doğrulama** — check-levels.cjs scripti ile kontrol edildi
3. **Hata düzeltmeleri:**
   - Geçersiz piece değeri "6" düzeltildi (level 36-37)
   - ES Module hatası: .js → .cjs rename
   - Adjacent same values düzeltildi
4. **Board.tsx alignment fix**: Bottom row tube'ları `flex-end` ile alt kenardan hizalandı
5. **Row layout kuralı**: Sadece 6+ tube olan level'larda 2 satır kullanılır
   - Tüm < 6 tube level'lardan `row` field'ları kaldırıldı
   - Sadece level 32 ve 34 (6 tube) `row` field'ları koruyor
6. **Level 14**: Gereksiz boş alt tube kaldırıldı (3 tube'a düşürüldü)
7. **Git repo oluşturuldu**: https://github.com/Rhause17/number-sort
8. **Vercel deploy**: https://number-sort.vercel.app
9. **TypeScript fix**: TubeEditor.tsx'te unused variable düzeltildi

### Kullanıcı Tercihleri:
- Türkçe iletişim tercih ediyor
- Level'ları editörde test edip düzeltmeyi planlıyor
- Vercel üzerinden canlı test yapıyor

### Açık Konular / Sonraki Adımlar:
- Level'lar editörde test edilecek ve gerekirse düzenlenecek
- Solver ile tüm level'ların çözülebilirliği doğrulanacak
- BACKLOG.md ve HISTORY.md her commit/compaction'da güncellenecek
