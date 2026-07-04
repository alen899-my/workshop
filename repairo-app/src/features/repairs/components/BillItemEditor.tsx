import { useCallback } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { BillItem, TaxSnapshotItem } from '@/features/repairs/services/bill.service';
import type { Tax } from '@/features/repairs/services/tax.service';

import TaxSelector from './TaxSelector';

const PRIMARY = '#3D7A78';

interface BillItemEditorProps {
  items: BillItem[];
  onChange: (items: BillItem[]) => void;
  serviceCharge: number;
  onServiceChargeChange: (v: number) => void;
  paymentStatus: string;
  onPaymentStatusChange: (v: string) => void;
  taxes: Tax[];
  taxSnapshot: TaxSnapshotItem[];
  onTaxChange: (t: TaxSnapshotItem[]) => void;
}

export default function BillItemEditor({
  items, onChange, serviceCharge, onServiceChargeChange,
  paymentStatus, onPaymentStatusChange,
  taxes, taxSnapshot, onTaxChange,
}: BillItemEditorProps) {
  const addItem = useCallback(() => {
    const newItem: BillItem = { id: Date.now().toString(), name: '', qty: 1, cost: 0 };
    onChange([...items, newItem]);
  }, [items, onChange]);

  const updateItem = useCallback((i: number, field: keyof BillItem, val: string | number) => {
    const updated = [...items];
    (updated[i] as any)[field] = val;
    onChange(updated);
  }, [items, onChange]);

  const removeItem = useCallback((i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
  }, [items, onChange]);

  const subtotal = items.reduce((sum, item) => sum + (item.cost || 0) * (item.qty || 0), 0);
  const taxTotal = taxSnapshot.reduce((sum, t) => sum + t.amount, 0);
  const grandTotal = subtotal + serviceCharge + taxTotal;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Parts & Services</ThemedText>

        {items.map((item, i) => (
          <View key={item.id} style={styles.itemRow}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={item.name}
              onChangeText={(t) => updateItem(i, 'name', t)}
              placeholder="Item name"
              placeholderTextColor="#B0AA97"
            />
            <TextInput
              style={[styles.input, styles.qtyInput]}
              value={String(item.qty)}
              onChangeText={(t) => updateItem(i, 'qty', Number(t) || 0)}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor="#B0AA97"
            />
            <TextInput
              style={[styles.input, styles.costInput]}
              value={String(item.cost)}
              onChangeText={(t) => updateItem(i, 'cost', Number(t) || 0)}
              keyboardType="numeric"
              placeholder="Price"
              placeholderTextColor="#B0AA97"
            />
            <ThemedText style={styles.itemTotal}>₹{(item.cost * item.qty).toFixed(0)}</ThemedText>
            <Pressable onPress={() => removeItem(i)} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#E5544D" />
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.addBtn} onPress={addItem}>
          <Ionicons name="add-circle" size={18} color={PRIMARY} />
          <ThemedText style={styles.addBtnText}>Add Item</ThemedText>
        </Pressable>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Service Charge</ThemedText>
        <TextInput
          style={styles.chargeInput}
          value={String(serviceCharge)}
          onChangeText={(t) => onServiceChargeChange(Number(t) || 0)}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#B0AA97"
        />
      </View>

      <TaxSelector taxes={taxes} selected={taxSnapshot} onChange={onTaxChange} subtotal={subtotal} serviceCharge={serviceCharge} />

      <View style={styles.summaryCard}>
        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>Subtotal</ThemedText>
          <ThemedText style={styles.totalValue}>₹{subtotal.toFixed(2)}</ThemedText>
        </View>
        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>Service Charge</ThemedText>
          <ThemedText style={styles.totalValue}>₹{serviceCharge.toFixed(2)}</ThemedText>
        </View>
        {taxSnapshot.map((t) => (
          <View key={t.id} style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>{t.name} ({t.rate}%)</ThemedText>
            <ThemedText style={styles.totalValue}>₹{t.amount.toFixed(2)}</ThemedText>
          </View>
        ))}
        <View style={[styles.totalRow, styles.grandRow]}>
          <ThemedText style={styles.grandLabel}>Grand Total</ThemedText>
          <ThemedText style={styles.grandValue}>₹{grandTotal.toFixed(2)}</ThemedText>
        </View>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Payment Status</ThemedText>
        <View style={styles.segmentRow}>
          {['Unpaid', 'Paid'].map((s) => {
            const active = paymentStatus === s;
            return (
              <Pressable
                key={s}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => onPaymentStatusChange(s)}
              >
                <ThemedText style={[styles.segmentText, active && styles.segmentTextActive]}>{s}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12, paddingBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    borderRadius: 10, borderWidth: 1, borderColor: '#E8E0CC',
    paddingHorizontal: 10, paddingVertical: 10, fontSize: 14,
    backgroundColor: '#F8F7F4', color: '#1A1A1A',
  },
  nameInput: { flex: 1 },
  qtyInput: { width: 48, textAlign: 'center' },
  costInput: { width: 64, textAlign: 'right' },
  itemTotal: { width: 52, textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: PRIMARY + '08', alignSelf: 'flex-start' },
  addBtnText: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  chargeInput: {
    borderRadius: 10, borderWidth: 1, borderColor: '#E8E0CC',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    backgroundColor: '#F8F7F4', color: '#1A1A1A', textAlign: 'right', fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalLabel: { fontSize: 14, color: '#8A8A80' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  grandRow: { borderTopWidth: 1, borderTopColor: '#E8E0CC', paddingTop: 8, marginTop: 4 },
  grandLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  grandValue: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  segmentRow: { flexDirection: 'row', borderRadius: 10, backgroundColor: '#F0ECE3', padding: 3 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  segmentActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#8A8A80' },
  segmentTextActive: { color: PRIMARY, fontWeight: '700' },
});
