import type {
  CatalogItem,
  ErrorCode,
  Fines,
  Hold,
  ItemType,
  Library,
  Loan,
  PlaceHoldRequest,
  Profile,
  RecordDetail,
  Renewability,
  SearchField,
  SearchResult,
} from '@mirakil/types';

import type { PatronContext, PatronIdentity } from '../adapter.js';
import type { OperationId } from '../compat/operations.js';
import type { CompatibilityProfile } from '../compat/resolver.js';
import {
  type KohaHttpClient,
  KohaHttpError,
  KohaNetworkError,
  type KohaRequest,
} from '../http/koha-http.js';
import { daysBetween, localDate, toLocalDay } from './dates.js';
import { mapHoldError, mapRenewalError, mapRenewalMessage } from './errors.js';
import { fromNumericId, InvalidIdError, toId } from './ids.js';
import type {
  KohaAccount,
  KohaAccountLine,
  KohaBiblio,
  KohaCheckout,
  KohaHold,
  KohaItem,
  KohaItemType,
  KohaLibrary,
  KohaPasswordValidation,
  KohaPatron,
  KohaRenewability,
} from './koha-types.js';
import {
  libraryRef,
  toCatalogItem,
  toFineLine,
  toHold,
  toLibrary,
  toRecordDetail,
  toRecordRef,
  toRecordSummary,
} from './normalize.js';

/** Kullanıcıya gösterilebilir hata kodu taşıyan Koha işlem hatası (ham Koha yanıtı `cause`'da). */
export class KohaOperationError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    options?: { cause?: unknown },
  ) {
    super(code, options);
    this.name = 'KohaOperationError';
  }
}

export interface KohaRestAdapterOptions {
  timeZone: string;
  currency: string;
  dueSoonDays?: number;
  /** Fakülte/bölüm gibi alanların Koha extended attribute kodları */
  profileAttributes?: { faculty?: string; department?: string };
  now?: () => Date;
}

const TTL = { libraries: 3_600_000, itemTypes: 3_600_000, biblio: 600_000 };

/**
 * Koha core REST API adaptörü. Her işlem, tenant'ın uyumluluk profilinin seçtiği stratejiyle
 * çalışır; profilde stratejisi olmayan işlem `FEATURE_DISABLED` döndürür.
 * Patron'a ait her işlem `PatronContext` ister ve kaynağın o patrona ait olduğunu doğrular.
 */
export class KohaRestAdapter {
  private librariesCache: { at: number; value: Map<string, KohaLibrary> } | null = null;
  private itemTypesCache: { at: number; value: Map<string, string> } | null = null;
  private biblioCache = new Map<string, { at: number; value: KohaBiblio | null }>();

  constructor(
    private readonly http: KohaHttpClient,
    private readonly profile: CompatibilityProfile,
    private readonly options: KohaRestAdapterOptions,
  ) {}

  // ── yardımcılar ────────────────────────────────────────────────────────────
  private now() {
    return this.options.now?.() ?? new Date();
  }

  private day = (value: string) => toLocalDay(value, this.options.timeZone);

  private strategy(operation: OperationId): string {
    const strategy = this.profile[operation];
    if (!strategy) throw new KohaOperationError('FEATURE_DISABLED', 403);
    return strategy;
  }

  /**
   * @param passthrough İşlemin kendisinin eşleyeceği HTTP durumları (ör. rezervasyon reddi 403).
   *   Bunlar dışındaki 401/403/5xx servis/altyapı sorunu sayılır.
   */
  private async call<T>(path: string, init: KohaRequest = {}, passthrough: number[] = []) {
    try {
      return await this.http.request<T>(path, init);
    } catch (error) {
      if (error instanceof KohaHttpError && passthrough.includes(error.status)) throw error;
      if (error instanceof KohaNetworkError) {
        throw new KohaOperationError(
          error.timeout ? 'KOHA_TIMEOUT' : 'KOHA_UNAVAILABLE',
          error.timeout ? 504 : 503,
          { cause: error },
        );
      }
      if (error instanceof KohaHttpError) {
        if (error.status === 404)
          throw new KohaOperationError('RESOURCE_NOT_FOUND', 404, { cause: error });
        if (error.status === 401 || error.status === 403 || error.status >= 500) {
          // Servis hesabı yetkisi / Koha arızası: kullanıcıya genel mesaj, ayrıntı logda
          throw new KohaOperationError('KOHA_UNAVAILABLE', 503, { cause: error });
        }
      }
      throw error;
    }
  }

