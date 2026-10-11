import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { api } from '@/api/client';
import type { Category } from '@/api/types';
import { AppText, AsyncContent, Card, IconButton, ListRow, Screen, Segmented } from '@/components/ui';
import { useTheme } from '@/context/theme';
import { useApi } from '@/hooks/use-api';

export default function Categories() {
  const { colors } = useTheme();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const { data, loading, error, refreshing, refresh } = useApi(() => api.get<{ items: Category[] }>('/categories'));

  return (
    <Screen title="Categories" back refreshing={refreshing} onRefresh={refresh}
      right={<IconButton icon="add" background={colors.primary} color={colors.onPrimary} label="Add category"
        onPress={() => router.push({ pathname: '/categories/form', params: { type } })} />}>
      <Segmented value={type} onChange={setType} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />
      <AsyncContent data={data} loading={loading} error={error} onRetry={refresh}>
        {(d) => {
          const list = d.items.filter((c) => c.type === type);
          return (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {list.map((c, i) => (
                <ListRow key={c._id} icon={c.icon} iconColor={c.color} title={c.name}
                  subtitle={c.isDefault ? 'Default' : 'Custom'} divider={i < list.length - 1}
                  onPress={() => router.push({ pathname: '/categories/form', params: { id: c._id } })} />
              ))}
            </Card>
          );
        }}
      </AsyncContent>
      <View><AppText variant="caption" tone="faint">Deleting a category moves its transactions to “Other”.</AppText></View>
    </Screen>
  );
}
