import { z } from 'zod';

/** Tenant bazlı özellik bayrakları. Kapalı özellik mobilde gösterilmez, backend'de reddedilir. */
export const FEATURE_KEYS = [
  'catalogSearch',
  'holds',
  'holdCancel',
  'renewals',
  'fines',
  'history',
  'notifications',
  'announcements',
  'passwordChange',
  'digitalCard',
  'payments',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FeatureFlagsSchema = z.object(
  Object.fromEntries(FEATURE_KEYS.map((key) => [key, z.boolean()])) as Record<
    FeatureKey,
    z.ZodBoolean
  >,
);
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

/** Yeni bir tenant için güvenli varsayılanlar: belirsiz olan kapalıdır. */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  catalogSearch: true,
  holds: true,
  holdCancel: true,
  renewals: true,
  fines: true,
  history: false,
  notifications: true,
  announcements: true,
  passwordChange: false,
  digitalCard: true,
  payments: false,
};
