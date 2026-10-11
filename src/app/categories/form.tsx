import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api, ApiError } from '@/api/client';
import type { Category } from '@/api/types';
import { ColorPicker, IconPicker } from '@/components/pickers';
import { AppText, Button, IconBadge, LoadingView, Screen, Segmented, TextField } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { emitDataChanged } from '@/utils/events';
import { confirm, haptic, notify } from '@/utils/feedback';
import { goBack } from '@/utils/navigation';

export default function CategoryForm() {
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const [existing, setExisting] = useState<Category | null>(null);
  const [loaded, setLoaded] = useState(!params.id);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>(params.type === 'income' ? 'income' : 'expense');
  const [icon, setIcon] = useState('pricetag');
  const [color, setColor] = useState('#4F46E5');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!params.id) return;
    api.get<{ items: Category[] }>('/categories').then(({ items }) => {
      const c = items.find((x) => x._id === params.id);
      if (c) { setExisting(c); setName(c.name); setType(c.type); setIcon(c.icon); setColor(c.color); }
      setLoaded(true);
    });
  }, [params.id]);

  const save = async () => {
    setErrors({});
    if (!name.trim()) return setErrors({ name: 'Name is required' });
    setSaving(true);
    try {
      if (existing) await api.patch(`/categories/${existing._id}`, { name: name.trim(), icon, color });
      else await api.post('/categories', { name: name.trim(), type, icon, color });
      haptic('success');
      emitDataChanged();
      goBack();
    } catch (e) {
      setSaving(false);
      if (e instanceof ApiError) setErrors({ ...(e.fields ?? {}), _: e.message });
    }
  };

  const remove = async () => {
    if (!existing || !(await confirm('Delete category?', 'Its transactions will be moved to “Other”, and its budget removed.'))) return;
    try {
      await api.del(`/categories/${existing._id}`);
      emitDataChanged();
      goBack();
    } catch (e) {
      notify('Could not delete', e instanceof Error ? e.message : undefined);
    }
  };

  if (!loaded) return <Screen modal title="Category"><LoadingView /></Screen>;

  return (
    <Screen modal title={existing ? 'Edit category' : 'New category'}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {existing && existing.name !== 'Other' ? <Button title="Delete" variant="danger" icon="trash-outline" onPress={remove} style={{ flex: 1 }} /> : null}
          <Button title="Save" icon="checkmark" onPress={save} loading={saving} style={{ flex: 2 }} />
        </View>
      }>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <IconBadge name={icon} color={color} size={72} solid />
        <AppText variant="heading">{name || 'Category name'}</AppText>
      </View>
      {!existing ? (
        <Segmented value={type} onChange={setType} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />
      ) : null}
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Coffee" error={errors.name} maxLength={40} />
      <View style={{ gap: spacing.sm }}><AppText variant="label" tone="muted">Color</AppText><ColorPicker value={color} onChange={setColor} /></View>
      <View style={{ gap: spacing.sm }}><AppText variant="label" tone="muted">Icon</AppText><IconPicker value={icon} color={color} onChange={setIcon} /></View>
      {errors._ ? <AppText tone="expense" variant="label">{errors._}</AppText> : null}
    </Screen>
  );
}
