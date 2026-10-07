import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme';

export default function Welcome() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Screen title={t('app.name')} subtitle={t('onboarding.welcomeBody')}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/select-tenant')}
        style={[styles.button, { backgroundColor: theme.primary }]}
      >
        <Text style={[styles.buttonText, { color: theme.onPrimary }]}>{t('onboarding.start')}</Text>
      </Pressable>
      <Text style={{ color: theme.textMuted }}>{t('app.integrationNote')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  buttonText: { fontSize: 17, fontWeight: '600' },
});
