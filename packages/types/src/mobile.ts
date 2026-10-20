import { z } from 'zod';

import { ErrorCodeSchema } from './errors.js';
import { NotificationTypeSchema } from './notifications.js';

/**
 * Mobil API (`/mobile/v1`) veri modelleri — docs/API.md §2.
 * Koha'ya özgü alan adı (borrowernumber, biblio_id …) veya ham Koha değeri içermez;
 * kimlikler opaktır (`lo_`, `ho_`, `rc_`, `it_`, `lb_`, `nt_`).
 */

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const IsoDateTime = z.string();

export const MoneySchema = z.object({ amount: z.string(), currency: z.string().length(3) });
export type Money = z.infer<typeof MoneySchema>;

export const LibraryRefSchema = z.object({ id: z.string(), name: z.string() });
export type LibraryRef = z.infer<typeof LibraryRefSchema>;

export const RecordRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string().nullable(),
  coverUrl: z.string().nullable(),
});
export type RecordRef = z.infer<typeof RecordRefSchema>;

// ── Oturum ──────────────────────────────────────────────────────────────────
export const LoginRequestSchema = z.object({
  tenantCode: z.string(),
  providerId: z.string(),
  identifier: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: IsoDateTime,
  refreshToken: z.string(),
  refreshTokenExpiresAt: IsoDateTime,
  user: z.object({ id: z.string(), displayName: z.string() }),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ── Profil ve özet ──────────────────────────────────────────────────────────
export const ProfileSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  cardNumber: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  category: z.object({ code: z.string(), name: z.string() }),
  faculty: z.string().nullable(),
  department: z.string().nullable(),
  homeLibrary: LibraryRefSchema,
  membershipStart: IsoDate,
  membershipEnd: IsoDate,
  restrictions: z.array(
    z.object({ type: z.string(), until: IsoDate.nullable(), message: z.string() }),
  ),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const HomeSummarySchema = z.object({
  loans: z.object({ total: z.number(), dueSoon: z.number(), overdue: z.number() }),
  holds: z.object({ total: z.number(), ready: z.number() }),
  fines: z.object({ balance: MoneySchema }),
  unreadNotifications: z.number(),
});
export type HomeSummary = z.infer<typeof HomeSummarySchema>;

// ── Ödünç ───────────────────────────────────────────────────────────────────
export const LoanStatusSchema = z.enum(['OK', 'DUE_SOON', 'OVERDUE']);
export type LoanStatus = z.infer<typeof LoanStatusSchema>;

export const LoanSchema = z.object({
  id: z.string(),
  record: RecordRefSchema,
  item: z.object({
    id: z.string(),
    barcode: z.string().nullable(),
    callNumber: z.string().nullable(),
  }),
  library: LibraryRefSchema,
  checkedOutAt: IsoDateTime,
  dueDate: IsoDate,
  daysRemaining: z.number(),
  status: LoanStatusSchema,
  renewals: z.object({ count: z.number(), max: z.number().nullable() }),
});
export type Loan = z.infer<typeof LoanSchema>;

export const RenewabilitySchema = z.object({
  renewable: z.boolean(),
  reason: ErrorCodeSchema.nullable(),
});
export type Renewability = z.infer<typeof RenewabilitySchema>;

// ── Rezervasyon ─────────────────────────────────────────────────────────────
export const HoldStatusSchema = z.enum([
  'WAITING',
  'SUSPENDED',
  'IN_TRANSIT',
  'IN_PROCESSING',
  'READY',
  'FULFILLED',
  'CANCELLED',
  'EXPIRED',
]);
export type HoldStatus = z.infer<typeof HoldStatusSchema>;

export const HoldSchema = z.object({
  id: z.string(),
  record: RecordRefSchema,
  pickupLibrary: LibraryRefSchema,
  status: HoldStatusSchema,
  queuePosition: z.number().nullable(),
  placedAt: IsoDateTime,
  pickupDeadline: IsoDate.nullable(),
  cancellable: z.boolean(),
});
export type Hold = z.infer<typeof HoldSchema>;

export const PlaceHoldRequestSchema = z.object({
  recordId: z.string(),
  pickupLibraryId: z.string(),
});
export type PlaceHoldRequest = z.infer<typeof PlaceHoldRequestSchema>;

// ── Borç ────────────────────────────────────────────────────────────────────
export const FineLineSchema = z.object({
  id: z.string(),
  date: IsoDate,
  kind: z.enum(['DEBIT', 'CREDIT']),
  type: z.string(),
  description: z.string(),
  amount: MoneySchema,
  remaining: MoneySchema.nullable(),
});
export type FineLine = z.infer<typeof FineLineSchema>;

export const FinesSchema = z.object({
  balance: MoneySchema,
  outstanding: z.array(FineLineSchema),
  transactions: z.array(FineLineSchema),
});
export type Fines = z.infer<typeof FinesSchema>;

// ── Katalog ─────────────────────────────────────────────────────────────────
export const SEARCH_FIELDS = [
  'any',
  'title',
  'author',
  'subject',
  'isbn',
  'issn',
  'callNumber',
] as const;
export const SearchFieldSchema = z.enum(SEARCH_FIELDS);
export type SearchField = z.infer<typeof SearchFieldSchema>;

export const ItemTypeSchema = z.object({
  code: z.string(),
  name: z.string(),
  recordCount: z.number().nullable(),
});
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const RecordSummarySchema = RecordRefSchema.extend({
  publicationYear: z.string().nullable(),
  materialType: z.object({ code: z.string(), name: z.string() }).nullable(),
  callNumber: z.string().nullable(),
  availability: z.object({ available: z.number(), total: z.number() }),
});
export type RecordSummary = z.infer<typeof RecordSummarySchema>;

export const SearchResultSchema = z.object({
  items: z.array(RecordSummarySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const ItemStatusSchema = z.enum([
  'AVAILABLE',
  'CHECKED_OUT',
  'IN_TRANSIT',
  'ON_HOLD_SHELF',
  'NOT_FOR_LOAN',
  'LOST',
  'DAMAGED',
  'WITHDRAWN',
  'IN_PROCESSING',
  'UNKNOWN',
]);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const CatalogItemSchema = z.object({
  id: z.string(),
  barcode: z.string().nullable(),
  library: LibraryRefSchema,
  location: z.string().nullable(),
  callNumber: z.string().nullable(),
  status: ItemStatusSchema,
  dueDate: IsoDate.nullable(),
  holdable: z.boolean(),
});
export type CatalogItem = z.infer<typeof CatalogItemSchema>;

export const RecordDetailSchema = RecordSummarySchema.extend({
  subtitle: z.string().nullable(),
  authors: z.array(z.string()),
  publisher: z.string().nullable(),
  publicationPlace: z.string().nullable(),
  edition: z.string().nullable(),
  pages: z.string().nullable(),
  isbn: z.array(z.string()),
  issn: z.array(z.string()),
  language: z.string().nullable(),
  subjects: z.array(z.string()),
  series: z.string().nullable(),
  summary: z.string().nullable(),
  notes: z.array(z.string()),
  holdable: z.boolean(),
});
export type RecordDetail = z.infer<typeof RecordDetailSchema>;

// ── Kütüphane, duyuru, bildirim ─────────────────────────────────────────────
export const OpeningHoursSchema = z.object({
  weekday: z.number().min(0).max(6),
  opensAt: z.string().nullable(),
  closesAt: z.string().nullable(),
  closed: z.boolean(),
});

export const LibrarySchema = LibraryRefSchema.extend({
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  location: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  hours: z.array(OpeningHoursSchema),
  pickupLocation: z.boolean(),
});
export type Library = z.infer<typeof LibrarySchema>;

export const AnnouncementSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  publishedAt: IsoDateTime,
  global: z.boolean(),
});
export type Announcement = z.infer<typeof AnnouncementSchema>;

export const AppNotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  target: z
    .object({
      screen: z.enum(['loan', 'hold', 'record', 'announcement', 'fines']),
      id: z.string().nullable(),
    })
    .nullable(),
  createdAt: IsoDateTime,
  readAt: IsoDateTime.nullable(),
});
export type AppNotification = z.infer<typeof AppNotificationSchema>;

export const NotificationPreferencesSchema = z.object({
  dueReminders: z.boolean(),
  dueReminderDays: z.array(z.number().int().min(0).max(14)),
  overdue: z.boolean(),
  holds: z.boolean(),
  announcements: z.boolean(),
  membership: z.boolean(),
});
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
