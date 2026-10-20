import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { HoldCard } from '../../src/components/HoldCard';
import { LoanCard } from '../../src/components/LoanCard';
import { Screen } from '../../src/components/Screen';
import {
  AppText,
  Card,
  Divider,
  ErrorView,
  LoadingView,
  MessageView,
} from '../../src/components/ui';
import { useFines, useHolds, useLoans } from '../../src/hooks/useApi';
import { errorText } from '../../src/lib/errors';
import { formatDate, formatMoney, isZero } from '../../src/lib/format';
import { useSession } from '../../src/state/session';
import { elevation, radius, spacing, useTheme } from '../../src/theme';

type Tab = 'loans' | 'holds' | 'fines';

function Segments({
  value,
  onChange,
  tabs,
}: {
  value: Tab;
  onChange: (tab: Tab) => void;
  tabs: { key: Tab; label: string }[];
}) {
  const theme = useTheme();
  return (
    <View
      style={[styles.segments, { backgroundColor: theme.surfaceAlt }]}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab.key)}
            style={[
              styles.segment,
              active && [{ backgroundColor: theme.surface }, elevation(theme)],
            ]}
          >
            <AppText
              variant="caption"
              color={active ? theme.primary : theme.textMuted}
              style={styles.segmentText}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function LoansList() {
  const { t } = useTranslation();
  const loans = useLoans();
  if (loans.isPending) return <LoadingView />;
  if (loans.isError)
    return <ErrorView message={errorText(loans.error)} onRetry={() => void loans.refetch()} />;
  if (!loans.data.length)
    return <MessageView icon="book-outline" message={t('myBooks.loansEmpty')} />;
  return loans.data.map((loan) => <LoanCard key={loan.id} loan={loan} />);
}

function HoldsList() {
  const { t } = useTranslation();
  const holds = useHolds();
  if (holds.isPending) return <LoadingView />;
  if (holds.isError)
    return <ErrorView message={errorText(holds.error)} onRetry={() => void holds.refetch()} />;
  if (!holds.data.length)
    return <MessageView icon="bookmark-outline" message={t('myBooks.holdsEmpty')} />;
  return holds.data.map((hold) => <HoldCard key={hold.id} hold={hold} />);
}

function FinesView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const fines = useFines();
  if (fines.isPending) return <LoadingView />;
  if (fines.isError)
    return <ErrorView message={errorText(fines.error)} onRetry={() => void fines.refetch()} />;
  const { balance, outstanding, transactions } = fines.data;
  const zero = isZero(balance);
  return (
    <>
      <Card
        style={[
          styles.total,
          { backgroundColor: zero ? theme.statusOkSoft : theme.statusDangerSoft },
        ]}
      >
        <AppText variant="overline" color={zero ? theme.statusOk : theme.statusDanger}>
          {t('myBooks.totalFines').toLocaleUpperCase('tr')}
        </AppText>
        <AppText variant="display" color={zero ? theme.statusOk : theme.statusDanger}>
          {formatMoney(balance)}
        </AppText>
        {!zero ? (
          <AppText variant="caption" muted>
            {t('myBooks.paymentInfo')}
          </AppText>
        ) : null}
      </Card>
      {zero && !transactions.length ? (
        <MessageView icon="happy-outline" message={t('myBooks.finesEmpty')} />
      ) : null}
      {outstanding.length ? (
        <Card>
          <AppText variant="subheading">{t('myBooks.outstanding')}</AppText>
          {outstanding.map((line, index) => (
            <View key={line.id}>
              {index > 0 ? <Divider /> : null}
              <View style={styles.line}>
                <View style={styles.flex}>
                  <AppText>{line.description}</AppText>
                  <AppText variant="caption" muted>
                    {formatDate(line.date)}
                  </AppText>
                </View>
                <View style={styles.amounts}>
                  <AppText color={theme.statusDanger} style={styles.bold}>
                    {formatMoney(line.remaining ?? line.amount)}
                  </AppText>
                  {line.remaining && line.remaining.amount !== line.amount.amount ? (
                    <AppText variant="caption" muted>
                      / {formatMoney(line.amount)}
                    </AppText>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </Card>
      ) : null}
      {transactions.length ? (
        <Card>
          <AppText variant="subheading">{t('myBooks.transactions')}</AppText>
          {transactions.map((line, index) => {
            const credit = line.kind === 'CREDIT';
            return (
              <View key={line.id}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.line}>
                  <View style={styles.flex}>
                    <AppText>{line.description}</AppText>
                    <AppText variant="caption" muted>
                      {formatDate(line.date)}
                    </AppText>
                  </View>
                  <AppText color={credit ? theme.statusOk : theme.text} style={styles.bold}>
                    {credit ? '−' : '+'} {formatMoney(line.amount)}
                  </AppText>
                </View>
              </View>
            );
          })}
        </Card>
      ) : null}
    </>
  );
}

export default function MyBooks() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const features = useSession((s) => s.tenant?.features);
  const tabs = [
    { key: 'loans' as const, label: t('home.loans') },
    ...(features?.holds ? [{ key: 'holds' as const, label: t('home.holds') }] : []),
    ...(features?.fines ? [{ key: 'fines' as const, label: t('home.fines') }] : []),
  ];
  const [tab, setTab] = useState<Tab>(params.tab ?? 'loans');
  useEffect(() => {
    if (params.tab) setTab(params.tab);
  }, [params.tab]);

  const loans = useLoans();
  const holds = useHolds();
  const fines = useFines();
  const refresh = () => void { loans, holds, fines }[tab].refetch();

  return (
    <Screen safeTop onRefresh={refresh} refreshing={{ loans, holds, fines }[tab].isRefetching}>
      <AppText variant="title">{t('tabs.myBooks')}</AppText>
      <Segments value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'loans' ? <LoansList /> : tab === 'holds' ? <HoldsList /> : <FinesView />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  segments: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm },
  segmentText: { fontWeight: '700', fontSize: 14 },
  total: { gap: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  amounts: { alignItems: 'flex-end' },
  bold: { fontWeight: '700' },
});
