import type { IncomingMessage } from 'node:http';

import type { INestApplication, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';

import { CORRELATION_HEADER, correlationIdFor } from './common/correlation-id.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';

/** HTTP uygulamasını yapılandırır — `main.ts` ve testler aynı kurulumu kullanır. */
export function createFastifyAdapter(): FastifyAdapter {
  const adapter = new FastifyAdapter({
    genReqId: (req: IncomingMessage) => correlationIdFor(req),
    requestIdHeader: false,
    trustProxy: true,
    bodyLimit: 256 * 1024,
  });
  adapter.getInstance().addHook('onRequest', (request, reply, done) => {
    void reply.header(CORRELATION_HEADER, request.id);
    done();
  });
  return adapter;
}

export function configureApp<T extends INestApplication>(app: T): T {
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.enableShutdownHooks();
  return app;
}

export async function createHttpApp(module: Type): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(module, createFastifyAdapter(), {
    bufferLogs: true,
  });
  return configureApp(app);
}
