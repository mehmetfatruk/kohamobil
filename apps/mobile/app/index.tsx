import { Redirect } from 'expo-router';

/**
 * Faz 2: SecureStore'da seçili kurum + geçerli oturum varsa Ana Sayfa'ya, kurum varsa giriş
 * ekranına, hiçbiri yoksa karşılama ekranına yönlendirilecek (docs/AUTHENTICATION.md §5).
 */
export default function Index() {
  return <Redirect href="/welcome" />;
}
