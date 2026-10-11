import { Pressable, View } from 'react-native';

import { useTheme } from '@/context/theme';
import { radius } from '@/theme/tokens';
import { AppText } from './text';

export function Segmented<T extends string>({
  options, value, onChange, colorFor,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; colorFor?: (v: T) => string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        const accent = colorFor?.(o.value) ?? colors.primary;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: radius.sm + 2, alignItems: 'center',
              backgroundColor: active ? colors.surface : 'transparent',
              shadowColor: '#000', shadowOpacity: active ? 0.08 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
              elevation: active ? 1 : 0,
            }}>
            <AppText variant="label" style={{ color: active ? accent : colors.textMuted }}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
