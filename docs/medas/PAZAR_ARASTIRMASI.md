# MEDAS (Medya Arşiv Sistemi) Pazar Araştırması ve Hedef Kitle Analizi

Tarih: Ekim 2026 · Durum: Taslak

---

## 1. Yönetici özeti

MEDAS, açık kaynak Immich altyapısı üzerine özelleştirilmiş, yapay zeka destekli bir fotoğraf ve video arşiv sistemidir. Ürünün güçlü yanları: yüz tanıma, doğal dille arama ("kırmızı kurdele kesim töreni", "sahilde gün batımı"), harita ve zaman çizelgesi, mobil uygulamadan otomatik yükleme ve kurum içine (yerinde) kurulum imkanı.

Pazardaki temel fırsat şudur: Türkiye'de kurumların görsel arşivi büyük ölçüde harici disklerde, WhatsApp gruplarında, Google Drive klasörlerinde ve fotoğrafçıların kişisel bilgisayarlarında dağınık durumda. Aranan bir fotoğrafı bulmak saatler sürüyor, personel değiştiğinde arşiv kayboluyor.

**Önerilen birincil hedef kitle:** Belediyelerin Basın Yayın ve Halkla İlişkiler / Kurumsal İletişim müdürlükleri.
**İkincil hedef kitle:** Üniversiteler (kurumsal iletişim + kütüphane/arşiv), otel zincirleri ve turizm grupları, etkinlik ve organizasyon firmaları.
**Giriş stratejisi:** İlk 3 pilot müşteriyi (1 belediye, 1 üniversite, 1 otel grubu) referans olarak kazanmak ve aynı segmentteki benzer kurumlara bu referanslarla ulaşmak.

---

## 2. Pazar büyüklüğü ve eğilimler

| Kaynak | 2025 büyüklüğü | Projeksiyon | Yıllık büyüme |
|---|---|---|---|
| MarketsandMarkets (Mart 2026) | 6,23 milyar USD | 14,51 milyar USD (2031) | %15,4 |
| Roots Analysis | 6,67 milyar USD | 27,53 milyar USD (2035) | %15,3 |
| Technavio (2025) | belirtilmedi | +22,5 milyar USD (2024-2029) | %26,3 |

Dijital Varlık Yönetimi (DAM) pazarı küresel ölçekte yıllık %13-18 bandında büyüyor. Türkiye özelinde güvenilir bir rakam yayımlanmış değil. Büyümeyi tetikleyen eğilimler:

- **Sosyal medya baskısı:** Belediyeler ve oteller günde onlarca görsel üretiyor ve yayımlıyor. Geçmiş içeriğe hızlı erişim ihtiyacı arttı.
- **Yapay zeka ile arama:** Etiketlemeye gerek kalmadan içerik araması artık beklenen bir özellik.
- **Veri egemenliği ve KVKK:** Kamu kurumları verinin yurt dışı bulutlarda tutulmasından kaçınıyor. Yerinde kurulum ve yerli bulut önemli bir satış argümanı.
- **Kurumsal hafıza:** Belediye başkanı ve yönetim değişimlerinde arşivin korunması, yıllık faaliyet raporu ve kitap hazırlıkları.

---

## 3. Rakip analizi

### 3.1 Yerli rakipler

| Rakip | Konum | Not |
|---|---|---|
| **MEDAR (Turna Teknoloji, Ankara)** | "Yapay zeka destekli dijital varlık yönetim sistemi". Fotoğraf, video ve ses arşivi. Türkiye ve Katar ofisi. Ayrıca "Medar Cloud" adıyla bulut sürümü var. | En doğrudan rakip. Aynı dili (otomatik etiketleme, yapay zeka arama) kullanıyor. Körfez pazarına da açılmış. |
| **Dijital Arşiv A.Ş.** | Web tabanlı görsel ve medya varlık yönetimi. Yüz tanıma, nesne tespiti, sesten metne, tam metin arama. | Belge arşivi geçmişi güçlü, kamu ihalelerinde deneyimli. |
| **Cebirtech** | "Medya Varlık Yönetim Sistemi" ürünü, Meram Belediyesi referansı. | Belediye odaklı, küçük ölçekli. |

> Not: Rakip sitelerine (turnateknoloji.com, medarai.com) bu araştırma ortamından doğrudan erişilemedi. Bilgiler arama sonuçları ve firmaların kendi tanıtım metinlerinden derlendi. Fiyat ve referans listesi için sitelerin elle incelenmesi ve EKAP ihale kayıtlarının taranması önerilir.

