import {
  DEFAULT_FEATURE_FLAGS,
  type CatalogItem,
  type Hold,
  type ItemType,
  type Library,
  type Loan,
  type LoginRequest,
  type NotificationPreferences,
  type PlaceHoldRequest,
  type RecordDetail,
  type RecordSummary,
  type SearchResult,
  type TenantDirectoryEntry,
  type TenantLookup,
  type TenantPublicConfig,
} from '@mirakil/types';

import { ApiError, type MobileApi, type SearchParams } from '../types';
import {
  ANNOUNCEMENTS,
  DEMO_USER,
  daysFromToday,
  fineLines,
  HOLD_SEEDS,
  ITEM_TYPES,
  LIBRARIES,
  LOAN_SEEDS,
  NOTIFICATIONS,
  RECORDS,
  TENANTS,
  toIsoDate,
  type MockLoanSeed,
  type MockRecord,
  type MockTenant,
} from './data';

const DUE_SOON_DAYS = 3;
const MAX_HOLDS = 5;
const RENEWAL_PERIOD_DAYS = 15;

let latencyEnabled = true;
/** Gerçekçi ağ gecikmesi taklidi; testlerde kapatılır. */
export const setMockLatency = (enabled: boolean) => {
  latencyEnabled = enabled;
};

const wait = (min = 200, max = 550) =>
  latencyEnabled
    ? new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)))
    : Promise.resolve();

const fold = (value: string) => value.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '');

const toDirectoryEntry = ({
  domains: _d,
  primaryColor: _p,
  secondaryColor: _s,
  ...entry
}: MockTenant): TenantDirectoryEntry => entry;

const recordById = (id: string): MockRecord => {
  const record = RECORDS.find((r) => r.id === id);
  if (!record) throw new ApiError('RESOURCE_NOT_FOUND', 404);
  return record;
};

const libraryRef = (id: string) => {
  const library = LIBRARIES.find((l) => l.id === id) ?? LIBRARIES[0]!;
  return { id: library.id, name: library.name };
};

const isHoldable = (record: MockRecord) =>
  ['BK', 'SER'].includes(record.type) && record.items.some((i) => i.status !== 'NOT_FOR_LOAN');

function toSummary(record: MockRecord): RecordSummary {
  const type = ITEM_TYPES.find((t) => t.code === record.type);
  return {
    id: record.id,
    title: record.subtitle ? `${record.title}: ${record.subtitle}` : record.title,
    author: record.authors[0] ?? null,
    coverUrl: null,
    publicationYear: record.year,
    materialType: type ? { code: type.code, name: type.name } : null,
    callNumber: record.callNumber,
    availability: {
      available: record.items.filter((i) => i.status === 'AVAILABLE').length,
      total: record.items.length,
    },
  };
}

function loanStatus(daysRemaining: number): Loan['status'] {
  if (daysRemaining < 0) return 'OVERDUE';
  return daysRemaining <= DUE_SOON_DAYS ? 'DUE_SOON' : 'OK';
}

/**
 * Örnek veriyle çalışan API. Gateway'in iş kurallarını (yenileme engelleri, rezervasyon
 * kontrolleri, aynı hata kodları) taklit eder; böylece ekranlar gerçek davranışa göre yazılır.
 */
export class MockMobileApi implements MobileApi {
  readonly source = 'mock' as const;

  private loans: MockLoanSeed[] = LOAN_SEEDS.map((l) => ({ ...l }));
  private holds: Hold[] = HOLD_SEEDS.map((seed) => {
    const record = recordById(seed.recordId);
    return {
      id: seed.id,
      record: {
        id: record.id,
        title: record.title,
        author: record.authors[0] ?? null,
        coverUrl: null,
      },
      pickupLibrary: libraryRef(seed.libraryId),
      status: seed.status,
      queuePosition: seed.queuePosition,
      placedAt: daysFromToday(-seed.placedDaysAgo).toISOString(),
      pickupDeadline:
        seed.pickupInDays === null ? null : toIsoDate(daysFromToday(seed.pickupInDays)),
      cancellable: seed.status !== 'READY',
    };
  });
  private notifications = NOTIFICATIONS();
  private prefs: NotificationPreferences = {
    dueReminders: true,
    dueReminderDays: [3, 1, 0],
    overdue: true,
    holds: true,
    announcements: true,
    membership: true,
  };

