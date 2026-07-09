import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  label?: string;
}

export default function FAB({ onPress, icon = 'add', size = 56, color, label }: FABProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const bgColor = color ?? theme.primary;
  const withLabel = !!label;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        withLabel ? { backgroundColor: bgColor } : { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}
    >
      <Ionicons name={icon} size={withLabel ? 18 : size * 0.5} color={theme.primaryForeground} />
      {label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    button: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28,
      shadowColor: theme.text, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    label: {
      fontSize: 15, fontWeight: '700', color: theme.primaryForeground,
    },
  }), [theme]);
  return styles;
};
