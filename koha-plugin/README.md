# MirAkıl Koha Eklentisi

`Koha::Plugin::Com::MirAkil::Mobile` — MirAkıl Kütüphane Gateway'i için Koha'ya ek REST uçları
(`/api/v1/contrib/mirakil/...`) sağlar: katalog arama, sistem tercihleri, toplu yenilenebilirlik,
geçmiş rezervasyonlar, toplu bildirim verisi.

> Durum: **Faz 3**'te geliştirilecek. Tasarım: [docs/KOHA_INTEGRATION.md §4](../docs/KOHA_INTEGRATION.md).

İlkeler:

- Yalnızca Koha'nın kendi Perl API'leri kullanılır (doğrudan SQL yok); sürüm farkları eklenti içinde
  küçük bir uyumluluk modülünde toplanır.
- Desteklenen Koha sürüm aralığı, Gateway ile aynı sürüm matrisinde ([infra/ktd](../infra/ktd)) doğrulanır.
- Eklenti zorunlu değildir; kurulu değilse Gateway core REST stratejilerine düşer.
