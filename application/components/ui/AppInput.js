import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { T } from '../../constants/Theme';

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  editable = true,
  multiline,
  numberOfLines,
  style,
}) {
  return (
    <View style={[s.wrapper, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.textFaint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          s.input,
          error && s.inputError,
          !editable && s.inputDisabled,
          multiline && s.inputMultiline,
        ]}
      />
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textMuted,
    fontFamily: T.font,
  },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: T.text,
    fontFamily: T.font,
  },
  inputError: { borderColor: T.danger },
  inputDisabled: { opacity: 0.55, backgroundColor: T.surfaceAlt },
  inputMultiline: { textAlignVertical: 'top', minHeight: 90, paddingTop: 12 },
  errorText: { fontSize: 11, color: T.danger, fontFamily: T.font },
});
