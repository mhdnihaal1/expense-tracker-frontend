import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { api, ApiError } from '@/api/client';
import type { Goal } from '@/api/types';
import { BottomSheet } from '@/components/bottom-sheet';
import { ProgressRing } from '@/components/charts/progress-ring';
import { AppText, AsyncContent, Button, Card, Icon, IconButton, ListRow, Screen, Segmented, TextField } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useApi } from '@/hooks/use-api';
import { spacing } from '@/theme/tokens';
import { emitDataChanged } from '@/utils/events';
import { haptic } from '@/utils/feedback';
import { formatMoney, shortDate } from '@/utils/format';

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const currency = useCurrency();
  const { data, loading, error, refresh, refreshing, setData } = useApi(() => api.get<Goal>(`/goals/${id}`), [id]);
  const [sheet, setSheet] = useState(false);
  const [mode, setMode] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const contribute = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return setFormError('Enter an amount');
    setSaving(true);
    setFormError(null);
    try {
      const g = await api.post<Goal>(`/goals/${id}/contribute`, { amount: mode === 'add' ? value : -value, note });
      setData(g);
      haptic('success');
      emitDataChanged();
      setSheet(false);
      setAmount('');
      setNote('');
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={data?.name ?? 'Goal'} back refreshing={refreshing} onRefresh={refresh}
      right={<IconButton icon="create-outline" label="Edit goal" onPress={() => router.push({ pathname: '/goals/form', params: { id } })} />}>
      <AsyncContent data={data} loading={loading} error={error} onRetry={refresh}>
        {(g) => {
          const pct = Math.min(100, (g.savedAmount / g.targetAmount) * 100);
          const remaining = Math.max(0, g.targetAmount - g.savedAmount);
          const monthsLeft = g.deadline
            ? Math.max(1, Math.ceil((new Date(g.deadline).getTime() - now) / (30.44 * 86400000)))
            : null;
          return (
            <>
              <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
                <ProgressRing percent={pct} color={g.color} size={180} thickness={16}>
                  <Icon name={g.icon} size={28} color={g.color} />
                  <AppText variant="title">{Math.round(pct)}%</AppText>
                </ProgressRing>
                <AppText variant="display" style={{ fontSize: 30 }}>{formatMoney(g.savedAmount, currency)}</AppText>
                <AppText tone="muted">saved of {formatMoney(g.targetAmount, currency)}</AppText>
                <View style={{ flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch', marginTop: spacing.sm }}>
                  <Button title="Add money" icon="add" style={{ flex: 1 }} onPress={() => { setMode('add'); setSheet(true); }} />
                  <Button title="Withdraw" icon="remove" variant="secondary" style={{ flex: 1 }} onPress={() => { setMode('withdraw'); setSheet(true); }} />
                </View>
              </Card>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Card style={{ flex: 1, gap: 4 }}>
                  <AppText variant="caption" tone="muted">Remaining</AppText>
                  <AppText variant="heading">{formatMoney(remaining, currency)}</AppText>
                </Card>
                <Card style={{ flex: 1, gap: 4 }}>
                  <AppText variant="caption" tone="muted">{monthsLeft ? 'Save per month' : 'Target date'}</AppText>
                  <AppText variant="heading">{monthsLeft ? formatMoney(remaining / monthsLeft, currency) : 'Not set'}</AppText>
                  {g.deadline ? <AppText variant="caption" tone="faint">by {shortDate(g.deadline)}</AppText> : null}
                </Card>
              </View>
              <AppText variant="heading">History</AppText>
              <Card padded={false} style={{ overflow: 'hidden' }}>
                {g.contributions.length ? [...g.contributions].reverse().map((c, i, arr) => (
                  <ListRow key={c._id ?? i} icon={c.amount >= 0 ? 'arrow-down' : 'arrow-up'}
                    iconColor={c.amount >= 0 ? colors.income : colors.expense}
                    title={c.note || (c.amount >= 0 ? 'Contribution' : 'Withdrawal')} subtitle={shortDate(c.date)}
                    divider={i < arr.length - 1}
                    right={<AppText variant="label" tone={c.amount >= 0 ? 'income' : 'expense'}>{formatMoney(c.amount, currency, { sign: true })}</AppText>} />
                )) : <View style={{ padding: spacing.lg }}><AppText tone="muted">No contributions yet.</AppText></View>}
              </Card>
            </>
          );
        }}
      </AsyncContent>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title={mode === 'add' ? 'Add to goal' : 'Withdraw from goal'}>
        <View style={{ gap: spacing.lg }}>
          <Segmented value={mode} onChange={setMode} options={[{ value: 'add', label: 'Add' }, { value: 'withdraw', label: 'Withdraw' }]} />
          <TextField label="Amount" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0.00" icon="cash-outline" autoFocus />
          <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Bonus" />
          {formError ? <AppText tone="expense" variant="label">{formError}</AppText> : null}
          <Button title={mode === 'add' ? 'Add money' : 'Withdraw'} onPress={contribute} loading={saving} />
        </View>
      </BottomSheet>
    </Screen>
  );
}
