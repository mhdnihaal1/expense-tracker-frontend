import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { api, tz } from '@/api/client';
import type { BudgetStatus } from '@/api/types';
import { ProgressRing } from '@/components/charts/progress-ring';
import { AppText, AsyncContent, Card, EmptyState, IconBadge, IconButton, MonthSwitcher, ProgressBar, Screen } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useApi } from '@/hooks/use-api';
import { spacing } from '@/theme/tokens';
import { formatMoney, toMonthKey } from '@/utils/format';

export default function Budgets() {
  const { colors } = useTheme();
  const currency = useCurrency();
  const [month, setMonth] = useState(toMonthKey(new Date()));
  const { data, loading, error, refreshing, refresh } = useApi(
    () => api.get<{ items: BudgetStatus[] }>('/stats/budgets', { ...tz(), month }), [month]
  );
  const statusColor = (s: BudgetStatus['status']) => (s === 'over' ? colors.expense : s === 'warning' ? colors.warning : colors.income);

  // Days left only matters for the current month.
  const now = new Date();
  const isCurrent = month === toMonthKey(now);
  const daysLeft = isCurrent ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1 : 0;

  return (
    <Screen title="Budgets" back refreshing={refreshing} onRefresh={refresh}
      right={<IconButton icon="add" background={colors.primary} color={colors.onPrimary} onPress={() => router.push('/budgets/form')} label="Add budget" />}>
      <MonthSwitcher month={month} onChange={setMonth} />
      <AsyncContent data={data} loading={loading} error={error} onRetry={refresh}>
        {(d) => {
          if (!d.items.length) {
            return <EmptyState icon="pie-chart-outline" title="No budgets yet" message="Set monthly limits per category and get alerts before you overspend."
              actionLabel="Create budget" onAction={() => router.push('/budgets/form')} />;
          }
          const overall = d.items.find((b) => !b.category);
          const rest = d.items.filter((b) => b.category);
          return (
            <>
              {overall ? (
                <Card onPress={() => router.push({ pathname: '/budgets/form', params: { id: overall._id } })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                  <ProgressRing percent={overall.percent} color={statusColor(overall.status)} size={92} thickness={10}>
                    <AppText variant="heading">{Math.round(overall.percent)}%</AppText>
                  </ProgressRing>
                  <View style={{ flex: 1, gap: 4 }}>
                    <AppText variant="label" tone="muted">Overall monthly budget</AppText>
                    <AppText variant="title">{formatMoney(overall.spent, currency)}</AppText>
                    <AppText variant="caption" tone="muted">of {formatMoney(overall.amount, currency)}</AppText>
                    {isCurrent && overall.remaining > 0 ? (
                      <AppText variant="caption" tone="primary">≈ {formatMoney(overall.remaining / daysLeft, currency)}/day for {daysLeft} days</AppText>
                    ) : null}
                  </View>
                </Card>
              ) : null}
              {rest.map((b) => (
                <Card key={b._id} onPress={() => router.push({ pathname: '/budgets/form', params: { id: b._id } })} style={{ gap: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <IconBadge name={b.category!.icon} color={b.category!.color} size={40} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="heading">{b.category!.name}</AppText>
                      <AppText variant="caption" tone="muted">
                        {formatMoney(b.spent, currency)} of {formatMoney(b.amount, currency)}
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText variant="label" style={{ color: statusColor(b.status) }}>
                        {b.remaining >= 0 ? `${formatMoney(b.remaining, currency)} left` : `${formatMoney(-b.remaining, currency)} over`}
                      </AppText>
                      <AppText variant="caption" tone="faint">{Math.round(b.percent)}%</AppText>
                    </View>
                  </View>
                  <ProgressBar percent={b.percent} color={statusColor(b.status)} />
                </Card>
              ))}
            </>
          );
        }}
      </AsyncContent>
    </Screen>
  );
}
