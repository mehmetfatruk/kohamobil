import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis, type RedisOptions } from 'ioredis';

import { APP_CONFIG, type AppConfig } from '../config/env.js';

export function redisOptions(config: AppConfig): RedisOptions {
  return {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    // BullMQ engelleyici komutlar için gereklidir
    maxRetriesPerRequest: null,
    lazyConnect: true,
  };
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = new Redis({ ...redisOptions(config), connectTimeout: 3_000 });
  }

  async ping(): Promise<void> {
    if (this.client.status === 'wait') await this.client.connect();
    await this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== 'end' && this.client.status !== 'wait') await this.client.quit();
  }
}
