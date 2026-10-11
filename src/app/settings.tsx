import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { api, ApiError } from '@/api/client';
import type { ThemePref } from '@/api/types';
import { BottomSheet } from '@/components/bottom-sheet';
import { SelectField } from '@/components/pickers';
import { AppText, Button, Card, Chip, ListRow, Screen, Segmented, TextField } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { spacing } from '@/theme/tokens';
import { confirm, haptic, notify } from '@/utils/feedback';
import { CURRENCIES, monthBounds, toMonthKey } from '@/utils/format';

type ExportRange = 'month' | 'year' | 'all';

export default function Settings() {
  const { user, updateProfile, signOut } = useAuth();
  const { preference, setPreference, colors } = useTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [exportRange, setExportRange] = useState<ExportRange>('month');
  const [exporting, setExporting] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const changeTheme = (t: ThemePref) => {
    setPreference(t);
    updateProfile({ theme: t }).catch(() => {});
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const now = new Date();
      const range = exportRange === 'month' ? monthBounds(toMonthKey(now))
        : exportRange === 'year' ? { from: new Date(now.getFullYear(), 0, 1), to: now } : null;
      const csv = await api.text('/export/csv', range ? { from: range.from.toISOString(), to: range.to.toISOString() } : undefined);
      const filename = `spendwise-${exportRange}-${now.toISOString().slice(0, 10)}.csv`;
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const file = new File(Paths.cache, filename);
        if (file.exists) file.delete();
        file.create();
        file.write(csv);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export transactions', UTI: 'public.comma-separated-values-text' });
        } else notify('Exported', `Saved to ${file.uri}`);
      }
      haptic('success');
    } catch (e) {
      notify('Export failed', e instanceof Error ? e.message : undefined);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen title="Settings" back>
      <Section title="Profile">
        <Card style={{ gap: spacing.md }}>
          <TextField label="Name" value={name} onChangeText={setName} icon="person-outline" />
          <TextField label="Email" value={user?.email} editable={false} icon="mail-outline" />
          <Button title="Save name" size="md" variant="secondary" loading={savingName} disabled={!name.trim() || name === user?.name}
            onPress={async () => {
              setSavingName(true);
              try { await updateProfile({ name: name.trim() }); haptic('success'); } finally { setSavingName(false); }
            }} />
        </Card>
      </Section>

      <Section title="Preferences">
        <Card style={{ gap: spacing.lg }}>
          <SelectField label="Currency" value={user?.currency ?? 'USD'} icon="cash-outline"
            options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))}
            onChange={(c) => updateProfile({ currency: c })} />
          <View style={{ gap: spacing.sm }}>
            <AppText variant="label" tone="muted">Appearance</AppText>
            <Segmented value={preference} onChange={changeTheme}
              options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
          </View>
        </Card>
      </Section>

      <Section title="Data">
        <Card style={{ gap: spacing.md }}>
          <AppText variant="heading">Export to CSV</AppText>
          <AppText variant="caption" tone="muted">Open in Excel, Google Sheets or Numbers.</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Chip label="This month" selected={exportRange === 'month'} onPress={() => setExportRange('month')} />
            <Chip label="This year" selected={exportRange === 'year'} onPress={() => setExportRange('year')} />
            <Chip label="All time" selected={exportRange === 'all'} onPress={() => setExportRange('all')} />
          </View>
          <Button title="Export transactions" icon="download-outline" onPress={exportCsv} loading={exporting} />
        </Card>
      </Section>

      <Section title="Security">
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <ListRow icon="key" iconColor={colors.warning} title="Change password" onPress={() => setPwOpen(true)} />
          <ListRow icon="log-out" iconColor={colors.expense} title="Sign out" chevron={false} divider={false}
            onPress={async () => { if (await confirm('Sign out?', 'You can sign back in anytime.', 'Sign out')) signOut(); }} />
        </Card>
      </Section>

      <ChangePasswordSheet visible={pwOpen} onClose={() => setPwOpen(false)} />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="muted" style={{ marginLeft: 4 }}>{title.toUpperCase()}</AppText>
      {children}
    </View>
  );
}

function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setErrors({});
    if (next.length < 6) return setErrors({ newPassword: 'At least 6 characters' });
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      haptic('success');
      setCurrent('');
      setNext('');
      onClose();
      notify('Password updated');
    } catch (e) {
      if (e instanceof ApiError) setErrors({ ...(e.fields ?? {}), _: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Change password">
      <View style={{ gap: spacing.lg }}>
        <TextField label="Current password" value={current} onChangeText={setCurrent} secureTextEntry error={errors.currentPassword} />
        <TextField label="New password" value={next} onChangeText={setNext} secureTextEntry error={errors.newPassword} />
        {errors._ && !errors.currentPassword ? <AppText tone="expense" variant="label">{errors._}</AppText> : null}
        <Button title="Update password" onPress={submit} loading={saving} />
      </View>
    </BottomSheet>
  );
}
