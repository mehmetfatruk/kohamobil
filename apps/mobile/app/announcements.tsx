import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { Screen } from '../src/components/Screen';
import { AppText, Badge, Card, ErrorView, LoadingView, MessageView } from '../src/components/ui';
import { useAnnouncements } from '../src/hooks/useApi';
import { errorText } from '../src/lib/errors';
import { formatDate } from '../src/lib/format';
import { spacing, useTheme } from '../src/theme';

export default function Announcements() {
  const { t } = useTranslation();
  const theme = useTheme();
  const announcements = useAnnouncements();

  if (announcements.isPending) return <LoadingView />;
  if (announcements.isError)
    return (
      <ErrorView
        message={errorText(announcements.error)}
        onRetry={() => void announcements.refetch()}
      />
    );
  if (!announcements.data.length)
    return <MessageView icon="megaphone-outline" message={t('announcements.empty')} />;

  return (
    <Screen onRefresh={() => void announcements.refetch()} refreshing={announcements.isRefetching}>
      {announcements.data.map((a) => (
        <Card key={a.id} style={styles.card}>
          {a.global ? <Badge label={t('announcements.global')} color={theme.secondary} /> : null}
          <AppText variant="heading">{a.title}</AppText>
          <AppText>{a.body}</AppText>
          <AppText variant="caption" muted>
            {formatDate(a.publishedAt)}
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({ card: { gap: spacing.sm } });
