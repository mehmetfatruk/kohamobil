import type { ErrorCode } from '@mirakil/types';

/** Gateway iş kuralı hatası. Kullanıcıya yalnızca `code` (yerelleştirilmiş mesajla) gider. */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    readonly details?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(code, options);
    this.name = 'DomainError';
  }
}
