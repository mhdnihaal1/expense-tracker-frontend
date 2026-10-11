import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, tz } from '@/api/client';
import type { Account, BudgetStatus, CategoryStat, Paged, Summary, Transaction } from '@/api/types';
import { BarChart } from '@/components/charts/bar-chart';
import { TransactionRow } from '@/components/transaction-row';
import {
  AppText, AsyncContent, Card, EmptyState, Icon, IconBadge, IconButton, ProgressBar, Screen, SectionHeader,
} from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useApi } from '@/hooks/use-api';
import { radius, spacing } from '@/theme/tokens';
import { formatMoney, greeting } from '@/utils/format';

interface DashboardData {
  summary: Summary;
  accounts: Account[];
  budgets: BudgetStatus[];
  daily: { date: string; expense: number }[];
  categories: CategoryStat[];
  recent: Transaction[];
}

async function loadDashboard(): Promise<DashboardData> {
  const [summary, accounts, budgets, daily, byCat, recent] = await Promise.all([
    api.get<Summary>('/stats/summary', tz()),
    api.get<{ items: Account[] }>('/accounts'),
    api.get<{ items: BudgetStatus[] }>('/stats/budgets', tz()),
    api.get<{ items: { date: string; expense: number }[] }>('/stats/daily', { ...tz(), days: 7 }),
    api.get<{ items: CategoryStat[] }>('/stats/by-category', tz()),
    api.get<Paged<Transaction>>('/transactions', { limit: 6 }),
  ]);
  return {
    summary, accounts: accounts.items, budgets: budgets.items, daily: daily.items,
    categories: byCat.items.slice(0, 4), recent: recent.items,
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const currency = user?.currency ?? 'USD';
  const { data, loading, error, refreshing, refresh } = useApi(loadDashboard);
  const initials = (user?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Pressable onPress={() => router.push('/settings')} style={{
        width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
      }}>
        <AppText variant="heading" tone="primary">{initials}</AppText>
      </Pressable>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" tone="muted">{greeting()},</AppText>
        <AppText variant="heading" numberOfLines={1}>{user?.name}</AppText>
      </View>
      <IconButton icon="search" onPress={() => router.push({ pathname: '/transactions', params: { focus: '1' } })} label="Search" />
    </View>
  );

  return (
    <Screen header={<View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}><SafeTop />{header}</View>}
      refreshing={refreshing} onRefresh={refresh}>
      <AsyncContent data={data} loading={loading} error={error} onRetry={refresh}>
        {(d) => {
          const alerts = d.budgets.filter((b) => b.status !== 'ok');
          const overall = d.budgets.find((b) => !b.category);
          return (
            <>
              <HeroCard summary={d.summary} currency={currency} />

              {alerts.length ? (
                <Card onPress={() => router.push('/budgets')} style={{
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                  backgroundColor: alerts.some((a) => a.status === 'over') ? colors.expenseSoft : colors.warningSoft,
                }}>
                  <Icon name="warning" size={22} color={alerts.some((a) => a.status === 'over') ? colors.expense : colors.warning} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">
                      {alerts.filter((a) => a.status === 'over').length
                        ? `${alerts.filter((a) => a.status === 'over').length} budget(s) exceeded`
                        : `${alerts.length} budget(s) nearing limit`}
                    </AppText>
                    <AppText variant="caption" tone="muted" numberOfLines={1}>
                      {alerts.map((a) => a.category?.name ?? 'Overall').join(', ')}
                    </AppText>
                  </View>
                  <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                </Card>
              ) : null}

              <SectionHeader title="Accounts" action="Manage" onAction={() => router.push('/accounts')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }} style={{ marginHorizontal: -spacing.lg, paddingLeft: spacing.lg }}>
                {d.accounts.map((a) => (
                  <Card key={a._id} onPress={() => router.push({ pathname: '/accounts/form', params: { id: a._id } })}
                    style={{ width: 160, gap: spacing.md }}>
                    <IconBadge name={a.icon} color={a.color} size={36} />
                    <View>
                      <AppText variant="caption" tone="muted" numberOfLines={1}>{a.name}</AppText>
                      <AppText variant="heading" numberOfLines={1} style={{ color: a.balance < 0 ? colors.expense : colors.text }}>
                        {formatMoney(a.balance, currency)}
                      </AppText>
                    </View>
                  </Card>
                ))}
                <Card onPress={() => router.push('/accounts/form')} style={{
                  width: 120, alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
                  borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: 'transparent',
                  shadowOpacity: 0, elevation: 0,
                }}>
                  <Icon name="add-circle" size={28} color={colors.primary} />
                  <AppText variant="label" tone="primary">Add account</AppText>
                </Card>
              </ScrollView>

              <Card style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <AppText variant="heading">Last 7 days</AppText>
                    <AppText variant="caption" tone="muted">
                      {formatMoney(d.daily.reduce((s, x) => s + x.expense, 0), currency)} spent
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText variant="caption" tone="muted">Daily avg this month</AppText>
                    <AppText variant="label">{formatMoney(d.summary.dailyAverage, currency)}</AppText>
                  </View>
                </View>
                <BarChart height={110} groups={d.daily.map((x, i) => ({
                  label: new Date(`${x.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' }),
                  highlight: i === d.daily.length - 1,
                  values: [{ value: x.expense, color: i === d.daily.length - 1 ? colors.primary : `${colors.primary}88` }],
                }))} />
              </Card>

              {overall ? (
                <Card onPress={() => router.push('/budgets')} style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="label">Monthly budget</AppText>
                    <AppText variant="label" tone={overall.status === 'over' ? 'expense' : 'muted'}>
                      {formatMoney(overall.spent, currency)} / {formatMoney(overall.amount, currency)}
                    </AppText>
                  </View>
                  <ProgressBar percent={overall.percent}
                    color={overall.status === 'over' ? colors.expense : overall.status === 'warning' ? colors.warning : colors.income} />
                  <AppText variant="caption" tone="muted">
                    {overall.remaining >= 0
                      ? `${formatMoney(overall.remaining, currency)} left to spend this month`
                      : `${formatMoney(-overall.remaining, currency)} over budget`}
                  </AppText>
                </Card>
              ) : null}

              {d.categories.length ? (
                <>
                  <SectionHeader title="Top spending" action="Insights" onAction={() => router.push('/stats')} />
                  <Card style={{ gap: spacing.lg }}>
                    {d.categories.map((c) => (
                      <View key={c.categoryId ?? c.name} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <IconBadge name={c.icon} color={c.color} size={38} />
                        <View style={{ flex: 1, gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <AppText variant="label">{c.name}</AppText>
                            <AppText variant="label">{formatMoney(c.total, currency)}</AppText>
                          </View>
                          <ProgressBar percent={c.percent} color={c.color} height={6} />
                        </View>
                      </View>
                    ))}
                  </Card>
                </>
              ) : null}

              <SectionHeader title="Recent activity" action="See all" onAction={() => router.push('/transactions')} />
              <Card padded={false} style={{ overflow: 'hidden' }}>
                {d.recent.length ? d.recent.map((t) => <TransactionRow key={t._id} tx={t} showDate />) : (
                  <EmptyState icon="receipt-outline" title="No transactions yet"
                    message="Tap + to record your first expense or income." actionLabel="Add transaction"
                    onAction={() => router.push('/transaction/new')} />
                )}
              </Card>
            </>
          );
        }}
      </AsyncContent>
    </Screen>
  );
}

// Spacer that respects the status bar since we pass a custom header to Screen.
function SafeTop() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.top + spacing.sm }} />;
}

function HeroCard({ summary, currency }: { summary: Summary; currency: string }) {
  const { colors } = useTheme();
  const change = summary.change.expense;
  return (
    <LinearGradient colors={[colors.heroFrom, colors.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <View style={{ position: 'absolute', right: 40, bottom: -60, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      <View style={{ gap: 4 }}>
        <AppText variant="label" tone="inverse" style={{ opacity: 0.8 }}>Total balance</AppText>
        <AppText variant="display" tone="inverse" adjustsFontSizeToFit numberOfLines={1}>
          {formatMoney(summary.totalBalance, currency)}
        </AppText>
        {change !== null && summary.previous.expense > 0 ? (
          <AppText variant="caption" tone="inverse" style={{ opacity: 0.85 }}>
            Spending {change <= 0 ? 'down' : 'up'} {Math.abs(change).toFixed(0)}% vs last month
          </AppText>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {([['income', 'arrow-down', summary.income], ['expense', 'arrow-up', summary.expense]] as const).map(([k, icon, v]) => (
          <View key={k} style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
            backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.md, padding: spacing.md,
          }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" tone="inverse" style={{ opacity: 0.8 }}>{k === 'income' ? 'Income' : 'Expenses'}</AppText>
              <AppText variant="label" tone="inverse" numberOfLines={1} adjustsFontSizeToFit>{formatMoney(v, currency)}</AppText>
            </View>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}
