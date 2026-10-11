import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { api, tz } from '@/api/client';
import type { CategoryStat, Summary } from '@/api/types';
import { BarChart } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import {
  AppText, AsyncContent, Card, EmptyState, Icon, IconBadge, MonthSwitcher, ProgressBar, Screen, SectionHeader, Segmented,
} from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useApi } from '@/hooks/use-api';
import { spacing } from '@/theme/tokens';
import { formatMoney, monthLabel, toMonthKey } from '@/utils/format';

export default function Stats() {
  const { colors } = useTheme();
  const currency = useCurrency();
  const [month, setMonth] = useState(toMonthKey(new Date()));
  const [kind, setKind] = useState<'expense' | 'income'>('expense');

  const { data, loading, error, refreshing, refresh } = useApi(async () => {
    const [summary, byCat, trend] = await Promise.all([
      api.get<Summary>('/stats/summary', { ...tz(), month }),
      api.get<{ total: number; items: CategoryStat[] }>('/stats/by-category', { ...tz(), month, type: kind }),
      api.get<{ items: { month: string; income: number; expense: number }[] }>('/stats/trend', { ...tz(), month, months: 6 }),
    ]);
    return { summary, byCat, trend: trend.items };
  }, [month, kind]);

  const accent = kind === 'expense' ? colors.expense : colors.income;

  return (
    <Screen title="Insights" subtitle="Where your money goes" refreshing={refreshing} onRefresh={refresh}>
      <MonthSwitcher month={month} onChange={setMonth} />
      <AsyncContent data={data} loading={loading} error={error} onRetry={refresh}>
        {({ summary, byCat, trend }) => {
          const top = byCat.items[0];
          const avgExpense = trend.reduce((s, t) => s + t.expense, 0) / Math.max(1, trend.filter((t) => t.expense > 0).length);
          return (
            <>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <StatTile label="Income" value={formatMoney(summary.income, currency, { compact: summary.income >= 100000 })}
                  icon="arrow-down-circle" color={colors.income} change={summary.change.income} goodWhenUp />
                <StatTile label="Expenses" value={formatMoney(summary.expense, currency, { compact: summary.expense >= 100000 })}
                  icon="arrow-up-circle" color={colors.expense} change={summary.change.expense} />
              </View>

              <Card style={{ gap: spacing.lg }}>
                <Segmented value={kind} onChange={setKind}
                  colorFor={(v) => (v === 'expense' ? colors.expense : colors.income)}
                  options={[{ value: 'expense', label: 'Spending' }, { value: 'income', label: 'Income' }]} />
                {byCat.items.length ? (
                  <>
                    <View style={{ alignItems: 'center' }}>
                      <DonutChart size={210} thickness={28} data={byCat.items.map((c) => ({ value: c.total, color: c.color }))}>
                        <AppText variant="caption" tone="muted">Total {kind === 'expense' ? 'spent' : 'earned'}</AppText>
                        <AppText variant="title" style={{ color: accent }}>{formatMoney(byCat.total, currency)}</AppText>
                        <AppText variant="caption" tone="faint">{byCat.items.reduce((s, c) => s + c.count, 0)} transactions</AppText>
                      </DonutChart>
                    </View>
                    <View style={{ gap: spacing.md }}>
                      {byCat.items.map((c) => (
                        <Pressable key={c.categoryId ?? c.name}
                          onPress={() => c.categoryId && router.push({ pathname: '/transactions', params: { categoryId: c.categoryId, month } })}
                          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, opacity: pressed ? 0.7 : 1 })}>
                          <IconBadge name={c.icon} color={c.color} size={36} />
                          <View style={{ flex: 1, gap: 5 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <AppText variant="label" numberOfLines={1} style={{ flex: 1 }}>{c.name}</AppText>
                              <AppText variant="label">{formatMoney(c.total, currency)}</AppText>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                              <View style={{ flex: 1 }}><ProgressBar percent={c.percent} color={c.color} height={5} /></View>
                              <AppText variant="caption" tone="muted" style={{ width: 44, textAlign: 'right' }}>{c.percent.toFixed(1)}%</AppText>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : (
                  <EmptyState icon="pie-chart-outline" title={`No ${kind} in ${monthLabel(month)}`} message="Transactions you add will show up here." />
                )}
              </Card>

              <SectionHeader title="Smart insights" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                <InsightCard icon="calendar-outline" color={colors.primary} label="Daily average"
                  value={formatMoney(summary.dailyAverage, currency)} hint="spent per day" />
                <InsightCard icon="leaf-outline" color={colors.income} label="Savings rate"
                  value={summary.savingsRate === null ? '—' : `${summary.savingsRate.toFixed(0)}%`}
                  hint={summary.net >= 0 ? `${formatMoney(summary.net, currency)} saved` : `${formatMoney(-summary.net, currency)} overspent`} />
                <InsightCard icon={top?.icon ?? 'pricetag'} color={top?.color ?? colors.warning} label={`Top ${kind === 'expense' ? 'spend' : 'source'}`}
                  value={top?.name ?? '—'} hint={top ? `${top.percent.toFixed(0)}% of total` : 'No data'} />
                <InsightCard icon="analytics-outline" color={colors.transfer} label="6-month avg"
                  value={formatMoney(avgExpense || 0, currency, { compact: avgExpense >= 100000 })} hint="monthly spending" />
              </View>

              <SectionHeader title="Income vs expenses" />
              <Card style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                  <Legend color={colors.income} label="Income" />
                  <Legend color={colors.expense} label="Expenses" />
                </View>
                <BarChart height={170} formatValue={(n) => formatMoney(n, currency, { compact: true })}
                  groups={trend.map((t) => ({
                    label: new Date(`${t.month}-15T12:00:00`).toLocaleDateString(undefined, { month: 'short' }),
                    highlight: t.month === month,
                    values: [{ value: t.income, color: colors.income }, { value: t.expense, color: colors.expense }],
                  }))} />
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  {[...trend].reverse().slice(0, 3).map((t) => (
                    <View key={t.month} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <AppText variant="caption" tone="muted">{monthLabel(t.month)}</AppText>
                      <AppText variant="caption" tone={t.income - t.expense >= 0 ? 'income' : 'expense'} style={{ fontWeight: '700' }}>
                        {formatMoney(t.income - t.expense, currency, { sign: true })}
                      </AppText>
                    </View>
                  ))}
                </View>
              </Card>
            </>
          );
        }}
      </AsyncContent>
    </Screen>
  );
}

function StatTile({ label, value, icon, color, change, goodWhenUp }: {
  label: string; value: string; icon: string; color: string; change: number | null; goodWhenUp?: boolean;
}) {
  const { colors } = useTheme();
  const good = change === null ? null : goodWhenUp ? change >= 0 : change <= 0;
  return (
    <Card style={{ flex: 1, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={18} color={color} />
        <AppText variant="label" tone="muted">{label}</AppText>
      </View>
      <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit>{value}</AppText>
      {change !== null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Icon name={change >= 0 ? 'trending-up' : 'trending-down'} size={14} color={good ? colors.income : colors.expense} />
          <AppText variant="caption" style={{ color: good ? colors.income : colors.expense }}>
            {Math.abs(change).toFixed(0)}% vs last month
          </AppText>
        </View>
      ) : <AppText variant="caption" tone="faint">No data last month</AppText>}
    </Card>
  );
}

function InsightCard({ icon, color, label, value, hint }: { icon: string; color: string; label: string; value: string; hint: string }) {
  return (
    <Card style={{ flexBasis: '47%', flexGrow: 1, gap: spacing.sm }}>
      <IconBadge name={icon} color={color} size={34} />
      <AppText variant="caption" tone="muted">{label}</AppText>
      <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit>{value}</AppText>
      <AppText variant="caption" tone="faint" numberOfLines={1}>{hint}</AppText>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <AppText variant="caption" tone="muted">{label}</AppText>
    </View>
  );
}
