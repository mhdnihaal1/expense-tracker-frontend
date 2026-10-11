import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { Transaction } from '@/api/types';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { spacing } from '@/theme/tokens';
import { formatMoney, timeLabel } from '@/utils/format';
import { AppText, Icon, IconBadge } from './ui';

export function TransactionRow({ tx, showDate }: { tx: Transaction; showDate?: boolean }) {
  const { colors } = useTheme();
  const currency = useCurrency();
  const isTransfer = tx.type === 'transfer';
  const title = isTransfer ? 'Transfer' : tx.categoryId?.name ?? 'Uncategorized';
  const icon = isTransfer ? 'swap-horizontal' : tx.categoryId?.icon ?? 'help';
  const color = isTransfer ? colors.transfer : tx.categoryId?.color ?? colors.textMuted;
  const subtitleParts = [
    isTransfer ? `${tx.accountId?.name} → ${tx.toAccountId?.name}` : tx.note || tx.accountId?.name,
    showDate ? new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : timeLabel(tx.date),
  ].filter(Boolean);
  const amountColor = tx.type === 'income' ? colors.income : tx.type === 'expense' ? colors.text : colors.transfer;
  const signed = tx.type === 'income' ? tx.amount : tx.type === 'expense' ? -tx.amount : tx.amount;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: tx._id } })}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg, backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
      })}>
      <IconBadge name={icon} color={color} size={42} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText variant="body" numberOfLines={1} style={{ flexShrink: 1, fontWeight: '600' }}>{title}</AppText>
          {tx.recurringId ? <Icon name="repeat" size={13} color={colors.textFaint} /> : null}
        </View>
        <AppText variant="caption" tone="muted" numberOfLines={1}>{subtitleParts.join(' · ')}</AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <AppText variant="body" style={{ color: amountColor, fontWeight: '700' }}>
          {isTransfer ? formatMoney(signed, currency) : formatMoney(signed, currency, { sign: true })}
        </AppText>
        {tx.tags.length ? (
          <AppText variant="caption" tone="faint" numberOfLines={1}>#{tx.tags.join(' #')}</AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
