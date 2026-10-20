import type {
  Announcement,
  AppNotification,
  FineLine,
  ItemStatus,
  ItemType,
  Library,
  TenantDirectoryEntry,
} from '@mirakil/types';

/**
 * ÖRNEK VERİ — yalnızca arka uç hazır olmadan ekranları denemek içindir.
 * Kişiler ve kurumlar kurgusaldır. Tarihler her açılışta "bugün"e göre hesaplanır.
 */

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const daysFromToday = (days: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

export interface MockTenant extends TenantDirectoryEntry {
  domains: string[];
  primaryColor: string;
  secondaryColor: string;
}

export const TENANTS: MockTenant[] = [
  {
    id: '0192a000-0000-7000-8000-000000000001',
    code: 'ornek-uni',
    name: 'Örnek Üniversitesi Kütüphanesi',
    shortName: 'ÖÜ Kütüphane',
    city: 'Ankara',
    deploymentMode: 'CENTRAL',
    apiBaseUrl: 'https://api.koha-tr.com',
    domains: ['katalog.ornek.edu.tr', 'koha.ornek.edu.tr'],
    primaryColor: '#8B1E3F',
    secondaryColor: '#C9A227',
  },
  {
    id: '0192a000-0000-7000-8000-000000000002',
    code: 'demo-teknik',
    name: 'Demo Teknik Üniversitesi Kütüphane ve Dokümantasyon',
    shortName: 'DTÜ Kütüphane',
    city: 'İstanbul',
    deploymentMode: 'CENTRAL',
    apiBaseUrl: 'https://api.koha-tr.com',
    domains: ['kutuphane.demoteknik.edu.tr'],
    primaryColor: '#0F5C9C',
    secondaryColor: '#F28C28',
  },
  {
    id: '0192a000-0000-7000-8000-000000000003',
    code: 'kent-halk',
    name: 'Kent Belediyesi Halk Kütüphaneleri',
    shortName: 'Kent Kütüphaneleri',
    city: 'İzmir',
    deploymentMode: 'CENTRAL',
    apiBaseUrl: 'https://api.koha-tr.com',
    domains: ['kutuphane.kent.bel.tr'],
    primaryColor: '#0F766E',
    secondaryColor: '#65A30D',
  },
  {
    id: '0192a000-0000-7000-8000-000000000004',
    code: 'mirakil-demo',
    name: 'MirAkıl Demo Kütüphanesi',
    shortName: 'MirAkıl Demo',
    city: 'Kayseri',
    deploymentMode: 'CENTRAL',
    apiBaseUrl: 'https://api.koha-tr.com',
    domains: ['demo.koha-tr.com'],
    primaryColor: '#1A73E8',
    secondaryColor: '#0B3D91',
  },
];

const weekdayHours = (open: string, close: string, saturday: [string, string] | null) =>
  [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    if (weekday === 0) return { weekday, opensAt: null, closesAt: null, closed: true };
    if (weekday === 6) {
      return saturday
        ? { weekday, opensAt: saturday[0], closesAt: saturday[1], closed: false }
        : { weekday, opensAt: null, closesAt: null, closed: true };
    }
    return { weekday, opensAt: open, closesAt: close, closed: false };
  });

export const LIBRARIES: Library[] = [
  {
    id: 'lb_merkez',
    name: 'Merkez Kütüphane',
    address: 'Üniversite Kampüsü, Kütüphane Binası, Çankaya / Ankara',
    phone: '+90 312 000 00 00',
    email: 'kutuphane@ornek.edu.tr',
    website: 'https://kutuphane.ornek.edu.tr',
    location: { lat: 39.8913, lng: 32.7836 },
    hours: weekdayHours('08:00', '23:00', ['09:00', '18:00']),
    pickupLocation: true,
  },
  {
    id: 'lb_muh',
    name: 'Mühendislik Fakültesi Kütüphanesi',
    address: 'Mühendislik Fakültesi, B Blok Zemin Kat',
    phone: '+90 312 000 00 01',
    email: 'muhendislik.kutuphane@ornek.edu.tr',
    website: null,
    location: { lat: 39.8932, lng: 32.7811 },
    hours: weekdayHours('08:30', '20:00', null),
    pickupLocation: true,
  },
  {
    id: 'lb_tip',
    name: 'Tıp Fakültesi Kütüphanesi',
    address: 'Tıp Fakültesi Hastanesi Yanı',
    phone: '+90 312 000 00 02',
    email: 'tip.kutuphane@ornek.edu.tr',
    website: null,
    location: { lat: 39.8881, lng: 32.7902 },
    hours: weekdayHours('08:00', '22:00', ['10:00', '16:00']),
    pickupLocation: false,
  },
];

