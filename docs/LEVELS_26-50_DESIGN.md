# Level 26-50 Design & Solutions

## Tasarım Kuralları
- Aynı değerler yan yana (üst üste) OLAMAZ
- Büyük değer küçüğün üstünde OLABİLİR (initial'da serbest)
- Boş tüp olmayan level'larda ilk hamlede merge yapılabilecek çift ZORUNLU

---

## TYPE A: Big Numbers (Level 26-30)
5-6 tüp, 0-1 boş tüp, 64/32 değerleri ağırlıklı

### Level 26: Rising Giant
```
Difficulty: Master
Tubes: 5, Empty: 1, Capacity: 5
Target: 3

A: [32, 16, 8, 4, 2]  (5)
B: [32, 16, 8, 4, 2]  (5)
C: [16, 8, 4, 2]      (4)
D: [8, 4, 2]          (3)
E: []                 (0)

Total: 17 pieces
```

**Çözüm:**
```
Initial: A[32,16,8,4,2] B[32,16,8,4,2] C[16,8,4,2] D[8,4,2] E[] | Total: 17

Step 1: D→C (2→2, merge→4, chain 4+4=8, chain 8+8=16, chain 16+16=32)
  A[32,16,8,4,2] B[32,16,8,4,2] C[32] D[8,4] E[] | Total: 13

Step 2: A→B (2→2, merge→4, chain→8, chain→16, chain→32, chain→64)
  A[32,16,8,4] B[64] C[32] D[8,4] E[] | Total: 8

Step 3: D→A (4→4, merge→8, chain 8+8=16, chain 16+16=32, chain 32+32=64)
  A[64] B[64] C[32] D[8] E[] | Total: 4

Step 4: A→B (64→64, merge→128)
  A[] B[128] C[32] D[8] E[] | Total: 3 ✓
```
**Result: 3 pieces (128, 32, 8) ✓**

---

### Level 27: Double Sixty-Four
```
Difficulty: Master
Tubes: 5, Empty: 0, Capacity: 5
Target: 3

A: [64, 32, 16, 8, 4]  (5)
B: [32, 16, 8, 4, 2]   (5) ← has 2 for merge
C: [32, 16, 8, 4, 2]   (5) ← has 2 for merge
D: [16, 8, 4, 2]       (4)
E: [8, 4, 2]           (3)

Total: 22 pieces
First move merge: B(2)→C(2) or C(2)→B(2) or D(2)→E(2) etc.
```

**Çözüm:**
```
Initial: A[64,32,16,8,4] B[32,16,8,4,2] C[32,16,8,4,2] D[16,8,4,2] E[8,4,2] | Total: 22

Step 1: E→D (2→2, merge→4, chain→8, chain→16, chain→32)
  A[64,32,16,8,4] B[32,16,8,4,2] C[32,16,8,4,2] D[32] E[8,4] | Total: 18

Step 2: B→C (2→2, merge→4, chain→8, chain→16, chain→32, chain→64)
  A[64,32,16,8,4] B[32,16,8,4] C[64] D[32] E[8,4] | Total: 13

Step 3: E→B (4→4, merge→8, chain→16, chain→32, chain→64)
  A[64,32,16,8,4] B[64] C[64] D[32] E[8] | Total: 9

Step 4: A→B (4→64? NO, 4≤64 ✓, no merge)
  A[64,32,16,8] B[64,4] C[64] D[32] E[8] | Total: 9

Hmm, let me try different:

Step 3 (alt): E→A (4→4, merge→8, chain→16, chain→32, chain→64, chain→128)
  A[128] B[32,16,8,4] C[64] D[32] E[8] | Total: 8

Step 4: B→C (4≤64, no merge)
  A[128] B[32,16,8] C[64,4] D[32] E[8] | Total: 8

Step 5: B→D (8≤32, no merge)
  A[128] B[32,16] C[64,4] D[32,8] E[8] | Total: 8

Step 6: E→D (8→8, merge→16)
  A[128] B[32,16] C[64,4] D[32,16] E[] | Total: 7

Step 7: B→D (16→16, merge→32, chain→64)
  A[128] B[32] C[64,4] D[64] E[] | Total: 5

Step 8: D→C (64→64, merge→128)
  A[128] B[32] C[128,4] D[] E[] | Total: 4

Step 9: A→C (128→4? NO! 128>4 INVALID)

Hmm stuck. Let me redesign Level 27.
```

### Level 27: Double Sixty-Four (Redesign)
```
Difficulty: Master
Tubes: 5, Empty: 0, Capacity: 5
Target: 4

A: [32, 16, 8, 4, 2]   (5) ← pyramid
B: [32, 16, 8, 4, 2]   (5) ← pyramid
C: [16, 8, 4, 2]       (4) ← pyramid
D: [16, 8, 4, 2]       (4) ← pyramid, D(2)→C(2) için
E: [8, 4, 2]           (3)

Total: 21 pieces
First move: D(2)→C(2) merge
```

**Çözüm:**
```
Initial: A[32,16,8,4,2] B[32,16,8,4,2] C[16,8,4,2] D[16,8,4,2] E[8,4,2] | Total: 21

Step 1: D→C (2→2, merge→4, chain→8, chain→16, chain→32)
  A[32,16,8,4,2] B[32,16,8,4,2] C[32] D[16,8,4] E[8,4,2] | Total: 17

Step 2: E→D (2→4? 2≤4 ✓, no merge)
  A[32,16,8,4,2] B[32,16,8,4,2] C[32] D[16,8,4,2] E[8,4] | Total: 17

Step 3: E→A (4→2? 4>2 INVALID)

Let me try:
Step 2: A→B (2→2, merge→4, chain→8, chain→16, chain→32, chain→64)
  A[32,16,8,4] B[64] C[32] D[16,8,4] E[8,4,2] | Total: 12

Step 3: E→D (2→4? 2≤4 ✓, no merge)
  A[32,16,8,4] B[64] C[32] D[16,8,4,2] E[8,4] | Total: 12

Step 4: E→A (4→4, merge→8, chain→16, chain→32, chain→64)
  A[64] B[64] C[32] D[16,8,4,2] E[8] | Total: 7

Step 5: A→B (64→64, merge→128)
  A[] B[128] C[32] D[16,8,4,2] E[8] | Total: 6

Step 6: D→C (2→32? 2≤32 ✓, no merge)
  A[] B[128] C[32,2] D[16,8,4] E[8] | Total: 6

Step 7: D→E (4→8? 4≤8 ✓, no merge)
  A[] B[128] C[32,2] D[16,8] E[8,4] | Total: 6

Step 8: D→E (8→4? 8>4 INVALID)

Stuck again. Let me simplify and use simpler targets.

Actually, let me design all levels more carefully with targets I can verify.
```

---

I'll redesign all levels more carefully now. Let me use proven patterns and set achievable targets.

