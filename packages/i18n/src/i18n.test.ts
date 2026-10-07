import { ERROR_CODES } from '@mirakil/types';
import { describe, expect, it } from 'vitest';

import { errorMessage, resolveLocale, resources } from './index.js';

describe('resolveLocale', () => {
  it.each([
    ['en-US,en;q=0.9', 'en'],
    ['tr-TR', 'tr'],
    ['de-DE,fr;q=0.8', 'tr'],
    [undefined, 'tr'],
  ])('%s → %s', (input, expected) => {
    expect(resolveLocale(input)).toBe(expected);
  });
});

describe('errorMessage', () => {
  it('her hata kodu için her dilde boş olmayan metin vardır', () => {
    for (const locale of ['tr', 'en'] as const) {
      for (const code of ERROR_CODES) {
        expect(resources[locale].errors[code].length).toBeGreaterThan(0);
      }
    }
  });

  it('yer tutucuları doldurur', () => {
    expect(errorMessage('INTERNAL_ERROR', 'tr', { correlationId: 'abc' })).toContain('abc');
  });
});

describe('push şablonları', () => {
  it('kişisel veri yer tutucusu içermez', () => {
    for (const locale of ['tr', 'en'] as const) {
      for (const text of Object.values(resources[locale].push)) {
        expect(text).not.toMatch(/\{\{/);
      }
    }
  });
});
