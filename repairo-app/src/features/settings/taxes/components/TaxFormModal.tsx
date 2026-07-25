import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Switch, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Toast from '@/components/ui/Toast';
import { taxService, type Tax } from '@/features/repairs/services/tax.service';

const PRESET_TAXES = [
  { name: 'GST', rate: 18, description: 'Standard India GST (18%)', is_inclusive: false, applies_to: 'all' as const },
  { name: 'VAT', rate: 20, description: 'Standard UK/EU VAT (20%)', is_inclusive: true, applies_to: 'all' as const },
  { name: 'Sales Tax', rate: 8, description: 'US Style Sales Tax', is_inclusive: false, applies_to: 'parts' as const },
  { name: 'HST', rate: 13, description: 'Canadian HST', is_inclusive: false, applies_to: 'all' as const },
  { name: 'PST', rate: 7, description: 'Canadian PST (Parts Only)', is_inclusive: false, applies_to: 'parts' as const },
];

const APPLIES_TO_OPTIONS = [
  { value: 'all', label: 'Everything', description: 'Parts + Labor', icon: 'layers-outline' as const },
  { value: 'parts', label: 'Only Parts', description: 'Spare parts only', icon: 'cube-outline' as const },
  { value: 'service', label: 'Only Labor', description: 'Service charges only', icon: 'construct-outline' as const },
];

