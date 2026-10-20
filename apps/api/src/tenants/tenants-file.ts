import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

import { FEATURE_KEYS, TenantCodeSchema, type FeatureKey } from '@mirakil/types';
import { z } from 'zod';

/**
 * Kurum kayıt dosyası (TENANTS_FILE). Faz 1 sonunda bu bilgiler PostgreSQL'e ve yönetim
 * paneline taşınacak (docs/DATABASE.md). Dosya SECRET İÇERMEZ: Koha client secret'ı
 * `clientSecretFile` (dosya yolu) veya `clientSecretEnv` (ortam değişkeni adı) ile gösterilir.
 */

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const KohaAuthSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('oauth2'),
    clientId: z.string().min(1),
    clientSecretFile: z.string().optional(),
    clientSecretEnv: z.string().optional(),
  }),
  z.object({
    kind: z.literal('basic'),
    username: z.string().min(1),
    passwordFile: z.string().optional(),
    passwordEnv: z.string().optional(),
  }),
]);

export const TenantEntrySchema = z.object({
  code: TenantCodeSchema,
  name: z.string().min(1),
  shortName: z.string().optional(),
  city: z.string().optional(),
  logoUrl: z.url().optional(),
  // MirAkıl kurumsal renkleri (uygulama şu an kurum rengini kullanmıyor, bkz. D27)
  primaryColor: HexColor.default('#0055A4'),
  secondaryColor: HexColor.default('#0F4A74'),
  /** Kullanıcının yazabileceği / QR'dan gelebilecek alan adları (ör. katalog.ornek.edu.tr) */
  domains: z.array(z.string().toLowerCase()).default([]),
  timezone: z.string().default('Europe/Istanbul'),
  currency: z.string().length(3).default('TRY'),
  active: z.boolean().default(true),
  koha: z.object({
    baseUrl: z.url(),
    opacUrl: z.url().optional(),
    auth: KohaAuthSchema,
    timeoutMs: z.number().int().min(1000).max(30000).default(8000),
  }),
  /** Admin bayrakları; Koha'nın desteklemediği özellikler ayrıca otomatik kapanır. */
  features: z.partialRecord(z.enum(FEATURE_KEYS), z.boolean()).default({}),
  profileAttributes: z
    .object({ faculty: z.string().optional(), department: z.string().optional() })
    .optional(),
});

export type TenantEntry = z.infer<typeof TenantEntrySchema> & {
  features: Partial<Record<FeatureKey, boolean>>;
};

const FileSchema = z.object({ tenants: z.array(TenantEntrySchema) });

export interface LoadedTenant {
  entry: TenantEntry;
  /** Çalışma anında çözülen secret — loglanmaz, yanıtlara girmez. */
  secret: () => string;
}

export function loadTenantsFile(
  path: string,
  env: Record<string, string | undefined> = process.env,
): LoadedTenant[] {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  const parsed = FileSchema.parse(raw);
  const base = dirname(path);
  const codes = new Set<string>();

  return parsed.tenants.map((entry) => {
    if (codes.has(entry.code)) throw new Error(`Tekrarlanan kurum kodu: ${entry.code}`);
    codes.add(entry.code);
    const auth = entry.koha.auth;
    const file = auth.kind === 'oauth2' ? auth.clientSecretFile : auth.passwordFile;
    const envName = auth.kind === 'oauth2' ? auth.clientSecretEnv : auth.passwordEnv;
    const secret = () => {
      const value = file
        ? readFileSync(isAbsolute(file) ? file : resolve(base, file), 'utf8').trim()
        : envName
          ? env[envName]
          : undefined;
      if (!value || /CHANGE_ME/i.test(value))
        throw new Error(`${entry.code}: Koha secret'ı tanımlı değil`);
      return value;
    };
    return { entry: entry, secret };
  });
}
