import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { loggerParams } from './common/logger.js';
import { ConfigModule } from './config/config.module.js';
import { APP_CONFIG, type AppConfig } from './config/env.js';
import { HealthModule } from './health/health.module.js';
import { InfraModule } from './infra/infra.module.js';
import { MobileModule } from './mobile/mobile.module.js';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => loggerParams(config),
    }),
    InfraModule,
    HealthModule,
    MobileModule,
  ],
})
export class AppModule {}
