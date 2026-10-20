import type {
  Announcement,
  AppNotification,
  CatalogItem,
  ErrorCode,
  Fines,
  Hold,
  HomeSummary,
  ItemType,
  Library,
  Loan,
  LoginRequest,
  LoginResponse,
  NotificationPreferences,
  PlaceHoldRequest,
  Profile,
  RecordDetail,
  Renewability,
  SearchResult,
  TenantDirectoryEntry,
  TenantLookup,
  TenantPublicConfig,
} from '@mirakil/types';

import { ApiError, type MobileApi, type SearchParams } from './types';

export interface HttpApiContext {
  directoryUrl: string;
  /** Seçili kurumun Gateway adresi (Tenant Directory'den gelir). */
  getApiBaseUrl: () => string | null;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  /** Yenilenen token çiftini saklar. */
  onTokens: (login: LoginResponse) => Promise<void>;
  /** Oturum yenilenemedi: yerel oturumu kapatıp girişe yönlendirir. */
  onSessionExpired: () => Promise<void>;
  getLocale: () => string;
}

const randomId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Gateway `/mobile/v1` istemcisi (docs/API.md). Mobil uygulama yalnızca bu uçları bilir;
 * Koha'ya hiçbir koşulda doğrudan istek atılmaz.
 * Faz 2: access token süresi dolunca tek seferlik refresh (single-flight) eklenecek.
 */
export class HttpMobileApi implements MobileApi {
  readonly source = 'http' as const;
  private refreshing: Promise<boolean> | null = null;

  constructor(private readonly ctx: HttpApiContext) {}

