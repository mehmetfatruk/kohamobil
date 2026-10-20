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
  RecordSummary,
  Renewability,
  SearchField,
  SearchResult,
  TenantDirectoryEntry,
  TenantLookup,
  TenantPublicConfig,
} from '@mirakil/types';

/**
 * Ekranların bildiği TEK veri arayüzü. İki uygulaması vardır:
 *  - MockMobileApi: örnek veri (arka uç hazır olmadan ekranları denemek için)
 *  - HttpMobileApi: Gateway `/mobile/v1` uçları (docs/API.md)
 * Hangisinin kullanılacağı `EXPO_PUBLIC_DATA_SOURCE` ile seçilir; ekran kodu değişmez.
 */
export interface MobileApi {
  readonly source: 'mock' | 'http';

  // Kurum dizini ve oturum
  listTenants(search?: string): Promise<TenantDirectoryEntry[]>;
  lookupTenant(lookup: TenantLookup): Promise<TenantDirectoryEntry | null>;
  getTenantConfig(entry: TenantDirectoryEntry): Promise<TenantPublicConfig>;
  login(request: LoginRequest): Promise<LoginResponse>;
  refresh(refreshToken: string): Promise<LoginResponse>;
  logout(): Promise<void>;

  // Kullanıcı
  getSummary(): Promise<HomeSummary>;
  getProfile(): Promise<Profile>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;

  // Ödünç
  getLoans(): Promise<Loan[]>;
  checkRenewability(loanId: string): Promise<Renewability>;
  renewLoan(loanId: string): Promise<Loan>;

  // Rezervasyon
  getHolds(): Promise<Hold[]>;
  placeHold(request: PlaceHoldRequest): Promise<Hold>;
  cancelHold(holdId: string): Promise<void>;
  getPickupLibraries(recordId: string): Promise<Library[]>;

  // Borç
  getFines(): Promise<Fines>;

  // Katalog
  search(params: SearchParams): Promise<SearchResult>;
  getNewArrivals(params: { page: number; limit: number }): Promise<SearchResult>;
  getItemTypes(): Promise<ItemType[]>;
  getRecord(recordId: string): Promise<RecordDetail>;
  getRecordItems(recordId: string): Promise<CatalogItem[]>;

  // Kütüphane, duyuru, bildirim
  getLibraries(): Promise<Library[]>;
  getAnnouncements(): Promise<Announcement[]>;
  getNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  getNotificationPreferences(): Promise<NotificationPreferences>;
  updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences>;
}

export interface SearchParams {
  q: string;
  field: SearchField;
  itemType?: string;
  page: number;
  limit: number;
}

export type { RecordSummary };

/** Gateway'in Problem Details yanıtından veya örnek veriden gelen iş hatası. */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    readonly correlationId?: string,
    readonly serverMessage?: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}
