import type { NotificationPreferences } from '@mirakil/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { Screen } from '../src/components/Screen';
import { toast } from '../src/components/feedback';
import { AppText, Button, Card, Divider, ErrorView, LoadingView } from '../src/components/ui';
import { useNotificationPreferences, useUpdatePreferences } from '../src/hooks/useApi';
import { useOnline } from '../src/hooks/useOnline';
import { errorText } from '../src/lib/errors';
import { spacing, useTheme } from '../src/theme';

const REMINDER_DAYS = [3, 1, 0] as const;

function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <AppText style={styles.flex} muted={disabled}>
        {label}
      </AppText>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: theme.primary, false: theme.border }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function NotificationPreferencesScreen() {
  const { t } = useTranslation();
  const online = useOnline();
  const query = useNotificationPreferences();
  const update = useUpdatePreferences();
  const [draft, setDraft] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  if (query.isPending || !draft) return <LoadingView />;
  if (query.isError)
    return <ErrorView message={errorText(query.error)} onRetry={() => void query.refetch()} />;

  const set = (patch: Partial<NotificationPreferences>) => setDraft({ ...draft, ...patch });
  const toggleDay = (day: number, on: boolean) =>
    set({
      dueReminderDays: on
        ? [...new Set([...draft.dueReminderDays, day])].sort((a, b) => b - a)
        : draft.dueReminderDays.filter((d) => d !== day),
    });

  return (
    <Screen>
      <Card>
        <Toggle
          label={t('prefs.dueReminders')}
          value={draft.dueReminders}
          onChange={(v) => set({ dueReminders: v })}
        />
        {REMINDER_DAYS.map((day) => (
          <View key={day} style={styles.indent}>
            <Toggle
              label={day === 0 ? t('prefs.dueDay') : t('prefs.daysBefore', { count: day })}
              value={draft.dueReminderDays.includes(day)}
              disabled={!draft.dueReminders}
              onChange={(v) => toggleDay(day, v)}
            />
          </View>
        ))}
        <Divider />
        <Toggle
          label={t('prefs.overdue')}
          value={draft.overdue}
          onChange={(v) => set({ overdue: v })}
        />
        <Toggle label={t('prefs.holds')} value={draft.holds} onChange={(v) => set({ holds: v })} />
        <Toggle
          label={t('prefs.announcements')}
          value={draft.announcements}
          onChange={(v) => set({ announcements: v })}
        />
        <Toggle
          label={t('prefs.membership')}
          value={draft.membership}
          onChange={(v) => set({ membership: v })}
        />
      </Card>
      <AppText variant="caption" muted>
        {t('prefs.privacyNote')}
      </AppText>
      <Button
        label={t('common.save')}
        icon="save-outline"
        disabled={!online}
        loading={update.isPending}
        onPress={() =>
          update.mutate(draft, {
            onSuccess: () => toast(t('common.saved'), 'success'),
            onError: (error) => toast(errorText(error), 'error'),
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  indent: { paddingLeft: spacing.lg },
});
