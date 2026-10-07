import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from './env.js';

const base = {
  NODE_ENV: 'development',
  PUBLIC_API_URL: 'https://api.koha-tr.com',
  DATABASE_HOST: 'localhost',
  DATABASE_NAME: 'mirakil',
  DATABASE_USER: 'mirakil',
  REDIS_HOST: 'localhost',
};

const files: Record<string, string> = {
  '/run/secrets/db': 'db-secret-value-1234567890\n',
  '/run/secrets/redis': 'redis-secret-value-1234567890',
  '/run/secrets/placeholder': 'CHANGE_ME',
};
const readFile = (path: string) => {
  const content = files[path];
  if (content === undefined) throw new Error('ENOENT');
  return content;
};

const problemsOf = (env: Record<string, string>) => {
  try {
    loadConfig(env, readFile);
    return [];
  } catch (error) {
    if (error instanceof ConfigError) return error.problems;
    throw error;
  }
};

describe('loadConfig', () => {
  it('secret dosyalarını okur ve sondaki boşluğu kırpar', () => {
    const config = loadConfig(
      {
        ...base,
        DATABASE_PASSWORD_FILE: '/run/secrets/db',
        REDIS_PASSWORD_FILE: '/run/secrets/redis',
      },
      readFile,
    );
    expect(config.DATABASE_PASSWORD).toBe('db-secret-value-1234567890');
    expect(config.PORT).toBe(3000);
  });

  it('geliştirmede doğrudan ortam değişkenine izin verir', () => {
    const config = loadConfig(
      { ...base, DATABASE_PASSWORD: 'local', REDIS_PASSWORD: 'local' },
      readFile,
    );
    expect(config.REDIS_PASSWORD).toBe('local');
  });

  it('örnek (CHANGE_ME) değerle başlamaz', () => {
    const problems = problemsOf({
      ...base,
      DATABASE_PASSWORD_FILE: '/run/secrets/placeholder',
      REDIS_PASSWORD: 'change_me_please',
    });
    expect(problems).toHaveLength(2);
    expect(problems.join()).toMatch(/örnek değer/);
  });

  it("üretimde secret'ların dosyadan verilmesini zorunlu kılar", () => {
    const problems = problemsOf({
      ...base,
      NODE_ENV: 'production',
      DATABASE_PASSWORD: 'db-secret-value-1234567890',
      REDIS_PASSWORD_FILE: '/run/secrets/redis',
    });
    expect(problems).toEqual([
      "DATABASE_PASSWORD: üretimde secret'lar DATABASE_PASSWORD_FILE ile verilmelidir",
    ]);
  });

  it('hata mesajlarında secret değerini göstermez', () => {
    const problems = problemsOf({
      ...base,
      NODE_ENV: 'production',
      DATABASE_PASSWORD_FILE: '/run/secrets/missing',
      REDIS_PASSWORD: 'super-secret-redis-value',
    });
    expect(problems.join('\n')).not.toContain('super-secret-redis-value');
  });

  it('https olmayan genel API adresini reddeder', () => {
    const problems = problemsOf({
      ...base,
      PUBLIC_API_URL: 'http://api.koha-tr.com',
      DATABASE_PASSWORD: 'x',
      REDIS_PASSWORD: 'x',
    });
    expect(problems.some((p) => p.startsWith('PUBLIC_API_URL'))).toBe(true);
  });
});
