import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis, type RedisOptions } from 'ioredis';

import { APP_CONFIG, type AppConfig } from '../config/env.js';

export function redisOptions(config: AppConfig): RedisOptions {
  return {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD ?? undefined,
    // BullMQ engelleyici komutlar için gereklidir
    maxRetriesPerRequest: null,
    lazyConnect: true,
  };
}

/** Redis bağlantısı. Yerel geliştirmede REDIS_HOST verilmezse devre dışıdır. */
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis | null;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = config.REDIS_HOST
      ? new Redis({ ...redisOptions(config), connectTimeout: 3_000 })
      : null;
  }

  get enabled() {
    return this.client !== null;
  }

  async ping(): Promise<void> {
    if (!this.client) return;
    if (this.client.status === 'wait') await this.client.connect();
    await this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client && this.client.status !== 'end' && this.client.status !== 'wait')
      await this.client.quit();
  }
}
