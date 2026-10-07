import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Uygulama ve mağaza adı: "MirAkıl Kütüphane" (D6). "Koha" ana marka olarak kullanılmaz.
 * Bu dosyada secret BULUNMAZ: FCM/APNs kimlik bilgileri ve imza anahtarları EAS credentials /
 * EAS Secrets üzerinden verilir (docs/DEPLOYMENT.md §8).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MirAkıl Kütüphane',
  slug: 'mirakil-kutuphane',
  scheme: 'mirakil',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'tr.com.mirakil.kutuphane',
    supportsTablet: true,
    associatedDomains: ['applinks:app.koha-tr.com'],
  },
  android: {
    package: 'tr.com.mirakil.kutuphane',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'app.koha-tr.com' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: ['expo-router', 'expo-localization'],
  experiments: { typedRoutes: true },
  extra: {
    // Herkese açık değer; gizli bilgi değildir. Ortama göre EXPO_PUBLIC_DIRECTORY_URL ile değişir.
    directoryUrl: process.env.EXPO_PUBLIC_DIRECTORY_URL ?? 'https://directory.koha-tr.com',
  },
});
