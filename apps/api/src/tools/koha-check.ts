/* eslint-disable no-console -- komut satırı aracı: çıktı terminale yazılır */
/**
 * Bir kurumun gerçek Koha sunucusuna karşı bağlantı ve işlem kontrolü:
 *   pnpm local:check [kurum-kodu]
 *
 * YALNIZCA OKUMA yapar (yenileme / rezervasyon gibi değişiklik yapmaz). Kişisel veri
 * yazdırmaz: sonuçlar ✓/✗, sayılar ve hata kodlarıdır. Test okuyucu bilgileri isteğe bağlıdır.
 */
import process from 'node:process';

import {
  createPatronContext,
  detectSpecCapabilities,
  KohaHttpClient,
  KohaHttpError,
  KohaNetworkError,
  KohaOperationError,
  KohaRestAdapter,
  resolveCompatibility,
  type CapabilityId,
} from '@mirakil/koha-client';

import { loadTenantsFile } from '../tenants/tenants-file.js';
import { createPrompt } from './prompt.js';

const tenantsPath = process.env.TENANTS_FILE ?? '.local/tenants.json';
const tenants = loadTenantsFile(tenantsPath);
const code =
  process.argv.slice(2).find((a) => !a.startsWith('-')) ??
  tenants.find((t) => t.entry.active)?.entry.code;
const tenant = tenants.find((t) => t.entry.code === code);
if (!tenant) {
  console.error(`Kurum bulunamadı: ${code ?? '(yok)'} — ${tenantsPath}`);
  process.exit(2);
}
const { entry } = tenant;

const describe = (error: unknown) => {
  if (error instanceof KohaOperationError) {
    const cause = error.cause;
    const detail =
      cause instanceof KohaHttpError
        ? ` (Koha HTTP ${cause.status} ${cause.path}${cause.kohaMessage ? `: ${cause.kohaMessage}` : ''})`
        : '';
    return `${error.code}${detail}`;
  }
  if (error instanceof KohaHttpError)
    return `Koha HTTP ${error.status} ${error.path}${error.kohaMessage ? `: ${error.kohaMessage}` : ''}`;
  if (error instanceof KohaNetworkError)
    return `${error.message} — adres doğru mu, sunucu bu bilgisayardan erişilebilir mi?`;
  return error instanceof Error ? error.message : String(error);
};

let failures = 0;
async function step<T>(
  title: string,
  run: () => Promise<T>,
  summarize: (value: T) => string,
): Promise<T | null> {
  try {
    const value = await run();
    console.log(`✓ ${title.padEnd(34)} ${summarize(value)}`);
    return value;
  } catch (error) {
    failures += 1;
    console.log(`✗ ${title.padEnd(34)} ${describe(error)}`);
    return null;
  }
}

console.log(`\n${entry.name} — ${entry.koha.baseUrl}\n`);

const auth = entry.koha.auth;
const http = new KohaHttpClient({
  baseUrl: entry.koha.baseUrl,
  timeoutMs: entry.koha.timeoutMs,
  auth:
    auth.kind === 'oauth2'
      ? { kind: 'oauth2', clientId: auth.clientId, clientSecret: tenant.secret() }
      : { kind: 'basic', username: auth.username, password: tenant.secret() },
});

const spec = await step(
  'Servis girişi + API tanımı',
  () => http.request<unknown>('/'),
  () => 'tamam',
);
if (!spec) {
  console.log('\nKoha API anahtarını (client id / secret) ve sunucu adresini kontrol edin.');
  process.exit(1);
}
const capabilities = new Set<CapabilityId>(detectSpecCapabilities(spec.data));
if (auth.kind === 'basic') capabilities.add('service.basicAuth');
const report = resolveCompatibility(capabilities);
console.log(
  `  Destek seviyesi: ${report.supportLevel}${report.missing.mvp.length ? ` · eksik: ${report.missing.mvp.join(', ')}` : ''}`,
);

const adapter = new KohaRestAdapter(http, report.profile, {
  timeZone: entry.timezone,
  currency: entry.currency,
});

await step(
  'Kütüphaneler',
  () => adapter.getLibraries(),
  (v) => `${v.length} şube, ${v.filter((l) => l.pickupLocation).length} teslim noktası`,
);
await step(
  'Materyal türleri',
  () => adapter.getItemTypes(),
  (v) => `${v.length} tür`,
);
const search = await step(
  'Katalog araması ("a")',
  () => adapter.search({ q: 'a', field: 'any', page: 1, limit: 5 }),
  (v) => `${v.total} kayıt`,
);
await step(
  'Yeni Gelenler',
  () => adapter.getNewArrivals({ page: 1, limit: 5 }),
  (v) => `${v.items.length} kayıt`,
);
const first = search?.items[0];
if (first) {
  await step(
    'Kayıt detayı',
    () => adapter.getRecord(first.id),
    (v) => `başlık ${v.title ? 'var' : 'yok'}, ${v.availability.total} nüsha`,
  );
}

const prompt = createPrompt();
const identifier = await prompt.ask(
  '\nTest okuyucu kullanıcı adı / kart no (atlamak için Enter): ',
);
const password = identifier
  ? await prompt.ask('Şifre (ekranda görünmez; yalnızca test hesabı kullanın): ', { hidden: true })
  : '';
prompt.close();

if (identifier && password) {
  const identity = await step(
    'Okuyucu girişi',
    () => adapter.validateCredentials(identifier, password),
    (v) => (v ? 'başarılı' : 'kullanıcı adı/şifre hatalı'),
  );
  if (identity) {
    const ctx = createPatronContext({
      tenantId: entry.code,
      kohaPatronId: identity.kohaPatronId,
      correlationId: 'koha-check',
    });
    await step(
      'Profil',
      () => adapter.getProfile(ctx),
      (v) => `ad ${v.firstName ? 'var' : 'yok'}, kart no ${v.cardNumber ? 'var' : 'yok'}`,
    );
    const loans = await step(
      'Ödünçler',
      () => adapter.getLoans(ctx),
      (v) => `${v.length} ödünç, ${v.filter((l) => l.status === 'OVERDUE').length} gecikmiş`,
    );
    if (loans?.[0])
      await step(
        'Yenilenebilirlik (yalnızca sorgu)',
        () => adapter.checkRenewability(ctx, loans[0]!.id),
        (v) => (v.renewable ? 'yenilenebilir' : `yenilenemez: ${v.reason}`),
      );
    await step(
      'Rezervasyonlar',
      () => adapter.getHolds(ctx),
      (v) => `${v.length} rezervasyon`,
    );
    await step(
      'Borç özeti',
      () => adapter.getFines(ctx),
      (v) => `${v.outstanding.length} açık kalem`,
    );
    if (first)
      await step(
        'Teslim şubeleri',
        () => adapter.getPickupLibraries(ctx, first.id),
        (v) => `${v.length} şube`,
      );
  }
}

console.log(
  failures
    ? `\n${failures} adım başarısız. Çıktıyı geliştiriciyle paylaşabilirsiniz (kişisel veri içermez).`
    : '\nTüm adımlar başarılı.',
);
process.exit(failures ? 1 : 0);
