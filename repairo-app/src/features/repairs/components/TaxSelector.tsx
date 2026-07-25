import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { TaxSnapshotItem } from '@/features/repairs/services/bill.service';
import type { Tax } from '@/features/repairs/services/tax.service';
import { useCurrency } from '@/hooks/use-currency';
import { useTheme } from '@/hooks/use-theme';

interface TaxSelectorProps {
  taxes: Tax[];
  selected: TaxSnapshotItem[];
  onChange: (selected: TaxSnapshotItem[]) => void;
  subtotal: number;
  serviceCharge: number;
  editable?: boolean;
}

const APPLIES_TO_LABELS: Record<string, string> = {
  all: 'Everything',
  parts: 'Parts',
  service: 'Labor',
};

export default function TaxSelector({ taxes, selected, onChange, subtotal, serviceCharge, editable = true }: TaxSelectorProps) {
  const theme = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: theme.card, borderRadius: 16,
      padding: 16, gap: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 6 },
    taxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
    taxRowActive: { backgroundColor: theme.primary + '08' },
    taxInfo: { flex: 1 },
    taxName: { fontSize: 14, fontWeight: '600', color: theme.text },
    taxNameActive: { color: theme.primary },
    taxRate: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
    taxAppliesTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
      marginTop: 2,
    },
    taxAppliesTagText: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
    taxAmountWrap: { backgroundColor: theme.primary + '12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    taxAmount: { fontSize: 13, fontWeight: '700', color: theme.primary },
  }), [theme]);
  const { format } = useCurrency();

  const toggleTax = useCallback((tax: Tax) => {
    const exists = selected.find((t) => t.id === tax.id);
    if (exists) {
      onChange(selected.filter((t) => t.id !== tax.id));
    } else {
      const base = tax.applies_to === 'service' ? serviceCharge : tax.applies_to === 'all' ? subtotal + serviceCharge : subtotal;
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
              color={active ? theme.primary : theme.tabIconDefault}
            />
            <View style={styles.taxInfo}>
              <ThemedText style={[styles.taxName, active && styles.taxNameActive]}>{tax.name}</ThemedText>
              <ThemedText style={styles.taxRate}>{tax.rate}% {tax.is_inclusive ? '(inclusive)' : '(exclusive)'}</ThemedText>
              <View style={[styles.taxAppliesTag, { backgroundColor: active ? theme.primary + '10' : theme.border }]}>
                <ThemedText style={[styles.taxAppliesTagText, { color: active ? theme.primary : theme.textSecondary }]}>
                  {APPLIES_TO_LABELS[tax.applies_to] || tax.applies_to}
                </ThemedText>
              </View>
            </View>
            {active && (
              <View style={styles.taxAmountWrap}>
                <ThemedText style={styles.taxAmount}>
                  {format(Number(activeAmount || 0))}
                </ThemedText>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
