import type { Library } from '@mirakil/types';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { Screen } from '../src/components/Screen';
import { AppText, Button, Card, Divider, ErrorView, LoadingView } from '../src/components/ui';
import { useLibraries } from '../src/hooks/useApi';
import { errorText } from '../src/lib/errors';
import { spacing, useTheme } from '../src/theme';

const mapUrl = (library: Library) => {
  const { lat, lng } = library.location ?? { lat: 0, lng: 0 };
  const label = encodeURIComponent(library.name);
  return Platform.OS === 'ios'
    ? `maps:0,0?q=${label}@${lat},${lng}`
    : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
};

export default function Libraries() {
  const { t } = useTranslation();
  const theme = useTheme();
  const libraries = useLibraries();
  const today = new Date().getDay();

  if (libraries.isPending) return <LoadingView />;
  if (libraries.isError)
    return (
      <ErrorView message={errorText(libraries.error)} onRetry={() => void libraries.refetch()} />
    );

  return (
    <Screen onRefresh={() => void libraries.refetch()} refreshing={libraries.isRefetching}>
      {libraries.data.map((library) => (
        <Card key={library.id} style={styles.card}>
          <AppText variant="heading">{library.name}</AppText>
          {library.address ? <AppText muted>{library.address}</AppText> : null}
          {library.hours.length ? <Divider /> : null}
          {library.hours.length ? (
            <AppText variant="subheading">{t('libraries.hours')}</AppText>
          ) : null}
          {(library.hours.length ? [1, 2, 3, 4, 5, 6, 0] : []).map((weekday) => {
            const h = library.hours.find((x) => x.weekday === weekday);
            const isToday = weekday === today;
            return (
              <View key={weekday} style={styles.hourRow}>
                <AppText
                  style={isToday ? styles.bold : undefined}
                  color={isToday ? theme.primary : undefined}
                >
                  {t(`libraries.d${weekday}`)}
                </AppText>
                <AppText style={isToday ? styles.bold : undefined} muted={!isToday}>
                  {!h || h.closed ? t('libraries.closed') : `${h.opensAt} – ${h.closesAt}`}
                </AppText>
              </View>
            );
          })}
          <View style={styles.actions}>
            {library.phone ? (
              <Button
                label={t('libraries.call')}
                icon="call-outline"
                variant="secondary"
                compact
                onPress={() => void Linking.openURL(`tel:${library.phone?.replace(/\s/g, '')}`)}
              />
            ) : null}
            {library.email ? (
              <Button
                label={t('libraries.email')}
                icon="mail-outline"
                variant="secondary"
                compact
                onPress={() => void Linking.openURL(`mailto:${library.email}`)}
              />
            ) : null}
            {library.location ? (
              <Button
                label={t('libraries.map')}
                icon="map-outline"
                variant="secondary"
                compact
                onPress={() => void Linking.openURL(mapUrl(library))}
              />
            ) : null}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  hourRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bold: { fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
});
