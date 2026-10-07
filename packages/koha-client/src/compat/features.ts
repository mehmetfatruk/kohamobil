import type { FeatureKey } from '@mirakil/types';

import type { OperationId } from './operations.js';
import type { CompatibilityProfile } from './resolver.js';

/**
 * Her özellik için gereken işlemler. Efektif özellik = admin bayrağı VE bu işlemlerin
 * hepsinin bu Koha'da bir stratejisinin olması.
 * Koha'dan bağımsız özellikler (duyurular, dijital kart, bildirimler) burada yer almaz.
 */
const FEATURE_REQUIREMENTS: Partial<Record<FeatureKey, readonly OperationId[]>> = {
  catalogSearch: ['catalog.search', 'catalog.record', 'catalog.items'],
  holds: ['holds.list', 'holds.create', 'holds.pickupLocations'],
  holdCancel: ['holds.list', 'holds.cancel'],
  renewals: ['loans.renewability', 'loans.renew'],
  fines: ['account.summary'],
  history: ['loans.history'],
  passwordChange: ['patron.changePassword'],
};

export function isFeatureSupported(feature: FeatureKey, profile: CompatibilityProfile): boolean {
  const required = FEATURE_REQUIREMENTS[feature];
  return required === undefined || required.every((operation) => profile[operation] !== null);
}

export function effectiveFeatures<T extends Partial<Record<FeatureKey, boolean>>>(
  adminFlags: T,
  profile: CompatibilityProfile,
): T {
  const result: Partial<Record<FeatureKey, boolean>> = {};
  for (const [key, enabled] of Object.entries(adminFlags) as [FeatureKey, boolean][]) {
    result[key] = enabled && isFeatureSupported(key, profile);
  }
  return result as T;
}
