import { Ionicons } from '@expo/vector-icons';
import type { CatalogItem } from '@mirakil/types';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cover } from '../../src/components/Cover';
import { Hero } from '../../src/components/Hero';
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
import { elevation, radius, spacing, useTheme } from '../../src/theme';

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
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />
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
                    backgroundColor: active ? theme.primarySoft : theme.surface,
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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
  const total = items.data?.length ?? 0;
  const available = items.data?.filter((item) => item.status === 'AVAILABLE').length ?? 0;
  const glass = theme.onHero === '#FFFFFF' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';

  const hero = (
    <Hero style={[styles.hero, { paddingTop: insets.top + 56 }]}>
      <View style={styles.heroBody}>
        <View style={styles.coverFrame}>
          <Cover id={r.id} title={r.title} author={r.author} uri={r.coverUrl} width={150} />
        </View>
        <AppText variant="title" color={theme.onHero} style={styles.center}>
          {r.title}
        </AppText>
        {r.subtitle ? (
          <AppText color={theme.onHero} style={[styles.center, styles.dim]}>
            {r.subtitle}
          </AppText>
        ) : null}
        {r.author ? (
          <AppText variant="subheading" color={theme.onHero} style={[styles.center, styles.dim]}>
            {r.author}
          </AppText>
        ) : null}
        <View style={styles.chips}>
          {r.materialType ? (
            <View style={[styles.chip, { backgroundColor: glass }]}>
              <Ionicons name="pricetag" size={13} color={theme.onHero} />
              <AppText variant="caption" color={theme.onHero} style={styles.bold}>
                {r.materialType.name}
              </AppText>
            </View>
          ) : null}
          {r.publicationYear ? (
            <View style={[styles.chip, { backgroundColor: glass }]}>
              <Ionicons name="calendar" size={13} color={theme.onHero} />
              <AppText variant="caption" color={theme.onHero} style={styles.bold}>
                {r.publicationYear}
              </AppText>
            </View>
          ) : null}
          {total > 0 ? (
            <View style={[styles.chip, { backgroundColor: '#FFFFFF' }]}>
              <Ionicons
                name={available > 0 ? 'checkmark-circle' : 'close-circle'}
                size={13}
                color={available > 0 ? '#15803D' : '#B91C1C'}
              />
              <AppText
                variant="caption"
                color={available > 0 ? '#15803D' : '#B91C1C'}
                style={styles.bold}
              >
                {available > 0
                  ? t('catalog.available', { available, total })
                  : t('catalog.noneAvailable')}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Hero>
  );

  return (
    <>
      <Screen hero={hero}>
        {holdsEnabled ? (
          <Card style={[styles.action, elevation(theme, 2)]}>
            {r.holdable ? (
              <>
                <Button
                  label={t('record.placeHold')}
                  icon="bookmark"
                  disabled={!online}
                  onPress={() => setSheet(true)}
                />
                {!online ? (
                  <AppText variant="caption" muted style={styles.center}>
                    {t('common.offlineActionDisabled')}
                  </AppText>
                ) : null}
              </>
            ) : (
              <View style={styles.notHoldable}>
                <Ionicons name="information-circle" size={20} color={theme.textMuted} />
                <AppText muted style={styles.flex}>
                  {t('record.holdNotAvailable')}
                </AppText>
              </View>
            )}
          </Card>
        ) : null}

        {r.summary ? (
          <Card style={styles.section}>
            <AppText variant="heading">{t('record.summary')}</AppText>
            <AppText muted>{r.summary}</AppText>
          </Card>
        ) : null}

        <Card style={styles.section}>
          <AppText variant="heading">{t('record.details')}</AppText>
          <View>
            <InfoRow label={t('record.author')} value={r.authors.join('; ')} />
            <InfoRow label={t('record.publisher')} value={r.publisher} />
            <InfoRow label={t('record.place')} value={r.publicationPlace} />
            <InfoRow label={t('record.edition')} value={r.edition} />
            <InfoRow label={t('record.pages')} value={r.pages} />
            <InfoRow label={t('record.isbn')} value={r.isbn.join(', ')} />
            <InfoRow label={t('record.issn')} value={r.issn.join(', ')} />
            <InfoRow label={t('record.language')} value={r.language} />
            <InfoRow label={t('record.callNumber')} value={r.callNumber} />
            <InfoRow label={t('record.series')} value={r.series} />
          </View>
          {r.subjects.length ? (
            <View style={styles.subjects}>
              {r.subjects.map((subject) => (
                <View
                  key={subject}
                  style={[styles.subject, { backgroundColor: theme.primarySoft }]}
                >
                  <AppText variant="caption" color={theme.primary} style={styles.bold}>
                    {subject}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {items.data?.length ? (
          <Card style={styles.section}>
            <AppText variant="heading">{`${t('record.items')} (${items.data.length})`}</AppText>
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
      </Screen>
      <HoldSheet recordId={r.id} visible={sheet} onClose={() => setSheet(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  dim: { opacity: 0.88 },
  hero: { paddingBottom: spacing.xxl + spacing.xl },
  heroBody: { alignItems: 'center', gap: spacing.sm },
  // Kapak, aynı tonda olabilen başlık zemininden ayrışsın diye ince çerçeve ve derin gölge
  coverFrame: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    boxShadow: '0 18px 36px rgba(0, 0, 0, 0.35)',
    marginBottom: spacing.sm,
  },
  center: { textAlign: 'center' },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  action: { gap: spacing.sm },
  notHoldable: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { gap: spacing.md },
  subjects: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  subject: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  itemRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 4 },
  itemStatus: { alignItems: 'flex-end', gap: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    padding: spacing.lg,
    gap: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
});
