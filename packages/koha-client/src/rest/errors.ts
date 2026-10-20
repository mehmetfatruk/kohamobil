import type { ErrorCode } from '@mirakil/types';

/**
 * Koha hata kodlarını Gateway hata kodlarına çevirir (docs/KOHA_INTEGRATION.md §8).
 * Bilinmeyen kodlar güvenli genel koda düşer; ham Koha metni yalnızca loglanır.
 */

const RENEWAL: Record<string, ErrorCode> = {
  too_many: 'LOAN_RENEWAL_TOO_MANY',
  too_unseen: 'LOAN_RENEWAL_NOT_ALLOWED',
  on_reserve: 'LOAN_RENEWAL_ON_HOLD',
  too_soon: 'LOAN_RENEWAL_TOO_SOON',
  auto_too_soon: 'LOAN_RENEWAL_TOO_SOON',
  overdue: 'LOAN_RENEWAL_OVERDUE',
  restriction: 'LOAN_RENEWAL_RESTRICTED',
  debarred: 'LOAN_RENEWAL_RESTRICTED',
  auto_too_much_oweing: 'LOAN_RENEWAL_FINES',
  auto_account_expired: 'LOAN_RENEWAL_ACCOUNT_EXPIRED',
  auto_renew: 'LOAN_RENEWAL_AUTO',
  auto_too_late: 'LOAN_RENEWAL_NOT_ALLOWED',
  onsite_checkout: 'LOAN_RENEWAL_NOT_ALLOWED',
  item_denied_renewal: 'LOAN_RENEWAL_NOT_ALLOWED',
  no_checkout: 'RESOURCE_NOT_FOUND',
  item_issued_to_other_patron: 'RESOURCE_NOT_FOUND',
};

export function mapRenewalError(error: string | null | undefined): ErrorCode {
  return (error && RENEWAL[error.trim()]) || 'LOAN_RENEWAL_NOT_ALLOWED';
}

/** Serbest metin içinde (ör. "Renewal not allowed: on_reserve") bilinen kodu arar. */
export function mapRenewalMessage(message: string): ErrorCode {
  const key = Object.keys(RENEWAL).find((code) => new RegExp(`\\b${code}\\b`).test(message));
  return key ? (RENEWAL[key] ?? 'LOAN_RENEWAL_NOT_ALLOWED') : 'LOAN_RENEWAL_NOT_ALLOWED';
}

const HOLD: [RegExp, ErrorCode][] = [
  [/tooManyHoldsForThisRecord|tooManyReserves(Today)?|maximum.*holds/i, 'HOLD_TOO_MANY'],
  [/alreadyReserved|itemAlreadyOnHold|alreadypossession|already/i, 'HOLD_ALREADY_EXISTS'],
  [/ageRestricted/i, 'HOLD_AGE_RESTRICTED'],
  [
    /cannotReserveFromOtherBranches|branchNotInHoldGroup|pickupNotInHoldGroup|libraryNotPickupLocation|libraryNotFound|cannotBeTransferred|pickup/i,
    'HOLD_PICKUP_LOCATION_INVALID',
  ],
  [/debarred|restricted|expired/i, 'HOLD_PATRON_RESTRICTED'],
  [/notReservable|noReservesAllowed|damaged|recall/i, 'HOLD_NOT_ALLOWED'],
];

export function mapHoldError(message: string): ErrorCode {
  return HOLD.find(([pattern]) => pattern.test(message))?.[1] ?? 'HOLD_NOT_ALLOWED';
}
