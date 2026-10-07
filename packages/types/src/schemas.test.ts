import { describe, expect, it } from 'vitest';

import {
  DEFAULT_FEATURE_FLAGS,
  FeatureFlagsSchema,
  MirakilPushDataV1Schema,
  TenantPublicConfigSchema,
} from './index.js';

const validConfig = {
  id: '01927c1e-6b1d-7c4e-9f4a-2f6c0e8b1a11',
  code: 'ornek-uni',
  name: 'Örnek Üniversitesi Kütüphanesi',
  deploymentMode: 'CENTRAL',
  apiBaseUrl: 'https://api.koha-tr.com',
  branding: { primaryColor: '#8B0000', secondaryColor: '#F2B705' },
  locale: 'tr',
  timezone: 'Europe/Istanbul',
  currency: 'TRY',
  features: DEFAULT_FEATURE_FLAGS,
  authProviders: [{ id: 'ap_1', type: 'KOHA', displayName: 'Kütüphane Hesabı' }],
  minAppVersion: '1.0.0',
  configVersion: '2026-10-07T00:00:00Z',
};

describe('TenantPublicConfigSchema', () => {
  it('geçerli bir yapılandırmayı kabul eder', () => {
    expect(TenantPublicConfigSchema.parse(validConfig).code).toBe('ornek-uni');
  });

  it('Koha bağlantı bilgisi gibi bilinmeyen alanları reddeder', () => {
    const leaked = { ...validConfig, kohaApiUrl: 'https://koha.example.edu.tr/api/v1' };
    expect(TenantPublicConfigSchema.safeParse(leaked).success).toBe(false);
  });

  it('https olmayan Gateway adresini reddeder', () => {
    const insecure = { ...validConfig, apiBaseUrl: 'http://api.koha-tr.com' };
    expect(TenantPublicConfigSchema.safeParse(insecure).success).toBe(false);
  });
});

describe('FeatureFlagsSchema', () => {
  it('eksik bayrağı reddeder', () => {
    const { payments: _omitted, ...partial } = DEFAULT_FEATURE_FLAGS;
    expect(FeatureFlagsSchema.safeParse(partial).success).toBe(false);
  });
});

describe('MirakilPushDataV1Schema', () => {
  const data = {
    v: 1,
    nid: 'nt_01J9X',
    t: 'DUE_SOON',
    dl: 'mirakil://notifications/nt_01J9X',
  };

  it('opak kimliklerden oluşan payload kabul edilir', () => {
    expect(MirakilPushDataV1Schema.parse(data).t).toBe('DUE_SOON');
  });

  it('kişisel veri taşıyabilecek ek alanlar reddedilir', () => {
    expect(MirakilPushDataV1Schema.safeParse({ ...data, title: 'Suç ve Ceza' }).success).toBe(
      false,
    );
  });
});
