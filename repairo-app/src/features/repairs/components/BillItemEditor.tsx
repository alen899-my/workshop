import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { BillItem, TaxSnapshotItem } from '@/features/repairs/services/bill.service';
import type { Tax } from '@/features/repairs/services/tax.service';
import { useCurrency } from '@/hooks/use-currency';
import { useTheme } from '@/hooks/use-theme';
import TaxSelector from './TaxSelector';

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
  editable?: boolean;
}

export interface BillItemEditorHandle {
  getSnapshot: () => { items: BillItem[]; serviceCharge: number };
}

export default forwardRef<BillItemEditorHandle, BillItemEditorProps>(function BillItemEditor({
  items, onChange, serviceCharge, onServiceChargeChange,
  paymentStatus, onPaymentStatusChange,
  paymentMethod, onPaymentMethodChange,
  taxes, taxSnapshot, onTaxChange,
  editable = true,
}: BillItemEditorProps, ref) {
  const theme = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    wrapper: { gap: 14, paddingBottom: 16 },

    section: {
      backgroundColor: theme.card,
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
      color: theme.text,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.primary,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },
    addBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primaryForeground,
    },

    emptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 28,
      gap: 10,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.primary + '40',
      borderRadius: 14,
      backgroundColor: theme.primary + '06',
    },
    emptyText: {
      fontSize: 13,
      color: theme.primary,
      fontWeight: '600',
    },
    noItemsText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 20,
    },

    itemList: { gap: 10 },
    itemCard: {
      backgroundColor: theme.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 10,
    },
    itemCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemBadge: {
      backgroundColor: theme.primary + '14',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    itemBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.primary,
    },
    itemCardHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    lineTotalLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.primary,
    },
    deleteBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.destructive + '14',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.destructive + '22',
    },
    itemRow: { flexDirection: 'row', gap: 10 },
    halfCol: { flex: 1, gap: 5 },
    fieldLabel: { fontSize: 11, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
    field: {
      backgroundColor: theme.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 15,
      color: theme.text,
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
      borderColor: theme.primary + '50',
    },
    inlineAddBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },

    chargeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    currencySymbol: {
      paddingHorizontal: 14,
      fontSize: 18,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    chargeField: {
      flex: 1,
      paddingVertical: 13,
      paddingRight: 16,
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'right',
    },

    summaryCard: {
      backgroundColor: theme.card,
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
      color: theme.primary,
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
      color: theme.text,
    },
    summaryItemQty: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    summaryItemAmt: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    thinDivider: {
      height: 1,
      backgroundColor: theme.divider,
      marginVertical: 2,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
    summaryValue: { fontSize: 13, fontWeight: '600', color: theme.text },
    summaryValueMuted: { color: theme.textSecondary, fontWeight: '500' },
    summaryTaxLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    taxTypeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
    },
    taxTypeBadgeInclusive: { backgroundColor: theme.primaryLight },
    taxTypeBadgeExclusive: { backgroundColor: theme.warning + '22' },
    taxTypeBadgeText: { fontSize: 10, fontWeight: '700' },
    taxTypeBadgeTextInclusive: { color: theme.primary },
    taxTypeBadgeTextExclusive: { color: theme.warning },
    divider: { height: 1.5, backgroundColor: theme.border, marginVertical: 4 },
    grandLabel: { fontSize: 16, fontWeight: '800', color: theme.text },
    grandValue: { fontSize: 20, fontWeight: '900', color: theme.primary },

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
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    segmentActivePaid: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    segmentActiveUnpaid: {
      backgroundColor: theme.destructive,
      borderColor: theme.destructive,
    },
    segmentText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
    segmentTextActive: { color: theme.primaryForeground },
  }), [theme]);

  const { symbol, format } = useCurrency();
  const [localCharge, setLocalCharge] = useState(String(serviceCharge || ''));
  const [liveValues, setLiveValues] = useState<Record<string, { qty: number; cost: number }>>({});
  const itemsKeyRef = useRef('');

  useEffect(() => {
    setLocalCharge(String(serviceCharge || ''));
  }, [serviceCharge]);

  useEffect(() => {
    const key = items.map(i => `${i.id}|${i.name}|${i.qty}|${i.cost}`).join('::');
    if (key !== itemsKeyRef.current) {
      itemsKeyRef.current = key;
      const ids = new Set(items.map(i => i.id));
      setLiveValues(prev => {
        const next = Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id)));
        return next;
      });
    }
  }, [items]);

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

  const handleLiveUpdate = useCallback((id: string | undefined, qty: number, cost: number) => {
    if (!id) return;
    setLiveValues(prev => ({ ...prev, [id]: { qty, cost } }));
  }, []);

  const subtotal = items.reduce((s, it) => s + (Number(it.cost) || 0) * (Number(it.qty) || 0), 0);

  const liveSubtotal = useMemo(() =>
    items.reduce((s, it) => {
      const live = it.id ? liveValues[it.id] : undefined;
      const qty = (live?.qty ?? Number(it.qty)) || 0;
      const cost = (live?.cost ?? Number(it.cost)) || 0;
      return s + qty * cost;
    }, 0),
  [items, liveValues]);

  const liveServiceCharge = Number(localCharge) || 0;

  const liveTaxes = useMemo(() =>
    taxSnapshot.map((t) => {
      const base = t.applies_to === 'service' ? liveServiceCharge
                 : t.applies_to === 'all' ? liveSubtotal + liveServiceCharge
                 : liveSubtotal;
      const amount = t.is_inclusive
        ? base - base / (1 + t.rate / 100)
        : base * (t.rate / 100);
      return { ...t, amount: Math.round(amount * 100) / 100 };
    }),
  [taxSnapshot, liveSubtotal, liveServiceCharge]);

  const liveExclusiveTaxTotal = useMemo(
    () => liveTaxes.filter(t => !t.is_inclusive).reduce((s, t) => s + Number(t.amount || 0), 0),
    [liveTaxes],
  );

  const liveGrandTotal = liveSubtotal + liveServiceCharge + liveExclusiveTaxTotal;

  useImperativeHandle(ref, () => ({
    getSnapshot: () => ({
      items: items.map(it => {
        const live = liveValues[it.id || ''];
        if (!live) return it;
        return { ...it, qty: live.qty, cost: live.cost };
      }),
      serviceCharge: liveServiceCharge,
    }),
  }), [items, liveValues, liveServiceCharge]);

  const exclusiveTaxTotal = taxSnapshot
    .filter(t => !t.is_inclusive)
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const grandTotal = subtotal + Number(serviceCharge || 0) + exclusiveTaxTotal;

  useEffect(() => {
    if (taxSnapshot.length === 0) return;
    const updated = taxSnapshot.map((t) => {
      const base = t.applies_to === 'service' ? Number(serviceCharge || 0)
                 : t.applies_to === 'all' ? subtotal + Number(serviceCharge || 0)
                 : subtotal;
      const amount = t.is_inclusive
        ? base - base / (1 + t.rate / 100)
        : base * (t.rate / 100);
      return { ...t, amount: Math.round(amount * 100) / 100 };
    });
    const changed = updated.some((u, i) => u.amount !== taxSnapshot[i]?.amount);
    if (changed) onTaxChange(updated);
  }, [subtotal, serviceCharge]);

  const BillItemRow = useCallback(memo(function BillItemRowInner({ item, index, onUpdate, onRemove, onLiveUpdate, editable }: {
    item: BillItem;
    index: number;
    onUpdate: (item: BillItem) => void;
    onRemove: () => void;
    onLiveUpdate: (id: string | undefined, qty: number, cost: number) => void;
    editable: boolean;
  }) {
    const normalizedCost = (v: unknown) => String(Number(v) || 0);
    const normalizedQty = (v: unknown) => String(Math.max(Number(v) || 1, 1));

    const [name, setName] = useState(item.name);
    const [qty, setQty] = useState(normalizedQty(item.qty));
    const [cost, setCost] = useState(normalizedCost(item.cost));

    const itemKey = `${item.id}-${item.name}-${item.qty}-${item.cost}`;
    useEffect(() => {
      setName(item.name);
      setQty(normalizedQty(item.qty));
      setCost(normalizedCost(item.cost));
    }, [itemKey]);

    const commit = useCallback(() => {
      onUpdate({ ...item, name, qty: Number(qty) || 0, cost: Number(cost) || 0 });
    }, [item, name, qty, cost, onUpdate]);

    const handleQtyChange = useCallback((val: string) => {
      setQty(val);
      onLiveUpdate(item.id, Number(val) || 0, Number(cost) || 0);
    }, [item.id, cost, onLiveUpdate]);

    const handleCostChange = useCallback((val: string) => {
      setCost(val);
      onLiveUpdate(item.id, Number(qty) || 0, Number(val) || 0);
    }, [item.id, qty, onLiveUpdate]);

    const lineTotal = (Number(qty) || 0) * (Number(cost) || 0);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemCardHeader}>
          <View style={styles.itemBadge}>
            <ThemedText style={styles.itemBadgeText}>Item {index + 1}</ThemedText>
          </View>
          <View style={styles.itemCardHeaderRight}>
            <ThemedText style={styles.lineTotalLabel}>
              {format(lineTotal)}
            </ThemedText>
            {editable && (
              <Pressable style={styles.deleteBtn} onPress={onRemove} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={theme.destructive} />
              </Pressable>
            )}
          </View>
        </View>

        <TextInput
          style={[styles.field, styles.nameField]}
          value={name}
          onChangeText={setName}
          onBlur={commit}
          onEndEditing={commit}
          placeholder={editable ? 'Part / service name...' : ''}
          placeholderTextColor={theme.tabIconDefault}
          returnKeyType="next"
          editable={editable}
        />

        <View style={styles.itemRow}>
          <View style={styles.halfCol}>
            <ThemedText style={styles.fieldLabel}>Quantity</ThemedText>
            <TextInput
              style={[styles.field, styles.centerField]}
              value={qty}
              onChangeText={handleQtyChange}
              onBlur={commit}
              onEndEditing={commit}
              keyboardType="numeric"
              placeholder={editable ? '1' : ''}
              placeholderTextColor={theme.tabIconDefault}
              returnKeyType="next"
              editable={editable}
            />
          </View>
          <View style={styles.halfCol}>
            <ThemedText style={styles.fieldLabel}>Unit Price ({symbol})</ThemedText>
            <TextInput
              style={[styles.field, styles.rightField]}
              value={cost}
              onChangeText={handleCostChange}
              onBlur={commit}
              onEndEditing={commit}
              keyboardType="numeric"
              placeholder={editable ? '0.00' : ''}
              placeholderTextColor={theme.tabIconDefault}
              returnKeyType="done"
              editable={editable}
            />
          </View>
        </View>
      </View>
    );
  }), []);

  return (
    <View style={styles.wrapper}>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="construct-outline" size={18} color={theme.primary} />
          <ThemedText style={styles.sectionTitle}>Parts & Services</ThemedText>
        </View>

        {items.length === 0 && editable ? (
          <Pressable style={styles.emptyCard} onPress={addItem}>
            <Ionicons name="receipt-outline" size={32} color={theme.primary + '60'} />
            <ThemedText style={styles.emptyText}>Tap to add parts or services</ThemedText>
          </Pressable>
        ) : items.length === 0 ? (
          <ThemedText style={styles.noItemsText}>No items added yet.</ThemedText>
        ) : (
          <View style={styles.itemList}>
            {items.map((item, i) => (
              <BillItemRow
                key={item.id || String(i)}
                item={item}
                index={i}
                editable={editable}
                onUpdate={(updated) => handleRowUpdate(i, updated)}
                onRemove={() => handleRowRemove(i)}
                onLiveUpdate={handleLiveUpdate}
              />
            ))}
            {editable && (
              <Pressable style={styles.inlineAddBtn} onPress={addItem}>
                <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
                <ThemedText style={styles.inlineAddBtnText}>Add another item</ThemedText>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="pricetag-outline" size={18} color={theme.primary} />
          <ThemedText style={styles.sectionTitle}>Labour Charge</ThemedText>
        </View>
        <View style={styles.chargeRow}>
          <ThemedText style={styles.currencySymbol}>{symbol}</ThemedText>
          <TextInput
            style={styles.chargeField}
            value={localCharge}
            onChangeText={setLocalCharge}
            onBlur={() => onServiceChargeChange(Number(localCharge) || 0)}
            onEndEditing={() => onServiceChargeChange(Number(localCharge) || 0)}
            keyboardType="numeric"
            placeholder={editable ? '0.00' : ''}
            placeholderTextColor={theme.tabIconDefault}
            editable={editable}
          />
        </View>
      </View>

      <TaxSelector
        taxes={taxes}
        selected={taxSnapshot}
        onChange={onTaxChange}
        subtotal={subtotal}
        serviceCharge={serviceCharge}
        editable={editable}
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryTitleRow}>
          <Ionicons name="calculator-outline" size={16} color={theme.primary} />
          <ThemedText style={styles.summaryTitle}>Bill Summary</ThemedText>
        </View>

        {items.filter(it => {
          const live = it.id ? liveValues[it.id] : undefined;
          const hasLive = live && (live.qty > 0 || live.cost > 0);
          const hasCommitted = it.name?.trim() || (it.qty && it.cost);
          return hasLive || hasCommitted;
        }).map((it, i) => {
          const live = it.id ? liveValues[it.id] : undefined;
          const qty = (live?.qty ?? Number(it.qty)) || 0;
          const cost = (live?.cost ?? Number(it.cost)) || 0;
          const lineAmt = qty * cost;
          const label = it.name?.trim() || `Item ${i + 1}`;
          return (
            <View key={i} style={styles.summaryItemRow}>
              <View style={styles.summaryItemLeft}>
                <ThemedText style={styles.summaryItemName} numberOfLines={1}>{label}</ThemedText>
                <ThemedText style={styles.summaryItemQty}>
                  {qty} x {symbol}{cost.toFixed(2)}
                </ThemedText>
              </View>
              <ThemedText style={styles.summaryItemAmt}>{format(lineAmt)}</ThemedText>
            </View>
          );
        })}

        {items.length > 0 && liveSubtotal > 0 && <View style={styles.thinDivider} />}

        {liveServiceCharge > 0 && (
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Labour Charge</ThemedText>
            <ThemedText style={styles.summaryValue}>{format(liveServiceCharge)}</ThemedText>
          </View>
        )}

        {liveTaxes.map((t) => (
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
              {t.is_inclusive ? '' : '+'}{format(Number(t.amount || 0))}
            </ThemedText>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <ThemedText style={styles.grandLabel}>Grand Total</ThemedText>
          <ThemedText style={styles.grandValue}>{format(liveGrandTotal)}</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="card-outline" size={18} color={theme.primary} />
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
                onPress={() => editable ? onPaymentStatusChange(s) : undefined}
              >
                <Ionicons
                  name={isPaid ? 'checkmark-circle-outline' : 'time-outline'}
                  size={18}
                  color={active ? theme.primaryForeground : theme.textSecondary}
                />
                <ThemedText style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {s}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {paymentStatus === 'Paid' && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="wallet-outline" size={18} color={theme.primary} />
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
                  onPress={() => editable ? onPaymentMethodChange?.(m) : undefined}
                >
                  <Ionicons
                    name={m === 'Cash' ? 'cash-outline' : 'globe-outline'}
                    size={18}
                    color={active ? theme.primaryForeground : theme.textSecondary}
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
});
