import { beforeEach, describe, expect, it } from 'vitest';

import { createFakeKoha } from '../testing/fake-koha.js';
import { modernSpecWithPlugin } from '../testing/specs.js';
import { createPatronContext } from '../adapter.js';
import type { CapabilityId } from '../capabilities/catalog.js';
import { detectSpecCapabilities } from '../capabilities/openapi.js';
import { resolveCompatibility } from '../compat/resolver.js';
import { KohaHttpClient } from '../http/koha-http.js';
import { KohaOperationError, KohaRestAdapter } from './adapter.js';

const ctx = createPatronContext({
  tenantId: 't1',
  kohaPatronId: '42',
  correlationId: 'test-corr-1',
});

function setup(extra: CapabilityId[] = ['rest.biblios.list', 'rest.items.list', 'rest.items.get']) {
  const fake = createFakeKoha();
  const spec = modernSpecWithPlugin();
  // Bu testler REST stratejilerini ölçer: eklenti uçlarını spec'ten çıkar
  for (const path of Object.keys(spec.paths))
    if (path.startsWith('/contrib')) delete spec.paths[path];
  const capabilities = new Set<CapabilityId>([...detectSpecCapabilities(spec), ...extra]);
  const { profile } = resolveCompatibility(capabilities);
  const http = new KohaHttpClient({
    baseUrl: 'https://koha.test',
    auth: { kind: 'oauth2', clientId: 'mirakil', clientSecret: 'dogru-secret' },
    fetch: fake.fetch,
  });
  const adapter = new KohaRestAdapter(http, profile, {
    timeZone: 'Europe/Istanbul',
    currency: 'TRY',
    profileAttributes: { faculty: 'FAK' },
  });
  return { fake, adapter, profile };
}

const codeOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof KohaOperationError ? error.code : String(error);
  }
};

