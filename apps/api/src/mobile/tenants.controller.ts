import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { parseTenantLookup } from '@mirakil/types';

import { DomainError } from '../common/domain-error.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { ok } from './http-helpers.js';

/** Tenant Directory uçları (kimlik doğrulama gerektirmez; yalnızca herkese açık kurum bilgisi). */
@Controller('mobile/v1/tenants')
export class TenantsController {
  constructor(@Inject(TenantRegistry) private readonly tenants: TenantRegistry) {}

  @Get()
  list(@Query('search') search?: string) {
    return ok(this.tenants.list(search?.slice(0, 80)));
  }

  @Get('resolve')
  resolve(@Query('code') code?: string, @Query('domain') domain?: string) {
    const lookup = parseTenantLookup((code ?? domain ?? '').slice(0, 300));
    const entry = lookup ? this.tenants.resolve(lookup) : null;
    if (!entry) throw new DomainError('TENANT_NOT_FOUND', 404);
    return ok(entry);
  }

  @Get(':code/config')
  async config(@Param('code') code: string) {
    return ok(await this.tenants.publicConfig(code));
  }
}