export const ITEM_TYPES: ItemType[] = [
  { code: 'BK', name: 'Kitap', recordCount: null },
  { code: 'SER', name: 'Süreli Yayın', recordCount: null },
  { code: 'TEZ', name: 'Tez', recordCount: null },
  { code: 'REF', name: 'Başvuru Kaynağı', recordCount: null },
  { code: 'EBK', name: 'E-Kitap', recordCount: null },
];

export interface MockItem {
  id: string;
  libraryId: string;
  location: string;
  status: ItemStatus;
  dueInDays?: number;
}

export interface MockRecord {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  year: string;
  publisher: string;
  place: string;
  type: string;
  callNumber: string;
  isbn?: string;
  issn?: string;
  pages?: string;
  edition?: string;
  language: string;
  subjects: string[];
  summary?: string;
  series?: string;
  acquiredDaysAgo: number;
  items: MockItem[];
}

const shelf = (
  libraryId: string,
  status: ItemStatus = 'AVAILABLE',
  dueInDays?: number,
): Omit<MockItem, 'id'> => ({
  libraryId,
  location:
    libraryId === 'lb_merkez'
      ? 'Genel Koleksiyon'
      : libraryId === 'lb_muh'
        ? 'Mühendislik Koleksiyonu'
        : 'Tıp Koleksiyonu',
  status,
  ...(dueInDays === undefined ? {} : { dueInDays }),
});

type RecordInput = Omit<MockRecord, 'items'> & { items: Omit<MockItem, 'id'>[] };

