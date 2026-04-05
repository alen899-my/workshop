import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../../lib/theme';

/**
 * WorkshopButton - Mobile adaptation
 * Variants: 'primary' | 'outline' | 'ghost' | 'danger' | 'steel'
 * Sizes:    'sm' | 'md' | 'lg' | 'xl'
 */
export function WorkshopButton({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,            // React node for icon
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) {
  const T = useTheme();

  const variantStyles = {
    primary: {
      button: {
        backgroundColor: T.primary,
        borderWidth: 1,
        borderColor: T.primary,
      },
      text: { color: T.primaryText },
    },
    outline: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: T.primary,
      },
      text: { color: T.primary },
    },
    ghost: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: T.border, // was #D8DDE2
      },
      text: { color: T.primary },
    },
    danger: {
      button: {
        backgroundColor: T.danger,
        borderWidth: 1,
        borderColor: T.danger,
      },
      text: { color: '#FFFFFF' },
    },
    // 'steel' variant — uses accent (sky-blue roller door from workshop image)
    steel: {
      button: {
        backgroundColor: T.accent || '#7AB4CC',
        borderWidth: 1,
        borderColor: T.accent || '#7AB4CC',
      },
      text: { color: '#FFFFFF' },
    },
  };

  const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12, gap: 6 },
    md: { paddingVertical: 10, paddingHorizontal: 20, fontSize: 14, gap: 8 },
    lg: { paddingVertical: 14, paddingHorizontal: 28, fontSize: 16, gap: 10 },
    xl: { paddingVertical: 18, paddingHorizontal: 24, fontSize: 16, gap: 8 },
  };

  const v = variantStyles[variant] || variantStyles.primary;
  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        v.button,
        {
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          width: fullWidth ? '100%' : undefined,
          shadowColor: v.button.backgroundColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator color={v.text.color} size="small" style={{ marginRight: 8 }} />
          <Text style={[styles.text, { fontSize: s.fontSize, color: v.text.color, fontFamily: T.font }]}>Loading...</Text>
        </View>
      ) : (
        <View style={[styles.row, { gap: s.gap }]}>
          {icon && iconPosition === 'left' && icon}
          {children && (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              style={[
                styles.text,
                { fontSize: s.fontSize, color: v.text.color, fontFamily: T.font },
                textStyle,
              ]}
            >
              {children}
            </Text>
          )}
          {icon && iconPosition === 'right' && icon}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
