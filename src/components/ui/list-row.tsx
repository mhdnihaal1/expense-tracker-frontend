import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/context/theme';
import { spacing } from '@/theme/tokens';
import { Icon, IconBadge } from './icon';
import { AppText } from './text';

export function ListRow({
  icon, iconColor, title, subtitle, right, onPress, chevron = !!onPress, divider = true,
}: {
  icon?: string; iconColor?: string; title: string; subtitle?: string; right?: ReactNode;
  onPress?: () => void; chevron?: boolean; divider?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg, backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
        borderBottomWidth: divider ? 1 : 0, borderBottomColor: colors.border,
      })}>
      {icon ? <IconBadge name={icon} color={iconColor ?? colors.primary} size={36} /> : null}
      <View style={{ flex: 1 }}>
        <AppText variant="body" numberOfLines={1}>{title}</AppText>
        {subtitle ? <AppText variant="caption" tone="muted" numberOfLines={1}>{subtitle}</AppText> : null}
      </View>
      {right}
      {chevron ? <Icon name="chevron-forward" size={18} color={colors.textFaint} /> : null}
    </Pressable>
  );
}
