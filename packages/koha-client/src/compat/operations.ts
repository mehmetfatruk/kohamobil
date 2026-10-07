import type { CapabilityId } from '../capabilities/catalog.js';

/**
 * Gateway işlemleri ve her işlem için ÖNCELİK SIRALI strateji listesi.
 *
 * Koha sürümleri arasındaki tüm farklar burada (ve stratejilerin implementasyonlarında)
 * yönetilir; Gateway modülleri yalnızca işlem adını bilir. Yeni bir Koha sürümü farklı bir
 * uç sunarsa mevcut kod değiştirilmez, ilgili işleme yeni bir strateji eklenir.
 */

export interface StrategyDefinition {
  /** Kararlı strateji kimliği — `compat_profile` içinde saklanır. */
  id: string;
  /** Stratejinin çalışması için gereken TÜM yetenekler. */
  requires: readonly CapabilityId[];
  description: string;
}

export interface OperationDefinition {
  /**
   * `core`: yoksa tenant UNSUPPORTED.
   * `mvp`: yoksa tenant LIMITED (ilgili özellik otomatik kapanır).
   * `optional`: yoksa yalnızca ilgili özellik kapanır, seviye etkilenmez.
   */
  tier: 'core' | 'mvp' | 'optional';
  strategies: readonly StrategyDefinition[];
}

const op = (tier: OperationDefinition['tier'], strategies: StrategyDefinition[]) => ({
  tier,
  strategies,
});

