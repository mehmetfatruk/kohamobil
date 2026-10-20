import type { AppNotification } from '@mirakil/types';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import {
  AppText,
  Button,
  Card,
  ErrorView,
  IconBubble,
  LoadingView,
  MessageView,
  type IconName,
} from '../../src/components/ui';
import { useMarkNotificationRead, useNotifications } from '../../src/hooks/useApi';
import { errorText } from '../../src/lib/errors';
import { formatDate } from '../../src/lib/format';
import { spacing, useTheme } from '../../src/theme';

const ICONS: Record<AppNotification['type'], IconName> = {
  DUE_SOON: 'time',
  DUE_TODAY: 'today',
  OVERDUE: 'alert-circle',
  HOLD_READY: 'checkmark-done',
  HOLD_EXPIRING: 'hourglass',
  MEMBERSHIP_EXPIRING: 'card',
  LIBRARY_ANNOUNCEMENT: 'megaphone',
  SYSTEM: 'shield-checkmark',
};

type Tone = 'ok' | 'warning' | 'danger' | 'neutral';
const TONES: Record<AppNotification['type'], Tone> = {
  DUE_SOON: 'warning',
  DUE_TODAY: 'warning',
  OVERDUE: 'danger',
  HOLD_READY: 'ok',
  HOLD_EXPIRING: 'warning',
  MEMBERSHIP_EXPIRING: 'warning',
  LIBRARY_ANNOUNCEMENT: 'neutral',
  SYSTEM: 'neutral',
};

function openTarget(notification: AppNotification) {
  const target = notification.target;
  if (!target) return;
  if (target.screen === 'loan') router.push({ pathname: '/my-books', params: { tab: 'loans' } });
  else if (target.screen === 'hold')
    router.push({ pathname: '/my-books', params: { tab: 'holds' } });
  else if (target.screen === 'fines')
    router.push({ pathname: '/my-books', params: { tab: 'fines' } });
  else if (target.screen === 'announcement') router.push('/announcements');
  else if (target.screen === 'record' && target.id)
    router.push({ pathname: '/record/[id]', params: { id: target.id } });
}

export default function Notifications() {
  const { t } = useTranslation();
  const theme = useTheme();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const hasUnread = notifications.data?.some((n) => !n.readAt);

  return (
    <Screen
      safeTop
      onRefresh={() => void notifications.refetch()}
      refreshing={notifications.isRefetching}
    >
      <View style={styles.header}>
        <AppText variant="title">{t('notifications.title')}</AppText>
        {hasUnread ? (
          <Button
            label={t('notifications.markAllRead')}
            variant="ghost"
            compact
            onPress={() => markRead.mutate(null)}
          />
        ) : null}
      </View>
      {notifications.isPending ? (
        <LoadingView />
      ) : notifications.isError ? (
        <ErrorView
          message={errorText(notifications.error)}
          onRetry={() => void notifications.refetch()}
        />
      ) : !notifications.data.length ? (
        <MessageView icon="notifications-off-outline" message={t('notifications.empty')} />
      ) : (
        notifications.data.map((n) => {
          const unread = !n.readAt;
          const color = {
            ok: theme.statusOk,
            warning: theme.statusWarning,
            danger: theme.statusDanger,
            neutral: theme.primary,
          }[TONES[n.type]];
          return (
            <Card
              key={n.id}
              onPress={() => {
                if (unread) markRead.mutate(n.id);
                openTarget(n);
              }}
              style={[styles.item, !unread && styles.read]}
            >
              <IconBubble icon={ICONS[n.type]} color={color} size={42} />
              <View style={styles.flex}>
                <AppText variant="subheading" style={unread ? styles.bold : null}>
                  {n.title}
                </AppText>
                <AppText muted>{n.body}</AppText>
                <AppText variant="caption" muted>
                  {formatDate(n.createdAt)}
                </AppText>
              </View>
              {unread ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  item: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  read: { opacity: 0.75 },
  bold: { fontWeight: '800' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
});
