import type { Hold } from '@mirakil/types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useCancelHold } from '../hooks/useApi';
import { useOnline } from '../hooks/useOnline';
import { errorText } from '../lib/errors';
import { formatDate } from '../lib/format';
import { useSession } from '../state/session';
import { spacing, useTheme } from '../theme';
import { Cover } from './Cover';
import { confirm, toast } from './feedback';
import { AppText, Badge, Button, Card } from './ui';

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

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Cover
          id={hold.record.id}
          title={hold.record.title}
          author={hold.record.author}
          uri={hold.record.coverUrl}
          width={60}
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
          <Badge label={t(`myBooks.hold${hold.status}`)} color={color} />
          <AppText variant="caption" muted>
            {t('myBooks.placedOn', { date: formatDate(hold.placedAt) })}
          </AppText>
          <AppText variant="caption" muted>
            {t('myBooks.pickupAt', { library: hold.pickupLibrary.name })}
          </AppText>
          {hold.queuePosition ? (
            <AppText variant="caption" muted>
              {t('myBooks.queue', { position: hold.queuePosition })}
            </AppText>
          ) : null}
          {hold.pickupDeadline ? (
            <AppText variant="caption" style={{ color: theme.statusOk, fontWeight: '700' }}>
              {t('myBooks.pickupBy', { date: formatDate(hold.pickupDeadline) })}
            </AppText>
          ) : null}
        </View>
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

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  body: { flex: 1, gap: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
