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

describe('başlık geçişi', () => {
  it.each(['#1A73E8', '#8B1E3F', '#F2B705', '#FFFFFF', '#000000'])(
    '%s kurum renginde başlık metni iki uçta da okunur',
    (primaryColor) => {
      for (const scheme of ['light', 'dark'] as const) {
        const theme = createTheme(scheme, { primaryColor });
        expect(contrastRatio(theme.onHero, theme.heroStart)).toBeGreaterThanOrEqual(3);
        expect(contrastRatio(theme.onHero, theme.heroMid)).toBeGreaterThanOrEqual(3);
        expect(contrastRatio(theme.onHero, theme.heroEnd)).toBeGreaterThanOrEqual(3);
      }
    },
  );
});

describe('MirAkıl kurumsal renkleri', () => {
  it('varsayılan tema web sitesindeki logo mavisini ve geçişi kullanır', () => {
    const theme = createTheme('light');
    expect(theme.primary).toBe('#0055A4');
    expect([theme.heroStart, theme.heroMid, theme.heroEnd]).toEqual([
      '#0A63B8',
      '#0055A4',
      '#0F4A74',
    ]);
    expect(theme.onHero).toBe('#FFFFFF');
  });
});
