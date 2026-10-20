import type {
  CatalogItem,
  FineLine,
  Hold,
  HoldStatus,
  ItemStatus,
  Library,
  RecordDetail,
  RecordSummary,
} from '@mirakil/types';

import { toId } from './ids.js';
import type { KohaAccountLine, KohaBiblio, KohaHold, KohaItem, KohaLibrary } from './koha-types.js';

const clean = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value)
    .replace(/\s*[/:;,.]\s*$/, '')
    .trim();
  return text || null;
};

const year = (b: KohaBiblio) => {
  const raw = clean(b.publication_year) ?? clean(b.copyright_date);
  return raw?.match(/\d{4}/)?.[0] ?? raw;
};

export function libraryRef(id: string | null | undefined, libraries: Map<string, KohaLibrary>) {
  const library = id ? libraries.get(id) : undefined;
  return { id: toId('lb', id ?? 'unknown'), name: library?.name ?? id ?? '—' };
}

export function toLibrary(l: KohaLibrary): Library {
  const address = [
    l.address1,
    l.address2,
    l.address3,
    [l.postal_code, l.city].filter(Boolean).join(' '),
  ]
    .map(clean)
    .filter(Boolean)
    .join(', ');
  return {
    id: toId('lb', l.library_id),
    name: l.name ?? l.library_id,
    address: address || null,
    phone: clean(l.phone),
    email: clean(l.email),
    website: clean(l.url),
    location: null,
    // Çalışma saatleri Koha'dan değil, Gateway'in kendi verisinden gelir (docs/ARCHITECTURE.md §2.1)
    hours: [],
    pickupLocation: l.pickup_location !== false,
  };
}

export function toRecordRef(b: KohaBiblio | null | undefined, biblioId: number | string) {
  return {
    id: toId('rc', biblioId),
    title: clean(b?.title) ?? '—',
    author: clean(b?.author),
    coverUrl: null,
  };
}

export function toRecordSummary(
  b: KohaBiblio,
  itemTypeNames: Map<string, string>,
  callNumber: string | null = null,
): RecordSummary {
  const type = clean(b.item_type);
  return {
    ...toRecordRef(b, b.biblio_id),
    title: [clean(b.title), clean(b.subtitle)].filter(Boolean).join(': ') || '—',
    publicationYear: year(b),
    materialType: type ? { code: type, name: itemTypeNames.get(type) ?? type } : null,
    callNumber,
    availability: { available: 0, total: 0 },
  };
}

export function toRecordDetail(
  b: KohaBiblio,
  itemTypeNames: Map<string, string>,
  items: CatalogItem[],
): RecordDetail {
  const summary = toRecordSummary(
    b,
    itemTypeNames,
    items.find((i) => i.callNumber)?.callNumber ?? null,
  );
  return {
    ...summary,
    title: clean(b.title) ?? '—',
    subtitle: clean(b.subtitle),
    authors: clean(b.author) ? [clean(b.author)!] : [],
    publisher: clean(b.publisher),
    publicationPlace: clean(b.publication_place) ?? clean(b.place),
    edition: clean(b.edition_statement),
    pages: clean(b.pages),
    isbn: (b.isbn ?? '')
      .split(/[|\s]+/)
      .map(clean)
      .filter((x): x is string => Boolean(x)),
    issn: (b.issn ?? '')
      .split(/[|\s]+/)
      .map(clean)
      .filter((x): x is string => Boolean(x)),
    language: null,
    subjects: [],
    series: clean(b.series_title),
    summary: clean(b.abstract),
    notes: clean(b.notes) ? [clean(b.notes)!] : [],
    availability: {
      available: items.filter((i) => i.status === 'AVAILABLE').length,
      total: items.length,
    },
    holdable: items.some((i) => i.holdable),
  };
}

export function itemStatus(item: KohaItem): ItemStatus {
  if (item.withdrawn && item.withdrawn !== 0) return 'WITHDRAWN';
  if (item.lost_status && item.lost_status !== 0) return 'LOST';
  if (item.damaged_status && item.damaged_status !== 0) return 'DAMAGED';
  if (item.checked_out_date) return 'CHECKED_OUT';
  const notForLoan = item.effective_not_for_loan_status ?? item.not_for_loan_status ?? 0;
  if (notForLoan !== 0) return 'NOT_FOR_LOAN';
  return 'AVAILABLE';
}

export function toCatalogItem(
  item: KohaItem,
  libraries: Map<string, KohaLibrary>,
  timeZoneDay: (v: string) => string,
): CatalogItem {
  const status = itemStatus(item);
  return {
    id: toId('it', item.item_id),
    barcode: clean(item.external_id),
    library: libraryRef(item.holding_library_id ?? item.home_library_id, libraries),
    location: clean(item.location),
    callNumber: clean(item.callnumber),
    status,
    dueDate: item.checked_out_date ? timeZoneDay(item.checked_out_date) : null,
    holdable: !['NOT_FOR_LOAN', 'LOST', 'WITHDRAWN', 'DAMAGED'].includes(status),
  };
}

export function holdStatus(h: KohaHold): HoldStatus {
  switch (h.status) {
    case 'W':
      return 'READY';
    case 'T':
      return 'IN_TRANSIT';
    case 'P':
      return 'IN_PROCESSING';
    default:
      return h.suspended ? 'SUSPENDED' : 'WAITING';
  }
}

export function toHold(
  h: KohaHold,
  biblio: KohaBiblio | null,
  libraries: Map<string, KohaLibrary>,
  timeZoneDay: (v: string) => string,
): Hold {
  const status = holdStatus(h);
  return {
    id: toId('ho', h.hold_id),
    record: toRecordRef(biblio ?? h.biblio, h.biblio_id),
    pickupLibrary: libraryRef(h.pickup_library_id, libraries),
    status,
    queuePosition: status === 'WAITING' && h.priority ? h.priority : null,
    placedAt: h.hold_date ?? new Date().toISOString(),
    pickupDeadline: status === 'READY' && h.expiration_date ? timeZoneDay(h.expiration_date) : null,
    // OPAC kuralı: hazır veya transferdeki rezervasyon uygulamadan iptal edilmez (docs/KOHA_INTEGRATION.md §6)
    cancellable: status !== 'READY' && status !== 'IN_TRANSIT',
  };
}

const money = (value: number | string | null | undefined, currency: string) => ({
  amount: Math.abs(Number(value ?? 0)).toFixed(2),
  currency,
});

export function toFineLine(
  line: KohaAccountLine,
  currency: string,
  timeZoneDay: (v: string) => string,
): FineLine {
  const credit = Boolean(line.credit_type) || Number(line.amount ?? 0) < 0;
  return {
    id: toId('fn', line.account_line_id),
    date: line.date ? timeZoneDay(line.date) : timeZoneDay(new Date().toISOString()),
    kind: credit ? 'CREDIT' : 'DEBIT',
    type: line.debit_type ?? line.credit_type ?? 'OTHER',
    description: clean(line.description) ?? line.debit_type ?? line.credit_type ?? '—',
    amount: money(line.amount, currency),
    remaining: credit ? null : money(line.amount_outstanding, currency),
  };
}
