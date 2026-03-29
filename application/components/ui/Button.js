import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

/**
 * WorkshopButton
 * variants: 'primary' | 'outline' | 'ghost' | 'steel'
 * sizes:    'sm' | 'md' | 'lg'
 */
export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,            // Feather icon name string, optional
  iconPosition = 'right',
  fullWidth = true,
  style,
  textStyle,
}) {
  const theme = Colors.dark;

  const variantMap = {
    primary: {
      button: {
        backgroundColor: theme.primary,
        borderWidth: 1,
        borderColor: theme.primary,
      },
      text: { color: '#FFFFFF' },
      iconColor: '#FFFFFF',
    },
    outline: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.45)',
      },
      text: { color: '#FFFFFF' },
      iconColor: '#FFFFFF',
    },
    ghost: {
      button: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
      },
      text: { color: 'rgba(255,255,255,0.75)' },
      iconColor: 'rgba(255,255,255,0.75)',
    },
    steel: {
      button: {
        backgroundColor: theme.accent,
        borderWidth: 1,
        borderColor: theme.accent,
      },
      text: { color: '#FFFFFF' },
      iconColor: '#FFFFFF',
    },
  };

  const sizeMap = {
    sm: { paddingVertical: 9, paddingHorizontal: 16, fontSize: 10, iconSize: 14, radius: 4 },
    md: { paddingVertical: 13, paddingHorizontal: 20, fontSize: 12, iconSize: 16, radius: 4 },
    lg: { paddingVertical: 17, paddingHorizontal: 28, fontSize: 13, iconSize: 18, radius: 4 },
  };

  const v = variantMap[variant] || variantMap.primary;
  const s = sizeMap[size] || sizeMap.lg;

  const resolvedIcon = icon || (variant === 'primary' ? 'arrow-right' : null);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
      style={[
        styles.base,
        {
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: s.radius,
          width: fullWidth ? '100%' : undefined,
        },
        v.button,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.iconColor} size="small" />
      ) : (
        <View style={styles.row}>
          {resolvedIcon && iconPosition === 'left' && (
            <Feather
              name={resolvedIcon}
              size={s.iconSize}
              color={v.iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.label,
              { fontSize: s.fontSize, color: v.text.color },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {resolvedIcon && iconPosition === 'right' && (
            <Feather
              name={resolvedIcon}
              size={s.iconSize}
              color={v.iconColor}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: FONT,
  },
  disabled: {
    opacity: 0.45,
  },
});