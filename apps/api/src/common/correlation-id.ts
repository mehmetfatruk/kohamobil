import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export const CORRELATION_HEADER = 'x-correlation-id';
const VALID_ID = /^[A-Za-z0-9._-]{8,64}$/;
const cache = new WeakMap<IncomingMessage, string>();

/**
 * İsteğin correlation ID'si: istemcinin gönderdiği geçerli `X-Correlation-Id` veya yeni UUID.
 * Fastify ve pino-http aynı ham istek için aynı değeri alsın diye istek başına önbelleğe alınır.
 */
export function correlationIdFor(req: IncomingMessage): string {
  let id = cache.get(req);
  if (!id) {
    const header = req.headers[CORRELATION_HEADER];
    const candidate = Array.isArray(header) ? header[0] : header;
    id = candidate && VALID_ID.test(candidate) ? candidate : randomUUID();
    cache.set(req, id);
  }
  return id;
}
