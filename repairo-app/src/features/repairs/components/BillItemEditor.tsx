import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { BillItem, TaxSnapshotItem } from '@/features/repairs/services/bill.service';
import type { Tax } from '@/features/repairs/services/tax.service';
import { useCurrency } from '@/hooks/use-currency';
import TaxSelector from './TaxSelector';

const PRIMARY = '#3D7A78';

interface BillItemEditorProps {
  items: BillItem[];
  onChange: (items: BillItem[]) => void;
  serviceCharge: number;
  onServiceChargeChange: (v: number) => void;
  paymentStatus: string;
  onPaymentStatusChange: (v: string) => void;
  paymentMethod?: string | null;
  onPaymentMethodChange?: (v: string | null) => void;
  taxes: Tax[];
  taxSnapshot: TaxSnapshotItem[];
  onTaxChange: (t: TaxSnapshotItem[]) => void;
}

// ── Individual Item Card ────────────────────────────────────────────────────
const BillItemRow = memo(({ item, index, onUpdate, onRemove, currency }: {
  item: BillItem;
  index: number;
  onUpdate: (item: BillItem) => void;
  onRemove: () => void;
  currency: string;
}) => {
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(String(item.qty ?? 1));
  const [cost, setCost] = useState(String(item.cost ?? 0));

  useEffect(() => {
    setName(item.name);
    setQty(String(item.qty ?? 1));
    setCost(String(item.cost ?? 0));
  }, [item]);

  const commit = () => {
    onUpdate({ ...item, name, qty: Number(qty) || 0, cost: Number(cost) || 0 });
  };

  const handleQtyChange = (val: string) => {
    setQty(val);
    onUpdate({ ...item, name, qty: Number(val) || 0, cost: Number(cost) || 0 });
  };

  const handleCostChange = (val: string) => {
    setCost(val);
    onUpdate({ ...item, name, qty: Number(qty) || 0, cost: Number(val) || 0 });
  };

  const lineTotal = (Number(qty) || 0) * (Number(cost) || 0);

  return (
    <View style={styles.itemCard}>
      {/* Card Header: Item # + line total + delete */}
      <View style={styles.itemCardHeader}>
        <View style={styles.itemBadge}>
          <ThemedText style={styles.itemBadgeText}>Item {index + 1}</ThemedText>
        </View>
        <View style={styles.itemCardHeaderRight}>
          <ThemedText style={styles.lineTotalLabel}>
        {currency}{lineTotal.toFixed(2)}
      </ThemedText>
          <Pressable style={styles.deleteBtn} onPress={onRemove} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color="#E5544D" />
          </Pressable>
        </View>
      </View>

      {/* Full-width name input */}
      <TextInput
        style={[styles.field, styles.nameField]}
        value={name}
        onChangeText={setName}
        onBlur={commit}
        onEndEditing={commit}
        placeholder="Part / service name..."
        placeholderTextColor="#B0AA97"
        returnKeyType="next"
      />

      {/* Qty + Cost side-by-side */}
      <View style={styles.itemRow}>
        <View style={styles.halfCol}>
          <ThemedText style={styles.fieldLabel}>Quantity</ThemedText>
          <TextInput
            style={[styles.field, styles.centerField]}
            value={qty}
            onChangeText={handleQtyChange}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor="#B0AA97"
            returnKeyType="next"
          />
        </View>
        <View style={styles.halfCol}>
          <ThemedText style={styles.fieldLabel}>Unit Price ({currency})</ThemedText>
          <TextInput
            style={[styles.field, styles.rightField]}
            value={cost}
            onChangeText={handleCostChange}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#B0AA97"
            returnKeyType="done"
          />
        </View>
      </View>
    </View>
  );
});

