import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';

import { api, ApiError } from '@/api/client';
import type { Account, Category, Transaction, TxType } from '@/api/types';
import { DateField } from '@/components/pickers';
import { AppText, Button, Chip, Icon, IconBadge, LoadingView, Screen, Segmented, TextField } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { radius, spacing } from '@/theme/tokens';
import { emitDataChanged, onDataChanged } from '@/utils/events';
import { confirm, haptic } from '@/utils/feedback';
import { currencySymbol } from '@/utils/format';
import { goBack } from '@/utils/navigation';

export function TransactionForm({ existing }: { existing?: Transaction }) {
  const { colors } = useTheme();
  const currency = useCurrency();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<TxType>(existing?.type ?? 'expense');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [accountId, setAccountId] = useState<string | null>(existing?.accountId?._id ?? null);
  const [toAccountId, setToAccountId] = useState<string | null>(existing?.toAccountId?._id ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId?._id ?? null);
  const [date, setDate] = useState<Date>(existing ? new Date(existing.date) : new Date());
  const [note, setNote] = useState(existing?.note ?? '');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagDraft, setTagDraft] = useState('');
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = () => Promise.all([
      api.get<{ items: Account[] }>('/accounts'),
      api.get<{ items: Category[] }>('/categories'),
      api.get<{ items: string[] }>('/transactions/tags'),
    ]).then(([a, c, t]) => {
      setAccounts(a.items);
      setCategories(c.items);
      setKnownTags(t.items);
      setAccountId((cur) => cur ?? a.items[0]?._id ?? null);
    }).catch((e) => setError(e.message));
    load();
    // Pick up categories created from the inline "New" shortcut.
    return onDataChanged(load);
  }, []);

  const visibleCategories = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const accent = type === 'income' ? colors.income : type === 'expense' ? colors.expense : colors.transfer;

  const changeType = (t: TxType) => {
    setType(t);
    if (categories.find((c) => c._id === categoryId)?.type !== t) setCategoryId(null);
  };

  const save = async () => {
    setError(null);
    setFieldErrors({});
    const value = Number(amount.replace(',', '.'));
    if (!value || value <= 0) return setFieldErrors({ amount: 'Enter an amount' });
    if (type !== 'transfer' && !categoryId) return setFieldErrors({ categoryId: 'Pick a category' });
    if (type === 'transfer' && !toAccountId) return setFieldErrors({ toAccountId: 'Pick a destination account' });
    setSaving(true);
    const body = {
      type, amount: value, accountId, date: date.toISOString(), note: note.trim(), tags,
      categoryId: type === 'transfer' ? null : categoryId,
      toAccountId: type === 'transfer' ? toAccountId : null,
    };
    try {
      if (existing) await api.patch(`/transactions/${existing._id}`, body);
      else await api.post('/transactions', body);
      haptic('success');
      emitDataChanged();
      goBack();
    } catch (e) {
      setSaving(false);
      if (e instanceof ApiError) { setError(e.message); setFieldErrors(e.fields ?? {}); }
      else setError('Could not save');
    }
  };

  const remove = async () => {
    if (!existing || !(await confirm('Delete transaction?', 'This cannot be undone.'))) return;
    await api.del(`/transactions/${existing._id}`);
    haptic('warning');
    emitDataChanged();
    goBack();
  };

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/^#/, '').toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) setTags([...tags, t]);
    setTagDraft('');
  };

  if (!accounts) return <Screen modal title={existing ? 'Edit transaction' : 'New transaction'}><LoadingView /></Screen>;

  return (
    <Screen modal title={existing ? 'Edit transaction' : 'New transaction'}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {existing ? <Button title="Delete" variant="danger" icon="trash-outline" onPress={remove} style={{ flex: 1 }} /> : null}
          <Button title={existing ? 'Save changes' : `Add ${type}`} icon="checkmark" onPress={save} loading={saving} style={{ flex: 2 }} />
        </View>
      }>
      <Segmented value={type} onChange={changeType}
        colorFor={(v) => (v === 'income' ? colors.income : v === 'expense' ? colors.expense : colors.transfer)}
        options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'transfer', label: 'Transfer' }]} />

      <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
        <AppText variant="caption" tone="muted">Amount</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <AppText style={{ fontSize: 30, fontWeight: '700', color: accent }}>{currencySymbol(currency)}</AppText>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.,]/g, ''))}
            placeholder="0.00"
            placeholderTextColor={colors.textFaint}
            keyboardType="decimal-pad"
            autoFocus={!existing}
            style={[{ fontSize: 46, fontWeight: '800', color: accent, minWidth: 120, textAlign: 'center', letterSpacing: -1 }, Platform.OS === 'web' && { outlineWidth: 0 }]}
            accessibilityLabel="Amount"
          />
        </View>
        {fieldErrors.amount ? <AppText variant="caption" tone="expense">{fieldErrors.amount}</AppText> : null}
      </View>

      {type !== 'transfer' ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label" tone="muted">Category</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {visibleCategories.map((c) => {
              const selected = c._id === categoryId;
              return (
                <Pressable key={c._id} onPress={() => { haptic(); setCategoryId(c._id); }}
                  style={{
                    width: '23%', flexGrow: 1, maxWidth: 110, alignItems: 'center', gap: 6, paddingVertical: spacing.sm,
                    borderRadius: radius.md, borderWidth: 1.5,
                    borderColor: selected ? c.color : 'transparent', backgroundColor: selected ? `${c.color}14` : 'transparent',
                  }}>
                  <IconBadge name={c.icon} color={c.color} size={42} solid={selected} />
                  <AppText variant="caption" numberOfLines={1} style={{ fontWeight: selected ? '700' : '500', paddingHorizontal: 2 }}>{c.name}</AppText>
                </Pressable>
              );
            })}
            <Pressable onPress={() => router.push({ pathname: '/categories/form', params: { type } })}
              style={{ width: '23%', flexGrow: 1, maxWidth: 110, alignItems: 'center', gap: 6, paddingVertical: spacing.sm }}>
              <View style={{ width: 42, height: 42, borderRadius: 13, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="add" size={20} color={colors.textMuted} />
              </View>
              <AppText variant="caption" tone="muted">New</AppText>
            </Pressable>
          </View>
          {fieldErrors.categoryId ? <AppText variant="caption" tone="expense">{fieldErrors.categoryId}</AppText> : null}
        </View>
      ) : null}

      <AccountPicker label={type === 'transfer' ? 'From account' : 'Account'} accounts={accounts} value={accountId} onChange={setAccountId} />
      {type === 'transfer' ? (
        <>
          <AccountPicker label="To account" accounts={accounts.filter((a) => a._id !== accountId)} value={toAccountId} onChange={setToAccountId} />
          {fieldErrors.toAccountId ? <AppText variant="caption" tone="expense">{fieldErrors.toAccountId}</AppText> : null}
        </>
      ) : null}

      <DateField label="Date" value={date} onChange={(d) => d && setDate(d)} />
      <TextField label="Note" icon="create-outline" value={note} onChangeText={setNote} placeholder="What was this for?" maxLength={300} />

      <View style={{ gap: spacing.sm }}>
        <TextField label="Tags" icon="pricetag-outline" value={tagDraft} onChangeText={(v) => (v.endsWith(' ') || v.endsWith(',') ? addTag(v.slice(0, -1)) : setTagDraft(v))}
          onSubmitEditing={() => addTag(tagDraft)} placeholder="Type and press enter" autoCapitalize="none" returnKeyType="done" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {tags.map((t) => <Chip key={t} label={`#${t}`} icon="close" selected onPress={() => setTags(tags.filter((x) => x !== t))} />)}
        </View>
        {knownTags.filter((t) => !tags.includes(t)).length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {knownTags.filter((t) => !tags.includes(t)).slice(0, 12).map((t) => (
              <Chip key={t} label={`#${t}`} onPress={() => addTag(t)} />
            ))}
          </ScrollView>
        ) : null}
      </View>

      {error ? <AppText tone="expense" variant="label">{error}</AppText> : null}
    </Screen>
  );
}

function AccountPicker({ label, accounts, value, onChange }: {
  label: string; accounts: Account[]; value: string | null; onChange: (id: string) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="muted">{label}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {accounts.map((a) => (
          <Chip key={a._id} label={a.name} icon={a.icon} color={a.color} selected={a._id === value} onPress={() => onChange(a._id)} />
        ))}
      </ScrollView>
    </View>
  );
}
