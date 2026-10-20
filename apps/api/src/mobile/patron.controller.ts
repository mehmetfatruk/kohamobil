import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { KohaOperationError } from '@mirakil/koha-client';
import {
  NotificationPreferencesSchema,
  PlaceHoldRequestSchema,
  type NotificationPreferences,
} from '@mirakil/types';

import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { DomainError } from '../common/domain-error.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { ok, parse } from './http-helpers.js';

const DEFAULT_PREFS: NotificationPreferences = {
  dueReminders: true,
  dueReminderDays: [3, 1, 0],
  overdue: true,
  holds: true,
  announcements: true,
  membership: true,
};

/** Kullanıcıya ait uçlar. Patron kimliği HER ZAMAN sunucudaki oturumdan gelir (IDOR koruması). */
@Controller('mobile/v1')
@UseGuards(AuthGuard)
export class PatronController {
  // Faz 4'te PostgreSQL'e taşınacak
  private readonly prefs = new Map<string, NotificationPreferences>();

  constructor(@Inject(TenantRegistry) private readonly tenants: TenantRegistry) {}

  private adapter(request: AuthenticatedRequest) {
    return this.tenants.adapter(request.session.tenantCode);
  }

  @Get('me')
  async me(@Req() request: AuthenticatedRequest) {
    const profile = await (await this.adapter(request)).getProfile(request.patron);
    return ok({ ...profile, id: request.session.userId });
  }

  @Get('me/summary')
  async summary(@Req() request: AuthenticatedRequest) {
    const adapter = await this.adapter(request);
    // Kurumda kapalı/desteklenmeyen bölümler özeti bozmaz
    const optional = <T>(promise: Promise<T>, fallback: T) =>
      promise.catch((error: unknown) => {
        if (error instanceof KohaOperationError && error.code === 'FEATURE_DISABLED')
          return fallback;
        throw error;
      });
    const [loans, holds, fines] = await Promise.all([
      adapter.getLoans(request.patron),
      optional(adapter.getHolds(request.patron), []),
      optional(adapter.getFines(request.patron), null),
    ]);
    return ok({
      loans: {
        total: loans.length,
        dueSoon: loans.filter((l) => l.status === 'DUE_SOON').length,
        overdue: loans.filter((l) => l.status === 'OVERDUE').length,
      },
      holds: { total: holds.length, ready: holds.filter((h) => h.status === 'READY').length },
      fines: { balance: fines?.balance ?? { amount: '0.00', currency: 'TRY' } },
      unreadNotifications: 0,
    });
  }

  @Post('me/password')
  @HttpCode(204)
  changePassword() {
    // Mevcut şifre doğrulama + politika kontrolü Faz 3'te (docs/KOHA_INTEGRATION.md §6.5)
    throw new DomainError('PASSWORD_CHANGE_NOT_ALLOWED', 403);
  }

  @Get('loans')
  async loans(@Req() request: AuthenticatedRequest) {
    return ok(await (await this.adapter(request)).getLoans(request.patron));
  }

  @Get('loans/:id/renewability')
  async renewability(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return ok(await (await this.adapter(request)).checkRenewability(request.patron, id));
  }

  @Post('loans/:id/renew')
  @HttpCode(200)
  async renew(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return ok(await (await this.adapter(request)).renewLoan(request.patron, id));
  }

  @Get('holds')
  async holds(@Req() request: AuthenticatedRequest) {
    return ok(await (await this.adapter(request)).getHolds(request.patron));
  }

  @Post('holds')
  @HttpCode(201)
  async placeHold(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const hold = parse(PlaceHoldRequestSchema, body);
    return ok(await (await this.adapter(request)).placeHold(request.patron, hold));
  }

  @Delete('holds/:id')
  @HttpCode(204)
  async cancelHold(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    await (await this.adapter(request)).cancelHold(request.patron, id);
  }

  @Get('fines')
  async fines(@Req() request: AuthenticatedRequest) {
    return ok(await (await this.adapter(request)).getFines(request.patron));
  }

  @Get('catalog/records/:id/pickup-locations')
  async pickup(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return ok(await (await this.adapter(request)).getPickupLibraries(request.patron, id));
  }

  // ── Faz 4'e kadar yer tutucular ─────────────────────────────────────────────
  @Get('notifications')
  notifications() {
    return ok([]);
  }

  @Post('notifications/read-all')
  @HttpCode(204)
  readAll() {}

  @Post('notifications/:id/read')
  @HttpCode(204)
  read() {}

  @Get('announcements')
  announcements() {
    return ok([]);
  }

  @Get('notification-preferences')
  getPrefs(@Req() request: AuthenticatedRequest) {
    return ok(this.prefs.get(request.session.userId) ?? DEFAULT_PREFS);
  }

  @Put('notification-preferences')
  putPrefs(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const prefs = parse(NotificationPreferencesSchema, body);
    this.prefs.set(request.session.userId, prefs);
    return ok(prefs);
  }

  @Put('devices/current')
  @HttpCode(204)
  registerDevice() {}

  @Delete('devices/current')
  @HttpCode(204)
  removeDevice() {}
}
