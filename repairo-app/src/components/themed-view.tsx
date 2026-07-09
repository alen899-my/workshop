import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme, useThemePreference } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const { isDark } = useThemePreference();
  const bgColor = isDark && darkColor ? darkColor : (!isDark && lightColor ? lightColor : theme[type ?? 'background']);

  return <View style={[{ backgroundColor: bgColor }, style]} {...otherProps} />;
}
