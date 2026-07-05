import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
}

export default function FAB({ onPress, icon = 'add', size = 56, color = Colors.primary }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
    >
      <Ionicons name={icon} size={size * 0.5} color={Colors.primaryForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.text, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
});
