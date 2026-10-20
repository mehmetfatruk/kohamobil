import { ensureContrast, mix, onColor, shade } from './color.js';

/** MirAkıl temel tasarım sistemi; kurum renkleri yalnızca vurgu renklerini değiştirir. */
export const MIRAKIL_BRAND = {
  primary: '#1A73E8',
  secondary: '#0B3D91',
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
  /** Başlık geçişi (gradient): kurum renginden koyu tonuna */
  heroStart: string;
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
  light: {
    background: '#F3F5F9',
    surface: '#FFFFFF',
    surfaceAlt: '#EDF0F5',
    text: '#0F172A',
    textMuted: '#5B6474',
    border: '#E2E7EE',
    shadow: '#0F172A',
  },
  dark: {
    background: '#0A0D12',
    surface: '#151A21',
    surfaceAlt: '#1E242D',
    text: '#F1F5F9',
    textMuted: '#9AA4B2',
    border: '#2A313B',
    shadow: '#000000',
  },
};

const STATUS: Record<
  ColorScheme,
  Pick<ThemeColors, 'statusOk' | 'statusWarning' | 'statusDanger'>
> = {
  light: { statusOk: '#15803D', statusWarning: '#B45309', statusDanger: '#B91C1C' },
  dark: { statusOk: '#4ADE80', statusWarning: '#FBBF24', statusDanger: '#F87171' },
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
  // Vurgu rengi hem ekran zemininde hem kart zemininde okunur olmalı.
  const readable = (color: string) =>
    ensureContrast(ensureContrast(color, neutrals.background, 3), neutrals.surface, 3);
  const primary = readable(brand);
  const secondary = readable(tenant.secondaryColor ?? MIRAKIL_BRAND.secondary);
  // Başlık geçişi kurumun asıl rengiyle başlar ve koyulaşır; üzerindeki metin her iki uçta okunur.
  const startRaw = scheme === 'light' ? brand : shade(brand, 0.25);
  const onHero = onColor(startRaw);
  const heroStart = ensureContrast(startRaw, onHero, 3);
  const heroEnd = ensureContrast(shade(brand, scheme === 'light' ? 0.45 : 0.65), onHero, 3);
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
    heroEnd,
    onHero,
    statusOkSoft: soft(status.statusOk, neutrals, scheme),
    statusWarningSoft: soft(status.statusWarning, neutrals, scheme),
    statusDangerSoft: soft(status.statusDanger, neutrals, scheme),
  };
}