const RECORD_INPUT: RecordInput[] = [
  {
    id: 'rc_suc',
    title: 'Suç ve Ceza',
    authors: ['Dostoyevski, Fyodor'],
    year: '2015',
    publisher: 'İş Bankası Kültür Yayınları',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '891.73 DOS 2015',
    isbn: '9786053606113',
    pages: '687',
    edition: '12. baskı',
    language: 'Türkçe',
    subjects: ['Rus edebiyatı', 'Roman'],
    summary:
      "Yoksul bir öğrenci olan Raskolnikov'un işlediği cinayet ve vicdanıyla hesaplaşmasını anlatan klasik roman.",
    acquiredDaysAgo: 400,
    items: [shelf('lb_merkez', 'CHECKED_OUT', 12), shelf('lb_merkez')],
  },
  {
    id: 'rc_tutunamayanlar',
    title: 'Tutunamayanlar',
    authors: ['Atay, Oğuz'],
    year: '2019',
    publisher: 'İletişim Yayınları',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '894.353 ATA 2019',
    isbn: '9789754700114',
    pages: '724',
    language: 'Türkçe',
    subjects: ['Türk edebiyatı', 'Roman'],
    acquiredDaysAgo: 300,
    items: [shelf('lb_merkez', 'CHECKED_OUT', 5)],
  },
  {
    id: 'rc_incememed',
    title: 'İnce Memed',
    subtitle: 'Cilt 1',
    authors: ['Kemal, Yaşar'],
    year: '2018',
    publisher: 'Yapı Kredi Yayınları',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '894.353 KEM 2018',
    isbn: '9789750807152',
    pages: '436',
    language: 'Türkçe',
    subjects: ['Türk edebiyatı', 'Roman'],
    acquiredDaysAgo: 250,
    items: [shelf('lb_merkez'), shelf('lb_merkez')],
  },
  {
    id: 'rc_madonna',
    title: 'Kürk Mantolu Madonna',
    authors: ['Ali, Sabahattin'],
    year: '2017',
    publisher: 'Yapı Kredi Yayınları',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '894.353 ALİ 2017',
    isbn: '9789753638029',
    pages: '160',
    language: 'Türkçe',
    subjects: ['Türk edebiyatı', 'Roman'],
    acquiredDaysAgo: 30,
    items: [shelf('lb_merkez'), shelf('lb_muh', 'CHECKED_OUT', 9)],
  },
  {
    id: 'rc_saatleri',
    title: 'Saatleri Ayarlama Enstitüsü',
    authors: ['Tanpınar, Ahmet Hamdi'],
    year: '2016',
    publisher: 'Dergâh Yayınları',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '894.353 TAN 2016',
    isbn: '9789759953164',
    pages: '382',
    language: 'Türkçe',
    subjects: ['Türk edebiyatı', 'Roman'],
    acquiredDaysAgo: 520,
    items: [shelf('lb_merkez')],
  },
  {
    id: 'rc_clrs',
    title: 'Introduction to Algorithms',
    authors: ['Cormen, Thomas H.', 'Leiserson, Charles E.', 'Rivest, Ronald L.', 'Stein, Clifford'],
    year: '2022',
    publisher: 'MIT Press',
    place: 'Cambridge, MA',
    type: 'BK',
    callNumber: 'QA76.6 .C67 2022',
    isbn: '9780262046305',
    pages: '1312',
    edition: '4th ed.',
    language: 'İngilizce',
    subjects: ['Algoritmalar', 'Bilgisayar programlama'],
    acquiredDaysAgo: 9,
    items: [
      shelf('lb_muh', 'CHECKED_OUT', 15),
      shelf('lb_muh'),
      shelf('lb_merkez', 'NOT_FOR_LOAN'),
    ],
  },
  {
    id: 'rc_veriyapilari',
    title: 'Veri Yapıları ve Algoritmalar',
    authors: ['Çölkesen, Rifat'],
    year: '2020',
    publisher: 'Papatya Bilim',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '005.73 ÇÖL 2020',
    isbn: '9786059594483',
    pages: '328',
    language: 'Türkçe',
    subjects: ['Veri yapıları', 'Algoritmalar'],
    acquiredDaysAgo: 3,
    items: [shelf('lb_muh'), shelf('lb_muh')],
  },
  {
    id: 'rc_temizkod',
    title: 'Temiz Kod',
    subtitle: 'Çevik Yazılım Ustalığı El Kitabı',
    authors: ['Martin, Robert C.'],
    year: '2019',
    publisher: 'Kodlab',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '005.1 MAR 2019',
    isbn: '9786052118358',
    pages: '464',
    language: 'Türkçe',
    subjects: ['Yazılım mühendisliği'],
    acquiredDaysAgo: 120,
    items: [shelf('lb_muh', 'CHECKED_OUT', 2)],
  },
  {
    id: 'rc_yapayzeka',
    title: 'Yapay Zekâ',
    subtitle: 'Modern Bir Yaklaşım',
    authors: ['Russell, Stuart', 'Norvig, Peter'],
    year: '2021',
    publisher: 'Palme Yayınevi',
    place: 'Ankara',
    type: 'BK',
    callNumber: '006.3 RUS 2021',
    isbn: '9786052826543',
    pages: '1100',
    language: 'Türkçe',
    subjects: ['Yapay zekâ'],
    acquiredDaysAgo: 14,
    items: [shelf('lb_muh', 'ON_HOLD_SHELF'), shelf('lb_merkez', 'CHECKED_OUT', 20)],
  },
  {
    id: 'rc_nutuk',
    title: 'Nutuk',
    authors: ['Atatürk, Mustafa Kemal'],
    year: '2019',
    publisher: 'Türk Tarih Kurumu',
    place: 'Ankara',
    type: 'BK',
    callNumber: '956.1024 ATA 2019',
    isbn: '9789751639936',
    pages: '612',
    language: 'Türkçe',
    subjects: ['Türkiye — Tarih — Kurtuluş Savaşı, 1919-1923'],
    acquiredDaysAgo: 700,
    items: [shelf('lb_merkez'), shelf('lb_merkez'), shelf('lb_muh')],
  },
  {
    id: 'rc_turkdili',
    title: 'Türk Dili',
    subtitle: 'Aylık Dil ve Edebiyat Dergisi',
    authors: ['Türk Dil Kurumu'],
    year: '2026',
    publisher: 'Türk Dil Kurumu',
    place: 'Ankara',
    type: 'SER',
    callNumber: 'P 494.35 TÜR',
    issn: '1300-0000',
    language: 'Türkçe',
    subjects: ['Türk dili', 'Süreli yayınlar'],
    acquiredDaysAgo: 6,
    items: [shelf('lb_merkez', 'NOT_FOR_LOAN')],
  },
  {
    id: 'rc_anatomi',
    title: 'Klinik Anatomi',
    authors: ['Snell, Richard S.'],
    year: '2018',
    publisher: 'Nobel Tıp Kitabevleri',
    place: 'İstanbul',
    type: 'BK',
    callNumber: 'QS 4 SNE 2018',
    isbn: '9789754208764',
    pages: '920',
    edition: '9. baskı',
    language: 'Türkçe',
    subjects: ['Anatomi'],
    acquiredDaysAgo: 60,
    items: [shelf('lb_tip'), shelf('lb_tip', 'CHECKED_OUT', 7)],
  },
  {
    id: 'rc_harrison',
    title: 'Harrison İç Hastalıkları Prensipleri',
    authors: ['Jameson, J. Larry'],
    year: '2020',
    publisher: 'Nobel Tıp Kitabevleri',
    place: 'İstanbul',
    type: 'REF',
    callNumber: 'WB 115 HAR 2020',
    isbn: '9789754209990',
    pages: '3600',
    language: 'Türkçe',
    subjects: ['İç hastalıkları'],
    acquiredDaysAgo: 220,
    items: [shelf('lb_tip', 'NOT_FOR_LOAN')],
  },
  {
    id: 'rc_kreyszig',
    title: 'İleri Mühendislik Matematiği',
    authors: ['Kreyszig, Erwin'],
    year: '2019',
    publisher: 'Literatür Yayıncılık',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '510.2462 KRE 2019',
    isbn: '9789750402100',
    pages: '1250',
    language: 'Türkçe',
    subjects: ['Mühendislik matematiği'],
    acquiredDaysAgo: 22,
    items: [shelf('lb_muh', 'IN_TRANSIT')],
  },
  {
    id: 'rc_kuantum',
    title: 'Kuantum Mekaniğine Giriş',
    authors: ['Griffiths, David J.'],
    year: '2018',
    publisher: 'Nobel Akademik',
    place: 'Ankara',
    type: 'BK',
    callNumber: '530.12 GRİ 2018',
    isbn: '9786053205415',
    pages: '480',
    language: 'Türkçe',
    subjects: ['Kuantum mekaniği', 'Fizik'],
    acquiredDaysAgo: 2,
    items: [shelf('lb_muh'), shelf('lb_merkez')],
  },
  {
    id: 'rc_inalcik',
    title: 'Osmanlı İmparatorluğu Klasik Çağ (1300-1600)',
    authors: ['İnalcık, Halil'],
    year: '2016',
    publisher: 'Yapı Kredi Yayınları',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '956.1015 İNA 2016',
    isbn: '9789750818431',
    pages: '336',
    language: 'Türkçe',
    subjects: ['Osmanlı Devleti — Tarih'],
    acquiredDaysAgo: 480,
    items: [shelf('lb_merkez')],
  },
  {
    id: 'rc_sapiens',
    title: 'Sapiens',
    subtitle: 'İnsan Türünün Kısa Bir Tarihi',
    authors: ['Harari, Yuval Noah'],
    year: '2015',
    publisher: 'Kolektif Kitap',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '909 HAR 2015',
    isbn: '9786055025240',
    pages: '412',
    language: 'Türkçe',
    subjects: ['İnsanlık tarihi'],
    acquiredDaysAgo: 160,
    items: [shelf('lb_merkez', 'CHECKED_OUT', -3), shelf('lb_merkez', 'CHECKED_OUT', 10)],
  },
  {
    id: 'rc_bilimadami',
    title: 'Bir Bilim Adamının Romanı',
    subtitle: 'Mustafa İnan',
    authors: ['Atay, Oğuz'],
    year: '2018',
    publisher: 'İletişim Yayınları',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '894.353 ATA 2018',
    isbn: '9789754700305',
    pages: '296',
    language: 'Türkçe',
    subjects: ['Biyografi'],
    acquiredDaysAgo: 18,
    items: [shelf('lb_merkez'), shelf('lb_muh')],
  },
  {
    id: 'rc_tez',
    title: 'Üniversite Kütüphanelerinde Mobil Hizmetler: Bir Kullanıcı Deneyimi Araştırması',
    authors: ['Demir, Ayşe'],
    year: '2023',
    publisher: 'Örnek Üniversitesi Sosyal Bilimler Enstitüsü',
    place: 'Ankara',
    type: 'TEZ',
    callNumber: 'TEZ 2023 DEM',
    pages: '184',
    language: 'Türkçe',
    subjects: ['Kütüphanecilik', 'Mobil uygulamalar', 'Kullanıcı deneyimi'],
    summary: 'Yüksek lisans tezi.',
    acquiredDaysAgo: 40,
    items: [shelf('lb_merkez', 'NOT_FOR_LOAN')],
  },
  {
    id: 'rc_python',
    title: 'Python ile Programlama',
    authors: ['Kaya, Mehmet'],
    year: '2024',
    publisher: 'Örnek Akademi',
    place: 'Ankara',
    type: 'EBK',
    callNumber: 'E-KİTAP',
    isbn: '9786250000000',
    language: 'Türkçe',
    subjects: ['Python (Bilgisayar programlama dili)'],
    summary: 'Kampüs içinden ve proxy ile çevrim içi erişilebilir.',
    acquiredDaysAgo: 4,
    items: [],
  },
  {
    id: 'rc_dune',
    title: 'Dune',
    authors: ['Herbert, Frank'],
    year: '2021',
    publisher: 'İthaki Yayınları',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '813.54 HER 2021',
    isbn: '9786053758473',
    pages: '712',
    language: 'Türkçe',
    subjects: ['Bilimkurgu', 'Amerikan edebiyatı'],
    acquiredDaysAgo: 7,
    items: [shelf('lb_merkez', 'CHECKED_OUT', 4), shelf('lb_merkez', 'CHECKED_OUT', 11)],
  },
  {
    id: 'rc_simyaci',
    title: 'Simyacı',
    authors: ['Coelho, Paulo'],
    year: '2016',
    publisher: 'Can Yayınları',
    place: 'İstanbul',
    type: 'BK',
    callNumber: '869.3 COE 2016',
    isbn: '9789750726439',
    pages: '188',
    language: 'Türkçe',
    subjects: ['Brezilya edebiyatı', 'Roman'],
    acquiredDaysAgo: 350,
    items: [shelf('lb_merkez')],
  },
];

