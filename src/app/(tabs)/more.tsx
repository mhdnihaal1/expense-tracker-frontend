import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { AppText, Card, IconBadge, ListRow, Screen } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { spacing } from '@/theme/tokens';
import { confirm } from '@/utils/feedback';

const sections: { title: string; items: { icon: string; color: string; title: string; subtitle: string; href: Href }[] }[] = [
  {
    title: 'Money',
    items: [
      { icon: 'wallet', color: '#4F46E5', title: 'Accounts', subtitle: 'Cash, bank, cards & savings', href: '/accounts' },
      { icon: 'pie-chart', color: '#F97316', title: 'Budgets', subtitle: 'Monthly limits & alerts', href: '/budgets' },
      { icon: 'flag', color: '#10B981', title: 'Savings goals', subtitle: 'Track progress toward targets', href: '/goals' },
      { icon: 'repeat', color: '#A855F7', title: 'Recurring', subtitle: 'Bills, salary & subscriptions', href: '/recurring' },
    ],
  },
  {
    title: 'Organize',
    items: [
      { icon: 'pricetags', color: '#EC4899', title: 'Categories', subtitle: 'Custom icons & colors', href: '/categories' },
      { icon: 'settings', color: '#64748B', title: 'Settings', subtitle: 'Currency, theme, export, security', href: '/settings' },
    ],
  },
];

export default function More() {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const initials = (user?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Screen title="More">
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }} onPress={() => router.push('/settings')}>
        <View style={{
          width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
        }}>
          <AppText variant="title" style={{ color: colors.onPrimary }}>{initials}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{user?.name}</AppText>
          <AppText variant="caption" tone="muted">{user?.email}</AppText>
          <AppText variant="caption" tone="primary" style={{ marginTop: 2 }}>Currency: {user?.currency}</AppText>
        </View>
      </Card>

      {sections.map((s) => (
        <View key={s.title} style={{ gap: spacing.sm }}>
          <AppText variant="label" tone="muted" style={{ marginLeft: 4 }}>{s.title.toUpperCase()}</AppText>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {s.items.map((it, i) => (
              <ListRow key={it.title} icon={it.icon} iconColor={it.color} title={it.title} subtitle={it.subtitle}
                onPress={() => router.push(it.href)} divider={i < s.items.length - 1} />
            ))}
          </Card>
        </View>
      ))}

      <Card padded={false} style={{ overflow: 'hidden' }}>
        <ListRow icon="log-out" iconColor={colors.expense} title="Sign out" divider={false} chevron={false}
          onPress={async () => { if (await confirm('Sign out?', 'You can sign back in anytime.', 'Sign out')) signOut(); }} />
      </Card>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <IconBadge name="wallet" color={colors.primary} size={32} />
        <AppText variant="caption" tone="faint">Spendwise v1.0</AppText>
      </View>
    </Screen>
  );
}
