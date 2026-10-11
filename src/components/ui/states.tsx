import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/context/theme';
import { spacing } from '@/theme/tokens';
import { Button } from './button';
import { Icon } from './icon';
import { AppText } from './text';

export function EmptyState({
  icon, title, message, actionLabel, onAction,
}: { icon: string; title: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl, gap: spacing.sm }}>
      <View style={{
        width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft,
        alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
      }}>
        <Icon name={icon} size={32} color={colors.primary} />
      </View>
      <AppText variant="heading" style={{ textAlign: 'center' }}>{title}</AppText>
      {message ? <AppText tone="muted" style={{ textAlign: 'center' }}>{message}</AppText> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} size="md" style={{ marginTop: spacing.md }} />
      ) : null}
    </View>
  );
}

export function LoadingView() {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: spacing.xxl * 2, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState icon="cloud-offline" title="Couldn't load data" message={message}
      actionLabel={onRetry ? 'Try again' : undefined} onAction={onRetry} />
  );
}

/** Loading → error → content switch. */
export function AsyncContent<T>({
  data, loading, error, onRetry, children,
}: { data: T | undefined; loading: boolean; error: string | null; onRetry?: () => void; children: (data: T) => React.ReactNode }) {
  if (data === undefined) {
    if (loading) return <LoadingView />;
    if (error) return <ErrorView message={error} onRetry={onRetry} />;
    return null;
  }
  return <>{children(data)}</>;
}
