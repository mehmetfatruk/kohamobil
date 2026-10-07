# DECISIONS — Mimari Karar Kaydı

Onaylanan ve açık kalan mimari kararlar. Her karar ilgili dokümanda uygulanmıştır.

| # | Karar | Durum | Tarih | İlgili doküman |
|---|---|---|---|---|
| D1 | **MirAkıl Koha eklentisi geliştirilecek** (`Koha::Plugin::Com::MirAkil::Mobile`, `/api/v1/contrib/mirakil/...`): arama, sistem tercihleri, geçmiş rezervasyonlar, toplu yenilenebilirlik, toplu bildirim verisi | ✅ Onaylandı | 2026-10-07 | [KOHA_INTEGRATION.md](./KOHA_INTEGRATION.md) |
| D2 | **(Revize)** En düşük Koha sürümü sabit ürün kuralı **değildir**; zorunlu yeteneklere göre Faz 0 sürüm matrisiyle teknik olarak belirlenir. Sürüm farkları yalnızca `koha-client` uyumluluk katmanında (yetenek tespiti + strateji seçimi) yönetilir; geniş sürüm desteği hedeflenir. Pilot güncel sürüm olabilir, mimari ona bağlı olmaz | ✅ Onaylandı (revize) | 2026-10-07 | [KOHA_INTEGRATION.md](./KOHA_INTEGRATION.md) |
| D3 | **ORM: Prisma** (RLS için transaction içinde `set_config`) | ✅ Onaylandı | 2026-10-07 | [DATABASE.md](./DATABASE.md) |
| D4 | **Bildirimler: `NotificationProvider` soyut katmanı; ilk provider Expo.** Mobil, ilk sürümden itibaren Expo token'ının yanında native FCM/APNs token'ını da kaydeder; Expo'dan çıkış yalnızca backend yapılandırmasıyla yapılabilir | ✅ Onaylandı | 2026-10-07 | [NOTIFICATIONS.md](./NOTIFICATIONS.md) |
| D5 | **Push içeriğinde kişisel veri yok** (kitap adı, kullanıcı adı, tutar, tarih vb.); push yalnızca genel metin + opak ID taşır, ayrıntı uygulama içinde kimliği doğrulanmış API'den gelir | ✅ Onaylandı | 2026-10-07 | [NOTIFICATIONS.md §5](./NOTIFICATIONS.md) |
| D6 | **Uygulama ve mağaza adı: "MirAkıl Kütüphane".** "Koha" ana marka olarak kullanılmaz; yalnızca açıklamada "Koha entegre kütüphane mobil uygulaması" / "Koha kütüphane yönetim sistemleri ile entegre çalışır" ifadeleri kullanılabilir | ✅ Onaylandı | 2026-10-07 | [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-marka-ve-white-label) |
| D7 | **Barındırma: Docker tabanlı, sağlayıcıdan bağımsız; merkezi backend için Türkiye tercih edilir** (mutlak zorunluluk yok) | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| D8 | **Tenant dağıtım modeli: `CENTRAL` / `ON_PREMISE`.** MVP `CENTRAL`; mobil uygulama Gateway adresini Tenant Directory'den öğrenir | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md §4–5](./DEPLOYMENT.md#4-tenant-dizini-tenant-directory) |
| D9 | Admin paneli: React + Vite (SSR yok) | ✅ Onaylandı | 2026-10-07 | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| D10 | Koha erişimi: sabit çıkış IP'si + kurum allowlist'i; erişilemeyen kurumlar için ileride `ON_PREMISE` | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| D11 | Dijital kütüphane kartı MVP'de | ✅ Onaylandı | 2026-10-07 | [MVP_PLAN.md](./MVP_PLAN.md) |
| D12 | Koha eklentisi monorepo içinde (`koha-plugin/`) | ✅ Onaylandı | 2026-10-07 | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| D13 | Admin rolleri: `PLATFORM_ADMIN`, `TENANT_ADMIN` | ✅ Onaylandı | 2026-10-07 | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| D14 | ON_PREMISE bildirimleri için merkezi **MirAkıl Push Relay** | ✅ Onaylandı (ON_PREMISE fazında uygulanacak) | 2026-10-07 | [DEPLOYMENT.md §5.3](./DEPLOYMENT.md#53-on_premise-için-bildirimler) |
| D15 | Anahtar yönetimi: MVP'de dosya/Docker secret KEK, prod'da OpenBao/Vault Transit | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| D16 | Hata takibi: self-hosted GlitchTip/Sentry (Sentry SaaS kullanılmaz) | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md](./DEPLOYMENT.md) |

| D17 | **Secret'lar repoda tutulmaz**; yalnızca ortam/secret yönetimi (Docker secrets, OpenBao, EAS Secrets, CI secrets) ve şifreli DB alanları. gitleaks + secret scanning zorunlu | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md §8](./DEPLOYMENT.md#8-secret-yönetimi) |
| D18 | **Alan adları:** `api.koha-tr.com`, `directory.koha-tr.com`, `admin.koha-tr.com`, `app.koha-tr.com`, gerekirse `relay.koha-tr.com` | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md §2.1](./DEPLOYMENT.md#21-alan-adları) |
| D19 | **Pilot sunucu:** Türkiye lokasyonlu, Koha üretim sunucusundan bağımsız, 4 vCPU / 8 GB RAM / 80–160 GB NVMe | ✅ Onaylandı | 2026-10-07 | [DEPLOYMENT.md §3.1](./DEPLOYMENT.md#31-önerilen-boyutlandırma) |
| D20 | **Koha test ortamı** MirAkıl tarafından sağlanacak (REST API, kullanıcı, materyal, dolaşım senaryoları) | ✅ Onaylandı | 2026-10-07 | [KOHA_INTEGRATION.md §1.2](./KOHA_INTEGRATION.md#12-pilot--entegrasyon-test-ortamı-gereksinimleri) |
| D21 | **KVKK:** Expo, APNs, FCM üzerinden yurt dışı aktarım için ayrıca hukuki görüş alınacak; teknik tasarımda push'ta kişisel veri taşınmaz | ✅ Onaylandı (hukuki görüş bekleniyor) | 2026-10-07 | [NOTIFICATIONS.md §11](./NOTIFICATIONS.md) |

## Açık konular

- KVKK hukuki görüşü (Expo push + EAS Update, APNs/FCM). Sonucu bildirim ve OTA güncelleme tasarımını etkileyebilir.
- Koha test ortamının erişim bilgileri ve [KOHA_INTEGRATION.md §1.2](./KOHA_INTEGRATION.md#12-pilot--entegrasyon-test-ortamı-gereksinimleri) kontrol listesi.
- Pilot sunucunun temini (sabit IP) ve `koha-tr.com` DNS kayıtları.
- Sunucu dışı yedek hedefi (Türkiye'de ikinci lokasyon).
- Eklentinin kurumlara dağıtım modeli (`.kpz` + kurulum rehberi, güncelleme politikası).
