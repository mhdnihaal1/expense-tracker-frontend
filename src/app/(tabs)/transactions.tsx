import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { api } from '@/api/client';
import type { Account, Category, Paged, Transaction, TxType } from '@/api/types';
import { BottomSheet } from '@/components/bottom-sheet';
import { TransactionRow } from '@/components/transaction-row';
import { AppText, Button, Chip, EmptyState, ErrorView, Icon, IconButton, Screen, TextField } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { radius, spacing } from '@/theme/tokens';
import { onDataChanged } from '@/utils/events';
import { dayLabel, formatMoney, monthBounds, monthLabel, shiftMonthKey, toMonthKey } from '@/utils/format';

interface Filters {
  type?: TxType;
  accountId?: string;
  categoryId?: string;
  month?: string;
  minAmount?: string;
  maxAmount?: string;
}

type Row =
  | { kind: 'header'; key: string; label: string; net: number }
  | { kind: 'tx'; key: string; tx: Transaction; first: boolean; last: boolean };

const PAGE = 30;

export default function Transactions() {
  const { colors } = useTheme();
  const currency = useCurrency();
  const params = useLocalSearchParams<{ focus?: string; categoryId?: string; month?: string }>();
  const searchRef = useRef<TextInput>(null);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  // Deep links from other screens (e.g. tapping a category in Insights) — adjust state during render.
  const paramKey = `${params.categoryId ?? ''}|${params.month ?? ''}`;
  const [appliedParamKey, setAppliedParamKey] = useState('|');
  if (paramKey !== appliedParamKey) {
    setAppliedParamKey(paramKey);
    if (params.categoryId || params.month) setFilters((f) => ({ ...f, categoryId: params.categoryId, month: params.month }));
  }

  useEffect(() => {
    if (params.focus) setTimeout(() => searchRef.current?.focus(), 300);
  }, [params.focus]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const query = useMemo(() => {
    const range = filters.month ? monthBounds(filters.month) : null;
    return {
      q: debouncedQ || undefined,
      type: filters.type,
      accountId: filters.accountId,
      categoryId: filters.categoryId,
      from: range?.from.toISOString(),
      to: range?.to.toISOString(),
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
    };
  }, [debouncedQ, filters]);

  const queryKey = JSON.stringify(query);
  const loading = loadedKey !== queryKey;

  // Only sets state after the await so it can run from effects; callers set spinners themselves.
  const fetchPage = useCallback(async (p: number, mode: 'reset' | 'more' | 'refresh' | 'silent') => {
    const id = ++reqId.current;
    const pageSize = mode === 'silent' ? Math.max(PAGE, p * PAGE) : PAGE;
    try {
      const res = await api.get<Paged<Transaction>>('/transactions', { ...query, page: mode === 'silent' ? 1 : p, limit: pageSize });
      if (id === reqId.current) {
        setItems((prev) => (mode === 'more' ? [...prev, ...res.items] : res.items));
        setTotal(res.total);
        setHasMore(res.hasMore);
        if (mode !== 'silent') setPage(p);
        setLoadedKey(JSON.stringify(query));
        setError(null);
      }
    } catch (e) {
      if (id === reqId.current) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setLoadedKey(JSON.stringify(query));
      }
    } finally {
      if (id === reqId.current) {
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, [query]);

  // fetchPage only sets state after its network await, so this is not a synchronous cascade.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchPage(1, 'reset'); }, [fetchPage]);
  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => onDataChanged(() => fetchPage(pageRef.current, 'silent')), [fetchPage]);
  const firstFocus = useRef(true);
  useFocusEffect(useCallback(() => {
    if (firstFocus.current) { firstFocus.current = false; return; }
    fetchPage(pageRef.current, 'silent');
  }, [fetchPage]));

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let currentKey = '';
    let headerIdx = -1;
    items.forEach((tx, i) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const delta = tx.type === 'income' ? tx.amount : tx.type === 'expense' ? -tx.amount : 0;
      if (key !== currentKey) {
        if (out.length) (out[out.length - 1] as Extract<Row, { kind: 'tx' }>).last = true;
        currentKey = key;
        out.push({ kind: 'header', key: `h-${key}`, label: dayLabel(d), net: 0 });
        headerIdx = out.length - 1;
        out.push({ kind: 'tx', key: tx._id, tx, first: true, last: false });
      } else {
        out.push({ kind: 'tx', key: tx._id, tx, first: false, last: false });
      }
      (out[headerIdx] as Extract<Row, { kind: 'header' }>).net += delta;
      if (i === items.length - 1) (out[out.length - 1] as Extract<Row, { kind: 'tx' }>).last = true;
    });
    return out;
  }, [items]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <Screen title="Activity" subtitle={loading ? ' ' : `${total} transaction${total === 1 ? '' : 's'}`} scroll={false}
      right={<IconButton icon="download-outline" label="Export" onPress={() => router.push('/settings')} />}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextField ref={searchRef} icon="search" value={q} onChangeText={setQ} placeholder="Search notes, tags, categories"
              returnKeyType="search" autoCorrect={false} clearButtonMode="while-editing" />
          </View>
          <View>
            <IconButton icon="options-outline" size={48} background={activeCount ? colors.primary : colors.surfaceAlt}
              color={activeCount ? colors.onPrimary : colors.text} onPress={() => setSheetOpen(true)} label="Filters" />
            {activeCount ? (
              <View style={{
                position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
                backgroundColor: colors.expense, alignItems: 'center', justifyContent: 'center',
              }}>
                <AppText style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{activeCount}</AppText>
              </View>
            ) : null}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {([undefined, 'expense', 'income', 'transfer'] as const).map((t) => (
            <Chip key={t ?? 'all'} label={t ? t[0].toUpperCase() + t.slice(1) : 'All'} selected={filters.type === t}
              onPress={() => setFilters((f) => ({ ...f, type: t }))} />
          ))}
          {filters.month ? (
            <Chip label={monthLabel(filters.month, 'short')} icon="close" selected onPress={() => setFilters((f) => ({ ...f, month: undefined }))} />
          ) : null}
        </ScrollView>
      </View>

      {error && !items.length ? <ErrorView message={error} onRetry={() => { setLoadedKey(null); fetchPage(1, 'reset'); }} /> : loading && !items.length ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          style={{ marginTop: spacing.sm, opacity: loading ? 0.5 : 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) { setLoadingMore(true); fetchPage(page + 1, 'more'); }
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPage(1, 'refresh'); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon={debouncedQ || activeCount ? 'search' : 'receipt-outline'}
              title={debouncedQ || activeCount ? 'No matches' : 'No transactions yet'}
              message={debouncedQ || activeCount ? 'Try a different search or clear filters.' : 'Tap + to add your first one.'}
              actionLabel={activeCount ? 'Clear filters' : undefined} onAction={() => setFilters({})} />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
          renderItem={({ item }) => item.kind === 'header' ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.lg, paddingBottom: spacing.sm, paddingHorizontal: 4 }}>
              <AppText variant="label" tone="muted">{item.label}</AppText>
              <AppText variant="label" tone={item.net >= 0 ? 'income' : 'muted'}>{formatMoney(item.net, currency, { sign: true })}</AppText>
            </View>
          ) : (
            <View style={{
              backgroundColor: colors.surface, overflow: 'hidden',
              borderTopLeftRadius: item.first ? radius.lg : 0, borderTopRightRadius: item.first ? radius.lg : 0,
              borderBottomLeftRadius: item.last ? radius.lg : 0, borderBottomRightRadius: item.last ? radius.lg : 0,
              borderBottomWidth: item.last ? 0 : 1, borderBottomColor: colors.border,
            }}>
              <TransactionRow tx={item.tx} />
            </View>
          )}
        />
      )}

      {sheetOpen ? (
        <FilterSheet onClose={() => setSheetOpen(false)} value={filters} onApply={(f) => { setFilters(f); setSheetOpen(false); }} />
      ) : null}
    </Screen>
  );
}

