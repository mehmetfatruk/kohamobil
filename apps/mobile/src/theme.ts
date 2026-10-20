import { createTheme, type ThemeColors } from '@mirakil/ui';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

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

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
