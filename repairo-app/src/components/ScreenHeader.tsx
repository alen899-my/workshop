import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export default function ScreenHeader() {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.container, { paddingTop: top, backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.inner}>
        <ThemedText style={[styles.brand, { color: theme.primary }]}>Repairo</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
