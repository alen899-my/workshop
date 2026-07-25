import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import InputField from '@/components/ui/InputField';
import Toast from '@/components/ui/Toast';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { billService } from '@/features/repairs/services/bill.service';
import type { Repair } from '@/features/repairs/services/repair.service';

interface EditBillModalProps {
  visible: boolean;
  repair: Repair | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBillModal({ visible, repair, onClose, onSuccess }: EditBillModalProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [hasExistingBill, setHasExistingBill] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    if (visible && repair?.id) {
      setAmount('');
      setHasExistingBill(false);
      billService.getByRepairId(repair.id).then((res) => {
        if (res.success && res.data) {
          const items = (res.data as any).items;
          if (items && items.length > 0) {
            setAmount(String(items[0].cost || ''));
            setHasExistingBill(true);
          }
        }
      });
    }
  }, [visible, repair?.id]);

  const handleSave = useCallback(async () => {
    if (!repair?.id) return;

    setSubmitting(true);
    try {
      const val = parseFloat(amount) || 0;
      const billData = {
        items: val > 0 ? [{ name: 'Quick Repair Service', qty: 1, cost: val }] : [],
        service_charge: 0,
        tax_snapshot: [] as any[],
        tax_total: 0,
        payment_status: 'Unpaid' as const,
      };

      const res = await billService.saveBill(repair.id, billData);
      if (res.success) {
        showToast('Bill updated', 'success');
        setTimeout(() => { onSuccess(); }, 800);
      } else {
        showToast(res.error || 'Failed to update bill', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [repair?.id, amount, onSuccess, showToast]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ThemedText style={styles.title}>Edit Bill</ThemedText>
          <ThemedText style={styles.subtitle}>{repair?.vehicle_number}</ThemedText>

          <InputField
            label="Bill Amount"
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            icon="currency-usd"
            keyboardType="phone-pad"
          />

          <ThemedText style={styles.hint}>
            {hasExistingBill
              ? 'Update the bill amount. Leave empty to remove the bill.'
              : 'Enter an amount to create a bill for this repair.'}
          </ThemedText>

          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
              onPress={onClose}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, submitting && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={submitting}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <ThemedText style={styles.saveText}>{submitting ? 'Saving...' : 'Save'}</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </Modal>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingBottom: 36,
      paddingTop: 4,
      gap: 16,
    },
    handleRow: { alignItems: 'center', paddingVertical: 10 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border },
    title: { fontSize: 18, fontWeight: '800', color: theme.text, textAlign: 'center' },
    subtitle: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, textAlign: 'center', marginTop: -10 },
    hint: { fontSize: 11, fontWeight: '500', color: theme.tabIconDefault, lineHeight: 16, textAlign: 'center' },
    btnRow: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelBtn: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: { fontSize: 15, fontWeight: '700', color: theme.text },
    saveBtn: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    saveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  });
};
