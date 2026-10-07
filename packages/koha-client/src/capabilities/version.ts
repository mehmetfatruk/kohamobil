/**
 * Koha sürüm bilgisi — YALNIZCA bilgi/raporlama amaçlıdır; uyumluluk kararlarında kullanılmaz.
 *
 * Kabul edilen biçimler:
 * - `24.05.02.000` (Koha::version)
 * - `Koha 24.0502000` (OPAC `<meta name="generator">`)
 */
export interface KohaVersion {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

export function parseKohaVersion(input: string): KohaVersion | null {
  const raw = input.trim();
  const dotted = /(\d{2})\.(\d{2})\.(\d{2})(?:\.\d+)?/.exec(raw);
  if (dotted) return build(dotted, raw);
  const compact = /(\d{2})\.(\d{2})(\d{2})\d*/.exec(raw);
  if (compact) return build(compact, raw);
  return null;
}

function build(match: RegExpExecArray, raw: string): KohaVersion {
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), raw };
}

/** OPAC HTML'inden `<meta name="generator" content="Koha ...">` değerini okur. */
export function extractGeneratorVersion(html: string): KohaVersion | null {
  const meta = /<meta[^>]+name=["']generator["'][^>]*>/i.exec(html)?.[0];
  const content = meta && /content=["']([^"']+)["']/i.exec(meta)?.[1];
  return content && /koha/i.test(content) ? parseKohaVersion(content) : null;
}

export function formatKohaVersion(v: KohaVersion): string {
  return `${v.major}.${String(v.minor).padStart(2, '0')}.${String(v.patch).padStart(2, '0')}`;
}
