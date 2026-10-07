# MVP_PLAN — Kapsam ve Aşamalar

> Durum: **Taslak v0.1.** Süreler 1 full-stack + 1 mobil geliştirici varsayımıyla kaba tahmindir;
> mimari onayından sonra netleştirilecektir.

## 1. MVP Tanımı

**Hedef:** 2–3 pilot kurumun (farklı Koha sürümleri ile) öğrencilerinin, mağazadan indirdikleri tek
uygulama ile kurumlarını seçip giriş yaparak ödünçlerini görmesi/yenilemesi, rezervasyonlarını
görmesi/iptal etmesi, katalogda arayıp rezervasyon yapması, borcunu ve profilini görmesi ve iade
hatırlatma push bildirimi alması.

### 1.1 MVP'de VAR

| Alan | Kapsam |
|---|---|
| Kurum | Kurum seçimi (arama), tenant config, white-label tema, Kurum Değiştir |
| Kimlik | KOHA provider (kullanıcı adı/kart no + şifre), access + refresh token rotasyonu, logout |
| Ana Sayfa | Logo, ad, kart bilgisi, özet kartları (ödünç, yaklaşan, geciken, rezervasyon, borç) |
| Dijital kart | Kart numarası barkod + QR |
| Ödünçlerim | Liste, renk durumu, kalan gün, yenileme sayısı, yenilenebilirlik kontrolü, Yenile |
| Rezervasyonlarım | Aktif rezervasyonlar (Bekliyor/Transit/Hazır/Askıda), iptal (politikaya göre) |
| Katalog | Arama (plugin ile; plugin yoksa SRU fallback), sonuç kartı, detay, nüsha listesi, Rezervasyon Yap |
| Borçlar | Toplam borç + açık kalemler |
| Profil | Profil alanları (fakülte/bölüm eşleme dahil), Şifre Değiştir |
| Kütüphane | Şubeler, iletişim, harita linki, çalışma saatleri (panelden) |
| Duyurular | Tenant/global duyuru listesi ve detay |
| Bildirimler | Push altyapısı, `DUE_SOON`, `DUE_TODAY`, `OVERDUE`, `HOLD_READY`; bildirim listesi; tercihler |
| Offline | Okuma cache'i, yazma işlemlerinin offline engellenmesi |
| i18n / tema | Türkçe + İngilizce, dark mode |
| Admin | Kurum CRUD, tema/logo, Koha bağlantısı + test, capability görüntüleme, feature flags, çalışma saatleri, duyurular, son Koha hataları, temel istatistik |
| Güvenlik | Tenant izolasyonu (guard + RLS), rate limit, şifreli secret, audit log, correlation ID, Sentry |
| Koha | `Koha2511Adapter`, `Koha2405Adapter`, MirAkıl plugin v1 (info + search + bulk renewability) |

### 1.2 MVP'de YOK (sonraki fazlar)

