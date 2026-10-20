import { describe, expect, it } from 'vitest';

import { ApiError } from '../src/api/types';
import { MockMobileApi, setMockLatency } from '../src/api/mock/mock-api';
import { encodeCode39 } from '../src/lib/code39';

setMockLatency(false);

const errorCode = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof ApiError ? error.code : 'UNEXPECTED';
  }
};

describe('MockMobileApi — kurum bulma', () => {
  const api = new MockMobileApi();

  it('kurum kodu ve kayıtlı alan adı ile bulur', async () => {
    expect((await api.lookupTenant({ kind: 'code', code: 'ornek-uni' }))?.name).toContain('Örnek');
    expect((await api.lookupTenant({ kind: 'domain', domain: 'katalog.ornek.edu.tr' }))?.code).toBe(
      'ornek-uni',
    );
  });

  it('kayıtlı olmayan alan adı için null döner (doğrudan bağlantı yok)', async () => {
    expect(
      await api.lookupTenant({ kind: 'domain', domain: 'koha.baska-kurum.edu.tr' }),
    ).toBeNull();
  });

  it('kurum yapılandırması Koha bağlantı bilgisi içermez', async () => {
    const [entry] = await api.listTenants('ankara');
    const config = await api.getTenantConfig(entry!);
    expect(JSON.stringify(config)).not.toMatch(/koha.*api|secret|client/i);
  });
});

describe('MockMobileApi — oturum', () => {
  const api = new MockMobileApi();

  it('demo hesabı kullanıcı adı veya kart numarasıyla girer', async () => {
    expect(
      (
        await api.login({
          tenantCode: 'ornek-uni',
          providerId: 'ap',
          identifier: 'DEMO',
          password: 'demo',
        })
      ).user.displayName,
    ).toBe('Ayşe Yılmaz');
    expect(
      await errorCode(
        api.login({
          tenantCode: 'ornek-uni',
          providerId: 'ap',
          identifier: '20231234',
          password: 'demo',
        }),
      ),
    ).toBeNull();
  });

  it('yanlış şifrede kullanıcı varlığını sızdırmayan tek hata kodu', async () => {
    expect(
      await errorCode(
        api.login({ tenantCode: 'x', providerId: 'ap', identifier: 'demo', password: 'yanlis' }),
      ),
    ).toBe('AUTH_INVALID_CREDENTIALS');
    expect(
      await errorCode(
        api.login({ tenantCode: 'x', providerId: 'ap', identifier: 'yok', password: 'demo' }),
      ),
    ).toBe('AUTH_INVALID_CREDENTIALS');
  });
});

describe('MockMobileApi — ödünç', () => {
  it('durumları renk kurallarına göre hesaplar', async () => {
    const loans = await new MockMobileApi().getLoans();
    expect(loans.map((l) => l.status)).toEqual(['OVERDUE', 'DUE_SOON', 'DUE_SOON', 'OK']);
  });

  it('yenileme engelini Koha nedeni olarak döndürür', async () => {
    const api = new MockMobileApi();
    expect(await api.checkRenewability('lo_3')).toEqual({
      renewable: false,
      reason: 'LOAN_RENEWAL_ON_HOLD',
    });
    expect(await errorCode(api.renewLoan('lo_4'))).toBe('LOAN_RENEWAL_TOO_MANY');
  });

  it('yenileme iade tarihini uzatır ve sayacı artırır', async () => {
    const api = new MockMobileApi();
    const renewed = await api.renewLoan('lo_2');
    expect(renewed.daysRemaining).toBe(17);
    expect(renewed.renewals.count).toBe(2);
    expect(renewed.status).toBe('OK');
  });

  it('başka bir kullanıcının ödünç kimliğiyle işlem yapılamaz', async () => {
    expect(await errorCode(new MockMobileApi().renewLoan('lo_999'))).toBe('RESOURCE_NOT_FOUND');
  });
});

describe('MockMobileApi — rezervasyon', () => {
  it('kurallara aykırı rezervasyonları reddeder', async () => {
    const api = new MockMobileApi();
    expect(
      await errorCode(api.placeHold({ recordId: 'rc_harrison', pickupLibraryId: 'lb_tip' })),
    ).toBe('HOLD_NOT_ALLOWED');
    expect(
      await errorCode(api.placeHold({ recordId: 'rc_clrs', pickupLibraryId: 'lb_merkez' })),
    ).toBe('HOLD_ALREADY_EXISTS');
    expect(await errorCode(api.placeHold({ recordId: 'rc_dune', pickupLibraryId: 'lb_tip' }))).toBe(
      'HOLD_PICKUP_LOCATION_INVALID',
    );
  });

  it('rezervasyon oluşturur ve iptal eder; hazır rezervasyon iptal edilemez', async () => {
    const api = new MockMobileApi();
    const hold = await api.placeHold({ recordId: 'rc_dune', pickupLibraryId: 'lb_merkez' });
    expect(hold.status).toBe('WAITING');
    await api.cancelHold(hold.id);
    expect((await api.getHolds()).some((h) => h.id === hold.id)).toBe(false);
    expect(await errorCode(api.cancelHold('ho_1'))).toBe('HOLD_CANCEL_NOT_ALLOWED');
  });
});

describe('MockMobileApi — katalog', () => {
  const api = new MockMobileApi();

  it('alan bazlı arama yapar (Türkçe harf ve ISBN tireleri)', async () => {
    expect((await api.search({ q: 'ince memed', field: 'title', page: 1, limit: 20 })).total).toBe(
      1,
    );
    expect((await api.search({ q: 'Atay', field: 'author', page: 1, limit: 20 })).total).toBe(2);
    expect(
      (await api.search({ q: '978-0-262-04630-5', field: 'isbn', page: 1, limit: 20 })).items[0]
        ?.id,
    ).toBe('rc_clrs');
    expect((await api.search({ q: 'Atay', field: 'title', page: 1, limit: 20 })).total).toBe(0);
  });

  it('materyal türüne göre listeler ve sayfalar', async () => {
    const page = await api.search({ q: '', field: 'any', itemType: 'BK', page: 1, limit: 5 });
    expect(page.items).toHaveLength(5);
    expect(page.total).toBeGreaterThan(5);
  });

  it('yeni gelenleri en yeniden eskiye sıralar', async () => {
    const { items } = await api.getNewArrivals({ page: 1, limit: 3 });
    expect(items.map((i) => i.id)).toEqual(['rc_kuantum', 'rc_veriyapilari', 'rc_python']);
  });
});

describe('encodeCode39', () => {
  it('başlangıç/bitiş karakterleriyle sabit uzunlukta modül üretir', () => {
    // her karakter: 6 dar (1) + 3 geniş (3) = 15 modül + 1 ayraç = 16
    expect(encodeCode39('20231234')).toHaveLength((8 + 2) * 16);
  });

  it('desteklenmeyen karakteri reddeder', () => {
    expect(() => encodeCode39('ab@c')).toThrow();
  });
});
