import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/Colors';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

/**
 * WorkshopButton - Mobile adaptation of the website's WorkshopButton
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
  const theme = Colors.light;

  const variantStyles = {
    primary: {
      button: {
        backgroundColor: '#163C63', // oklch(0.38 0.13 248)
        borderWidth: 1,
        borderColor: '#163C63',
        shadowColor: '#5B87CD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
      text: { color: '#F5F8FA' },
    },
    outline: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#163C63',
      },
      text: { color: '#163C63' },
    },
    ghost: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#D8DDE2',
      },
      text: { color: '#4E88BA' },
    },
    danger: {
      button: {
        backgroundColor: '#AF3E1D',
        borderWidth: 1,
        borderColor: '#AF3E1D',
        shadowColor: '#AF3E1D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
      text: { color: '#FFFFFF' },
    },
    steel: {
      button: {
        backgroundColor: '#4E88BA',
        borderWidth: 1,
        borderColor: '#4E88BA',
        shadowColor: '#4E88BA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
      text: { color: '#F8FAFC' },
    },
  };

  const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12, gap: 6 },
    md: { paddingVertical: 10, paddingHorizontal: 20, fontSize: 14, gap: 8 },
    lg: { paddingVertical: 14, paddingHorizontal: 28, fontSize: 16, gap: 10 },
    xl: { paddingVertical: 18, paddingHorizontal: 36, fontSize: 18, gap: 12 },
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
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator color={v.text.color} size="small" style={{ marginRight: 8 }} />
          <Text style={[styles.text, { fontSize: s.fontSize, color: v.text.color }]}>Loading...</Text>
        </View>
      ) : (
        <View style={[styles.row, { gap: s.gap }]}>
          {icon && iconPosition === 'left' && icon}
          {children && (
            <Text
              style={[
                styles.text,
                { fontSize: s.fontSize, color: v.text.color },
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
    borderRadius: 4,
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
    fontFamily: FONT,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
