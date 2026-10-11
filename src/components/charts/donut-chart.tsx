import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/context/theme';

export function DonutChart({
  data, size = 200, thickness = 26, children,
}: { data: { value: number; color: string }[]; size?: number; thickness?: number; children?: ReactNode }) {
  const { colors } = useTheme();
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  const gap = data.length > 1 ? 3 : 0;

  let offset = 0;
  const arcs = total > 0 ? data.filter((d) => d.value > 0).map((d, i) => {
    const length = (d.value / total) * circumference;
    const arc = (
      <Circle
        key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
        strokeDasharray={`${Math.max(length - gap, 0.1)} ${circumference}`} strokeDashoffset={-offset}
        strokeLinecap="butt"
      />
    );
    offset += length;
    return arc;
  }) : null;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Rotate the whole canvas so arcs start at 12 o'clock (G rotation/origin is broken on web). */}
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.surfaceAlt} strokeWidth={thickness} />
        {arcs}
      </Svg>
      {children}
    </View>
  );
}
