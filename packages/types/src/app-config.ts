import { z } from 'zod';

/** `GET /mobile/v1/app/config` — global uygulama yapılandırması. */
export const AppConfigSchema = z.object({
  minAppVersion: z.string(),
  maintenance: z.object({
    active: z.boolean(),
    message: z.object({ tr: z.string(), en: z.string() }).optional(),
  }),
  links: z.object({
    privacyPolicy: z.url(),
    kvkkNotice: z.url(),
    support: z.url(),
  }),
  gateway: z.object({
    version: z.string(),
    deploymentMode: z.enum(['CENTRAL', 'ON_PREMISE']),
  }),
});
export type AppConfig = z.infer<typeof AppConfigSchema>;
