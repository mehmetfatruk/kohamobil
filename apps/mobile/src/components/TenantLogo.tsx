import type { TenantDirectoryEntry } from '@mirakil/types';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase('tr'))
    .join('');

/** Kurum logosu; logo yüklenmemişse kurum adının baş harfleri kurum rengiyle gösterilir. */
export function TenantLogo({
  tenant,
  size = 44,
  color,
  textColor = '#FFFFFF',
}: {
  tenant: Pick<TenantDirectoryEntry, 'name' | 'logoUrl'>;
  size?: number;
  color?: string;
  textColor?: string;
}) {
  const theme = useTheme();
  if (tenant.logoUrl) {
    return (
      <Image
        source={{ uri: tenant.logoUrl }}
        style={{ width: size, height: size, borderRadius: size / 4 }}
      />
    );
  }
  const bg = color ?? theme.primary;
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size / 4, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38, color: textColor }]}>
        {initials(tenant.name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800', letterSpacing: -0.5 },
});
