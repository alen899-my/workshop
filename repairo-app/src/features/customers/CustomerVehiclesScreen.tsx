import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useRBAC } from '@/hooks/use-rbac';
import type { Customer } from '@/features/customers/services/customer.service';
import { customerService } from '@/features/customers/services/customer.service';
import VehicleCard from '@/features/vehicles/components/VehicleCard';
import VehicleActionsModal from '@/features/vehicles/components/VehicleActionsModal';
import VehicleDetailScreen from '@/features/vehicles/VehicleDetailScreen';
import PastRepairsScreen from '@/features/vehicles/PastRepairsScreen';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';

interface CustomerVehiclesScreenProps {
  customer: Customer;
  onClose: () => void;
}

export default function CustomerVehiclesScreen({ customer: initialCustomer, onClose }: CustomerVehiclesScreenProps) {
  const { can } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);
  const insets = useSafeAreaInsets();
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [loading, setLoading] = useState(true);

  const [actionsModal, setActionsModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [detailModal, setDetailModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [pastRepairsModal, setPastRepairsModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean; vehicle?: Vehicle;
  }>({ visible: false });
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    (async () => {
      const res = await customerService.getById(initialCustomer.id);
      if (res.success && res.data) {
        setCustomer(res.data);
      }
      setLoading(false);
    })();
  }, [initialCustomer.id]);

  const vehicles = customer.vehicles || [];

  const handleCardPress = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: true, vehicle });
  }, []);

  const handleViewDetails = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: false, vehicle: null });
    setDetailModal({ visible: true, vehicle });
  }, []);

  const handlePastRepairs = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: false, vehicle: null });
    setPastRepairsModal({ visible: true, vehicle });
  }, []);

  const handleEditFromModal = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: false, vehicle: null });
    showToast('Edit from vehicle screen', 'info');
  }, [showToast]);

  const handleDeleteFromModal = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: false, vehicle: null });
    if (!can('delete:vehicle')) {
      showToast('Access Denied', 'error');
      return;
    }
    setDeleteConfirm({ visible: true, vehicle });
  }, [can, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    const vehicle = deleteConfirm.vehicle;
    if (!vehicle) return;
    setDeleteConfirm({ visible: false });
    const res = await vehicleService.delete(vehicle.id);
    if (res.success) {
      showToast('Vehicle deleted successfully');
    } else {
      showToast(res.error || 'Failed to delete vehicle', 'error');
    }
  }, [deleteConfirm.vehicle, showToast]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>Vehicles</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{customer.name || 'Customer'}</ThemedText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : vehicles.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="car-outline" size={32} color={theme.primary} />
          </View>
          <ThemedText style={styles.emptyText}>No registered vehicles</ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {vehicles.map((v) => (
            <View key={v.id} style={styles.vehicleCardWrap}>
              <VehicleCard vehicle={v} onPress={handleCardPress} />
            </View>
          ))}
        </ScrollView>
      )}

      <VehicleActionsModal
        visible={actionsModal.visible}
        vehicle={actionsModal.vehicle}
        onClose={() => setActionsModal({ visible: false, vehicle: null })}
        onViewDetails={handleViewDetails}
        onPastRepairs={handlePastRepairs}
        onEdit={handleEditFromModal}
        onDelete={handleDeleteFromModal}
        canEdit={can('edit:vehicle')}
        canDelete={can('delete:vehicle')}
      />

      <Modal visible={detailModal.visible} animationType="slide" onRequestClose={() => setDetailModal({ visible: false, vehicle: null })}>
        {detailModal.vehicle && (
          <VehicleDetailScreen
            vehicle={detailModal.vehicle}
            onClose={() => setDetailModal({ visible: false, vehicle: null })}
            onEdit={() => { setDetailModal({ visible: false, vehicle: null }); showToast('Edit from vehicle screen', 'info'); }}
            onDelete={(v) => { setDetailModal({ visible: false, vehicle: null }); setDeleteConfirm({ visible: true, vehicle: v }); }}
          />
        )}
      </Modal>

      <Modal visible={pastRepairsModal.visible} animationType="slide" onRequestClose={() => setPastRepairsModal({ visible: false, vehicle: null })}>
        {pastRepairsModal.vehicle && (
          <PastRepairsScreen
            vehicle={pastRepairsModal.vehicle}
            onClose={() => setPastRepairsModal({ visible: false, vehicle: null })}
          />
        )}
      </Modal>

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="Delete Vehicle"
        message={deleteConfirm.vehicle ? `Are you sure you want to delete vehicle "${deleteConfirm.vehicle.vehicle_number}"?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ visible: false })}
        type="destructive"
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
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

    scrollContent: { paddingBottom: 40, paddingTop: 12 },
    vehicleCardWrap: {
      paddingHorizontal: 12,
    },
  });
  return styles;
};
