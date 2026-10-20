import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { api } from '../../src/api';
import { TenantLogo } from '../../src/components/TenantLogo';
import {
  AppText,
  Button,
  Card,
  ErrorView,
  IconBubble,
  LoadingView,
  MessageView,
} from '../../src/components/ui';
import { useTenantSelection } from '../../src/hooks/useTenantSelection';
import { errorText } from '../../src/lib/errors';
import { elevation, radius, spacing, useTheme } from '../../src/theme';

export default function SelectTenant() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const term = useDeferredValue(search.trim());
  const { busy, choose, resolve } = useTenantSelection();
  const tenants = useQuery({
    queryKey: ['directory', term],
    queryFn: () => api.listTenants(term || undefined),
  });

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt }];

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <FlatList
        data={tenants.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Card style={styles.codeCard}>
              <View style={styles.codeTitle}>
                <IconBubble icon="key" size={36} />
                <AppText variant="subheading" style={styles.flex}>
                  {t('onboarding.enterCode')}
                </AppText>
              </View>
              <View style={styles.codeRow}>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder={t('onboarding.codePlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={() => void resolve(code)}
                  style={[...inputStyle, styles.flex]}
                  accessibilityLabel={t('onboarding.enterCode')}
                />
                <Button
                  label={t('onboarding.find')}
                  compact
                  onPress={() => void resolve(code)}
                  loading={busy}
                  disabled={!code.trim()}
                />
              </View>
              <Button
                label={t('onboarding.scanQr')}
                icon="qr-code-outline"
                variant="secondary"
                onPress={() => router.push('/scan')}
              />
            </Card>
            <View style={styles.orRow}>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
              <AppText variant="caption" muted>
                {t('onboarding.or')}
              </AppText>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
            </View>
            <View style={[styles.searchBox, { backgroundColor: theme.surface }, elevation(theme)]}>
              <Ionicons name="search" size={18} color={theme.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('onboarding.searchTenant')}
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
                accessibilityLabel={t('onboarding.searchTenant')}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          tenants.isPending ? (
            <LoadingView />
          ) : tenants.isError ? (
            <ErrorView message={errorText(tenants.error)} onRetry={() => void tenants.refetch()} />
          ) : (
            <MessageView icon="business-outline" message={t('onboarding.noResults')} />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void choose(item)}
            style={({ pressed }) => [
              styles.tenant,
              { backgroundColor: theme.surface, opacity: pressed ? 0.85 : 1 },
              elevation(theme),
            ]}
          >
            <TenantLogo tenant={item} />
            <View style={styles.flex}>
              <AppText variant="subheading">{item.name}</AppText>
              {item.city ? (
                <AppText variant="caption" muted>
                  {item.city}
                </AppText>
              ) : null}
            </View>
            <View style={[styles.chevron, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  codeCard: { gap: spacing.md },
  codeRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  codeTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    fontSize: 15,
  },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  searchInput: { flex: 1, minHeight: 50, fontSize: 15 },
  tenant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: 2,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
