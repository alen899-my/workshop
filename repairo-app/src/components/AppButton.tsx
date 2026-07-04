import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

interface AppButtonProps {
  title: string;
  fullWidth?: boolean;
  onPress?: () => void;
  variant?: 'white' | 'black' | 'green';
}

export default function AppButton({ title, fullWidth = false, onPress, variant = 'white' }: AppButtonProps) {
  const bg = variant === 'white' ? Colors.card : variant === 'black' ? Colors.cardDark : Colors.primary;
  const fg = variant === 'black' ? Colors.textInverse : variant === 'green' ? Colors.textInverse : Colors.dark;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        { backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});
