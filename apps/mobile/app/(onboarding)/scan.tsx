import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, LoadingView } from '../../src/components/ui';
import { useTenantSelection } from '../../src/hooks/useTenantSelection';
import { spacing, useTheme } from '../../src/theme';

/**
 * Kütüphanede asılı QR kod (ör. https://app.koha-tr.com/k/ornek-uni) okutularak kurum seçilir.
 * QR yalnızca kurum kodunu taşır; Koha adresi veya kimlik bilgisi içermez.
 */
export default function Scan() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const { busy, resolve } = useTenantSelection();
  const handled = useRef(false);

  if (!permission) return <LoadingView />;

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <AppText style={styles.text}>{t('onboarding.cameraPermission')}</AppText>
        <Button label={t('onboarding.grantPermission')} onPress={() => void requestPermission()} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={styles.flex}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          busy
            ? undefined
            : ({ data }) => {
                if (handled.current) return;
                handled.current = true;
                void resolve(data).then((ok) => {
                  if (!ok) handled.current = false;
                });
              }
        }
      />
      <View style={[styles.overlay, { backgroundColor: theme.background }]}>
        <AppText variant="subheading">{t('onboarding.scanTitle')}</AppText>
        <AppText muted>{t('onboarding.scanHint')}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  text: { textAlign: 'center' },
  overlay: { padding: spacing.lg, gap: spacing.xs },
});
