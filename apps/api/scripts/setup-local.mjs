#!/usr/bin/env node
/**
 * Yerel geliştirme kurulumu (Windows / macOS / Linux):
 *   pnpm local:setup
 *
 * - apps/api/.local/ altında JWT secret'ı ve kurum dosyasını oluşturur (git'e GİRMEZ)
 * - Etkin kurumların Koha API client id / secret'ını sorar; secret yalnızca .local/<kod>.secret dosyasına yazılır
 * - Bilgisayarın yerel ağ IP'sini bulup apps/api/.env ve apps/mobile/.env.local dosyalarını yazar
 *   (telefon aynı Wi‑Fi'deki bu adres üzerinden Gateway'e bağlanır)
 *
 * Mobil uygulamayı tekrar örnek veriye döndürmek için: pnpm local:setup -- --mock
 * Koha API anahtarını yeniden girmek için:             pnpm local:setup -- --reset
 */
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const mobileEnv = join(apiDir, '..', 'mobile', '.env.local');
const localDir = join(apiDir, '.local');
const tenantsFile = join(localDir, 'tenants.json');

if (process.argv.includes('--mock')) {
  rmSync(mobileEnv, { force: true });
  console.log('Mobil uygulama örnek veriye döndürüldü (apps/mobile/.env.local silindi).');
  process.exit(0);
}

// Tek okuyucu: yönlendirilmiş girdide (pipe) de soruların sırayla cevaplanmasını sağlar
const rl = createInterface({ input: stdin, output: stdout, terminal: Boolean(stdin.isTTY) });
const lines = [];
const waiters = [];
rl.on('line', (line) => (waiters.length ? waiters.shift()(line) : lines.push(line)));
let muted = false;
const originalWrite = rl._writeToOutput?.bind(rl);
if (originalWrite) {
  rl._writeToOutput = (text) => {
    if (!muted || text.includes('\n') || text.includes('\r')) originalWrite(text);
  };
}

const ask = (question, { hidden = false } = {}) => {
  stdout.write(question);
  muted = hidden;
  return new Promise((resolve) => {
    const done = (answer) => {
      muted = false;
      if (hidden && stdin.isTTY) stdout.write('\n');
      resolve(answer.trim());
    };
    if (lines.length) done(lines.shift());
    else waiters.push(done);
  });
};

function lanAddress() {
  const candidates = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
  return (
    candidates.find((a) => a.startsWith('192.168.')) ??
    candidates.find((a) => a.startsWith('10.')) ??
    candidates.find((a) => /^172\.(1[6-9]|2\d|3[01])\./.test(a)) ??
    candidates[0] ??
    '127.0.0.1'
  );
}

mkdirSync(localDir, { recursive: true });

const jwtFile = join(localDir, 'jwt_secret');
if (!existsSync(jwtFile)) {
  writeFileSync(jwtFile, randomBytes(48).toString('base64url'), { mode: 0o600 });
  console.log('✓ JWT secret üretildi (.local/jwt_secret)');
}

if (!existsSync(tenantsFile)) {
  writeFileSync(tenantsFile, readFileSync(join(apiDir, 'tenants.example.json')));
  console.log('✓ Kurum dosyası oluşturuldu (.local/tenants.json)');
}

const tenants = JSON.parse(readFileSync(tenantsFile, 'utf8'));
for (const tenant of tenants.tenants.filter((t) => t.active)) {
  const auth = tenant.koha.auth;
  if (auth.kind !== 'oauth2') continue;
  const secretPath = join(localDir, auth.clientSecretFile ?? `${tenant.code}.secret`);
  // --reset: kayıtlı anahtarı yok sayıp yeniden sor
  const reset = process.argv.includes('--reset');
  const needsId = reset || !auth.clientId || /CHANGE_ME/.test(auth.clientId);
  const needsSecret = reset || !existsSync(secretPath);
  if (!needsId && !needsSecret) continue;
  console.log(`\n${tenant.name} (${tenant.koha.baseUrl})`);
  console.log(
    'Koha personel arayüzünde servis hesabı için üretilen API anahtarını girin (boş bırakırsanız atlanır).',
  );
  const clientId = needsId ? await ask('  Client ID: ') : auth.clientId;
  if (!clientId) continue;
  const secret = needsSecret
    ? await ask('  Client secret (ekranda görünmez): ', { hidden: true })
    : '';
  auth.clientId = clientId;
  auth.clientSecretFile = auth.clientSecretFile ?? `${tenant.code}.secret`;
  if (secret) writeFileSync(secretPath, secret, { mode: 0o600 });
  console.log(`✓ ${tenant.code} için bilgiler kaydedildi`);
}
rl.close();
writeFileSync(tenantsFile, `${JSON.stringify(tenants, null, 2)}\n`);

const ip = lanAddress();
const port = 3000;
writeFileSync(
  join(apiDir, '.env'),
  [
    '# pnpm local:setup tarafından üretildi — commit edilmez',
    'NODE_ENV=development',
    'LOG_LEVEL=info',
    `PORT=${port}`,
    `PUBLIC_API_URL=http://${ip}:${port}`,
    'TENANTS_FILE=.local/tenants.json',
    'JWT_SECRET_FILE=.local/jwt_secret',
    '',
  ].join('\n'),
);
writeFileSync(
  mobileEnv,
  [
    '# pnpm local:setup tarafından üretildi — commit edilmez',
    'EXPO_PUBLIC_DATA_SOURCE=http',
    `EXPO_PUBLIC_DIRECTORY_URL=http://${ip}:${port}`,
    '',
  ].join('\n'),
);

console.log(`
✓ Gateway adresi: http://${ip}:${port}  (telefon bu bilgisayarla aynı Wi‑Fi'de olmalı)

Sonraki adımlar:
  1) Koha bağlantısını kontrol edin:   pnpm local:check
  2) Gateway'i başlatın:               pnpm local:api
  3) Ayrı bir pencerede mobil:         cd apps\\mobile  ve  pnpm dev
`);
