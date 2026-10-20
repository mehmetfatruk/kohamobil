import { shade } from '@mirakil/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import { font } from '../fonts';

const PALETTES = [
  ['#24476F', '#F4D35E'],
  ['#7A1E48', '#FBE3D6'],
  ['#2D6A4F', '#D8F3DC'],
  ['#5A189A', '#E9C6FF'],
  ['#9C4221', '#FEEBC8'],
  ['#264653', '#E9C46A'],
  ['#3D405B', '#F2CC8F'],
  ['#0B525B', '#99E2B4'],
  ['#8D2B2B', '#FFD6A5'],
  ['#1F2A44', '#A9DEF9'],
] as const;

const hash = (value: string) => [...value].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const SHADOW = { boxShadow: '0 4px 10px rgba(15, 23, 42, 0.18)' } as const;

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
  const corner = width < 80 ? 6 : 8;
  if (uri) {
    return (
      <View style={[{ width, height, borderRadius: corner }, SHADOW]}>
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri }}
          style={{ width, height, borderRadius: corner }}
        />
      </View>
    );
  }
  const [bg, fg] = PALETTES[hash(id) % PALETTES.length]!;
  const small = width < 80;
  const pad = small ? 6 : 12;
  return (
    <View
      accessible
      accessibilityLabel={title}
      style={[{ width, height, borderRadius: corner }, SHADOW]}
    >
      <LinearGradient
        colors={[bg, shade(bg, 0.35)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.face, { borderRadius: corner, padding: pad, paddingLeft: pad + 4 }]}
      >
        {/* Kitap sırtı: koyu şerit + ince parlama */}
        <View style={[styles.spine, { width: small ? 4 : 7 }]} />
        <View style={[styles.spineLight, { left: small ? 4 : 7 }]} />
        <View style={[styles.rule, { backgroundColor: fg }]} />
        <Text
          numberOfLines={small ? 4 : 5}
          style={[styles.title, { color: fg, fontSize: small ? 10 : width > 120 ? 17 : 14 }]}
        >
          {title}
        </Text>
        {author && !small ? (
          <Text numberOfLines={2} style={[styles.author, { color: fg }]}>
            {author}
          </Text>
        ) : (
          <View />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { flex: 1, overflow: 'hidden', justifyContent: 'space-between' },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  spineLight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  rule: { height: 3, width: '36%', borderRadius: 2, opacity: 0.85 },
  title: { letterSpacing: -0.2, ...font('800', true) },
  author: { fontSize: 11, opacity: 0.85, ...font('600') },
});