export const RECORDS: MockRecord[] = RECORD_INPUT.map((record) => ({
  ...record,
  items: record.items.map((item, index) => ({
    ...item,
    id: `it_${record.id.slice(3)}_${index + 1}`,
  })),
}));

export const DEMO_USER = {
  identifier: 'demo',
  password: 'demo',
  id: '0192b000-0000-7000-8000-00000000aaaa',
  firstName: 'Ayşe',
  lastName: 'Yılmaz',
  cardNumber: '20231234',
  email: 'ayse.yilmaz@ogr.ornek.edu.tr',
  phone: '+90 5xx xxx xx 12',
};

export interface MockLoanSeed {
  id: string;
  recordId: string;
  itemIndex: number;
  checkedOutDaysAgo: number;
  dueInDays: number;
  renewals: number;
  maxRenewals: number;
  /** Bu ödünç için kurgulanan yenileme engeli */
  block?: 'LOAN_RENEWAL_ON_HOLD' | 'LOAN_RENEWAL_TOO_MANY';
}

export const LOAN_SEEDS: MockLoanSeed[] = [
  {
    id: 'lo_1',
    recordId: 'rc_clrs',
    itemIndex: 0,
    checkedOutDaysAgo: 6,
    dueInDays: 15,
    renewals: 0,
    maxRenewals: 3,
  },
  {
    id: 'lo_2',
    recordId: 'rc_temizkod',
    itemIndex: 0,
    checkedOutDaysAgo: 19,
    dueInDays: 2,
    renewals: 1,
    maxRenewals: 3,
  },
  {
    id: 'lo_3',
    recordId: 'rc_suc',
    itemIndex: 0,
    checkedOutDaysAgo: 30,
    dueInDays: 1,
    renewals: 1,
    maxRenewals: 3,
    block: 'LOAN_RENEWAL_ON_HOLD',
  },
  {
    id: 'lo_4',
    recordId: 'rc_sapiens',
    itemIndex: 0,
    checkedOutDaysAgo: 24,
    dueInDays: -3,
    renewals: 3,
    maxRenewals: 3,
    block: 'LOAN_RENEWAL_TOO_MANY',
  },
];

