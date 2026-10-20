import type { LoginResponse, TenantPublicConfig } from '@mirakil/types';
import { create } from 'zustand';

import { secureStorage } from '../lib/secure-storage';

const KEYS = {
  tenant: 'mk.tenant',
  refreshToken: 'mk.refreshToken',
  user: 'mk.user',
} as const;

export interface SessionUser {
  id: string;
  displayName: string;
}

interface SessionState {
  hydrated: boolean;
  tenant: TenantPublicConfig | null;
  /** Access token yalnızca bellekte tutulur; diske yazılmaz. */
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;

  hydrate: () => Promise<void>;
  selectTenant: (tenant: TenantPublicConfig) => Promise<void>;
  signIn: (login: LoginResponse) => Promise<void>;
  updateTokens: (login: LoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
  /** Kurum Değiştir: oturum ve kurum bilgisi cihazdan tamamen silinir. */
  forgetTenant: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  hydrated: false,
  tenant: null,
  accessToken: null,
  refreshToken: null,
  user: null,

  async hydrate() {
    const [tenantJson, refreshToken, userJson] = await Promise.all([
      secureStorage.get(KEYS.tenant),
      secureStorage.get(KEYS.refreshToken),
      secureStorage.get(KEYS.user),
    ]);
    set({
      hydrated: true,
      tenant: tenantJson ? (JSON.parse(tenantJson) as TenantPublicConfig) : null,
      refreshToken,
      user: userJson ? (JSON.parse(userJson) as SessionUser) : null,
    });
  },

  async selectTenant(tenant) {
    await secureStorage.set(KEYS.tenant, JSON.stringify(tenant));
    set({ tenant });
  },

  async signIn(login) {
    await Promise.all([
      secureStorage.set(KEYS.refreshToken, login.refreshToken),
      secureStorage.set(KEYS.user, JSON.stringify(login.user)),
    ]);
    set({ accessToken: login.accessToken, refreshToken: login.refreshToken, user: login.user });
  },

  async updateTokens(login) {
    await secureStorage.set(KEYS.refreshToken, login.refreshToken);
    set({ accessToken: login.accessToken, refreshToken: login.refreshToken });
  },

  async signOut() {
    await Promise.all([secureStorage.remove(KEYS.refreshToken), secureStorage.remove(KEYS.user)]);
    set({ accessToken: null, refreshToken: null, user: null });
  },

  async forgetTenant() {
    await Promise.all(Object.values(KEYS).map((key) => secureStorage.remove(key)));
    set({ tenant: null, accessToken: null, refreshToken: null, user: null });
  },
}));
