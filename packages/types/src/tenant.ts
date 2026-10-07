import { z } from 'zod';

import { FeatureFlagsSchema } from './features.js';

export const TenantCodeSchema = z
  .string()
  .regex(/^[a-z0-9-]{2,40}$/, 'Kurum kodu yalnızca küçük harf, rakam ve tire içerebilir');

export const DeploymentModeSchema = z.enum(['CENTRAL', 'ON_PREMISE']);
export type DeploymentMode = z.infer<typeof DeploymentModeSchema>;

export const AuthProviderTypeSchema = z.enum(['KOHA', 'LDAP', 'SAML', 'OIDC']);
export type AuthProviderType = z.infer<typeof AuthProviderTypeSchema>;

const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const HttpsUrlSchema = z.url({ protocol: /^https$/ });
const LocalizedTextSchema = z.object({ tr: z.string(), en: z.string() });

/** Tenant Directory kaydı — yalnızca herkese açık kurum bilgisi (docs/DEPLOYMENT.md §4). */
export const TenantDirectoryEntrySchema = z.object({
  id: z.uuid(),
  code: TenantCodeSchema,
  name: z.string().min(1),
  shortName: z.string().min(1).optional(),
  city: z.string().optional(),
  logoUrl: HttpsUrlSchema.optional(),
  deploymentMode: DeploymentModeSchema,
  /** Bu tenant'ın Gateway adresi; mobil tüm API isteklerini buraya yapar. */
  apiBaseUrl: HttpsUrlSchema,
});
export type TenantDirectoryEntry = z.infer<typeof TenantDirectoryEntrySchema>;

export const TenantAuthProviderPublicSchema = z.object({
  id: z.string(),
  type: AuthProviderTypeSchema,
  displayName: z.string(),
  identifierLabel: LocalizedTextSchema.optional(),
});

/** `GET /mobile/v1/tenants/{code}/config` — Koha bağlantı bilgisi veya secret İÇERMEZ. */
export const TenantPublicConfigSchema = TenantDirectoryEntrySchema.extend({
  branding: z.object({
    logoUrl: HttpsUrlSchema.optional(),
    logoDarkUrl: HttpsUrlSchema.optional(),
    primaryColor: HexColorSchema,
    secondaryColor: HexColorSchema,
  }),
  locale: z.enum(['tr', 'en']),
  timezone: z.string(),
  currency: z.string().length(3),
  opacUrl: HttpsUrlSchema.optional(),
  features: FeatureFlagsSchema,
  authProviders: z.array(TenantAuthProviderPublicSchema),
  minAppVersion: z.string(),
  configVersion: z.string(),
}).strict();
export type TenantPublicConfig = z.infer<typeof TenantPublicConfigSchema>;
