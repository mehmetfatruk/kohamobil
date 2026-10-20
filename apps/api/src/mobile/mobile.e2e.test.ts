import { randomBytes } from 'node:crypto';

import { createFakeKoha, modernSpecWithPlugin } from '@mirakil/koha-client/testing';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module.js';
import { APP_CONFIG, loadConfig } from '../config/env.js';
import { configureApp, createFastifyAdapter } from '../http-app.js';
import { KOHA_FETCH, TENANT_SOURCE } from '../tenants/tenant-registry.service.js';
import { TenantEntrySchema, type LoadedTenant } from '../tenants/tenants-file.js';

const config = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'fatal',
  PUBLIC_API_URL: 'http://192.168.1.100:3000',
  JWT_SECRET: randomBytes(32).toString('hex'),
});

const spec = modernSpecWithPlugin();
for (const path of Object.keys(spec.paths))
  if (path.startsWith('/contrib')) delete spec.paths[path];
Object.assign(spec.paths, {
  '/biblios': { get: {} },
  '/items': { get: {} },
  '/items/{item_id}': { get: {} },
});

const fake = createFakeKoha({ spec });

const tenant: LoadedTenant = {
  entry: TenantEntrySchema.parse({
    code: 'koha-tr-demo',
    name: 'Koha-TR Demo Kütüphanesi',
    domains: ['koha-tr.com'],
    koha: {
      baseUrl: 'https://koha.test',
      auth: { kind: 'oauth2', clientId: 'mirakil', clientSecretFile: 'yok' },
    },
  }),
  secret: () => 'dogru-secret',
};

