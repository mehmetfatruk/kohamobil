import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import type { IconName } from './ui';

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
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text numberOfLines={2} style={[styles.label, { color: theme.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '30%',
    flexGrow: 1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: 2,
  },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 13 },
});
