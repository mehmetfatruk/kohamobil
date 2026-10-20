/**
 * Test için sahte Koha REST sunucusu (fetch düzeyinde). Koha'nın yanıt biçimlerini taklit eder.
 * Gerçek sürümlerdeki farklar sürüm matrisi testlerinde (KTD) doğrulanır.
 */
type Json = Record<string, unknown>;

export interface FakeKohaState {
  calls: string[];
  tokensIssued: number;
  expireTokenOnce: boolean;
  checkouts: Json[];
  holds: Json[];
}

const day = (offset: number) => {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toISOString();
};

export function createFakeKoha(options: { spec?: unknown } = {}) {
  const state: FakeKohaState = {
    calls: [],
    tokensIssued: 0,
    expireTokenOnce: false,
    checkouts: [
      {
        checkout_id: 11,
        patron_id: 42,
        item_id: 101,
        library_id: 'MRK',
        checkout_date: day(-10),
        due_date: day(10),
        renewals_count: 0,
      },
      {
        checkout_id: 12,
        patron_id: 42,
        item_id: 102,
        library_id: 'MRK',
        checkout_date: day(-20),
        due_date: day(-2),
        renewals_count: 2,
      },
      {
        checkout_id: 99,
        patron_id: 7,
        item_id: 103,
        library_id: 'MRK',
        checkout_date: day(-1),
        due_date: day(14),
        renewals_count: 0,
      },
    ],
    holds: [
      {
        hold_id: 501,
        patron_id: 42,
        biblio_id: 1,
        pickup_library_id: 'MRK',
        hold_date: day(-3),
        status: 'W',
        expiration_date: day(4),
        priority: 0,
      },
      {
        hold_id: 502,
        patron_id: 42,
        biblio_id: 2,
        pickup_library_id: 'MRK',
        hold_date: day(-1),
        status: null,
        priority: 2,
      },
    ],
  };
  const biblios: Record<number, Json> = {
    1: {
      biblio_id: 1,
      title: 'Tutunamayanlar /',
      author: 'Atay, Oğuz.',
      publisher: 'İletişim',
      publication_year: '2019',
      isbn: '9789754700114',
      item_type: 'BK',
    },
    2: {
      biblio_id: 2,
      title: 'Suç ve ceza',
      author: 'Dostoyevski, Fyodor',
      copyright_date: 2015,
      item_type: 'BK',
    },
    3: {
      biblio_id: 3,
      title: 'Dune',
      author: 'Herbert, Frank',
      publication_year: '2021',
      item_type: 'BK',
    },
  };
  const items: Record<number, Json> = {
    101: {
      item_id: 101,
      biblio_id: 3,
      external_id: 'B101',
      holding_library_id: 'MRK',
      callnumber: '813 HER',
      acquisition_date: '2026-10-01',
    },
    102: {
      item_id: 102,
      biblio_id: 2,
      external_id: 'B102',
      holding_library_id: 'MRK',
      callnumber: '891.7 DOS',
      acquisition_date: '2025-01-01',
      checked_out_date: '2026-10-18',
    },
    103: {
      item_id: 103,
      biblio_id: 1,
      external_id: 'B103',
      holding_library_id: 'MRK',
      callnumber: '894 ATA',
      acquisition_date: '2026-09-15',
      not_for_loan_status: 1,
    },
  };
  const libraries = [
    {
      library_id: 'MRK',
      name: 'Merkez Kütüphane',
      address1: 'Kampüs',
      city: 'Sinop',
      pickup_location: true,
    },
    { library_id: 'ARS', name: 'Arşiv', pickup_location: false },
  ];

  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    });

  const fetchImpl: typeof fetch = (input, init) => Promise.resolve(route(input, init));

  const route = (
    input: Parameters<typeof fetch>[0],
    init: Parameters<typeof fetch>[1],
  ): Response => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method ?? 'GET';
    const path = url.pathname.replace(/^\/api\/v1/, '');
    state.calls.push(`${method} ${path}${url.search}`);
    const body =
      typeof init?.body === 'string' && init.body.startsWith('{')
        ? (JSON.parse(init.body) as Json)
        : null;

    if (path === '/oauth/token') {
      const form = new URLSearchParams(typeof init?.body === 'string' ? init.body : '');
      if (form.get('client_secret') !== 'dogru-secret')
        return json(403, { error: 'unauthorized_client' });
      state.tokensIssued += 1;
      return json(200, { access_token: `tok-${state.tokensIssued}`, expires_in: 3600 });
    }
    const auth = new Headers(init?.headers).get('authorization');
    if (state.expireTokenOnce && auth === 'Bearer tok-1') {
      state.expireTokenOnce = false;
      return json(401, { error: 'expired' });
    }
    if (!auth?.startsWith('Bearer tok-')) return json(401, { error: 'unauthenticated' });

    let m: RegExpMatchArray | null;
    if ((path === '/' || path === '') && options.spec) return json(200, options.spec);
    if (path === '/auth/password/validation' && method === 'POST') {
      return body?.identifier === 'test' && body?.password === 'sifre'
        ? json(201, { patron_id: 42, cardnumber: 'K42', userid: 'test' })
        : json(400, { error: 'Validation failed' });
    }
    if ((m = path.match(/^\/patrons\/(\d+)$/))) {
      return m[1] === '42'
        ? json(200, {
            patron_id: 42,
            firstname: 'Ayşe',
            surname: 'Yılmaz',
            cardnumber: 'K42',
            category_id: 'OGR',
            library_id: 'MRK',
            date_enrolled: '2024-09-01',
            expiry_date: '2028-09-01',
            extended_attributes: [{ type: 'FAK', value: 'Mühendislik' }],
          })
        : json(404, { error: 'Patron not found' });
    }
    if ((m = path.match(/^\/patrons\/(\d+)\/account$/))) {
      return json(200, {
        balance: 7.5,
        outstanding_debits: {
          total: 7.5,
          lines: [
            {
              account_line_id: 1,
              date: '2026-09-10',
              amount: 10,
              amount_outstanding: 7.5,
              description: 'Gecikme',
              debit_type: 'OVERDUE',
            },
          ],
        },
      });
    }
    if ((m = path.match(/^\/patrons\/(\d+)\/account\/debits$/))) {
      return json(200, [
        {
          account_line_id: 1,
          date: '2026-09-10',
          amount: 10,
          amount_outstanding: 7.5,
          description: 'Gecikme',
          debit_type: 'OVERDUE',
        },
      ]);
    }
    if (path === '/checkouts') {
      return json(
        200,
        state.checkouts.filter((c) => String(c.patron_id) === url.searchParams.get('patron_id')),
      );
    }
    if ((m = path.match(/^\/checkouts\/(\d+)$/))) {
      const c = state.checkouts.find((x) => String(x.checkout_id) === m![1]);
      return c ? json(200, c) : json(404, { error: 'Checkout not found' });
    }
    if ((m = path.match(/^\/checkouts\/(\d+)\/allows_renewal$/))) {
      return m[1] === '12'
        ? json(200, {
            allows_renewal: false,
            max_renewals: 2,
            current_renewals: 2,
            error: 'too_many',
          })
        : json(200, { allows_renewal: true, max_renewals: 3, current_renewals: 0, error: null });
    }
    if ((m = path.match(/^\/checkouts\/(\d+)\/renewals$/)) && method === 'POST') {
      const c = state.checkouts.find((x) => String(x.checkout_id) === m![1])!;
      c.due_date = day(24);
      c.renewals_count = Number(c.renewals_count) + 1;
      return json(201, { due_date: c.due_date });
    }
    if (path === '/holds' && method === 'GET') {
      return json(
        200,
        state.holds.filter((h) => String(h.patron_id) === url.searchParams.get('patron_id')),
      );
    }
    if (path === '/holds' && method === 'POST') {
      if (body?.biblio_id === 2)
        return json(403, { error: 'Hold cannot be placed. Reason: alreadyReserved' });
      const hold = {
        hold_id: 600,
        patron_id: body?.patron_id,
        biblio_id: body?.biblio_id,
        pickup_library_id: body?.pickup_library_id,
        hold_date: day(0),
        status: null,
        priority: 1,
      };
      state.holds.push(hold);
      return json(201, hold);
    }
    if ((m = path.match(/^\/holds\/(\d+)$/)) && method === 'DELETE') {
      state.holds = state.holds.filter((h) => String(h.hold_id) !== m![1]);
      return json(204, undefined);
    }
    if ((m = path.match(/^\/biblios\/(\d+)$/))) {
      const b = biblios[Number(m[1])];
      return b ? json(200, b) : json(404, { error: 'Bibliographic record not found' });
    }
    if ((m = path.match(/^\/biblios\/(\d+)\/items$/))) {
      return json(
        200,
        Object.values(items).filter((i) => String(i.biblio_id) === m![1]),
      );
    }
    if ((m = path.match(/^\/biblios\/(\d+)\/pickup_locations$/))) {
      return json(
        200,
        libraries.filter((l) => l.pickup_location),
      );
    }
    if ((m = path.match(/^\/items\/(\d+)$/))) {
      const i = items[Number(m[1])];
      return i ? json(200, i) : json(404, { error: 'Item not found' });
    }
    if (path === '/items') {
      const sorted = Object.values(items).sort((a, b) =>
        String(b.acquisition_date).localeCompare(String(a.acquisition_date)),
      );
      return json(200, sorted, { 'x-total-count': String(sorted.length) });
    }
    if (path === '/biblios') {
      const q = JSON.stringify(JSON.parse(url.searchParams.get('q') ?? '{}'));
      const term = /%([^%]+)%/.exec(q)?.[1]?.toLowerCase() ?? '';
      const found = Object.values(biblios).filter((b) =>
        `${String(b.title)} ${String(b.author)}`.toLowerCase().includes(term),
      );
      return json(200, found, { 'x-total-count': String(found.length) });
    }
    if (path === '/libraries') return json(200, libraries);
    if (path === '/item_types')
      return json(200, [
        { item_type_id: 'BK', description: 'Kitap' },
        { item_type_id: 'TEZ', description: 'Tez' },
      ]);
    return json(404, { error: 'Not found' });
  };

  return { state, fetch: fetchImpl };
}
