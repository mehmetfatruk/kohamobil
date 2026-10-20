import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '../api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 2,
      networkMode: 'offlineFirst',
    },
    mutations: { networkMode: 'online', retry: false },
  },
});
