import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/context/theme';
import { type as typeScale, type Colors } from '@/theme/tokens';

type Variant = keyof typeof typeScale;
type Tone = 'default' | 'muted' | 'faint' | 'primary' | 'income' | 'expense' | 'warning' | 'inverse';

const toneColor = (c: Colors, tone: Tone) => ({
  default: c.text, muted: c.textMuted, faint: c.textFaint, primary: c.primary,
  income: c.income, expense: c.expense, warning: c.warning, inverse: '#FFFFFF',
})[tone];

export function AppText({
  variant = 'body', tone = 'default', style, ...rest
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const { colors } = useTheme();
  return <Text style={[typeScale[variant], { color: toneColor(colors, tone) }, style]} {...rest} />;
}