### 3.2 Yabancı rakipler

Bynder, Canto, Adobe Experience Manager Assets, Brandfolder, Frontify. Güçlü ürünler, ancak:
- Fiyatları kullanıcı başı dolar bazlı ve Türkiye bütçeleri için yüksek.
- Veri yurt dışında tutuluyor (kamu için engel).
- Türkçe destek ve yerinde kurulum yok veya sınırlı.

### 3.3 Örnek alınan ürün: Ente (ente.com)

Ente, uçtan uca şifreli ve açık kaynak (AGPL-3.0) bir fotoğraf yedekleme servisidir. Bireysel ve aile kullanıcısına yöneliktir, doğrudan rakip değildir. İletişim dili MEDAS için örnek alındı:

- **Somut güven iddiası:** Her dosyanın 3 ayrı bulutta, 3 ayrı konumda saklanması (biri yeraltı sığınağında). MEDAS karşılığı: "Türkiye'de 3 kopya, 3 konum".
- **Açık kaynağı güven argümanı yapmak:** Kod açık, denetlenmiş. MEDAS'ta AGPL zorunluluğu bu sayede avantaja döner: "Kaynak kodu müşterilerimize açıktır, kilitlenme yok."
- **Şeffaf paketler ve ücretsiz başlangıç:** Depolama bazlı basit fiyat tablosu, ücretsiz katman, aylık/yıllık seçimi.
- **Platform listesi:** Web, mobil ve masaüstü uygulamaları açıkça gösteriliyor.
- **Kolay taşıma:** Google Fotoğraflar ve diğer servislerden içe aktarma vurgusu.
- **Kullanıcı görüşleri:** Sosyal kanıt bölümü.

Bu kalıplar web sayfası taslağına uyarlandı.

### 3.4 Fiili rakip: "hiçbir şey kullanmamak"

Gerçek rakip çoğu zaman yazılım değil, alışkanlıktır: harici disk, NAS klasörleri, Google Drive, WhatsApp. Satış konuşması "neden MEDAR değil MEDAS" sorusundan önce "neden bugünkü düzen sürdürülemez" sorusunu cevaplamalı.

### 3.5 MEDAS'ın farklılaşma noktaları

1. **Kamuya uygun satış yapısı:** Doğrudan temin ve ihale süreçlerine hazır teknik şartname ve teklif dokümanları.
2. **Yerinde kurulum + yerli bulut seçeneği:** Veri kurumda kalır.
3. **Arşiv aktarım hizmeti:** Disklerdeki eski arşivin düzenlenip sisteme aktarılması ürünle birlikte sunulur.
4. **Mobil uygulama ile otomatik yükleme:** Saha fotoğrafçısı çeker, fotoğraf arşive kendiliğinden düşer.
5. **Açık standartlar, kilitlenme yok:** Dosyalar orijinal hâliyle saklanır, istendiğinde dışa aktarılır.
6. **Fiyat:** Açık kaynak altyapı sayesinde kullanıcı başı lisans yerine depolama/kurum bazlı fiyatlandırma.

---

## 4. Hedef kitle segmentleri

Her segment için: ağrı noktası, karar verici, satış mesajı ve öncelik puanı (1-5).

### 4.1 Belediyeler: Basın Yayın ve Halkla İlişkiler Müdürlüğü ⭐ 5/5

- **Ağrı:** Günde 5-20 etkinlik, yılda yüz binlerce fotoğraf. "Başkanın 2021'deki park açılışındaki fotoğrafı" saatlerce aranıyor. Fotoğrafçı ayrılınca arşiv gidiyor. Seçim dönemi ve faaliyet raporu hazırlığında kriz.
- **Karar verici:** Basın Yayın Müdürü, Bilgi İşlem Müdürü (teknik onay), Genel Sekreter Yardımcısı. Satın alma: doğrudan temin (22/d sınırı içinde) veya ihale.
- **Mesaj:** "Belediyenizin görsel hafızası tek yerde, kurumunuzun sunucusunda. Yüz tanıma ile başkan, meclis üyeleri ve misafirlerin bulunduğu tüm kareler saniyeler içinde."
- **Alt hedefler:** Büyükşehir belediyeleri (kültür, ulaşım, itfaiye birimleri ayrı arşiv üretir), ilçe belediyeleri, belediye iştirakleri.
- **Ek kamu hedefleri:** Valilikler, kaymakamlıklar, il kültür turizm müdürlükleri, bakanlık basın müşavirlikleri, TBMM ve il genel meclisleri.

