import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { useSummary } from '../../src/hooks/useApi';
import { useSession } from '../../src/state/session';
import { useTheme } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={size} />
  );

/** Alt menü: Ana Sayfa · Katalog · Kitaplarım · Bildirimler · Profil */
export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const signedIn = useSession((s) => Boolean(s.accessToken && s.tenant));
  const features = useSession((s) => s.tenant?.features);
  const unread = useSummary().data?.unreadNotifications ?? 0;

  if (!signedIn) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: icon('home-outline') }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('tabs.catalog'),
          tabBarIcon: icon('search-outline'),
          href: features?.catalogSearch === false ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="my-books"
        options={{ title: t('tabs.myBooks'), tabBarIcon: icon('book-outline') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.notifications'),
          tabBarIcon: icon('notifications-outline'),
          tabBarBadge: unread > 0 ? unread : undefined,
          href: features?.notifications === false ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: icon('person-circle-outline') }}
      />
    </Tabs>
  );
}
