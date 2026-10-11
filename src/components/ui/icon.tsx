import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { View, type ViewStyle } from 'react-native';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color }: { name: string; size?: number; color: string }) {
  const valid = name in Ionicons.glyphMap ? (name as IconName) : 'pricetag';
  return <Ionicons name={valid} size={size} color={color} />;
}

/** Colored rounded square with an icon — used for categories, accounts, goals. */
export function IconBadge({
  name, color, size = 40, style, solid = false,
}: { name: string; color: string; size?: number; style?: ViewStyle; solid?: boolean }) {
  return (
    <View
      style={[{
        width: size, height: size, borderRadius: size * 0.32,
        backgroundColor: solid ? color : `${color}22`,
        alignItems: 'center', justifyContent: 'center',
      }, style]}>
      <Icon name={name} size={size * 0.5} color={solid ? '#FFFFFF' : color} />
    </View>
  );
}
