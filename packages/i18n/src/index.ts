import type { ErrorCode } from '@mirakil/types';

import { en } from './locales/en.js';
import { tr, type Messages } from './locales/tr.js';

export const SUPPORTED_LOCALES = ['tr', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'tr';

export const resources: Record<Locale, Messages> = { tr, en };
export type { Messages };

/** `Accept-Language` veya cihaz dilinden desteklenen dili seçer; bilinmeyen dil → Türkçe. */
export function resolveLocale(input: string | null | undefined): Locale {
  const candidates = (input ?? '')
    .split(',')
    .map((part) => part.split(';')[0]?.trim().slice(0, 2).toLowerCase());
  return (
    candidates.find((c): c is Locale => SUPPORTED_LOCALES.includes(c as Locale)) ?? DEFAULT_LOCALE
  );
}

/** `{{name}}` yer tutucularını doldurur. */
export function interpolate(template: string, params: Record<string, string> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => params[key] ?? match);
}

export function errorMessage(
  code: ErrorCode,
  locale: Locale,
  params?: Record<string, string>,
): string {
  return interpolate(resources[locale].errors[code], params);
}

export type PushTemplateKey = keyof Messages['push'];
