import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { TaxSnapshotItem } from '@/features/repairs/services/bill.service';
import type { Tax } from '@/features/repairs/services/tax.service';
import { useCurrency } from '@/hooks/use-currency';

const PRIMARY = '#3D7A78';

interface TaxSelectorProps {
  taxes: Tax[];
  selected: TaxSnapshotItem[];
  onChange: (selected: TaxSnapshotItem[]) => void;
  subtotal: number;
  serviceCharge: number;
  editable?: boolean;
}

export default function TaxSelector({ taxes, selected, onChange, subtotal, serviceCharge, editable = true }: TaxSelectorProps) {
  const currency = useCurrency();

  const toggleTax = useCallback((tax: Tax) => {
    const exists = selected.find((t) => t.id === tax.id);
    if (exists) {
      onChange(selected.filter((t) => t.id !== tax.id));
    } else {
      const base = tax.applies_to === 'service' ? serviceCharge : subtotal;
      const amount = tax.is_inclusive ? base - base / (1 + tax.rate / 100) : base * (tax.rate / 100);
      onChange([...selected, { id: tax.id, name: tax.name, rate: tax.rate, amount, is_inclusive: tax.is_inclusive, applies_to: tax.applies_to }]);
    }
  }, [selected, onChange, subtotal, serviceCharge]);

  return (
    <View style={styles.card}>
      <ThemedText style={styles.cardTitle}>Applicable Taxes</ThemedText>
      {taxes.map((tax) => {
        const active = selected.some((t) => t.id === tax.id);
        const activeAmount = selected.find((t) => t.id === tax.id)?.amount;
        return (
          <Pressable
            key={tax.id}
            style={[styles.taxRow, active && styles.taxRowActive]}
            onPress={() => editable ? toggleTax(tax) : undefined}
          >
            <Ionicons
              name={active ? 'toggle' : 'toggle-outline'}
              size={24}
              color={active ? PRIMARY : '#B0AA97'}
            />
            <View style={styles.taxInfo}>
              <ThemedText style={[styles.taxName, active && styles.taxNameActive]}>{tax.name}</ThemedText>
              <ThemedText style={styles.taxRate}>{tax.rate}% {tax.is_inclusive ? '(inclusive)' : '(exclusive)'}</ThemedText>
            </View>
            {active && (
              <View style={styles.taxAmountWrap}>
                <ThemedText style={styles.taxAmount}>
                  {currency}{Number(activeAmount || 0).toFixed(2)}
                </ThemedText>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  taxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
  taxRowActive: { backgroundColor: PRIMARY + '08' },
  taxInfo: { flex: 1 },
  taxName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  taxNameActive: { color: PRIMARY },
  taxRate: { fontSize: 12, color: '#8A8A80', marginTop: 1 },
  taxAmountWrap: { backgroundColor: PRIMARY + '12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  taxAmount: { fontSize: 13, fontWeight: '700', color: PRIMARY },
});
