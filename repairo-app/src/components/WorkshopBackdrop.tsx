import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/use-theme';

// Shared, non-interactive canvas for screens and sheets.
export default function WorkshopBackdrop() {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.canvasStart, theme.background, theme.canvasEnd]}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}