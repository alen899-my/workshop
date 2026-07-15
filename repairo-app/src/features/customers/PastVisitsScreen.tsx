import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { Customer } from '@/features/customers/services/customer.service';
import { customerService } from '@/features/customers/services/customer.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import RepairCard from '@/features/repairs/components/RepairCard';
import ViewRepairScreen from '@/features/repairs/ViewRepairScreen';
import type { Repair } from '@/features/repairs/services/repair.service';
import { repairService } from '@/features/repairs/services/repair.service';

interface PastVisitsScreenProps {
  customer: Customer;
  onClose: () => void;
}

export default function PastVisitsScreen({ customer: initialCustomer, onClose }: PastVisitsScreenProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const insets = useSafeAreaInsets();
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [loading, setLoading] = useState(true);
  const [viewRepair, setViewRepair] = useState<Repair | null>(null);
  const [allRepairs, setAllRepairs] = useState<Repair[]>([]);

  useEffect(() => {
    (async () => {
      const res = await customerService.getById(initialCustomer.id);
      if (res.success && res.data) {
        setCustomer(res.data);
      }
      setLoading(false);
    })();
  }, [initialCustomer.id]);

  useEffect(() => {
    if (!customer.vehicles || customer.vehicles.length === 0) return;
    (async () => {
      const vehicleIds = customer.vehicles!.map((v) => v.id);
      const promises = vehicleIds.map((id) => vehicleService.getById(id));
      const results = await Promise.all(promises);
      const all: Repair[] = [];
      results.forEach((r) => {
        if (r.success && r.data?.repairs) {
          const vehicle = r.data;
          r.data.repairs.forEach((rep: any) => {
            all.push({
              id: rep.id,
              shop_id: vehicle.shop_id,
              vehicle_number: vehicle.vehicle_number,
              vehicle_image: vehicle.vehicle_image,
              vehicle_type: vehicle.vehicle_type,
              owner_name: customer.name,
              phone_number: customer.phone,
              brand: vehicle.brand,
              model_name: vehicle.model_name,
              status: rep.status,
              repair_date: rep.repair_date,
              created_at: rep.repair_date || '',
              service_type: 'Repair',
              km_reading: '',
              priority: '',
              attending_worker_name: '',
            });
          });
        }
      });
      setAllRepairs(all);
    })();
  }, [customer]);

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
          <ThemedText style={styles.headerTitle}>Past Visits</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{customer.name || 'Customer'}</ThemedText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : allRepairs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="construct-outline" size={32} color={theme.primary} />
          </View>
          <ThemedText style={styles.emptyText}>No past visits</ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {allRepairs.map((repair) => (
            <RepairCard
              key={repair.id}
              repair={repair}
              onPress={() => handleRepairPress(repair)}
            />
          ))}
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
