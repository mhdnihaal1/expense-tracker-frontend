import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import { api, ApiError } from '@/api/client';
import type { Account, AccountType } from '@/api/types';
import { ColorPicker, IconPicker } from '@/components/pickers';
import { AppText, Button, Chip, IconBadge, LoadingView, Screen, TextField } from '@/components/ui';
import { useCurrency } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { spacing } from '@/theme/tokens';
import { emitDataChanged } from '@/utils/events';
import { confirm, haptic, notify } from '@/utils/feedback';
import { formatMoney } from '@/utils/format';
import { goBack } from '@/utils/navigation';

const TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: 'cash' },
  { value: 'bank', label: 'Bank', icon: 'business' },
  { value: 'card', label: 'Card', icon: 'card' },
  { value: 'wallet', label: 'E-wallet', icon: 'phone-portrait' },
  { value: 'savings', label: 'Savings', icon: 'shield-checkmark' },
];

export default function AccountForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const currency = useCurrency();
  const [loaded, setLoaded] = useState(!id);
  const [existing, setExisting] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [icon, setIcon] = useState('business');
  const [color, setColor] = useState('#4F46E5');
  const [opening, setOpening] = useState('0');
  const [archived, setArchived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    api.get<Account>(`/accounts/${id}`).then((a) => {
      setExisting(a); setName(a.name); setType(a.type); setIcon(a.icon); setColor(a.color);
      setOpening(String(a.openingBalance)); setArchived(a.archived); setLoaded(true);
    });
  }, [id]);

  const save = async () => {
    setErrors({});
    if (!name.trim()) return setErrors({ name: 'Name is required' });
    setSaving(true);
    const body = { name: name.trim(), type, icon, color, openingBalance: Number(opening) || 0, archived };
    try {
      if (existing) await api.patch(`/accounts/${existing._id}`, body);
      else await api.post('/accounts', body);
      haptic('success');
      emitDataChanged();
      goBack();
    } catch (e) {
      setSaving(false);
      if (e instanceof ApiError) setErrors({ ...(e.fields ?? {}), _: e.message });
    }
  };

  const remove = async () => {
    if (!existing) return;
    try {
      if (!(await confirm('Delete account?', `"${existing.name}" will be removed.`))) return;
      await api.del(`/accounts/${existing._id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        if (!(await confirm('Account has transactions', 'Delete the account AND all its transactions? Consider archiving instead.', 'Delete all'))) return;
        await api.del(`/accounts/${existing._id}`, { force: true });
      } else return notify('Could not delete', e instanceof Error ? e.message : undefined);
    }
    emitDataChanged();
    goBack();
  };

  if (!loaded) return <Screen modal title="Account"><LoadingView /></Screen>;

  return (
    <Screen modal title={existing ? 'Edit account' : 'New account'}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {existing ? <Button title="Delete" variant="danger" icon="trash-outline" onPress={remove} style={{ flex: 1 }} /> : null}
          <Button title="Save" icon="checkmark" onPress={save} loading={saving} style={{ flex: 2 }} />
        </View>
      }>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <IconBadge name={icon} color={color} size={72} solid />
        {existing ? <AppText tone="muted">Current balance: {formatMoney(existing.balance, currency)}</AppText> : null}
      </View>
      <TextField label="Account name" value={name} onChangeText={setName} placeholder="e.g. Chase Checking" error={errors.name} />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" tone="muted">Type</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {TYPES.map((t) => (
            <Chip key={t.value} label={t.label} icon={t.icon} selected={type === t.value}
              onPress={() => { setType(t.value); setIcon(t.icon); }} />
          ))}
        </View>
      </View>
      <TextField label="Starting balance" value={opening} onChangeText={(v) => setOpening(v.replace(/[^0-9.-]/g, ''))}
        keyboardType="numbers-and-punctuation" placeholder="0" error={errors.openingBalance} />
      <AppText variant="caption" tone="faint" style={{ marginTop: -spacing.sm }}>For credit cards, enter a negative number if you owe money.</AppText>
      <View style={{ gap: spacing.sm }}><AppText variant="label" tone="muted">Color</AppText><ColorPicker value={color} onChange={setColor} /></View>
      <View style={{ gap: spacing.sm }}><AppText variant="label" tone="muted">Icon</AppText><IconPicker value={icon} color={color} onChange={setIcon} /></View>
      {existing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <AppText>Archive account</AppText>
            <AppText variant="caption" tone="muted">Hide it from pickers and totals but keep history.</AppText>
          </View>
          <Switch value={archived} onValueChange={setArchived} trackColor={{ true: colors.primary }} thumbColor="#FFFFFF" />
        </View>
      ) : null}
      {errors._ ? <AppText tone="expense" variant="label">{errors._}</AppText> : null}
    </Screen>
  );
}
