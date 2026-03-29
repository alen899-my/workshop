import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../lib/theme';

export function AppButton({ title, onPress, variant = 'primary', size = 'md', loading, disabled, style, iconLeft }) {
  const T = useTheme();
  const isDisabled = loading || disabled;

  const bgColors = {
    primary: T.primary,
    secondary: T.surface,
    danger: T.dangerBg,
    ghost: 'transparent',
    outline: 'transparent',
  };
  const borderColors = {
    primary: 'transparent',
    secondary: T.border,
    danger: T.dangerBorder,
    ghost: T.border,
    outline: T.border,
  };
  const textColors = {
    primary: T.primaryText,
    secondary: T.text,
    danger: T.danger,
    ghost: T.textMuted,
    outline: T.text,
  };

  const paddings = {
    sm: { paddingHorizontal: 14, paddingVertical: 9 },
    md: { paddingHorizontal: 18, paddingVertical: 12 },
    lg: { paddingHorizontal: 22, paddingVertical: 15 },
  };
  const fontSizes = { sm: 13, md: 14, lg: 15 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        {
          borderRadius: T.radius,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColors[variant] ?? T.primary,
          borderWidth: variant !== 'primary' ? 1 : 0,
          borderColor: borderColors[variant] ?? T.border,
          opacity: isDisabled ? 0.45 : 1,
        },
        paddings[size] ?? paddings.md,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? T.primaryText : T.primary} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {iconLeft}
          <Text style={{
            fontFamily: T.font,
            fontWeight: '600',
            fontSize: fontSizes[size] ?? 14,
            color: textColors[variant] ?? T.primaryText,
          }}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
