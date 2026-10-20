import { Module } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { TokenService } from '../auth/token.service.js';
import { APP_CONFIG, type AppConfig } from '../config/env.js';
import {
  KOHA_FETCH,
  TENANT_SOURCE,
  TenantRegistry,
  tenantSourceFactory,
} from '../tenants/tenant-registry.service.js';
import { AppConfigController } from './app-config.controller.js';
import { AuthController } from './auth.controller.js';
import { CatalogController } from './catalog.controller.js';
import { PatronController } from './patron.controller.js';
import { TenantsController } from './tenants.controller.js';

@Module({
  controllers: [
    AppConfigController,
    TenantsController,
    AuthController,
    PatronController,
    CatalogController,
  ],
  providers: [
    {
      provide: TENANT_SOURCE,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => tenantSourceFactory(config),
    },
    {
      provide: KOHA_FETCH,
      useValue: (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
        fetch(input, init),
    },
    TenantRegistry,
    TokenService,
    AuthService,
    AuthGuard,
  ],
})
export class MobileModule {}
