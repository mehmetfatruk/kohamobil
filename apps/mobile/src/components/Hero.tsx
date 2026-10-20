import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, useTheme } from '../theme';

/**
 * Kurum renginden koyu tonuna geçen başlık zemini. Üst güvenli alanı kendisi bırakır ve ekran
 * odaktayken durum çubuğu yazılarını zemine göre (açık/koyu) ayarlar.
 */
export function Hero({
  children,
  safeTop = true,
  rounded = true,
  style,
}: {
  children: ReactNode;
  safeTop?: boolean;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const barStyle = theme.onHero === '#FFFFFF' ? 'light' : 'dark';

  useFocusEffect(
    useCallback(() => {
      if (!safeTop) return undefined;
      setStatusBarStyle(barStyle);
      return () => setStatusBarStyle('auto');
    }, [barStyle, safeTop]),
  );

  return (
    <LinearGradient
      colors={[theme.heroStart, theme.heroMid, theme.heroEnd]}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.hero,
        rounded && styles.rounded,
        { paddingTop: (safeTop ? insets.top : 0) + spacing.lg },
        style,
      ]}
    >
      {/* Dekoratif yarı saydam halkalar */}
      <View pointerEvents="none" style={[styles.ring, styles.ringLarge]} />
      <View pointerEvents="none" style={[styles.ring, styles.ringSmall]} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  rounded: { borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  ring: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  ringLarge: { width: 260, height: 260, top: -90, right: -70 },
  ringSmall: { width: 140, height: 140, bottom: -60, left: -40 },
});
