import type { Loan } from '@mirakil/types';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useRenewLoan } from '../hooks/useApi';
import { useOnline } from '../hooks/useOnline';
import { errorText } from '../lib/errors';
import { formatDate } from '../lib/format';
import { useSession } from '../state/session';
import { spacing, useTheme } from '../theme';
import { Cover } from './Cover';
import { toast } from './feedback';
import { AppText, Badge, Button, Card } from './ui';

/** Ödünç kartı: yeşil (zaman var) · turuncu (yaklaşıyor) · kırmızı (gecikmiş). */
export function LoanCard({ loan }: { loan: Loan }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const online = useOnline();
  const renewalsEnabled = useSession((s) => s.tenant?.features.renewals ?? false);
  const renew = useRenewLoan();

  const renewalsExhausted = loan.renewals.max !== null && loan.renewals.count >= loan.renewals.max;
  const color = { OK: theme.statusOk, DUE_SOON: theme.statusWarning, OVERDUE: theme.statusDanger }[
    loan.status
  ];
  const remaining =
    loan.daysRemaining < 0
      ? t('myBooks.overdueDays', { count: -loan.daysRemaining })
      : loan.daysRemaining === 0
        ? t('myBooks.dueToday')
        : t('myBooks.daysLeft', { count: loan.daysRemaining });

  const onRenew = () => {
    if (!online) {
      toast(t('common.offlineActionDisabled'), 'error');
      return;
    }
    renew.mutate(loan.id, {
      onSuccess: (updated) =>
        toast(t('myBooks.renewed', { date: formatDate(updated.dueDate) }), 'success'),
      onError: (error) => toast(errorText(error), 'error'),
    });
  };

  return (
    <Card style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.row}>
        <Cover
          id={loan.record.id}
          title={loan.record.title}
          author={loan.record.author}
          uri={loan.record.coverUrl}
          width={60}
        />
        <View style={styles.body}>
          <AppText variant="subheading" numberOfLines={2} style={styles.link}>
            {loan.record.title}
          </AppText>
          {loan.record.author ? (
            <AppText muted numberOfLines={1}>
              {loan.record.author}
            </AppText>
          ) : null}
          <Badge label={remaining} color={color} />
          <AppText variant="caption" muted>
            {t('myBooks.checkedOut', { date: formatDate(loan.checkedOutAt) })}
          </AppText>
          <AppText variant="caption" style={{ color, fontWeight: '700' }}>
            {t('myBooks.due', { date: formatDate(loan.dueDate) })}
          </AppText>
          <AppText variant="caption" muted>
            {loan.renewals.max === null
              ? t('myBooks.renewalsNoMax', { count: loan.renewals.count })
              : t('myBooks.renewals', { count: loan.renewals.count, max: loan.renewals.max })}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          label={t('record.title')}
          variant="ghost"
          compact
          icon="book-outline"
          onPress={() => router.push({ pathname: '/record/[id]', params: { id: loan.record.id } })}
        />
        {renewalsEnabled && renewalsExhausted ? (
          <AppText variant="caption" muted style={styles.exhausted}>
            {t('myBooks.noRenewalsLeft')}
          </AppText>
        ) : renewalsEnabled ? (
          <Button
            label={t('myBooks.renew')}
            icon="refresh"
            compact
            onPress={onRenew}
            loading={renew.isPending}
            disabled={!online}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 5, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  body: { flex: 1, gap: 4 },
  link: {},
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exhausted: { fontWeight: '600' },
});
