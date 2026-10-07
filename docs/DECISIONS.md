# DECISIONS — Mimari Karar Kaydı

Onaylanan ve açık kalan mimari kararlar. Her karar ilgili dokümanda uygulanmıştır.

| # | Karar | Durum | Tarih | İlgili doküman |
|---|---|---|---|---|
| D1 | **MirAkıl Koha eklentisi geliştirilecek** (`Koha::Plugin::Com::MirAkil::Mobile`, `/api/v1/contrib/mirakil/...`): arama, sistem tercihleri, geçmiş rezervasyonlar, toplu yenilenebilirlik, toplu bildirim verisi | ✅ Onaylandı | 2026-10-07 | [KOHA_INTEGRATION.md](./KOHA_INTEGRATION.md) |
| D2 | **Desteklenen en düşük Koha sürümü 24.05.** Daha eski sürümler bağlantı testinde reddedilir; `LegacyKohaAdapter` / ILS-DI geliştirilmez | ✅ Onaylandı | 2026-10-07 | [KOHA_INTEGRATION.md](./KOHA_INTEGRATION.md) |
| D3 | **ORM: Prisma** (RLS için transaction içinde `set_config`) | ✅ Onaylandı | 2026-10-07 | [DATABASE.md](./DATABASE.md) |
| D4 | **Bildirimler: `NotificationProvider` soyut katmanı; ilk provider Expo.** Mobil, ilk sürümden itibaren Expo token'ının yanında native FCM/APNs token'ını da kaydeder; Expo'dan çıkış yalnızca backend yapılandırmasıyla yapılabilir | ✅ Onaylandı | 2026-10-07 | [NOTIFICATIONS.md](./NOTIFICATIONS.md) |
| D5 | **Push içeriğinde kişisel veri yok** (kitap adı, kullanıcı adı, tutar, tarih vb.); push yalnızca genel metin + opak ID taşır, ayrıntı uygulama içinde kimliği doğrulanmış API'den gelir | ✅ Onaylandı | 2026-10-07 | [NOTIFICATIONS.md §5](./NOTIFICATIONS.md) |
| D6 | **Uygulama ve mağaza adı: "MirAkıl Kütüphane".** "Koha" ana marka olarak kullanılmaz; yalnızca açıklamada "Koha entegre kütüphane mobil uygulaması" / "Koha kütüphane yönetim sistemleri ile entegre çalışır" ifadeleri kullanılabilir | ✅ Onaylandı | 2026-10-07 | [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-marka-ve-white-label) |
| D7 | **Barındırma: Docker tabanlı, sağlayıcıdan bağımsız; merkezi backend için Türkiye tercih edilir** (mutlak zorunluluk yok) | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| D8 | **Tenant dağıtım modeli: `CENTRAL` / `ON_PREMISE`.** MVP `CENTRAL`; mobil uygulama Gateway adresini Tenant Directory'den öğrenir | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md §4–5](./DEPLOYMENT.md#4-tenant-dizini-tenant-directory) |
| D9 | Admin paneli: React + Vite (SSR yok) | 🟡 Öneri (itiraz gelmedi) | — | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| D10 | Koha erişimi: sabit çıkış IP'si + kurum allowlist'i; erişilemeyen kurumlar için ileride `ON_PREMISE` | 🟡 Öneri | — | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| D11 | Dijital kütüphane kartı MVP'de | 🟡 Öneri | — | [MVP_PLAN.md](./MVP_PLAN.md) |
| D12 | Koha eklentisi monorepo içinde (`koha-plugin/`) | 🟡 Öneri | — | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| D13 | Admin rolleri: `PLATFORM_ADMIN`, `TENANT_ADMIN` | 🟡 Öneri | — | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| D14 | ON_PREMISE bildirimleri için merkezi **MirAkıl Push Relay** | 🟡 Öneri (ON_PREMISE fazında kesinleşecek) | — | [DEPLOYMENT.md §5.3](./DEPLOYMENT.md#53-on_premise-için-bildirimler) |
| D15 | Anahtar yönetimi: MVP'de dosya/Docker secret KEK, prod'da OpenBao/Vault Transit | 🟡 Öneri | — | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| D16 | Hata takibi: self-hosted GlitchTip/Sentry (Sentry SaaS kullanılmaz) | 🟡 Öneri | — | [DEPLOYMENT.md](./DEPLOYMENT.md) |

## Açık konular

- KVKK hukuki değerlendirmesi: Expo (push, EAS Update) ve APNs/FCM üzerinden yurt dışına aktarılan veriler.
- Pilot kurumlar, Koha sürümleri ve test için Koha erişimi.
- Eklentinin kurumlara dağıtım modeli (`.kpz` + kurulum rehberi, güncelleme politikası).
