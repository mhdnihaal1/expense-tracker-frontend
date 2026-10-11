import { router } from 'expo-router';
import { View } from 'react-native';

import { api } from '@/api/client';
import type { Goal } from '@/api/types';
import { ProgressRing } from '@/components/charts/progress-ring';
import { AppText, AsyncContent, Card, EmptyState, Icon, IconButton, Screen } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useApi } from '@/hooks/use-api';
import { spacing } from '@/theme/tokens';
import { formatMoney, shortDate } from '@/utils/format';

export default function Goals() {
  const { colors } = useTheme();
  const currency = useCurrency();
  const { data, loading, error, refreshing, refresh } = useApi(() => api.get<{ items: Goal[] }>('/goals'));

  return (
    <Screen title="Savings goals" back refreshing={refreshing} onRefresh={refresh}
      right={<IconButton icon="add" background={colors.primary} color={colors.onPrimary} onPress={() => router.push('/goals/form')} label="Add goal" />}>
      <AsyncContent data={data} loading={loading} error={error} onRetry={refresh}>
        {({ items }) => {
          if (!items.length) {
            return <EmptyState icon="flag-outline" title="Dream it, save for it" message="Create a goal — a trip, an emergency fund, a new phone — and track every contribution."
              actionLabel="Create goal" onAction={() => router.push('/goals/form')} />;
          }
          const saved = items.reduce((s, g) => s + g.savedAmount, 0);
          const target = items.reduce((s, g) => s + g.targetAmount, 0);
          return (
            <>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText variant="label" tone="muted">Total saved</AppText>
                  <AppText variant="title">{formatMoney(saved, currency)}</AppText>
                  <AppText variant="caption" tone="muted">across {items.length} goal{items.length === 1 ? '' : 's'} · target {formatMoney(target, currency)}</AppText>
                </View>
                <ProgressRing percent={(saved / target) * 100} color={colors.income} size={72}>
                  <AppText variant="label">{Math.round((saved / target) * 100)}%</AppText>
                </ProgressRing>
              </Card>
              {items.map((g) => {
                const pct = Math.min(100, (g.savedAmount / g.targetAmount) * 100);
                const done = g.savedAmount >= g.targetAmount;
                return (
                  <Card key={g._id} onPress={() => router.push({ pathname: '/goals/[id]', params: { id: g._id } })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                    <ProgressRing percent={pct} color={g.color} size={64}>
                      <Icon name={done ? 'checkmark' : g.icon} size={24} color={g.color} />
                    </ProgressRing>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="heading" numberOfLines={1}>{g.name}</AppText>
                      <AppText variant="label">
                        {formatMoney(g.savedAmount, currency)} <AppText variant="caption" tone="muted">of {formatMoney(g.targetAmount, currency)}</AppText>
                      </AppText>
                      <AppText variant="caption" tone={done ? 'income' : 'faint'}>
                        {done ? 'Goal reached 🎉' : g.deadline ? `Target date ${shortDate(g.deadline)}` : `${Math.round(pct)}% complete`}
                      </AppText>
                    </View>
                    <Icon name="chevron-forward" size={18} color={colors.textFaint} />
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