  private async libraries(): Promise<Map<string, KohaLibrary>> {
    if (this.librariesCache && Date.now() - this.librariesCache.at < TTL.libraries)
      return this.librariesCache.value;
    const { data } = await this.call<KohaLibrary[]>('/libraries', { query: { _per_page: 200 } });
    const value = new Map(data.map((l) => [l.library_id, l]));
    this.librariesCache = { at: Date.now(), value };
    return value;
  }

  private async itemTypeNames(): Promise<Map<string, string>> {
    if (!this.profile['catalog.itemTypes']) return new Map();
    if (this.itemTypesCache && Date.now() - this.itemTypesCache.at < TTL.itemTypes)
      return this.itemTypesCache.value;
    try {
      const { data } = await this.call<KohaItemType[]>('/item_types', {
        query: { _per_page: 200 },
      });
      const value = new Map(data.map((t) => [t.item_type_id, t.description ?? t.item_type_id]));
      this.itemTypesCache = { at: Date.now(), value };
      return value;
    } catch {
      return new Map();
    }
  }

  private async biblio(id: number | string): Promise<KohaBiblio | null> {
    const key = String(id);
    const cached = this.biblioCache.get(key);
    if (cached && Date.now() - cached.at < TTL.biblio) return cached.value;
    let value: KohaBiblio | null = null;
    try {
      value = (await this.call<KohaBiblio>(`/biblios/${key}`, { accept: 'application/json' })).data;
    } catch (error) {
      if (!(error instanceof KohaOperationError && error.code === 'RESOURCE_NOT_FOUND'))
        throw error;
    }
    this.biblioCache.set(key, { at: Date.now(), value });
    return value;
  }

  private async item(id: number): Promise<KohaItem | null> {
    try {
      return (await this.call<KohaItem>(`/items/${id}`)).data;
    } catch (error) {
      if (error instanceof KohaOperationError && error.code === 'RESOURCE_NOT_FOUND') return null;
      throw error;
    }
  }

  // ── kimlik doğrulama ───────────────────────────────────────────────────────
  async validateCredentials(identifier: string, password: string): Promise<PatronIdentity | null> {
    const strategy = this.strategy('patron.validateCredentials');
    const attempt = async (body: Record<string, string>) => {
      try {
        const { data } = await this.http.request<KohaPasswordValidation>(
          '/auth/password/validation',
          { method: 'POST', body },
        );
        return {
          kohaPatronId: String(data.patron_id),
          cardnumber: data.cardnumber ?? null,
          userid: data.userid ?? null,
        };
      } catch (error) {
        // Koha hatalı kimlik bilgisinde 400 ("Validation failed") döner. Kullanıcı yok / şifre yanlış ayrımı yapılmaz.
        if (error instanceof KohaHttpError && (error.status === 400 || error.status === 404))
          return null;
        if (error instanceof KohaHttpError || error instanceof KohaNetworkError) {
          throw new KohaOperationError(
            error instanceof KohaNetworkError && error.timeout
              ? 'KOHA_TIMEOUT'
              : 'KOHA_UNAVAILABLE',
            503,
            { cause: error },
          );
        }
        throw error;
      }
    };
    if (strategy === 'rest.passwordValidation.identifier') return attempt({ identifier, password });
    if (strategy === 'rest.passwordValidation.userid') {
      return (
        (await attempt({ userid: identifier, password })) ??
        attempt({ cardnumber: identifier, password })
      );
    }
    throw new KohaOperationError('FEATURE_DISABLED', 403);
  }

  // ── profil ─────────────────────────────────────────────────────────────────
  async getPatron(ctx: PatronContext): Promise<KohaPatron> {
    this.strategy('patron.get');
    const embed = this.options.profileAttributes ? ['extended_attributes'] : undefined;
    return (
      await this.call<KohaPatron>(`/patrons/${ctx.kohaPatronId}`, {
        embed,
        correlationId: ctx.correlationId,
      })
    ).data;
  }

