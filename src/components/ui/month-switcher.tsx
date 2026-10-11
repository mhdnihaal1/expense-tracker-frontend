import { View } from 'react-native';

import { useTheme } from '@/context/theme';
import { radius, spacing } from '@/theme/tokens';
import { monthLabel, shiftMonthKey, toMonthKey } from '@/utils/format';
import { IconButton } from './button';
import { AppText } from './text';

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const { colors } = useTheme();
  const isCurrent = month >= toMonthKey(new Date());
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.border,
    }}>
      <IconButton icon="chevron-back" size={36} background={colors.surfaceAlt} onPress={() => onChange(shiftMonthKey(month, -1))} label="Previous month" />
      <AppText variant="heading" style={{ paddingHorizontal: spacing.md }}>{monthLabel(month)}</AppText>
      <View style={{ opacity: isCurrent ? 0.35 : 1 }}>
        <IconButton icon="chevron-forward" size={36} background={colors.surfaceAlt}
          onPress={isCurrent ? undefined : () => onChange(shiftMonthKey(month, 1))} label="Next month" />
      </View>
    </View>
  );
}
