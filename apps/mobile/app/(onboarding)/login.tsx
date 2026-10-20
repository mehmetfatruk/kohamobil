import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, DATA_SOURCE } from '../../src/api';
import { Hero } from '../../src/components/Hero';
import { TenantLogo } from '../../src/components/TenantLogo';
import { toast } from '../../src/components/feedback';
import { AppText, Button, Card } from '../../src/components/ui';
import { useOnline } from '../../src/hooks/useOnline';
import { errorText } from '../../src/lib/errors';
import { queryClient } from '../../src/lib/query-client';
import { useSession } from '../../src/state/session';
import { elevation, radius, spacing, useTheme } from '../../src/theme';

export default function Login() {
  const { t } = useTranslation();
  const theme = useTheme();
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const { tenant, signIn, forgetTenant } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!tenant) return null;
  const provider = tenant.authProviders[0];

  const submit = async () => {
    if (!provider || !identifier.trim() || !password) return;
    if (!online) {
      setError(t('common.offlineActionDisabled'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const login = await api.login({
        tenantCode: tenant.code,
        providerId: provider.id,
        identifier: identifier.trim(),
        password,
      });
      queryClient.clear();
      await signIn(login);
      setPassword('');
      router.replace('/(tabs)');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const changeTenant = async () => {
    await forgetTenant();
    queryClient.clear();
    router.replace('/select-tenant');
    toast(t('profile.changeTenantConfirm'));
  };

  const inputStyle = [
    styles.input,
    { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Hero style={[styles.hero, { paddingTop: insets.top + 56 }]}>
          <View style={styles.tenant}>
            <View style={styles.logoRing}>
              <TenantLogo tenant={tenant} size={64} color="#FFFFFF" textColor={theme.heroEnd} />
            </View>
            <AppText variant="heading" color={theme.onHero} style={styles.center}>
              {tenant.name}
            </AppText>
            <AppText color={theme.onHero} style={[styles.center, styles.dim]}>
              {t('auth.subtitle')}
            </AppText>
          </View>
        </Hero>

        <Card style={[styles.form, elevation(theme, 2)]}>
          <AppText variant="caption" muted style={styles.label}>
            {t('auth.identifier')}
          </AppText>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            style={inputStyle}
            accessibilityLabel={t('auth.identifier')}
          />
          <AppText variant="caption" muted style={styles.label}>
            {t('auth.password')}
          </AppText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
            style={inputStyle}
            accessibilityLabel={t('auth.password')}
          />
          {error ? (
            <AppText color={theme.statusDanger} style={styles.error}>
              {error}
            </AppText>
          ) : null}
          <Button
            label={t('auth.submit')}
            icon="log-in-outline"
            onPress={() => void submit()}
            loading={busy}
            disabled={!identifier.trim() || !password}
          />
          {DATA_SOURCE === 'mock' ? (
            <AppText variant="caption" color={theme.statusWarning} style={styles.center}>
              {t('auth.demoHint')}
            </AppText>
          ) : null}
        </Card>

        <AppText variant="caption" muted style={[styles.center, styles.padded]}>
          {t('auth.forgot')}
        </AppText>
        <Button
          label={t('auth.changeTenant')}
          variant="ghost"
          icon="swap-horizontal"
          onPress={() => void changeTenant()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.xxl },
  hero: { paddingBottom: spacing.xxl + spacing.xl },
  tenant: { alignItems: 'center', gap: spacing.sm },
  logoRing: {
    padding: 6,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: spacing.sm,
  },
  center: { textAlign: 'center' },
  dim: { opacity: 0.85 },
  padded: { paddingHorizontal: spacing.lg },
  label: { fontWeight: '600' },
  form: { gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: -(spacing.xxl + spacing.md) },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  error: { fontWeight: '600' },
});
