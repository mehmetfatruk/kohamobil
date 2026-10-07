import { AppConfigSchema, ProblemDetailsSchema } from '@mirakil/types';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from './app.module.js';
import { APP_CONFIG, loadConfig } from './config/env.js';
import { configureApp, createFastifyAdapter } from './http-app.js';
import { PostgresService } from './infra/postgres.service.js';
import { RedisService } from './infra/redis.service.js';

const config = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'fatal',
  PUBLIC_API_URL: 'https://api.koha-tr.com',
  DATABASE_HOST: 'localhost',
  DATABASE_NAME: 'test',
  DATABASE_USER: 'test',
  DATABASE_PASSWORD: 'test',
  REDIS_HOST: 'localhost',
  REDIS_PASSWORD: 'test',
});

let redisHealthy = true;

describe('Gateway HTTP', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(APP_CONFIG)
      .useValue(config)
      .overrideProvider(PostgresService)
      .useValue({ ping: () => Promise.resolve(), onModuleDestroy: () => Promise.resolve() })
      .overrideProvider(RedisService)
      .useValue({
        ping: () => (redisHealthy ? Promise.resolve() : Promise.reject(new Error('down'))),
        onModuleDestroy: () => Promise.resolve(),
      })
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

  const inject = (url: string, headers: Record<string, string> = {}) =>
    app.inject({ method: 'GET', url, headers });

  it('GET /health/live', async () => {
    const res = await inject('/health/live');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('GET /health/ready — bağımlılıklar ayaktayken 200, değilse 503', async () => {
    expect((await inject('/health/ready')).statusCode).toBe(200);
    redisHealthy = false;
    const res = await inject('/health/ready');
    redisHealthy = true;
    expect(res.statusCode).toBe(503);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('GET /mobile/v1/app/config paylaşılan şemaya uyar', async () => {
    const res = await inject('/mobile/v1/app/config');
    expect(res.statusCode).toBe(200);
    const { data } = res.json<{ data: unknown }>();
    expect(AppConfigSchema.parse(data).gateway.deploymentMode).toBe('CENTRAL');
  });

  it("geçerli istemci correlation ID'sini yanıtta geri döndürür", async () => {
    const res = await inject('/health/live', { 'x-correlation-id': 'client-abc-12345' });
    expect(res.headers['x-correlation-id']).toBe('client-abc-12345');
  });

  it('geçersiz correlation ID yerine yenisini üretir', async () => {
    const res = await inject('/health/live', { 'x-correlation-id': 'kötü değer <script>' });
    expect(res.headers['x-correlation-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('bilinmeyen uç: Problem Details, yerelleştirilmiş mesaj', async () => {
    const res = await inject('/yok', {
      'accept-language': 'en-US',
      'x-correlation-id': 'corr-404-test',
    });
    expect(res.statusCode).toBe(404);
    const body = ProblemDetailsSchema.parse(res.json());
    expect(body).toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
      message: 'Record not found.',
      correlationId: 'corr-404-test',
    });
  });
});
