import { Ionicons } from '@expo/vector-icons';
import { SEARCH_FIELDS, type SearchField } from '@mirakil/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecordCard } from '../../src/components/RecordCard';
import { OfflineBanner } from '../../src/components/feedback';
import { AppText, Button, ErrorView, LoadingView, MessageView } from '../../src/components/ui';
import { useCatalogList, type CatalogQuery } from '../../src/hooks/useApi';
import { errorText } from '../../src/lib/errors';
import { elevation, radius, spacing, useTheme } from '../../src/theme';

const FIELD_KEYS: Record<SearchField, string> = {
  any: 'catalog.fieldAny',
  title: 'catalog.fieldTitle',
  author: 'catalog.fieldAuthor',
  subject: 'catalog.fieldSubject',
  isbn: 'catalog.fieldIsbn',
  issn: 'catalog.fieldIssn',
  callNumber: 'catalog.fieldCallNumber',
};

export default function Catalog() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [text, setText] = useState('');
  const [field, setField] = useState<SearchField>('any');
  const [query, setQuery] = useState<CatalogQuery | null>(null);
  const results = useCatalogList(query);

  const submit = (nextField = field) => {
    const q = text.trim();
    setQuery(q ? { kind: 'search', q, field: nextField } : null);
  };

  const items = results.data?.pages.flatMap((p) => p.items) ?? [];
  const total = results.data?.pages[0]?.total ?? 0;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.flex, { backgroundColor: theme.background }]}
    >
      <OfflineBanner />
      <View style={styles.searchArea}>
        <AppText variant="title">{t('tabs.catalog')}</AppText>
        <View style={[styles.searchBox, { backgroundColor: theme.surface }, elevation(theme)]}>
          <Ionicons name="search" size={20} color={theme.textMuted} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => submit()}
            placeholder={t('catalog.searchPlaceholder')}
            placeholderTextColor={theme.textMuted}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.searchInput, { color: theme.text }]}
            accessibilityLabel={t('catalog.searchPlaceholder')}
          />
          {text ? (
            <Pressable
              accessibilityLabel={t('common.close')}
              onPress={() => {
                setText('');
                setQuery(null);
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={20} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SEARCH_FIELDS}
          keyExtractor={(f) => f}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => {
            const active = item === field;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setField(item);
                  if (text.trim()) submit(item);
                }}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? theme.primary : theme.border,
                    backgroundColor: active ? theme.primarySoft : theme.surface,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={active ? theme.primary : theme.textMuted}
                  style={styles.chipText}
                >
                  {t(FIELD_KEYS[item])}
                </AppText>
              </Pressable>
            );
          }}
        />
      </View>

      {!query ? (
        <MessageView icon="library-outline" message={t('catalog.startSearching')} />
      ) : results.isPending ? (
        <LoadingView />
      ) : results.isError ? (
        <ErrorView message={errorText(results.error)} onRetry={() => void results.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<AppText muted>{t('catalog.results', { count: total })}</AppText>}
          ListEmptyComponent={
            <MessageView icon="search-outline" message={t('catalog.noResults')} />
          }
          renderItem={({ item }) => <RecordCard record={item} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
          }}
          ListFooterComponent={
            results.hasNextPage ? (
              <Button
                label={t('catalog.loadMore')}
                variant="ghost"
                loading={results.isFetchingNextPage}
                onPress={() => void results.fetchNextPage()}
              />
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchArea: { padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  searchInput: { flex: 1, minHeight: 50, fontSize: 16 },
  chips: { gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: { fontWeight: '600' },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
});
