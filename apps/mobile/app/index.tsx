import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '../src/api';
import { LoadingView } from '../src/components/ui';
import { useSession } from '../src/state/session';

/**
 * Açılış yönlendirmesi (docs/AUTHENTICATION.md §5):
 * kurum yok → karşılama · kurum var, oturum yok → giriş · refresh token var → yenile → Ana Sayfa.
 */
export default function Index() {
  const { tenant, accessToken, refreshToken, updateTokens, signOut } = useSession();
  const [restoring, setRestoring] = useState(Boolean(tenant && refreshToken && !accessToken));

  useEffect(() => {
    if (!restoring || !refreshToken) return;
    api
      .refresh(refreshToken)
      .then(updateTokens)
      .catch(() => signOut())
      .finally(() => setRestoring(false));
  }, [restoring, refreshToken, updateTokens, signOut]);

  if (restoring) return <LoadingView />;
  if (!tenant) return <Redirect href="/welcome" />;
  if (!accessToken) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}
