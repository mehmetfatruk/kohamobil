import type { Money } from '@mirakil/types';
import i18n from 'i18next';

const locale = () => (i18n.language === 'en' ? 'en-GB' : 'tr-TR');

/** `YYYY-MM-DD` veya ISO tarih-saat → "10 Ekim 2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return date.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

export function formatMoney(money: Money): string {
  try {
    return new Intl.NumberFormat(locale(), { style: 'currency', currency: money.currency }).format(
      Number(money.amount),
    );
  } catch {
    return `${money.amount} ${money.currency}`;
  }
}

export const isZero = (money: Money) => Number(money.amount) === 0;
