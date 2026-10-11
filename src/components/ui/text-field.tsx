import { forwardRef, useState } from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/context/theme';
import { radius, spacing } from '@/theme/tokens';
import { Icon } from './icon';
import { AppText } from './text';

export const TextField = forwardRef<TextInput, TextInputProps & { label?: string; error?: string; icon?: string }>(
  function TextField({ label, error, icon, style, onFocus, onBlur, ...rest }, ref) {
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);
    return (
      <View style={{ gap: 6 }}>
        {label ? <AppText variant="label" tone="muted">{label}</AppText> : null}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: spacing.md,
          borderWidth: 1.5, borderColor: error ? colors.expense : focused ? colors.primary : 'transparent',
        }}>
          {icon ? <Icon name={icon} size={18} color={colors.textMuted} /> : null}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textFaint}
            style={[{ flex: 1, minHeight: 48, color: colors.text, fontSize: 16, paddingVertical: 12 }, Platform.OS === 'web' && { outlineWidth: 0 }, style]}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            {...rest}
          />
        </View>
        {error ? <AppText variant="caption" tone="expense">{error}</AppText> : null}
      </View>
    );
  }
);
