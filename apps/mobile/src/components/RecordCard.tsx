import type { RecordSummary } from '@mirakil/types';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '../theme';
import { Cover } from './Cover';
import { AppText, Card } from './ui';

const openRecord = (id: string) => router.push({ pathname: '/record/[id]', params: { id } });

function AvailabilityText({ record }: { record: RecordSummary }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { available, total } = record.availability;
  if (total === 0) return null;
  return (
    <AppText
      variant="caption"
      color={available > 0 ? theme.statusOk : theme.statusDanger}
      style={styles.bold}
    >
      {available > 0 ? t('catalog.available', { available, total }) : t('catalog.noneAvailable')}
    </AppText>
  );
}

/** Arama sonucu satırı: kapak, başlık, yazar, yıl, materyal türü, yer no, uygun nüsha. */
export function RecordCard({ record }: { record: RecordSummary }) {
  const meta = [record.publicationYear, record.materialType?.name].filter(Boolean).join(' · ');
  return (
    <Card onPress={() => openRecord(record.id)} style={styles.row}>
      <Cover
        id={record.id}
        title={record.title}
        author={record.author}
        uri={record.coverUrl}
        width={64}
      />
      <View style={styles.body}>
        <AppText variant="subheading" numberOfLines={2}>
          {record.title}
        </AppText>
        {record.author ? (
          <AppText muted numberOfLines={1}>
            {record.author}
          </AppText>
        ) : null}
        {meta ? (
          <AppText variant="caption" muted>
            {meta}
          </AppText>
        ) : null}
        {record.callNumber ? (
          <AppText variant="caption" muted>
            {record.callNumber}
          </AppText>
        ) : null}
        <AvailabilityText record={record} />
      </View>
    </Card>
  );
}

/** Yatay vitrin kutusu (Yeni Gelenler). */
export function RecordTile({ record }: { record: RecordSummary }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => openRecord(record.id)} style={styles.tile}>
      <Cover
        id={record.id}
        title={record.title}
        author={record.author}
        uri={record.coverUrl}
        width={120}
      />
      <AppText variant="caption" numberOfLines={2} style={styles.bold}>
        {record.title}
      </AppText>
      {record.author ? (
        <AppText variant="caption" muted numberOfLines={1}>
          {record.author}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  body: { flex: 1, gap: 2 },
  bold: { fontWeight: '600' },
  tile: { width: 120, gap: 6 },
});
