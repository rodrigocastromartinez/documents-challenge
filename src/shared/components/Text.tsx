import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { typography } from '@/shared/theme/typography';

type Variant = keyof typeof typography;

type Props = RNTextProps & {
  variant?: Variant;
  color?: string;
};

export function Text({ variant = 'body', color = colors.text, style, ...props }: Props) {
  return <RNText style={[typography[variant], { color }, style]} {...props} />;
}
