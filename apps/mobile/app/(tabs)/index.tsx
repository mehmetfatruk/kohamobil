import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { DATA_SOURCE } from '../../src/api';
import { Hero } from '../../src/components/Hero';
import { RecordTile } from '../../src/components/RecordCard';
import { Screen } from '../../src/components/Screen';
import { SummaryTile } from '../../src/components/SummaryTile';
import { TenantLogo } from '../../src/components/TenantLogo';
import {
  AppText,
  Card,
  ErrorView,
  IconBubble,
  LoadingView,
  SectionHeader,
  type IconName,
} from '../../src/components/ui';
import { useAnnouncements, useItemTypes, useNewArrivals, useSummary } from '../../src/hooks/useApi';
import { errorText } from '../../src/lib/errors';
import { formatDate, formatMoney, isZero } from '../../src/lib/format';
import { useSession } from '../../src/state/session';
import { elevation, radius, spacing, useTheme } from '../../src/theme';

const TYPE_ICONS: Record<string, IconName> = {
  BK: 'book',
  SER: 'newspaper',
  TEZ: 'school',
  REF: 'library',
  EBK: 'tablet-portrait',
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
  const status = !s
    ? null
    : s.loans.overdue > 0
      ? t('home.statusOverdue', { count: s.loans.overdue })
      : s.loans.dueSoon > 0
        ? t('home.statusDueSoon', { count: s.loans.dueSoon })
        : s.loans.total > 0
          ? t('home.statusAllGood')
          : t('home.statusNoLoans');
  const onHero = theme.onHero;
  const glass = onHero === '#FFFFFF' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)';

  const hero = (
    <Hero style={styles.hero}>
      <View style={styles.topRow}>
        <View style={[styles.logoRing, { backgroundColor: glass }]}>
          <TenantLogo tenant={tenant} size={36} color="#FFFFFF" textColor={theme.heroEnd} />
        </View>
        <View style={styles.flex}>
          <AppText variant="overline" color={onHero} style={styles.dim} numberOfLines={1}>
            {(tenant.shortName ?? tenant.name).toLocaleUpperCase('tr')}
          </AppText>
          {DATA_SOURCE === 'mock' ? (
            <AppText variant="caption" color={onHero} style={styles.dim}>
              {t('common.demoMode')}
            </AppText>
          ) : null}
        </View>
        {features.digitalCard ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.myCard')}
            onPress={() => router.push('/card')}
            style={({ pressed }) => [
              styles.cardButton,
              { backgroundColor: glass, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="barcode-outline" size={18} color={onHero} />
            <AppText variant="caption" color={onHero} style={styles.bold}>
              {t('home.myCard')}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.greeting}>
        <AppText variant="display" color={onHero}>
          {t('home.greeting', { name: firstName })}
        </AppText>
        {status ? (
          <AppText color={onHero} style={styles.dim}>
            {status}
          </AppText>
        ) : null}
      </View>

      {features.catalogSearch ? (
        <Pressable
          accessibilityRole="search"
          onPress={() => router.push('/catalog')}
          style={({ pressed }) => [
            styles.search,
            { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.textMuted} />
          <AppText muted style={styles.flex}>
            {t('home.searchHint')}
          </AppText>
        </Pressable>
      ) : null}
    </Hero>
  );

  return (
    <Screen safeTop hero={hero} onRefresh={refresh} refreshing={summary.isRefetching}>
      {summary.isPending ? (
        <Card>
          <LoadingView />
        </Card>
      ) : summary.isError ? (
        <Card>
          <ErrorView message={errorText(summary.error)} onRetry={() => void summary.refetch()} />
        </Card>
      ) : s ? (
        <>
          <View style={[styles.stats, { backgroundColor: theme.surface }, elevation(theme, 2)]}>
            <View style={styles.statRow}>
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
            </View>
            {features.holds || features.fines ? (
              <View style={[styles.statRow, styles.statDivider, { borderColor: theme.border }]}>
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
            ) : null}
          </View>

          {s.holds.ready > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => openMyBooks('holds')}
              style={({ pressed }) => [
                styles.banner,
                { backgroundColor: theme.statusOkSoft, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <IconBubble
                icon="checkmark-done"
                color={theme.statusOk}
                background={theme.surface}
                size={38}
              />
              <AppText style={[styles.flex, styles.bold]} color={theme.statusOk}>
                {t('home.readyHolds', { count: s.holds.ready })}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={theme.statusOk} />
            </Pressable>
          ) : null}
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
            style={styles.bleed}
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
                  { backgroundColor: theme.surface, opacity: pressed ? 0.85 : 1 },
                  elevation(theme),
                ]}
              >
                <IconBubble icon={TYPE_ICONS[item.code] ?? 'albums'} size={44} />
                <View style={styles.typeText}>
                  <AppText variant="subheading" numberOfLines={1}>
                    {item.name}
                  </AppText>
                  {item.recordCount !== null ? (
                    <AppText variant="caption" muted>
                      {item.recordCount}
                    </AppText>
                  ) : null}
                </View>
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
            style={styles.bleed}
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
            <IconBubble icon="megaphone" color={theme.secondary} />
            <View style={styles.flex}>
              <AppText variant="subheading">{latest.title}</AppText>
              <AppText muted numberOfLines={2}>
                {latest.body}
              </AppText>
              <AppText variant="caption" muted style={styles.date}>
                {formatDate(latest.publishedAt)}
              </AppText>
            </View>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  dim: { opacity: 0.85 },
  hero: { paddingBottom: spacing.xxl + spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoRing: { padding: 4, borderRadius: 14 },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  greeting: { gap: 4 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 50,
    borderRadius: radius.md,
  },
  stats: { borderRadius: radius.lg, padding: 6 },
  statRow: { flexDirection: 'row' },
  statDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 4, paddingTop: 4 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  bleed: { marginHorizontal: -spacing.lg },
  hList: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 6 },
  typeCard: {
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  typeText: { paddingRight: spacing.sm },
  announcement: { flexDirection: 'row', gap: spacing.md },
  date: { marginTop: 4 },
});
