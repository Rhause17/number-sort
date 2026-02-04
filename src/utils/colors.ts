// colors.ts - Piece renk haritası

export const PIECE_COLORS: Record<number, string> = {
  2: '#EDE0C8',      // bej
  4: '#ECC894',      // açık turuncu
  8: '#F2A25C',      // turuncu
  16: '#F27C5C',     // koyu turuncu
  32: '#F75F3B',     // kırmızımsı turuncu
  64: '#EB4D28',     // kırmızı
  128: '#EDCF72',    // altın sarısı
  256: '#EDCC61',    // koyu altın
  512: '#EDC850',    // parlak altın
  1024: '#78C06E',   // yeşil
  2048: '#50B83B',   // parlak yeşil
};

// Parça değerine göre text rengi (kontrast için)
export const PIECE_TEXT_COLORS: Record<number, string> = {
  2: '#776E65',
  4: '#776E65',
  8: '#FFFFFF',
  16: '#FFFFFF',
  32: '#FFFFFF',
  64: '#FFFFFF',
  128: '#FFFFFF',
  256: '#FFFFFF',
  512: '#FFFFFF',
  1024: '#FFFFFF',
  2048: '#FFFFFF',
};

export const getColorForValue = (value: number): string => {
  return PIECE_COLORS[value] ?? '#3C3A32';
};

export const getTextColorForValue = (value: number): string => {
  return PIECE_TEXT_COLORS[value] ?? '#FFFFFF';
};
