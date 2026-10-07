import type { Params } from 'nestjs-pino';

import type { AppConfig } from '../config/env.js';
import { correlationIdFor } from './correlation-id.js';

/**
 * Yapısal JSON log (pino). Şifre, token ve secret alanları maskelenir
 * (docs/ARCHITECTURE.md §6.3, docs/DEPLOYMENT.md §8.3).
 */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.currentPassword',
  '*.newPassword',
  '*.refreshToken',
  '*.accessToken',
  '*.token',
  '*.secret',
  '*.client_secret',
];

export function loggerParams(config: AppConfig): Params {
  return {
    pinoHttp: {
      level: config.LOG_LEVEL,
      genReqId: (req) => correlationIdFor(req),
      redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
      autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
      base: { service: 'mirakil-api', deploymentMode: config.DEPLOYMENT_MODE },
    },
  };
}
