/** WCAG 2.x kontrast hesapları — kurum renklerinin okunabilirliğini garanti etmek için. */

export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) throw new Error(`Geçersiz renk: ${hex}`);
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((c) => Math.round(c).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

/** Rengi siyaha (amount>0) veya beyaza (amount<0) doğru karıştırır. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const target = amount > 0 ? 0 : 255;
  const t = Math.min(Math.abs(amount), 1);
  return rgbToHex({ r: r + (target - r) * t, g: g + (target - g) * t, b: b + (target - b) * t });
}

/**
 * `color`'ı `background` üzerinde en az `minRatio` kontrasta ulaşana kadar koyulaştırır veya
 * açar. Kurum rengine en yakın erişilebilir tonu döndürür.
 */
export function ensureContrast(color: string, background: string, minRatio = 4.5): string {
  if (contrastRatio(color, background) >= minRatio) return color.toUpperCase();
  const darken = relativeLuminance(background) > 0.5;
  for (let step = 0.05; step <= 1; step += 0.05) {
    const candidate = shade(color, darken ? step : -step);
    if (contrastRatio(candidate, background) >= minRatio) return candidate;
  }
  return darken ? '#000000' : '#FFFFFF';
}

/** Renk üzerindeki metin için siyah veya beyazdan daha okunaklı olanı. */
export function onColor(background: string): '#000000' | '#FFFFFF' {
  return contrastRatio('#FFFFFF', background) >= contrastRatio('#000000', background)
    ? '#FFFFFF'
    : '#000000';
}
