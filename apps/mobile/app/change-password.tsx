import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput } from 'react-native';

import { Screen } from '../src/components/Screen';
import { toast } from '../src/components/feedback';
import { AppText, Button, Card } from '../src/components/ui';
import { useChangePassword } from '../src/hooks/useApi';
import { useOnline } from '../src/hooks/useOnline';
import { errorText } from '../src/lib/errors';
import { radius, spacing, useTheme } from '../src/theme';

export default function ChangePassword() {
  const { t } = useTranslation();
  const theme = useTheme();
  const online = useOnline();
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);

  const input = [
    styles.input,
    { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface },
  ];

  const submit = () => {
    if (next !== repeat) {
      setError(t('password.mismatch'));
      return;
    }
    setError(null);
    change.mutate(
      { current, next },
      {
        onSuccess: () => {
          toast(t('password.success'), 'success');
          router.back();
        },
        onError: (e) => setError(errorText(e)),
      },
    );
  };

  return (
    <Screen>
      <Card style={styles.form}>
        {[
          [t('password.current'), current, setCurrent, 'current-password'],
          [t('password.next'), next, setNext, 'new-password'],
          [t('password.confirm'), repeat, setRepeat, 'new-password'],
        ].map(([label, value, onChange, autoComplete]) => (
          <TextInput
            key={label as string}
            value={value as string}
            onChangeText={onChange as (v: string) => void}
            placeholder={label as string}
            placeholderTextColor={theme.textMuted}
            secureTextEntry
            autoComplete={autoComplete as 'current-password' | 'new-password'}
            accessibilityLabel={label as string}
            style={input}
          />
        ))}
        {error ? <AppText color={theme.statusDanger}>{error}</AppText> : null}
        <Button
          label={t('common.save')}
          onPress={submit}
          loading={change.isPending}
          disabled={!online || !current || !next || !repeat}
        />
        {!online ? (
          <AppText variant="caption" muted>
            {t('common.offlineActionDisabled')}
          </AppText>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 16,
  },
});