  // ── Kurum dizini ──────────────────────────────────────────────────────────
  async listTenants(search?: string) {
    await wait();
    const term = search ? fold(search) : '';
    return TENANTS.filter(
      (t) =>
        !term ||
        fold(t.name).includes(term) ||
        fold(t.city ?? '').includes(term) ||
        t.code.includes(term),
    ).map(toDirectoryEntry);
  }

  async lookupTenant(lookup: TenantLookup) {
    await wait();
    const tenant =
      lookup.kind === 'code'
        ? TENANTS.find((t) => t.code === lookup.code)
        : TENANTS.find((t) =>
            t.domains.some((d) => lookup.domain === d || lookup.domain.endsWith(`.${d}`)),
          );
    return tenant ? toDirectoryEntry(tenant) : null;
  }

  async getTenantConfig(entry: TenantDirectoryEntry): Promise<TenantPublicConfig> {
    await wait();
    const tenant = TENANTS.find((t) => t.code === entry.code);
    if (!tenant) throw new ApiError('TENANT_NOT_FOUND', 404);
    return {
      ...toDirectoryEntry(tenant),
      branding: { primaryColor: tenant.primaryColor, secondaryColor: tenant.secondaryColor },
      locale: 'tr',
      timezone: 'Europe/Istanbul',
      currency: 'TRY',
      features: {
        ...DEFAULT_FEATURE_FLAGS,
        passwordChange: tenant.code !== 'kent-halk',
      },
      authProviders: [{ id: 'ap_koha', type: 'KOHA', displayName: 'Kütüphane Hesabı' }],
      minAppVersion: '0.1.0',
      configVersion: new Date().toISOString(),
    };
  }

  async login(request: LoginRequest) {
    await wait(400, 800);
    const identifier = request.identifier.trim().toLowerCase();
    const known = identifier === DEMO_USER.identifier || identifier === DEMO_USER.cardNumber;
    if (!known || request.password !== DEMO_USER.password) {
      throw new ApiError('AUTH_INVALID_CREDENTIALS', 401);
    }
    return {
      accessToken: 'mock-access-token',
      accessTokenExpiresAt: daysFromToday(1).toISOString(),
      refreshToken: 'mock-refresh-token',
      refreshTokenExpiresAt: daysFromToday(30).toISOString(),
      user: { id: DEMO_USER.id, displayName: `${DEMO_USER.firstName} ${DEMO_USER.lastName}` },
    };
  }

  async refresh(refreshToken: string) {
    await wait(100, 250);
    if (refreshToken !== 'mock-refresh-token') throw new ApiError('AUTH_SESSION_REVOKED', 401);
    return this.login({
      tenantCode: '',
      providerId: '',
      identifier: DEMO_USER.identifier,
      password: DEMO_USER.password,
    });
  }

  async logout() {
    await wait(100, 200);
  }

  // ── Kullanıcı ─────────────────────────────────────────────────────────────
  async getSummary() {
    const [loans, holds] = await Promise.all([this.getLoans(), this.getHolds()]);
    const fines = fineLines();
    return {
      loans: {
        total: loans.length,
        dueSoon: loans.filter((l) => l.status === 'DUE_SOON').length,
        overdue: loans.filter((l) => l.status === 'OVERDUE').length,
      },
      holds: { total: holds.length, ready: holds.filter((h) => h.status === 'READY').length },
      fines: { balance: { amount: this.balance(fines.outstanding), currency: 'TRY' } },
      unreadNotifications: this.notifications.filter((n) => !n.readAt).length,
    };
  }

  async getProfile() {
    await wait();
    return {
      id: DEMO_USER.id,
      firstName: DEMO_USER.firstName,
      lastName: DEMO_USER.lastName,
      cardNumber: DEMO_USER.cardNumber,
      email: DEMO_USER.email,
      phone: DEMO_USER.phone,
      category: { code: 'LISANS', name: 'Lisans Öğrencisi' },
      faculty: 'Mühendislik Fakültesi',
      department: 'Bilgisayar Mühendisliği',
      homeLibrary: libraryRef('lb_merkez'),
      membershipStart: toIsoDate(daysFromToday(-400)),
      membershipEnd: toIsoDate(daysFromToday(1060)),
      restrictions: [],
    };
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await wait(400, 700);
    if (currentPassword !== DEMO_USER.password) throw new ApiError('PASSWORD_CURRENT_INVALID', 400);
    if (newPassword.length < 8) throw new ApiError('PASSWORD_POLICY_VIOLATION', 400);
  }

