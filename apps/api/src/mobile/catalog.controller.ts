import { Controller, Get, Inject, Param, Query, Req, UseGuards } from '@nestjs/common';
import { SearchFieldSchema } from '@mirakil/types';
import { z } from 'zod';

import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { ok, parse } from './http-helpers.js';

const PageSchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

@Controller('mobile/v1')
@UseGuards(AuthGuard)
export class CatalogController {
  constructor(@Inject(TenantRegistry) private readonly tenants: TenantRegistry) {}

  private adapter(request: AuthenticatedRequest) {
    return this.tenants.adapter(request.session.tenantCode);
  }

  @Get('catalog/search')
  async search(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    const params = parse(
      PageSchema.extend({
        q: z.string().max(200).default(''),
        field: SearchFieldSchema.default('any'),
        itemType: z
          .string()
          .regex(/^[A-Za-z0-9_-]{1,20}$/)
          .optional(),
      }),
      query,
    );
    return ok(await (await this.adapter(request)).search(params));
  }

  @Get('catalog/new-arrivals')
  async newArrivals(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    return ok(await (await this.adapter(request)).getNewArrivals(parse(PageSchema, query)));
  }

  @Get('catalog/item-types')
  async itemTypes(@Req() request: AuthenticatedRequest) {
    return ok(await (await this.adapter(request)).getItemTypes());
  }

  @Get('catalog/records/:id')
  async record(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return ok(await (await this.adapter(request)).getRecord(id));
  }

  @Get('catalog/records/:id/items')
  async items(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return ok(await (await this.adapter(request)).getRecordItems(id));
  }

  @Get('libraries')
  async libraries(@Req() request: AuthenticatedRequest) {
    return ok(await (await this.adapter(request)).getLibraries());
  }
}
