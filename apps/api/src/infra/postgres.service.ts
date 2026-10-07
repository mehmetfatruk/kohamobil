import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

import { APP_CONFIG, type AppConfig } from '../config/env.js';

/**
 * Faz 0: yalnızca bağlantı ve sağlık kontrolü. Faz 1'de Prisma + RLS
 * (`SET LOCAL app.tenant_id`) bu servisin yerini alacak (docs/DATABASE.md §4).
 */
@Injectable()
export class PostgresService implements OnModuleDestroy {
  readonly pool: pg.Pool;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.pool = new pg.Pool({
      host: config.DATABASE_HOST,
      port: config.DATABASE_PORT,
      database: config.DATABASE_NAME,
      user: config.DATABASE_USER,
      password: config.DATABASE_PASSWORD,
      ssl: config.DATABASE_SSL ? { rejectUnauthorized: true } : false,
      max: 10,
      connectionTimeoutMillis: 3_000,
      application_name: 'mirakil-api',
    });
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