interface TaxFormModalProps {
  mode: 'create' | 'edit';
  initialTax?: Tax | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaxFormModal({ mode, initialTax, onClose, onSuccess }: TaxFormModalProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(theme);
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    name: initialTax?.name || '',
    rate: initialTax ? String(initialTax.rate) : '',
    description: initialTax?.description || '',
    is_active: initialTax?.is_active ?? true,
    is_inclusive: initialTax?.is_inclusive ?? false,
    applies_to: (initialTax?.applies_to || 'all') as Tax['applies_to'],
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const applyPreset = useCallback((preset: typeof PRESET_TAXES[0]) => {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      rate: String(preset.rate),
      description: preset.description,
      is_inclusive: preset.is_inclusive,
      applies_to: preset.applies_to,
    }));
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) { showToast('Tax name is required', 'error'); return; }
    if (!form.rate || isNaN(Number(form.rate))) { showToast('Valid tax rate is required', 'error'); return; }
    if (Number(form.rate) <= 0) { showToast('Rate must be greater than 0', 'error'); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        rate: Number(form.rate),
        description: form.description.trim() || undefined,
        is_active: form.is_active,
        is_inclusive: form.is_inclusive,
        applies_to: form.applies_to,
      };

      const res = isEdit && initialTax
        ? await taxService.update(initialTax.id, payload)
        : await taxService.create(payload);

      if (res.success) {
        showToast(isEdit ? 'Tax updated successfully' : 'Tax created successfully');
        setTimeout(() => onSuccess(), 500);
      } else {
        showToast(res.error || 'Failed to save tax', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {isEdit ? `Edit ${initialTax?.name || 'Tax'}` : 'Add Tax Rule'}
          </ThemedText>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Quick Presets */}
          {!isEdit && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>QUICK PRESETS</ThemedText>
              <View style={styles.presetsRow}>
                {PRESET_TAXES.map((preset) => (
                  <Pressable
                    key={preset.name}
                    style={({ pressed }) => [styles.presetChip, pressed && styles.pressed, { borderColor: theme.border }]}
                    onPress={() => applyPreset(preset)}
                  >
                    <ThemedText style={[styles.presetRate, { color: theme.primary }]}>{preset.rate}%</ThemedText>
                    <ThemedText style={styles.presetName}>{preset.name}</ThemedText>
                    <View style={[styles.presetTag, { backgroundColor: theme.primary + '12' }]}>
                      <ThemedText style={[styles.presetTagText, { color: theme.primary }]}>
                        {preset.is_inclusive ? 'Incl.' : 'Excl.'}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Name */}
          <View style={styles.card}>
            <ThemedText style={styles.label}>Tax Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
              placeholder="e.g. GST, VAT, Sales Tax"
              placeholderTextColor={theme.tabIconDefault}
              returnKeyType="next"
            />
          </View>

          {/* Rate */}
          <View style={styles.card}>
            <ThemedText style={styles.label}>Tax Rate (%) *</ThemedText>
            <View style={styles.rateWrap}>
              <TextInput
                style={[styles.input, styles.rateInput]}
                value={form.rate}
                onChangeText={(v) => setForm((prev) => ({ ...prev, rate: v }))}
                placeholder="e.g. 18"
                placeholderTextColor={theme.tabIconDefault}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
              <ThemedText style={styles.rateSuffix}>%</ThemedText>
            </View>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <ThemedText style={styles.label}>Description (Optional)</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(v) => setForm((prev) => ({ ...prev, description: v }))}
              placeholder="e.g. Applied on all labor services"
              placeholderTextColor={theme.tabIconDefault}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          {/* Applies To */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>APPLIES TO</ThemedText>
            <View style={styles.optionGrid}>
              {APPLIES_TO_OPTIONS.map((opt) => {
                const active = form.applies_to === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={({ pressed }) => [
                      styles.optionCard,
                      pressed && styles.pressed,
                      active ? { backgroundColor: theme.primary + '10', borderColor: theme.primary + '40' } : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}
                    onPress={() => setForm((prev) => ({ ...prev, applies_to: opt.value as Tax['applies_to'] }))}
                  >
                    <Ionicons name={opt.icon} size={22} color={active ? theme.primary : theme.textSecondary} />
                    <ThemedText style={[styles.optionLabel, active && { color: theme.primary }]}>{opt.label}</ThemedText>
                    <ThemedText style={styles.optionDesc}>{opt.description}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Tax Calculation Mode */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>TAX CALCULATION MODE</ThemedText>
            <View style={styles.modeRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.modeCard,
                  pressed && styles.pressed,
                  !form.is_inclusive ? { backgroundColor: theme.primary + '10', borderColor: theme.primary + '40' } : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
                onPress={() => setForm((prev) => ({ ...prev, is_inclusive: false }))}
              >
                <View style={[styles.modeIcon, { backgroundColor: !form.is_inclusive ? theme.primary : theme.border }]}>
                  <Ionicons name="add-outline" size={20} color={!form.is_inclusive ? '#FFF' : theme.textSecondary} />
                </View>
                <ThemedText style={[styles.modeLabel, !form.is_inclusive && { color: theme.primary }]}>
                  Add on Top (Extra)
                </ThemedText>
                <ThemedText style={styles.modeDesc}>
                  Tax is calculated and added to total.
                </ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modeCard,
                  pressed && styles.pressed,
                  form.is_inclusive ? { backgroundColor: theme.primary + '10', borderColor: theme.primary + '40' } : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
                onPress={() => setForm((prev) => ({ ...prev, is_inclusive: true }))}
              >
                <View style={[styles.modeIcon, { backgroundColor: form.is_inclusive ? theme.primary : theme.border }]}>
                  <Ionicons name="layers-outline" size={20} color={form.is_inclusive ? '#FFF' : theme.textSecondary} />
                </View>
                <ThemedText style={[styles.modeLabel, form.is_inclusive && { color: theme.primary }]}>
                  Built-in (Inclusive)
                </ThemedText>
                <ThemedText style={styles.modeDesc}>
                  Price already has tax in it.
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Auto-Apply Toggle */}
          <View style={[styles.toggleCard, { borderColor: theme.border }]}>
            <View style={styles.toggleInfo}>
              <ThemedText style={styles.toggleLabel}>Auto-Apply to New Bills</ThemedText>
              <ThemedText style={styles.toggleDesc}>
                Automatically added to every new bill
              </ThemedText>
            </View>
            <Switch
              value={form.is_active}
              onValueChange={(v) => setForm((prev) => ({ ...prev, is_active: v }))}
              trackColor={{ false: theme.divider, true: theme.primary + '60' }}
              thumbColor={form.is_active ? theme.primary : theme.textSecondary}
              ios_backgroundColor={theme.divider}
            />
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.pressed,
              submitting && styles.disabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnInner}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <ThemedText style={styles.submitText}>
                  {isEdit ? 'Save Changes' : 'Create Tax Rule'}
                </ThemedText>
              </View>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.border,
      backgroundColor: theme.card,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.backgroundElement,
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },

    section: { gap: 10 },
    sectionTitle: {
      fontSize: 12, fontWeight: '700', color: theme.textSecondary,
      letterSpacing: 1, marginLeft: 2,
    },

    presetsRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    },
    presetChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 10,
      borderRadius: 12, borderWidth: 1,
    },
    presetRate: { fontSize: 14, fontWeight: '800' },
    presetName: { fontSize: 13, fontWeight: '600', color: theme.text },
    presetTag: {
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    presetTagText: { fontSize: 9, fontWeight: '700' },

    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      gap: 10,
    },
    label: {
      fontSize: 13, fontWeight: '600', color: theme.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.3,
    },
    input: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
    rateInput: { textAlign: 'right', paddingRight: 40 },
    rateWrap: { position: 'relative' },
    rateSuffix: {
      position: 'absolute',
      right: 14,
      top: 0,
      bottom: 0,
      textAlignVertical: 'center',
      fontSize: 16,
      fontWeight: '700',
      color: theme.textSecondary,
      lineHeight: 48,
    },
    textArea: { minHeight: 70 },

    optionGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    optionCard: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      gap: 6,
    },
    optionLabel: { fontSize: 12, fontWeight: '700', color: theme.text, textAlign: 'center' },
    optionDesc: { fontSize: 10, fontWeight: '500', color: theme.textSecondary, textAlign: 'center' },

    modeRow: {
      flexDirection: 'row',
      gap: 10,
    },
    modeCard: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      gap: 10,
    },
    modeIcon: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    modeLabel: { fontSize: 13, fontWeight: '700', color: theme.text },
    modeDesc: { fontSize: 10, fontWeight: '500', color: theme.textSecondary, lineHeight: 14 },

    toggleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
    },
    toggleInfo: { flex: 1, gap: 2, marginRight: 12 },
    toggleLabel: { fontSize: 15, fontWeight: '600', color: theme.text },
    toggleDesc: { fontSize: 11, fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

    submitBtn: {
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    pressed: { opacity: 0.82 },
    disabled: { opacity: 0.6 },
  }), [theme]);
  return styles;
};
