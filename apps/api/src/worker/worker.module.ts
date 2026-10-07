import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { loggerParams } from '../common/logger.js';
import { ConfigModule } from '../config/config.module.js';
import { APP_CONFIG, type AppConfig } from '../config/env.js';
import { SystemQueueService } from './system-queue.service.js';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => {
        const params = loggerParams(config);
        return {
          ...params,
          pinoHttp: { ...(params.pinoHttp as object), base: { service: 'mirakil-worker' } },
        };
      },
    }),
  ],
  providers: [SystemQueueService],
})
export class WorkerModule {}
