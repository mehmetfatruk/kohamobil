import Constants from 'expo-constants';

/**
 * Uygulamaya gömülü TEK sunucu adresi: Tenant Directory. Her kurumun Gateway adresi
 * (`apiBaseUrl`) dizinden öğrenilir — CENTRAL ve ON_PREMISE kurumlar aynı uygulamayla çalışır
 * (docs/DEPLOYMENT.md §4).
 *
 * `EXPO_PUBLIC_*` değişkenleri paketleme sırasında koda gömülür (gizli bilgi DEĞİLDİR).
 * Yerel geliştirmede `pnpm local:setup` bunu bilgisayarın yerel ağ adresine ayarlar.
 */
const extra = Constants.expoConfig?.extra as { directoryUrl?: string } | undefined;

export const DIRECTORY_URL =
  process.env.EXPO_PUBLIC_DIRECTORY_URL ?? extra?.directoryUrl ?? 'https://directory.koha-tr.com';
