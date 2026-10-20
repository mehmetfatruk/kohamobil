import { parseTenantLookup, type TenantDirectoryEntry } from '@mirakil/types';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '../api';
import { toast } from '../components/feedback';
import { errorText } from '../lib/errors';
import { queryClient } from '../lib/query-client';
import { useSession } from '../state/session';

/**
 * Kurum seçimi: listeden, kurum kodu / alan adı ile veya QR ile.
 * Girilen değer yalnızca Tenant Directory'de KAYITLI kurumu bulmak için kullanılır;
 * uygulama hiçbir zaman girilen adrese doğrudan bağlanmaz.
 */
export function useTenantSelection() {
  const { t } = useTranslation();
  const selectTenant = useSession((s) => s.selectTenant);
  const [busy, setBusy] = useState(false);

  const choose = async (entry: TenantDirectoryEntry) => {
    setBusy(true);
    try {
      const config = await api.getTenantConfig(entry);
      queryClient.clear();
      await selectTenant(config);
      router.replace('/login');
    } catch (error) {
      toast(errorText(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  /** @returns false: girdi geçersiz veya kurum bulunamadı */
  const resolve = async (input: string): Promise<boolean> => {
    const lookup = parseTenantLookup(input);
    if (!lookup) {
      toast(t('onboarding.invalidCode'), 'error');
      return false;
    }
    setBusy(true);
    try {
      const entry = await api.lookupTenant(lookup);
      if (!entry) {
        toast(t('onboarding.notFound'), 'error');
        return false;
      }
      await choose(entry);
      return true;
    } catch (error) {
      toast(errorText(error), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { busy, choose, resolve };
}
