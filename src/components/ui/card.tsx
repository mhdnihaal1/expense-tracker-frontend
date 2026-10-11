import { Pressable, View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/context/theme';
import { radius, spacing } from '@/theme/tokens';

export function Card({ style, onPress, padded = true, ...rest }: ViewProps & { onPress?: () => void; padded?: boolean }) {
  const { colors, scheme } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: padded ? spacing.lg : 0,
    borderWidth: scheme === 'dark' ? 1 : 0,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: scheme === 'dark' ? 0 : 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: scheme === 'dark' ? 0 : 2,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style as ViewStyle]}>
        {rest.children}
      </Pressable>
    );
  }
  return <View style={[base, style]} {...rest} />;
}
