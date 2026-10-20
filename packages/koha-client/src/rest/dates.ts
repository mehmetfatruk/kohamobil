/** Kurum saat dilimine göre tarih hesapları (iade günü, kalan gün). */

export function localDate(value: string | Date, timeZone: string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  // en-CA biçimi YYYY-MM-DD verir
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Sadece-tarih (YYYY-MM-DD) veya tarih-saat girdisini kurum gününe çevirir. */
export function toLocalDay(value: string, timeZone: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : localDate(value, timeZone);
}

const toUtcDay = (day: string) => {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return Date.UTC(year, month - 1, date);
};

export function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((toUtcDay(toDay) - toUtcDay(fromDay)) / 86_400_000);
}
