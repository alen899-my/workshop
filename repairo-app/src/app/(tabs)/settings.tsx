import { StyleSheet, View, Switch, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme, useThemePreference } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';

function SettingsRow({
  icon,
  label,
  description,
  right,
  isFirst,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  right?: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.rowContent}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        {description && (
          <ThemedText themeColor="textSecondary" style={styles.rowDescription}>
            {description}
          </ThemedText>
        )}
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
    </View>
  );
}

export default function SettingsScreen() {
  const { bottom, top } = useSafeAreaInsets();
  const theme = useTheme();
  const { theme: currentTheme, setTheme, isDark } = useThemePreference();

  const isDarkMode = currentTheme === 'dark';
  const isSystem = currentTheme === 'system';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { paddingTop: top + Spacing.three }]}>
          <ThemedText type="title" style={styles.title}>Settings</ThemedText>

          {/* ── Appearance Section ── */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.section}>
            <ThemedText themeColor="textSecondary" style={styles.sectionTitle}>
              APPEARANCE
            </ThemedText>

            <SettingsRow
              icon="moon-outline"
              label="Dark Mode"
              description="Switch between light and dark theme"
              isFirst
              right={
                <Switch
                  value={isDarkMode}
                  onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={isDarkMode ? theme.card : '#f4f3f4'}
                  ios_backgroundColor={theme.border}
                />
              }
            />

            <SettingsRow
              icon="phone-portrait-outline"
              label="Follow System"
              description="Automatically match your device theme"
              isLast
              right={
                <Switch
                  value={isSystem}
                  onValueChange={(val) => setTheme(val ? 'system' : (isDark ? 'dark' : 'light'))}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={isSystem ? theme.card : '#f4f3f4'}
                  ios_backgroundColor={theme.border}
                />
              }
            />
          </Animated.View>

          {/* ── Preview ── */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
            <ThemedText themeColor="textSecondary" style={styles.sectionTitle}>
              PREVIEW
            </ThemedText>
            <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.previewHeader}>
                <View style={[styles.previewDot, { backgroundColor: theme.primary }]} />
                <View style={[styles.previewBar, { backgroundColor: theme.textSecondary }]} />
                <View style={[styles.previewCircle, { backgroundColor: theme.primary }]} />
              </View>
              <View style={styles.previewBody}>
                <View style={[styles.previewLine, { backgroundColor: theme.text }]} />
                <View style={[styles.previewLineShort, { backgroundColor: theme.textSecondary }]} />
                <View style={[styles.previewBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <View style={[styles.previewBoxInner, { backgroundColor: theme.primary }]} />
                  <View style={[styles.previewBoxInnerShort, { backgroundColor: theme.textSecondary }]} />
                </View>
              </View>
            </View>
            <ThemedText themeColor="textSecondary" style={styles.previewHint}>
              {isDark ? 'Dark theme active' : isSystem ? 'Following system theme' : 'Light theme active'}
            </ThemedText>
          </Animated.View>

          {/* ── About Section ── */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
            <ThemedText themeColor="textSecondary" style={styles.sectionTitle}>
              ABOUT
            </ThemedText>
            <SettingsRow
              icon="information-circle-outline"
              label="Version"
              description="1.0.0"
              isFirst
              isLast
            />
          </Animated.View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four,
  },
  title: { paddingTop: Spacing.two, marginBottom: Spacing.five },
  section: { marginBottom: Spacing.five },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
    paddingLeft: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three + 2,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  rowLast: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two + 2,
  },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDescription: { fontSize: 12, lineHeight: 16 },
  rowRight: { marginLeft: Spacing.two },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  previewBar: { flex: 1, height: 6, borderRadius: 3 },
  previewCircle: { width: 28, height: 28, borderRadius: 14 },
  previewBody: { gap: 10 },
  previewLine: { height: 14, borderRadius: 4, width: '60%' },
  previewLineShort: { height: 10, borderRadius: 3, width: '40%' },
  previewBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  previewBoxInner: { flex: 1, height: 32, borderRadius: 8 },
  previewBoxInnerShort: { width: 40, height: 32, borderRadius: 8 },
  previewHint: { fontSize: 12, textAlign: 'center', marginTop: Spacing.two },
});
