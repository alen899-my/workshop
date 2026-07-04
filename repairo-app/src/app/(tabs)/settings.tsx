import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, Colors } from '@/constants/theme';

export default function SettingsScreen() {
  const { bottom } = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingBottom: Math.max(bottom, 16) + 80 }]}>
        <ThemedText type="title" style={styles.title}>Settings</ThemedText>
        <View style={styles.emptyState}>
          <Ionicons name="settings-outline" size={48} color={Colors.textSecondary} />
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>
            Settings coming soon
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four,
  },
  title: { paddingTop: Spacing.two, marginBottom: Spacing.four },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyText: { fontSize: 15 },
});
