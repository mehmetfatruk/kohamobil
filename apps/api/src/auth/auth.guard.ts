import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { createPatronContext, type PatronContext } from '@mirakil/koha-client';
import type { FastifyRequest } from 'fastify';
import { errors as joseErrors } from 'jose';

import { DomainError } from '../common/domain-error.js';
import { AuthService } from './auth.service.js';
import type { Session } from './session-store.js';
import { TokenService } from './token.service.js';

export interface AuthenticatedRequest extends FastifyRequest {
  session: Session;
  patron: PatronContext;
}

/**
 * Her istekte: imza + süre + aud/iss → oturum hâlâ geçerli mi → token'daki kurum ile oturumun
 * kurumu aynı mı. Koha patron kimliği token'dan değil, sunucudaki oturumdan gelir.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new DomainError('AUTH_SESSION_REVOKED', 401);
    let claims;
    try {
      claims = await this.tokens.verify(token);
    } catch (error) {
      throw new DomainError(
        error instanceof joseErrors.JWTExpired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_SESSION_REVOKED',
        401,
      );
    }
    const session = this.auth.sessions.get(claims.sid);
    if (!session || session.tenantCode !== claims.tid || session.userId !== claims.sub) {
      throw new DomainError('AUTH_SESSION_REVOKED', 401);
    }
    request.session = session;
    request.patron = createPatronContext({
      tenantId: session.tenantCode,
      kohaPatronId: session.kohaPatronId,
      correlationId: request.id,
    });
    return true;
  }
}