export const OPERATIONS = {
  // ── Zorunlu çekirdek ─────────────────────────────────────────────────────────
  'service.authenticate': op('core', [
    {
      id: 'rest.oauth2ClientCredentials',
      requires: ['rest.oauth.token'],
      description: 'OAuth2 client credentials',
    },
    {
      id: 'rest.basicAuth',
      requires: ['service.basicAuth'],
      description: 'HTTP Basic (RESTBasicAuth)',
    },
  ]),
  'patron.validateCredentials': op('core', [
    {
      id: 'plugin.authValidate',
      requires: ['plugin.auth.validate'],
      description: 'MirAkıl eklentisi ile doğrulama',
    },
    {
      id: 'rest.passwordValidation.identifier',
      requires: ['rest.auth.passwordValidation.identifier'],
      description: 'Tek `identifier` alanı (kullanıcı adı veya kart no)',
    },
    {
      id: 'rest.passwordValidation.userid',
      requires: ['rest.auth.passwordValidation'],
      description: 'Önce `userid`, başarısızsa `cardnumber` ile denenir',
    },
    {
      id: 'ilsdi.authenticatePatron',
      requires: ['ilsdi.AuthenticatePatron', 'rest.patrons.list'],
      description: 'ILS-DI AuthenticatePatron + REST patron araması',
    },
  ]),
  'patron.get': op('core', [
    { id: 'rest.patrons.get', requires: ['rest.patrons.get'], description: 'GET /patrons/{id}' },
  ]),
  'loans.list': op('core', [
    {
      id: 'rest.checkouts.list',
      requires: ['rest.checkouts.list'],
      description: 'GET /checkouts?patron_id=',
    },
  ]),

  // ── MVP ──────────────────────────────────────────────────────────────────────
  'loans.renewability': op('mvp', [
    {
      id: 'rest.checkouts.allowsRenewal',
      requires: ['rest.checkouts.allowsRenewal'],
      description: 'GET /checkouts/{id}/allows_renewal',
    },
  ]),
  'loans.renewabilityBulk': op('optional', [
    {
      id: 'plugin.renewability',
      requires: ['plugin.renewability'],
      description: 'Tek çağrıda tüm ödünçler',
    },
    {
      id: 'rest.checkouts.allowsRenewal.each',
      requires: ['rest.checkouts.allowsRenewal'],
      description: 'Ödünç başına paralel çağrı',
    },
  ]),
  'loans.renew': op('mvp', [
    {
      id: 'rest.checkouts.renewals',
      requires: ['rest.checkouts.renewals'],
      description: 'POST /checkouts/{id}/renewals',
    },
    {
      id: 'rest.checkouts.renewal',
      requires: ['rest.checkouts.renewal'],
      description: 'POST /checkouts/{id}/renewal',
    },
    { id: 'ilsdi.renewLoan', requires: ['ilsdi.RenewLoan'], description: 'ILS-DI RenewLoan' },
  ]),
  'holds.list': op('mvp', [
    { id: 'rest.holds.list', requires: ['rest.holds.list'], description: 'GET /holds?patron_id=' },
  ]),
  'holds.create': op('mvp', [
    { id: 'rest.holds.create', requires: ['rest.holds.create'], description: 'POST /holds' },
  ]),
  'holds.cancel': op('mvp', [
    {
      id: 'rest.holds.delete',
      requires: ['rest.holds.delete', 'rest.holds.list'],
      description: 'DELETE /holds/{id} (sahiplik GET ile doğrulanır)',
    },
  ]),
  'holds.pickupLocations': op('mvp', [
    {
      id: 'rest.biblios.pickupLocations',
      requires: ['rest.biblios.pickupLocations'],
      description: 'GET /biblios/{id}/pickup_locations',
    },
    {
      id: 'rest.libraries.all',
      requires: ['rest.libraries.list'],
      description: 'Tüm şubeler (Koha POST /holds sırasında doğrular)',
    },
  ]),
  'account.summary': op('mvp', [
    {
      id: 'rest.patrons.account',
      requires: ['rest.patrons.account'],
      description: 'GET /patrons/{id}/account',
    },
  ]),
  'catalog.search': op('mvp', [
    {
      id: 'plugin.search',
      requires: ['plugin.search'],
      description: 'Koha::SearchEngine (Zebra/Elasticsearch)',
    },
  ]),
  'catalog.record': op('mvp', [
    {
      id: 'rest.biblios.get',
      requires: ['rest.biblios.get'],
      description: 'GET /biblios/{id} (MARC-in-JSON)',
    },
  ]),
  'catalog.items': op('mvp', [
    {
      id: 'rest.biblios.items',
      requires: ['rest.biblios.items'],
      description: 'GET /biblios/{id}/items',
    },
  ]),
  'libraries.list': op('mvp', [
    { id: 'rest.libraries.list', requires: ['rest.libraries.list'], description: 'GET /libraries' },
  ]),
  'patron.changePassword': op('mvp', [
    {
      id: 'plugin.passwordChange',
      requires: ['plugin.password.change'],
      description: 'Eklenti: mevcut şifre + politika kontrolü',
    },
    {
      id: 'rest.patrons.password',
      requires: ['rest.patrons.password.set', 'rest.auth.passwordValidation'],
      description: 'Doğrula → POST /patrons/{id}/password',
    },
  ]),
  'notifications.dueCheckouts': op('mvp', [
    {
      id: 'plugin.noticesDue',
      requires: ['plugin.notices.due'],
      description: 'Eklenti: toplu iade listesi',
    },
    {
      id: 'rest.checkouts.query',
      requires: ['rest.checkouts.list'],
      description: 'GET /checkouts?q={due_date between} (sayfalı)',
    },
  ]),
  'notifications.waitingHolds': op('mvp', [
    {
      id: 'rest.holds.query',
      requires: ['rest.holds.list'],
      description: 'GET /holds?q={status: W}',
    },
  ]),

  // ── İsteğe bağlı ─────────────────────────────────────────────────────────────
  'loans.history': op('optional', [
    {
      id: 'rest.checkouts.checkedIn',
      requires: ['rest.checkouts.list.checkedIn'],
      description: 'GET /checkouts?checked_in=true',
    },
  ]),
  'holds.history': op('optional', [
    {
      id: 'plugin.holdsHistory',
      requires: ['plugin.holds.history'],
      description: 'Eklenti: old_reserves',
    },
  ]),
  'account.transactions': op('optional', [
    {
      id: 'plugin.accountLines',
      requires: ['plugin.account.lines'],
      description: 'Eklenti: tüm hesap hareketleri',
    },
    {
      id: 'rest.patrons.account.debits',
      requires: ['rest.patrons.account.debits'],
      description: 'GET /patrons/{id}/account/debits',
    },
  ]),
  'system.info': op('optional', [
    {
      id: 'plugin.info',
      requires: ['plugin.info'],
      description: 'Kesin sürüm, MARC formatı, syspref beyaz listesi',
    },
  ]),
} as const satisfies Record<string, OperationDefinition>;

export type OperationId = keyof typeof OPERATIONS;
