import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { T } from '../../constants/Theme';

export function AppButton({ title, onPress, variant = 'primary', size = 'md', loading, disabled, style, iconLeft }) {
  const isDisabled = loading || disabled;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[s.base, s[variant], s[`sz_${size}`], isDisabled && s.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? T.primaryText : T.primary} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {iconLeft}
          <Text style={[s.label, s[`lbl_${variant}`], s[`lbl_sz_${size}`]]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: T.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: T.primary,
  },
  secondary: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  danger: {
    backgroundColor: T.dangerBg,
    borderWidth: 1,
    borderColor: T.dangerBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: T.border,
  },
  sz_sm: { paddingHorizontal: 14, paddingVertical: 9 },
  sz_md: { paddingHorizontal: 18, paddingVertical: 12 },
  sz_lg: { paddingHorizontal: 22, paddingVertical: 15 },
  disabled: { opacity: 0.45 },
  label: { fontFamily: T.font, fontWeight: '600' },
  lbl_primary: { color: T.primaryText },
  lbl_secondary: { color: T.text },
  lbl_danger: { color: T.danger },
  lbl_ghost: { color: T.textMuted },
  lbl_sz_sm: { fontSize: 13 },
  lbl_sz_md: { fontSize: 14 },
  lbl_sz_lg: { fontSize: 15 },
});
