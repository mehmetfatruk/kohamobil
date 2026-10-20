import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { RecordCard } from '../src/components/RecordCard';
import { AppText, Button, ErrorView, LoadingView, MessageView } from '../src/components/ui';
import { useCatalogList } from '../src/hooks/useApi';
import { errorText } from '../src/lib/errors';
import { spacing, useTheme } from '../src/theme';

/** Yeni Gelenler (`?mode=new`) veya materyal türüne göre liste (`?type=BK&title=Kitap`). */
export default function Browse() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ mode?: string; type?: string; title?: string }>();
  const isNew = params.mode === 'new' || !params.type;
  const list = useCatalogList(
    isNew
      ? { kind: 'newArrivals' }
      : { kind: 'search', q: '', field: 'any', itemType: params.type },
  );
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;
  const title = isNew ? t('catalog.newArrivalsTitle') : (params.title ?? params.type ?? '');

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title }} />
      {list.isPending ? (
        <LoadingView />
      ) : list.isError ? (
        <ErrorView message={errorText(list.error)} onRetry={() => void list.refetch()} />
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
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          ListFooterComponent={
            list.hasNextPage ? (
              <Button
                label={t('catalog.loadMore')}
                variant="ghost"
                loading={list.isFetchingNextPage}
                onPress={() => void list.fetchNextPage()}
              />
            ) : undefined
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
});
