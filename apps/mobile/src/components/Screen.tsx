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
}: {
  children: ReactNode;
  scroll?: boolean;
  safeTop?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
}) {
  const theme = useTheme();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && styles.padded, styles.scrollContent]}
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
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded]}>{children}</View>
  );
  return (
    <SafeAreaView
      edges={safeTop ? ['top', 'left', 'right'] : ['left', 'right']}
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
  scrollContent: { gap: spacing.lg, paddingBottom: spacing.xl * 2 },
});
