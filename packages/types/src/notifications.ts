import { z } from 'zod';

export const NOTIFICATION_TYPES = [
  'DUE_SOON',
  'DUE_TODAY',
  'OVERDUE',
  'HOLD_READY',
  'HOLD_EXPIRING',
  'MEMBERSHIP_EXPIRING',
  'LIBRARY_ANNOUNCEMENT',
  'SYSTEM',
] as const;

export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

/**
 * Push `data` sözleşmesi (docs/NOTIFICATIONS.md §5.3). Yalnızca opak kimlikler taşır;
 * kitap adı, kullanıcı adı, tutar, Koha ID'si gibi kişisel/iç veriler EKLENMEZ.
 * `strict()` sayesinde bilinmeyen alanlar şema seviyesinde reddedilir.
 */
export const MirakilPushDataV1Schema = z
  .object({
    v: z.literal(1),
    nid: z.string().regex(/^nt_[A-Za-z0-9]+$/),
    t: NotificationTypeSchema,
    tc: z.string().optional(),
    dl: z.string().regex(/^mirakil:\/\/notifications\/nt_[A-Za-z0-9]+$/),
  })
  .strict();
export type MirakilPushDataV1 = z.infer<typeof MirakilPushDataV1Schema>;
