import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/context/theme';
import { iconChoices, radius, spacing, swatches } from '@/theme/tokens';
import { isSameDay, shortDate } from '@/utils/format';
import { BottomSheet } from './bottom-sheet';
import { AppText, Chip, Icon, IconButton } from './ui';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Calendar({ value, onChange, maxDate }: { value: Date; onChange: (d: Date) => void; maxDate?: Date }) {
  const { colors } = useTheme();
  const [view, setView] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const firstDay = view.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const today = new Date();

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="chevron-back" size={34} background={colors.surfaceAlt}
          onPress={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} label="Previous month" />
        <AppText variant="heading">{view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</AppText>
        <IconButton icon="chevron-forward" size={34} background={colors.surfaceAlt}
          onPress={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} label="Next month" />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((d, i) => (
          <AppText key={i} variant="caption" tone="faint" style={{ flex: 1, textAlign: 'center' }}>{d}</AppText>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (!day) return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const date = new Date(view.getFullYear(), view.getMonth(), day, value.getHours(), value.getMinutes());
          const selected = isSameDay(date, value);
          const isToday = isSameDay(date, today);
          const disabled = !!maxDate && date > maxDate && !isSameDay(date, maxDate);
          return (
            <Pressable key={i} disabled={disabled} onPress={() => onChange(date)}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
              <View style={{
                flex: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
                backgroundColor: selected ? colors.primary : 'transparent',
                borderWidth: isToday && !selected ? 1.5 : 0, borderColor: colors.primary,
              }}>
                <AppText variant="label" style={{
                  color: selected ? colors.onPrimary : disabled ? colors.textFaint : colors.text,
                }}>{day}</AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DateField({
  label, value, onChange, maxDate, allowClear, placeholder = 'Select date',
}: {
  label?: string; value: Date | null; onChange: (d: Date | null) => void; maxDate?: Date;
  allowClear?: boolean; placeholder?: string;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    <View style={{ gap: 6 }}>
      {label ? <AppText variant="label" tone="muted">{label}</AppText> : null}
      <Pressable onPress={() => setOpen(true)} style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48,
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: spacing.md,
      }}>
        <Icon name="calendar-outline" size={18} color={colors.textMuted} />
        <AppText style={{ flex: 1, color: value ? colors.text : colors.textFaint }}>
          {value ? shortDate(value) : placeholder}
        </AppText>
        {allowClear && value ? (
          <IconButton icon="close-circle" size={28} background="transparent" color={colors.textFaint}
            onPress={() => onChange(null)} label="Clear date" />
        ) : null}
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label ?? 'Pick a date'}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <Chip label="Today" onPress={() => { onChange(new Date()); setOpen(false); }} />
          <Chip label="Yesterday" onPress={() => { onChange(yesterday); setOpen(false); }} />
        </View>
        <Calendar value={value ?? new Date()} maxDate={maxDate} onChange={(d) => { onChange(d); setOpen(false); }} />
      </BottomSheet>
    </View>
  );
}

export function IconPicker({ value, color, onChange }: { value: string; color: string; onChange: (icon: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {iconChoices.map((name) => {
        const selected = name === value;
        return (
          <Pressable key={name} onPress={() => onChange(name)} accessibilityLabel={name}
            style={{
              width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
              backgroundColor: selected ? color : colors.surfaceAlt,
            }}>
            <Icon name={name} size={20} color={selected ? '#FFFFFF' : colors.textMuted} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {swatches.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase();
        return (
          <Pressable key={c} onPress={() => onChange(c)} accessibilityLabel={`Color ${c}`}
            style={{
              width: 36, height: 36, borderRadius: 18, backgroundColor: c,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: selected ? 3 : 0, borderColor: '#FFFFFF80',
            }}>
            {selected ? <Icon name="checkmark" size={18} color="#FFFFFF" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Field that opens a sheet with a list of options. */
export function SelectField<T extends string>({
  label, value, options, onChange, icon,
}: {
  label: string; value: T | null; icon?: string;
  options: { value: T; label: string; description?: string; icon?: string; color?: string }[];
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="label" tone="muted">{label}</AppText>
      <Pressable onPress={() => setOpen(true)} style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48,
        backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: spacing.md,
      }}>
        {current?.icon || icon ? (
          <Icon name={current?.icon ?? icon!} size={18} color={current?.color ?? colors.textMuted} />
        ) : null}
        <AppText style={{ flex: 1, color: current ? colors.text : colors.textFaint }}>
          {current?.label ?? 'Select…'}
        </AppText>
        <Icon name="chevron-down" size={18} color={colors.textFaint} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={{ gap: spacing.xs }}>
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <Pressable key={o.value} onPress={() => { onChange(o.value); setOpen(false); }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
                  borderRadius: radius.md, backgroundColor: selected ? colors.primarySoft : pressed ? colors.surfaceAlt : 'transparent',
                })}>
                {o.icon ? <Icon name={o.icon} size={20} color={o.color ?? colors.textMuted} /> : null}
                <View style={{ flex: 1 }}>
                  <AppText>{o.label}</AppText>
                  {o.description ? <AppText variant="caption" tone="muted">{o.description}</AppText> : null}
                </View>
                {selected ? <Icon name="checkmark-circle" size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

