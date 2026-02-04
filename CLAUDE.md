# CLAUDE.md — Number Sort

## Proje Özeti
Number Sort, tube sort + 2048 number merge hybrid bir puzzle oyunudur. React + TypeScript + Vite ile geliştirilir, Vercel'e deploy edilir.

## Dokümanlar
Bu dosyaları her zaman referans al:
- `docs/GAME_DESIGN.md` — Oyun mekaniği, kurallar, interaction flow
- `docs/TECH_SPEC.md` — Tech stack, type tanımları, proje yapısı, animasyon planı
- `docs/LEVEL_FORMAT.md` — Level JSON formatı, örnek level ve çözüm yolu

## Temel Kurallar

### Game Logic (Kritik)
1. Sadece en üst parça alınabilir
2. Parça yerleştirme: parça değeri ≤ hedef tüpün üst parçası (boş tüpe her şey konur)
3. Aynı değer → MERGE (2x), ardından chain reaction kontrol
4. Chain reaction: merge sonucu oluşan parça, altındakiyle aynıysa tekrar merge (recursive)
5. Kapasite dolu tüpe parça konulamaz
6. Kazanma: toplam parça sayısı ≤ targetPieceCount

### Code Style
- TypeScript strict mode
- Fonksiyonel componentler, hooks kullan
- State management: useReducer ile GameState yönetimi
- Animasyonlar Framer Motion ile
- Tailwind utility classes
- Her dosya tek bir sorumluluk taşısın

### Yapılmaması Gerekenler
- Class component kullanma
- Global mutable state kullanma
- Animasyon sırasında user input'u kabul etme (isAnimating flag)
- Console.log'ları production'da bırakma

## Build & Run
```bash
npm install
npm run dev      # Local development
npm run build    # Production build
npm run preview  # Preview production build
```

## Hafıza Yönetimi (ÖNEMLİ)
- **BACKLOG.md**: Her commit sonrası commit hash ve değişiklik detayları eklenir. Silme/üzerine yazma yapma, sadece append et.
- **HISTORY.md**: Her context compaction sırasında son konuşma özetleri eklenir. Yeni session'da buradan oku ve hafızayı koru. Silme/üzerine yazma yapma, sadece append et.
- Her commit'te BACKLOG.md güncelle, her compaction'da HISTORY.md güncelle.

## Mevcut Durum
- 50 level tasarlandı ve deploy edildi
- Level editörü çalışıyor (`/editor` rotası, dev server gerekli)
- Vercel deploy: https://number-sort.vercel.app
- GitHub: https://github.com/Rhause17/number-sort
- Level'lar editörde test edilip düzenlenecek
