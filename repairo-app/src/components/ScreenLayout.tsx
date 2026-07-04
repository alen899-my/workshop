import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

interface ScreenLayoutProps {
  title: string;
  rightAction?: ReactNode;
  children: ReactNode;
}

export default function ScreenLayout({ title, rightAction, children }: ScreenLayoutProps) {
  const { top } = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content]}>
        <View style={[styles.header, { paddingTop: top + Spacing.two }]}>
          <ThemedText type="title">{title}</ThemedText>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.four, paddingBottom: Spacing.three,
  },
  rightAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  body: { flex: 1 },
});
