import { Ionicons } from '@expo/vector-icons';
import type { Loan } from '@mirakil/types';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useRenewLoan } from '../hooks/useApi';
import { useOnline } from '../hooks/useOnline';
import { errorText } from '../lib/errors';
import { formatDate } from '../lib/format';
import { useSession } from '../state/session';
import { radius, spacing, useTheme } from '../theme';
import { Cover } from './Cover';
import { toast } from './feedback';
import { AppText, Badge, Button, Card, ProgressBar } from './ui';

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

  // Ödünç süresinin ne kadarının geçtiği (iade tarihine yaklaştıkça dolar)
  const start = new Date(loan.checkedOutAt).getTime();
  const end = new Date(loan.dueDate).getTime();
  const elapsed = end > start ? (Date.now() - start) / (end - start) : 1;
  const soft = {
    OK: theme.statusOkSoft,
    DUE_SOON: theme.statusWarningSoft,
    OVERDUE: theme.statusDangerSoft,
  }[loan.status];
  const statusIcon = { OK: 'checkmark-circle', DUE_SOON: 'time', OVERDUE: 'alert-circle' } as const;

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/record/[id]', params: { id: loan.record.id } })}
        style={styles.row}
      >
        <Cover
          id={loan.record.id}
          title={loan.record.title}
          author={loan.record.author}
          uri={loan.record.coverUrl}
          width={64}
        />
        <View style={styles.body}>
          <AppText variant="subheading" numberOfLines={2}>
            {loan.record.title}
          </AppText>
          {loan.record.author ? (
            <AppText muted numberOfLines={1}>
              {loan.record.author}
            </AppText>
          ) : null}
          <Badge label={remaining} color={color} icon={statusIcon[loan.status]} />
        </View>
      </Pressable>

      <View style={[styles.due, { backgroundColor: soft }]}>
        <View style={styles.dueRow}>
          <AppText variant="caption" muted>
            {t('myBooks.checkedOut', { date: formatDate(loan.checkedOutAt) })}
          </AppText>
          <AppText variant="caption" color={color} style={styles.bold}>
            {t('myBooks.due', { date: formatDate(loan.dueDate) })}
          </AppText>
        </View>
        <ProgressBar value={elapsed} color={color} />
      </View>

      <View style={styles.actions}>
        <View style={styles.renewals}>
          <Ionicons name="repeat" size={16} color={theme.textMuted} />
          <AppText variant="caption" muted>
            {loan.renewals.max === null
              ? t('myBooks.renewalsNoMax', { count: loan.renewals.count })
              : t('myBooks.renewals', { count: loan.renewals.count, max: loan.renewals.max })}
          </AppText>
        </View>
        {renewalsEnabled && renewalsExhausted ? (
          <AppText variant="caption" muted style={styles.bold}>
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
  card: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  body: { flex: 1, gap: 6 },
  due: { borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  dueRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 38,
  },
  renewals: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bold: { fontWeight: '700' },
});
