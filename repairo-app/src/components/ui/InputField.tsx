import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  text: 'text-short',
  email: 'email-outline',
  phone: 'phone-outline',
  password: 'lock-outline',
};

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'phone';
  error?: string;
  required?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  editable?: boolean;
  containerStyle?: any;
}

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  type = 'text',
  error,
  icon,
  required,
  autoCapitalize,
  autoComplete,
  keyboardType,
  editable = true,
  containerStyle,
}: InputFieldProps) {
  const theme = useTheme();
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const iconName = icon || ICON_MAP[type] || 'text-short';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={[styles.label, { color: theme.text }]}>
        {label}{required ? <Text style={{ color: '#E5544D' }}> *</Text> : null}
      </Text>
      <Pressable
        onPress={() => ref.current?.focus()}
        style={[
          styles.inputContainer,
          {
            borderColor: error ? theme.error : focused ? theme.text : theme.border,
            backgroundColor: theme.card,
          },
          focused && !error && { shadowColor: theme.text },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={18}
          color={error ? theme.error : focused ? theme.text : theme.textSecondary}
          style={styles.icon}
        />
        <TextInput
          ref={ref}
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.tabIconDefault}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoComplete={autoComplete as any}
          keyboardType={keyboardType ?? (type === 'phone' ? 'phone-pad' : 'default')}
          textContentType={isPassword ? 'password' : type === 'email' ? 'emailAddress' : 'none'}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8} style={styles.eye}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
        )}
      </Pressable>
      {error && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={12} color={theme.error} />
          <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  eye: {
    paddingLeft: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 2,
    marginTop: 2,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
  },
});
