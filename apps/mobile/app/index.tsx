import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '../src/api';
import { LoadingView } from '../src/components/ui';
import { useSession } from '../src/state/session';

/**
 * Açılış yönlendirmesi (docs/AUTHENTICATION.md §5). Oturum bilgisi yüklenmeden karar verilmez:
 * kurum yok → karşılama · kurum var, oturum yok → (refresh token varsa yenile) → giriş · oturum var → Ana Sayfa.
 */
export default function Index() {
  const { hydrated, tenant, accessToken, refreshToken, updateTokens, signOut } = useSession();
  const [restoreState, setRestoreState] = useState<'idle' | 'running' | 'done'>('idle');
  const needsRestore = hydrated && Boolean(tenant && refreshToken && !accessToken);

  useEffect(() => {
    if (!needsRestore || restoreState !== 'idle' || !refreshToken) return;
    setRestoreState('running');
    api
      .refresh(refreshToken)
      .then(updateTokens)
      .catch(() => signOut())
      .finally(() => setRestoreState('done'));
  }, [needsRestore, restoreState, refreshToken, updateTokens, signOut]);

  if (!hydrated || restoreState === 'running' || (needsRestore && restoreState === 'idle'))
    return <LoadingView />;
  if (!tenant) return <Redirect href="/welcome" />;
  if (!accessToken) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}
