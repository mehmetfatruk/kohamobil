# KOHA_COMPATIBILITY — Sürüm Uyumluluk Tablosu

## Gerçek sunucu sonuçları

| Kurum | Sürüm | Destek seviyesi | Eksik | Not |
|---|---|---|---|---|
| Koha-TR Demo (koha-tr.com) | bilinmiyor (OPAC sürüm bilgisi gizli) | LIMITED → **FULL** (yedek arama ile) | `catalog.search` (tam metin) | `identifier`'lı şifre doğrulama, çoğul `renewals`, teslim şubeleri, okuma geçmişi, hesap hareketleri mevcut. Tam metin arama için MirAkıl eklentisi gerekir; o zamana kadar `rest.biblios.query` (başlık/yazar/ISBN) kullanılır |

## Sürüm matrisi

> Durum: **Faz 0 sürüm matrisi bekleniyor.** Bu tablo `infra/ktd/probe-matrix.sh` raporlarından üretilecek;
> elle düzenlenmez. Minimum desteklenen Koha sürümü bu tablodaki **zorunlu çekirdek** sonucuna göre ilan edilir
> ([KOHA_INTEGRATION.md §2.3](./KOHA_INTEGRATION.md#23-destek-seviyeleri-ve-minimum-sürümün-belirlenmesi)).

| İşlem | Katman | 22.05 | 22.11 | 23.05 | 23.11 | 24.05 | 24.11 | 25.05 | 25.11 |
|---|---|---|---|---|---|---|---|---|---|
| service.authenticate | core | | | | | | | | |
| patron.validateCredentials | core | | | | | | | | |
| patron.get | core | | | | | | | | |
| loans.list | core | | | | | | | | |
| … | | | | | | | | | |
| **Destek seviyesi** | | | | | | | | | |
