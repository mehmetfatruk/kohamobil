import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/** TanStack Query'nin çevrim içi durumunu cihaz ağ durumuna bağlar (uygulama açılışında bir kez). */
export function bindOnlineManager() {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
  );
}

/**
 * Çevrim dışıyken yenileme, rezervasyon, iptal ve şifre değiştirme gibi işlemler engellenir;
 * okunabilir veriler önbellekten gösterilir (docs/ARCHITECTURE.md §8).
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(onlineManager.isOnline());
  useEffect(() => onlineManager.subscribe(setOnline), []);
  return online;
}
