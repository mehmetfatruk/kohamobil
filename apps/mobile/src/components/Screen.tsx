import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, useTheme } from '../theme';
import { OfflineBanner } from './feedback';

/**
 * Ekran çerçevesi. Sekme ekranları başlıksız olduğu için üst güvenli alanı kendisi bırakır
 * (`safeTop`); yığın ekranlarında başlığı Expo Router çizer.
 */
export function Screen({
  children,
  scroll = true,
  safeTop = false,
  refreshing,
  onRefresh,
  padded = true,
  hero,
}: {
  children: ReactNode;
  /** Kaydırılan içeriğin en üstünde, kenar boşluğu olmadan çizilen başlık (ör. `<Hero>`). */
  hero?: ReactNode;
  scroll?: boolean;
  safeTop?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
}) {
  const theme = useTheme();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        ) : undefined
      }
    >
      {hero}
      <View style={[styles.body, padded && styles.padded, hero ? styles.afterHero : null]}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded]}>{children}</View>
  );
  return (
    <SafeAreaView
      edges={safeTop && !hero ? ['top', 'left', 'right'] : ['left', 'right']}
      style={[styles.flex, { backgroundColor: theme.background }]}
    >
      <OfflineBanner />
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: spacing.lg },
  scrollContent: { paddingBottom: spacing.xxl * 2 },
  body: { gap: spacing.lg },
  afterHero: { marginTop: -spacing.xxl },
});
