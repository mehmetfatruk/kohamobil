# MirAkıl Kütüphane

MirAkıl Veri İşleme tarafından geliştirilen, birden fazla kurumun bağımsız kütüphane sistemlerini
destekleyen multi-tenant iOS/Android kütüphane uygulaması. Koha kütüphane yönetim sistemleri ile entegre çalışır.

> Durum: **Mimari doğrulama aşaması** — henüz uygulama kodu yok.

## Dokümanlar

| Doküman | İçerik |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Gereksinim analizi, eksikler, sistem mimarisi, güvenlik modeli, klasör yapısı |
| [docs/DATABASE.md](docs/DATABASE.md) | ER diyagramı, tablolar, RLS, şifreleme, Redis şeması |
| [docs/API.md](docs/API.md) | `/mobile/v1` ve `/admin/v1` uç tasarımı, hata kodları |
| [docs/KOHA_INTEGRATION.md](docs/KOHA_INTEGRATION.md) | Adapter mimarisi, Koha REST fonksiyon matrisi, plugin ihtiyaçları, hata eşleme |
| [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) | KOHA/LDAP/SAML/OIDC provider yapısı, token ve oturum tasarımı |
| [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) | `NotificationProvider` katmanı, kişisel veri içermeyen push, worker/kuyruk tasarımı, tekrarsızlık |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker tabanlı, sağlayıcıdan bağımsız barındırma; `CENTRAL` / `ON_PREMISE`; veri konumu |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Mimari karar kaydı |
| [docs/MVP_PLAN.md](docs/MVP_PLAN.md) | MVP kapsamı, fazlar, riskler, onay bekleyen konular |
