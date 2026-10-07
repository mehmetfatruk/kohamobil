import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { DIRECTORY_URL } from '../../src/config';
import { useTheme } from '../../src/theme';

/** Faz 2: Tenant Directory'den kurum listesi, arama ve seçimin SecureStore'a kaydı. */
export default function SelectTenant() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Screen title={t('onboarding.selectTenant')} subtitle={t('common.comingSoon')}>
      <Text style={{ color: theme.textMuted }}>{DIRECTORY_URL}</Text>
      <Link href="/(tabs)" style={{ color: theme.primary, marginTop: 16 }}>
        {t('tabs.home')} →
      </Link>
    </Screen>
  );
}
