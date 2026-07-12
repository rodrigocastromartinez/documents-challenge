import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography } from '@/shared/theme';

type Variant = keyof typeof typography;

type Props = RNTextProps & {
  variant?: Variant;
  color?: string;
};

export function Text({ variant = 'body', color = colors.text, style, ...props }: Props) {
  return <RNText style={[typography[variant], { color }, style]} {...props} />;
}
