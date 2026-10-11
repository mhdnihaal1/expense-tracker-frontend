import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/theme';
import { radius, spacing } from '@/theme/tokens';
import { AppText, Icon } from '../ui';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[colors.heroFrom, colors.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + spacing.xxl, paddingBottom: spacing.xxl * 2, paddingHorizontal: spacing.xl }}>
          <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.md }}>
            <View style={{
              width: 56, height: 56, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="wallet" size={30} color="#FFFFFF" />
            </View>
            <AppText variant="caption" tone="inverse" style={{ opacity: 0.8, letterSpacing: 1.5 }}>SPENDWISE</AppText>
            <AppText variant="display" tone="inverse">{title}</AppText>
            <AppText tone="inverse" style={{ opacity: 0.85 }}>{subtitle}</AppText>
          </View>
        </LinearGradient>
        <View style={{
          flex: 1, marginTop: -spacing.xxl, backgroundColor: colors.background,
          borderTopLeftRadius: radius.xl + 6, borderTopRightRadius: radius.xl + 6,
          paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: insets.bottom + spacing.xl,
        }}>
          <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.lg }}>{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