### 4.2 Üniversiteler ⭐ 4/5

- **Ağrı:** Kurumsal İletişim Koordinatörlüğü mezuniyet, kongre, ziyaret fotoğraflarını yönetemiyor. Kütüphane ve arşiv birimi tarihi fotoğraf koleksiyonunu dijitalleştiriyor ama sunacak platform yok.
- **Karar verici:** Kurumsal İletişim Koordinatörü, Kütüphane Daire Başkanı, Bilgi İşlem Daire Başkanı.
- **Mesaj:** "Üniversitenizin 50 yıllık görsel tarihi aranabilir ve paylaşılabilir."
- **Avantaj:** Kurumsal iletişim ve kütüphane/arşiv birimleri aynı sistemi ortak kullanabilir, tek satışla iki birime değer sunulur.

### 4.3 Otel zincirleri ve turizm grupları ⭐ 4/5

- **Ağrı:** Pazarlama ekibi, acenteler (tur operatörleri), sosyal medya ajansı ve OTA'lar (Booking, Expedia) güncel otel görsellerini sürekli istiyor. Görseller ajansın, eski pazarlama müdürünün diskinde. Hangi fotoğrafın kullanım hakkı var bilinmiyor.
- **Karar verici:** Pazarlama Müdürü, Satış ve Pazarlama Direktörü, grup IT müdürü.
- **Kullanım senaryoları:** Oda/tesis görsel kütüphanesi, acentelere süreli paylaşım linki, düğün ve etkinlik misafirlerine albüm teslimi, sezon bazlı arşiv.
- **Mesaj:** "Tüm tesislerinizin görselleri tek kütüphanede. Acenteye bir linkle, süreli ve kontrollü paylaşım."
- **Bölgesel odak:** Antalya, Muğla, İzmir, Kapadokya, İstanbul otel grupları.

### 4.4 Etkinlik, organizasyon ve düğün firmaları ⭐ 4/5

- **Ağrı:** Bir etkinlikte binlerce kare çekiliyor. Katılımcı "kendi fotoğraflarımı" istiyor. WeTransfer linkleri süresi dolunca kayboluyor.
- **Karar verici:** Firma sahibi / operasyon müdürü (hızlı karar, küçük bütçe).
- **Kullanım:** Etkinlik bazlı albüm, misafire QR kodlu paylaşım, yüz tanıma ile "bana ait kareler" (KVKK aydınlatması ve açık rıza ile).
- **Mesaj:** "Etkinlik bitmeden fotoğraflar misafirlerinizde."
- **Not:** Bu segment bulut (SaaS) paketine uygun. Yerinde kurulum istemez.

### 4.5 Kurumsal şirketler: Kurumsal İletişim ve Pazarlama ⭐ 3/5

- Holdingler, fabrikalar, enerji, inşaat, perakende zincirleri.
- **Ağrı:** Marka görselleri, ürün fotoğrafları, saha / şantiye ilerleme fotoğrafları, bayi ağına görsel dağıtımı.
- **İnşaat ve sanayi için özel senaryo:** Şantiye ilerleme fotoğrafları konum ve tarihe göre otomatik düzenlenir (harita görünümü). Hak ediş ve denetim raporlarında kanıt arşivi.

### 4.6 Medya kuruluşları ve ajanslar ⭐ 3/5

- Yerel gazeteler, TV kanalları, haber ajansları, reklam / sosyal medya ajansları.
- **Ağrı:** Haber fotoğraf arşivi, müşteri bazlı görsel yönetimi.
- **Not:** Profesyonel medya kuruluşları yayın akışı (MAM) entegrasyonu ister. MEDAS ilk aşamada küçük ve orta ölçekli medyaya uygun.

### 4.7 Müzeler, vakıflar, STK'lar, kültür kurumları ⭐ 3/5

- Tarihi fotoğraf koleksiyonları, kent arşivleri, kent müzeleri.
- Belediye kent arşivi projeleriyle birleştirilebilir.

### 4.8 Spor kulüpleri ve federasyonlar ⭐ 2/5

- Maç ve antrenman fotoğrafları, sporcu bazlı arama (yüz tanıma).
- Bütçesi sınırlı, ancak görünürlüğü yüksek referans.

### 4.9 Siyasi partiler ve seçim kampanyaları ⭐ 2/5

