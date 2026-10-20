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

/**
 * Kurum bulma girdisi (docs/DEPLOYMENT.md §4.1): liste seçimi dışında kullanıcı kurum kodu,
 * kurumun Koha/OPAC alan adı veya kütüphanede asılı QR kodu ile kurumunu bulabilir.
 * QR / alan adı yalnızca Tenant Directory'de KAYITLI kurumu bulmaya yarar; mobil uygulama
 * hiçbir koşulda girilen adrese doğrudan bağlanmaz.
 */
export const TENANT_QR_PREFIXES = ['https://app.koha-tr.com/k/', 'mirakil://tenant/'] as const;

export type TenantLookup = { kind: 'code'; code: string } | { kind: 'domain'; domain: string };

/** Kullanıcının yazdığı veya QR'dan okunan metni dizin sorgusuna çevirir; geçersizse `null`. */
export function parseTenantLookup(input: string): TenantLookup | null {
  const raw = input.trim();
  if (!raw) return null;
  for (const prefix of TENANT_QR_PREFIXES) {
    if (raw.toLowerCase().startsWith(prefix)) {
      const code = raw.slice(prefix.length).split(/[/?#]/)[0]?.toLowerCase() ?? '';
      return TenantCodeSchema.safeParse(code).success ? { kind: 'code', code } : null;
    }
  }
  const lower = raw.toLowerCase();
  if (TenantCodeSchema.safeParse(lower).success && !lower.includes('.'))
    return { kind: 'code', code: lower };
  const hostCandidate = lower.replace(/^https?:\/\//, '').split(/[/?#:]/)[0] ?? '';
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(hostCandidate)
    ? { kind: 'domain', domain: hostCandidate }
    : null;
}

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
