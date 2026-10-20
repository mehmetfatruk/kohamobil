#!/usr/bin/env node
/**
 * Mobil uygulamayı GERÇEK Koha verisiyle tek komutta çalıştırır (Windows / macOS / Linux):
 *   pnpm live
 *
 * 1. Paylaşılan paketleri derler
 * 2. İlk seferde Koha API anahtarını sorar (pnpm local:setup); secret yalnızca apps/api/.local/ altına yazılır
 * 3. Koha bağlantısını hızlıca kontrol eder (yalnızca okuma)
 * 4. Gateway'i arka planda başlatır (log: apps/api/.local/gateway.log)
 * 5. Mobil uygulamayı (Expo) başlatır — terminaldeki QR'ı telefonda okutun
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, openSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(root, 'apps', 'api');
const localDir = join(apiDir, '.local');
const shell = process.platform === 'win32';

const run = (args, options = {}) => {
  const result = spawnSync('pnpm', args, { cwd: root, stdio: 'inherit', shell, ...options });
  return result.status ?? 1;
};

const needsSetup = () => {
  const tenantsFile = join(localDir, 'tenants.json');
  if (
    !existsSync(tenantsFile) ||
    !existsSync(join(apiDir, '.env')) ||
    !existsSync(join(root, 'apps', 'mobile', '.env.local'))
  )
    return true;
  const tenants = JSON.parse(readFileSync(tenantsFile, 'utf8')).tenants.filter((t) => t.active);
  return tenants.some(
    (t) =>
      t.koha.auth.kind === 'oauth2' &&
      (/CHANGE_ME/.test(t.koha.auth.clientId) ||
        !existsSync(join(localDir, t.koha.auth.clientSecretFile ?? `${t.code}.secret`))),
  );
};

console.log('\n▶ 1/5 Paketler derleniyor…');
if (run(['build']) !== 0) process.exit(1);

if (needsSetup()) {
  console.log('\n▶ 2/5 İlk kurulum: Koha API anahtarı');
  if (run(['--filter', '@mirakil/api', 'setup:local']) !== 0) process.exit(1);
} else {
  console.log('\n▶ 2/5 Kurulum mevcut (değiştirmek için: pnpm local:setup)');
}

console.log('\n▶ 3/5 Koha bağlantısı kontrol ediliyor…');
const check = run(['--filter', '@mirakil/api', 'koha:check', '--', '--quick']);
if (check !== 0) {
  console.log(
    '\n⚠ Koha kontrolünde hata var. Uygulama açılacak ama ilgili ekranlar veri getiremeyebilir.',
  );
  console.log(
    '  Anahtarı yeniden girmek için: pnpm local:setup   (çıktıyı geliştiriciyle paylaşabilirsiniz)\n',
  );
}

console.log('\n▶ 4/5 Gateway başlatılıyor (log: apps/api/.local/gateway.log)…');
const log = openSync(join(localDir, 'gateway.log'), 'a');
const gateway = spawn('pnpm', ['--filter', '@mirakil/api', 'dev:local'], {
  cwd: root,
  stdio: ['ignore', log, log],
  shell,
});

const env = readFileSync(join(apiDir, '.env'), 'utf8');
const publicUrl = /PUBLIC_API_URL=(.+)/.exec(env)?.[1]?.trim() ?? 'http://localhost:3000';
const healthUrl = `http://127.0.0.1:${/PORT=(\d+)/.exec(env)?.[1] ?? '3000'}/health/live`;
let ready = false;
for (let i = 0; i < 60 && !ready; i += 1) {
  ready = await fetch(healthUrl).then(
    (r) => r.ok,
    () => false,
  );
  if (!ready) await new Promise((r) => setTimeout(r, 1000));
}
if (!ready) {
  console.error('✗ Gateway başlamadı. Ayrıntı: apps/api/.local/gateway.log');
  gateway.kill();
  process.exit(1);
}
console.log(`✓ Gateway hazır: ${publicUrl}`);

console.log(
  "\n▶ 5/5 Mobil uygulama başlatılıyor. Telefonda QR'ı okutun → Başla → kurumu seçin → Koha hesabıyla giriş yapın.\n",
);
const mobile = spawn('pnpm', ['--filter', '@mirakil/mobile', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  shell,
});

const stop = () => {
  gateway.kill();
  mobile.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
mobile.on('exit', (code) => {
  gateway.kill();
  process.exit(code ?? 0);
});
