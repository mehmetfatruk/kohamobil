import { createTheme, type ThemeColors } from '@mirakil/ui';
import { useMemo } from 'react';
import { useColorScheme, type ViewStyle } from 'react-native';

/**
 * Uygulama her kurumda MirAkıl kurumsal renkleriyle (logo mavisi) çizilir; kurumun kimliği
 * logosu ve adıyla verilir. `createTheme` kurum rengi alabilir, ancak bilinçli olarak
 * kullanılmaz (docs/DECISIONS.md D27). Açık/koyu mod sistemden gelir.
 */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return useMemo(() => createTheme(scheme), [scheme]);
}

/** Web sitesiyle aynı ölçüler: 10 düğme/giriş · 16 kart · 24 panel. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/**
 * Kart derinliği: ince çizgi + mavi tonlu yumuşak gölge (web: --shadow-sm / --shadow-md).
 * Koyu temada yalnızca çizgi kullanılır.
 */
export function elevation(theme: ThemeColors, level: 1 | 2 | 3 = 1): ViewStyle {
  const line = { borderWidth: 1, borderColor: theme.border };
  if (theme.scheme === 'dark') return line;
  const shadow = [
    '',
    '0 1px 2px rgba(15, 74, 116, 0.06), 0 4px 16px rgba(15, 74, 116, 0.07)',
    '0 2px 4px rgba(15, 74, 116, 0.05), 0 18px 40px -16px rgba(15, 74, 116, 0.3)',
    '0 14px 30px -14px rgba(0, 85, 164, 0.55)',
  ][level]!;
  return { ...line, boxShadow: shadow };
}
