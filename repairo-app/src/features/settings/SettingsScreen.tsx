import { useMemo } from 'react';
import { StyleSheet, View, Switch, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme, useThemePreference } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface SettingsScreenProps {
  onClose: () => void;
}

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

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { top, bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { theme: currentTheme, setTheme, isDark } = useThemePreference();

  const isDarkMode = currentTheme === 'dark';
  const isSystem = currentTheme === 'system';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <View style={styles.section}>
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
        </View>

        {/* Preview */}
        <View style={styles.section}>
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
        </View>

        {/* About */}
        <View style={styles.section}>
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
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  section: { marginBottom: Spacing.five, paddingHorizontal: 16 },
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
