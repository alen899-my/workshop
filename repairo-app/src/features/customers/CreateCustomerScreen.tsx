import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Toast from '@/components/ui/Toast';
import { customerService } from '@/features/customers/services/customer.service';
import type { Customer } from '@/features/customers/services/customer.service';

interface CreateCustomerScreenProps {
  mode?: 'create' | 'edit';
  initialCustomer?: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCustomerScreen({
  mode = 'create',
  initialCustomer,
  onClose,
  onSuccess,
}: CreateCustomerScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(theme);
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    name: initialCustomer?.name || '',
    phone: initialCustomer?.phone || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!form.name.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }
    if (!form.phone.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (isEdit && initialCustomer) {
        res = await customerService.update(initialCustomer.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
        });
      } else {
        res = await customerService.create({
          name: form.name.trim(),
          phone: form.phone.trim(),
        });
      }

      if (res.success) {
        showToast(isEdit ? 'Customer updated successfully' : 'Customer added successfully');
        setTimeout(() => onSuccess(), 500);
      } else {
        showToast(res.error || 'Failed to save customer', 'error');
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
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#1A1A1A" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {isEdit ? 'Edit Customer' : 'Add Customer'}
          </ThemedText>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <ThemedText style={styles.label}>Customer Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => update('name', v)}
              placeholder="Full name"
              placeholderTextColor="#B0AA97"
              returnKeyType="next"
            />
          </View>

          <View style={styles.card}>
            <ThemedText style={styles.label}>Phone Number *</ThemedText>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
              placeholder="Phone number"
              placeholderTextColor="#B0AA97"
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
                  {isEdit ? 'Update Customer' : 'Add Customer'}
                </ThemedText>
              </View>
            )}
          </Pressable>
        </View>

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
      backgroundColor: theme.muted,
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    scrollContent: { padding: 16, gap: 14, paddingBottom: 120 },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      gap: 10,
    },
    label: { fontSize: 13, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
    input: {
      backgroundColor: theme.muted,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
    footer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 16, paddingTop: 12,
      backgroundColor: theme.card,
      borderTopWidth: 1, borderTopColor: theme.border,
    },
    submitBtn: {
      height: 50, borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    pressed: { opacity: 0.82 },
    disabled: { opacity: 0.6 },
  }), [theme]);
  return styles;
};
