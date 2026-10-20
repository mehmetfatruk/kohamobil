import type { z } from 'zod';

import { DomainError } from '../common/domain-error.js';

export const ok = <T>(data: T) => ({ data });

/** İstek gövdesi/parametresi doğrulama; ayrıntılar istemciye değil yalnızca alan adlarıyla döner. */
export function parse<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new DomainError('VALIDATION_ERROR', 400, {
      fields: result.error.issues.map((i) => i.path.join('.')),
    });
  }
  return result.data;
}
