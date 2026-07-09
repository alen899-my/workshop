import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';

interface ScreenLayoutProps {
  title: string;
  description?: string;
  rightAction?: ReactNode;
  children: ReactNode;
}

export default function ScreenLayout({ title, description, rightAction, children }: ScreenLayoutProps) {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content]}>
        <View style={[styles.header, { paddingTop: top }]}>
          <View style={styles.titleWrap}>
            <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
            {description && (
              <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
                {description}
              </ThemedText>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 2,
  },
  titleWrap: { flex: 1, gap: 1 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  description: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  rightAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  body: { flex: 1 },
});
