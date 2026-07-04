import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export type FormTab = { key: string; label: string };

interface FormScreenProps {
  title: string;
  tabs: FormTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
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

const STEP_LABELS = ['Vehicle', 'Service', 'Billing'];
const PRIMARY = '#3D7A78';

export default function FormScreen({
  title, tabs, activeTab, onTabChange,
  onStepNext, onStepBack, onSubmit, onCancel,
  submitLabel = 'Save', submitting, toast, keyboardPadding, children,
}: FormScreenProps) {
  const { bottom } = useSafeAreaInsets();
  const currentStep = tabs.findIndex((t) => t.key === activeTab);
  const progress = ((currentStep + 1) / tabs.length) * 100;
  const isLastStep = currentStep === tabs.length - 1;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        <ThemedText style={styles.stepCount}>Step {currentStep + 1} of {tabs.length}</ThemedText>
      </View>

      <View style={styles.stepper}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.stepsRow}>
          {STEP_LABELS.map((label, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <Pressable key={label} style={styles.stepItem} onPress={() => onTabChange(tabs[i].key)}>
                <View style={[styles.stepDot, isActive && styles.stepDotActive, isDone && styles.stepDotDone]}>
                  <ThemedText style={[styles.stepNumber, (isActive || isDone) && styles.stepNumberActive]}>
                    {isDone ? '✓' : i + 1}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {toast}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, keyboardPadding ? { paddingBottom: keyboardPadding } : null]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: bottom || 0 }]}>
        {currentStep === 0 ? (
          <Pressable onPress={onCancel} style={styles.cancelBtn}>
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </Pressable>
        ) : (
          <Pressable onPress={onStepBack} style={styles.backBtn}>
            <ThemedText style={styles.backText}>← Back</ThemedText>
          </Pressable>
        )}
        {isLastStep ? (
          <Pressable onPress={onSubmit} disabled={submitting} style={[styles.primaryBtn, submitting && styles.saving]}>
            <ThemedText style={styles.primaryText}>{submitting ? 'Saving...' : submitLabel}</ThemedText>
          </Pressable>
        ) : (
          <Pressable onPress={onStepNext} style={styles.primaryBtn}>
            <ThemedText style={styles.primaryText}>Next →</ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F4' },
  flex: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 2, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  stepCount: { fontSize: 12, fontWeight: '500', color: '#8A8A80', marginTop: 2 },
  stepper: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
  progressTrack: { height: 3, backgroundColor: '#E8E0CC', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 3, backgroundColor: PRIMARY, borderRadius: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', gap: 4, flex: 1 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F0ECE3', alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: PRIMARY },
  stepDotDone: { backgroundColor: PRIMARY },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#8A8A80' },
  stepNumberActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 11, fontWeight: '600', color: '#8A8A80' },
  stepLabelActive: { color: PRIMARY, fontWeight: '700' },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E8E0CC', backgroundColor: '#FFFFFF',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#8A8A80' },
  backBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E8E0CC', backgroundColor: '#FFFFFF',
  },
  backText: { fontSize: 15, fontWeight: '600', color: '#8A8A80' },
  primaryBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: PRIMARY },
  saving: { opacity: 0.5 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 8 },
  footer: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#E8E0CC', backgroundColor: '#FFFFFF',
  },
});
