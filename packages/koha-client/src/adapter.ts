/**
 * Gateway'in Koha ile ilgili bildiği TEK arayüz. Implementasyon (`KohaCompatGateway`, Faz 1)
 * her çağrıyı tenant'ın uyumluluk profiline göre doğru stratejiye yönlendirir.
 * Bu dosyadaki tipler normalize edilmiştir; Koha'ya özgü alan adları içermez.
 */

declare const patronContextBrand: unique symbol;

/**
 * Yalnızca kimlik doğrulama katmanı tarafından oluşturulur (token'daki kullanıcıdan sunucu
 * tarafında çözülür). Adapter metotları serbest `patronId` parametresi ALMAZ — böylece istemciden
 * gelen bir ID ile başka patronun verisine erişim tip seviyesinde engellenir.
 */
export type PatronContext = {
  readonly tenantId: string;
  readonly kohaPatronId: string;
  readonly correlationId: string;
} & { readonly [patronContextBrand]: true };

export function createPatronContext(input: {
  tenantId: string;
  kohaPatronId: string;
  correlationId: string;
}): PatronContext {
  return Object.freeze({ ...input }) as PatronContext;
}

export interface TenantContext {
  readonly tenantId: string;
  readonly correlationId: string;
}

export interface PatronIdentity {
  kohaPatronId: string;
  cardnumber: string | null;
  userid: string | null;
}

export interface KohaAdapter {
  validateCredentials(
    tenant: TenantContext,
    input: { identifier: string; password: string },
  ): Promise<PatronIdentity | null>;
  // Faz 1'de eklenecek: getPatron, listCheckouts, checkRenewability, renewCheckout, listHolds,
  // placeHold, cancelHold, getAccountSummary, search, getBiblio, getBiblioItems, listLibraries,
  // changePassword, bulkDueCheckouts, bulkWaitingHolds (bkz. docs/KOHA_INTEGRATION.md §2).
}
