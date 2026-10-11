
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/theme';
import { spacing } from '@/theme/tokens';
import { IconButton } from './button';
import { AppText } from './text';
import { goBack } from '@/utils/navigation';

export const MAX_WIDTH = 720;

/**
 * Standard page: safe-area aware header + scrollable body with pull-to-refresh.
 * `modal` renders a sheet-style header with a close button instead of a back arrow.
 */
export function Screen({
  title, subtitle, children, right, back, modal, refreshing, onRefresh, scroll = true, contentStyle, footer, header,
}: {
  title?: string; subtitle?: string; children: ReactNode; right?: ReactNode; back?: boolean; modal?: boolean;
  refreshing?: boolean; onRefresh?: () => void; scroll?: boolean; contentStyle?: ViewStyle; footer?: ReactNode;
  header?: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = modal && Platform.OS === 'ios' ? spacing.lg : insets.top + spacing.sm;

  const headerView = header ?? (title || back || modal || right ? (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      paddingHorizontal: spacing.lg, paddingTop: topPad, paddingBottom: spacing.md,
    }}>
      {back ? <IconButton icon="chevron-back" onPress={() => goBack()} label="Back" /> : null}
      <View style={{ flex: 1 }}>
        {title ? <AppText variant={modal ? 'heading' : 'title'} numberOfLines={1}>{title}</AppText> : null}
        {subtitle ? <AppText variant="caption" tone="muted">{subtitle}</AppText> : null}
      </View>
      {right}
      {modal ? <IconButton icon="close" onPress={() => goBack()} label="Close" background={colors.surfaceAlt} size={36} /> : null}
    </View>
  ) : <View style={{ height: topPad }} />);

  const inner: ViewStyle = {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl + (footer ? 0 : insets.bottom + 80),
    gap: spacing.lg, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center',
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: modal ? colors.surface : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' }}>{headerView}</View>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[inner, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          ) : undefined}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner, { paddingBottom: 0 }, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View style={{
          paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md,
          borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: modal ? colors.surface : colors.background,
        }}>
          <View style={{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' }}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -spacing.xs }}>
      <AppText variant="heading">{title}</AppText>
      {action ? (
        <AppText variant="label" tone="primary" onPress={onAction} suppressHighlighting>{action}</AppText>
      ) : null}
    </View>
  );
}
