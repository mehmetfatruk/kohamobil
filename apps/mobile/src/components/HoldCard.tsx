import { Ionicons } from '@expo/vector-icons';
import type { Hold } from '@mirakil/types';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCancelHold } from '../hooks/useApi';
import { useOnline } from '../hooks/useOnline';
import { errorText } from '../lib/errors';
import { formatDate } from '../lib/format';
import { useSession } from '../state/session';
import { radius, spacing, useTheme } from '../theme';
import { Cover } from './Cover';
import { confirm, toast } from './feedback';
import { AppText, Badge, Button, Card, type IconName } from './ui';

export function HoldCard({ hold }: { hold: Hold }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const online = useOnline();
  const cancelEnabled = useSession((s) => s.tenant?.features.holdCancel ?? false);
  const cancel = useCancelHold();

  const color =
    hold.status === 'READY'
      ? theme.statusOk
      : hold.status === 'IN_TRANSIT' || hold.status === 'IN_PROCESSING'
        ? theme.statusWarning
        : theme.primary;

  const onCancel = async () => {
    if (!online) {
      toast(t('common.offlineActionDisabled'), 'error');
      return;
    }
    const ok = await confirm(
      t('myBooks.cancelTitle'),
      t('myBooks.cancelBody', { title: hold.record.title }),
      t('myBooks.cancelHold'),
      t('common.cancel'),
    );
    if (!ok) return;
    cancel.mutate(hold.id, {
      onSuccess: () => toast(t('myBooks.cancelled'), 'success'),
      onError: (error) => toast(errorText(error), 'error'),
    });
  };

  const statusIcon =
    hold.status === 'READY'
      ? 'checkmark-done'
      : hold.status === 'IN_TRANSIT'
        ? 'car'
        : hold.status === 'SUSPENDED'
          ? 'pause-circle'
          : 'hourglass';

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/record/[id]', params: { id: hold.record.id } })}
        style={styles.row}
      >
        <Cover
          id={hold.record.id}
          title={hold.record.title}
          author={hold.record.author}
          uri={hold.record.coverUrl}
          width={64}
        />
        <View style={styles.body}>
          <AppText variant="subheading" numberOfLines={2}>
            {hold.record.title}
          </AppText>
          {hold.record.author ? (
            <AppText muted numberOfLines={1}>
              {hold.record.author}
            </AppText>
          ) : null}
          <Badge label={t(`myBooks.hold${hold.status}`)} color={color} icon={statusIcon} />
        </View>
      </Pressable>

      <View style={[styles.details, { backgroundColor: theme.surfaceAlt }]}>
        <Detail
          icon="calendar-outline"
          text={t('myBooks.placedOn', { date: formatDate(hold.placedAt) })}
        />
        <Detail
          icon="location-outline"
          text={t('myBooks.pickupAt', { library: hold.pickupLibrary.name })}
        />
        {hold.queuePosition ? (
          <Detail
            icon="people-outline"
            text={t('myBooks.queue', { position: hold.queuePosition })}
          />
        ) : null}
        {hold.pickupDeadline ? (
          <Detail
            icon="alarm-outline"
            color={theme.statusOk}
            text={t('myBooks.pickupBy', { date: formatDate(hold.pickupDeadline) })}
          />
        ) : null}
      </View>

      {cancelEnabled && hold.cancellable ? (
        <View style={styles.actions}>
          <Button
            label={t('myBooks.cancelHold')}
            variant="danger"
            icon="close-circle-outline"
            compact
            onPress={() => void onCancel()}
            loading={cancel.isPending}
            disabled={!online}
          />
        </View>
      ) : null}
    </Card>
  );
}

function Detail({ icon, text, color }: { icon: IconName; text: string; color?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={16} color={color ?? theme.textMuted} />
      <AppText
        variant="caption"
        color={color ?? theme.textMuted}
        style={[styles.flex, color ? styles.bold : null]}
      >
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  card: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  body: { flex: 1, gap: 6 },
  details: { borderRadius: radius.md, padding: spacing.md, gap: 6 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
