import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

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
  const T = useTheme();

  return (
    <View style={[s.wrapper, style]}>
      {label ? <Text style={[s.label, { color: T.textMuted, fontFamily: T.font }]}>{label}</Text> : null}
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
          {
            backgroundColor: editable ? T.surface : T.surfaceAlt,
            borderColor: error ? T.danger : T.border,
            color: T.text,
            fontFamily: T.font,
          },
          !editable && s.inputDisabled,
          multiline && s.inputMultiline,
        ]}
      />
      {error ? <Text style={[s.errorText, { color: T.danger, fontFamily: T.font }]}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  inputDisabled: { opacity: 0.55 },
  inputMultiline: { textAlignVertical: 'top', minHeight: 90, paddingTop: 12 },
  errorText: { fontSize: 11 },
});
