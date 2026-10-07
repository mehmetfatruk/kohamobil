# Koha sürüm matrisi (KTD)

Uygulamanın Koha sürümlerine bağımlı olmaması için uyumluluk katmanı
([docs/KOHA_INTEGRATION.md §2](../../docs/KOHA_INTEGRATION.md)) birden çok Koha sürümüne karşı test edilir.
Yerel/CI ortamında Koha topluluğunun resmi geliştirme ortamı
[koha-testing-docker (KTD)](https://gitlab.com/koha-community/koha-testing-docker) kullanılır.

## Bir sürümü ayağa kaldırma

```sh
git clone https://gitlab.com/koha-community/koha-testing-docker.git ~/ktd
git clone https://git.koha-community.org/Koha-community/Koha.git ~/koha   # büyük bir depo
cd ~/koha && git checkout 24.05.x

cd ~/ktd
cp env/defaults.env .env
# .env içinde:
#   SYNC_REPO=$HOME/koha
#   KOHA_IMAGE=24.05            # infra/ktd/versions.txt'teki etiket
bin/ktd --proxy up -d   # veya: docker compose -p koha up -d
```

KTD staff arayüzü varsayılan olarak `http://localhost:8081`, OPAC `http://localhost:8080` adresindedir.

## Uyumluluk raporu

```sh
infra/ktd/probe-matrix.sh 24.05 http://localhost:8081
```

- Koha'nın OpenAPI spec'i `packages/koha-client/test/fixtures/specs/24.05.json` olarak kaydedilir
  (contract testlerinin girdisi).
- Rapor (`infra/ktd/reports/24.05.json`): her Gateway işlemi için seçilen strateji ve destek seviyesi.
- Matris tamamlandığında raporlardan `docs/KOHA_COMPATIBILITY.md` tablosu üretilir ve minimum desteklenen
  sürüm bu tabloya göre ilan edilir.

## Senaryo testleri için Koha ayarları

Uçtan uca senaryolar (giriş, yenileme, rezervasyon) için KTD'de:

- Sistem tercihi `RESTOAuth2ClientCredentials` → Enable
- Servis hesabı (personel patron) + API anahtarı; yetkiler: [KOHA_INTEGRATION.md §1.1](../../docs/KOHA_INTEGRATION.md)
- `UseKohaPlugins` → Enable (eklentili senaryolar için)

API anahtarı (client secret) **repoya yazılmaz**; testler `KOHA_TEST_CLIENT_ID` ve
`KOHA_TEST_CLIENT_SECRET` ortam değişkenlerinden okur.
