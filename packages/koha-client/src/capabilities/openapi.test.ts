import { describe, expect, it } from 'vitest';

import {
  modernSpecWithPlugin,
  olderSpecWithoutPlugin,
  specWithoutPasswordValidation,
} from '../../test/fixtures/specs.js';
import { detectSpecCapabilities, normalizePath } from './openapi.js';

describe('normalizePath', () => {
  it('parametre adlarını ve sondaki eğik çizgiyi yok sayar', () => {
    expect(normalizePath('/patrons/{patron_id}/account/')).toBe('/patrons/{}/account');
    expect(normalizePath('/patrons/{id}/account')).toBe('/patrons/{}/account');
  });
});

describe('detectSpecCapabilities', () => {
  it('$ref ve allOf üzerinden istek gövdesindeki `identifier` alanını bulur', () => {
    const caps = detectSpecCapabilities(modernSpecWithPlugin());
    expect(caps.has('rest.auth.passwordValidation')).toBe(true);
    expect(caps.has('rest.auth.passwordValidation.identifier')).toBe(true);
  });

  it('`identifier` alanı olmayan eski uçta yalnızca temel yeteneği raporlar', () => {
    const caps = detectSpecCapabilities(olderSpecWithoutPlugin());
    expect(caps.has('rest.auth.passwordValidation')).toBe(true);
    expect(caps.has('rest.auth.passwordValidation.identifier')).toBe(false);
  });

  it('query parametresine bağlı yeteneği ayırt eder', () => {
    expect(
      detectSpecCapabilities(modernSpecWithPlugin()).has('rest.checkouts.list.checkedIn'),
    ).toBe(true);
    expect(
      detectSpecCapabilities(olderSpecWithoutPlugin()).has('rest.checkouts.list.checkedIn'),
    ).toBe(false);
  });

  it('yol düzeyindeki ($ref) parametreleri olan uçları tanır', () => {
    expect(detectSpecCapabilities(olderSpecWithoutPlugin()).has('rest.patrons.get')).toBe(true);
  });

  it('eklenti rotalarını spec içinden tespit eder', () => {
    expect(detectSpecCapabilities(modernSpecWithPlugin()).has('plugin.search')).toBe(true);
    expect(detectSpecCapabilities(olderSpecWithoutPlugin()).has('plugin.search')).toBe(false);
  });

  it('eksik uçları raporlamaz', () => {
    expect(
      detectSpecCapabilities(specWithoutPasswordValidation()).has('rest.auth.passwordValidation'),
    ).toBe(false);
  });

  it.each([null, 'html', 42, { paths: 'bozuk' }, { paths: { '/x': { get: null } } }])(
    'bozuk girdide hata fırlatmaz: %j',
    (input) => {
      expect(detectSpecCapabilities(input).size).toBe(0);
    },
  );

  it("döngüsel $ref içeren spec'te takılmaz", () => {
    const spec = modernSpecWithPlugin();
    (spec.definitions as Record<string, unknown>).loop = { $ref: '#/definitions/loop' };
    (spec.paths['/holds'] as Record<string, unknown>).post = {
      parameters: [{ in: 'body', name: 'body', schema: { $ref: '#/definitions/loop' } }],
    };
    expect(detectSpecCapabilities(spec).has('rest.holds.create')).toBe(true);
  });
});
