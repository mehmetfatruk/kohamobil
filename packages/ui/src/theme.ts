import { ensureContrast, onColor } from './color.js';

/** MirAkıl temel tasarım sistemi; kurum renkleri yalnızca vurgu renklerini değiştirir. */
export const MIRAKIL_BRAND = {
  primary: '#1A73E8',
  secondary: '#0B3D91',
} as const;

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  /** Ödünç durum renkleri (docs: yeşil / turuncu / kırmızı) */
  statusOk: string;
  statusWarning: string;
  statusDanger: string;
}

const NEUTRALS: Record<
  ColorScheme,
  Pick<ThemeColors, 'background' | 'surface' | 'text' | 'textMuted' | 'border'>
> = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F7FA',
    text: '#111827',
    textMuted: '#4B5563',
    border: '#E5E7EB',
  },
  dark: {
    background: '#0B0F14',
    surface: '#161B22',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    border: '#30363D',
  },
};

const STATUS: Record<
  ColorScheme,
  Pick<ThemeColors, 'statusOk' | 'statusWarning' | 'statusDanger'>
> = {
  light: { statusOk: '#15803D', statusWarning: '#B45309', statusDanger: '#B91C1C' },
  dark: { statusOk: '#4ADE80', statusWarning: '#FBBF24', statusDanger: '#F87171' },
};

export function createTheme(
  scheme: ColorScheme,
  tenant: { primaryColor?: string; secondaryColor?: string } = {},
): ThemeColors {
  const neutrals = NEUTRALS[scheme];
  const primary = ensureContrast(
    tenant.primaryColor ?? MIRAKIL_BRAND.primary,
    neutrals.background,
    3,
  );
  const secondary = ensureContrast(
    tenant.secondaryColor ?? MIRAKIL_BRAND.secondary,
    neutrals.background,
    3,
  );
  return {
    ...neutrals,
    ...STATUS[scheme],
    primary,
    onPrimary: onColor(primary),
    secondary,
    onSecondary: onColor(secondary),
  };
}
