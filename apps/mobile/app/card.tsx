import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Barcode39 } from '../src/components/Barcode39';
import { Screen } from '../src/components/Screen';
import { TenantLogo } from '../src/components/TenantLogo';
import { AppText, ErrorView, LoadingView } from '../src/components/ui';
import { useProfile } from '../src/hooks/useApi';
import { errorText } from '../src/lib/errors';
import { formatDate } from '../src/lib/format';
import { useSession } from '../src/state/session';
import { radius, spacing, useTheme } from '../src/theme';

/** Dijital kütüphane kartı: Code 39 barkod (banko okuyucuları) + QR. */
export default function DigitalCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const tenant = useSession((s) => s.tenant);
  const profile = useProfile();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.lg * 2, 420);

  if (!tenant) return null;
  if (profile.isPending) return <LoadingView />;
  if (profile.isError)
    return <ErrorView message={errorText(profile.error)} onRetry={() => void profile.refetch()} />;
  const p = profile.data;

  return (
    <Screen>
      <View style={[styles.card, { width: cardWidth, backgroundColor: theme.primary }]}>
        <View style={styles.cardHeader}>
          <TenantLogo tenant={tenant} size={40} color={theme.secondary} />
          <AppText
            variant="subheading"
            color={theme.onPrimary}
            style={styles.flex}
            numberOfLines={2}
          >
            {tenant.name}
          </AppText>
        </View>
        <AppText
          variant="heading"
          color={theme.onPrimary}
        >{`${p.firstName} ${p.lastName}`}</AppText>
        <AppText color={theme.onPrimary}>{p.category.name}</AppText>
        <View style={styles.codes}>
          <Barcode39 value={p.cardNumber} width={cardWidth - spacing.lg * 4} />
          <AppText variant="heading" color="#000" style={styles.number}>
            {p.cardNumber}
          </AppText>
        </View>
        <AppText variant="caption" color={theme.onPrimary}>
          {t('card.validUntil', { date: formatDate(p.membershipEnd) })}
        </AppText>
      </View>
      <View style={[styles.qr, { backgroundColor: '#FFFFFF' }]}>
        <QRCode value={p.cardNumber} size={160} />
      </View>
      <AppText muted style={styles.center}>
        {t('card.hint')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { alignSelf: 'center', borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  codes: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  number: { letterSpacing: 3 },
  qr: { alignSelf: 'center', padding: spacing.md, borderRadius: radius.md },
  center: { textAlign: 'center' },
});
