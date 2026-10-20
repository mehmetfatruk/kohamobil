import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DATA_SOURCE } from '../../src/api';
import { Hero } from '../../src/components/Hero';
import { AppText, Button, type IconName } from '../../src/components/ui';
import { radius, spacing, useTheme } from '../../src/theme';

const FEATURES: { icon: IconName; key: string }[] = [
  { icon: 'book', key: 'onboarding.featureLoans' },
  { icon: 'refresh-circle', key: 'onboarding.featureRenew' },
  { icon: 'card', key: 'onboarding.featureCard' },
];

/** İlk açılış: MirAkıl renklerinde tam ekran karşılama (kurum henüz seçilmedi). */
export default function Welcome() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const fg = theme.onHero;
  const glass = fg === '#FFFFFF' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)';

  return (
    <Hero rounded={false} style={[styles.screen, { paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.top}>
        <View style={[styles.logo, { backgroundColor: '#FFFFFF' }]}>
          <Ionicons name="library" size={44} color={theme.heroEnd} />
        </View>
        <AppText variant="display" color={fg}>
          {t('app.name')}
        </AppText>
        <AppText color={fg} style={styles.body}>
          {t('onboarding.welcomeBody')}
        </AppText>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature.key} style={[styles.feature, { backgroundColor: glass }]}>
            <Ionicons name={feature.icon} size={22} color={fg} />
            <AppText color={fg} style={styles.featureText}>
              {t(feature.key)}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          label={t('onboarding.start')}
          icon="arrow-forward"
          variant="light"
          onPress={() => router.push('/select-tenant')}
        />
        {DATA_SOURCE === 'mock' ? (
          <AppText variant="caption" color={fg} style={styles.center}>
            {t('common.demoMode')}
          </AppText>
        ) : null}
        <AppText variant="caption" color={fg} style={[styles.center, styles.dim]}>
          {`${t('app.integrationNote')} · ${t('app.poweredBy')}`}
        </AppText>
      </View>
    </Hero>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.xl },
  top: { gap: spacing.md, marginTop: spacing.xxl },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
  },
  body: { fontSize: 17, lineHeight: 24, opacity: 0.9 },
  features: { gap: spacing.sm },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  featureText: { flex: 1, fontWeight: '600' },
  footer: { gap: spacing.md },
  center: { textAlign: 'center' },
  dim: { opacity: 0.8 },
});
