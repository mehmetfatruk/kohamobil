/**
 * SENTETİK Koha OpenAPI (Swagger 2.0) spec'leri — yalnızca birim testleri için.
 * Gerçek sürümlerden alınan spec'ler Faz 0 sürüm matrisi çalışmasında
 * `test/fixtures/specs/<sürüm>.json` olarak eklenecek.
 */

type Spec = {
  swagger: string;
  basePath: string;
  paths: Record<string, unknown>;
  [k: string]: unknown;
};

const ok = { responses: { '200': { description: 'OK' } } };
const pathParam = (name: string) => ({ name, in: 'path', required: true, type: 'string' });

function baseSpec(): Spec {
  return {
    swagger: '2.0',
    basePath: '/api/v1',
    parameters: {
      patron_id_pp: pathParam('patron_id'),
      checkout_id_pp: pathParam('checkout_id'),
    },
    definitions: {
      password_validation: {
        type: 'object',
        properties: {
          userid: { type: 'string' },
          cardnumber: { type: 'string' },
          password: { type: 'string' },
        },
      },
      password_validation_identifier: {
        allOf: [
          { $ref: '#/definitions/password_validation' },
          { type: 'object', properties: { identifier: { type: 'string' } } },
        ],
      },
    },
    paths: {
      '/oauth/token': { post: ok },
      '/patrons': { get: ok },
      '/patrons/{patron_id}': { parameters: [{ $ref: '#/parameters/patron_id_pp' }], get: ok },
      '/patrons/{patron_id}/account': {
        get: { ...ok, parameters: [{ $ref: '#/parameters/patron_id_pp' }] },
      },
      '/patrons/{patron_id}/password': { post: ok },
      '/checkouts': {
        get: { ...ok, parameters: [{ name: 'patron_id', in: 'query', type: 'integer' }] },
      },
      '/checkouts/{checkout_id}': { get: ok },
      '/checkouts/{checkout_id}/allows_renewal': { get: ok },
      '/holds': { get: ok, post: ok },
      '/holds/{hold_id}': { delete: ok },
      '/biblios/{biblio_id}': { get: ok },
      '/biblios/{biblio_id}/items': { get: ok },
      '/libraries': { get: ok },
    },
  };
}

/** Yeni bir Koha'yı taklit eder: identifier alanı, çoğul renewals, geçmiş, eklenti. */
export function modernSpecWithPlugin(): Spec {
  const spec = baseSpec();
  Object.assign(spec.paths, {
    '/auth/password/validation': {
      post: {
        ...ok,
        parameters: [
          {
            name: 'body',
            in: 'body',
            schema: { $ref: '#/definitions/password_validation_identifier' },
          },
        ],
      },
    },
    '/checkouts': {
      get: {
        ...ok,
        parameters: [
          { name: 'patron_id', in: 'query', type: 'integer' },
          { name: 'checked_in', in: 'query', type: 'boolean' },
        ],
      },
    },
    '/checkouts/{checkout_id}/renewals': { post: ok },
    '/patrons/{patron_id}/account/debits': { get: ok },
    '/biblios/{biblio_id}/pickup_locations': { get: ok },
    '/contrib/mirakil/info': { get: ok },
    '/contrib/mirakil/search': { get: ok },
    '/contrib/mirakil/patrons/{patron_id}/renewability': { get: ok },
    '/contrib/mirakil/notices/due': { get: ok },
  });
  return spec;
}

/** Eski bir Koha'yı taklit eder: identifier yok, tekil renewal, geçmiş/pickup yok, eklenti yok. */
export function olderSpecWithoutPlugin(): Spec {
  const spec = baseSpec();
  Object.assign(spec.paths, {
    '/auth/password/validation': {
      post: {
        ...ok,
        parameters: [
          { name: 'body', in: 'body', schema: { $ref: '#/definitions/password_validation' } },
        ],
      },
    },
    '/checkouts/{checkout_id}/renewal/': { post: ok },
  });
  return spec;
}

/** Patron şifre doğrulama ucu olmayan kurulum (zorunlu çekirdek eksik). */
export function specWithoutPasswordValidation(): Spec {
  return baseSpec();
}