  async getProfile(ctx: PatronContext): Promise<Profile> {
    const [patron, libraries] = await Promise.all([this.getPatron(ctx), this.libraries()]);
    const attribute = (code?: string) =>
      code
        ? (patron.extended_attributes?.find((a) => (a.type ?? a.code) === code)?.value ?? null)
        : null;
    const today = localDate(this.now(), this.options.timeZone);
    const expired = patron.expiry_date ? patron.expiry_date < today : false;
    return {
      // Platform kullanıcı kimliğini Gateway yerleştirir; Koha patron_id'si istemciye verilmez
      id: 'me',
      firstName: patron.firstname ?? '',
      lastName: patron.surname ?? '',
      cardNumber: patron.cardnumber ?? '',
      email: patron.email ?? null,
      phone: patron.mobile ?? patron.phone ?? null,
      category: { code: patron.category_id ?? '', name: patron.category_id ?? '' },
      faculty: attribute(this.options.profileAttributes?.faculty),
      department: attribute(this.options.profileAttributes?.department),
      homeLibrary: libraryRef(patron.library_id, libraries),
      membershipStart: patron.date_enrolled ?? today,
      membershipEnd: patron.expiry_date ?? today,
      restrictions: [
        ...(patron.restricted ? [{ type: 'DEBARRED', until: null, message: 'RESTRICTED' }] : []),
        ...(expired ? [{ type: 'EXPIRED', until: null, message: 'EXPIRED' }] : []),
      ],
    };
  }

  // ── ödünç ──────────────────────────────────────────────────────────────────
  private async toLoan(c: KohaCheckout, libraries: Map<string, KohaLibrary>): Promise<Loan> {
    const item = c.item ?? (c.item_id ? await this.item(c.item_id) : null);
    const biblio = item?.biblio_id ? await this.biblio(item.biblio_id) : null;
    const dueDate = this.day(c.due_date);
    const daysRemaining = daysBetween(localDate(this.now(), this.options.timeZone), dueDate);
    return {
      id: toId('lo', c.checkout_id),
      record: toRecordRef(biblio, item?.biblio_id ?? 0),
      item: {
        id: toId('it', c.item_id ?? 0),
        barcode: item?.external_id ?? null,
        callNumber: item?.callnumber ?? null,
      },
      library: libraryRef(c.library_id ?? item?.holding_library_id, libraries),
      checkedOutAt: c.checkout_date ?? c.due_date,
      dueDate,
      daysRemaining,
      status:
        daysRemaining < 0
          ? 'OVERDUE'
          : daysRemaining <= (this.options.dueSoonDays ?? 3)
            ? 'DUE_SOON'
            : 'OK',
      renewals: { count: c.renewals_count ?? c.renewals ?? 0, max: null },
    };
  }

