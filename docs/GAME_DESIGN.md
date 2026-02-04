# Number Sort — Game Design Document

## Konsept
Tube Sort + 2048 Number Merge hybrid puzzle oyunu. Oyuncu, tüpler arasında parçaları (numbered pieces) taşıyarak merge ettirip, board'daki toplam parça sayısını hedef sayıya düşürmeye çalışır.

## Temel Mekanikler

### 1. Board Yapısı
- Her level'da belirli sayıda **tüp (tube)** bulunur (ör: 4-7 tüp)
- Her tüpün bir **kapasitesi** vardır (ör: 5 slot)
- Tüpler dikey, parçalar alt'tan üste doğru yığılır (stack)
- Bazı tüpler başlangıçta **boş** olabilir (buffer tüp)

### 2. Parçalar (Pieces)
- Her parça bir **2^n değeri** taşır: 2, 4, 8, 16, 32, 64, 128, 256...
- Her değerin **kendine özgü bir rengi** vardır
- Renk paleti:
  - 2: #EDE0C8 (bej)
  - 4: #ECC894 (açık turuncu)
  - 8: #F2A25C (turuncu)
  - 16: #F27C5C (koyu turuncu)
  - 32: #F75F3B (kırmızımsı turuncu)
  - 64: #EB4D28 (kırmızı)
  - 128: #EDCF72 (altın sarısı)
  - 256: #EDCC61 (koyu altın)
  - 512: #EDC850 (parlak altın)
  - 1024: #78C06E (yeşil)
  - 2048: #50B83B (parlak yeşil)

### 3. Taşıma Kuralları
- Sadece tüpün **en üstündeki parça** alınabilir
- Parça başka bir tüpe konulabilir, EĞER:
  - Hedef tüp **dolu değilse** (kapasite müsaitse)
  - Taşınan parçanın değeri ≤ hedef tüpün en üstündeki parçanın değeri
  - Hedef tüp **boşsa** herhangi bir parça konulabilir
- Eğer hedef tüp tamamen doluysa, parça eski yerine döner

### 4. Merge Mekaniği (2048 Stili)
- Taşınan parça, hedef tüpün en üstündeki parçayla **aynı değerdeyse** → MERGE
- İki parça birleşir, yeni değer = 2x (ör: 2+2=4, 4+4=8)
- Merge sonrası **chain reaction** kontrol edilir:
  - Oluşan yeni parça, hemen altındaki parçayla da aynı değerdeyse → tekrar merge
  - Bu kontrol altında aynı değer kalmayıncaya kadar devam eder
- Merge, kapasite tüketmez (2 parça → 1 parça olur, slot açılır)

### 5. Kazanma Koşulu
- Her level'ın bir **target piece count** değeri vardır
- Board'daki toplam parça sayısı bu hedefe ulaştığında (veya altına düştüğünde) → **LEVEL WIN**
- Prototip için basit hedef: "Her tüpte en fazla 1 parça kalsın" veya spesifik bir sayı
- UI'da gösterilir: "Pieces: 12/4" (mevcut / hedef)

### 6. Kaybetme / Stuck Durumu
- Hiçbir hamle yapılamıyorsa oyuncu **stuck** durumunda
- "Restart Level" butonu her zaman erişilebilir
- Stuck detection: Tüm olası hamlelerin kontrol edilmesi (hiçbir parça hiçbir yere gidemiyorsa)
- Prototipte stuck olduğunda otomatik bildirim veya sadece restart butonu yeterli

## Interaction Flow

### Tap-to-Select Modeli (Mobil-dostu)
1. Oyuncu bir tüpe **tap** yapar → en üst parça "seçilir" (yukarı zıplar / highlight)
2. Oyuncu başka bir tüpe **tap** yapar:
   - Geçerli hamleyse → parça animasyonla taşınır, merge kontrolü yapılır
   - Geçersiz hamleyse → parça eski yerine döner, kısa shake animasyonu
3. Aynı tüpe tekrar tap → seçim iptal

### Animasyonlar
- **Select**: Parça tüpten ~20px yukarı çıkar
- **Move**: Parça ark çizerek hedef tüpe gider (~300ms)
- **Merge**: İki parça birleşir, pop/scale animasyonu, yeni sayı belirir
- **Chain**: Ardışık merge'ler için kısa gecikme (~200ms) ile cascade
- **Win**: Confetti veya parlama efekti
- **Invalid**: Kısa shake/bounce-back

## Level Tasarımı İlkeleri
- Her level çözülebilir olmalı (en az bir çözüm yolu)
- Boş tüpler stratejik buffer alanı sağlar
- Zorluk artışı: daha fazla tüp, daha fazla farklı değer, daha az boş tüp
- Level'lar JSON formatında tanımlanır (bkz: LEVEL_FORMAT.md)
