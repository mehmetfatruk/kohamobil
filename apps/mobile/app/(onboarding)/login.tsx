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

import { api, DATA_SOURCE } from '../../src/api';
import { TenantLogo } from '../../src/components/TenantLogo';
import { toast } from '../../src/components/feedback';
import { AppText, Button, Card } from '../../src/components/ui';
import { useOnline } from '../../src/hooks/useOnline';
import { errorText } from '../../src/lib/errors';
import { queryClient } from '../../src/lib/query-client';
import { useSession } from '../../src/state/session';
import { radius, spacing, useTheme } from '../../src/theme';

export default function Login() {
  const { t } = useTranslation();
  const theme = useTheme();
  const online = useOnline();
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
    { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.tenant}>
          <TenantLogo tenant={tenant} size={72} />
          <AppText variant="heading" style={styles.center}>
            {tenant.name}
          </AppText>
        </View>

        <Card style={styles.form}>
          <AppText variant="caption" muted>
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
          <AppText variant="caption" muted>
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

        <AppText variant="caption" muted style={styles.center}>
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
  content: { padding: spacing.lg, gap: spacing.lg },
  tenant: { alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  center: { textAlign: 'center' },
  form: { gap: spacing.sm },
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
