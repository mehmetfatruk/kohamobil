import { router } from 'expo-router';
import i18n from 'i18next';

import { useSession } from '../state/session';

/** HTTP istemcisinin oturum bilgisine erişimi (döngüsel import olmadan, çağrı anında okunur). */
export const getApiContext = () => ({
  getApiBaseUrl: () => useSession.getState().tenant?.apiBaseUrl ?? null,
  getAccessToken: () => useSession.getState().accessToken,
  getRefreshToken: () => useSession.getState().refreshToken,
  onTokens: (login: Parameters<ReturnType<typeof useSession.getState>['updateTokens']>[0]) =>
    useSession.getState().updateTokens(login),
  onSessionExpired: async () => {
    await useSession.getState().signOut();
    router.replace('/login');
  },
  getLocale: () => i18n.language || 'tr',
});
