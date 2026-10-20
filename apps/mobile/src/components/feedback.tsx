import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useOnline } from '../hooks/useOnline';
import { font } from '../fonts';
import { spacing, useTheme } from '../theme';

type ToastKind = 'success' | 'error' | 'info';

const useToastStore = create<{
  message: string | null;
  kind: ToastKind;
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
}>((set) => ({
  message: null,
  kind: 'info',
  show: (message, kind = 'info') => set({ message, kind }),
  hide: () => set({ message: null }),
}));

export const toast = (message: string, kind: ToastKind = 'info') =>
  useToastStore.getState().show(message, kind);

export function ToastHost() {
  const { message, kind, hide } = useToastStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(hide, 3500);
    return () => clearTimeout(timer);
  }, [message, hide]);
  if (!message) return null;
  const color =
    kind === 'success' ? theme.statusOk : kind === 'error' ? theme.statusDanger : theme.primary;
  const icon =
    kind === 'success'
      ? 'checkmark-circle'
      : kind === 'error'
        ? 'alert-circle'
        : 'information-circle';
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { bottom: insets.bottom + 72, backgroundColor: theme.text }]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.toastText, { color: theme.background }]}>{message}</Text>
    </View>
  );
}

/** Platformdan bağımsız onay penceresi. */
export function confirm(
  title: string,
  message: string,
  confirmLabel: string,
  cancelLabel: string,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function OfflineBanner() {
  const online = useOnline();
  const theme = useTheme();
  const { t } = useTranslation();
  if (online) return null;
  return (
    <View
      style={[styles.banner, { backgroundColor: theme.statusWarning }]}
      accessibilityRole="alert"
    >
      <Ionicons name="cloud-offline" size={16} color="#000" />
      <Text style={styles.bannerText}>{t('common.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  toastText: { flex: 1, fontSize: 14, ...font('500') },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  bannerText: { flex: 1, color: '#000', fontSize: 13, ...font('600') },
});
