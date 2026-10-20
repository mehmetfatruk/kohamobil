import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { DATA_SOURCE } from '../../src/api';
import { RecordTile } from '../../src/components/RecordCard';
import { Screen } from '../../src/components/Screen';
import { SummaryTile } from '../../src/components/SummaryTile';
import { TenantLogo } from '../../src/components/TenantLogo';
import {
  AppText,
  Badge,
  Card,
  ErrorView,
  LoadingView,
  SectionHeader,
  type IconName,
} from '../../src/components/ui';
import { useAnnouncements, useItemTypes, useNewArrivals, useSummary } from '../../src/hooks/useApi';
import { errorText } from '../../src/lib/errors';
import { formatDate, formatMoney, isZero } from '../../src/lib/format';
import { useSession } from '../../src/state/session';
import { radius, spacing, useTheme } from '../../src/theme';

const TYPE_ICONS: Record<string, IconName> = {
  BK: 'book-outline',
  SER: 'newspaper-outline',
  TEZ: 'school-outline',
  REF: 'library-outline',
  EBK: 'tablet-portrait-outline',
};

const openMyBooks = (tab: 'loans' | 'holds' | 'fines') =>
  router.push({ pathname: '/my-books', params: { tab } });

export default function Home() {
  const { t } = useTranslation();
  const theme = useTheme();
  const tenant = useSession((s) => s.tenant);
  const user = useSession((s) => s.user);
  const summary = useSummary();
  const itemTypes = useItemTypes();
  const newArrivals = useNewArrivals(10);
  const announcements = useAnnouncements();

  if (!tenant) return null;
  const { features } = tenant;
  const firstName = user?.displayName.split(' ')[0] ?? '';

  const refresh = () => {
    void summary.refetch();
    void newArrivals.refetch();
    void announcements.refetch();
  };

  const s = summary.data;
  const latest = announcements.data?.[0];

  return (
    <Screen safeTop onRefresh={refresh} refreshing={summary.isRefetching}>
      <View style={styles.header}>
        <TenantLogo tenant={tenant} size={48} />
        <View style={styles.flex}>
          <AppText variant="subheading" numberOfLines={1}>
            {tenant.shortName ?? tenant.name}
          </AppText>
          <AppText muted>{t('home.greeting', { name: firstName })}</AppText>
        </View>
        {DATA_SOURCE === 'mock' ? (
          <Badge label={t('common.demoMode')} color={theme.statusWarning} />
        ) : null}
      </View>

      {summary.isPending ? (
        <LoadingView />
      ) : summary.isError ? (
        <ErrorView message={errorText(summary.error)} onRetry={() => void summary.refetch()} />
      ) : s ? (
        <>
          {s.holds.ready > 0 ? (
            <Card
              onPress={() => openMyBooks('holds')}
              style={[styles.banner, { borderColor: theme.statusOk }]}
            >
              <Ionicons name="checkmark-circle" size={24} color={theme.statusOk} />
              <AppText style={styles.flex}>
                {t('home.readyHolds', { count: s.holds.ready })}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Card>
          ) : null}
          <View style={styles.tiles}>
            <SummaryTile
              label={t('home.loans')}
              value={String(s.loans.total)}
              icon="book"
              onPress={() => openMyBooks('loans')}
            />
            <SummaryTile
              label={t('home.dueSoon')}
              value={String(s.loans.dueSoon)}
              icon="time"
              tone={s.loans.dueSoon ? 'warning' : 'ok'}
              onPress={() => openMyBooks('loans')}
            />
            <SummaryTile
              label={t('home.overdue')}
              value={String(s.loans.overdue)}
              icon="alert-circle"
              tone={s.loans.overdue ? 'danger' : 'ok'}
              onPress={() => openMyBooks('loans')}
            />
            {features.holds ? (
              <SummaryTile
                label={t('home.holds')}
                value={String(s.holds.total)}
                icon="bookmark"
                onPress={() => openMyBooks('holds')}
              />
            ) : null}
            {features.fines ? (
              <SummaryTile
                label={t('home.fines')}
                value={formatMoney(s.fines.balance)}
                icon="wallet"
                tone={isZero(s.fines.balance) ? 'ok' : 'danger'}
                onPress={() => openMyBooks('fines')}
              />
            ) : null}
          </View>
        </>
      ) : null}

      {features.catalogSearch && itemTypes.data?.length ? (
        <View>
          <SectionHeader title={t('home.browseByType')} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={itemTypes.data}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.hList}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/browse',
                    params: { type: item.code, title: item.name },
                  })
                }
                style={({ pressed }) => [
                  styles.typeCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.typeIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons
                    name={TYPE_ICONS[item.code] ?? 'albums-outline'}
                    size={26}
                    color={theme.onPrimary}
                  />
                </View>
                <AppText variant="caption" numberOfLines={2} style={styles.typeLabel}>
                  {item.name}
                </AppText>
                {item.recordCount !== null ? (
                  <AppText variant="caption" muted>
                    {item.recordCount}
                  </AppText>
                ) : null}
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {features.catalogSearch && newArrivals.data?.items.length ? (
        <View>
          <SectionHeader
            title={t('home.newArrivals')}
            action={t('common.seeAll')}
            onAction={() => router.push({ pathname: '/browse', params: { mode: 'new' } })}
          />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={newArrivals.data.items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.hList}
            renderItem={({ item }) => <RecordTile record={item} />}
          />
        </View>
      ) : null}

      {features.announcements && latest ? (
        <View>
          <SectionHeader
            title={t('home.announcements')}
            action={t('common.seeAll')}
            onAction={() => router.push('/announcements')}
          />
          <Card onPress={() => router.push('/announcements')} style={styles.announcement}>
            <AppText variant="subheading">{latest.title}</AppText>
            <AppText muted numberOfLines={2}>
              {latest.body}
            </AppText>
            <AppText variant="caption" muted>
              {formatDate(latest.publishedAt)}
            </AppText>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1.5 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hList: { gap: spacing.md, paddingRight: spacing.lg },
  typeCard: {
    width: 104,
    alignItems: 'center',
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: { textAlign: 'center', fontWeight: '600' },
  announcement: { gap: 4 },
});
