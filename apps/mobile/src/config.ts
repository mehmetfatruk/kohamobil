import Constants from 'expo-constants';

/**
 * Uygulamaya gömülü TEK sunucu adresi: Tenant Directory. Her kurumun Gateway adresi
 * (`apiBaseUrl`) dizinden öğrenilir — CENTRAL ve ON_PREMISE kurumlar aynı uygulamayla çalışır
 * (docs/DEPLOYMENT.md §4).
 */
const extra = Constants.expoConfig?.extra as { directoryUrl?: string } | undefined;

export const DIRECTORY_URL = extra?.directoryUrl ?? 'https://directory.koha-tr.com';
