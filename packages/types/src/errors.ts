import { z } from 'zod';

/**
 * Gateway hata kodları. Kararlı ve dil-bağımsızdır; kullanıcıya gösterilecek metin
 * `@mirakil/i18n` içinde bu kodlara göre üretilir. Koha'nın ham hata kodları burada yer almaz.
 * Katalog: docs/API.md §4.
 */
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_TOKEN_EXPIRED',
  'AUTH_SESSION_REVOKED',
  'AUTH_ACCOUNT_RESTRICTED',
  'AUTH_ACCOUNT_EXPIRED',
  'AUTH_PATRON_NOT_FOUND',
  'AUTH_PROVIDER_DISABLED',
  'TENANT_INACTIVE',
  'TENANT_NOT_FOUND',
  'FEATURE_DISABLED',
  'RESOURCE_NOT_FOUND',
  'LOAN_RENEWAL_TOO_MANY',
  'LOAN_RENEWAL_ON_HOLD',
  'LOAN_RENEWAL_TOO_SOON',
  'LOAN_RENEWAL_OVERDUE',
  'LOAN_RENEWAL_RESTRICTED',
  'LOAN_RENEWAL_FINES',
  'LOAN_RENEWAL_ACCOUNT_EXPIRED',
  'LOAN_RENEWAL_AUTO',
  'LOAN_RENEWAL_NOT_ALLOWED',
  'HOLD_NOT_ALLOWED',
  'HOLD_TOO_MANY',
  'HOLD_ALREADY_EXISTS',
  'HOLD_AGE_RESTRICTED',
  'HOLD_PICKUP_LOCATION_INVALID',
  'HOLD_PATRON_RESTRICTED',
  'HOLD_CANCEL_NOT_ALLOWED',
  'PASSWORD_CURRENT_INVALID',
  'PASSWORD_POLICY_VIOLATION',
  'PASSWORD_CHANGE_NOT_ALLOWED',
  'RATE_LIMITED',
  'APP_VERSION_UNSUPPORTED',
  'KOHA_UNAVAILABLE',
  'KOHA_TIMEOUT',
  'INTERNAL_ERROR',
] as const;

export const ErrorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

/** RFC 9457 Problem Details — Gateway'in tüm hata yanıtlarının biçimi. */
export const ProblemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  code: ErrorCodeSchema,
  message: z.string(),
  correlationId: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