function FilterSheet({ onClose, value, onApply }: {
  onClose: () => void; value: Filters; onApply: (f: Filters) => void;
}) {
  const [draft, setDraft] = useState<Filters>(value);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<{ items: Account[] }>('/accounts', { includeArchived: true }),
      api.get<{ items: Category[] }>('/categories'),
    ]).then(([a, c]) => { setAccounts(a.items); setCategories(c.items); }).catch(() => {});
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => shiftMonthKey(toMonthKey(new Date()), -i));
  const visibleCats = categories.filter((c) => !draft.type || draft.type === 'transfer' || c.type === draft.type);

  return (
    <BottomSheet visible onClose={onClose} title="Filters">
      <View style={{ gap: spacing.lg }}>
        <FilterGroup title="Month">
          <Chip label="All time" selected={!draft.month} onPress={() => setDraft((d) => ({ ...d, month: undefined }))} />
          {months.map((m) => (
            <Chip key={m} label={monthLabel(m, 'short')} selected={draft.month === m} onPress={() => setDraft((d) => ({ ...d, month: m }))} />
          ))}
        </FilterGroup>
        <FilterGroup title="Account">
          <Chip label="Any" selected={!draft.accountId} onPress={() => setDraft((d) => ({ ...d, accountId: undefined }))} />
          {accounts.map((a) => (
            <Chip key={a._id} label={a.name} icon={a.icon} color={a.color} selected={draft.accountId === a._id}
              onPress={() => setDraft((d) => ({ ...d, accountId: a._id }))} />
          ))}
        </FilterGroup>
        <FilterGroup title="Category">
          <Chip label="Any" selected={!draft.categoryId} onPress={() => setDraft((d) => ({ ...d, categoryId: undefined }))} />
          {visibleCats.map((c) => (
            <Chip key={c._id} label={c.name} icon={c.icon} color={c.color} selected={draft.categoryId === c._id}
              onPress={() => setDraft((d) => ({ ...d, categoryId: c._id }))} />
          ))}
        </FilterGroup>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <TextField label="Min amount" keyboardType="decimal-pad" value={draft.minAmount ?? ''}
              onChangeText={(v) => setDraft((d) => ({ ...d, minAmount: v.replace(/[^0-9.]/g, '') }))} placeholder="0" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Max amount" keyboardType="decimal-pad" value={draft.maxAmount ?? ''}
              onChangeText={(v) => setDraft((d) => ({ ...d, maxAmount: v.replace(/[^0-9.]/g, '') }))} placeholder="Any" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button title="Reset" variant="secondary" style={{ flex: 1 }} onPress={() => onApply({ type: draft.type })} />
          <Button title="Apply" icon="checkmark" style={{ flex: 2 }} onPress={() => onApply(draft)} />
        </View>
      </View>
    </BottomSheet>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="funnel-outline" size={14} color={colors.textMuted} />
        <AppText variant="label" tone="muted">{title}</AppText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>
    </View>
  );
}
