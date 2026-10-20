import { Ionicons } from '@expo/vector-icons';
import { mix } from '@mirakil/ui';
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

import { font, fontFamily } from '../fonts';
import { elevation, radius, spacing, useTheme } from '../theme';

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
    <View style={[styles.card, { backgroundColor: theme.surface }, elevation(theme), style]}>
      {children}
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
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
  variant?: 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'overline';
  muted?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const theme = useTheme();
  // Kalınlık stilden (geçersiz kılınmış olabilir) okunur, aile ona göre seçilir.
  const flat: TextStyle = StyleSheet.flatten([textStyles[variant], style]);
  const weight = flat.fontWeight ?? '400';
  const display = variant === 'display' || variant === 'title' || variant === 'heading';
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        textStyles[variant],
        { color: color ?? (muted ? theme.textMuted : theme.text) },
        style,
        { fontFamily: fontFamily(weight, display) },
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
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'light';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const palette = {
    primary: { bg: theme.primary, fg: theme.onPrimary },
    secondary: { bg: theme.primarySoft, fg: theme.primary },
    danger: { bg: theme.statusDangerSoft, fg: theme.statusDanger },
    ghost: { bg: 'transparent', fg: theme.primary },
    // Renkli başlık zemini üzerinde kullanılan beyaz düğme
    light: { bg: '#FFFFFF', fg: mix(theme.heroEnd, '#000000', 0.1) },
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
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
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

/** Yumuşak zeminli durum rozeti; zemin, yazı renginin karta karışmış tonudur. */
export function Badge({ label, color, icon }: { label: string; color: string; icon?: IconName }) {
  const theme = useTheme();
  const background = mix(theme.surface, color, theme.scheme === 'light' ? 0.12 : 0.2);
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      {icon ? <Ionicons name={icon} size={12} color={color} /> : null}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/** Yumuşak zeminli ikon kutusu. */
export function IconBubble({
  icon,
  color,
  size = 40,
  background,
}: {
  icon: IconName;
  color?: string;
  size?: number;
  background?: string;
}) {
  const theme = useTheme();
  const fg = color ?? theme.primary;
  const bg = background ?? mix(theme.surface, fg, theme.scheme === 'light' ? 0.12 : 0.22);
  return (
    <View
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg },
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={fg} />
    </View>
  );
}

/** İnce ilerleme çubuğu (0–1). */
export function ProgressBar({ value, color }: { value: number; color: string }) {
  const theme = useTheme();
  const pct = `${Math.round(Math.min(Math.max(value, 0), 1) * 100)}%` as const;
  return (
    <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
      <View style={[styles.fill, { width: pct, backgroundColor: color }]} />
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
        { backgroundColor: pressed ? theme.surfaceAlt : 'transparent' },
      ]}
    >
      <IconBubble icon={icon} size={36} color={destructive ? theme.statusDanger : undefined} />
      <Text style={[styles.listLabel, { color }]}>{label}</Text>
      {trailing ? <AppText muted>{trailing}</AppText> : null}
      {!destructive ? <Ionicons name="chevron-forward" size={18} color={theme.textMuted} /> : null}
    </Pressable>
  );
}

/** Ayarlar listesi gibi satırları tek kartta toplar. */
export function ListGroup({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.group, { backgroundColor: theme.surface }, elevation(theme)]}>
      {children}
    </View>
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
      <IconBubble icon={icon} size={72} color={theme.textMuted} />
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
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '700', letterSpacing: -0.2 },
  subheading: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 18 },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg },
  button: {
    minHeight: 50,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonCompact: { minHeight: 38, paddingHorizontal: 14, borderRadius: radius.sm },
  buttonText: { fontSize: 16, ...font('700') },
  buttonTextCompact: { fontSize: 14 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, ...font('700') },
  bubble: { alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionAction: { fontSize: 15, ...font('700') },
  infoRow: { flexDirection: 'row', paddingVertical: 6, gap: spacing.md },
  infoLabel: { width: 112, paddingTop: 1 },
  infoValue: { flex: 1 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  listLabel: { flex: 1, fontSize: 16, ...font('500') },
  group: { borderRadius: radius.lg, paddingVertical: 6, overflow: 'hidden' },
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
