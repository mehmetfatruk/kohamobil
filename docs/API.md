# API — Gateway API Tasarımı

> Durum: **Taslak v0.2.** Mobil uygulama yalnızca `/mobile/v1`, yönetim paneli yalnızca `/admin/v1`
> uçlarını kullanır. Hiçbir uç Koha'ya özgü yapı (MARC alanı, borrowernumber, Koha hata kodu) döndürmez.
> Kesin şema OpenAPI 3.1 olarak `packages/types` zod şemalarından üretilecek.

## 1. Genel Kurallar

| Konu | Kural |
|---|---|
| Taban URL | Tenant'ın `apiBaseUrl` değeri (Tenant Directory'den gelir; CENTRAL'de ör. `https://api.mirakil-kutuphane.com`) — **yalnızca HTTPS**. Mobil uygulamada sabit kodlanan tek adres Tenant Directory'dir ([DEPLOYMENT.md §4](./DEPLOYMENT.md#4-tenant-dizini-tenant-directory)) |
| Versiyonlama | URL'de major (`/mobile/v1`). Geriye dönük uyumsuz değişiklik = `v2` |
| Format | JSON, `camelCase`, tarih `ISO 8601` (UTC, `Z`), sadece-tarih alanları `YYYY-MM-DD` (tenant saat dilimine göre) |
| Para | `{ "amount": "12.50", "currency": "TRY" }` — string decimal (float hatası olmasın) |
| Kimlik doğrulama | `Authorization: Bearer <accessToken>` |
| Tenant | Kimlik doğrulamalı uçlarda **token'dan**. Login öncesi uçlarda path parametresi (`/tenants/{tenantCode}`) |
| Dil | `Accept-Language: tr` / `en` → hata ve bildirim metinleri |
| İzleme | `X-Correlation-Id` (istemci gönderir, yoksa üretilir, yanıtta her zaman döner) |
| İstemci bilgisi | `X-App-Version`, `X-Platform`, `X-Installation-Id` |
| Idempotency | Yazma uçlarında `Idempotency-Key` (UUID) — 24 saat Redis'te; aynı anahtar = aynı yanıt |
| Sayfalama | Cursor tabanlı: `?limit=20&cursor=...` → `meta.nextCursor` |
| Cache meta | `meta.fetchedAt`, `meta.source: "live" \| "cache"` |
| Rate limit | `429` + `Retry-After`; `RateLimit-*` başlıkları |
| Zorunlu güncelleme | `426 Upgrade Required` + `code: APP_VERSION_UNSUPPORTED` |

### 1.1 Başarılı yanıt zarfı

```json
{
  "data": { },
  "meta": { "fetchedAt": "2026-10-07T08:00:00Z", "source": "live" }
}
```

### 1.2 Hata yanıtı (RFC 9457 Problem Details)

```json
{
  "type": "https://docs.mirakil-kutuphane.com/errors/LOAN_RENEWAL_ON_HOLD",
  "title": "Renewal not possible",
  "status": 409,
  "code": "LOAN_RENEWAL_ON_HOLD",
  "message": "Bu materyal başka bir okuyucu tarafından rezerve edildiği için yenilenemiyor.",
  "correlationId": "01927c1e-6b1d-7c4e-9f4a-2f6c0e8b1a11",
  "details": { "loanId": "lo_8f3a..." }
}
```

`message` kullanıcıya gösterilebilir; `details` asla Koha ham çıktısı içermez.

### 1.3 Kimlik (ID) stratejisi

Mobil'e dönen kaynak ID'leri **opak**tır: `lo_` (loan), `ho_` (hold), `rc_` (record), `it_` (item),
`lb_` (library), `nt_` (notification). Gateway bunları tenant'a bağlı, imzalı/şifreli biçimde Koha
ID'lerine çevirir (ör. `base64url(AES-GCM(tenantId|kohaId))` ya da HMAC'li `kohaId.sig`).
Böylece:
- Farklı tenant'ın ID'si başka tenant'ta çözülemez.
- ID tahmini (enumerasyon) zorlaşır.
- **Yine de** her işlemde sahiplik Koha üzerinden doğrulanır (opak ID tek başına yetki değildir).

## 2. Mobil API — `/mobile/v1`

### 2.1 Kurum keşfi (kimlik doğrulama gerektirmez)

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/tenants?search=&city=&limit=&cursor=` | Aktif kurumlar (ad, kod, şehir, logo, `deploymentMode`, `apiBaseUrl`) — Tenant Directory, yanıt imzalı |
| GET | `/tenants/{tenantCode}/config` | Kurum public config: tema, feature flags, auth providers |

`GET /tenants/{tenantCode}/config` yanıtı:

```json
{
  "data": {
    "id": "0192...",
    "code": "ornek-uni",
    "name": "Örnek Üniversitesi Kütüphanesi",
    "shortName": "ÖÜ Kütüphane",
    "branding": {
      "logoUrl": "https://cdn.../ornek-uni/logo.png",
      "logoDarkUrl": "https://cdn.../ornek-uni/logo-dark.png",
      "primaryColor": "#8B0000",
      "secondaryColor": "#F2B705"
    },
    "deploymentMode": "CENTRAL",
    "apiBaseUrl": "https://api.mirakil-kutuphane.com",
    "locale": "tr",
    "timezone": "Europe/Istanbul",
    "currency": "TRY",
    "opacUrl": "https://katalog.ornek.edu.tr",
    "features": {
      "catalogSearch": true, "holds": true, "holdCancel": true, "renewals": true,
      "fines": true, "history": false, "notifications": true, "announcements": true,
      "passwordChange": true, "digitalCard": true, "payments": false
    },
    "authProviders": [
      { "id": "ap_1", "type": "KOHA", "displayName": "Kütüphane Hesabı",
        "identifierLabel": { "tr": "Kullanıcı adı veya kart numarası", "en": "Username or card number" } }
    ],
    "minAppVersion": "1.0.0",
    "configVersion": "2026-10-01T12:00:00Z"
  }
}
```

> `kohaApiUrl`, client secret, adapter bilgisi **asla** dönmez. `features` = admin flag'i **VE**
> Koha capability'si (ör. plugin yoksa `catalogSearch` gerçekte desteklenmiyorsa `false`).

### 2.2 Kimlik doğrulama

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/auth/login` | KOHA / LDAP provider ile kullanıcı adı-şifre girişi |
| POST | `/auth/refresh` | Refresh token rotasyonu |
| POST | `/auth/logout` | Oturumu kapat (cihaz push token'ını da ayırır) |
| GET  | `/auth/sso/{providerId}/start?redirectUri=` | SAML/OIDC başlat (gelecek) |
| POST | `/auth/sso/exchange` | SSO tek kullanımlık kodunu token'a çevir (gelecek) |
| GET  | `/auth/sessions` | Aktif oturumlarım (gelecek) |
| DELETE | `/auth/sessions/{sessionId}` | Başka cihazdaki oturumu kapat (gelecek) |

`POST /auth/login`:

```json
// istek
{
  "tenantCode": "ornek-uni",
  "providerId": "ap_1",
  "identifier": "20231234",
  "password": "********",
  "device": { "installationId": "c0f1...", "platform": "ios", "appVersion": "1.0.0" }
}
// yanıt 200
{
  "data": {
    "accessToken": "eyJ...",
    "accessTokenExpiresAt": "2026-10-07T08:15:00Z",
    "refreshToken": "rt_2Hk...",
    "refreshTokenExpiresAt": "2026-11-06T08:00:00Z",
    "user": { "id": "0192...", "displayName": "Ayşe Yılmaz" }
  }
}
```

Hatalar: `AUTH_INVALID_CREDENTIALS` (401), `AUTH_ACCOUNT_RESTRICTED` (403),
`AUTH_ACCOUNT_EXPIRED` (403), `AUTH_PROVIDER_DISABLED` (400), `TENANT_INACTIVE` (403),
`RATE_LIMITED` (429), `KOHA_UNAVAILABLE` (503). Kullanıcı yok / şifre yanlış ayrımı **yapılmaz**.

Ayrıntı: [AUTHENTICATION.md](./AUTHENTICATION.md).

### 2.3 Kullanıcı ve özet

| Metot | Yol | Feature | Açıklama |
|---|---|---|---|
| GET | `/me` | — | Profil |
| GET | `/me/summary` | — | Ana sayfa özet kartları |
| GET | `/me/card` | `digitalCard` | Dijital kart (kart no, barkod formatı, ad, geçerlilik) |
| POST | `/me/password` | `passwordChange` | Şifre değiştir (online-only) |

`GET /me`:

```json
{
  "data": {
    "id": "0192...",
    "firstName": "Ayşe", "lastName": "Yılmaz",
    "cardNumber": "20231234",
    "email": "ayse@ornek.edu.tr", "phone": "+90 5xx xxx xx xx",
    "category": { "code": "OGRENCI", "name": "Lisans Öğrencisi" },
    "faculty": "Mühendislik Fakültesi",
    "department": "Bilgisayar Mühendisliği",
    "homeLibrary": { "id": "lb_...", "name": "Merkez Kütüphane" },
    "membershipStart": "2023-09-15",
    "membershipEnd": "2027-09-15",
    "restrictions": [ { "type": "DEBARRED", "until": null, "message": "Hesabınızda kısıtlama bulunuyor." } ]
  }
}
```

> Fakülte/bölüm Koha'da genellikle **patron extended attributes** ile tutulur; hangi attribute
> kodunun fakülte/bölüm olduğu tenant ayarında eşlenir (`profileFieldMapping`).

`GET /me/summary`:

```json
{
  "data": {
    "loans": { "total": 3, "dueSoon": 1, "overdue": 0 },
    "holds": { "total": 2, "ready": 1 },
    "fines": { "balance": { "amount": "0.00", "currency": "TRY" } },
    "unreadNotifications": 4
  }
}
```

`POST /me/password`: `{ "currentPassword": "...", "newPassword": "..." }` → `204`.
Hatalar: `PASSWORD_CURRENT_INVALID`, `PASSWORD_POLICY_VIOLATION` (`details.rules`),
`PASSWORD_CHANGE_NOT_ALLOWED`.

### 2.4 Ödünçler

| Metot | Yol | Feature | Açıklama |
|---|---|---|---|
| GET | `/loans` | — | Aktif ödünçler |
| GET | `/loans/{loanId}/renewability` | `renewals` | Yenilenebilir mi? (gerçek zamanlı Koha kontrolü) |
| POST | `/loans/{loanId}/renew` | `renewals` | Yenile (online-only, Idempotency-Key) |
| POST | `/loans/renew-all` | `renewals` | Tümünü yenile — sonuç listesi (gelecek) |
| GET | `/loans/history?cursor=` | `history` | Okuma geçmişi |

`GET /loans`:

```json
{
  "data": [
    {
      "id": "lo_8f3a...",
      "record": { "id": "rc_77...", "title": "Suç ve Ceza", "author": "Dostoyevski, Fyodor",
                  "coverUrl": "https://api.../covers/rc_77...?s=m" },
      "item": { "id": "it_91...", "barcode": "0001234", "callNumber": "891.73 DOS 2015" },
      "library": { "id": "lb_..", "name": "Merkez Kütüphane" },
      "checkedOutAt": "2026-09-20T10:12:00Z",
      "dueDate": "2026-10-10",
      "dueAt": "2026-10-10T20:59:00Z",
      "daysRemaining": 3,
      "status": "DUE_SOON",
      "renewals": { "count": 1, "max": 3, "remaining": 2 },
      "renewable": null
    }
  ]
}
```

- `status`: `OK` (yeşil) · `DUE_SOON` (turuncu, eşik tenant ayarı, varsayılan ≤ 3 gün) · `OVERDUE` (kırmızı).
- `renewable` liste uç noktasında `null` olabilir (N+1 Koha çağrısını önlemek için); kullanıcı
  kartı açtığında veya "Yenile"ye bastığında `/renewability` çağrılır. Plugin varsa toplu
  yenilenebilirlik tek çağrıda doldurulur.

`GET /loans/{loanId}/renewability`:

```json
{ "data": { "renewable": false, "reason": "LOAN_RENEWAL_ON_HOLD",
            "message": "Bu materyal başka bir okuyucu tarafından rezerve edildiği için yenilenemiyor.",
            "renewals": { "count": 1, "max": 3 } } }
```

`POST /loans/{loanId}/renew` → `200 { data: Loan }` (yeni `dueDate` ile) veya 409 + hata kodu.

### 2.5 Rezervasyonlar

| Metot | Yol | Feature | Açıklama |
|---|---|---|---|
| GET | `/holds?status=active\|past` | `holds` | Rezervasyonlarım |
| POST | `/holds` | `holds` | Rezervasyon oluştur (online-only, Idempotency-Key) |
| DELETE | `/holds/{holdId}` | `holdCancel` | Rezervasyonu iptal et (online-only) |
| GET | `/catalog/records/{recordId}/holdability` | `holds` | Rezerve edilebilir mi + teslim şubeleri |

Hold nesnesi:

```json
{
  "id": "ho_31...",
  "record": { "id": "rc_77...", "title": "Suç ve Ceza", "author": "Dostoyevski, Fyodor", "coverUrl": "..." },
  "item": null,
  "pickupLibrary": { "id": "lb_..", "name": "Merkez Kütüphane" },
  "status": "WAITING",
  "queuePosition": 2,
  "placedAt": "2026-10-01T09:00:00Z",
  "readySince": null,
  "pickupDeadline": null,
  "expiresAt": "2026-12-31",
  "cancellable": true
}
```

`status` değerleri ve Koha karşılığı:

| Gateway | Türkçe | Koha |
|---|---|---|
| `WAITING` | Bekliyor | `status = null` (kuyrukta), `suspended=false` |
| `SUSPENDED` | Askıda | `suspended = true` |
| `IN_TRANSIT` | Transit | `status = 'T'` |
| `IN_PROCESSING` | Hazırlanıyor | `status = 'P'` (yeni sürümler) |
| `READY` | Hazır | `status = 'W'` |
| `FULFILLED` | Teslim alındı | old_reserves, `found='F'` (plugin/yeni sürüm) |
| `CANCELLED` | İptal edildi | old_reserves, `cancellationdate` dolu |
| `EXPIRED` | Süresi doldu | old_reserves, süresi dolmuş/expire edilmiş |

> Geçmiş durumlar (`FULFILLED/CANCELLED/EXPIRED`) core REST API'de her sürümde yok →
> capability `holds.history`. Yoksa yalnızca aktif rezervasyonlar gösterilir.

`POST /holds`:

```json
{ "recordId": "rc_77...", "itemId": null, "pickupLibraryId": "lb_..", "expiresAt": null, "notes": null }
```

Hatalar: `HOLD_NOT_ALLOWED`, `HOLD_TOO_MANY`, `HOLD_ALREADY_EXISTS`, `HOLD_ITEM_AVAILABLE_ON_SHELF`
(kurum politikası), `HOLD_PICKUP_LOCATION_INVALID`, `HOLD_PATRON_RESTRICTED`, `HOLD_AGE_RESTRICTED`.

### 2.6 Borçlar / Cezalar

| Metot | Yol | Feature | Açıklama |
|---|---|---|---|
| GET | `/fines` | `fines` | Toplam borç + açık borç kalemleri |
| GET | `/fines/transactions?cursor=` | `fines` | Borç/ödeme hareketleri |
| POST | `/fines/payments` | `payments` | (gelecek) Ödeme başlat — PaymentProvider |

```json
{
  "data": {
    "balance": { "amount": "7.50", "currency": "TRY" },
    "outstanding": [
      { "id": "fn_..", "date": "2026-09-01", "type": "OVERDUE",
        "description": "Gecikme cezası — Suç ve Ceza",
        "amount": { "amount": "10.00", "currency": "TRY" },
        "remaining": { "amount": "7.50", "currency": "TRY" } }
    ]
  }
}
```

### 2.7 Katalog

| Metot | Yol | Feature | Açıklama |
|---|---|---|---|
| GET | `/catalog/search` | `catalogSearch` | Arama |
| GET | `/catalog/records/{recordId}` | `catalogSearch` | Bibliyografik detay |
| GET | `/catalog/records/{recordId}/items` | `catalogSearch` | Nüsha listesi |
| GET | `/catalog/records/{recordId}/holdability` | `holds` | Rezervasyon uygunluğu |
| GET | `/covers/{recordId}?s=s\|m\|l` | — | Kapak görseli proxy (cache'li, auth'lu) |

`GET /catalog/search?q=suç ve ceza&field=title&page=1&limit=20&materialType=&libraryId=&available=true`

`field`: `any` · `title` · `author` · `subject` · `isbn` · `issn` · `callNumber`.

```json
{
  "data": [
    {
      "id": "rc_77...",
      "title": "Suç ve Ceza",
      "author": "Dostoyevski, Fyodor",
      "publicationYear": "2015",
      "publisher": "İş Bankası Kültür Yayınları",
      "materialType": { "code": "BK", "name": "Kitap" },
      "callNumber": "891.73 DOS 2015",
      "coverUrl": "...",
      "availability": { "available": 2, "total": 4 }
    }
  ],
  "meta": { "total": 37, "page": 1, "limit": 20, "engine": "plugin" }
}
```

`GET /catalog/records/{recordId}`: başlık, alt başlık, yazarlar, yayın bilgisi, baskı, fiziksel
tanım, seri, konular, ISBN/ISSN, dil, notlar, özet, URL'ler (e-kaynak), materyal türü.

`GET /catalog/records/{recordId}/items`:

```json
{ "data": [
  { "id": "it_91...", "barcode": "0001234", "library": { "id": "lb_..", "name": "Merkez" },
    "location": "Genel Koleksiyon", "callNumber": "891.73 DOS 2015",
    "status": "CHECKED_OUT", "dueDate": "2026-10-10", "holdable": true }
] }
```

Nüsha `status`: `AVAILABLE`, `CHECKED_OUT`, `IN_TRANSIT`, `ON_HOLD_SHELF`, `NOT_FOR_LOAN`,
`LOST`, `DAMAGED`, `WITHDRAWN`, `IN_PROCESSING`, `UNKNOWN`.

### 2.8 Kütüphane, Duyurular

| Metot | Yol | Feature | Açıklama |
|---|---|---|---|
| GET | `/libraries` | — | Şubeler: ad, adres, telefon, e-posta, web, konum (lat/lng), çalışma saatleri |
| GET | `/libraries/{libraryId}` | — | Şube detayı + haftalık saatler + özel günler |
| GET | `/announcements?cursor=` | `announcements` | Tenant + global duyurular |
| GET | `/announcements/{id}` | `announcements` | Detay |
| POST | `/announcements/{id}/read` | `announcements` | Okundu |

Harita bağlantısı mobilde üretilir (`maps:` / `geo:` URL şeması, Apple/Google Maps).

### 2.9 Bildirimler ve cihazlar

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/notifications?cursor=&unreadOnly=` | Bildirim listesi |
| POST | `/notifications/{id}/read` | Okundu |
| POST | `/notifications/read-all` | Tümünü okundu |
| GET | `/notification-preferences` | Tercihler |
| PUT | `/notification-preferences` | Tercihleri güncelle |
| PUT | `/devices/current` | Push token'larını kaydet/güncelle (upsert, `installationId` ile): `expoPushToken` + `nativePushToken` + `nativeTokenType` ([NOTIFICATIONS.md §6](./NOTIFICATIONS.md#6-mobil-taraf--sağlayıcıdan-bağımsız-kayıt)) |
| GET | `/notifications/{id}` | Tek bildirim (push'tan açılınca ayrıntı ve hedef ekran buradan gelir) |
| DELETE | `/devices/current` | Bu cihazın push kaydını sil |

`PUT /notification-preferences`:

```json
{
  "dueReminders": true, "dueReminderDays": [3, 1, 0],
  "overdue": true, "holds": true, "announcements": false, "membership": true,
  "quietHours": { "start": "22:00", "end": "08:00" }
}
```

### 2.10 Sistem

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/app/config` | Global: min uygulama sürümü, bakım modu, gizlilik metni URL'leri |
| GET | `/health/live`, `/health/ready` | Altyapı (mobil kullanmaz) |

## 3. Admin API — `/admin/v1`

Kimlik doğrulama: httpOnly secure cookie (session) + CSRF header + TOTP 2FA. `TENANT_ADMIN`
yalnızca atandığı tenant'larda ve sınırlı uçlarda yetkilidir.

| Metot | Yol | Rol | Açıklama |
|---|---|---|---|
| POST | `/auth/login`, `/auth/2fa`, `/auth/logout` | — | Admin oturumu |
| GET | `/tenants` | P | Kurum listesi + sağlık durumu |
| POST | `/tenants` | P | Kurum ekle |
| GET | `/tenants/{id}` | P, T | Kurum detayı |
| PATCH | `/tenants/{id}` | P | Genel bilgiler, tema |
| POST | `/tenants/{id}/deactivate` · `/activate` | P | Pasifleştir / aktifleştir |
| POST | `/tenants/{id}/logo` | P | Logo yükle (multipart, PNG/SVG, boyut/MIME kontrolü) |
| PUT | `/tenants/{id}/koha-connection` | P | Koha URL, client id, **secret (write-only)**, adapter |
| POST | `/tenants/{id}/koha-connection/test` | P | Bağlantı testi: TLS, token, sürüm, capability, plugin |
| GET | `/tenants/{id}/koha-connection/capabilities` | P | Tespit edilen sürüm ve yetenekler |
| PUT | `/tenants/{id}/features` | P | Feature flags |
| GET/PUT | `/tenants/{id}/auth-providers` | P | Kimlik doğrulama sağlayıcıları |
| GET/PUT | `/tenants/{id}/library-hours` | P, T | Çalışma saatleri |
| GET | `/tenants/{id}/stats` | P, T | Aktif kullanıcı (7/30 gün), cihaz, push başarı oranı |
| GET | `/tenants/{id}/push-status` | P | Aktif sağlayıcı, son gönderimler, hata oranı, geçersiz token sayısı, native token'lı cihaz oranı |
| PUT | `/tenants/{id}/notification-settings` | P | Bildirim sağlayıcısı (`expo` / `fcm_apns` / `relay`), push başlık modu, hatırlatma saatleri |
| GET | `/tenants/{id}/koha-errors?cursor=` | P | Son Koha API hataları (maskelenmiş) |
| GET/POST/PATCH/DELETE | `/announcements` | P (global), T (kendi tenant'ı) | Duyurular |
| GET | `/audit-logs?tenantId=&action=&cursor=` | P | Audit log |
| GET/POST/PATCH | `/admin-users` | P | Yöneticiler |

Bağlantı testi yanıtı:

```json
{
  "data": {
    "reachable": true, "tls": "valid", "latencyMs": 182,
    "authentication": "ok",
    "detectedVersion": "25.11.02",
    "adapter": "koha2511",
    "plugin": { "installed": true, "version": "1.0.0" },
    "capabilities": {
      "auth.passwordValidation": true, "loans.list": true, "loans.renewability": true,
      "holds.create": true, "holds.history": true, "catalog.search": true,
      "patron.passwordChange": true, "account.transactions": true, "libraries.hours": true
    },
    "warnings": ["Servis hesabında 'circulate' yetkisi eksik: yenileme çalışmayacak."]
  }
}
```

## 4. Hata Kodu Kataloğu (ilk sürüm)

| Kod | HTTP | Türkçe mesaj (örnek) |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Gönderilen bilgiler geçersiz. |
| `AUTH_INVALID_CREDENTIALS` | 401 | Kullanıcı adı/kart numarası veya şifre hatalı. |
| `AUTH_TOKEN_EXPIRED` | 401 | Oturum süreniz doldu. |
| `AUTH_SESSION_REVOKED` | 401 | Oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın. |
| `AUTH_ACCOUNT_RESTRICTED` | 403 | Hesabınızda kısıtlama bulunduğu için giriş yapılamıyor. Kütüphanenizle iletişime geçin. |
| `AUTH_ACCOUNT_EXPIRED` | 403 | Kütüphane üyeliğinizin süresi dolmuş. |
| `TENANT_INACTIVE` | 403 | Kurumunuzun hizmeti şu anda kullanılamıyor. |
| `FEATURE_DISABLED` | 403 | Bu özellik kurumunuzda kullanılamıyor. |
| `RESOURCE_NOT_FOUND` | 404 | Kayıt bulunamadı. |
| `LOAN_RENEWAL_TOO_MANY` | 409 | Bu materyal için izin verilen en fazla yenileme sayısına ulaşıldı. |
| `LOAN_RENEWAL_ON_HOLD` | 409 | Bu materyal başka bir okuyucu tarafından rezerve edildiği için yenilenemiyor. |
| `LOAN_RENEWAL_TOO_SOON` | 409 | Bu materyal henüz yenilenemez. Yenileme {date} tarihinden itibaren yapılabilir. |
| `LOAN_RENEWAL_OVERDUE` | 409 | Gecikmiş materyaller uygulama üzerinden yenilenemiyor. |
| `LOAN_RENEWAL_RESTRICTED` | 409 | Hesabınızdaki kısıtlama nedeniyle yenileme yapılamıyor. |
| `LOAN_RENEWAL_FINES` | 409 | Borcunuz izin verilen sınırı aştığı için yenileme yapılamıyor. |
| `LOAN_RENEWAL_NOT_ALLOWED` | 409 | Bu materyalin yenileme işlemi kütüphane politikaları nedeniyle gerçekleştirilemiyor. |
| `HOLD_NOT_ALLOWED` | 409 | Bu materyal için rezervasyon yapılamıyor. |
| `HOLD_TOO_MANY` | 409 | Yapabileceğiniz en fazla rezervasyon sayısına ulaştınız. |
| `HOLD_ALREADY_EXISTS` | 409 | Bu materyal için zaten bir rezervasyonunuz var. |
| `HOLD_CANCEL_NOT_ALLOWED` | 409 | Bu rezervasyon artık iptal edilemiyor. |
| `PASSWORD_CURRENT_INVALID` | 400 | Mevcut şifreniz hatalı. |
| `PASSWORD_POLICY_VIOLATION` | 400 | Yeni şifre kütüphane şifre kurallarına uymuyor. |
| `RATE_LIMITED` | 429 | Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin. |
| `APP_VERSION_UNSUPPORTED` | 426 | Devam etmek için uygulamayı güncelleyin. |
| `KOHA_UNAVAILABLE` | 503 | Kütüphane sistemine şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin. |
| `KOHA_TIMEOUT` | 504 | Kütüphane sistemi zamanında yanıt vermedi. |
| `INTERNAL_ERROR` | 500 | Beklenmeyen bir hata oluştu. (Hata kodu: {correlationId}) |

Tam Koha → Gateway eşlemesi: [KOHA_INTEGRATION.md §8](./KOHA_INTEGRATION.md#8-hata-eşleme-error-mapper).
