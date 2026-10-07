import { FEATURE_KEYS } from '@mirakil/types';

/** Faz 0 iskeleti. Kurum yönetimi, Koha bağlantı testi ve diğer ekranlar Faz 5'te. */
const PLANNED_SCREENS = [
  'Kurumlar (ekle, düzenle, pasifleştir)',
  'Tema ve logo',
  'Koha bağlantısı ve uyumluluk raporu',
  'Özellik bayrakları',
  'Çalışma saatleri ve duyurular',
  'İstatistikler, push durumu, Koha hataları',
  'Audit log',
];

export function App() {
  return (
    <main className="shell">
      <header>
        <h1>MirAkıl Kütüphane</h1>
        <p className="muted">Yönetim Paneli · geliştirme önizlemesi</p>
      </header>
      <section>
        <h2>Planlanan ekranlar</h2>
        <ul>
          {PLANNED_SCREENS.map((screen) => (
            <li key={screen}>{screen}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Kurum bazlı özellik bayrakları</h2>
        <p className="muted">{FEATURE_KEYS.join(' · ')}</p>
      </section>
    </main>
  );
}
