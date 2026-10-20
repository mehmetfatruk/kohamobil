import { createTheme, type ThemeColors } from '@mirakil/ui';
import { useMemo } from 'react';
import { useColorScheme, type ViewStyle } from 'react-native';

import { useSession } from './state/session';

/**
 * Kurum seçildiyse kurumun renkleri, seçilmediyse MirAkıl renkleri kullanılır.
 * Kontrast @mirakil/ui içinde WCAG'a göre otomatik ayarlanır; açık/koyu mod sistemden gelir.
 */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const branding = useSession((s) => s.tenant?.branding);
  return useMemo(
    () =>
      createTheme(
        scheme,
        branding
          ? { primaryColor: branding.primaryColor, secondaryColor: branding.secondaryColor }
          : {},
      ),
    [scheme, branding],
  );
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

/** Yumuşak kart gölgesi (yeni mimarideki `boxShadow`); koyu temada gölge yerine ince kenar. */
export function elevation(theme: ThemeColors, level: 1 | 2 | 3 = 1): ViewStyle {
  if (theme.scheme === 'dark') return { borderWidth: 1, borderColor: theme.border };
  const y = [0, 2, 6, 14][level]!;
  const blur = [0, 10, 20, 32][level]!;
  return { boxShadow: `0 ${y}px ${blur}px rgba(15, 23, 42, ${0.04 + level * 0.025})` };
}
