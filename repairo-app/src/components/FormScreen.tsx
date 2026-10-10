import WorkshopBackdrop from '@/components/WorkshopBackdrop';
import { UI } from '@/constants/theme';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export type FormTab = { key: string; label: string };

interface FormScreenProps {
  title: string;
  tabs: FormTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  onStepBarPress?: (key: string, index: number) => void;
  onStepNext: () => void;
  onStepBack: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;
  submitting?: boolean;
  toast?: React.ReactNode;
  keyboardPadding?: number;
  children: React.ReactNode;
}

export default function FormScreen({
  title, tabs, activeTab, onTabChange, onStepBarPress,
  onStepNext, onStepBack, onSubmit, onCancel,
  submitLabel = 'Save', submitting, toast, keyboardPadding, children,
}: FormScreenProps) {
  const theme = useTheme();
  const { top } = useSafeAreaInsets();

  const currentStep = tabs.findIndex((t) => t.key === activeTab);
  const isLastStep = currentStep === tabs.length - 1;
  const progress = ((currentStep + 1) / tabs.length) * 100;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <WorkshopBackdrop />
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>{title}</ThemedText>
        <ThemedText style={[styles.stepCount, { color: theme.textSecondary }]}>Step {currentStep + 1} of {tabs.length}</ThemedText>
      </View>

      <View style={styles.stepper}>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.accent }]} />
        </View>
        <View style={styles.stepsRow}>
          {tabs.map((tab, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <Pressable key={tab.key} style={styles.stepItem} onPress={() => onStepBarPress ? onStepBarPress(tab.key, i) : onTabChange(tab.key)}>
                <View style={[
                  styles.stepDot,
                  { backgroundColor: isActive || isDone ? theme.primary : theme.backgroundElement },
                ]}>
                  <ThemedText style={[styles.stepNumber, { color: isActive || isDone ? theme.primaryForeground : theme.textSecondary }]}>
                    {isDone ? '✓' : i + 1}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.stepLabel, { color: isActive ? theme.primary : theme.textSecondary }, isActive && { fontWeight: '700' }]}>
                  {tab.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {toast}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, keyboardPadding ? { paddingBottom: keyboardPadding + 100 } : null]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            {currentStep === 0 ? (
              <Pressable onPress={onCancel} style={[styles.cancelBtn, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <ThemedText style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</ThemedText>
              </Pressable>
            ) : (
              <Pressable onPress={onStepBack} style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <ThemedText style={[styles.backText, { color: theme.textSecondary }]}>← Back</ThemedText>
              </Pressable>
            )}
            {isLastStep ? (
              <Pressable onPress={onSubmit} disabled={submitting} style={[styles.primaryBtn, { backgroundColor: theme.accent }, submitting && styles.saving]}>
                <ThemedText style={[styles.primaryText, { color: theme.accentForeground }]}>{submitting ? 'Saving...' : submitLabel}</ThemedText>
              </Pressable>
            ) : (
              <Pressable onPress={onStepNext} disabled={submitting} style={[styles.primaryBtn, { backgroundColor: theme.accent }, submitting && styles.saving]}>
                {submitting
                  ? <ActivityIndicator size="small" color={theme.accentForeground} />
                  : <ThemedText style={[styles.primaryText, { color: theme.accentForeground }]}>Next →</ThemedText>}
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { alignItems: 'flex-start', paddingTop: 8, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 26, fontWeight: '500' },
  stepCount: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  stepper: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
  progressTrack: { height: 4, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 3, borderRadius: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', gap: 4, flex: 1 },
  stepDot: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumber: { fontSize: 12, fontWeight: '700' },
  stepLabel: { fontSize: 12, fontWeight: '600' },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: UI.radius,
    borderWidth: 1,
  },
  cancelText: { fontSize: 15, fontWeight: '600' },
  backBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: UI.radius,
    borderWidth: 1,
  },
  backText: { fontSize: 15, fontWeight: '600' },
  primaryBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: UI.radius },
  saving: { opacity: 0.5 },
  primaryText: { fontSize: 15, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 24 },
  footer: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 0, paddingTop: 16,
    borderTopWidth: 1,
  },
});
