import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api, ApiError } from '@/api/client';
import type { Category } from '@/api/types';
import { SelectField } from '@/components/pickers';
import { AppText, Button, Chip, LoadingView, Screen, TextField } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { spacing } from '@/theme/tokens';
import { emitDataChanged } from '@/utils/events';
import { confirm, haptic } from '@/utils/feedback';
import { currencySymbol } from '@/utils/format';
import { goBack } from '@/utils/navigation';

interface BudgetDoc { _id: string; amount: number; alertThreshold: number; categoryId: Category | null }

const OVERALL = '__overall__';

export default function BudgetForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const currency = useCurrency();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [existing, setExisting] = useState<BudgetDoc | null>(null);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [threshold, setThreshold] = useState(80);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.get<{ items: Category[] }>('/categories', { type: 'expense' }),
      api.get<{ items: BudgetDoc[] }>('/budgets'),
    ]).then(([c, b]) => {
      setCategories(c.items);
      setUsedIds(b.items.map((x) => x.categoryId?._id ?? OVERALL));
      const found = id ? b.items.find((x) => x._id === id) : null;
      if (found) {
        setExisting(found);
        setCategoryId(found.categoryId?._id ?? OVERALL);
        setAmount(String(found.amount));
        setThreshold(found.alertThreshold);
      }
    });
  }, [id]);

  const save = async () => {
    setErrors({});
    const value = Number(amount);
    if (!categoryId) return setErrors({ categoryId: 'Choose what this budget covers' });
    if (!value || value <= 0) return setErrors({ amount: 'Enter a monthly limit' });
    setSaving(true);
    try {
      if (existing) await api.patch(`/budgets/${existing._id}`, { amount: value, alertThreshold: threshold });
      else await api.post('/budgets', { categoryId: categoryId === OVERALL ? null : categoryId, amount: value, alertThreshold: threshold });
      haptic('success');
      emitDataChanged();
      goBack();
    } catch (e) {
      setSaving(false);
      if (e instanceof ApiError) setErrors({ ...(e.fields ?? {}), _: e.message });
    }
  };

  const remove = async () => {
    if (!existing || !(await confirm('Delete budget?', 'Your transactions are not affected.'))) return;
    await api.del(`/budgets/${existing._id}`);
    emitDataChanged();
    goBack();
  };

  if (!categories) return <Screen modal title="Budget"><LoadingView /></Screen>;

  const options = [
    { value: OVERALL, label: 'Overall (all expenses)', icon: 'apps', color: '#4F46E5' },
    ...categories.map((c) => ({ value: c._id, label: c.name, icon: c.icon, color: c.color })),
  ].filter((o) => existing ? o.value === categoryId : !usedIds.includes(o.value));

  return (
    <Screen modal title={existing ? 'Edit budget' : 'New budget'}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {existing ? <Button title="Delete" variant="danger" icon="trash-outline" onPress={remove} style={{ flex: 1 }} /> : null}
          <Button title="Save budget" icon="checkmark" onPress={save} loading={saving} style={{ flex: 2 }} />
        </View>
      }>
      <SelectField label="Applies to" value={categoryId} options={options} onChange={setCategoryId} icon="pricetag-outline" />
      {errors.categoryId ? <AppText variant="caption" tone="expense">{errors.categoryId}</AppText> : null}
      <TextField label={`Monthly limit (${currencySymbol(currency)})`} value={amount} keyboardType="decimal-pad"
        onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} placeholder="500" error={errors.amount} icon="cash-outline" />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="muted">Alert me when I reach</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {[50, 70, 80, 90, 100].map((t) => <Chip key={t} label={`${t}%`} selected={threshold === t} onPress={() => setThreshold(t)} />)}
        </View>
      </View>
      <AppText variant="caption" tone="faint">Budgets reset every month. You will see a warning on the dashboard when spending crosses your alert level.</AppText>
      {errors._ ? <AppText tone="expense" variant="label">{errors._}</AppText> : null}
    </Screen>
  );
}