// ── Main Editor ─────────────────────────────────────────────────────────────
export default function BillItemEditor({
  items, onChange, serviceCharge, onServiceChargeChange,
  paymentStatus, onPaymentStatusChange,
  paymentMethod, onPaymentMethodChange,
  taxes, taxSnapshot, onTaxChange,
}: BillItemEditorProps) {
  const currency = useCurrency();
  const [localCharge, setLocalCharge] = useState(String(serviceCharge || ''));

  useEffect(() => {
    setLocalCharge(String(serviceCharge || ''));
  }, [serviceCharge]);

  const addItem = useCallback(() => {
    const newItem: BillItem = { id: Date.now().toString(), name: '', qty: 1, cost: 0 };
    onChange([...items, newItem]);
  }, [items, onChange]);

  const handleRowUpdate = useCallback((index: number, updated: BillItem) => {
    const copy = [...items];
    copy[index] = updated;
    onChange(copy);
  }, [items, onChange]);

  const handleRowRemove = useCallback((index: number) => {
    onChange(items.filter((_, i) => i !== index));
  }, [items, onChange]);

  const subtotal = items.reduce((s, it) => s + (Number(it.cost) || 0) * (Number(it.qty) || 0), 0);
  // Only exclusive taxes add to the total — inclusive taxes are already embedded in item prices
  const exclusiveTaxTotal = taxSnapshot
    .filter(t => !t.is_inclusive)
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const grandTotal = subtotal + Number(serviceCharge || 0) + exclusiveTaxTotal;

  return (
    <View style={styles.wrapper}>

      {/* ── Parts & Services card ────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="construct-outline" size={18} color={PRIMARY} />
          <ThemedText style={styles.sectionTitle}>Parts & Services</ThemedText>
        </View>

        {items.length === 0 ? (
          <Pressable style={styles.emptyCard} onPress={addItem}>
            <Ionicons name="receipt-outline" size={32} color={PRIMARY + '60'} />
            <ThemedText style={styles.emptyText}>Tap to add parts or services</ThemedText>
          </Pressable>
        ) : (
          <View style={styles.itemList}>
            {items.map((item, i) => (
              <BillItemRow
                key={item.id || String(i)}
                item={item}
                index={i}
                currency={currency}
                onUpdate={(updated) => handleRowUpdate(i, updated)}
                onRemove={() => handleRowRemove(i)}
              />
            ))}
            {/* Inline add button at the bottom of list */}
            <Pressable style={styles.inlineAddBtn} onPress={addItem}>
              <Ionicons name="add-circle-outline" size={18} color={PRIMARY} />
              <ThemedText style={styles.inlineAddBtnText}>Add another item</ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Service Charge ───────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="pricetag-outline" size={18} color={PRIMARY} />
          <ThemedText style={styles.sectionTitle}>Service Charge</ThemedText>
        </View>
        <View style={styles.chargeRow}>
          <ThemedText style={styles.currencySymbol}>{currency}</ThemedText>
          <TextInput
            style={styles.chargeField}
            value={localCharge}
            onChangeText={setLocalCharge}
            onBlur={() => onServiceChargeChange(Number(localCharge) || 0)}
            onEndEditing={() => onServiceChargeChange(Number(localCharge) || 0)}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#B0AA97"
          />
        </View>
      </View>

      {/* ── Taxes ────────────────────────────────────────────── */}
      <TaxSelector
        taxes={taxes}
        selected={taxSnapshot}
        onChange={onTaxChange}
        subtotal={subtotal}
        serviceCharge={serviceCharge}
      />

      {/* ── Summary ──────────────────────────────────────────── */}
      <View style={styles.summaryCard}>
        {/* Section title */}
        <View style={styles.summaryTitleRow}>
          <Ionicons name="calculator-outline" size={16} color={PRIMARY} />
          <ThemedText style={styles.summaryTitle}>Bill Summary</ThemedText>
        </View>

        {/* Individual item lines */}
        {items.filter(it => it.name?.trim() || (it.qty && it.cost)).map((it, i) => {
          const lineAmt = (Number(it.cost) || 0) * (Number(it.qty) || 0);
          const label = it.name?.trim() || `Item ${i + 1}`;
          return (
            <View key={i} style={styles.summaryItemRow}>
              <View style={styles.summaryItemLeft}>
                <ThemedText style={styles.summaryItemName} numberOfLines={1}>{label}</ThemedText>
                <ThemedText style={styles.summaryItemQty}>
                  {it.qty} × {currency}{Number(it.cost || 0).toFixed(2)}
                </ThemedText>
              </View>
              <ThemedText style={styles.summaryItemAmt}>{currency}{lineAmt.toFixed(2)}</ThemedText>
            </View>
          );
        })}

        {items.length > 0 && <View style={styles.thinDivider} />}

        {/* Service charge */}
        {Number(serviceCharge) > 0 && (
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Service Charge</ThemedText>
            <ThemedText style={styles.summaryValue}>{currency}{Number(serviceCharge).toFixed(2)}</ThemedText>
          </View>
        )}

        {/* Taxes — inclusive shown as info, exclusive add to total */}
        {taxSnapshot.map((t) => (
          <View key={t.id} style={styles.summaryRow}>
            <View style={styles.summaryTaxLabelWrap}>
              <ThemedText style={styles.summaryLabel}>{t.name} ({t.rate}%)</ThemedText>
              <View style={[styles.taxTypeBadge, t.is_inclusive ? styles.taxTypeBadgeInclusive : styles.taxTypeBadgeExclusive]}>
                <ThemedText style={[styles.taxTypeBadgeText, t.is_inclusive ? styles.taxTypeBadgeTextInclusive : styles.taxTypeBadgeTextExclusive]}>
                  {t.is_inclusive ? 'incl.' : '+excl.'}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.summaryValue, t.is_inclusive && styles.summaryValueMuted]}>
              {t.is_inclusive ? '' : '+'}{currency}{Number(t.amount || 0).toFixed(2)}
            </ThemedText>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Grand total */}
        <View style={styles.summaryRow}>
          <ThemedText style={styles.grandLabel}>Grand Total</ThemedText>
          <ThemedText style={styles.grandValue}>{currency}{Number(grandTotal).toFixed(2)}</ThemedText>
        </View>
      </View>

      {/* ── Payment Status ───────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="card-outline" size={18} color={PRIMARY} />
          <ThemedText style={styles.sectionTitle}>Payment Status</ThemedText>
        </View>
        <View style={styles.segmentRow}>
          {['Unpaid', 'Paid'].map((s) => {
            const active = paymentStatus === s;
            const isPaid = s === 'Paid';
            return (
              <Pressable
                key={s}
                style={[
                  styles.segment,
                  active && (isPaid ? styles.segmentActivePaid : styles.segmentActiveUnpaid),
                ]}
                onPress={() => onPaymentStatusChange(s)}
              >
                <Ionicons
                  name={isPaid ? 'checkmark-circle-outline' : 'time-outline'}
                  size={18}
                  color={active ? '#FFFFFF' : '#8A8A80'}
                />
                <ThemedText style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {s}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Payment Method (Only if Paid) ────────────────────── */}
      {paymentStatus === 'Paid' && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="wallet-outline" size={18} color={PRIMARY} />
            <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>
          </View>
          <View style={styles.segmentRow}>
            {['Cash', 'Online'].map((m) => {
              const active = paymentMethod === m;
              return (
                <Pressable
                  key={m}
                  style={[
                    styles.segment,
                    active && styles.segmentActivePaid,
                  ]}
                  onPress={() => onPaymentMethodChange?.(m)}
                >
                  <Ionicons
                    name={m === 'Cash' ? 'cash-outline' : 'globe-outline'}
                    size={18}
                    color={active ? '#FFFFFF' : '#8A8A80'}
                  />
                  <ThemedText style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {m}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14, paddingBottom: 16 },

  // ── Sections
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Empty state
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: PRIMARY + '40',
    borderRadius: 14,
    backgroundColor: PRIMARY + '06',
  },
  emptyText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },

  // ── Item list
  itemList: { gap: 10 },
  itemCard: {
    backgroundColor: '#F8F7F4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    padding: 14,
    gap: 10,
  },
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemBadge: {
    backgroundColor: PRIMARY + '14',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
  },
  itemCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lineTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: PRIMARY,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF0EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5544D22',
  },
  itemRow: { flexDirection: 'row', gap: 10 },
  halfCol: { flex: 1, gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#8A8A80', textTransform: 'uppercase', letterSpacing: 0.3 },
  field: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  nameField: { fontSize: 15 },
  centerField: { textAlign: 'center' },
  rightField: { textAlign: 'right' },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PRIMARY + '50',
  },
  inlineAddBtnText: { fontSize: 13, fontWeight: '600', color: PRIMARY },

  // ── Service Charge
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
  },
  currencySymbol: {
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#8A8A80',
  },
  chargeField: {
    flex: 1,
    paddingVertical: 13,
    paddingRight: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'right',
  },

  // ── Summary
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItemLeft: {
    flex: 1,
    marginRight: 8,
    gap: 1,
  },
  summaryItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryItemQty: {
    fontSize: 12,
    color: '#8A8A80',
    fontWeight: '500',
  },
  summaryItemAmt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  thinDivider: {
    height: 1,
    backgroundColor: '#F0ECE3',
    marginVertical: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#8A8A80', fontWeight: '500' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  summaryValueMuted: { color: '#8A8A80', fontWeight: '500' },
  summaryTaxLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  taxTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  taxTypeBadgeInclusive: { backgroundColor: '#EBF8FF' },
  taxTypeBadgeExclusive: { backgroundColor: '#FFF3E0' },
  taxTypeBadgeText: { fontSize: 10, fontWeight: '700' },
  taxTypeBadgeTextInclusive: { color: '#2B6CB0' },
  taxTypeBadgeTextExclusive: { color: '#C05621' },
  divider: { height: 1.5, backgroundColor: '#E8E0CC', marginVertical: 4 },
  grandLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  grandValue: { fontSize: 20, fontWeight: '900', color: PRIMARY },

  // ── Payment
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    backgroundColor: '#F8F7F4',
  },
  segmentActivePaid: {
    backgroundColor: '#3D7A78',
    borderColor: '#3D7A78',
  },
  segmentActiveUnpaid: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  segmentText: { fontSize: 14, fontWeight: '700', color: '#8A8A80' },
  segmentTextActive: { color: '#FFFFFF' },
});
