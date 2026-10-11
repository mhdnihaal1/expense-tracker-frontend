import { router } from 'expo-router';
import { View } from 'react-native';

import { api } from '@/api/client';
import type { Account } from '@/api/types';
import { AppText, AsyncContent, Card, EmptyState, IconBadge, IconButton, Screen } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useApi } from '@/hooks/use-api';
import { spacing } from '@/theme/tokens';
import { formatMoney } from '@/utils/format';

const TYPE_LABEL: Record<Account['type'], string> = {
  cash: 'Cash', bank: 'Bank account', card: 'Credit card', wallet: 'E-wallet', savings: 'Savings',
};

export default function Accounts() {
  const { colors } = useTheme();
  const currency = useCurrency();
  const { data, loading, error, refreshing, refresh } = useApi(
    () => api.get<{ items: Account[]; totalBalance: number }>('/accounts', { includeArchived: true })
  );

  return (
    <Screen title="Accounts" back refreshing={refreshing} onRefresh={refresh}
      right={<IconButton icon="add" background={colors.primary} color={colors.onPrimary} onPress={() => router.push('/accounts/form')} label="Add account" />}>
      <AsyncContent data={data} loading={loading} error={error} onRetry={refresh}>
        {(d) => {
          const active = d.items.filter((a) => !a.archived);
          const archived = d.items.filter((a) => a.archived);
          const assets = active.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0);
          const debts = active.filter((a) => a.balance < 0).reduce((s, a) => s + a.balance, 0);
          return (
            <>
              <Card style={{ gap: spacing.md }}>
                <AppText variant="label" tone="muted">Net worth</AppText>
                <AppText variant="display" style={{ color: d.totalBalance < 0 ? colors.expense : colors.text }}>
                  {formatMoney(d.totalBalance, currency)}
                </AppText>
                <View style={{ flexDirection: 'row', gap: spacing.xl }}>
                  <View><AppText variant="caption" tone="muted">Assets</AppText><AppText variant="label" tone="income">{formatMoney(assets, currency)}</AppText></View>
                  <View><AppText variant="caption" tone="muted">Liabilities</AppText><AppText variant="label" tone="expense">{formatMoney(debts, currency)}</AppText></View>
                </View>
              </Card>
              {active.length ? active.map((a) => <AccountCard key={a._id} account={a} currency={currency} />) : (
                <EmptyState icon="wallet-outline" title="No accounts" message="Add a bank account, card or wallet."
                  actionLabel="Add account" onAction={() => router.push('/accounts/form')} />
              )}
              {archived.length ? (
                <>
                  <AppText variant="label" tone="muted">ARCHIVED</AppText>
                  {archived.map((a) => <AccountCard key={a._id} account={a} currency={currency} />)}
                </>
              ) : null}
            </>
          );
        }}
      </AsyncContent>
    </Screen>
  );
}

function AccountCard({ account: a, currency }: { account: Account; currency: string }) {
  const { colors } = useTheme();
  return (
    <Card onPress={() => router.push({ pathname: '/accounts/form', params: { id: a._id } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, opacity: a.archived ? 0.6 : 1 }}>
      <IconBadge name={a.icon} color={a.color} size={48} />
      <View style={{ flex: 1 }}>
        <AppText variant="heading" numberOfLines={1}>{a.name}</AppText>
        <AppText variant="caption" tone="muted">{TYPE_LABEL[a.type]}</AppText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AppText variant="heading" style={{ color: a.balance < 0 ? colors.expense : colors.text }}>{formatMoney(a.balance, currency)}</AppText>
        <AppText variant="caption" tone="faint">{a.archived ? 'Archived' : 'Balance'}</AppText>
      </View>
    </Card>
  );
}
