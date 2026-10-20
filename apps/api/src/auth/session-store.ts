import { createHash, randomBytes, randomUUID } from 'node:crypto';

/**
 * Oturum ve refresh token deposu. Refresh token yalnızca SHA-256 özeti olarak tutulur;
 * her kullanımda döndürülür (rotation), kullanılmış token tekrar gelirse oturum ailesi iptal edilir
 * (docs/AUTHENTICATION.md §4.2).
 *
 * Bu sürüm bellekte çalışır (yerel geliştirme). Faz 1'de PostgreSQL (`user_sessions`,
 * `refresh_tokens`) + Redis (anında iptal) uygulaması aynı arayüzle eklenecek.
 */

export interface Session {
  id: string;
  tenantCode: string;
  userId: string;
  /** Koha patron kimliği — yalnızca sunucuda; token'a veya istemciye verilmez. */
  kohaPatronId: string;
  displayName: string;
  createdAt: number;
  absoluteExpiresAt: number;
  revokedAt: number | null;
  revokeReason: string | null;
}

interface RefreshRecord {
  sessionId: string;
  expiresAt: number;
  usedAt: number | null;
}

export type RefreshResult =
  | { ok: true; session: Session; refreshToken: string; refreshExpiresAt: number }
  | { ok: false; reason: 'NOT_FOUND' | 'EXPIRED' | 'REVOKED' | 'REUSE_DETECTED' };

const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const newToken = () => `rt_${randomBytes(32).toString('base64url')}`;

export interface SessionStore {
  create(
    input: Omit<Session, 'id' | 'createdAt' | 'revokedAt' | 'revokeReason'>,
    refreshTtlMs: number,
  ): { session: Session; refreshToken: string; refreshExpiresAt: number };
  get(sessionId: string): Session | null;
  rotate(refreshToken: string, refreshTtlMs: number): RefreshResult;
  revoke(sessionId: string, reason: string): void;
}

export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, Session>();
  private refresh = new Map<string, RefreshRecord>();

  constructor(private readonly now: () => number = Date.now) {}

  create(
    input: Omit<Session, 'id' | 'createdAt' | 'revokedAt' | 'revokeReason'>,
    refreshTtlMs: number,
  ) {
    const session: Session = {
      ...input,
      id: randomUUID(),
      createdAt: this.now(),
      revokedAt: null,
      revokeReason: null,
    };
    this.sessions.set(session.id, session);
    const refreshToken = newToken();
    const refreshExpiresAt = Math.min(this.now() + refreshTtlMs, session.absoluteExpiresAt);
    this.refresh.set(hash(refreshToken), {
      sessionId: session.id,
      expiresAt: refreshExpiresAt,
      usedAt: null,
    });
    return { session, refreshToken, refreshExpiresAt };
  }

  get(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.revokedAt || session.absoluteExpiresAt < this.now()) return null;
    return session;
  }

  rotate(refreshToken: string, refreshTtlMs: number): RefreshResult {
    const record = this.refresh.get(hash(refreshToken));
    if (!record) return { ok: false, reason: 'NOT_FOUND' };
    const session = this.sessions.get(record.sessionId);
    if (!session || session.revokedAt) return { ok: false, reason: 'REVOKED' };
    if (record.usedAt) {
      // Kullanılmış token tekrar geldi: çalınmış olabilir → tüm aile iptal
      this.revoke(session.id, 'REUSE_DETECTED');
      return { ok: false, reason: 'REUSE_DETECTED' };
    }
    if (record.expiresAt < this.now() || session.absoluteExpiresAt < this.now())
      return { ok: false, reason: 'EXPIRED' };
    record.usedAt = this.now();
    const next = newToken();
    const refreshExpiresAt = Math.min(this.now() + refreshTtlMs, session.absoluteExpiresAt);
    this.refresh.set(hash(next), {
      sessionId: session.id,
      expiresAt: refreshExpiresAt,
      usedAt: null,
    });
    return { ok: true, session, refreshToken: next, refreshExpiresAt };
  }

  revoke(sessionId: string, reason: string): void {
    const session = this.sessions.get(sessionId);
    if (session && !session.revokedAt) {
      session.revokedAt = this.now();
      session.revokeReason = reason;
    }
  }
}
