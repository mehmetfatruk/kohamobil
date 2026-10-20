import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Figtree_800ExtraBold } from '@expo-google-fonts/figtree/800ExtraBold';
import { useFonts } from 'expo-font';
import type { TextStyle } from 'react-native';

/**
 * MirAkıl yazı tipleri (web sitesiyle aynı): başlıklar ve rakamlar Archivo, metin Figtree.
 * Yalnızca kullanılan kalınlıklar pakete girer; Türkçe karakterleri (latin-ext) içerir.
 */
const FONTS = {
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
};

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(FONTS);
  // Yazı tipi yüklenemezse sistem yazı tipiyle devam edilir; uygulama bloke olmaz.
  return loaded || Boolean(error);
}

type Weight = NonNullable<TextStyle['fontWeight']>;

/**
 * Kalınlığa göre yazı tipi ailesi. Özel yazı tiplerinde her kalınlık ayrı bir ailedir;
 * `fontWeight` tek başına iOS/Android'de doğru dosyayı seçmez.
 */
export function fontFamily(weight: Weight = '400', display = false): string {
  const w = typeof weight === 'number' ? weight : weight === 'bold' ? 700 : Number(weight) || 400;
  if (display) return w >= 800 ? 'Archivo_800ExtraBold' : 'Archivo_700Bold';
  if (w >= 800) return 'Figtree_800ExtraBold';
  if (w >= 700) return 'Figtree_700Bold';
  if (w >= 600) return 'Figtree_600SemiBold';
  if (w >= 500) return 'Figtree_500Medium';
  return 'Figtree_400Regular';
}

/** Stil nesnesine yazı tipi ailesini ekler (Text bileşenleri ve gezinme başlıkları için). */
export const font = (weight: Weight = '400', display = false): TextStyle => ({
  fontFamily: fontFamily(weight, display),
  fontWeight: weight,
});
