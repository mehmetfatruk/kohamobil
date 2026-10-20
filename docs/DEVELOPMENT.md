# DEVELOPMENT — Geliştirme Ortamı

## Gereksinimler

- Node.js **22.12+** (`.nvmrc`), pnpm **10** (`corepack enable`)
- Docker + Docker Compose (yerel PostgreSQL ve Redis için)
- Mobil için: Expo Go veya geliştirme build'i; iOS simülatörü (macOS) / Android emülatörü
- İsteğe bağlı: [gitleaks](https://github.com/gitleaks/gitleaks) (commit öncesi secret taraması; CI'da zorunlu)

## Repo yapısı

| Dizin | İçerik |
|---|---|
| `apps/api` | Gateway API (`src/main.ts`) ve worker (`src/worker.ts`) — NestJS 12, Fastify, ESM |
| `apps/mobile` | Expo (SDK 58) + Expo Router mobil uygulaması |
| `apps/admin` | React + Vite yönetim paneli |
| `packages/types` | Paylaşılan zod şemaları (DTO, hata kodları, feature flag'ler, push payload) |
| `packages/i18n` | Türkçe (varsayılan) / İngilizce metinler, hata mesajları, push şablonları |
| `packages/koha-client` | Koha uyumluluk katmanı: yetenek tespiti, strateji çözümleme, `probe` aracı |
| `packages/ui` | Tema token'ları, kurum renklerinden erişilebilir tema üretimi |
| `packages/config` | Ortak tsconfig ve ESLint yapılandırmaları |
| `infra/docker` | Compose dosyaları, Dockerfile'lar, Caddy, env örnekleri |
| `infra/ktd` | Koha sürüm matrisi (koha-testing-docker) betikleri |
| `koha-plugin` | MirAkıl Koha eklentisi (Faz 3) |

## İlk kurulum

```sh
corepack enable
pnpm install                       # git hook'ları (lefthook) da kurulur
scripts/generate-secrets.sh        # infra/docker/.secrets/ altına rastgele secret üretir (gitignore'da)

# PostgreSQL + Redis (compose.base.yml bazı değişkenleri zorunlu tutar; burada geçici değer verilir)
PUBLIC_API_URL=https://api.koha-tr.com ACME_EMAIL=dev@localhost \
  docker compose -f infra/docker/compose.base.yml -f infra/docker/compose.dev.yml up -d postgres redis
```

```sh
cp apps/api/.env.example apps/api/.env   # .env commit edilmez
pnpm build
pnpm --filter @mirakil/api dev           # http://localhost:3000/health/ready
pnpm --filter @mirakil/api dev:worker
pnpm --filter @mirakil/admin dev         # http://localhost:5173
pnpm --filter @mirakil/mobile dev        # Expo
```

## Mobil uygulamayı denemek (örnek veri)

Arka uç olmadan tüm ekranlar örnek veriyle çalışır (`apps/mobile/src/api/mock`).
Proje **Expo SDK 58** kullanır; telefondaki Expo Go uygulaması güncel olmalıdır.

### Windows (PowerShell veya Komut İstemi)

```bat
npm install -g pnpm@10
git clone https://github.com/mehmetfatruk/kohamobil.git
cd kohamobil
git checkout claude/busy-heisenberg-t5a3zf
pnpm install
pnpm build
cd apps\mobile
pnpm dev
```

- Terminalde çıkan QR kodu telefonda okutun: **Android** → Expo Go içinden "Scan QR code";
  **iPhone** → normal Kamera uygulaması.
- Telefon ve bilgisayar aynı Wi‑Fi'de olmalı. Bağlanamazsa: `pnpm exec expo start --tunnel`.
- Tarayıcıda önizleme: `pnpm web`.

### Demo hesabı

- Kurum: listeden seçin ya da `ornek-uni`, `kent-halk` kodu veya `katalog.ornek.edu.tr` adresini girin.
- Giriş: kullanıcı adı `demo` (veya kart no `20231234`), şifre `demo`.
- Gerçek Gateway'e bağlamak için: `EXPO_PUBLIC_DATA_SOURCE=http`.

## Uygulamayı canlı Koha'ya bağlamak (yerel Gateway)

Telefon Koha'ya doğrudan bağlanmaz: bilgisayarınızda çalışan Gateway üzerinden bağlanır.

```
Telefon (Expo Go)  →  Gateway (bilgisayarınız, :3000)  →  Koha (ör. koha-tr.com)
```

**Koha tarafında (bir kez):**
1. Sistem tercihi `RESTOAuth2ClientCredentials` → **Enable**
2. Personel arayüzünde uygulama için bir servis hesabı (personel patron) açın, yetkilerini verin
   ([KOHA_INTEGRATION.md §1.1](./KOHA_INTEGRATION.md)) ve bu hesap için **API key** üretin (client id + secret).
3. Deneme için bir test okuyucu hesabı (ödünç ve rezervasyonu olan).

**Bilgisayarda — tek komut:**

```bat
git pull
pnpm install
pnpm live
```

`pnpm live` ilk seferde Koha API anahtarını sorar, Koha bağlantısını kontrol eder, Gateway'i arka planda
ve mobil uygulamayı (Expo) başlatır. Terminaldeki QR'ı telefonda okutun.

**Aynı adımlar tek tek (sorun ararken):**

```bat
git pull
pnpm install
pnpm build
pnpm local:setup      &rem client id ve secret'ı sorar; secret yalnızca apps\api\.local\ altına yazılır
pnpm local:check      &rem Koha'ya yalnızca OKUMA yapan kontrol; test okuyucu bilgisi isteğe bağlı
pnpm local:api        &rem Gateway'i başlatır (bu pencere açık kalsın)
```

Ayrı bir pencerede:

```bat
cd apps\mobile
pnpm dev
```

- `local:setup` bilgisayarın yerel ağ adresini bulur ve mobil uygulamayı bu Gateway'e yönlendirir
  (`apps/mobile/.env.local`). Örnek veriye dönmek için: `pnpm local:setup -- --mock`
- Kurumlar `apps/api/.local/tenants.json` dosyasındadır (`apps/api/tenants.example.json`'dan kopyalanır).
  Bir kurumu açmak için `"active": true` yapın ve `pnpm local:setup`'ı tekrar çalıştırın.
- Windows Güvenlik Duvarı Node.js için izin sorarsa **İzin ver** deyin (telefonun 3000 portuna erişmesi için).
- Bu yerel modda oturumlar bellekte tutulur; Gateway yeniden başlarsa tekrar giriş yapılır.
  Kalıcı oturumlar (PostgreSQL + Redis) Faz 1'in devamında.

## Günlük komutlar

```sh
pnpm turbo run build typecheck lint test   # CI ile aynı kontroller
pnpm format                                # prettier
pnpm secrets:scan                          # gitleaks (kuruluysa)
```

## Kurallar

- **Secret'lar repoya girmez** (D17): yalnızca `*.env.example` ve `CHANGE_ME` yer tutucuları.
  Uygulama örnek değerle başlamaz. Ayrıntı: [DEPLOYMENT.md §8](./DEPLOYMENT.md#8-secret-yönetimi).
- **Koha sürüm farkları** yalnızca `packages/koha-client/src/compat` içinde yönetilir; Gateway
  modüllerinde Koha sürümüne göre dallanma yazılmaz (D2).
- Mobil uygulama yalnızca Gateway API'sini bilir; Koha'ya özgü alan, uç veya hata kodu kullanmaz.
- Push metinlerinde kişisel veri yoktur (D5); şablonlar `packages/i18n` içindedir.

## Koha uyumluluk raporu

Bir Koha sunucusunun hangi işlemleri hangi stratejiyle desteklediğini görmek için:

```sh
pnpm --filter @mirakil/koha-client probe -- https://koha.ornek.edu.tr --opac https://katalog.ornek.edu.tr
```

Yalnızca okuma yapar (`GET /api/v1/` ve OPAC ana sayfası). Sürüm matrisi için: [infra/ktd](../infra/ktd/README.md).
