import { router, Tabs } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { useTheme } from '@/context/theme';
import { haptic } from '@/utils/feedback';

const icons: Record<string, [string, string]> = {
  index: ['home', 'home-outline'],
  transactions: ['receipt', 'receipt-outline'],
  stats: ['pie-chart', 'pie-chart-outline'],
  more: ['grid', 'grid-outline'],
};

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: 68 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          ...(Platform.OS === 'web' ? {} : { position: 'absolute' as const }),
        },
        tabBarItemStyle: { height: 52 },
        tabBarIcon: ({ focused, color }) =>
          icons[route.name] ? <Icon name={icons[route.name][focused ? 0 : 1]} size={23} color={color as string} /> : null,
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Activity' }} />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarAccessibilityLabel: 'Add transaction',
          tabBarButton: () => (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add transaction"
                onPress={() => { haptic(); router.push('/transaction/new'); }}
                style={({ pressed }) => ({
                  width: 58, height: 58, borderRadius: 29, marginTop: -22,
                  backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                  shadowColor: colors.primary, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
                  elevation: 8, borderWidth: 4, borderColor: colors.tabBar,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                })}>
                <Icon name="add" size={30} color={colors.onPrimary} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="stats" options={{ title: 'Insights' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
