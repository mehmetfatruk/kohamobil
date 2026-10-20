import { createHash } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { createPatronContext } from '@mirakil/koha-client';
import type { LoginRequest, LoginResponse } from '@mirakil/types';

import { DomainError } from '../common/domain-error.js';
import { APP_CONFIG, type AppConfig } from '../config/env.js';
import { TenantRegistry } from '../tenants/tenant-registry.service.js';
import { RateLimiter } from './rate-limiter.js';
import { InMemorySessionStore, type Session } from './session-store.js';
import { TokenService } from './token.service.js';

const ABSOLUTE_SESSION_MS = 180 * 86_400_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  readonly sessions = new InMemorySessionStore();
  private readonly perIdentifier = new RateLimiter(5, 15 * 60_000);
  private readonly perIp = new RateLimiter(20, 60_000);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(TenantRegistry) private readonly tenants: TenantRegistry,
    @Inject(TokenService) private readonly tokens: TokenService,
  ) {}

  private refreshTtlMs() {
    return this.config.REFRESH_TOKEN_TTL_DAYS * 86_400_000;
  }

  private async issue(
    session: Session,
    refreshToken: string,
    refreshExpiresAt: number,
  ): Promise<LoginResponse> {
    const access = await this.tokens.sign({
      sub: session.userId,
      tid: session.tenantCode,
      sid: session.id,
    });
    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshToken,
      refreshTokenExpiresAt: new Date(refreshExpiresAt).toISOString(),
      user: { id: session.userId, displayName: session.displayName },
    };
  }

  async login(request: LoginRequest, ip: string, correlationId: string): Promise<LoginResponse> {
    this.tenants.find(request.tenantCode);
    if (request.providerId !== 'ap_koha') throw new DomainError('AUTH_PROVIDER_DISABLED', 400);
    // Denemeler kullanıcı adının özetine göre sayılır; düz kullanıcı adı loglanmaz
    const identifierKey = createHash('sha256')
      .update(`${request.tenantCode}:${request.identifier.toLowerCase()}`)
      .digest('hex');
    if (!this.perIp.consume(ip) || !this.perIdentifier.consume(identifierKey)) {
      throw new DomainError('RATE_LIMITED', 429);
    }

    const adapter = await this.tenants.adapter(request.tenantCode);
    const identity = await adapter.validateCredentials(request.identifier.trim(), request.password);
    if (!identity) {
      this.logger.warn({
        event: 'AUTH_LOGIN_FAILED',
        tenant: request.tenantCode,
        identifierHash: identifierKey.slice(0, 16),
        correlationId,
      });
      throw new DomainError('AUTH_INVALID_CREDENTIALS', 401);
    }
    this.perIdentifier.reset(identifierKey);

    const patron = await adapter.getPatron(
      createPatronContext({
        tenantId: request.tenantCode,
        kohaPatronId: identity.kohaPatronId,
        correlationId,
      }),
    );
    const userId = this.tokens.userIdFor(request.tenantCode, identity.kohaPatronId);
    const { session, refreshToken, refreshExpiresAt } = this.sessions.create(
      {
        tenantCode: request.tenantCode,
        userId,
        kohaPatronId: identity.kohaPatronId,
        displayName:
          [patron.firstname, patron.surname].filter(Boolean).join(' ') || (identity.userid ?? ''),
        absoluteExpiresAt: Date.now() + ABSOLUTE_SESSION_MS,
      },
      this.refreshTtlMs(),
    );
    this.logger.log({
      event: 'AUTH_LOGIN_SUCCESS',
      tenant: request.tenantCode,
      userId,
      correlationId,
    });
    return this.issue(session, refreshToken, refreshExpiresAt);
  }

  async refresh(refreshToken: string, correlationId: string): Promise<LoginResponse> {
    const result = this.sessions.rotate(refreshToken, this.refreshTtlMs());
    if (!result.ok) {
      if (result.reason === 'REUSE_DETECTED') {
        this.logger.warn(
          { event: 'AUTH_REFRESH_REUSE', correlationId },
          'Kullanılmış refresh token tekrar geldi; oturum iptal edildi',
        );
      }
      throw new DomainError('AUTH_SESSION_REVOKED', 401);
    }
    return this.issue(result.session, result.refreshToken, result.refreshExpiresAt);
  }

  logout(sessionId: string) {
    this.sessions.revoke(sessionId, 'LOGOUT');
  }
}
