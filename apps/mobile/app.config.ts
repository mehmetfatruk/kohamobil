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
  // MirAkıl işareti (mirakil web sitesi logosu). Mağaza öncesi vektörel kaynaktan yeniden üretilmeli.
  icon: './assets/brand/icon.png',
  backgroundColor: '#F4F7FB',
  ios: {
    bundleIdentifier: 'tr.com.mirakil.kutuphane',
    supportsTablet: true,
    associatedDomains: ['applinks:app.koha-tr.com'],
  },
  android: {
    package: 'tr.com.mirakil.kutuphane',
    adaptiveIcon: {
      foregroundImage: './assets/brand/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'app.koha-tr.com' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-secure-store',
    [
      'expo-camera',
      { cameraPermission: 'Kurumunuzun QR kodunu okutmak için kamera erişimi gerekir.' },
    ],
  ],
  web: { bundler: 'metro', output: 'single', favicon: './assets/brand/icon.png' },
  experiments: { typedRoutes: true },
  extra: {
    // Herkese açık değer; gizli bilgi değildir. Ortama göre EXPO_PUBLIC_DIRECTORY_URL ile değişir.
    directoryUrl: process.env.EXPO_PUBLIC_DIRECTORY_URL ?? 'https://directory.koha-tr.com',
  },
});
