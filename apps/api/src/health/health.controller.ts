import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PostgresService } from '../infra/postgres.service.js';
import { RedisService } from '../infra/redis.service.js';

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms).unref()),
  ]);

@Controller('health')
export class HealthController {
  constructor(
    @Inject(PostgresService) private readonly postgres: PostgresService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  /** Süreç ayakta mı (container liveness). Bağımlılıkları kontrol etmez. */
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  /** Trafik alabilir mi (readiness): PostgreSQL ve Redis erişilebilir olmalı. */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async ready() {
    const checks = await Promise.allSettled([
      withTimeout(this.postgres.ping(), 2_000),
      withTimeout(this.redis.ping(), 2_000),
    ]);
    const result = {
      postgres: checks[0].status === 'fulfilled' ? 'ok' : 'down',
      redis: checks[1].status === 'fulfilled' ? 'ok' : 'down',
    };
    if (Object.values(result).includes('down')) {
      throw new ServiceUnavailableException(result);
    }
    return { status: 'ok', checks: result };
  }
}
