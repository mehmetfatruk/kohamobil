import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../src/theme';

/** Alt menü: Ana Sayfa · Katalog · Kitaplarım · Bildirimler · Profil. Faz 2'de feature flag'e göre. */
export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="catalog" options={{ title: t('tabs.catalog') }} />
      <Tabs.Screen name="my-books" options={{ title: t('tabs.myBooks') }} />
      <Tabs.Screen name="notifications" options={{ title: t('tabs.notifications') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
