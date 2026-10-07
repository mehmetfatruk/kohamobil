import { Controller, Get, Inject } from '@nestjs/common';
import type { AppConfig as PublicAppConfig } from '@mirakil/types';

import { APP_CONFIG, type AppConfig } from '../config/env.js';
import { GATEWAY_VERSION } from '../version.js';

@Controller('mobile/v1/app')
export class AppConfigController {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  /** Global mobil yapılandırması: minimum uygulama sürümü, bakım modu, yasal bağlantılar. */
  @Get('config')
  getConfig(): { data: PublicAppConfig } {
    return {
      data: {
        minAppVersion: this.config.MIN_APP_VERSION,
        maintenance: { active: false },
        links: {
          privacyPolicy: this.config.PRIVACY_POLICY_URL,
          kvkkNotice: this.config.KVKK_NOTICE_URL,
          support: this.config.SUPPORT_URL,
        },
        gateway: { version: GATEWAY_VERSION, deploymentMode: this.config.DEPLOYMENT_MODE },
      },
    };
  }
}
