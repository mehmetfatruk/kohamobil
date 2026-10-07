import { describe, expect, it } from 'vitest';

import { extractGeneratorVersion, formatKohaVersion, parseKohaVersion } from './version.js';

describe('parseKohaVersion', () => {
  it.each([
    ['24.05.02.000', '24.05.02'],
    ['Koha 24.0502000', '24.05.02'],
    ['Koha 22.1106000', '22.11.06'],
    ['25.11.00', '25.11.00'],
  ])('%s → %s', (input, expected) => {
    const version = parseKohaVersion(input);
    expect(version && formatKohaVersion(version)).toBe(expected);
  });

  it('tanınmayan girdide null döner', () => {
    expect(parseKohaVersion('Koha')).toBeNull();
  });
});

describe('extractGeneratorVersion', () => {
  it('OPAC meta etiketinden sürümü okur', () => {
    const html = '<html><head><meta name="generator" content="Koha 23.1108000" /></head></html>';
    expect(extractGeneratorVersion(html)?.minor).toBe(11);
  });

  it('Koha olmayan generator etiketini yok sayar', () => {
    expect(extractGeneratorVersion('<meta name="generator" content="WordPress 6.5">')).toBeNull();
  });
});
