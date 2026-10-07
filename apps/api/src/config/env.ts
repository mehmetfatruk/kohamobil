import { readFileSync } from 'node:fs';

import { z } from 'zod';

/**
 * Ortam yapılandırması. Uygulama eksik veya örnek ("CHANGE_ME") secret ile BAŞLAMAZ (fail-fast).
 *
 * Secret'lar iki yoldan verilebilir:
 *   1. `<AD>_FILE` → dosyadan okunur (Docker secrets, önerilen; üretimde zorunlu)
 *   2. `<AD>`      → doğrudan ortam değişkeni (yalnızca development/test)
 * Hata mesajları secret DEĞERLERİNİ asla içermez.
 */

export const SECRET_KEYS = ['DATABASE_PASSWORD', 'REDIS_PASSWORD'] as const;
type SecretKey = (typeof SECRET_KEYS)[number];

const PLACEHOLDER = /CHANGE_ME/i;

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEPLOYMENT_MODE: z.enum(['CENTRAL', 'ON_PREMISE']).default('CENTRAL'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PUBLIC_API_URL: z.url({ protocol: /^https$/ }),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().default(5432),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_SSL: z.stringbool().default(false),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().default(6379),

  MIN_APP_VERSION: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/)
    .default('1.0.0'),
  PRIVACY_POLICY_URL: z.url().default('https://app.koha-tr.com/gizlilik'),
  KVKK_NOTICE_URL: z.url().default('https://app.koha-tr.com/kvkk'),
  SUPPORT_URL: z.url().default('https://app.koha-tr.com/destek'),
});

export type AppConfig = z.infer<typeof EnvSchema> & Record<SecretKey, string>;

export class ConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`Geçersiz yapılandırma:\n  - ${problems.join('\n  - ')}`);
    this.name = 'ConfigError';
  }
}

type Env = Record<string, string | undefined>;
type ReadFile = (path: string) => string;

const defaultReadFile: ReadFile = (path) => readFileSync(path, 'utf8');

function readSecret(key: SecretKey, env: Env, readFile: ReadFile, problems: string[]): string {
  const filePath = env[`${key}_FILE`];
  const production = env.NODE_ENV === 'production';
  let value: string | undefined;

  if (filePath) {
    try {
      value = readFile(filePath).trim();
    } catch {
      problems.push(`${key}_FILE okunamadı (${filePath})`);
      return '';
    }
  } else if (env[key] !== undefined) {
    if (production) {
      problems.push(`${key}: üretimde secret'lar ${key}_FILE ile verilmelidir`);
      return '';
    }
    value = env[key];
  }

  if (!value) problems.push(`${key} tanımlı değil (${key}_FILE veya ${key})`);
  else if (PLACEHOLDER.test(value))
    problems.push(`${key} örnek değer içeriyor; gerçek secret üretin`);
  else if (production && value.length < 16)
    problems.push(`${key} üretim için çok kısa (en az 16 karakter)`);
  return value ?? '';
}

export function loadConfig(
  env: Env = process.env,
  readFile: ReadFile = defaultReadFile,
): AppConfig {
  const problems: string[] = [];
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues)
      problems.push(`${issue.path.join('.')}: ${issue.message}`);
  }
  const secrets = Object.fromEntries(
    SECRET_KEYS.map((key) => [key, readSecret(key, env, readFile, problems)]),
  ) as Record<SecretKey, string>;

  if (problems.length > 0 || !parsed.success) throw new ConfigError(problems);
  return Object.freeze({ ...parsed.data, ...secrets });
}

export const APP_CONFIG = Symbol('APP_CONFIG');
