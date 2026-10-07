import { describe, expect, it } from 'vitest';

import { contrastRatio, ensureContrast, onColor } from './color.js';
import { createTheme } from './theme.js';

describe('contrastRatio', () => {
  it('siyah/beyaz 21:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });
});

describe('ensureContrast', () => {
  it('yeterli kontrastı olan rengi değiştirmez', () => {
    expect(ensureContrast('#8B0000', '#FFFFFF')).toBe('#8B0000');
  });

  it('açık kurum rengini beyaz zeminde okunur hale getirir', () => {
    const adjusted = ensureContrast('#F2B705', '#FFFFFF');
    expect(contrastRatio(adjusted, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('koyu kurum rengini koyu zeminde açar', () => {
    const adjusted = ensureContrast('#0B3D91', '#0B0F14');
    expect(contrastRatio(adjusted, '#0B0F14')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('createTheme', () => {
  it.each(['light', 'dark'] as const)(
    '%s temada vurgu renkleri en az 3:1 kontrastlıdır',
    (scheme) => {
      const theme = createTheme(scheme, { primaryColor: '#FFE600', secondaryColor: '#101010' });
      expect(contrastRatio(theme.primary, theme.background)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(theme.secondary, theme.background)).toBeGreaterThanOrEqual(3);
      expect(theme.onPrimary).toBe(onColor(theme.primary));
    },
  );
});
