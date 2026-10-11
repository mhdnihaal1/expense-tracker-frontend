import { View } from 'react-native';

import { useTheme } from '@/context/theme';

export function ProgressBar({ percent, color, height = 8 }: { percent: number; color: string; height?: number }) {
  const { colors } = useTheme();
  const width = Math.max(0, Math.min(100, percent));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${width}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}
