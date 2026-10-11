import { Platform } from 'react-native';

export const palette = {
  light: {
    background: '#F4F5FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F7',
    border: '#E3E6EF',
    text: '#0F172A',
    textMuted: '#64748B',
    textFaint: '#94A3B8',
    primary: '#4F46E5',
    primarySoft: '#EEF0FF',
    onPrimary: '#FFFFFF',
    income: '#059669',
    incomeSoft: '#E6F7F0',
    expense: '#E11D48',
    expenseSoft: '#FDECEF',
    transfer: '#2563EB',
    transferSoft: '#E8F0FE',
    warning: '#D97706',
    warningSoft: '#FEF5E6',
    heroFrom: '#4F46E5',
    heroTo: '#7C3AED',
    tabBar: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.45)',
    shadow: '#1E1B4B',
  },
  dark: {
    background: '#0A0C14',
    surface: '#141826',
    surfaceAlt: '#1C2133',
    border: '#252B3F',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textFaint: '#64748B',
    primary: '#818CF8',
    primarySoft: '#1E2148',
    onPrimary: '#0A0C14',
    income: '#34D399',
    incomeSoft: '#0F2A22',
    expense: '#FB7185',
    expenseSoft: '#2E1520',
    transfer: '#60A5FA',
    transferSoft: '#132240',
    warning: '#FBBF24',
    warningSoft: '#2D2410',
    heroFrom: '#4338CA',
    heroTo: '#6D28D9',
    tabBar: '#141826',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
  },
};

export type Colors = typeof palette.light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const fontFamily = Platform.select({ ios: 'System', default: undefined });

export const type = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

export const swatches = [
  '#4F46E5', '#7C3AED', '#A855F7', '#EC4899', '#E11D48', '#F97316',
  '#F59E0B', '#EAB308', '#22C55E', '#10B981', '#14B8A6', '#06B6D4',
  '#0EA5E9', '#3B82F6', '#64748B', '#78716C',
];

export const iconChoices = [
  'restaurant', 'cart', 'car', 'bag-handle', 'flash', 'home', 'film', 'medkit', 'school', 'airplane',
  'repeat', 'sparkles', 'gift', 'cafe', 'beer', 'fast-food', 'pizza', 'bus', 'train', 'bicycle',
  'fitness', 'barbell', 'paw', 'heart', 'shirt', 'game-controller', 'musical-notes', 'book', 'phone-portrait',
  'wifi', 'water', 'flame', 'construct', 'hammer', 'people', 'person', 'happy', 'briefcase', 'laptop',
  'trending-up', 'cash', 'wallet', 'card', 'business', 'shield-checkmark', 'diamond', 'trophy', 'flag',
  'globe', 'umbrella', 'leaf', 'color-palette', 'camera', 'tv', 'pricetag', 'ellipsis-horizontal',
] as const;
