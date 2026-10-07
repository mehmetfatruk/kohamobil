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
| `apps/mobile` | Expo (SDK 57) + Expo Router mobil uygulaması |
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
