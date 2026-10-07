/**
 * Yetenek (capability) sözlüğü.
 *
 * Uyumluluk kararları Koha SÜRÜM NUMARASINA göre değil, Koha'nın gerçekten sunduğu
 * uçlara göre verilir (docs/KOHA_INTEGRATION.md §2). REST yetenekleri Koha'nın kendi
 * OpenAPI spec'inden (`GET /api/v1/`) çıkarılır; eklenti rotaları da bu spec'te yer alır.
 */

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface SpecRule {
  method: HttpMethod;
  /** `/api/v1` sonrası yol; parametre adları önemsizdir (`{patron_id}` ≡ `{id}`). */
  path: string;
  /** Uç mevcut olmanın yanında istek gövdesinde bu alan da olmalı. */
  bodyField?: string;
  /** Uç mevcut olmanın yanında bu query parametresi de tanımlı olmalı. */
  queryParam?: string;
}

export const SPEC_CAPABILITIES = {
  // Servis kimlik doğrulaması
  'rest.oauth.token': { method: 'post', path: '/oauth/token' },

  // Patron kimlik doğrulaması ve profil
  'rest.auth.passwordValidation': { method: 'post', path: '/auth/password/validation' },
  'rest.auth.passwordValidation.identifier': {
    method: 'post',
    path: '/auth/password/validation',
    bodyField: 'identifier',
  },
  'rest.patrons.list': { method: 'get', path: '/patrons' },
  'rest.patrons.get': { method: 'get', path: '/patrons/{}' },
  'rest.patrons.password.set': { method: 'post', path: '/patrons/{}/password' },
  'rest.patronCategories.list': { method: 'get', path: '/patron_categories' },

  // Borç
  'rest.patrons.account': { method: 'get', path: '/patrons/{}/account' },
  'rest.patrons.account.debits': { method: 'get', path: '/patrons/{}/account/debits' },

  // Ödünç
  'rest.checkouts.list': { method: 'get', path: '/checkouts' },
  'rest.checkouts.list.checkedIn': { method: 'get', path: '/checkouts', queryParam: 'checked_in' },
  'rest.checkouts.get': { method: 'get', path: '/checkouts/{}' },
  'rest.checkouts.allowsRenewal': { method: 'get', path: '/checkouts/{}/allows_renewal' },
  'rest.checkouts.renewal': { method: 'post', path: '/checkouts/{}/renewal' },
  'rest.checkouts.renewals': { method: 'post', path: '/checkouts/{}/renewals' },

  // Rezervasyon
  'rest.holds.list': { method: 'get', path: '/holds' },
  'rest.holds.create': { method: 'post', path: '/holds' },
  'rest.holds.delete': { method: 'delete', path: '/holds/{}' },
  'rest.biblios.pickupLocations': { method: 'get', path: '/biblios/{}/pickup_locations' },
  'rest.items.pickupLocations': { method: 'get', path: '/items/{}/pickup_locations' },

  // Katalog
  'rest.biblios.get': { method: 'get', path: '/biblios/{}' },
  'rest.biblios.items': { method: 'get', path: '/biblios/{}/items' },
  'rest.items.get': { method: 'get', path: '/items/{}' },
  'rest.itemTypes.list': { method: 'get', path: '/item_types' },
  'rest.authorisedValues.list': {
    method: 'get',
    path: '/authorised_value_categories/{}/authorised_values',
  },

  // Kütüphane
  'rest.libraries.list': { method: 'get', path: '/libraries' },

  // MirAkıl Koha eklentisi (api_namespace = mirakil)
  'plugin.info': { method: 'get', path: '/contrib/mirakil/info' },
  'plugin.auth.validate': { method: 'post', path: '/contrib/mirakil/auth/validate' },
  'plugin.search': { method: 'get', path: '/contrib/mirakil/search' },
  'plugin.renewability': { method: 'get', path: '/contrib/mirakil/patrons/{}/renewability' },
  'plugin.holds.history': { method: 'get', path: '/contrib/mirakil/patrons/{}/holds/history' },
  'plugin.account.lines': { method: 'get', path: '/contrib/mirakil/patrons/{}/account/lines' },
  'plugin.password.change': { method: 'post', path: '/contrib/mirakil/patrons/{}/password' },
  'plugin.notices.due': { method: 'get', path: '/contrib/mirakil/notices/due' },
} as const satisfies Record<string, SpecRule>;

export type SpecCapabilityId = keyof typeof SPEC_CAPABILITIES;

/**
 * Spec dışından tespit edilen yetenekler:
 * - `service.basicAuth`: tenant yapılandırmasında Basic auth seçildi (RESTBasicAuth).
 * - `ilsdi.*`: ILS-DI `Describe` yanıtından (yalnızca ILS-DI stratejisi gerekirse).
 */
export const EXTERNAL_CAPABILITIES = [
  'service.basicAuth',
  'ilsdi.AuthenticatePatron',
  'ilsdi.RenewLoan',
] as const;
export type ExternalCapabilityId = (typeof EXTERNAL_CAPABILITIES)[number];

export type CapabilityId = SpecCapabilityId | ExternalCapabilityId;
export type Capabilities = ReadonlySet<CapabilityId>;
