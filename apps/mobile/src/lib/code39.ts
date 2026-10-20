/**
 * Code 39 barkod kodlayıcı — kütüphane bankolarındaki el okuyucularının çoğu tarafından okunur.
 * Her karakter 9 elemandan (5 çubuk, 4 boşluk) oluşur; 3'ü geniştir. 1 = geniş, 0 = dar.
 */
const PATTERNS: Record<string, string> = {
  '0': '000110100',
  '1': '100100001',
  '2': '001100001',
  '3': '101100000',
  '4': '000110001',
  '5': '100110000',
  '6': '001110000',
  '7': '000100101',
  '8': '100100100',
  '9': '001100100',
  A: '100001001',
  B: '001001001',
  C: '101001000',
  D: '000011001',
  E: '100011000',
  F: '001011000',
  G: '000001101',
  H: '100001100',
  I: '001001100',
  J: '000011100',
  K: '100000011',
  L: '001000011',
  M: '101000010',
  N: '000010011',
  O: '100010010',
  P: '001010010',
  Q: '000000111',
  R: '100000110',
  S: '001000110',
  T: '000010110',
  U: '110000001',
  V: '011000001',
  W: '111000000',
  X: '010010001',
  Y: '110010000',
  Z: '011010000',
  '-': '010000101',
  '.': '110000100',
  ' ': '011000100',
  '*': '010010100',
};

export function encodeCode39(value: string): boolean[] {
  const text = `*${value.toUpperCase()}*`;
  const modules: boolean[] = [];
  for (const char of text) {
    const pattern = PATTERNS[char];
    if (!pattern) throw new Error(`Code 39 desteklemeyen karakter: ${char}`);
    [...pattern].forEach((wide, index) => {
      const bar = index % 2 === 0;
      const count = wide === '1' ? 3 : 1;
      for (let i = 0; i < count; i += 1) modules.push(bar);
    });
    modules.push(false); // karakterler arası boşluk
  }
  return modules;
}
