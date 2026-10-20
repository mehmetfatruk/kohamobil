import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  detectSpecCapabilities,
  effectiveFeatures,
  KohaHttpClient,
  KohaRestAdapter,
  resolveCompatibility,
  type CapabilityId,
  type CompatibilityReport,
} from '@mirakil/koha-client';
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
  type TenantDirectoryEntry,
  type TenantLookup,
  type TenantPublicConfig,
} from '@mirakil/types';

import { DomainError } from '../common/domain-error.js';
import { APP_CONFIG, type AppConfig } from '../config/env.js';
import { GATEWAY_VERSION } from '../version.js';
import { loadTenantsFile, type LoadedTenant } from './tenants-file.js';

export const TENANT_SOURCE = Symbol('TENANT_SOURCE');
/** Koha'ya giden istekler için fetch (testlerde sahte Koha verilir). */
export const KOHA_FETCH = Symbol('KOHA_FETCH');

interface Runtime {
  adapter: KohaRestAdapter;
  report: CompatibilityReport;
  probedAt: number;
}

const PROBE_TTL = 24 * 3_600_000;
const FAILED_PROBE_RETRY = 60_000;

/**
 * Kurum kayıtları + Koha bağlantıları. Her kurumun Koha'sı ilk kullanımda incelenir
 * (OpenAPI spec → yetenekler → uyumluluk profili) ve 24 saatte bir yenilenir.
 */
@Injectable()
export class TenantRegistry {
  private readonly logger = new Logger(TenantRegistry.name);
  private readonly runtimes = new Map<string, Promise<Runtime>>();
  private readonly failures = new Map<string, number>();

  constructor(
    @Inject(TENANT_SOURCE) private readonly tenants: LoadedTenant[],
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(KOHA_FETCH) private readonly kohaFetch: typeof fetch,
  ) {}

  private active() {
    return this.tenants.filter((t) => t.entry.active);
  }

  find(code: string): LoadedTenant {
    const tenant = this.active().find((t) => t.entry.code === code);
    if (!tenant) throw new DomainError('TENANT_NOT_FOUND', 404);
    return tenant;
  }

  private directoryEntry({ entry }: LoadedTenant): TenantDirectoryEntry {
    return {
      // Kurum kodundan türetilmiş kararlı kimlik (veritabanına geçince gerçek UUID)
      id: entry.code,
      code: entry.code,
      name: entry.name,
      ...(entry.shortName ? { shortName: entry.shortName } : {}),
      ...(entry.city ? { city: entry.city } : {}),
      ...(entry.logoUrl ? { logoUrl: entry.logoUrl } : {}),
      deploymentMode: this.config.DEPLOYMENT_MODE,
      apiBaseUrl: this.config.PUBLIC_API_URL.replace(/\/+$/, ''),
    };
  }

  list(search?: string): TenantDirectoryEntry[] {
    const fold = (v: string) => v.toLocaleLowerCase('tr');
    const term = search ? fold(search.trim()) : '';
    return this.active()
      .filter(
        (t) =>
          !term ||
          [t.entry.name, t.entry.city ?? '', t.entry.code].some((v) => fold(v).includes(term)),
      )
      .map((t) => this.directoryEntry(t));
  }

  /** Kod veya alan adıyla YALNIZCA kayıtlı kurumu bulur (docs/DEPLOYMENT.md §4.1). */
  resolve(lookup: TenantLookup): TenantDirectoryEntry | null {
    const tenant = this.active().find((t) =>
      lookup.kind === 'code'
        ? t.entry.code === lookup.code
        : t.entry.domains.some((d) => lookup.domain === d || lookup.domain.endsWith(`.${d}`)) ||
          new URL(t.entry.koha.opacUrl ?? t.entry.koha.baseUrl).hostname === lookup.domain,
    );
    return tenant ? this.directoryEntry(tenant) : null;
  }