- İl ve ilçe teşkilatlarından gelen yoğun görsel akışı.
- Dönemsel ihtiyaç. Seçim öncesi 6 ay yoğun talep.

### 4.10 Okullar ve özel eğitim kurumları ⭐ 2/5

- Kolej zincirleri, yıllık / mezuniyet albümleri, veli paylaşımı.
- Çocuk görselleri nedeniyle KVKK hassasiyeti yüksek. Dikkatli konumlandırma gerekir.

### Öncelik matrisi

| Segment | Ağrı şiddeti | Bütçe | Ulaşılabilirlik | Satış döngüsü | Öncelik |
|---|---|---|---|---|---|
| Belediye Basın Yayın | Yüksek | Orta | Yüksek | 2-6 ay | **1** |
| Üniversite | Orta-Yüksek | Orta | Çok yüksek | 3-9 ay | **2** |
| Otel grupları | Yüksek | Orta-Yüksek | Düşük | 1-3 ay | **3** |
| Organizasyon firmaları | Yüksek | Düşük | Düşük | 2-6 hafta | **4** |
| Kurumsal / inşaat | Orta | Yüksek | Düşük | 3-6 ay | 5 |

---

## 5. Konumlandırma ve mesaj

**Tek cümle:** MEDAS, kurumların fotoğraf ve video arşivini tek yerde toplayan, yapay zeka ile saniyeler içinde aranabilir hâle getiren ve veriyi kurumun kendi sunucusunda tutan medya arşiv sistemidir.

**Slogan önerileri:**
- "Kurumunuzun görsel hafızası, tek adreste."
- "Aradığınız fotoğraf, saniyeler içinde."
- "Fotoğrafı tarif edin, MEDAS bulsun."

---

## 6. Fiyatlandırma önerisi (taslak)

Kullanıcı başı lisans yerine **depolama + kurulum modeli** önerilir. Bu, rakiplerden net bir ayrışma sağlar ve kurumun tüm personelinin sisteme erişmesini teşvik eder.

| Paket | Kime | İçerik | Model |
|---|---|---|---|
| **MEDAS Bulut Başlangıç** | Organizasyon firmaları, küçük oteller | 1 TB, 10 kullanıcı, paylaşım linkleri | Aylık / yıllık abonelik |
| **MEDAS Bulut Kurumsal** | Otel grupları, ilçe belediyeleri | 5-20 TB, sınırsız kullanıcı, yüz tanıma, SSO | Yıllık abonelik |
| **MEDAS Yerinde** | Büyükşehir, üniversite, kamu | Kurum sunucusuna kurulum, eğitim, veri aktarımı | Tek seferlik kurulum + yıllık bakım-destek |
| **Ek hizmetler** | Tümü | Eski arşivin taranması ve aktarımı, dijitalleştirme, özel entegrasyon | Proje bazlı |

Ek gelir kalemi: **arşiv aktarım hizmeti.** Kurumların harici disklerdeki 10-20 yıllık arşivi düzenleyip sisteme aktarmak, tek başına satılabilir bir hizmettir ve tarama/dijitalleştirme hizmetiyle genişletilebilir.

Somut TL fiyatları için rakip tekliflerinin ve EKAP'ta "medya arşiv", "fotoğraf arşiv yazılımı", "dijital varlık yönetimi" anahtar kelimeleriyle geçmiş ihale bedellerinin taranması önerilir.

---

## 7. Satış ve pazarlama kanalları

1. **Pilot programı:** Seçilen belediye ve üniversitelere ücretsiz pilot (3 ay, 500 GB).
2. **Belediye birlikleri ve fuarlar:** Marmara Belediyeler Birliği, Türkiye Belediyeler Birliği etkinlikleri, Yerel Yönetimler fuarları.
3. **Turizm fuarları:** EMITT, Travel Turkey İzmir; Antalya otelciler dernekleri (AKTOB vb.).
4. **LinkedIn içerikleri:** "Önce / sonra" senaryoları, örnek arama videoları.
5. **Basın müdürleri ağı:** Belediye basın müdürlerinin WhatsApp ve sektör buluşmaları. Bir referans, ikinci belediyeyi getirir.
6. **Demo:** Demo sunucusu üzerinde örnek arşivle canlı demo hesabı.

---

## 8. Riskler ve dikkat edilecek konular

### 8.1 Lisans (kritik)

