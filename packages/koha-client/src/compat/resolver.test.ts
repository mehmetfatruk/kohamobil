import { describe, expect, it } from 'vitest';

import {
  modernSpecWithPlugin,
  olderSpecWithoutPlugin,
  specWithoutPasswordValidation,
} from '../../test/fixtures/specs.js';
import type { CapabilityId } from '../capabilities/catalog.js';
import { detectSpecCapabilities } from '../capabilities/openapi.js';
import { effectiveFeatures } from './features.js';
import { OPERATIONS } from './operations.js';
import { resolveCompatibility } from './resolver.js';

const capsOf = (spec: unknown, extra: CapabilityId[] = []) =>
  new Set<CapabilityId>([...detectSpecCapabilities(spec), ...extra]);

describe('resolveCompatibility', () => {
  it('yeni Koha + eklenti: FULL ve öncelikli stratejiler seçilir', () => {
    const report = resolveCompatibility(capsOf(modernSpecWithPlugin()));
    expect(report.supportLevel).toBe('FULL');
    expect(report.profile['patron.validateCredentials']).toBe('rest.passwordValidation.identifier');
    expect(report.profile['loans.renew']).toBe('rest.checkouts.renewals');
    expect(report.profile['catalog.search']).toBe('plugin.search');
    expect(report.profile['loans.renewabilityBulk']).toBe('plugin.renewability');
  });

  it('eski Koha, eklentisiz: LIMITED; farklar alternatif stratejilerle karşılanır', () => {
    const report = resolveCompatibility(capsOf(olderSpecWithoutPlugin()));
    expect(report.supportLevel).toBe('LIMITED');
    expect(report.profile['patron.validateCredentials']).toBe('rest.passwordValidation.userid');
    expect(report.profile['loans.renew']).toBe('rest.checkouts.renewal');
    expect(report.profile['holds.pickupLocations']).toBe('rest.libraries.all');
    expect(report.missing.mvp).toEqual(['catalog.search']);
    expect(report.missing.core).toEqual([]);
  });

  it('zorunlu çekirdek eksikse UNSUPPORTED ve eksik işlem raporlanır', () => {
    const report = resolveCompatibility(capsOf(specWithoutPasswordValidation()));
    expect(report.supportLevel).toBe('UNSUPPORTED');
    expect(report.missing.core).toEqual(['patron.validateCredentials']);
  });

  it('ILS-DI yeteneği varsa eksik REST doğrulamasının yerini alabilir', () => {
    const report = resolveCompatibility(
      capsOf(specWithoutPasswordValidation(), ['ilsdi.AuthenticatePatron']),
    );
    expect(report.profile['patron.validateCredentials']).toBe('ilsdi.authenticatePatron');
    expect(report.supportLevel).not.toBe('UNSUPPORTED');
  });

  it('OAuth2 yoksa Basic auth yapılandırması servis kimlik doğrulamasını karşılar', () => {
    const spec = olderSpecWithoutPlugin();
    delete spec.paths['/oauth/token'];
    expect(resolveCompatibility(capsOf(spec)).missing.core).toContain('service.authenticate');
    expect(
      resolveCompatibility(capsOf(spec, ['service.basicAuth'])).profile['service.authenticate'],
    ).toBe('rest.basicAuth');
  });

  it('strateji kimlikleri her işlem içinde benzersizdir', () => {
    for (const [operation, definition] of Object.entries(OPERATIONS)) {
      const ids = definition.strategies.map((s) => s.id);
      expect(new Set(ids).size, operation).toBe(ids.length);
    }
  });
});

describe('effectiveFeatures', () => {
  it('Koha desteklemiyorsa admin açmış olsa bile özellik kapanır', () => {
    const { profile } = resolveCompatibility(capsOf(olderSpecWithoutPlugin()));
    const flags = effectiveFeatures(
      { catalogSearch: true, renewals: true, history: true, announcements: true, payments: false },
      profile,
    );
    expect(flags).toEqual({
      catalogSearch: false,
      renewals: true,
      history: false,
      announcements: true,
      payments: false,
    });
  });
});
