import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api, ApiError } from '@/api/client';
import type { Goal } from '@/api/types';
import { ColorPicker, DateField, IconPicker } from '@/components/pickers';
import { AppText, Button, IconBadge, LoadingView, Screen, TextField } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { emitDataChanged } from '@/utils/events';
import { confirm, haptic } from '@/utils/feedback';
import { goBack } from '@/utils/navigation';

export default function GoalForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loaded, setLoaded] = useState(!id);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [icon, setIcon] = useState('flag');
  const [color, setColor] = useState('#10B981');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    api.get<Goal>(`/goals/${id}`).then((g) => {
      setName(g.name); setTarget(String(g.targetAmount)); setDeadline(g.deadline ? new Date(g.deadline) : null);
      setIcon(g.icon); setColor(g.color); setLoaded(true);
    });
  }, [id]);

  const save = async () => {
    setErrors({});
    if (!name.trim()) return setErrors({ name: 'Give your goal a name' });
    if (!Number(target)) return setErrors({ targetAmount: 'Enter a target amount' });
    setSaving(true);
    const body = { name: name.trim(), targetAmount: Number(target), deadline: deadline?.toISOString() ?? null, icon, color };
    try {
      if (id) await api.patch(`/goals/${id}`, body);
      else await api.post('/goals', body);
      haptic('success');
      emitDataChanged();
      goBack();
    } catch (e) {
      setSaving(false);
      if (e instanceof ApiError) setErrors({ ...(e.fields ?? {}), _: e.message });
    }
  };

  const remove = async () => {
    if (!id || !(await confirm('Delete goal?', 'Its contribution history will be lost.'))) return;
    await api.del(`/goals/${id}`);
    emitDataChanged();
    router.dismissTo('/goals');
  };

  if (!loaded) return <Screen modal title="Goal"><LoadingView /></Screen>;

  return (
    <Screen modal title={id ? 'Edit goal' : 'New goal'}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {id ? <Button title="Delete" variant="danger" icon="trash-outline" onPress={remove} style={{ flex: 1 }} /> : null}
          <Button title="Save goal" icon="checkmark" onPress={save} loading={saving} style={{ flex: 2 }} />
        </View>
      }>
      <View style={{ alignItems: 'center' }}><IconBadge name={icon} color={color} size={72} solid /></View>
      <TextField label="Goal name" value={name} onChangeText={setName} placeholder="e.g. Japan trip" error={errors.name} />
      <TextField label="Target amount" value={target} onChangeText={(v) => setTarget(v.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad" placeholder="5000" error={errors.targetAmount} icon="cash-outline" />
      <DateField label="Target date (optional)" value={deadline} onChange={setDeadline} allowClear placeholder="No deadline" />
      <View style={{ gap: spacing.sm }}><AppText variant="label" tone="muted">Color</AppText><ColorPicker value={color} onChange={setColor} /></View>
      <View style={{ gap: spacing.sm }}><AppText variant="label" tone="muted">Icon</AppText><IconPicker value={icon} color={color} onChange={setIcon} /></View>
      {errors._ ? <AppText tone="expense" variant="label">{errors._}</AppText> : null}
    </Screen>
  );
}
