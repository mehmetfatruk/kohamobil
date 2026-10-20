import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, useTheme } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const content = (
    <View
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]}
    >
      {children}
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function AppText({
  children,
  variant = 'body',
  muted,
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  variant?: 'title' | 'heading' | 'subheading' | 'body' | 'caption';
  muted?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const theme = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        textStyles[variant],
        { color: color ?? (muted ? theme.textMuted : theme.text) },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  compact,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const palette = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: theme.primary },
    secondary: { bg: 'transparent', fg: theme.primary, border: theme.primary },
    danger: { bg: 'transparent', fg: theme.statusDanger, border: theme.statusDanger },
    ghost: { bg: 'transparent', fg: theme.primary, border: 'transparent' },
  }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: inactive ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={palette.fg} /> : null}
          <Text
            style={[styles.buttonText, compact && styles.buttonTextCompact, { color: palette.fg }]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="heading">{title}</AppText>
      {action && onAction ? (
        <Pressable accessibilityRole="link" onPress={onAction} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: theme.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <AppText variant="caption" muted style={styles.infoLabel}>
        {label}
      </AppText>
      <AppText style={styles.infoValue}>{value}</AppText>
    </View>
  );
}

export function ListItem({
  icon,
  label,
  onPress,
  destructive,
  trailing,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  trailing?: string;
}) {
  const theme = useTheme();
  const color = destructive ? theme.statusDanger : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.listItem,
        { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={22} color={destructive ? theme.statusDanger : theme.primary} />
      <Text style={[styles.listLabel, { color }]}>{label}</Text>
      {trailing ? <AppText muted>{trailing}</AppText> : null}
      {!destructive ? <Ionicons name="chevron-forward" size={18} color={theme.textMuted} /> : null}
    </Pressable>
  );
}

export function LoadingView() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.centered} accessibilityLabel={t('common.loading')}>
      <ActivityIndicator color={theme.primary} size="large" />
    </View>
  );
}

export function MessageView({
  icon,
  message,
  action,
  onAction,
}: {
  icon: IconName;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.centered}>
      <Ionicons name={icon} size={44} color={theme.textMuted} />
      <AppText muted style={styles.centerText}>
        {message}
      </AppText>
      {action && onAction ? (
        <Button label={action} onPress={onAction} variant="secondary" compact />
      ) : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <MessageView
      icon="cloud-offline-outline"
      message={message}
      action={onRetry ? t('common.retry') : undefined}
      onAction={onRetry}
    />
  );
}

export function Divider() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.border,
        marginVertical: spacing.sm,
      }}
    />
  );
}

const textStyles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700' },
  heading: { fontSize: 19, fontWeight: '700' },
  subheading: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21 },
  caption: { fontSize: 13, lineHeight: 18 },
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonCompact: { minHeight: 36, paddingHorizontal: spacing.md },
  buttonText: { fontSize: 16, fontWeight: '600' },
  buttonTextCompact: { fontSize: 14 },
  badge: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionAction: { fontSize: 15, fontWeight: '600' },
  infoRow: { flexDirection: 'row', paddingVertical: 6, gap: spacing.md },
  infoLabel: { width: 120, textTransform: 'uppercase', letterSpacing: 0.4, paddingTop: 2 },
  infoValue: { flex: 1 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listLabel: { flex: 1, fontSize: 16 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    minHeight: 240,
  },
  centerText: { textAlign: 'center' },
});
