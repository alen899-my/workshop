import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import RepairCard from '@/features/repairs/components/RepairCard';
import ViewRepairScreen from '@/features/repairs/ViewRepairScreen';
import type { Repair } from '@/features/repairs/services/repair.service';
import { repairService } from '@/features/repairs/services/repair.service';

interface PastRepairsScreenProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export default function PastRepairsScreen({ vehicle: initialVehicle, onClose }: PastRepairsScreenProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle>(initialVehicle);
  const [loading, setLoading] = useState(true);
  const [viewRepair, setViewRepair] = useState<Repair | null>(null);

  useEffect(() => {
    (async () => {
      const res = await vehicleService.getById(initialVehicle.id);
      if (res.success && res.data) {
        setVehicle(res.data);
      }
      setLoading(false);
    })();
  }, [initialVehicle.id]);

  const repairs = vehicle.repairs || [];

  const handleRepairPress = useCallback(async (r: { id: number }) => {
    const res = await repairService.getById(r.id);
    if (res.success && res.data) {
      setViewRepair(res.data);
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>Past Repairs</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{vehicle.vehicle_number}</ThemedText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : repairs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="construct-outline" size={32} color={theme.primary} />
          </View>
          <ThemedText style={styles.emptyText}>No past repairs</ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {repairs.map((r) => {
            const enriched: Repair = {
              id: r.id,
              shop_id: vehicle.shop_id,
              vehicle_number: vehicle.vehicle_number,
              vehicle_image: vehicle.vehicle_image,
              vehicle_type: vehicle.vehicle_type,
              owner_name: vehicle.owner_name,
              phone_number: vehicle.owner_phone,
              brand: vehicle.brand,
              model_name: vehicle.model_name,
              status: r.status,
              repair_date: r.repair_date,
              created_at: r.repair_date || '',
              service_type: 'Repair',
              km_reading: '',
              priority: '',
              attending_worker_name: '',
            };
            return (
              <RepairCard
                key={r.id}
                repair={enriched}
                onPress={() => handleRepairPress(r)}
              />
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!viewRepair} animationType="slide" onRequestClose={() => setViewRepair(null)}>
        {viewRepair && (
          <ViewRepairScreen
            repair={viewRepair}
            onClose={() => setViewRepair(null)}
            onEdit={() => {}}
            onUpdateRepair={() => setViewRepair(null)}
          />
        )}
      </Modal>
    </ThemedView>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundElement },

    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingBottom: 8,
      backgroundColor: theme.background,
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    headerBack: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.backgroundElement,
    },
    headerCenter: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    headerSubtitle: { fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginTop: 1 },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },

    scrollContent: { paddingBottom: 40 },
  });
  return styles;
};
