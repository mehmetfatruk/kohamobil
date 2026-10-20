import { Ionicons } from '@expo/vector-icons';
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
  LoadingView,
  MessageView,
  type IconName,
} from '../../src/components/ui';
import { useMarkNotificationRead, useNotifications } from '../../src/hooks/useApi';
import { errorText } from '../../src/lib/errors';
import { formatDate } from '../../src/lib/format';
import { spacing, useTheme } from '../../src/theme';

const ICONS: Record<AppNotification['type'], IconName> = {
  DUE_SOON: 'time-outline',
  DUE_TODAY: 'today-outline',
  OVERDUE: 'alert-circle-outline',
  HOLD_READY: 'checkmark-circle-outline',
  HOLD_EXPIRING: 'hourglass-outline',
  MEMBERSHIP_EXPIRING: 'card-outline',
  LIBRARY_ANNOUNCEMENT: 'megaphone-outline',
  SYSTEM: 'shield-checkmark-outline',
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
          return (
            <Card
              key={n.id}
              onPress={() => {
                if (unread) markRead.mutate(n.id);
                openTarget(n);
              }}
              style={[styles.item, unread && { borderColor: theme.primary, borderWidth: 1.5 }]}
            >
              <Ionicons
                name={ICONS[n.type]}
                size={24}
                color={unread ? theme.primary : theme.textMuted}
              />
              <View style={styles.flex}>
                <AppText variant="subheading">{n.title}</AppText>
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
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
});
