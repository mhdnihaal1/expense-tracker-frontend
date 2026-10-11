import { Pressable } from 'react-native';

import { useTheme } from '@/context/theme';
import { radius, spacing } from '@/theme/tokens';
import { Icon } from './icon';
import { AppText } from './text';

export function Chip({
  label, selected, onPress, icon, color,
}: { label: string; selected?: boolean; onPress?: () => void; icon?: string; color?: string }) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
        backgroundColor: selected ? accent : colors.surfaceAlt,
        borderWidth: 1, borderColor: selected ? accent : colors.border,
        opacity: pressed ? 0.8 : 1,
      })}>
      {icon ? <Icon name={icon} size={15} color={selected ? '#FFFFFF' : accent} /> : null}
      <AppText variant="label" style={{ color: selected ? '#FFFFFF' : colors.text }}>{label}</AppText>
    </Pressable>
  );
}