export const HOLD_SEEDS = [
  {
    id: 'ho_1',
    recordId: 'rc_yapayzeka',
    libraryId: 'lb_muh',
    status: 'READY' as const,
    queuePosition: null,
    placedDaysAgo: 10,
    pickupInDays: 4,
  },
  {
    id: 'ho_2',
    recordId: 'rc_tutunamayanlar',
    libraryId: 'lb_merkez',
    status: 'WAITING' as const,
    queuePosition: 2,
    placedDaysAgo: 3,
    pickupInDays: null,
  },
  {
    id: 'ho_3',
    recordId: 'rc_kreyszig',
    libraryId: 'lb_merkez',
    status: 'IN_TRANSIT' as const,
    queuePosition: null,
    placedDaysAgo: 5,
    pickupInDays: null,
  },
];

const money = (amount: string) => ({ amount, currency: 'TRY' });

export const fineLines = (): { outstanding: FineLine[]; transactions: FineLine[] } => {
  const overdue: FineLine = {
    id: 'fn_1',
    date: toIsoDate(daysFromToday(-40)),
    kind: 'DEBIT',
    type: 'OVERDUE',
    description: 'Gecikme cezası — Kürk Mantolu Madonna',
    amount: money('10.00'),
    remaining: money('5.00'),
  };
  const card: FineLine = {
    id: 'fn_2',
    date: toIsoDate(daysFromToday(-20)),
    kind: 'DEBIT',
    type: 'NEW_CARD',
    description: 'Kayıp kart yenileme ücreti',
    amount: money('2.50'),
    remaining: money('2.50'),
  };
  const payment: FineLine = {
    id: 'fn_3',
    date: toIsoDate(daysFromToday(-35)),
    kind: 'CREDIT',
    type: 'PAYMENT',
    description: 'Ödeme — banko',
    amount: money('5.00'),
    remaining: null,
  };
  return { outstanding: [overdue, card], transactions: [card, payment, overdue] };
};

