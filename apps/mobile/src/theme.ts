import { createTheme, type ThemeColors } from '@mirakil/ui';
import { useColorScheme } from 'react-native';

/**
 * Faz 2'de kurum renkleri seçili tenant'ın yapılandırmasından gelecek; şimdilik MirAkıl
 * varsayılan renkleri kullanılır. Kontrast kontrolü @mirakil/ui içinde yapılır.
 */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return createTheme(scheme);
}