- LDAP / SAML / OIDC girişleri
- Okuma geçmişi (`history`) ve geçmiş rezervasyonlar (plugin v2)
- Borç hareket geçmişinin tamamı, online ödeme (PaymentProvider yalnızca arayüz olarak)
- `HOLD_EXPIRING`, `MEMBERSHIP_EXPIRING` bildirimleri
- `LegacyKohaAdapter` (ILS-DI) — pilot kurumda gerekmedikçe
- Doğrudan FCM/APNs provider (Expo Push kullanılır)
- Biyometrik kilit, çoklu hesap, tümünü yenile
- Kurum içi connector ajanı
- `TENANT_ADMIN` rolü (MVP'de yalnızca `PLATFORM_ADMIN`; duyuruları MirAkıl girer) — opsiyonel

## 2. Aşamalar

### Faz 0 — Temel ve Doğrulama (1–2 hafta)

- [ ] Mimari dokümanların onayı, açık kararların netleşmesi ([ARCHITECTURE.md §12](./ARCHITECTURE.md#12-onay-bekleyen-mimari-kararlar))
- [ ] Monorepo iskeleti: pnpm + Turborepo, `packages/config`, lint/format/typecheck, CI
- [ ] `infra/docker/docker-compose.yml`: PostgreSQL, Redis, api, worker
- [ ] KTD ile 24.05 ve 25.11 test Koha'ları + örnek veri
- [ ] **Koha spike:** [KOHA_INTEGRATION.md](./KOHA_INTEGRATION.md) §3 tablosundaki her endpoint'in
      gerçek sürümlerde doğrulanması, fixture'ların kaydedilmesi, belgede "≈" işaretlerinin kaldırılması
- [ ] ADR'ler: ORM, push, admin framework

**Çıktı:** Çalışan boş api/mobile/admin uygulamaları, doğrulanmış Koha yetenek matrisi.

### Faz 1 — Backend Çekirdeği (3–4 hafta)

- [ ] Prisma şeması + RLS migration'ları, seed
- [ ] `RequestContext`, correlation ID, problem details filtresi, pino redact, Sentry
- [ ] Envelope encryption servisi (dev: yerel anahtar, prod: KMS/Vault)
- [ ] Tenant modülü + public config + feature flags
- [ ] `packages/koha-client`: HTTP istemci (OAuth2 token cache, timeout, circuit breaker),
      `KohaAdapter`, `Koha2511Adapter`, `Koha2405Adapter`, capability probe, error mapper, MARC21 normalizer
- [ ] Auth modülü: KOHA provider, JWT, refresh rotation + reuse detection, logout
- [ ] `/me`, `/me/summary`, `/me/card`, `/loans` (+renewability, renew), `/holds` (list, cancel), `/fines`, `/libraries`
- [ ] Rate limiting, audit log
- [ ] E2E: tenant isolation + IDOR test seti (CI zorunlu)

**Çıktı:** Postman/OpenAPI ile uçtan uca çalışan Gateway (iki KTD tenant'ı).

### Faz 2 — Mobil MVP (3–4 hafta, Faz 1 ile kısmen paralel)

- [ ] Expo Router iskeleti, bottom tabs, tema sistemi (tenant renkleri + dark mode + kontrast)
- [ ] i18n (tr/en)
- [ ] Onboarding: Hoş geldiniz → Kurum Seçimi → Login
- [ ] SecureStore, api-client interceptor (single-flight refresh)
- [ ] Ana Sayfa, Dijital Kart, Ödünçlerim (+ yenileme), Rezervasyonlarım (+ iptal), Borçlar, Profil, Kütüphane
- [ ] TanStack Query persist (MMKV) + offline banner + `useOnlineMutation`
- [ ] Feature flag'e göre dinamik menü
- [ ] Sentry, EAS Build (internal distribution)

**Çıktı:** TestFlight / Play Internal Testing ile pilot kullanıcılara dağıtılabilir sürüm (katalog hariç).

### Faz 3 — Katalog + Rezervasyon Oluşturma + Plugin v1 (2–3 hafta)

- [ ] MirAkıl Koha Plugin v1: `info`, `search`, `patrons/{id}/renewability`
- [ ] Search strategy (plugin → SRU fallback), MARC21 (+ UNIMARC temel) normalizer
- [ ] Kapak proxy + cache
- [ ] Mobil: arama ekranı (alan seçimi), sonuç kartı, detay, nüsha listesi, Rezervasyon Yap (teslim şubesi seçimi)
- [ ] Şifre değiştirme (backend + mobil)

### Faz 4 — Bildirimler (2–3 hafta)

- [ ] Worker entrypoint, BullMQ kuyrukları, scheduler (tenant başına jitter'lı)
- [ ] `tenant-scan`, `notification-fanout`, `push-send`, `push-receipts`
- [ ] Dedupe kısıtları, quiet hours, digest
- [ ] Mobil: izin akışı, token kaydı, bildirim listesi, tercihler ekranı, deep link
- [ ] Duyurular (backend + mobil liste/detay + push)

### Faz 5 — Yönetim Paneli (2–3 hafta, Faz 3–4 ile paralel olabilir)

- [ ] Admin auth (2FA), kurum listesi/ekle/düzenle/pasifleştir, logo yükleme, tema önizleme
- [ ] Koha bağlantısı (write-only secret), bağlantı testi, sürüm/capability görüntüleme
- [ ] Feature flags, çalışma saatleri, duyurular
- [ ] İstatistikler (aktif kullanıcı, cihaz), push durumu, son Koha hataları, audit log

### Faz 6 — Sağlamlaştırma ve Yayın (2 hafta)

- [ ] Güvenlik incelemesi (OWASP MASVS / ASVS kontrol listesi), bağımlılık taraması, pentest (öneri)
- [ ] Yük testi (k6): 100 tenant simülasyonu, worker taraması
- [ ] KVKK: aydınlatma metni, açık rıza, gizlilik politikası, veri silme talebi akışı
- [ ] App Store / Play Store metadata, gizlilik etiketleri, ekran görüntüleri
- [ ] Prod altyapı: sabit egress IP, yedekleme, izleme panoları, alarmlar
- [ ] Pilot kurumlarla kabul testleri → mağaza yayını

**Toplam kaba tahmin:** ~14–18 hafta (paralel çalışmayla kısalabilir).

## 3. Sonraki Fazlar (MVP sonrası)

| Faz | İçerik |
|---|---|
| 7 | LDAP provider, OIDC provider, SAML (YÖK/EduGAIN federasyonu) |
| 8 | Okuma geçmişi, geçmiş rezervasyonlar, borç hareket geçmişi (plugin v2), `HOLD_EXPIRING`, `MEMBERSHIP_EXPIRING` |
| 9 | Online ödeme (PaymentProvider: iyzico / PayTR / sanal POS), Koha'ya ödeme kaydı |
| 10 | LegacyKohaAdapter (ILS-DI), connector ajanı, `TENANT_ADMIN` rolü |
| 11 | Biyometrik kilit, tümünü yenile, deep link/QR ile kurum seçimi, widget'lar, Apple/Google Wallet kartı |

## 4. Kabul Kriterleri (MVP)

- İki farklı Koha sürümündeki iki tenant ile aynı uygulama sürümü sorunsuz çalışır.
- A tenant'ının kullanıcısı hiçbir istekle B tenant'ının ya da başka bir kullanıcının verisine erişemez
  (otomatik test seti yeşil).
- Hiçbir Koha secret'ı mobil bundle'da, API yanıtında veya log'da bulunmaz.
- Koha hata mesajları kullanıcıya hiçbir zaman ham gösterilmez; tüm hatalar Türkçe/İngilizce mesajla gelir.
- Aynı iade hatırlatması aynı kullanıcıya bir kereden fazla gitmez.
- Uygulama offline iken son veriler görüntülenir, yazma işlemleri engellenir.
- p95 API gecikmesi (Koha hariç süre) < 150 ms; Koha'ya bağlı uçlar cache isabetinde < 200 ms.

## 5. Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Kurum Koha'sı internetten erişilemiyor | Kurum devreye alınamaz | Egress IP allowlist; connector ajanı yol haritası |
| Kurum plugin kurmak istemiyor | Arama yok/sınırlı | SRU/RSS fallback; `catalogSearch` kapalı devreye alma |
| Koha sürüm farkları beklenenden büyük | Adapter maliyeti artar | Faz 0 spike + contract testleri; desteklenen minimum sürüm ilanı (öneri: 24.05) |
| Servis hesabının geniş yetkisi | Gateway açığı = kurumun tüm patronları | Minimum yetki, IDOR testleri, audit, pentest |
| Push izin oranı düşük | Bildirim değeri azalır | Açıklayıcı izin ekranı, uygulama içi bildirim listesi |
| KVKK uyumsuzluğu | Yasal risk | Veri minimizasyonu, aydınlatma metni, VERBİS değerlendirmesi |

## 6. Sizden Onay Beklediğim Konular

1. [ARCHITECTURE.md §2](./ARCHITECTURE.md#2-tespit-edilen-eksikler-ve-açık-noktalar)'deki eksik/öneri listesi.
2. [ARCHITECTURE.md §12](./ARCHITECTURE.md#12-onay-bekleyen-mimari-kararlar)'deki kararlar (özellikle **MirAkıl Koha Plugin** ve ORM).
3. Desteklenecek **minimum Koha sürümü** (öneri: 24.05 LTS; daha eskisi için legacy adapter ayrı iş).
4. Pilot kurumlar ve Koha sürümleri; test için erişim (staging Koha) imkânı.
5. Uygulama adı: "Koha Mobile" mı "MirAkıl Kütüphane" mi? ("Koha" adının mağaza başlığında kullanımı
   için Koha topluluğu marka kullanımı da değerlendirilmeli; öneri: **"MirAkıl Kütüphane"**.)
6. Expo Push Service kullanımı (veri Expo sunucularından geçer) KVKK açısından kabul edilebilir mi?
7. Hosting tercihi (yurt içi veri merkezi zorunluluğu var mı?).
