# MVP_PLAN — Kapsam ve Aşamalar

> Durum: **Taslak v0.2.** Onaylanan kararlar: [DECISIONS.md](./DECISIONS.md). Uygulama adı: **MirAkıl Kütüphane**. Süreler 1 full-stack + 1 mobil geliştirici varsayımıyla kaba tahmindir;
> mimari onayından sonra netleştirilecektir.

## 1. MVP Tanımı

**Hedef:** `CENTRAL` modelde, Türkiye'de barındırılan merkezi backend ile 2–3 pilot kurumun (Koha 24.05+, farklı sürümler) öğrencilerinin, mağazadan indirdikleri tek
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
| Bildirimler | `NotificationProvider` katmanı + `ExpoNotificationProvider`; Expo + native token kaydı; kişisel veri içermeyen push şablonları; `DUE_SOON`, `DUE_TODAY`, `OVERDUE`, `HOLD_READY`; uygulama içi bildirim listesi; tercihler |
| Offline | Okuma cache'i, yazma işlemlerinin offline engellenmesi |
| i18n / tema | Türkçe + İngilizce, dark mode |
| Admin | Kurum CRUD, tema/logo, Koha bağlantısı + test, capability görüntüleme, feature flags, çalışma saatleri, duyurular, son Koha hataları, temel istatistik |
| Güvenlik | Tenant izolasyonu (guard + RLS), rate limit, şifreli secret, audit log, correlation ID, Sentry |
| Koha | En düşük 24.05; `Koha2405Adapter`, `Koha2511Adapter`, sürüm reddi (< 24.05), MirAkıl Koha eklentisi v1 (info + search + toplu yenilenebilirlik + toplu iade verisi) |
| Barındırma | Docker Compose ile `CENTRAL` kurulum (Türkiye), Tenant Directory uçları, self-hosted gözlemlenebilirlik, yedekleme |

### 1.2 MVP'de YOK (sonraki fazlar)

