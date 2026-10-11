import { router } from 'expo-router';
import { Switch, View } from 'react-native';

import { api } from '@/api/client';
import type { Recurring } from '@/api/types';
import { AppText, AsyncContent, Card, EmptyState, IconBadge, IconButton, Screen } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useApi } from '@/hooks/use-api';
import { spacing } from '@/theme/tokens';
import { emitDataChanged } from '@/utils/events';
import { formatMoney, shortDate } from '@/utils/format';

const PER_MONTH = { daily: 30.44, weekly: 4.35, monthly: 1, yearly: 1 / 12 };
const FREQ_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

export default function RecurringList() {
  const { colors } = useTheme();
  const currency = useCurrency();
  const { data, loading, error, refreshing, refresh, setData } = useApi(() => api.get<{ items: Recurring[] }>('/recurring'));

  const toggle = async (r: Recurring) => {
    const updated = await api.post<Recurring>(`/recurring/${r._id}/toggle`);
    setData((d) => d && { items: d.items.map((x) => (x._id === r._id ? updated : x)) });
    emitDataChanged();
  };

  return (
    <Screen title="Recurring" back refreshing={refreshing} onRefresh={refresh}
      right={<IconButton icon="add" background={colors.primary} color={colors.onPrimary} onPress={() => router.push('/recurring/form')} label="Add recurring" />}>
      <AsyncContent data={data} loading={loading} error={error} onRetry={refresh}>
        {({ items }) => {
          if (!items.length) {
            return <EmptyState icon="repeat" title="Automate the routine" message="Add rent, salary, subscriptions and bills once — they'll be recorded automatically on schedule."
              actionLabel="Add recurring" onAction={() => router.push('/recurring/form')} />;
          }
          const active = items.filter((r) => r.active);
          const monthlyOut = active.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount * PER_MONTH[r.frequency], 0);
          const monthlyIn = active.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount * PER_MONTH[r.frequency], 0);
          return (
            <>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Card style={{ flex: 1, gap: 4 }}>
                  <AppText variant="caption" tone="muted">Fixed costs / mo</AppText>
                  <AppText variant="heading" tone="expense">{formatMoney(monthlyOut, currency)}</AppText>
                </Card>
                <Card style={{ flex: 1, gap: 4 }}>
                  <AppText variant="caption" tone="muted">Recurring income / mo</AppText>
                  <AppText variant="heading" tone="income">{formatMoney(monthlyIn, currency)}</AppText>
                </Card>
              </View>
              {items.map((r) => {
                const isTransfer = r.type === 'transfer';
                return (
                  <Card key={r._id} onPress={() => router.push({ pathname: '/recurring/form', params: { id: r._id } })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, opacity: r.active ? 1 : 0.55 }}>
                    <IconBadge name={isTransfer ? 'swap-horizontal' : r.categoryId?.icon ?? 'repeat'}
                      color={isTransfer ? colors.transfer : r.categoryId?.color ?? colors.primary} size={44} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
                        {r.note || (isTransfer ? 'Transfer' : r.categoryId?.name)}
                      </AppText>
                      <AppText variant="label" tone={r.type === 'income' ? 'income' : r.type === 'expense' ? 'expense' : 'primary'}>
                        {formatMoney(r.amount, currency)} · {FREQ_LABEL[r.frequency]}
                      </AppText>
                      <AppText variant="caption" tone="faint">
                        {r.active ? `Next: ${shortDate(r.nextRunDate)}` : 'Paused'}{r.endDate ? ` · ends ${shortDate(r.endDate)}` : ''}
                      </AppText>
                    </View>
                    <Switch value={r.active} onValueChange={() => toggle(r)} trackColor={{ true: colors.primary }} thumbColor="#FFFFFF" />
                  </Card>
                );
              })}
            </>
          );
        }}
      </AsyncContent>
    </Screen>
  );
}
