import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Hassas değerler (refresh token, seçili kurum) için güvenli depolama:
 * iOS Keychain / Android Keystore (docs/AUTHENTICATION.md §5).
 * Web yalnızca geliştirme önizlemesi içindir; orada tarayıcı belleği kullanılır.
 */
const webStore = new Map<string, string>();

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webStore.get(key) ?? null;
    return SecureStore.getItemAsync(key, options);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStore.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, options);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStore.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key, options);
  },
};
