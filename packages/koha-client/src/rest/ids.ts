import type { ErrorCode } from '@mirakil/types';

/**
 * Mobil'e dönen kimlikler önekli ve opaktır (`lo_`, `ho_`, `rc_`, `it_`, `lb_`, `fn_`).
 * Önek, yanlış türde kimliğin (ör. rezervasyon yerine ödünç) kullanılmasını engeller.
 * Sahiplik HER işlemde Koha'dan ayrıca doğrulanır; kimlik tek başına yetki değildir.
 * (İmzalı/şifreli kimlikler Faz 1 sonunda eklenecek — docs/API.md §1.3.)
 */
export type IdKind = 'lo' | 'ho' | 'rc' | 'it' | 'lb' | 'fn';

export const toId = (kind: IdKind, raw: string | number) => `${kind}_${raw}`;

export class InvalidIdError extends Error {
  readonly code: ErrorCode = 'RESOURCE_NOT_FOUND';
}

export function fromId(kind: IdKind, id: string): string {
  const prefix = `${kind}_`;
  const raw = id.startsWith(prefix) ? id.slice(prefix.length) : '';
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(raw)) throw new InvalidIdError(`Geçersiz kimlik: ${kind}`);
  return raw;
}

export const fromNumericId = (kind: IdKind, id: string) => {
  const raw = fromId(kind, id);
  if (!/^\d+$/.test(raw)) throw new InvalidIdError(`Geçersiz kimlik: ${kind}`);
  return raw;
};
