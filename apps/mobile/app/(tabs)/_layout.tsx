import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font } from '../../src/fonts';
import { useSummary } from '../../src/hooks/useApi';
import { useSession } from '../../src/state/session';
import { useTheme } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Seçili sekmede dolu, diğerlerinde çizgi ikon. */
const icon =
  (name: IconName, active: IconName) =>
  ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons
      name={focused ? active : name}
      color={typeof color === 'string' ? color : undefined}
      size={size}
    />
  );

/** Alt menü: Ana Sayfa · Katalog · Kitaplarım · Bildirimler · Profil */
export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const features = useSession((s) => s.tenant?.features);
  const unread = useSummary().data?.unreadNotifications ?? 0;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, lineHeight: 16, ...font('600') },
        tabBarItemStyle: { paddingTop: 6, paddingBottom: 4 },
        tabBarBadgeStyle: { backgroundColor: theme.statusDanger, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: theme.scheme === 'dark' ? 1 : 0,
          borderTopColor: theme.border,
          boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.06)',
          height: 66 + insets.bottom,
          paddingTop: 0,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: icon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('tabs.catalog'),
          tabBarIcon: icon('search-outline', 'search'),
          href: features?.catalogSearch === false ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="my-books"
        options={{ title: t('tabs.myBooks'), tabBarIcon: icon('book-outline', 'book') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.notifications'),
          tabBarIcon: icon('notifications-outline', 'notifications'),
          tabBarBadge: unread > 0 ? unread : undefined,
          href: features?.notifications === false ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: icon('person-circle-outline', 'person-circle'),
        }}
      />
    </Tabs>
  );
}
