import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

import { APP_CONFIG, type AppConfig } from '../config/env.js';
import { redisOptions } from '../infra/redis.service.js';

export const SYSTEM_QUEUE = 'system';

/**
 * Faz 0: kuyruk altyapısının çalıştığını gösteren `heartbeat` job'ı.
 * Faz 4'te tenant-scan, notification-fanout, push-send kuyrukları bu yapı üzerine eklenecek
 * (docs/NOTIFICATIONS.md §8).
 */
@Injectable()
export class SystemQueueService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(SystemQueueService.name);
  private readonly connection: Redis;
  private queue?: Queue;
  private worker?: Worker;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.connection = new Redis({ ...redisOptions(config), lazyConnect: false });
  }

  async onApplicationBootstrap(): Promise<void> {
    this.queue = new Queue(SYSTEM_QUEUE, { connection: this.connection });
    await this.queue.upsertJobScheduler('heartbeat', { every: 60_000 }, { name: 'heartbeat' });

    this.worker = new Worker(
      SYSTEM_QUEUE,
      async (job) => {
        this.logger.log({ job: job.name, id: job.id }, 'Worker heartbeat');
        return Promise.resolve();
      },
      { connection: this.connection, concurrency: 1 },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error({ job: job?.name, err }, 'Job başarısız'),
    );
    this.logger.log('Worker başlatıldı');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection.quit();
  }
}
