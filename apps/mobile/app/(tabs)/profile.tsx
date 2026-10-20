import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { api } from '../../src/api';
import { Screen } from '../../src/components/Screen';
import { TenantLogo } from '../../src/components/TenantLogo';
import { confirm } from '../../src/components/feedback';
import { Hero } from '../../src/components/Hero';
import {
  AppText,
  Card,
  ErrorView,
  InfoRow,
  ListGroup,
  ListItem,
  LoadingView,
} from '../../src/components/ui';
import { useProfile } from '../../src/hooks/useApi';
import { errorText } from '../../src/lib/errors';
import { formatDate } from '../../src/lib/format';
import { queryClient } from '../../src/lib/query-client';
import i18n from '../../src/i18n';
import { useSession } from '../../src/state/session';
import { spacing, useTheme } from '../../src/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const profile = useProfile();
  const { tenant, signOut, forgetTenant } = useSession();
  if (!tenant) return null;
  const { features } = tenant;

  const logout = async () => {
    if (
      !(await confirm(
        t('profile.logout'),
        t('profile.logoutConfirm'),
        t('profile.logout'),
        t('common.cancel'),
      ))
    )
      return;
    await api.logout().catch(() => undefined);
    await signOut();
    queryClient.clear();
    router.replace('/login');
  };

  const changeTenant = async () => {
    if (
      !(await confirm(
        t('profile.changeTenant'),
        t('profile.changeTenantConfirm'),
        t('common.confirm'),
        t('common.cancel'),
      ))
    )
      return;
    await api.logout().catch(() => undefined);
    await forgetTenant();
    queryClient.clear();
    router.replace('/select-tenant');
  };

  const toggleLanguage = () => void i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr');
  const p = profile.data;

  const initials = p ? `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toLocaleUpperCase('tr') : '';
  const glass = theme.onHero === '#FFFFFF' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';

  const hero = (
    <Hero style={styles.hero}>
      <AppText variant="overline" color={theme.onHero} style={styles.dim}>
        {t('profile.title').toLocaleUpperCase('tr')}
      </AppText>
      {p ? (
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: glass }]}>
            <AppText variant="heading" color={theme.onHero}>
              {initials}
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="title" color={theme.onHero} numberOfLines={2}>
              {`${p.firstName} ${p.lastName}`}
            </AppText>
            <AppText color={theme.onHero} style={styles.dim}>
              {p.category.name}
            </AppText>
          </View>
        </View>
      ) : null}
      <View style={[styles.tenantChip, { backgroundColor: glass }]}>
        <TenantLogo tenant={tenant} size={22} color="#FFFFFF" textColor={theme.heroEnd} />
        <AppText variant="caption" color={theme.onHero} numberOfLines={1} style={styles.bold}>
          {tenant.name}
        </AppText>
      </View>
    </Hero>
  );

  return (
    <Screen
      safeTop
      hero={hero}
      onRefresh={() => void profile.refetch()}
      refreshing={profile.isRefetching}
    >
      {profile.isPending ? (
        <Card>
          <LoadingView />
        </Card>
      ) : profile.isError ? (
        <Card>
          <ErrorView message={errorText(profile.error)} onRetry={() => void profile.refetch()} />
        </Card>
      ) : p ? (
        <Card style={styles.card}>
          <InfoRow label={t('profile.cardNumber')} value={p.cardNumber} />
          <InfoRow label={t('profile.email')} value={p.email} />
          <InfoRow label={t('profile.phone')} value={p.phone} />
          <InfoRow label={t('profile.faculty')} value={p.faculty} />
          <InfoRow label={t('profile.department')} value={p.department} />
          <InfoRow label={t('profile.homeLibrary')} value={p.homeLibrary.name} />
          <InfoRow label={t('profile.membershipStart')} value={formatDate(p.membershipStart)} />
          <InfoRow label={t('profile.membershipEnd')} value={formatDate(p.membershipEnd)} />
        </Card>
      ) : null}

      <ListGroup>
        {features.digitalCard ? (
          <ListItem
            icon="barcode-outline"
            label={t('profile.digitalCard')}
            onPress={() => router.push('/card')}
          />
        ) : null}
        <ListItem
          icon="business-outline"
          label={t('profile.libraries')}
          onPress={() => router.push('/libraries')}
        />
        {features.announcements ? (
          <ListItem
            icon="megaphone-outline"
            label={t('profile.announcements')}
            onPress={() => router.push('/announcements')}
          />
        ) : null}
        {features.notifications ? (
          <ListItem
            icon="notifications-outline"
            label={t('profile.notificationPrefs')}
            onPress={() => router.push('/notification-preferences')}
          />
        ) : null}
        {features.passwordChange ? (
          <ListItem
            icon="key-outline"
            label={t('profile.changePassword')}
            onPress={() => router.push('/change-password')}
          />
        ) : null}
        <ListItem
          icon="language-outline"
          label={t('profile.language')}
          trailing={t(`language.${i18n.language === 'en' ? 'en' : 'tr'}`)}
          onPress={toggleLanguage}
        />
      </ListGroup>

      <ListGroup>
        <ListItem
          icon="swap-horizontal-outline"
          label={t('profile.changeTenant')}
          onPress={() => void changeTenant()}
        />
        <ListItem
          icon="log-out-outline"
          label={t('profile.logout')}
          destructive
          onPress={() => void logout()}
        />
      </ListGroup>

      <AppText variant="caption" muted style={styles.footer}>
        {`${t('app.name')} · ${t('app.integrationNote')}`}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700', flexShrink: 1 },
  dim: { opacity: 0.85 },
  hero: { paddingBottom: spacing.xxl + spacing.lg },
  card: { gap: 2 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 999,
    maxWidth: '100%',
  },
  footer: { textAlign: 'center' },
});
