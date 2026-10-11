import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { api, ApiError } from '@/api/client';
import type { Account, Category, Frequency, Recurring, TxType } from '@/api/types';
import { DateField } from '@/components/pickers';
import { AppText, Button, Chip, LoadingView, Screen, Segmented, TextField } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { spacing } from '@/theme/tokens';
import { emitDataChanged } from '@/utils/events';
import { confirm, haptic } from '@/utils/feedback';
import { currencySymbol } from '@/utils/format';
import { goBack } from '@/utils/navigation';

export default function RecurringForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const currency = useCurrency();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [originalStart, setOriginalStart] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ items: Account[] }>('/accounts'),
      api.get<{ items: Category[] }>('/categories'),
      id ? api.get<{ items: Recurring[] }>('/recurring') : Promise.resolve(null),
    ]).then(([a, c, r]) => {
      setCategories(c.items);
      const rule = r?.items.find((x) => x._id === id);
      if (rule) {
        setType(rule.type); setAmount(String(rule.amount)); setAccountId(rule.accountId._id);
        setToAccountId(rule.toAccountId?._id ?? null); setCategoryId(rule.categoryId?._id ?? null);
        setNote(rule.note); setFrequency(rule.frequency); setStartDate(new Date(rule.startDate));
        setOriginalStart(rule.startDate); setEndDate(rule.endDate ? new Date(rule.endDate) : null);
      } else setAccountId(a.items[0]?._id ?? null);
      setAccounts(a.items);
    });
  }, [id]);

  const save = async () => {
    setError(null);
    const value = Number(amount);
    if (!value) return setError('Enter an amount');
    if (type !== 'transfer' && !categoryId) return setError('Pick a category');
    if (type === 'transfer' && !toAccountId) return setError('Pick a destination account');
    setSaving(true);
    const body: Record<string, unknown> = {
      type, amount: value, accountId, note: note.trim(), frequency,
      categoryId: type === 'transfer' ? null : categoryId,
      toAccountId: type === 'transfer' ? toAccountId : null,
      endDate: endDate?.toISOString() ?? null,
    };
    // Only send startDate when it changed, since it reschedules the next run.
    if (!id || startDate.toISOString() !== originalStart) body.startDate = startDate.toISOString();
    try {
      if (id) await api.patch(`/recurring/${id}`, body);
      else await api.post('/recurring', body);
      haptic('success');
      emitDataChanged();
      goBack();
    } catch (e) {
      setSaving(false);
      setError(e instanceof ApiError ? e.message : 'Could not save');
    }
  };

  const remove = async () => {
    if (!id || !(await confirm('Delete recurring rule?', 'Transactions already created are kept.'))) return;
    await api.del(`/recurring/${id}`);
    emitDataChanged();
    goBack();
  };

  if (!accounts) return <Screen modal title="Recurring"><LoadingView /></Screen>;

  const visibleCats = categories.filter((c) => c.type === type);
  return (
    <Screen modal title={id ? 'Edit recurring' : 'New recurring'}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {id ? <Button title="Delete" variant="danger" icon="trash-outline" onPress={remove} style={{ flex: 1 }} /> : null}
          <Button title="Save" icon="checkmark" onPress={save} loading={saving} style={{ flex: 2 }} />
        </View>
      }>
      <Segmented value={type} onChange={(t) => { setType(t); setCategoryId(null); }}
        colorFor={(v) => (v === 'income' ? colors.income : v === 'expense' ? colors.expense : colors.transfer)}
        options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'transfer', label: 'Transfer' }]} />
      <TextField label={`Amount (${currencySymbol(currency)})`} value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad" placeholder="0.00" icon="cash-outline" />
      <TextField label="Name / note" value={note} onChangeText={setNote} placeholder="e.g. Netflix, Rent, Salary" icon="create-outline" />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="muted">Repeats</AppText>
        <Segmented value={frequency} onChange={setFrequency}
          options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} />
      </View>
      {type !== 'transfer' ? (
        <ChipRow label="Category">
          {visibleCats.map((c) => <Chip key={c._id} label={c.name} icon={c.icon} color={c.color} selected={categoryId === c._id} onPress={() => setCategoryId(c._id)} />)}
        </ChipRow>
      ) : null}
      <ChipRow label={type === 'transfer' ? 'From account' : 'Account'}>
        {accounts.map((a) => <Chip key={a._id} label={a.name} icon={a.icon} color={a.color} selected={accountId === a._id} onPress={() => setAccountId(a._id)} />)}
      </ChipRow>
      {type === 'transfer' ? (
        <ChipRow label="To account">
          {accounts.filter((a) => a._id !== accountId).map((a) => (
            <Chip key={a._id} label={a.name} icon={a.icon} color={a.color} selected={toAccountId === a._id} onPress={() => setToAccountId(a._id)} />
          ))}
        </ChipRow>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}><DateField label="Starts" value={startDate} onChange={(d) => d && setStartDate(d)} /></View>
        <View style={{ flex: 1 }}><DateField label="Ends (optional)" value={endDate} onChange={setEndDate} allowClear placeholder="Never" /></View>
      </View>
      <AppText variant="caption" tone="faint">Past-due occurrences since the start date are recorded automatically.</AppText>
      {error ? <AppText tone="expense" variant="label">{error}</AppText> : null}
    </Screen>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="muted">{label}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>{children}</ScrollView>
    </View>
  );
}