export const ANNOUNCEMENTS = (): Announcement[] => [
  {
    id: 'an_1',
    title: 'Final haftası uzatılmış çalışma saatleri',
    body: 'Final sınavları süresince Merkez Kütüphane hafta içi 24 saat açık olacaktır. Grup çalışma odaları için rezervasyon bankodan yapılabilir.',
    publishedAt: daysFromToday(-1).toISOString(),
    global: false,
  },
  {
    id: 'an_2',
    title: 'Yeni veri tabanı erişimi',
    body: 'Mühendislik alanında yeni bir elektronik veri tabanı aboneliği başlamıştır. Kampüs dışından erişim için proxy ayarlarınızı yapınız.',
    publishedAt: daysFromToday(-6).toISOString(),
    global: false,
  },
  {
    id: 'an_3',
    title: 'MirAkıl Kütüphane uygulaması yayında',
    body: 'Ödünçlerinizi, rezervasyonlarınızı ve kataloğu artık cebinizden takip edebilirsiniz.',
    publishedAt: daysFromToday(-12).toISOString(),
    global: true,
  },
];

export const NOTIFICATIONS = (): AppNotification[] => [
  {
    id: 'nt_1',
    type: 'HOLD_READY',
    title: 'Rezervasyonunuz hazır',
    body: '"Yapay Zekâ: Modern Bir Yaklaşım" Mühendislik Fakültesi Kütüphanesi\'nde teslim almanızı bekliyor.',
    target: { screen: 'hold', id: 'ho_1' },
    createdAt: daysFromToday(-1).toISOString(),
    readAt: null,
  },
  {
    id: 'nt_2',
    type: 'DUE_SOON',
    title: 'İade tarihi yaklaşıyor',
    body: '"Temiz Kod" adlı materyalin iade tarihine 2 gün kaldı.',
    target: { screen: 'loan', id: 'lo_2' },
    createdAt: daysFromToday(0).toISOString(),
    readAt: null,
  },
  {
    id: 'nt_3',
    type: 'OVERDUE',
    title: 'Gecikmiş materyal',
    body: '"Sapiens" adlı materyalin iade tarihi 3 gün geçti.',
    target: { screen: 'loan', id: 'lo_4' },
    createdAt: daysFromToday(-2).toISOString(),
    readAt: daysFromToday(-2).toISOString(),
  },
  {
    id: 'nt_4',
    type: 'LIBRARY_ANNOUNCEMENT',
    title: 'Yeni duyuru',
    body: 'Final haftası uzatılmış çalışma saatleri',
    target: { screen: 'announcement', id: 'an_1' },
    createdAt: daysFromToday(-1).toISOString(),
    readAt: daysFromToday(-1).toISOString(),
  },
];
