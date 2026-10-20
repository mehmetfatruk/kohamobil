import { DIRECTORY_URL } from '../config';
import { HttpMobileApi } from './http-api';
import { MockMobileApi } from './mock/mock-api';
import type { MobileApi } from './types';
import { getApiContext } from './context';

export * from './types';

/**
 * Veri kaynağı: `EXPO_PUBLIC_DATA_SOURCE=http` → Gateway, aksi halde örnek veri.
 * Arka uç uçları hazır oldukça varsayılan `http` yapılacak.
 */
export const DATA_SOURCE: 'mock' | 'http' =
  process.env.EXPO_PUBLIC_DATA_SOURCE === 'http' ? 'http' : 'mock';

export const api: MobileApi =
  DATA_SOURCE === 'http'
    ? new HttpMobileApi({ directoryUrl: DIRECTORY_URL, ...getApiContext() })
    : new MockMobileApi();
