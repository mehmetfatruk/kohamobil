/**
 * Bir Koha sunucusunun uyumluluk raporunu çıkarır (Faz 0 sürüm matrisi ve pilot ortam için).
 *
 *   pnpm --filter @mirakil/koha-client probe -- https://koha.ornek.edu.tr [--opac https://katalog.ornek.edu.tr] [--json]
 *
 * Yerel KTD (koha-testing-docker) HTTP kullandığı için `--allow-insecure-localhost` ile yalnızca
 * localhost/127.0.0.1 adreslerinde http kabul edilir. Gerçek kurumlarda her zaman https zorunludur.
 *
 * Yalnızca okuma yapar: `GET /api/v1/` (OpenAPI spec) ve isteğe bağlı OPAC ana sayfası.
 * Spec erişimi kimlik doğrulama istiyorsa erişim token'ı KOHA_PROBE_TOKEN ortam değişkeniyle
 * verilir (komut satırına veya dosyaya YAZILMAZ).
 */
import process from 'node:process';

import {
  detectSpecCapabilities,
  extractGeneratorVersion,
  formatKohaVersion,
  OPERATIONS,
  resolveCompatibility,
  type CapabilityId,
} from '../src/index.js';

const args = process.argv.slice(2).filter((a) => a !== '--');
const baseUrl = args.find((a) => !a.startsWith('--'));
const opacIndex = args.indexOf('--opac');
const opacUrl = opacIndex >= 0 ? args[opacIndex + 1] : undefined;
const asJson = args.includes('--json');
const basicAuth = args.includes('--basic-auth');
const allowInsecureLocalhost = args.includes('--allow-insecure-localhost');

function isAllowedUrl(url: string | undefined): url is string {
  if (!url) return false;
  const parsed = URL.canParse(url) ? new URL(url) : null;
  if (!parsed) return false;
  if (parsed.protocol === 'https:') return true;
  return (
    allowInsecureLocalhost &&
    parsed.protocol === 'http:' &&
    ['localhost', '127.0.0.1'].includes(parsed.hostname)
  );
}

if (!isAllowedUrl(baseUrl) || (opacUrl !== undefined && !isAllowedUrl(opacUrl))) {
  process.stderr.write(
    'Kullanım: probe <https://koha-sunucusu> [--opac <https://opac>] [--basic-auth] [--json] [--allow-insecure-localhost]\n',
  );
  process.exit(2);
}

const headers: Record<string, string> = { Accept: 'application/json' };
if (process.env.KOHA_PROBE_TOKEN) headers.Authorization = `Bearer ${process.env.KOHA_PROBE_TOKEN}`;

const specUrl = new URL('/api/v1/', baseUrl).toString();
const response = await fetch(specUrl, { headers, signal: AbortSignal.timeout(15_000) });
if (!response.ok) {
  process.stderr.write(`Spec alınamadı: ${specUrl} → HTTP ${response.status}\n`);
  process.exit(1);
}
const spec: unknown = await response.json();

const capabilities = new Set<CapabilityId>(detectSpecCapabilities(spec));
if (basicAuth) capabilities.add('service.basicAuth');
const report = resolveCompatibility(capabilities);

let version: string | null = null;
if (opacUrl) {
  const html = await fetch(opacUrl, { signal: AbortSignal.timeout(15_000) }).then((r) => r.text());
  const parsed = extractGeneratorVersion(html);
  version = parsed ? formatKohaVersion(parsed) : null;
}

if (asJson) {
  process.stdout.write(
    `${JSON.stringify({ specUrl, version, capabilities: [...capabilities].sort(), ...report }, null, 2)}\n`,
  );
} else {
  const lines = [
    `Koha: ${baseUrl}`,
    `Sürüm (bilgi amaçlı): ${version ?? 'bilinmiyor'}`,
    `Destek seviyesi: ${report.supportLevel}`,
    '',
    ...Object.entries(report.profile).map(([operation, strategy]) => {
      const tier = OPERATIONS[operation as keyof typeof OPERATIONS].tier;
      return `${strategy ? '✓' : '✗'} ${operation.padEnd(30)} ${tier.padEnd(9)} ${strategy ?? '— desteklenmiyor'}`;
    }),
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}
