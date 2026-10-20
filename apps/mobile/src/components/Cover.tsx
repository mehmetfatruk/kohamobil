import { Image, StyleSheet, Text, View } from 'react-native';

const PALETTES = [
  ['#1E3A5F', '#F4D35E'],
  ['#7A1E48', '#F7E1D7'],
  ['#2D6A4F', '#D8F3DC'],
  ['#5A189A', '#E0AAFF'],
  ['#9C4221', '#FEEBC8'],
  ['#264653', '#E9C46A'],
  ['#3D405B', '#F2CC8F'],
  ['#0B525B', '#99E2B4'],
] as const;

const hash = (value: string) => [...value].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * Kapak görseli; görsel yoksa başlıktan üretilen, her kayıt için sabit renkli bir kapak çizilir.
 * Gerçek kapaklar Gateway kapak proxy'sinden gelir (`/covers/{recordId}`), 3. parti servislere
 * mobilden doğrudan istek atılmaz.
 */
export function Cover({
  id,
  title,
  author,
  uri,
  width,
}: {
  id: string;
  title: string;
  author?: string | null;
  uri?: string | null;
  width: number;
}) {
  const height = Math.round(width * 1.5);
  if (uri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri }}
        style={[styles.base, { width, height }]}
      />
    );
  }
  const [bg, fg] = PALETTES[hash(id) % PALETTES.length]!;
  const small = width < 80;
  return (
    <View
      accessible
      accessibilityLabel={title}
      style={[
        styles.base,
        styles.placeholder,
        { width, height, backgroundColor: bg, padding: small ? 6 : 10 },
      ]}
    >
      <View style={[styles.rule, { backgroundColor: fg }]} />
      <Text
        numberOfLines={small ? 4 : 5}
        style={[styles.title, { color: fg, fontSize: small ? 10 : 14 }]}
      >
        {title}
      </Text>
      {author && !small ? (
        <Text numberOfLines={2} style={[styles.author, { color: fg }]}>
          {author}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 6, overflow: 'hidden' },
  placeholder: { justifyContent: 'space-between' },
  rule: { height: 3, width: '40%', borderRadius: 2, opacity: 0.8 },
  title: { fontWeight: '800', lineHeight: undefined },
  author: { fontSize: 11, opacity: 0.85 },
});