describe('Gateway /mobile/v1 (sahte Koha ile uçtan uca)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(APP_CONFIG)
      .useValue(config)
      .overrideProvider(TENANT_SOURCE)
      .useValue([tenant])
      .overrideProvider(KOHA_FETCH)
      .useValue(fake.fetch)
      .compile();
    app = configureApp(
      moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter()),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const call = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    options: { token?: string; body?: unknown } = {},
  ) => {
    const res = await app.inject({
      method,
      url,
      headers: {
        'accept-language': 'tr',
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body !== undefined ? { payload: options.body as object } : {}),
    });
    return {
      status: res.statusCode,
      body: res.body ? res.json<{ data?: any; code?: string; message?: string }>() : null,
    };
  };

  const login = async (identifier = 'test', password = 'sifre') =>
    call('POST', '/mobile/v1/auth/login', {
      body: { tenantCode: 'koha-tr-demo', providerId: 'ap_koha', identifier, password },
    });

  it('kurum dizini: listeler, alan adı/kod ile bulur, kayıtsız adresi bulmaz', async () => {
    const list = await call('GET', '/mobile/v1/tenants');
    expect(list.body?.data).toEqual([
      expect.objectContaining({ code: 'koha-tr-demo', apiBaseUrl: 'http://192.168.1.100:3000' }),
    ]);
    const byDomain = await call(
      'GET',
      `/mobile/v1/tenants/resolve?domain=${encodeURIComponent('https://koha-tr.com/cgi-bin/koha/opac-main.pl')}`,
    );
    expect(byDomain.body?.data.code).toBe('koha-tr-demo');
    expect((await call('GET', '/mobile/v1/tenants/resolve?code=koha-tr-demo')).status).toBe(200);
    const unknown = await call('GET', '/mobile/v1/tenants/resolve?domain=koha.baska.edu.tr');
    expect(unknown).toMatchObject({ status: 404, body: { code: 'TENANT_NOT_FOUND' } });
  });

  it('kurum yapılandırması Koha adresi veya secret içermez; özellikler Koha yeteneklerine göre', async () => {
    const { body } = await call('GET', '/mobile/v1/tenants/koha-tr-demo/config');
    const text = JSON.stringify(body);
    expect(text).not.toContain('koha.test');
    expect(text).not.toContain('dogru-secret');
    expect(text).not.toContain('mirakil"');
    expect(body?.data.features).toMatchObject({
      catalogSearch: true,
      renewals: true,
      holds: true,
      fines: true,
      passwordChange: false,
    });
  });

  it('giriş: hatalı bilgi tek tip hata, doğru bilgi token çifti', async () => {
    expect(await login('test', 'yanlis')).toMatchObject({
      status: 401,
      body: {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Kullanıcı adı/kart numarası veya şifre hatalı.',
      },
    });
    const ok = await login();
    expect(ok.status).toBe(200);
    expect(ok.body?.data).toMatchObject({ user: { displayName: 'Ayşe Yılmaz' } });
    expect(ok.body?.data.accessToken.split('.')).toHaveLength(3);
    expect(ok.body?.data.refreshToken).toMatch(/^rt_/);
  });

  it('korumalı uçlar token ister; profil Koha patron kimliğini sızdırmaz', async () => {
    expect((await call('GET', '/mobile/v1/me')).status).toBe(401);
    const { data } = (await login()).body!;
    const me = await call('GET', '/mobile/v1/me', { token: data.accessToken });
    expect(me.body?.data).toMatchObject({ firstName: 'Ayşe', cardNumber: 'K42' });
    expect(me.body?.data.id).toMatch(/^u_[0-9a-f]{24}$/);
    expect(JSON.stringify(me.body)).not.toMatch(/"patron_id"|"42"/);
  });

  it('ödünç: liste, Türkçe yenileme hatası, başka patronun ödüncüne erişim yok, başarılı yenileme', async () => {
    const token = (await login()).body!.data.accessToken as string;
    const loans = await call('GET', '/mobile/v1/loans', { token });
    expect(loans.body?.data.map((l: { id: string }) => l.id)).toEqual(['lo_12', 'lo_11']);
    expect(await call('POST', '/mobile/v1/loans/lo_99/renew', { token })).toMatchObject({
      status: 404,
      body: { code: 'RESOURCE_NOT_FOUND' },
    });
    expect(await call('POST', '/mobile/v1/loans/lo_12/renew', { token })).toMatchObject({
      status: 409,
      body: {
        code: 'LOAN_RENEWAL_TOO_MANY',
        message: 'Bu materyal için izin verilen en fazla yenileme sayısına ulaşıldı.',
      },
    });
    const renewed = await call('POST', '/mobile/v1/loans/lo_11/renew', { token });
    expect(renewed).toMatchObject({
      status: 200,
      body: { data: { id: 'lo_11', renewals: { count: 1 } } },
    });
  });

  it('rezervasyon: listele, hazır olanı iptal edememe, oluştur, Koha nedeni', async () => {
    const token = (await login()).body!.data.accessToken as string;
    const holds = await call('GET', '/mobile/v1/holds', { token });
    expect(holds.body?.data.map((h: { status: string }) => h.status)).toEqual(['READY', 'WAITING']);
    expect((await call('DELETE', '/mobile/v1/holds/ho_501', { token })).body?.code).toBe(
      'HOLD_CANCEL_NOT_ALLOWED',
    );
    const placed = await call('POST', '/mobile/v1/holds', {
      token,
      body: { recordId: 'rc_3', pickupLibraryId: 'lb_MRK' },
    });
    expect(placed).toMatchObject({ status: 201, body: { data: { record: { title: 'Dune' } } } });
    const dup = await call('POST', '/mobile/v1/holds', {
      token,
      body: { recordId: 'rc_2', pickupLibraryId: 'lb_MRK' },
    });
    expect(dup.body?.code).toBe('HOLD_ALREADY_EXISTS');
    expect(
      (await call('POST', '/mobile/v1/holds', { token, body: { recordId: 'x' } })).body?.code,
    ).toBe('VALIDATION_ERROR');
  });

  it('özet, borç, katalog, kütüphaneler', async () => {
    const token = (await login()).body!.data.accessToken as string;
    const summary = await call('GET', '/mobile/v1/me/summary', { token });
    expect(summary.body?.data).toMatchObject({
      loans: { overdue: 1 },
      holds: { ready: 1 },
      fines: { balance: { amount: '7.50' } },
    });
    const search = await call('GET', '/mobile/v1/catalog/search?q=atay&field=author', { token });
    expect(search.body?.data.items.map((i: { title: string }) => i.title)).toEqual([
      'Tutunamayanlar',
    ]);
    const record = await call('GET', '/mobile/v1/catalog/records/rc_3', { token });
    expect(record.body?.data).toMatchObject({ title: 'Dune', holdable: true });
    expect(
      (await call('GET', '/mobile/v1/catalog/new-arrivals?limit=2', { token })).body?.data.items,
    ).toHaveLength(2);
    expect((await call('GET', '/mobile/v1/libraries', { token })).body?.data[0]).toMatchObject({
      name: 'Merkez Kütüphane',
    });
  });

  it('refresh token döner; eski token tekrar kullanılırsa tüm oturum iptal edilir', async () => {
    const first = (await login()).body!.data;
    const second = await call('POST', '/mobile/v1/auth/refresh', {
      body: { refreshToken: first.refreshToken },
    });
    expect(second.status).toBe(200);
    expect(second.body?.data.refreshToken).not.toBe(first.refreshToken);
    const reuse = await call('POST', '/mobile/v1/auth/refresh', {
      body: { refreshToken: first.refreshToken },
    });
    expect(reuse).toMatchObject({ status: 401, body: { code: 'AUTH_SESSION_REVOKED' } });
    expect(
      (await call('GET', '/mobile/v1/me', { token: second.body?.data.accessToken })).status,
    ).toBe(401);
  });

  it('çıkış oturumu sonlandırır', async () => {
    const { accessToken } = (await login()).body!.data;
    expect((await call('POST', '/mobile/v1/auth/logout', { token: accessToken })).status).toBe(204);
    expect((await call('GET', '/mobile/v1/loans', { token: accessToken })).status).toBe(401);
  });

  it('aynı kullanıcı adına çok fazla hatalı deneme sınırlanır', async () => {
    const results = [];
    for (let i = 0; i < 6; i += 1) results.push((await login('kaba-kuvvet', 'x')).status);
    expect(results.slice(0, 5).every((s) => s === 401)).toBe(true);
    expect(results[5]).toBe(429);
  });
});