  async runtime(code: string): Promise<Runtime> {
    const tenant = this.find(code);
    const existing = this.runtimes.get(code);
    if (existing) {
      const runtime = await existing.catch(() => null);
      if (runtime && Date.now() - runtime.probedAt < PROBE_TTL) return runtime;
    }
    const lastFailure = this.failures.get(code);
    if (!existing && lastFailure && Date.now() - lastFailure < FAILED_PROBE_RETRY) {
      throw new DomainError('KOHA_UNAVAILABLE', 503);
    }
    const promise = this.connect(tenant);
    this.runtimes.set(code, promise);
    try {
      return await promise;
    } catch (error) {
      this.runtimes.delete(code);
      this.failures.set(code, Date.now());
      this.logger.error({ tenant: code, err: error }, 'Koha bağlantısı kurulamadı');
      throw new DomainError('KOHA_UNAVAILABLE', 503, undefined, { cause: error });
    }
  }

  async adapter(code: string): Promise<KohaRestAdapter> {
    return (await this.runtime(code)).adapter;
  }

  private async connect({ entry, secret }: LoadedTenant): Promise<Runtime> {
    const auth = entry.koha.auth;
    const http = new KohaHttpClient({
      baseUrl: entry.koha.baseUrl,
      timeoutMs: entry.koha.timeoutMs,
      userAgent: `MirAkil-Gateway/${GATEWAY_VERSION}`,
      fetch: this.kohaFetch,
      auth:
        auth.kind === 'oauth2'
          ? { kind: 'oauth2', clientId: auth.clientId, clientSecret: secret() }
          : { kind: 'basic', username: auth.username, password: secret() },
    });
    const { data: spec } = await http.request<unknown>('/');
    const capabilities = new Set<CapabilityId>(detectSpecCapabilities(spec));
    if (auth.kind === 'basic') capabilities.add('service.basicAuth');
    const report = resolveCompatibility(capabilities);
    this.logger.log(
      { tenant: entry.code, supportLevel: report.supportLevel, missing: report.missing },
      'Koha uyumluluk profili çıkarıldı',
    );
    if (report.supportLevel === 'UNSUPPORTED') {
      throw new Error(`Koha zorunlu yetenekleri sağlamıyor: ${report.missing.core.join(', ')}`);
    }
    const adapter = new KohaRestAdapter(http, report.profile, {
      timeZone: entry.timezone,
      currency: entry.currency,
      ...(entry.profileAttributes ? { profileAttributes: entry.profileAttributes } : {}),
    });
    return { adapter, report, probedAt: Date.now() };
  }

  async publicConfig(code: string): Promise<TenantPublicConfig> {
    const tenant = this.find(code);
    const { entry } = tenant;
    const admin: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS, ...entry.features, payments: false };
    let features = admin;
    try {
      features = effectiveFeatures(admin, (await this.runtime(code)).report.profile);
    } catch {
      // Koha'ya şu an ulaşılamıyorsa yapılandırma yine döner; işlemler ayrıca hata verir
    }
    return {
      ...this.directoryEntry(tenant),
      branding: {
        primaryColor: entry.primaryColor,
        secondaryColor: entry.secondaryColor,
        ...(entry.logoUrl ? { logoUrl: entry.logoUrl } : {}),
      },
      locale: 'tr',
      timezone: entry.timezone,
      currency: entry.currency,
      ...(entry.koha.opacUrl ? { opacUrl: entry.koha.opacUrl } : {}),
      // Uygulama içi duyuru/bildirim altyapısı Faz 4'te, şifre değiştirme Faz 3'te
      features: { ...features, announcements: false, notifications: false, passwordChange: false },
      authProviders: [{ id: 'ap_koha', type: 'KOHA', displayName: 'Kütüphane Hesabı' }],
      minAppVersion: this.config.MIN_APP_VERSION,
      configVersion: new Date().toISOString().slice(0, 10),
    };
  }
}

export function tenantSourceFactory(config: AppConfig): LoadedTenant[] {
  return config.TENANTS_FILE ? loadTenantsFile(config.TENANTS_FILE) : [];
}
