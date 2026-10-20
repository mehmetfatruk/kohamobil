import { createHmac } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { jwtVerify, SignJWT } from 'jose';

import { APP_CONFIG, type AppConfig } from '../config/env.js';

export interface AccessClaims {
  sub: string;
  tid: string;
  sid: string;
}

const ISSUER = 'mirakil-gateway';
const AUDIENCE = 'mobile';

/**
 * Kısa ömürlü access token (JWT). Token PII veya Koha patron kimliği İÇERMEZ.
 * Yerel geliştirme sürümü HS256 kullanır; üretimde EdDSA + KeyProvider (docs/AUTHENTICATION.md §4.1).
 */
@Injectable()
export class TokenService {
  private readonly key: Uint8Array;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.key = new TextEncoder().encode(config.JWT_SECRET);
  }

  async sign(claims: AccessClaims): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + this.config.ACCESS_TOKEN_TTL_SECONDS * 1000);
    const token = await new SignJWT({ tid: claims.tid, sid: claims.sid })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(claims.sub)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(this.key);
    return { token, expiresAt };
  }

  /** @throws süresi dolmuş/geçersiz token */
  async verify(token: string): Promise<AccessClaims> {
    const { payload } = await jwtVerify(token, this.key, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.tid !== 'string' ||
      typeof payload.sid !== 'string'
    ) {
      throw new Error('Eksik claim');
    }
    return { sub: payload.sub, tid: payload.tid, sid: payload.sid };
  }

  /** Kurum + Koha patron kimliğinden türetilen, tahmin edilemez ve kararlı platform kullanıcı kimliği. */
  userIdFor(tenantCode: string, kohaPatronId: string): string {
    return `u_${createHmac('sha256', this.config.JWT_SECRET).update(`${tenantCode}:${kohaPatronId}`).digest('hex').slice(0, 24)}`;
  }
}
