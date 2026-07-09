import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ModalSheet from '@/components/ui/ModalSheet';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const MAIN_VEHICLES = ['Car', 'Motorbike', 'Scooter', 'Van', 'Truck'];

const VEHICLE_CONFIG: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'Car', label: 'Car', icon: 'car-outline' },
  { id: 'Hatchback', label: 'Hatchback', icon: 'car-outline' },
  { id: 'SUV', label: 'SUV / 4x4', icon: 'car-outline' },
  { id: 'Pickup', label: 'Pickup Truck', icon: 'car-outline' },
  { id: 'Taxi', label: 'Taxi / Cab', icon: 'car-outline' },
  { id: 'Motorbike', label: 'Motorbike', icon: 'bicycle-outline' },
  { id: 'Scooter', label: 'Scooter', icon: 'bicycle-outline' },
  { id: 'Moped', label: 'Moped', icon: 'bicycle-outline' },
  { id: 'Bicycle', label: 'Bicycle', icon: 'bicycle-outline' },
  { id: 'EBike', label: 'E-Bike', icon: 'bicycle-outline' },
  { id: 'KickScooter', label: 'Kick Scooter', icon: 'bicycle-outline' },
  { id: 'Auto', label: 'Auto Rickshaw', icon: 'car-sport-outline' },
  { id: 'Van', label: 'Van', icon: 'car-outline' },
  { id: 'Bus', label: 'Bus', icon: 'bus-outline' },
  { id: 'Truck', label: 'Truck / Lorry', icon: 'car-outline' },
  { id: 'Ambulance', label: 'Ambulance', icon: 'medical-outline' },
  { id: 'FireTruck', label: 'Fire Truck', icon: 'flame-outline' },
  { id: 'PoliceCar', label: 'Police Car', icon: 'shield-outline' },
  { id: 'Tractor', label: 'Tractor', icon: 'construct-outline' },
  { id: 'Forklift', label: 'Forklift', icon: 'construct-outline' },
  { id: 'Bulldozer', label: 'Bulldozer', icon: 'construct-outline' },
  { id: 'Other', label: 'Other', icon: 'ellipsis-horizontal' },
];

interface VehicleTypePickerProps {
  value: string;
  onChange: (id: string) => void;
}

export default function VehicleTypePicker({ value, onChange }: VehicleTypePickerProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selected = VEHICLE_CONFIG.find((v) => v.id === value);

  const filtered = useMemo(
    () => VEHICLE_CONFIG.filter((v) => v.label.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const isMain = MAIN_VEHICLES.includes(value);

  return (
    <View>
      <ThemedText style={styles.label}>Vehicle Type</ThemedText>

      <View style={styles.mainGrid}>
        {MAIN_VEHICLES.map((id) => {
          const v = VEHICLE_CONFIG.find((x) => x.id === id)!;
          const active = value === id;
          return (
            <Pressable
              key={id}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => onChange(id)}
            >
              <View style={[styles.cardIconWrap, active && styles.cardIconWrapActive]}>
                <Ionicons name={v.icon} size={22} color={active ? theme.primaryForeground : theme.textSecondary} />
              </View>
              <ThemedText style={[styles.cardLabel, active && styles.cardLabelActive]}>{v.label}</ThemedText>
            </Pressable>
          );
        })}
        <Pressable style={[styles.card, styles.viewAllCard]} onPress={() => setModalVisible(true)}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="apps-outline" size={22} color={theme.primary} />
          </View>
          <ThemedText style={styles.viewAllLabel}>View All</ThemedText>
        </Pressable>
      </View>

      {!isMain && value && selected && (
        <View style={styles.selectedChip}>
          <Ionicons name={selected.icon} size={16} color={theme.primary} />
          <ThemedText style={styles.selectedLabel}>{selected.label}</ThemedText>
        </View>
      )}

      <ModalSheet visible={modalVisible} title="Select Vehicle Type" onClose={() => setModalVisible(false)}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search vehicles..."
          placeholderTextColor={theme.tabIconDefault}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = value === item.id;
            return (
              <Pressable
                style={[styles.gridItem, active && styles.gridItemActive]}
                onPress={() => { onChange(item.id); setModalVisible(false); setSearch(''); }}
              >
                <View style={[styles.gridIconWrap, active && styles.gridIconWrapActive]}>
                  <Ionicons name={item.icon} size={22} color={active ? theme.primaryForeground : theme.textSecondary} />
                </View>
                <ThemedText style={[styles.gridLabel, active && styles.gridLabelActive]} numberOfLines={1}>
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      </ModalSheet>
    </View>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  mainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '30%', alignItems: 'center', gap: 6,
    borderRadius: 14, borderWidth: 1, borderColor: theme.border,
    paddingVertical: 14, paddingHorizontal: 4, backgroundColor: theme.card,
  },
  cardActive: { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: theme.divider, alignItems: 'center', justifyContent: 'center',
  },
  cardIconWrapActive: { backgroundColor: theme.primary },
  cardLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, textAlign: 'center' },
  cardLabelActive: { color: theme.primary, fontWeight: '700' },
  viewAllCard: { borderColor: theme.primary + '30', backgroundColor: theme.primary + '04' },
  viewAllLabel: { fontSize: 11, fontWeight: '700', color: theme.primary, textAlign: 'center' },
  selectedChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: theme.primary + '10', marginTop: 6,
  },
  selectedLabel: { fontSize: 13, fontWeight: '700', color: theme.primary },
  searchInput: {
    margin: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    backgroundColor: theme.card, color: theme.text,
  },
  gridList: { paddingHorizontal: 12, paddingBottom: 16 },
  gridItem: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 12, margin: 4,
    borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card,
  },
  gridItemActive: { borderColor: theme.primary, backgroundColor: theme.primary + '08' },
  gridIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: theme.divider, alignItems: 'center', justifyContent: 'center',
  },
  gridIconWrapActive: { backgroundColor: theme.primary },
  gridLabel: { fontSize: 10, fontWeight: '600', color: theme.textSecondary, textAlign: 'center' },
  gridLabelActive: { color: theme.primary, fontWeight: '700' },
}), [theme]);
  return styles;
};
