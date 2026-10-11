import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/auth';
import { ThemeProvider, useTheme } from '@/context/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const modal = { presentation: 'modal' as const };

function RootNavigator() {
  const { user, ready } = useAuth();
  const { colors, scheme, setPreference } = useTheme();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Adopt the theme saved on the user's profile after sign-in.
  useEffect(() => {
    if (user?.theme) setPreference(user.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.theme]);

  if (!ready) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: colors.background, card: colors.surface, primary: colors.primary, text: colors.text, border: colors.border },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="transaction/new" options={modal} />
          <Stack.Screen name="transaction/[id]" options={modal} />
          <Stack.Screen name="accounts/index" />
          <Stack.Screen name="accounts/form" options={modal} />
          <Stack.Screen name="categories/index" />
          <Stack.Screen name="categories/form" options={modal} />
          <Stack.Screen name="budgets/index" />
          <Stack.Screen name="budgets/form" options={modal} />
          <Stack.Screen name="goals/index" />
          <Stack.Screen name="goals/[id]" />
          <Stack.Screen name="goals/form" options={modal} />
          <Stack.Screen name="recurring/index" />
          <Stack.Screen name="recurring/form" options={modal} />
          <Stack.Screen name="settings" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
