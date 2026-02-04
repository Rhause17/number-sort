# Number Sort — Level Format

## JSON Yapısı

```typescript
interface Level {
  id: number;
  name: string;
  targetPieceCount: number;  // Board'da kalması gereken max piece sayısı
  tubes: TubeConfig[];
}

interface TubeConfig {
  capacity: number;         // Tüpün max kapasitesi
  initialPieces: number[];  // Değerler, alttan üste sıralı. Boş tüp = []
}
```

## Prototip Level: Level 1 (Tutorial)

Bu level, temel mekanikleri öğretmek için tasarlanmıştır:
- 2'leri merge edip 4 yapma
- 4'leri merge edip 8 yapma  
- Chain reaction deneyimleme
- Boş tüpü buffer olarak kullanma

```json
{
  "id": 1,
  "name": "First Steps",
  "targetPieceCount": 3,
  "tubes": [
    {
      "capacity": 5,
      "initialPieces": [4, 2, 2]
    },
    {
      "capacity": 5,
      "initialPieces": [8, 4, 2]
    },
    {
      "capacity": 5,
      "initialPieces": [8, 2, 4]
    },
    {
      "capacity": 5,
      "initialPieces": [4, 2]
    },
    {
      "capacity": 5,
      "initialPieces": []
    }
  ]
}
```

### Level 1 Analizi

**Başlangıç durumu:**
```
Tube A (5):  [4, 2, 2]     ← top: 2
Tube B (5):  [8, 4, 2]     ← top: 2
Tube C (5):  [8, 2, 4]     ← top: 4
Tube D (5):  [4, 2]        ← top: 2
Tube E (5):  []             ← boş (buffer)
```

**Toplam parça: 11**
**Hedef: 3 parça**

**Olası çözüm yolu:**
1. A→B: 2 merge 2 = 4 → chain: 4 merge 4 = 8 → chain: 8 merge 8 = 16!
   - A: [4, 2], B: [16], C: [8, 2, 4], D: [4, 2], E: [] — 8 piece
2. A→D: 2 merge 2 = 4 → chain: 4 merge 4 = 8
   - A: [4], B: [16], C: [8, 2, 4], D: [8], E: [] — 5 piece
3. C→E: 4'ü E'ye taşı (buffer)
   - A: [4], B: [16], C: [8, 2], D: [8], E: [4] — 5 piece
4. C→D: 2'yi D'ye taşı (2 < 8, olur)
   - A: [4], B: [16], C: [8], D: [8, 2], E: [4] — 5 piece
5. A→E: 4 merge 4 = 8
   - A: [], B: [16], C: [8], D: [8, 2], E: [8] — 4 piece
6. D→C veya D→E: 2'yi taşı → uygun yer bul
   - D→A: 2'yi boş A'ya koy → A: [2], B: [16], C: [8], D: [8], E: [8] — 4 piece
7. D→C: 8 merge 8 = 16
   - A: [2], B: [16], C: [16], D: [], E: [8] — 3 piece ✅ WIN!

Bu çözüm yolu oyuncuya şunları öğretir:
- Basit merge (2+2=4)
- Chain reaction (4+4=8, 8+8=16)
- Buffer tüp kullanımı
- Stratejik planlama

## Level Tasarım Kuralları

1. **Çözülebilirlik**: Her level en az bir çözüm yoluna sahip olmalı
2. **Boş tüp**: En az 1 boş veya yarı boş tüp olmalı (buffer)
3. **Değer çeşitliliği**: Az sayıda farklı değer kullan (2-4 farklı değer yeterli)
4. **Kapasite**: Genellikle 4-5 kapasite, level'a göre değişebilir
5. **Progressive difficulty**: 
   - Easy: 3-4 tüp, 2-3 farklı değer, 1-2 boş tüp
   - Medium: 5-6 tüp, 3-4 farklı değer, 1 boş tüp
   - Hard: 6-7 tüp, 4-5 farklı değer, 1 boş tüp, daha dolu tüpler