  // ── Ödünç ─────────────────────────────────────────────────────────────────
  private toLoan(seed: MockLoanSeed): Loan {
    const record = recordById(seed.recordId);
    const item = record.items[seed.itemIndex];
    return {
      id: seed.id,
      record: {
        id: record.id,
        title: record.title,
        author: record.authors[0] ?? null,
        coverUrl: null,
      },
      item: {
        id: item?.id ?? `${seed.id}_item`,
        barcode: `0001${seed.id.slice(3).padStart(4, '0')}`,
        callNumber: record.callNumber,
      },
      library: libraryRef(item?.libraryId ?? 'lb_merkez'),
      checkedOutAt: daysFromToday(-seed.checkedOutDaysAgo).toISOString(),
      dueDate: toIsoDate(daysFromToday(seed.dueInDays)),
      daysRemaining: seed.dueInDays,
      status: loanStatus(seed.dueInDays),
      renewals: { count: seed.renewals, max: seed.maxRenewals },
    };
  }

  async getLoans() {
    await wait();
    return this.loans
      .map((seed) => this.toLoan(seed))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  private findLoan(loanId: string) {
    const seed = this.loans.find((l) => l.id === loanId);
    if (!seed) throw new ApiError('RESOURCE_NOT_FOUND', 404);
    return seed;
  }

  private renewalBlock(seed: MockLoanSeed) {
    if (seed.block) return seed.block;
    if (seed.renewals >= seed.maxRenewals) return 'LOAN_RENEWAL_TOO_MANY' as const;
    if (seed.dueInDays < 0) return 'LOAN_RENEWAL_OVERDUE' as const;
    return null;
  }

  async checkRenewability(loanId: string) {
    await wait();
    const reason = this.renewalBlock(this.findLoan(loanId));
    return { renewable: reason === null, reason };
  }

  async renewLoan(loanId: string) {
    await wait(500, 900);
    const seed = this.findLoan(loanId);
    const reason = this.renewalBlock(seed);
    if (reason) throw new ApiError(reason, 409);
    seed.renewals += 1;
    seed.dueInDays = Math.max(seed.dueInDays, 0) + RENEWAL_PERIOD_DAYS;
    return this.toLoan(seed);
  }

  // ── Rezervasyon ───────────────────────────────────────────────────────────
  async getHolds() {
    await wait();
    return this.holds.map((h) => ({ ...h }));
  }

  async getPickupLibraries(recordId: string): Promise<Library[]> {
    await wait();
    recordById(recordId);
    return LIBRARIES.filter((l) => l.pickupLocation);
  }

  async placeHold(request: PlaceHoldRequest) {
    await wait(500, 900);
    const record = recordById(request.recordId);
    if (!isHoldable(record)) throw new ApiError('HOLD_NOT_ALLOWED', 409);
    if (
      this.holds.some((h) => h.record.id === record.id) ||
      this.loans.some((l) => l.recordId === record.id)
    ) {
      throw new ApiError('HOLD_ALREADY_EXISTS', 409);
    }
    if (this.holds.length >= MAX_HOLDS) throw new ApiError('HOLD_TOO_MANY', 409);
    const library = LIBRARIES.find((l) => l.id === request.pickupLibraryId);
    if (!library?.pickupLocation) throw new ApiError('HOLD_PICKUP_LOCATION_INVALID', 409);

    const hold: Hold = {
      id: `ho_${Date.now().toString(36)}`,
      record: {
        id: record.id,
        title: record.title,
        author: record.authors[0] ?? null,
        coverUrl: null,
      },
      pickupLibrary: { id: library.id, name: library.name },
      status: 'WAITING',
      queuePosition: record.items.some((i) => i.status === 'AVAILABLE') ? 1 : 2,
      placedAt: new Date().toISOString(),
      pickupDeadline: null,
      cancellable: true,
    };
    this.holds = [hold, ...this.holds];
    return hold;
  }

  async cancelHold(holdId: string) {
    await wait(400, 700);
    const hold = this.holds.find((h) => h.id === holdId);
    if (!hold) throw new ApiError('RESOURCE_NOT_FOUND', 404);
    if (!hold.cancellable) throw new ApiError('HOLD_CANCEL_NOT_ALLOWED', 409);
    this.holds = this.holds.filter((h) => h.id !== holdId);
  }

  // ── Borç ──────────────────────────────────────────────────────────────────
  private balance(outstanding: ReturnType<typeof fineLines>['outstanding']) {
    return outstanding
      .reduce((sum, line) => sum + Number(line.remaining?.amount ?? 0), 0)
      .toFixed(2);
  }

  async getFines() {
    await wait();
    const { outstanding, transactions } = fineLines();
    return {
      balance: { amount: this.balance(outstanding), currency: 'TRY' },
      outstanding,
      transactions,
    };
  }

  // ── Katalog ───────────────────────────────────────────────────────────────
  private matches(record: MockRecord, params: SearchParams) {
    if (params.itemType && record.type !== params.itemType) return false;
    const term = fold(params.q.trim());
    if (!term) return Boolean(params.itemType);
    const fields: Record<SearchParams['field'], string[]> = {
      any: [
        record.title,
        record.subtitle ?? '',
        ...record.authors,
        ...record.subjects,
        record.isbn ?? '',
        record.issn ?? '',
        record.callNumber,
        record.publisher,
      ],
      title: [record.title, record.subtitle ?? ''],
      author: record.authors,
      subject: record.subjects,
      isbn: [record.isbn ?? ''],
      issn: [record.issn ?? ''],
      callNumber: [record.callNumber],
    };
    const normalized = fields[params.field].map((value) =>
      params.field === 'isbn' || params.field === 'issn' ? value.replace(/-/g, '') : fold(value),
    );
    const needle =
      params.field === 'isbn' || params.field === 'issn' ? term.replace(/-/g, '') : term;
    return normalized.some((value) => value.includes(needle));
  }

  private page(records: MockRecord[], page: number, limit: number): SearchResult {
    const start = (page - 1) * limit;
    return {
      items: records.slice(start, start + limit).map(toSummary),
      total: records.length,
      page,
      limit,
    };
  }

  async search(params: SearchParams) {
    await wait(300, 700);
    return this.page(
      RECORDS.filter((r) => this.matches(r, params)),
      params.page,
      params.limit,
    );
  }

  async getNewArrivals(params: { page: number; limit: number }) {
    await wait();
    const sorted = [...RECORDS]
      .sort((a, b) => a.acquiredDaysAgo - b.acquiredDaysAgo)
      .filter((r) => r.acquiredDaysAgo <= 60);
    return this.page(sorted, params.page, params.limit);
  }

  async getItemTypes(): Promise<ItemType[]> {
    await wait();
    return ITEM_TYPES.map((t) => ({
      ...t,
      recordCount: RECORDS.filter((r) => r.type === t.code).length,
    }));
  }

  async getRecord(recordId: string): Promise<RecordDetail> {
    await wait();
    const record = recordById(recordId);
    return {
      ...toSummary(record),
      title: record.title,
      subtitle: record.subtitle ?? null,
      authors: record.authors,
      publisher: record.publisher,
      publicationPlace: record.place,
      edition: record.edition ?? null,
      pages: record.pages ?? null,
      isbn: record.isbn ? [record.isbn] : [],
      issn: record.issn ? [record.issn] : [],
      language: record.language,
      subjects: record.subjects,
      series: record.series ?? null,
      summary: record.summary ?? null,
      notes: [],
      holdable: isHoldable(record),
    };
  }

  async getRecordItems(recordId: string): Promise<CatalogItem[]> {
    await wait();
    const record = recordById(recordId);
    return record.items.map((item) => ({
      id: item.id,
      barcode: `0002${item.id.length.toString().padStart(4, '0')}`,
      library: libraryRef(item.libraryId),
      location: item.location,
      callNumber: record.callNumber,
      status: item.status,
      dueDate: item.dueInDays === undefined ? null : toIsoDate(daysFromToday(item.dueInDays)),
      holdable: isHoldable(record) && item.status !== 'NOT_FOR_LOAN',
    }));
  }

  // ── Kütüphane, duyuru, bildirim ───────────────────────────────────────────
  async getLibraries() {
    await wait();
    return LIBRARIES;
  }

  async getAnnouncements() {
    await wait();
    return ANNOUNCEMENTS();
  }

  async getNotifications() {
    await wait();
    return this.notifications.map((n) => ({ ...n }));
  }

  async markNotificationRead(id: string) {
    await wait(100, 250);
    this.notifications = this.notifications.map((n) =>
      n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
    );
  }

  async markAllNotificationsRead() {
    await wait(100, 250);
    const now = new Date().toISOString();
    this.notifications = this.notifications.map((n) => (n.readAt ? n : { ...n, readAt: now }));
  }

  async getNotificationPreferences() {
    await wait();
    return { ...this.prefs };
  }

  async updateNotificationPreferences(prefs: NotificationPreferences) {
    await wait();
    this.prefs = { ...prefs };
    return { ...this.prefs };
  }
}