Immich **AGPL-3.0** lisanslıdır. Bu lisansın sonuçları:
- Değiştirilmiş sürümü ağ üzerinden kullanıcılara sunduğunuzda (SaaS veya müşteri kurulumu), **değiştirilmiş kaynak kodu bu kullanıcılara AGPL-3.0 altında sunmanız** gerekir.
- Yazılımı satmak ve hizmet ücreti almak serbesttir. Kodu kapalı tutmak serbest değildir.
- "Immich" adı ve logosu FUTO'ya aittir. MEDAS markası kullanılabilir, ancak "Immich tabanlıdır" atfının ve lisans metninin korunması gerekir.
- Önerilen iş modeli: **yazılım açık, değer hizmette.** Kurulum, barındırma, destek, eğitim, arşiv aktarımı, entegrasyon ve SLA satılır.

Bu konuda bir bilişim hukuku avukatından yazılı görüş alınması önerilir.

### 8.2 KVKK ve yüz tanıma

- Yüz tanıma ile çıkarılan yüz verisi, KVKK kapsamında **biyometrik veri (özel nitelikli kişisel veri)** sayılma riski taşır.
- Kurul'un 29/04/2026 tarihli ve 2026/921 sayılı ilke kararı, işyerinde biyometrik veri işlemeye sıkı sınır getirdi. Bu karar mesai takibine yönelik olsa da kamu müşterileri bu konuda hassastır.
- Önerilen önlemler: yüz tanıma modülünün **varsayılan kapalı** olması ve kurum tarafından açılması, veri işleme sözleşmesi şablonu, aydınlatma metni şablonu, verinin yurt içinde tutulması, erişim kayıtları (log).
- Bu, satışta bir **avantaja** çevrilebilir: "KVKK uyum paketi" ile birlikte sunulan tek yerli çözüm.

### 8.3 Diğer riskler

- **Upstream bağımlılığı:** Immich hızlı gelişiyor. Özelleştirmelerin her sürümde taşınması bakım maliyeti yaratır.
- **Ölçek:** Büyükşehir ölçeğinde (50+ TB, milyonlarca dosya) performans testi yapılmalı.
- **Rekabet:** MEDAR aynı mesajla pazarda. Fark net anlatılmazsa fiyat rekabetine dönüşür.

---

## 9. Sonraki adımlar

1. Demo sunucusu üzerinde örnek arşivle demo hesabı hazırlamak ve ekran görüntüleri almak.
2. 3 pilot müşteri seçmek: 1 belediye, 1 üniversite, 1 otel grubu.
3. AGPL ve KVKK için hukuki görüş almak.
4. Rakip fiyatlarını ve EKAP ihale bedellerini toplamak, TL fiyat listesini netleştirmek.
5. Web sayfası taslağını (bu klasördeki `landing/index.html`) gerçek ekran görüntüleri ve referanslarla güncellemek.

---

## Kaynaklar

- [MEDAR AI ile Medya Arşivinizi Canlandırın](https://medarai.com/)
- [Turna Technology (LinkedIn)](https://www.linkedin.com/company/turnateknoloji)
- [Medar Cloud (LinkedIn)](https://tr.linkedin.com/showcase/medar-cloud/)
- [Dijital Arşiv A.Ş.: Yapay zeka destekli görsel ve medya yönetim yazılımı](https://dijitalarsiv.com/haber/yapay-zeka-destekli-gorsel-ve-medya-yonetim-yazilimini-sektorun-hizmetine-sunduk)
- [Cebirtech: Meram Belediyesi](https://cebirtech.com/meram-belediyesi/)
- [MarketsandMarkets: DAM pazarı 2031'de 14,51 milyar USD](https://www.marketsandmarkets.com/PressReleases/digital-asset-management.asp)
- [Roots Analysis: DAM pazarı](https://www.rootsanalysis.com/digital-asset-management-dam-market)
- [Technavio: DAM pazar analizi](https://technavio.com/report/digital-asset-management-market-industry-analysis)
- [Ente](https://ente.io) ve [Ente özellikler](https://community.ente.io/features)
- [Immich: FUTO two years later](https://immich.app/blog/futo-two-years-later)
- [KVKK 2026/921 sayılı ilke kararı (Alomaliye)](https://www.alomaliye.com/2026/06/02/mesai-takibinde-biyometrik-veri-islenmesine-yeni-ilke-karari-kvkk/)
- [Yerel yönetimlerde yapay zeka rehberi](https://www.yapayzekaokulum.com/blog/yerel-yonetimlerde-yapay-zeka)