describe('KohaRestAdapter', () => {
  let s: ReturnType<typeof setup>;
  beforeEach(() => {
    s = setup();
  });

  it('kullanıcı adı/kart no + şifre doğrular; hatalı bilgide null döner', async () => {
    expect(await s.adapter.validateCredentials('test', 'sifre')).toMatchObject({
      kohaPatronId: '42',
    });
    expect(await s.adapter.validateCredentials('test', 'yanlis')).toBeNull();
  });

  it("servis token'ını önbellekte tutar ve 401'de bir kez yeniler", async () => {
    await s.adapter.getLibraries();
    s.fake.state.expireTokenOnce = true;
    await s.adapter.getFines(ctx);
    expect(s.fake.state.tokensIssued).toBe(2);
  });

  it("profili normalize eder (fakülte extended attribute'tan)", async () => {
    const profile = await s.adapter.getProfile(ctx);
    expect(profile).toMatchObject({
      firstName: 'Ayşe',
      cardNumber: 'K42',
      faculty: 'Mühendislik',
      homeLibrary: { name: 'Merkez Kütüphane' },
    });
    expect(JSON.stringify(profile)).not.toContain('"42"');
  });

  it('yalnızca kendi ödünçlerini, başlık ve durumla listeler', async () => {
    const loans = await s.adapter.getLoans(ctx);
    expect(loans.map((l) => l.id)).toEqual(['lo_12', 'lo_11']);
    expect(loans[0]).toMatchObject({
      status: 'OVERDUE',
      record: { title: 'Suç ve ceza' },
      renewals: { count: 2 },
    });
    expect(loans[1]).toMatchObject({
      status: 'OK',
      record: { title: 'Dune', author: 'Herbert, Frank' },
    });
  });

  it('başka patronun ödüncüne erişimi engeller (varlığı sızdırmadan)', async () => {
    expect(
      await s.adapter.checkRenewability(ctx, 'lo_99').then(
        () => 'izin verildi',
        () => 'engellendi',
      ),
    ).toBe('engellendi');
    expect(await codeOf(s.adapter.renewLoan(ctx, 'lo_99'))).toBe('RESOURCE_NOT_FOUND');
    expect(await codeOf(s.adapter.renewLoan(ctx, 'ho_11'))).toBe('RESOURCE_NOT_FOUND');
    expect(await codeOf(s.adapter.renewLoan(ctx, 'lo_1;DROP'))).toBe('RESOURCE_NOT_FOUND');
  });

  it("yenileme engelini Türkçe hata koduna çevirir, Koha'ya POST atmaz", async () => {
    expect(await codeOf(s.adapter.renewLoan(ctx, 'lo_12'))).toBe('LOAN_RENEWAL_TOO_MANY');
    expect(s.fake.state.calls.some((c) => c.startsWith('POST /checkouts/12'))).toBe(false);
  });

  it('yenilemeyi uyumluluk profilinin seçtiği uçla yapar', async () => {
    const loan = await s.adapter.renewLoan(ctx, 'lo_11');
    expect(s.fake.state.calls).toContain('POST /checkouts/11/renewals');
    expect(loan.renewals.count).toBe(1);
    expect(loan.daysRemaining).toBeGreaterThanOrEqual(23);
  });

  it('rezervasyonları durumlarıyla listeler; hazır olan iptal edilemez', async () => {
    const holds = await s.adapter.getHolds(ctx);
    expect(holds.map((h) => [h.id, h.status, h.cancellable])).toEqual([
      ['ho_501', 'READY', false],
      ['ho_502', 'WAITING', true],
    ]);
    expect(await codeOf(s.adapter.cancelHold(ctx, 'ho_501'))).toBe('HOLD_CANCEL_NOT_ALLOWED');
    await s.adapter.cancelHold(ctx, 'ho_502');
    expect(s.fake.state.calls).toContain('DELETE /holds/502');
  });

  it('rezervasyon oluşturur; Koha nedenini eşler', async () => {
    const hold = await s.adapter.placeHold(ctx, { recordId: 'rc_3', pickupLibraryId: 'lb_MRK' });
    expect(hold).toMatchObject({ id: 'ho_600', status: 'WAITING', record: { title: 'Dune' } });
    expect(
      await codeOf(s.adapter.placeHold(ctx, { recordId: 'rc_2', pickupLibraryId: 'lb_MRK' })),
    ).toBe('HOLD_ALREADY_EXISTS');
  });

  it('borç özetini ve hareketleri döndürür', async () => {
    const fines = await s.adapter.getFines(ctx);
    expect(fines.balance).toEqual({ amount: '7.50', currency: 'TRY' });
    expect(fines.outstanding[0]).toMatchObject({
      remaining: { amount: '7.50' },
      description: 'Gecikme',
    });
  });

  it('kayıt detayı ve nüsha durumları', async () => {
    const record = await s.adapter.getRecord('rc_2');
    expect(record).toMatchObject({
      title: 'Suç ve ceza',
      publicationYear: '2015',
      materialType: { name: 'Kitap' },
    });
    const items = await s.adapter.getRecordItems('rc_1');
    expect(items[0]).toMatchObject({
      status: 'NOT_FOR_LOAN',
      holdable: false,
      library: { name: 'Merkez Kütüphane' },
    });
  });

  it('yedek arama stratejisiyle başlık/yazar araması yapar', async () => {
    const result = await s.adapter.search({ q: 'atay', field: 'author', page: 1, limit: 20 });
    expect(result.items.map((i) => i.title)).toEqual(['Tutunamayanlar']);
    expect(result.total).toBe(1);
  });

  it('yeni gelenleri edinme tarihine göre getirir', async () => {
    const result = await s.adapter.getNewArrivals({ page: 1, limit: 2 });
    expect(result.items.map((i) => i.id)).toEqual(['rc_3', 'rc_1']);
  });

  it("teslim şubeleri patron için Koha'dan gelir", async () => {
    const libraries = await s.adapter.getPickupLibraries(ctx, 'rc_3');
    expect(libraries.map((l) => l.id)).toEqual(['lb_MRK']);
  });

  it('profilde stratejisi olmayan işlemi kapatır', async () => {
    const limited = setup([]);
    expect(await codeOf(limited.adapter.search({ q: 'x', field: 'any', page: 1, limit: 5 }))).toBe(
      'FEATURE_DISABLED',
    );
  });

  it('yanlış servis secret\'ı kullanıcıya genel "Koha\'ya ulaşılamıyor" olarak yansır', async () => {
    const fake = createFakeKoha();
    const http = new KohaHttpClient({
      baseUrl: 'https://koha.test',
      auth: { kind: 'oauth2', clientId: 'x', clientSecret: 'yanlis' },
      fetch: fake.fetch,
    });
    const adapter = new KohaRestAdapter(http, s.profile, {
      timeZone: 'Europe/Istanbul',
      currency: 'TRY',
    });
    expect(await codeOf(adapter.getLibraries())).toMatch(/KohaHttpError|KOHA_UNAVAILABLE/);
  });
});
