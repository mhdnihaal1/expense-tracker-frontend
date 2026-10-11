import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/context/theme';
import { radius, spacing } from '@/theme/tokens';
import { Icon } from './icon';
import { AppText } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title, onPress, variant = 'primary', loading, disabled, icon, style, size = 'lg',
}: {
  title: string; onPress?: () => void; variant?: Variant; loading?: boolean; disabled?: boolean;
  icon?: string; style?: ViewStyle; size?: 'md' | 'lg';
}) {
  const { colors } = useTheme();
  const bg = { primary: colors.primary, secondary: colors.primarySoft, ghost: 'transparent', danger: colors.expenseSoft }[variant];
  const fg = { primary: colors.onPrimary, secondary: colors.primary, ghost: colors.primary, danger: colors.expense }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [{
        backgroundColor: bg,
        height: size === 'lg' ? 52 : 40,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center', justifyContent: 'center',
        opacity: inactive ? 0.55 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <AppText variant={size === 'lg' ? 'heading' : 'label'} style={{ color: fg }}>{title}</AppText>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon, onPress, color, background, size = 40, label,
}: { icon: string; onPress?: () => void; color?: string; background?: string; size?: number; label?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: background ?? colors.surface,
        alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1,
      })}>
      <Icon name={icon} size={size * 0.5} color={color ?? colors.text} />
    </Pressable>
  );
}
