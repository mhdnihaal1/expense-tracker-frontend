import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ApiError } from '@/api/client';
import { AuthShell } from '@/components/auth/auth-shell';
import { AppText, Button, Card, TextField } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { spacing } from '@/theme/tokens';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) return setError('Enter your email and password');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Track every rupee, dollar and euro. Sign in to continue.">
      <TextField label="Email" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none"
        keyboardType="email-address" autoComplete="email" placeholder="you@example.com" textContentType="emailAddress" />
      <TextField label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword}
        secureTextEntry placeholder="••••••••" autoComplete="password" onSubmitEditing={submit} returnKeyType="go" />
      {error ? <AppText tone="expense" variant="label">{error}</AppText> : null}
      <Button title="Sign in" onPress={submit} loading={loading} />
      <Card style={{ gap: 4 }}>
        <AppText variant="label">Just exploring?</AppText>
        <AppText variant="caption" tone="muted">Run `npm run seed:demo` in the backend, then use demo@expense.app / demo1234</AppText>
        <AppText variant="label" tone="primary" style={{ marginTop: 4 }}
          onPress={() => { setEmail('demo@expense.app'); setPassword('demo1234'); }}>Fill demo credentials</AppText>
      </Card>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm }}>
        <AppText tone="muted">New here?</AppText>
        <Link href="/sign-up"><AppText tone="primary" variant="body" style={{ fontWeight: '700' }}>Create an account</AppText></Link>
      </View>
    </AuthShell>
  );
}
