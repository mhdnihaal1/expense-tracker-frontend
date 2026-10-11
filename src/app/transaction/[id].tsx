import { useLocalSearchParams } from 'expo-router';

import { api } from '@/api/client';
import type { Transaction } from '@/api/types';
import { TransactionForm } from '@/components/forms/transaction-form';
import { AsyncContent, Screen } from '@/components/ui';
import { useApi } from '@/hooks/use-api';

export default function EditTransaction() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useApi(() => api.get<Transaction>(`/transactions/${id}`), [id]);
  if (!data) {
    return (
      <Screen modal title="Transaction">
        <AsyncContent data={data} loading={loading} error={error} onRetry={reload}>{() => null}</AsyncContent>
      </Screen>
    );
  }
  return <TransactionForm key={data._id} existing={data} />;
}
