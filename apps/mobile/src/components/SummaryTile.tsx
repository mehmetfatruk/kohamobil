import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font } from '../fonts';
import { useTheme } from '../theme';
import { IconBubble, type IconName } from './ui';

/** Özet kartındaki tek sayaç: ikon, büyük değer, etiket. */
export function SummaryTile({
  label,
  value,
  icon,
  tone = 'neutral',
  onPress,
}: {
  label: string;
  value: string;
  icon: IconName;
  tone?: 'neutral' | 'ok' | 'warning' | 'danger';
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = {
    neutral: theme.primary,
    ok: theme.statusOk,
    warning: theme.statusWarning,
    danger: theme.statusDanger,
  }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: pressed ? theme.surfaceAlt : 'transparent' },
      ]}
    >
      <IconBubble icon={icon} color={color} size={34} />
      <View>
        <Text style={[styles.value, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text numberOfLines={1} style={[styles.label, { color: theme.textMuted }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, gap: 8, padding: 10, borderRadius: 14 },
  value: { fontSize: 22, letterSpacing: -0.4, ...font('800', true) },
  label: { fontSize: 12, ...font('500') },
});
