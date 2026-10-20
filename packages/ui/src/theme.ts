import { ensureContrast, mix, onColor, shade } from './color.js';

/**
 * MirAkıl kurumsal renkleri — mirakil web sitesi tasarım sistemiyle aynı (DESIGN.md v2):
 * logo mavisi tek baskın renk, panellerde maviden lacivere geçiş.
 */
export const MIRAKIL_BRAND = {
  primary: '#0055A4',
  secondary: '#0F4A74',
  bright: '#0A8FD6',
  /** grad-brand: linear-gradient(135deg, #0a63b8, #0055a4, #0f4a74) */
  gradient: ['#0A63B8', '#0055A4', '#0F4A74'],
} as const;

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  scheme: ColorScheme;
  /** Ekran zemini (kartların arkası) */
  background: string;
  /** Kart zemini */
  surface: string;
  /** Giriş alanı, çip, ikincil zemin */
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  /** Vurgu renginin yumuşak zemin tonu (ikon kutuları, seçili çipler) */
  primarySoft: string;
  secondary: string;
  onSecondary: string;
  /** Başlık geçişi (gradient): açık mavi → logo mavisi → lacivert */
  heroStart: string;
  heroMid: string;
  heroEnd: string;
  onHero: string;
  /** Ödünç durum renkleri (docs: yeşil / turuncu / kırmızı) ve yumuşak zeminleri */
  statusOk: string;
  statusWarning: string;
  statusDanger: string;
  statusOkSoft: string;
  statusWarningSoft: string;
  statusDangerSoft: string;
  shadow: string;
}

type Neutrals = Pick<
  ThemeColors,
  'background' | 'surface' | 'surfaceAlt' | 'text' | 'textMuted' | 'border' | 'shadow'
>;

const NEUTRALS: Record<ColorScheme, Neutrals> = {
  // Mavi tonlu nötrler (web: ink, ink-muted, surface-1/2, hairline)
  light: {
    background: '#F4F7FB',
    surface: '#FFFFFF',
    surfaceAlt: '#E8EEF6',
    text: '#122033',
    textMuted: '#4F5D6E',
    border: '#E1E8F0',
    shadow: '#0F4A74',
  },
  dark: {
    background: '#08121D',
    surface: '#0F1E2E',
    surfaceAlt: '#17293D',
    text: '#EAF1F8',
    textMuted: '#9FB1C4',
    border: '#21374F',
    shadow: '#000000',
  },
};

const STATUS: Record<
  ColorScheme,
  Pick<ThemeColors, 'statusOk' | 'statusWarning' | 'statusDanger'>
> = {
  // Web: success #24a148, warning #f1c21b, error #d42f2f — metin olarak okunur tonları
  light: { statusOk: '#1E8A3E', statusWarning: '#A36A00', statusDanger: '#D42F2F' },
  dark: { statusOk: '#4CC46E', statusWarning: '#F1C21B', statusDanger: '#F07070' },
};

/** Durum/vurgu renginin zemine karışmış yumuşak tonu. */
const soft = (color: string, neutrals: Neutrals, scheme: ColorScheme) =>
  mix(neutrals.surface, color, scheme === 'light' ? 0.12 : 0.2);

export function createTheme(
  scheme: ColorScheme,
  tenant: { primaryColor?: string; secondaryColor?: string } = {},
): ThemeColors {
  const neutrals = NEUTRALS[scheme];
  const brand = tenant.primaryColor ?? MIRAKIL_BRAND.primary;
  const isMirakil = brand.toUpperCase() === MIRAKIL_BRAND.primary;
  // Vurgu rengi hem ekran zemininde hem kart zemininde okunur olmalı.
  const readable = (color: string) =>
    ensureContrast(ensureContrast(color, neutrals.background, 3), neutrals.surface, 3);
  // Koyu temada logo mavisi zemine gömülür; sitedeki parlak mavi (brand-bright) kullanılır.
  const primary = readable(scheme === 'dark' && isMirakil ? MIRAKIL_BRAND.bright : brand);
  const secondary = readable(tenant.secondaryColor ?? MIRAKIL_BRAND.secondary);
  // Başlık geçişi: MirAkıl için sitedeki grad-brand; başka renkte aynı ilişki (açık → ana → koyu).
  // Üzerindeki metin üç durakta da okunur kalır.
  const dim = scheme === 'dark' ? 0.25 : 0;
  const [rawStart, rawMid, rawEnd] = isMirakil
    ? MIRAKIL_BRAND.gradient.map((c) => (dim ? shade(c, dim) : c))
    : [shade(brand, dim - 0.08), shade(brand, dim), shade(brand, dim + 0.35)];
  const onHero = onColor(rawMid!);
  const heroStart = ensureContrast(rawStart!, onHero, 3);
  const heroMid = ensureContrast(rawMid!, onHero, 3);
  const heroEnd = ensureContrast(rawEnd!, onHero, 3);
  const status = STATUS[scheme];
  return {
    scheme,
    ...neutrals,
    ...status,
    primary,
    onPrimary: onColor(primary),
    primarySoft: soft(primary, neutrals, scheme),
    secondary,
    onSecondary: onColor(secondary),
    heroStart,
    heroMid,
    heroEnd,
    onHero,
    statusOkSoft: soft(status.statusOk, neutrals, scheme),
    statusWarningSoft: soft(status.statusWarning, neutrals, scheme),
    statusDangerSoft: soft(status.statusDanger, neutrals, scheme),
  };
}
