import i18n from 'i18next';

import { useSession } from '../state/session';

/** HTTP istemcisinin oturum bilgisine erişimi (döngüsel import olmadan, çağrı anında okunur). */
export const getApiContext = () => ({
  getApiBaseUrl: () => useSession.getState().tenant?.apiBaseUrl ?? null,
  getAccessToken: () => useSession.getState().accessToken,
  getLocale: () => i18n.language || 'tr',
});
