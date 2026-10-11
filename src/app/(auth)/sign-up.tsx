import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ApiError } from '@/api/client';
import { AuthShell } from '@/components/auth/auth-shell';
import { SelectField } from '@/components/pickers';
import { AppText, Button, TextField } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { spacing } from '@/theme/tokens';
import { CURRENCIES } from '@/utils/format';

export default function SignUp() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', currency: 'USD' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    setErrors({});
    setLoading(true);
    try {
      await signUp({ ...form, email: form.email.trim() });
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fields ?? {});
        setError(e.message);
      } else setError('Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Budgets, goals and insights. Set up in under a minute.">
      <TextField label="Name" icon="person-outline" value={form.name} onChangeText={set('name')} placeholder="Your name" error={errors.name} autoComplete="name" />
      <TextField label="Email" icon="mail-outline" value={form.email} onChangeText={set('email')} autoCapitalize="none"
        keyboardType="email-address" placeholder="you@example.com" error={errors.email} autoComplete="email" />
      <TextField label="Password" icon="lock-closed-outline" value={form.password} onChangeText={set('password')}
        secureTextEntry placeholder="At least 6 characters" error={errors.password} autoComplete="new-password" />
      <SelectField label="Currency" icon="cash-outline" value={form.currency} onChange={set('currency')}
        options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))} />
      {error && !Object.keys(errors).length ? <AppText tone="expense" variant="label">{error}</AppText> : null}
      <Button title="Create account" onPress={submit} loading={loading} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm }}>
        <AppText tone="muted">Already have an account?</AppText>
        <Link href="/sign-in"><AppText tone="primary" style={{ fontWeight: '700' }}>Sign in</AppText></Link>
      </View>
    </AuthShell>
  );
}
