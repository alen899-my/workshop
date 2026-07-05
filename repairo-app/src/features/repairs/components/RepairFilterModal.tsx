import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ModalSheet from '@/components/ui/ModalSheet';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import type { RepairFilters } from '@/features/repairs/services/repair.service';
import { useTheme } from '@/hooks/use-theme';

const STATUS_OPTIONS = ['Pending', 'Started', 'Completed'];
const SERVICE_TYPE_OPTIONS = ['Repair', 'Servicing', 'Inspection', 'Modification', 'Other'];

interface RepairFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: RepairFilters) => void;
  initialFilters?: RepairFilters;
  availableWorkers?: { value: string; label: string }[];
  availableVehicleTypes?: { value: string; label: string }[];
}

export default function RepairFilterModal({
  visible, onClose, onApply, initialFilters, availableWorkers, availableVehicleTypes,
}: RepairFilterModalProps) {
  const theme = useTheme();
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [status, setStatus] = useState(initialFilters?.status || '');
  const [serviceType, setServiceType] = useState(initialFilters?.serviceType || '');
  const [vehicleType, setVehicleType] = useState(initialFilters?.vehicleType || '');
  const [worker, setWorker] = useState(initialFilters?.worker || '');
  const [dateFrom, setDateFrom] = useState(initialFilters?.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialFilters?.dateTo || '');

  const activeCount = useMemo(
    () => [status, serviceType, vehicleType, worker, dateFrom, dateTo].filter(Boolean).length,
    [status, serviceType, vehicleType, worker, dateFrom, dateTo],
  );

  const handleReset = useCallback(() => {
    setSearch(''); setStatus(''); setServiceType('');
    setVehicleType(''); setWorker(''); setDateFrom(''); setDateTo('');
  }, []);

  const handleApply = useCallback(() => {
    onApply({ search, status, serviceType, vehicleType, worker, dateFrom, dateTo });
    onClose();
  }, [search, status, serviceType, vehicleType, worker, dateFrom, dateTo, onApply, onClose]);

  const renderChipGroup = (
    label: string,
    options: string[],
    selected: string,
    onSelect: (v: string) => void,
  ) => (
    <View style={styles.chipGroup}>
      <ThemedText style={styles.chipLabel}>{label}</ThemedText>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <Pressable
              key={opt}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(active ? '' : opt)}
            >
              <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                {opt}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderDateInput = (label: string, value: string, onChange: (v: string) => void) => (
    <View style={styles.dateGroup}>
      <ThemedText style={styles.chipLabel}>{label}</ThemedText>
      <TextInput
        style={[styles.dateInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textSecondary}
      />
    </View>
  );

  return (
    <ModalSheet visible={visible} title="Filters" onClose={onClose}>
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by vehicle or owner..."
          placeholderTextColor={theme.textSecondary}
        />

        {renderChipGroup('Repair Status', STATUS_OPTIONS, status, setStatus)}
        {renderChipGroup('Service Type', SERVICE_TYPE_OPTIONS, serviceType, setServiceType)}

        {availableVehicleTypes && availableVehicleTypes.length > 0 && (
          renderChipGroup('Vehicle Type', availableVehicleTypes.map((v) => v.value), vehicleType, setVehicleType)
        )}

        {availableWorkers && availableWorkers.length > 0 && (
          renderChipGroup('Worker', availableWorkers.map((v) => v.value), worker, setWorker)
        )}

        <View style={styles.dateRow}>
          {renderDateInput('From Date', dateFrom, setDateFrom)}
          {renderDateInput('To Date', dateTo, setDateTo)}
        </View>

        <View style={styles.actions}>
          {activeCount > 0 && (
            <Pressable style={styles.resetBtn} onPress={handleReset}>
              <MaterialCommunityIcons name="close-circle-outline" size={18} color={Colors.textSecondary} />
              <ThemedText themeColor="textSecondary" style={styles.resetText}>Reset ({activeCount})</ThemedText>
            </Pressable>
          )}
          <Pressable style={styles.applyBtn} onPress={handleApply}>
            <ThemedText style={styles.applyText}>Apply Filters</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, maxHeight: 500 },
  searchInput: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: Spacing.four,
  },
  chipGroup: { marginBottom: Spacing.three },
  chipLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  chipActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  dateRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.four },
  dateGroup: { flex: 1 },
  dateInput: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13,
  },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two, marginBottom: Spacing.four },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resetText: { fontSize: 13, fontWeight: '600' },
  applyBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  applyText: { color: Colors.primaryForeground, fontSize: 15, fontWeight: '700' },
});
