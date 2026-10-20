import type { NotificationPreferences, PlaceHoldRequest, SearchField } from '@mirakil/types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '../api';
import { useSession } from '../state/session';

/** Sorgu anahtarları kurum ve kullanıcıya bağlıdır; kurum değişince karışma olmaz. */
function useScope() {
  const tenant = useSession((s) => s.tenant?.code ?? '-');
  const user = useSession((s) => s.user?.id ?? '-');
  return [tenant, user] as const;
}

export const PAGE_SIZE = 20;

export function useSummary() {
  return useQuery({ queryKey: [...useScope(), 'summary'], queryFn: () => api.getSummary() });
}

export function useProfile() {
  return useQuery({ queryKey: [...useScope(), 'profile'], queryFn: () => api.getProfile() });
}

export function useLoans() {
  return useQuery({ queryKey: [...useScope(), 'loans'], queryFn: () => api.getLoans() });
}

export function useHolds() {
  return useQuery({ queryKey: [...useScope(), 'holds'], queryFn: () => api.getHolds() });
}

export function useFines() {
  return useQuery({ queryKey: [...useScope(), 'fines'], queryFn: () => api.getFines() });
}

export function useNotifications() {
  return useQuery({
    queryKey: [...useScope(), 'notifications'],
    queryFn: () => api.getNotifications(),
  });
}

export function useLibraries() {
  return useQuery({
    queryKey: [...useScope(), 'libraries'],
    queryFn: () => api.getLibraries(),
    staleTime: 3_600_000,
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: [...useScope(), 'announcements'],
    queryFn: () => api.getAnnouncements(),
  });
}

export function useItemTypes() {
  return useQuery({
    queryKey: [...useScope(), 'itemTypes'],
    queryFn: () => api.getItemTypes(),
    staleTime: 3_600_000,
  });
}

export function useNewArrivals(limit = 10) {
  return useQuery({
    queryKey: [...useScope(), 'newArrivals', limit],
    queryFn: () => api.getNewArrivals({ page: 1, limit }),
  });
}

export function useRecord(recordId: string) {
  return useQuery({
    queryKey: [...useScope(), 'record', recordId],
    queryFn: () => api.getRecord(recordId),
  });
}

export function useRecordItems(recordId: string) {
  return useQuery({
    queryKey: [...useScope(), 'recordItems', recordId],
    queryFn: () => api.getRecordItems(recordId),
  });
}

export function usePickupLibraries(recordId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...useScope(), 'pickup', recordId],
    queryFn: () => api.getPickupLibraries(recordId),
    enabled,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: [...useScope(), 'prefs'],
    queryFn: () => api.getNotificationPreferences(),
  });
}

export type CatalogQuery =
  { kind: 'search'; q: string; field: SearchField; itemType?: string } | { kind: 'newArrivals' };

export function useCatalogList(query: CatalogQuery | null) {
  return useInfiniteQuery({
    queryKey: [...useScope(), 'catalog', query],
    enabled: query !== null,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      if (!query) throw new Error('query yok');
      return query.kind === 'newArrivals'
        ? api.getNewArrivals({ page: pageParam, limit: PAGE_SIZE })
        : api.search({ ...query, page: pageParam, limit: PAGE_SIZE });
    },
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
}

// ── Yazma işlemleri (yalnızca çevrim içi) ───────────────────────────────────

function useInvalidate() {
  const client = useQueryClient();
  const scope = useScope();
  return (...keys: string[]) =>
    Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: [...scope, key] })));
}

export function useRenewLoan() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (loanId: string) => {
      // Yenilemeden önce Koha'nın izin verip vermediği sorulur (docs/KOHA_INTEGRATION.md §6)
      const check = await api.checkRenewability(loanId);
      if (!check.renewable && check.reason) throw new ApiError(check.reason, 409);
      return api.renewLoan(loanId);
    },
    onSettled: () => invalidate('loans', 'summary'),
  });
}

export function usePlaceHold() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (request: PlaceHoldRequest) => api.placeHold(request),
    onSuccess: () => invalidate('holds', 'summary', 'recordItems'),
  });
}

export function useCancelHold() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (holdId: string) => api.cancelHold(holdId),
    onSuccess: () => invalidate('holds', 'summary'),
  });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidate();
  return useMutation({
    /** `null` → tümünü okundu yap */
    mutationFn: (id: string | null) =>
      id === null ? api.markAllNotificationsRead() : api.markNotificationRead(id),
    onSuccess: () => invalidate('notifications', 'summary'),
  });
}

export function useUpdatePreferences() {
  const client = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: (prefs: NotificationPreferences) => api.updateNotificationPreferences(prefs),
    onSuccess: (prefs) => client.setQueryData([...scope, 'prefs'], prefs),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      api.changePassword(current, next),
  });
}
