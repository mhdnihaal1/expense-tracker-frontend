import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/context/theme';

export function ProgressRing({
  percent, color, size = 64, thickness = 7, children,
}: { percent: number; color: string; size?: number; thickness?: number; children?: ReactNode }) {
  const { colors } = useTheme();
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={thickness} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={thickness} fill="none"
          strokeDasharray={`${(p / 100) * c} ${c}`} strokeLinecap="round" />
      </Svg>
      {children}
    </View>
  );
}
