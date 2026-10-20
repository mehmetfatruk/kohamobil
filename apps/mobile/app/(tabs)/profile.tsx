import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { api } from '../../src/api';
import { Screen } from '../../src/components/Screen';
import { TenantLogo } from '../../src/components/TenantLogo';
import { confirm } from '../../src/components/feedback';
import { AppText, Card, ErrorView, InfoRow, ListItem, LoadingView } from '../../src/components/ui';
import { useProfile } from '../../src/hooks/useApi';
import { errorText } from '../../src/lib/errors';
import { formatDate } from '../../src/lib/format';
import { queryClient } from '../../src/lib/query-client';
import i18n from '../../src/i18n';
import { useSession } from '../../src/state/session';
import { spacing } from '../../src/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
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

  return (
    <Screen safeTop onRefresh={() => void profile.refetch()} refreshing={profile.isRefetching}>
      <AppText variant="title">{t('profile.title')}</AppText>
      {profile.isPending ? (
        <LoadingView />
      ) : profile.isError ? (
        <ErrorView message={errorText(profile.error)} onRetry={() => void profile.refetch()} />
      ) : p ? (
        <Card style={styles.card}>
          <View style={styles.identity}>
            <TenantLogo tenant={tenant} size={52} />
            <View style={styles.flex}>
              <AppText variant="heading">{`${p.firstName} ${p.lastName}`}</AppText>
              <AppText muted>{p.category.name}</AppText>
            </View>
          </View>
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

      <View>
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
      </View>

      <AppText variant="caption" muted style={styles.footer}>
        {`${t('app.name')} · ${t('app.integrationNote')}`}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: 2 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  footer: { textAlign: 'center' },
});
