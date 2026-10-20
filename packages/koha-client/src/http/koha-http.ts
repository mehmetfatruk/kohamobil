/**
 * Koha REST API HTTP istemcisi (yalnızca Gateway tarafında çalışır).
 * - OAuth2 client credentials ile servis token'ı alır, süresi dolmadan önbellekte tutar,
 *   401'de bir kez yeniler.
 * - Her isteğe zaman aşımı uygular; gövde ve hata yanıtlarını çağırana iletir (loglanır,
 *   kullanıcıya gösterilmez).
 * Secret'lar bu sınıfa çalışma anında verilir; diske/loga yazılmaz.
 */

export type KohaAuth =
  | { kind: 'oauth2'; clientId: string; clientSecret: string }
  | { kind: 'basic'; username: string; password: string };

export interface KohaHttpOptions {
  /** Koha kök adresi, ör. https://katalog.ornek.edu.tr (API: <baseUrl>/api/v1) */
  baseUrl: string;
  auth: KohaAuth;
  timeoutMs?: number;
  userAgent?: string;
  fetch?: typeof fetch;
}

export interface KohaRequest {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** x-koha-embed başlığı */
  embed?: string[];
  accept?: string;
  correlationId?: string;
}

export interface KohaResponse<T> {
  status: number;
  data: T;
  total: number | null;
}

export class KohaHttpError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body: unknown,
  ) {
    super(`Koha ${status} ${path}`);
    this.name = 'KohaHttpError';
  }

  /** Koha'nın hata metni (`error` / `errors[].message`) — yalnızca eşleme ve log için. */
  get kohaMessage(): string {
    const body = this.body as { error?: unknown; errors?: { message?: unknown }[] } | null;
    if (typeof body?.error === 'string') return body.error;
    const first = Array.isArray(body?.errors) ? body.errors[0]?.message : undefined;
    return typeof first === 'string' ? first : '';
  }
}

export class KohaNetworkError extends Error {
  constructor(
    readonly path: string,
    readonly timeout: boolean,
    options?: { cause?: unknown },
  ) {
    super(`Koha ${timeout ? 'zaman aşımı' : 'bağlantı hatası'} ${path}`, options);
    this.name = 'KohaNetworkError';
  }
}

export class KohaHttpClient {
  private token: { value: string; expiresAt: number } | null = null;
  private tokenPromise: Promise<string> | null = null;
  private readonly fetchImpl: typeof fetch;
  private readonly apiRoot: string;

  constructor(private readonly options: KohaHttpOptions) {
    this.fetchImpl = options.fetch ?? fetch;
    this.apiRoot = `${options.baseUrl.replace(/\/+$/, '')}/api/v1`;
  }

  async request<T>(path: string, init: KohaRequest = {}): Promise<KohaResponse<T>> {
    let response = await this.send(path, init, await this.authorization());
    if (response.status === 401 && this.options.auth.kind === 'oauth2') {
      this.token = null;
      response = await this.send(path, init, await this.authorization());
    }
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!response.ok) throw new KohaHttpError(response.status, path, data);
    const totalHeader = response.headers.get('x-total-count');
    return {
      status: response.status,
      data: data as T,
      total: totalHeader ? Number(totalHeader) : null,
    };
  }

  private async send(path: string, init: KohaRequest, authorization: string): Promise<Response> {
    const url = new URL(`${this.apiRoot}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = {
      Accept: init.accept ?? 'application/json',
      Authorization: authorization,
      'User-Agent': this.options.userAgent ?? 'MirAkil-Gateway',
    };
    if (init.correlationId) headers['X-Correlation-Id'] = init.correlationId;
    if (init.embed?.length) headers['x-koha-embed'] = init.embed.join(',');
    if (init.body !== undefined) headers['Content-Type'] = 'application/json';
    try {
      return await this.fetchImpl(url, {
        method: init.method ?? 'GET',
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 8_000),
      });
    } catch (error) {
      const timeout =
        error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      throw new KohaNetworkError(path, timeout, { cause: error });
    }
  }

  private async authorization(): Promise<string> {
    const { auth } = this.options;
    if (auth.kind === 'basic') {
      return `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`;
    }
    if (this.token && this.token.expiresAt > Date.now()) return `Bearer ${this.token.value}`;
    this.tokenPromise ??= this.fetchToken(auth).finally(() => {
      this.tokenPromise = null;
    });
    return `Bearer ${await this.tokenPromise}`;
  }

  private async fetchToken(auth: Extract<KohaAuth, { kind: 'oauth2' }>): Promise<string> {
    const path = '/oauth/token';
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.apiRoot}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
        }).toString(),
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 8_000),
      });
    } catch (error) {
      throw new KohaNetworkError(path, false, { cause: error });
    }
    const body = (await response.json().catch(() => null)) as {
      access_token?: string;
      expires_in?: number;
    } | null;
    if (!response.ok || !body?.access_token) throw new KohaHttpError(response.status, path, body);
    // Süre dolmadan 60 sn önce yenile
    const ttl = Math.max((body.expires_in ?? 3600) - 60, 30);
    this.token = { value: body.access_token, expiresAt: Date.now() + ttl * 1000 };
    return body.access_token;
  }
}