- LDAP / SAML / OIDC girişleri
- Okuma geçmişi (`history`) ve geçmiş rezervasyonlar (plugin v2)
- Borç hareket geçmişinin tamamı, online ödeme (PaymentProvider yalnızca arayüz olarak)
- `HOLD_EXPIRING`, `MEMBERSHIP_EXPIRING` bildirimleri
- `FcmNotificationProvider` / `ApnsNotificationProvider` (arayüz hazır, MVP'de Expo kullanılır)
- `ON_PREMISE` kurulum paketi ve Push Relay (mimari hazır, uygulama sonraki faz)
- Biyometrik kilit, çoklu hesap, tümünü yenile
- `TENANT_ADMIN` rolü (MVP'de yalnızca `PLATFORM_ADMIN`; duyuruları MirAkıl girer) — opsiyonel

## 2. Aşamalar

### Faz 0 — Temel ve Doğrulama (1–2 hafta)

- [x] Temel mimari kararlar ([DECISIONS.md](./DECISIONS.md) D1–D8)
- [ ] Monorepo iskeleti: pnpm + Turborepo, `packages/config`, lint/format/typecheck, CI
- [ ] `infra/docker/compose.base.yml` + `compose.dev.yml`: PostgreSQL, Redis, api, worker, Caddy
- [ ] KTD ile 24.05, 24.11, 25.05 ve 25.11 test Koha'ları + örnek veri
- [ ] **Koha spike:** [KOHA_INTEGRATION.md](./KOHA_INTEGRATION.md) §3 tablosundaki her endpoint'in
      gerçek sürümlerde doğrulanması, fixture'ların kaydedilmesi, belgede "≈" işaretlerinin kaldırılması
- [ ] Açık önerilerin (D9–D16) netleşmesi

**Çıktı:** Çalışan boş api/mobile/admin uygulamaları, doğrulanmış Koha yetenek matrisi.

### Faz 1 — Backend Çekirdeği (3–4 hafta)

- [ ] Prisma şeması + RLS migration'ları, seed
- [ ] `RequestContext`, correlation ID, problem details filtresi, pino redact, Sentry
- [ ] Envelope encryption servisi + `KeyProvider` (dosya; OpenBao implementasyonu)
- [ ] `StorageProvider` (yerel disk + S3 uyumlu)
- [ ] Tenant modülü + Tenant Directory uçları (`deploymentMode`, `apiBaseUrl`, imzalı yanıt) + public config + feature flags
- [ ] `packages/koha-client`: HTTP istemci (OAuth2 token cache, timeout, circuit breaker),
      `KohaAdapter`, `Koha2405Adapter`, `Koha2511Adapter`, capability probe, sürüm reddi (< 24.05), error mapper, MARC21 normalizer
- [ ] Auth modülü: KOHA provider, JWT, refresh rotation + reuse detection, logout
- [ ] `/me`, `/me/summary`, `/me/card`, `/loans` (+renewability, renew), `/holds` (list, cancel), `/fines`, `/libraries`
- [ ] Rate limiting, audit log, self-hosted GlitchTip entegrasyonu
- [ ] E2E: tenant isolation + IDOR test seti (CI zorunlu)

**Çıktı:** Postman/OpenAPI ile uçtan uca çalışan Gateway (iki KTD tenant'ı).

### Faz 2 — Mobil MVP (3–4 hafta, Faz 1 ile kısmen paralel)

- [ ] Expo Router iskeleti, bottom tabs, tema sistemi (tenant renkleri + dark mode + kontrast)
- [ ] i18n (tr/en)
- [ ] Onboarding: Hoş geldiniz → Kurum Seçimi (Tenant Directory, `apiBaseUrl` saklama) → Login
- [ ] Marka: uygulama adı/ikon "MirAkıl Kütüphane", `tr.com.mirakil.kutuphane`
- [ ] SecureStore, api-client interceptor (single-flight refresh)
- [ ] Ana Sayfa, Dijital Kart, Ödünçlerim (+ yenileme), Rezervasyonlarım (+ iptal), Borçlar, Profil, Kütüphane
- [ ] TanStack Query persist (MMKV) + offline banner + `useOnlineMutation`
- [ ] Feature flag'e göre dinamik menü
- [ ] Sentry SDK → self-hosted GlitchTip, EAS Build (internal distribution)

**Çıktı:** TestFlight / Play Internal Testing ile pilot kullanıcılara dağıtılabilir sürüm (katalog hariç).

### Faz 3 — Katalog + Rezervasyon Oluşturma + Plugin v1 (2–3 hafta)

- [ ] MirAkıl Koha eklentisi v1: `info`, `search`, `patrons/{id}/renewability`, `notices/due` (Koha 24.05+)
- [ ] Search strategy (plugin → SRU fallback), MARC21 (+ UNIMARC temel) normalizer
- [ ] Kapak proxy + cache
- [ ] Mobil: arama ekranı (alan seçimi), sonuç kartı, detay, nüsha listesi, Rezervasyon Yap (teslim şubesi seçimi)
- [ ] Şifre değiştirme (backend + mobil)

### Faz 4 — Bildirimler (2–3 hafta)

- [ ] Worker entrypoint, BullMQ kuyrukları, scheduler (tenant başına jitter'lı)
- [ ] `NotificationProvider` arayüzü, `NotificationRouter`, `ExpoNotificationProvider`
- [ ] `tenant-scan`, `notification-fanout`, `push-send`, `push-receipts`
- [ ] Dedupe kısıtları, sessiz saatler, push birleştirme
- [ ] Push şablonları (tr/en, kişisel veri yok) + payload sözleşme testi (`MirakilPushDataV1`)
- [ ] Mobil: `PushRegistration` modülü (Expo + native token), izin/KVKK bilgilendirme ekranı, bildirim listesi, tercihler ekranı, deep link
- [ ] Sağlayıcı değiştirme provası: sahte FCM sunucusuyla `FcmNotificationProvider` iskeleti ve uçtan uca test
- [ ] Duyurular (backend + mobil liste/detay + push)

### Faz 5 — Yönetim Paneli (2–3 hafta, Faz 3–4 ile paralel olabilir)

- [ ] Admin auth (2FA), kurum listesi/ekle/düzenle/pasifleştir, logo yükleme, tema önizleme
- [ ] Koha bağlantısı (write-only secret), bağlantı testi, sürüm/capability görüntüleme
- [ ] Feature flags, çalışma saatleri, duyurular
- [ ] İstatistikler (aktif kullanıcı, cihaz), push durumu, son Koha hataları, audit log

### Faz 6 — Sağlamlaştırma ve Yayın (2 hafta)

- [ ] Güvenlik incelemesi (OWASP MASVS / ASVS kontrol listesi), bağımlılık taraması, pentest (öneri)
- [ ] Yük testi (k6): 100 tenant simülasyonu, worker taraması
- [ ] KVKK: aydınlatma metni, açık rıza, gizlilik politikası, veri silme talebi akışı, **Expo/APNs/FCM yurt dışı aktarım değerlendirmesi** (hukuki görüş)
- [ ] App Store / Play Store: ad "MirAkıl Kütüphane", açıklamada "Koha kütüphane yönetim sistemleri ile entegre çalışır", gizlilik etiketleri, ekran görüntüleri
- [ ] Prod altyapı (Türkiye): Docker Compose kurulum, sabit çıkış IP'si, pgBackRest/wal-g yedekleri + Türkiye'de ikinci lokasyon, geri yükleme testi, izleme panoları, alarmlar
- [ ] Pilot kurumlarla kabul testleri → mağaza yayını

**Toplam kaba tahmin:** ~14–18 hafta (paralel çalışmayla kısalabilir).

## 3. Sonraki Fazlar (MVP sonrası)

| Faz | İçerik |
|---|---|
| 7 | LDAP provider, OIDC provider, SAML (YÖK/EduGAIN federasyonu) |
| 8 | Okuma geçmişi, geçmiş rezervasyonlar, borç hareket geçmişi (plugin v2), `HOLD_EXPIRING`, `MEMBERSHIP_EXPIRING` |
| 9 | Online ödeme (PaymentProvider: iyzico / PayTR / sanal POS), Koha'ya ödeme kaydı |
| 10 | `ON_PREMISE` kurulum paketi, MirAkıl Push Relay, `TENANT_ADMIN` rolü |
| 10b | Doğrudan FCM/APNs'e geçiş (`FcmNotificationProvider`, `ApnsNotificationProvider`) — KVKK değerlendirmesine göre |
| 11 | Biyometrik kilit, tümünü yenile, deep link/QR ile kurum seçimi, widget'lar, Apple/Google Wallet kartı |

## 4. Kabul Kriterleri (MVP)

- İki farklı Koha sürümündeki (≥ 24.05) iki tenant ile aynı uygulama sürümü sorunsuz çalışır; 24.05 altı Koha bağlantı testinde reddedilir.
- Push payload'larında kişisel veri bulunmaz (otomatik sözleşme testi yeşil).
- Bildirim sağlayıcısı yalnızca backend yapılandırmasıyla değiştirilebilir (mobilde kod değişikliği gerekmez; testle gösterilir).
- Sistem, belirli bir bulut sağlayıcısına bağlı olmadan temiz bir Linux sunucuda Docker Compose ile kurulabilir.
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
| Kurum Koha'sı internetten erişilemiyor | Kurum devreye alınamaz | Sabit çıkış IP'si + allowlist; ileride `ON_PREMISE` kurulum |
| Kurum plugin kurmak istemiyor | Arama yok/sınırlı | SRU/RSS fallback; `catalogSearch` kapalı devreye alma |
| Koha sürüm farkları beklenenden büyük | Adapter maliyeti artar | Faz 0 spike + contract testleri; en düşük sürüm 24.05 |
| Expo'ya bağımlılık / KVKK görüşünün olumsuz çıkması | Bildirim altyapısı değişmeli | `NotificationProvider` + native token kaydı → yalnızca backend değişikliği; gerekirse data-only push |
| Self-hosted işletim yükü (yedek, izleme, güncelleme) | Operasyon maliyeti | Compose dosyaları, otomatik yedek + aylık geri yükleme testi, runbook'lar |
| Servis hesabının geniş yetkisi | Gateway açığı = kurumun tüm patronları | Minimum yetki, IDOR testleri, audit, pentest |
| Push izin oranı düşük | Bildirim değeri azalır | Açıklayıcı izin ekranı, uygulama içi bildirim listesi |
| KVKK uyumsuzluğu | Yasal risk | Veri minimizasyonu, aydınlatma metni, VERBİS değerlendirmesi |

## 6. Açık Konular

Onaylanan kararlar [DECISIONS.md](./DECISIONS.md)'de (D1–D8). Hâlâ girdinize ihtiyaç duyulanlar:

1. **D9–D16 önerileri** (admin framework, dijital kart MVP'de, eklentinin monorepo içinde olması, admin
   rolleri, Push Relay, anahtar yönetimi, self-hosted hata takibi) — itiraz yoksa onaylı kabul edilecek.
2. **Pilot kurumlar**, Koha sürümleri ve test için Koha erişimi (staging Koha + servis hesabı).
3. **KVKK hukuki değerlendirmesi:** Expo (push + EAS Update) ve APNs/FCM üzerinden yurt dışına aktarılan veriler.
4. **Alan adları:** Tenant Directory / API / universal link alan adları (ör. `mirakil-kutuphane.com`).
5. **Pilot için sunucu:** Türkiye'deki hangi VPS / özel sunucu / MirAkıl sunucusu kullanılacak?
