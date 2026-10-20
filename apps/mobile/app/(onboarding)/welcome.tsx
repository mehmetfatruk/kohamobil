import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DATA_SOURCE } from '../../src/api';
import { AppText, Badge, Button } from '../../src/components/ui';
import { spacing, useTheme } from '../../src/theme';

export default function Welcome() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: theme.primary }]}>
          <Ionicons name="library" size={52} color={theme.onPrimary} />
        </View>
        <AppText variant="title" style={styles.center}>
          {t('app.name')}
        </AppText>
        <AppText muted style={styles.center}>
          {t('onboarding.welcomeBody')}
        </AppText>
        {DATA_SOURCE === 'mock' ? (
          <Badge label={t('common.demoMode')} color={theme.statusWarning} />
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button
          label={t('onboarding.start')}
          icon="arrow-forward"
          onPress={() => router.push('/select-tenant')}
        />
        <AppText variant="caption" muted style={styles.center}>
          {t('app.integrationNote')}
        </AppText>
        <AppText variant="caption" muted style={styles.center}>
          {t('app.poweredBy')}
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  footer: { gap: spacing.md },
});
