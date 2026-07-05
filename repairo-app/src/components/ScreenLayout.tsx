import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

interface ScreenLayoutProps {
  title: string;
  description?: string;
  rightAction?: ReactNode;
  children: ReactNode;
}

export default function ScreenLayout({ title, description, rightAction, children }: ScreenLayoutProps) {
  const { top } = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content]}>
        <View style={[styles.header, { paddingTop: top + Spacing.two }]}>
          <View style={styles.titleWrap}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            {description && (
              <ThemedText style={styles.description}>{description}</ThemedText>
            )}
          </View>
          {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
        </View>
        <View style={styles.body}>
          {children}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three,
  },
  titleWrap: { flex: 1, gap: 2 },
  title: { fontSize: 32, fontWeight: '700', lineHeight: 38, color: Colors.text },
  description: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  rightAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 4 },
  body: { flex: 1 },
});
