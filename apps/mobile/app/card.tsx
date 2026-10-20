import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import markWhite from '../assets/brand/mark-white.png';
import { Barcode39 } from '../src/components/Barcode39';
import { Screen } from '../src/components/Screen';
import { TenantLogo } from '../src/components/TenantLogo';
import { AppText, ErrorView, LoadingView } from '../src/components/ui';
import { useProfile } from '../src/hooks/useApi';
import { errorText } from '../src/lib/errors';
import { formatDate } from '../src/lib/format';
import { useSession } from '../src/state/session';
import { elevation, radius, spacing, useTheme } from '../src/theme';

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
      <LinearGradient
        colors={[theme.heroStart, theme.heroMid, theme.heroEnd]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { width: cardWidth }]}
      >
        <View pointerEvents="none" style={styles.ring} />
        <View style={styles.cardHeader}>
          <TenantLogo tenant={tenant} size={40} color="#FFFFFF" textColor={theme.heroEnd} />
          <AppText variant="subheading" color={theme.onHero} style={styles.flex} numberOfLines={2}>
            {tenant.name}
          </AppText>
          <Image
            source={markWhite}
            style={styles.mark}
            resizeMode="contain"
            accessibilityLabel="MirAkıl"
          />
        </View>
        <AppText variant="overline" color={theme.onHero} style={styles.dim}>
          {t('card.title').toLocaleUpperCase('tr')}
        </AppText>
        <AppText variant="title" color={theme.onHero}>{`${p.firstName} ${p.lastName}`}</AppText>
        <AppText color={theme.onHero} style={styles.dim}>
          {p.category.name}
        </AppText>
        <View style={styles.codes}>
          <Barcode39 value={p.cardNumber} width={cardWidth - spacing.lg * 4} />
          <AppText variant="heading" color="#000" style={styles.number}>
            {p.cardNumber}
          </AppText>
        </View>
        <AppText variant="caption" color={theme.onHero} style={styles.dim}>
          {t('card.validUntil', { date: formatDate(p.membershipEnd) })}
        </AppText>
      </LinearGradient>
      <View style={[styles.qr, elevation(theme)]}>
        <QRCode value={p.cardNumber} size={150} />
      </View>
      <View style={styles.hint}>
        <Ionicons name="scan" size={18} color={theme.textMuted} />
        <AppText muted style={styles.flex}>
          {t('card.hint')}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dim: { opacity: 0.85 },
  mark: { width: 30, height: 25, opacity: 0.9 },
  card: {
    alignSelf: 'center',
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: 4,
    overflow: 'hidden',
    boxShadow: '0 16px 32px rgba(15, 23, 42, 0.22)',
  },
  ring: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -110,
    right: -80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
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
  qr: {
    alignSelf: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
});
