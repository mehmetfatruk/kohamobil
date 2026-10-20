import '../src/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '../src/components/feedback';
import { LoadingView } from '../src/components/ui';
import { bindOnlineManager } from '../src/hooks/useOnline';
import { queryClient } from '../src/lib/query-client';
import { useSession } from '../src/state/session';
import { useTheme } from '../src/theme';

bindOnlineManager();

function AppStack() {
  const theme = useTheme();
  const { t } = useTranslation();
  const hydrated = useSession((s) => s.hydrated);
  const hydrate = useSession((s) => s.hydrate);
  const signedIn = useSession((s) => Boolean(s.accessToken && s.tenant));
  const hasTenant = useSession((s) => Boolean(s.tenant));

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Gezinme yapısı HER ZAMAN çizilir (Expo Router gereksinimi); oturum bilgisi yüklenene kadar
  // üstte bir yükleme katmanı gösterilir. Erişim kontrolü yönlendirmelerle değil korumalı
  // ekran gruplarıyla yapılır — böylece yönlendirme döngüsü oluşamaz.
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
          headerTitleStyle: { color: theme.text },
          headerShadowVisible: false,
          headerBackTitle: t('common.back'),
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Yönlendirme hedefleri doğrudan son ekranlardır; ara yönlendirme yapan "/" kullanılmaz
            (iç içe yönlendirme web'de güncelleme döngüsüne yol açıyordu). */}
        <Stack.Protected guard={!signedIn} redirectTo="/(tabs)">
          <Stack.Screen name="(onboarding)/welcome" options={{ headerShown: false }} />
          <Stack.Screen
            name="(onboarding)/select-tenant"
            options={{ title: t('onboarding.selectTenant') }}
          />
          <Stack.Screen
            name="(onboarding)/scan"
            options={{ title: t('onboarding.scanQr'), presentation: 'modal' }}
          />
          <Stack.Screen name="(onboarding)/login" options={{ title: t('auth.title') }} />
        </Stack.Protected>

        <Stack.Protected guard={signedIn} redirectTo={hasTenant ? '/login' : '/welcome'}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="record/[id]" options={{ title: t('record.title') }} />
          <Stack.Screen name="browse" options={{ title: t('catalog.newArrivalsTitle') }} />
          <Stack.Screen name="card" options={{ title: t('card.title'), presentation: 'modal' }} />
          <Stack.Screen name="libraries" options={{ title: t('libraries.title') }} />
          <Stack.Screen name="announcements" options={{ title: t('announcements.title') }} />
          <Stack.Screen name="notification-preferences" options={{ title: t('prefs.title') }} />
          <Stack.Screen name="change-password" options={{ title: t('password.title') }} />
        </Stack.Protected>
      </Stack>
      {!hydrated ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
          <LoadingView />
        </View>
      ) : null}
      <ToastHost />
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppStack />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
