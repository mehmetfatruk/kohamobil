import { Ionicons } from '@expo/vector-icons';
import type { CatalogItem } from '@mirakil/types';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '../../src/components/Cover';
import { Screen } from '../../src/components/Screen';
import { toast } from '../../src/components/feedback';
import {
  AppText,
  Badge,
  Button,
  Card,
  Divider,
  ErrorView,
  InfoRow,
  LoadingView,
} from '../../src/components/ui';
import {
  usePickupLibraries,
  usePlaceHold,
  useRecord,
  useRecordItems,
} from '../../src/hooks/useApi';
import { useOnline } from '../../src/hooks/useOnline';
import { errorText } from '../../src/lib/errors';
import { formatDate } from '../../src/lib/format';
import { useSession } from '../../src/state/session';
import { radius, spacing, useTheme } from '../../src/theme';

function ItemRow({ item }: { item: CatalogItem }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color =
    item.status === 'AVAILABLE'
      ? theme.statusOk
      : item.status === 'CHECKED_OUT' || item.status === 'LOST' || item.status === 'WITHDRAWN'
        ? theme.statusDanger
        : theme.statusWarning;
  return (
    <View style={styles.itemRow}>
      <View style={styles.flex}>
        <AppText variant="subheading">{item.library.name}</AppText>
        {item.location ? (
          <AppText variant="caption" muted>
            {item.location}
          </AppText>
        ) : null}
        {item.callNumber ? (
          <AppText variant="caption" muted>
            {item.callNumber}
          </AppText>
        ) : null}
      </View>
      <View style={styles.itemStatus}>
        <Badge label={t(`record.status${item.status}`)} color={color} />
        {item.dueDate ? (
          <AppText variant="caption" muted>
            {t('record.dueDate', { date: formatDate(item.dueDate) })}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function HoldSheet({
  recordId,
  visible,
  onClose,
}: {
  recordId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const libraries = usePickupLibraries(recordId, visible);
  const placeHold = usePlaceHold();
  const [selected, setSelected] = useState<string | null>(null);

  const submit = () => {
    if (!selected) return;
    placeHold.mutate(
      { recordId, pickupLibraryId: selected },
      {
        onSuccess: () => {
          toast(t('record.holdPlaced'), 'success');
          onClose();
        },
        onError: (error) => toast(errorText(error), 'error'),
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: theme.background, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <AppText variant="heading">{t('record.chooseLibrary')}</AppText>
        {libraries.isPending ? (
          <LoadingView />
        ) : libraries.isError ? (
          <ErrorView
            message={errorText(libraries.error)}
            onRetry={() => void libraries.refetch()}
          />
        ) : (
          libraries.data.map((library) => {
            const active = selected === library.id;
            return (
              <Pressable
                key={library.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setSelected(library.id)}
                style={[
                  styles.option,
                  {
                    borderColor: active ? theme.primary : theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={theme.primary}
                />
                <View style={styles.flex}>
                  <AppText variant="subheading">{library.name}</AppText>
                  {library.address ? (
                    <AppText variant="caption" muted>
                      {library.address}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}
        <Button
          label={t('record.placeHold')}
          icon="bookmark"
          onPress={submit}
          loading={placeHold.isPending}
          disabled={!selected}
        />
        <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}

export default function RecordScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const online = useOnline();
  const holdsEnabled = useSession((s) => s.tenant?.features.holds ?? false);
  const record = useRecord(id);
  const items = useRecordItems(id);
  const [sheet, setSheet] = useState(false);

  if (record.isPending) return <LoadingView />;
  if (record.isError)
    return <ErrorView message={errorText(record.error)} onRetry={() => void record.refetch()} />;
  const r = record.data;

  return (
    <>
      <Screen>
        <View style={styles.hero}>
          <Cover id={r.id} title={r.title} author={r.author} uri={r.coverUrl} width={140} />
          <AppText variant="heading" style={styles.center}>
            {r.title}
          </AppText>
          {r.subtitle ? (
            <AppText muted style={styles.center}>
              {r.subtitle}
            </AppText>
          ) : null}
        </View>

        <Card>
          <InfoRow label={t('record.author')} value={r.authors.join('; ')} />
          <InfoRow label={t('record.materialType')} value={r.materialType?.name} />
          <InfoRow label={t('record.publisher')} value={r.publisher} />
          <InfoRow label={t('record.place')} value={r.publicationPlace} />
          <InfoRow label={t('record.year')} value={r.publicationYear} />
          <InfoRow label={t('record.edition')} value={r.edition} />
          <InfoRow label={t('record.pages')} value={r.pages} />
          <InfoRow label={t('record.isbn')} value={r.isbn.join(', ')} />
          <InfoRow label={t('record.issn')} value={r.issn.join(', ')} />
          <InfoRow label={t('record.language')} value={r.language} />
          <InfoRow label={t('record.callNumber')} value={r.callNumber} />
          <InfoRow label={t('record.subjects')} value={r.subjects.join(' · ')} />
          <InfoRow label={t('record.series')} value={r.series} />
        </Card>

        {r.summary ? (
          <Card>
            <AppText variant="subheading">{t('record.summary')}</AppText>
            <AppText muted>{r.summary}</AppText>
          </Card>
        ) : null}

        {items.data?.length ? (
          <Card>
            <AppText variant="subheading">{`${t('record.items')} (${items.data.length})`}</AppText>
            {items.data.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <Divider /> : null}
                <ItemRow item={item} />
              </View>
            ))}
          </Card>
        ) : items.isPending ? (
          <LoadingView />
        ) : null}

        {holdsEnabled ? (
          r.holdable ? (
            <Button
              label={t('record.placeHold')}
              icon="bookmark-outline"
              disabled={!online}
              onPress={() => setSheet(true)}
            />
          ) : (
            <AppText muted style={styles.center}>
              {t('record.holdNotAvailable')}
            </AppText>
          )
        ) : null}
        {!online && holdsEnabled && r.holdable ? (
          <AppText variant="caption" muted style={styles.center}>
            {t('common.offlineActionDisabled')}
          </AppText>
        ) : null}
      </Screen>
      <HoldSheet recordId={r.id} visible={sheet} onClose={() => setSheet(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
  itemRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 4 },
  itemStatus: { alignItems: 'flex-end', gap: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    padding: spacing.lg,
    gap: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
});
