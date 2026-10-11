import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { useTheme } from '@/context/theme';
import { AppText } from '../ui';

export interface BarGroup {
  label: string;
  values: { value: number; color: string }[];
  highlight?: boolean;
}

/** Grouped vertical bar chart with rounded bars, gridlines and bottom labels. */
export function BarChart({
  groups, height = 160, formatValue,
}: { groups: BarGroup[]; height?: number; formatValue?: (n: number) => string }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const max = Math.max(1, ...groups.flatMap((g) => g.values.map((v) => v.value)));
  const perGroup = groups[0]?.values.length ?? 1;
  const slot = width / Math.max(groups.length, 1);
  const barGap = 4;
  const barWidth = Math.min(22, Math.max(4, (slot * 0.62 - barGap * (perGroup - 1)) / perGroup));
  const groupWidth = barWidth * perGroup + barGap * (perGroup - 1);
  const chartH = height;

  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {formatValue ? (
        <AppText variant="caption" tone="faint" style={{ marginBottom: 4 }}>{formatValue(max)}</AppText>
      ) : null}
      {width > 0 ? (
        <Svg width={width} height={chartH}>
          {[0.25, 0.5, 0.75].map((f) => (
            <Line key={f} x1={0} x2={width} y1={chartH * (1 - f)} y2={chartH * (1 - f)}
              stroke={colors.border} strokeDasharray="4 6" strokeWidth={1} />
          ))}
          <Line x1={0} x2={width} y1={chartH - 0.5} y2={chartH - 0.5} stroke={colors.border} strokeWidth={1} />
          {groups.map((g, gi) => {
            const x0 = gi * slot + (slot - groupWidth) / 2;
            return g.values.map((v, vi) => {
              const h = v.value > 0 ? Math.max(3, (v.value / max) * (chartH - 6)) : 0;
              return (
                <Rect key={`${gi}-${vi}`} x={x0 + vi * (barWidth + barGap)} y={chartH - h} width={barWidth} height={h}
                  rx={Math.min(6, barWidth / 2)} fill={v.color} opacity={g.highlight === false ? 0.45 : 1} />
              );
            });
          })}
        </Svg>
      ) : <View style={{ height: chartH }} />}
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {groups.map((g, i) => (
          <AppText key={i} variant="caption" tone={g.highlight ? 'default' : 'faint'}
            style={{ flex: 1, textAlign: 'center', fontWeight: g.highlight ? '700' : '500' }} numberOfLines={1}>
            {g.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}