  /** Access token süresi dolduğunda tek seferlik (single-flight) yenileme. */
  private refreshOnce(): Promise<boolean> {
    this.refreshing ??= (async () => {
      const refreshToken = this.ctx.getRefreshToken();
      if (!refreshToken) return false;
      try {
        await this.ctx.onTokens(await this.refresh(refreshToken));
        return true;
      } catch {
        await this.ctx.onSessionExpired();
        return false;
      }
    })().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async request<T>(
    base: 'directory' | 'api',
    path: string,
    init: { method?: string; body?: unknown; idempotent?: boolean; root?: string } = {},
    retried = false,
  ): Promise<T> {
    const root =
      init.root ?? (base === 'directory' ? this.ctx.directoryUrl : this.ctx.getApiBaseUrl());
    if (!root) throw new ApiError('TENANT_NOT_FOUND', 400);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Language': this.ctx.getLocale(),
      'X-Correlation-Id': randomId(),
    };
    const token = this.ctx.getAccessToken();
    if (token && base === 'api') headers.Authorization = `Bearer ${token}`;
    if (init.body !== undefined) headers['Content-Type'] = 'application/json';
    if (init.method && init.method !== 'GET' && init.idempotent !== false)
      headers['Idempotency-Key'] = randomId();

    let response: Response;
    try {
      response = await fetch(new URL(`/mobile/v1${path}`, root).toString(), {
        method: init.method ?? 'GET',
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    } catch {
      throw new ApiError('KOHA_UNAVAILABLE', 0);
    }
    if (response.status === 204) return undefined as T;
    const json = (await response.json().catch(() => null)) as {
      data?: T;
      code?: ErrorCode;
      message?: string;
      correlationId?: string;
    } | null;
    if (response.status === 401 && base === 'api' && !path.startsWith('/auth/') && !retried) {
      if (await this.refreshOnce()) return this.request<T>(base, path, init, true);
    }
    if (!response.ok) {
      throw new ApiError(
        json?.code ?? 'INTERNAL_ERROR',
        response.status,
        json?.correlationId,
        json?.message,
      );
    }
    return json?.data as T;
  }

  listTenants(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<TenantDirectoryEntry[]>('directory', `/tenants${query}`);
  }
  async lookupTenant(lookup: TenantLookup) {
    const query =
      lookup.kind === 'code'
        ? `code=${lookup.code}`
        : `domain=${encodeURIComponent(lookup.domain)}`;
    try {
      return await this.request<TenantDirectoryEntry>('directory', `/tenants/resolve?${query}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }
  getTenantConfig(entry: TenantDirectoryEntry) {
    // Kurum henüz seçilmedi: yapılandırma, dizinin bildirdiği Gateway adresinden alınır
    return this.request<TenantPublicConfig>('api', `/tenants/${entry.code}/config`, {
      root: entry.apiBaseUrl,
    });
  }
  login(request: LoginRequest) {
    return this.request<LoginResponse>('api', '/auth/login', {
      method: 'POST',
      body: request,
      idempotent: false,
    });
  }
  refresh(refreshToken: string) {
    return this.request<LoginResponse>('api', '/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      idempotent: false,
    });
  }
  logout() {
    return this.request<void>('api', '/auth/logout', { method: 'POST', idempotent: false });
  }
  getSummary() {
    return this.request<HomeSummary>('api', '/me/summary');
  }
  getProfile() {
    return this.request<Profile>('api', '/me');
  }
  changePassword(currentPassword: string, newPassword: string) {
    return this.request<void>('api', '/me/password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
  }
  getLoans() {
    return this.request<Loan[]>('api', '/loans');
  }
  checkRenewability(loanId: string) {
    return this.request<Renewability>('api', `/loans/${loanId}/renewability`);
  }
  renewLoan(loanId: string) {
    return this.request<Loan>('api', `/loans/${loanId}/renew`, { method: 'POST' });
  }
  getHolds() {
    return this.request<Hold[]>('api', '/holds?status=active');
  }
  placeHold(request: PlaceHoldRequest) {
    return this.request<Hold>('api', '/holds', { method: 'POST', body: request });
  }
  cancelHold(holdId: string) {
    return this.request<void>('api', `/holds/${holdId}`, { method: 'DELETE' });
  }
  getPickupLibraries(recordId: string) {
    return this.request<Library[]>('api', `/catalog/records/${recordId}/pickup-locations`);
  }
  getFines() {
    return this.request<Fines>('api', '/fines');
  }
  search(params: SearchParams) {
    const query = new URLSearchParams({
      q: params.q,
      field: params.field,
      page: String(params.page),
      limit: String(params.limit),
      ...(params.itemType ? { itemType: params.itemType } : {}),
    });
    return this.request<SearchResult>('api', `/catalog/search?${query.toString()}`);
  }
  getNewArrivals(params: { page: number; limit: number }) {
    return this.request<SearchResult>(
      'api',
      `/catalog/new-arrivals?page=${params.page}&limit=${params.limit}`,
    );
  }
  getItemTypes() {
    return this.request<ItemType[]>('api', '/catalog/item-types');
  }
  getRecord(recordId: string) {
    return this.request<RecordDetail>('api', `/catalog/records/${recordId}`);
  }
  getRecordItems(recordId: string) {
    return this.request<CatalogItem[]>('api', `/catalog/records/${recordId}/items`);
  }
  getLibraries() {
    return this.request<Library[]>('api', '/libraries');
  }
  getAnnouncements() {
    return this.request<Announcement[]>('api', '/announcements');
  }
  getNotifications() {
    return this.request<AppNotification[]>('api', '/notifications');
  }
  markNotificationRead(id: string) {
    return this.request<void>('api', `/notifications/${id}/read`, { method: 'POST' });
  }
  markAllNotificationsRead() {
    return this.request<void>('api', '/notifications/read-all', { method: 'POST' });
  }
  getNotificationPreferences() {
    return this.request<NotificationPreferences>('api', '/notification-preferences');
  }
  updateNotificationPreferences(prefs: NotificationPreferences) {
    return this.request<NotificationPreferences>('api', '/notification-preferences', {
      method: 'PUT',
      body: prefs,
    });
  }
}