  async getLoans(ctx: PatronContext): Promise<Loan[]> {
    this.strategy('loans.list');
    const [{ data }, libraries] = await Promise.all([
      this.call<KohaCheckout[]>('/checkouts', {
        query: { patron_id: ctx.kohaPatronId, _per_page: 200 },
        correlationId: ctx.correlationId,
      }),
      this.libraries(),
    ]);
    const loans = await Promise.all(data.map((c) => this.toLoan(c, libraries)));
    return loans.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  /** Kaynak sahipliği: ödünç bu patrona ait değilse varlığı sızdırmadan 404. */
  private async ownCheckout(ctx: PatronContext, loanId: string): Promise<KohaCheckout> {
    const id = this.parse('lo', loanId);
    const { data } = await this.call<KohaCheckout>(`/checkouts/${id}`, {
      correlationId: ctx.correlationId,
    });
    if (String(data.patron_id) !== ctx.kohaPatronId)
      throw new KohaOperationError('RESOURCE_NOT_FOUND', 404);
    return data;
  }

  async checkRenewability(ctx: PatronContext, loanId: string): Promise<Renewability> {
    this.strategy('loans.renewability');
    const checkout = await this.ownCheckout(ctx, loanId);
    const { data } = await this.call<KohaRenewability>(
      `/checkouts/${checkout.checkout_id}/allows_renewal`,
      {
        correlationId: ctx.correlationId,
      },
    );
    return data.allows_renewal
      ? { renewable: true, reason: null }
      : { renewable: false, reason: mapRenewalError(data.error) };
  }

  async renewLoan(ctx: PatronContext, loanId: string): Promise<Loan> {
    const strategy = this.strategy('loans.renew');
    const check = await this.checkRenewability(ctx, loanId);
    if (!check.renewable)
      throw new KohaOperationError(check.reason ?? 'LOAN_RENEWAL_NOT_ALLOWED', 409);
    const id = this.parse('lo', loanId);
    const path =
      strategy === 'rest.checkouts.renewals'
        ? `/checkouts/${id}/renewals`
        : `/checkouts/${id}/renewal`;
    try {
      await this.call(path, { method: 'POST', correlationId: ctx.correlationId }, [400, 403, 409]);
    } catch (error) {
      if (error instanceof KohaHttpError && error.status < 500) {
        throw new KohaOperationError(mapRenewalMessage(error.kohaMessage), 409, { cause: error });
      }
      throw error;
    }
    const updated = (
      await this.call<KohaCheckout>(`/checkouts/${id}`, { correlationId: ctx.correlationId })
    ).data;
    return this.toLoan(updated, await this.libraries());
  }

  // ── rezervasyon ────────────────────────────────────────────────────────────
  async getHolds(ctx: PatronContext): Promise<Hold[]> {
    this.strategy('holds.list');
    const [{ data }, libraries] = await Promise.all([
      this.call<KohaHold[]>('/holds', {
        query: { patron_id: ctx.kohaPatronId, _per_page: 200 },
        correlationId: ctx.correlationId,
      }),
      this.libraries(),
    ]);
    return Promise.all(
      data.map(async (h) =>
        toHold(h, h.biblio ?? (await this.biblio(h.biblio_id)), libraries, this.day),
      ),
    );
  }

  async getPickupLibraries(ctx: PatronContext, recordId: string): Promise<Library[]> {
    const strategy = this.strategy('holds.pickupLocations');
    const biblioId = this.parse('rc', recordId);
    if (strategy === 'rest.biblios.pickupLocations') {
      const { data } = await this.call<KohaLibrary[]>(`/biblios/${biblioId}/pickup_locations`, {
        query: { patron_id: ctx.kohaPatronId, _per_page: 200 },
        correlationId: ctx.correlationId,
      });
      return data.map(toLibrary);
    }
    return [...(await this.libraries()).values()]
      .filter((l) => l.pickup_location !== false)
      .map(toLibrary);
  }

  async placeHold(ctx: PatronContext, request: PlaceHoldRequest): Promise<Hold> {
    this.strategy('holds.create');
    const biblioId = Number(this.parse('rc', request.recordId));
    const pickup = this.parse('lb', request.pickupLibraryId, /^[A-Za-z0-9_-]+$/);
    try {
      const { data } = await this.call<KohaHold>(
        '/holds',
        {
          method: 'POST',
          body: {
            patron_id: Number(ctx.kohaPatronId),
            biblio_id: biblioId,
            pickup_library_id: pickup,
          },
          correlationId: ctx.correlationId,
        },
        [400, 403, 409],
      );
      return toHold(data, await this.biblio(biblioId), await this.libraries(), this.day);
    } catch (error) {
      if (error instanceof KohaHttpError && error.status < 500) {
        throw new KohaOperationError(mapHoldError(error.kohaMessage), 409, { cause: error });
      }
      throw error;
    }
  }

  async cancelHold(ctx: PatronContext, holdId: string): Promise<void> {
    this.strategy('holds.cancel');
    const id = this.parse('ho', holdId);
    const holds = await this.getHolds(ctx);
    const hold = holds.find((h) => h.id === toId('ho', id));
    if (!hold) throw new KohaOperationError('RESOURCE_NOT_FOUND', 404);
    if (!hold.cancellable) throw new KohaOperationError('HOLD_CANCEL_NOT_ALLOWED', 409);
    await this.call(`/holds/${id}`, { method: 'DELETE', correlationId: ctx.correlationId });
  }

  // ── borç ───────────────────────────────────────────────────────────────────
  async getFines(ctx: PatronContext): Promise<Fines> {
    this.strategy('account.summary');
    const { currency } = this.options;
    const { data } = await this.call<KohaAccount>(`/patrons/${ctx.kohaPatronId}/account`, {
      correlationId: ctx.correlationId,
    });
    const outstanding = (data.outstanding_debits?.lines ?? []).map((l) =>
      toFineLine(l, currency, this.day),
    );
    let transactions = outstanding;
    if (this.profile['account.transactions'] === 'rest.patrons.account.debits') {
      try {
        const debits = await this.call<KohaAccountLine[]>(
          `/patrons/${ctx.kohaPatronId}/account/debits`,
          {
            query: { _per_page: 100 },
            correlationId: ctx.correlationId,
          },
        );
        transactions = debits.data.map((l) => toFineLine(l, currency, this.day));
      } catch {
        // Hareket listesi isteğe bağlı; özet yine gösterilir
      }
    }
    return {
      balance: { amount: Math.max(Number(data.balance ?? 0), 0).toFixed(2), currency },
      outstanding,
      transactions: transactions.sort((a, b) => b.date.localeCompare(a.date)),
    };
  }

  // ── katalog ────────────────────────────────────────────────────────────────
  async getLibraries(): Promise<Library[]> {
    this.strategy('libraries.list');
    return [...(await this.libraries()).values()].map(toLibrary);
  }

  async getItemTypes(): Promise<ItemType[]> {
    this.strategy('catalog.itemTypes');
    const names = await this.itemTypeNames();
    return [...names.entries()].map(([code, name]) => ({ code, name, recordCount: null }));
  }

  async getRecordItems(recordId: string): Promise<CatalogItem[]> {
    this.strategy('catalog.items');
    const biblioId = this.parse('rc', recordId);
    const [{ data }, libraries] = await Promise.all([
      this.call<KohaItem[]>(`/biblios/${biblioId}/items`, { query: { _per_page: 200 } }),
      this.libraries(),
    ]);
    return data.map((item) => toCatalogItem(item, libraries, this.day));
  }

  async getRecord(recordId: string): Promise<RecordDetail> {
    this.strategy('catalog.record');
    const biblioId = this.parse('rc', recordId);
    const biblio = await this.biblio(biblioId);
    if (!biblio) throw new KohaOperationError('RESOURCE_NOT_FOUND', 404);
    const [items, typeNames] = await Promise.all([
      this.profile['catalog.items'] ? this.getRecordItems(recordId) : Promise.resolve([]),
      this.itemTypeNames(),
    ]);
    return toRecordDetail(biblio, typeNames, items);
  }

  async search(params: {
    q: string;
    field: SearchField;
    itemType?: string;
    page: number;
    limit: number;
  }): Promise<SearchResult> {
    const strategy = this.strategy('catalog.search');
    if (strategy !== 'rest.biblios.query') throw new KohaOperationError('FEATURE_DISABLED', 403);
    const term = params.q.trim().replace(/[%_]/g, '');
    const like = { '-like': `%${term}%` };
    const byField: Record<SearchField, unknown> = {
      any: { '-or': [{ title: like }, { author: like }, { subtitle: like }] },
      title: { '-or': [{ title: like }, { subtitle: like }] },
      author: { author: like },
      subject: { title: like },
      isbn: { isbn: { '-like': `%${term.replace(/-/g, '')}%` } },
      issn: { issn: like },
      callNumber: { title: like },
    };
    const filters: unknown[] = [];
    if (term) filters.push(byField[params.field]);
    if (params.itemType) filters.push({ item_type: params.itemType });
    if (!filters.length) return { items: [], total: 0, page: params.page, limit: params.limit };
    const q = JSON.stringify(filters.length === 1 ? filters[0] : { '-and': filters });
    const [{ data, total }, typeNames] = await Promise.all([
      this.call<KohaBiblio[]>('/biblios', {
        query: { q, _page: params.page, _per_page: params.limit, _order_by: '+title' },
        accept: 'application/json',
      }),
      this.itemTypeNames(),
    ]);
    return {
      items: data.map((b) => toRecordSummary(b, typeNames)),
      total: total ?? data.length,
      page: params.page,
      limit: params.limit,
    };
  }

  async getNewArrivals(params: { page: number; limit: number }): Promise<SearchResult> {
    const strategy = this.strategy('catalog.newArrivals');
    if (strategy !== 'rest.items.recentAcquisitions')
      throw new KohaOperationError('FEATURE_DISABLED', 403);
    const { data } = await this.call<KohaItem[]>('/items', {
      query: { _order_by: '-acquisition_date', _per_page: params.limit * 4, _page: 1 },
    });
    const biblioIds = [
      ...new Set(data.map((i) => i.biblio_id).filter((id): id is number => typeof id === 'number')),
    ];
    const start = (params.page - 1) * params.limit;
    const pageIds = biblioIds.slice(start, start + params.limit);
    const [biblios, typeNames] = await Promise.all([
      Promise.all(pageIds.map((id) => this.biblio(id))),
      this.itemTypeNames(),
    ]);
    return {
      items: biblios
        .filter((b): b is KohaBiblio => b !== null)
        .map((b) => toRecordSummary(b, typeNames)),
      total: biblioIds.length,
      page: params.page,
      limit: params.limit,
    };
  }

  private parse(kind: 'lo' | 'ho' | 'rc', id: string): string;
  private parse(kind: 'lb', id: string, pattern: RegExp): string;
  private parse(kind: 'lo' | 'ho' | 'rc' | 'lb', id: string, pattern?: RegExp): string {
    try {
      if (kind === 'lb') {
        const raw = id.startsWith('lb_') ? id.slice(3) : '';
        if (!pattern?.test(raw)) throw new InvalidIdError('lb');
        return raw;
      }
      return fromNumericId(kind, id);
    } catch {
      throw new KohaOperationError('RESOURCE_NOT_FOUND', 404);
    }
  }
}
