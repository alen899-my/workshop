import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, Modal, Pressable,
  ScrollView, StyleSheet, View,
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
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

interface CustomerDetailScreenProps {
  customer: Customer;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export default function CustomerDetailScreen({
  customer: initialCustomer,
  onClose,
  onEdit,
  onDelete,
}: CustomerDetailScreenProps) {
  const { can } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);
  const insets = useSafeAreaInsets();
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [loading, setLoading] = useState(true);

  const [vehicleActionsModal, setVehicleActionsModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [vehicleDetailModal, setVehicleDetailModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [vehiclePastRepairsModal, setVehiclePastRepairsModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [deleteVehicleConfirm, setDeleteVehicleConfirm] = useState<Vehicle | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    const res = await customerService.getById(initialCustomer.id);
    if (res.success && res.data) {
      setCustomer(res.data);
    } else {
      showToast('Failed to load customer details', 'error');
    }
    setLoading(false);
  }, [initialCustomer.id, showToast]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const vehicles = customer.vehicles || [];

  const handleVehicleCardPress = useCallback((vehicle: Vehicle) => {
    setVehicleActionsModal({ visible: true, vehicle });
  }, []);

  const handleVehicleViewDetails = useCallback((vehicle: Vehicle) => {
    setVehicleActionsModal({ visible: false, vehicle: null });
    setVehicleDetailModal({ visible: true, vehicle });
  }, []);

  const handleVehiclePastRepairs = useCallback((vehicle: Vehicle) => {
    setVehicleActionsModal({ visible: false, vehicle: null });
    setVehiclePastRepairsModal({ visible: true, vehicle });
  }, []);

  const handleVehicleEdit = useCallback((vehicle: Vehicle) => {
    setVehicleActionsModal({ visible: false, vehicle: null });
    showToast('Edit from customer detail', 'info');
  }, [showToast]);

  const handleVehicleDelete = useCallback((vehicle: Vehicle) => {
    setVehicleActionsModal({ visible: false, vehicle: null });
    if (!can('delete:vehicle')) {
      showToast('Access Denied', 'error');
      return;
    }
    setDeleteVehicleConfirm(vehicle);
  }, [can, showToast]);

  const handleConfirmDeleteVehicle = useCallback(async () => {
    if (!deleteVehicleConfirm) return;
    const v = deleteVehicleConfirm;
    setDeleteVehicleConfirm(null);
    const res = await vehicleService.delete(v.id);
    if (res.success) {
      showToast('Vehicle deleted successfully');
      fetchDetails();
    } else {
      showToast(res.error || 'Failed to delete vehicle', 'error');
    }
  }, [deleteVehicleConfirm, showToast, fetchDetails]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Customer Details</ThemedText>
        <Pressable style={styles.headerEdit} onPress={() => onEdit(customer)}>
          <Ionicons name="create-outline" size={16} color={theme.primaryForeground} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer info card */}
          <View style={styles.card}>
            <View style={styles.customerHeader}>
              <View style={[styles.avatarWrap, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="person-outline" size={32} color={theme.primary} />
              </View>
              <View style={styles.customerInfo}>
                <ThemedText style={styles.customerName}>{customer.name || 'Unknown'}</ThemedText>
                {customer.phone && (
                  <Pressable
                    style={styles.phoneRow}
                    onPress={() => Linking.openURL(`tel:${customer.phone!.replace(/\s/g, '')}`)}
                  >
                    <Ionicons name="call" size={14} color={theme.primary} />
                    <ThemedText style={styles.customerPhone}>{customer.phone}</ThemedText>
                  </Pressable>
                )}
              </View>
            </View>
            {customer.status === 'Inactive' && (
              <View style={styles.inactiveBadge}>
                <ThemedText style={styles.inactiveBadgeText}>Inactive</ThemedText>
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>Information</ThemedText>
            <DetailRow styles={styles} label="Status" value={customer.status || 'Active'} />
            <DetailRow styles={styles} label="Added" value={formatDate(customer.created_at)} />
            <DetailRow styles={styles} label="Registered Vehicles" value={String(vehicles.length)} />
          </View>

          {/* Vehicles */}
          {vehicles.length > 0 && (
            <View style={styles.vehicleSection}>
              <ThemedText style={styles.sectionLabel}>
                Registered Vehicles ({vehicles.length})
              </ThemedText>
              {vehicles.map((v) => (
                <View key={v.id} style={styles.vehicleCardWrap}>
                  <VehicleCard vehicle={v} onPress={handleVehicleCardPress} />
                </View>
              ))}
            </View>
          )}
          {vehicles.length === 0 && (
            <ThemedText style={styles.noVehiclesText}>No registered vehicles</ThemedText>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.actionEdit, pressed && { opacity: 0.8 }]}
              onPress={() => onEdit(customer)}
            >
              <Ionicons name="create-outline" size={16} color={theme.primaryForeground} />
              <ThemedText style={styles.actionText}>Edit Customer</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionDelete, pressed && { opacity: 0.8 }]}
              onPress={() => onDelete(customer)}
            >
              <Ionicons name="trash-outline" size={16} color={theme.destructive} />
              <ThemedText style={[styles.actionText, { color: theme.destructive }]}>Delete</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      )}

      <VehicleActionsModal
        visible={vehicleActionsModal.visible}
        vehicle={vehicleActionsModal.vehicle}
        onClose={() => setVehicleActionsModal({ visible: false, vehicle: null })}
        onViewDetails={handleVehicleViewDetails}
        onPastRepairs={handleVehiclePastRepairs}
        onEdit={handleVehicleEdit}
        onDelete={handleVehicleDelete}
        canEdit={can('edit:vehicle')}
        canDelete={can('delete:vehicle')}
      />

      <Modal visible={vehicleDetailModal.visible} animationType="slide" onRequestClose={() => setVehicleDetailModal({ visible: false, vehicle: null })}>
        {vehicleDetailModal.vehicle && (
          <VehicleDetailScreen
            vehicle={vehicleDetailModal.vehicle}
            onClose={() => setVehicleDetailModal({ visible: false, vehicle: null })}
            onEdit={() => { setVehicleDetailModal({ visible: false, vehicle: null }); showToast('Edit from customer detail', 'info'); }}
            onDelete={(v) => { setVehicleDetailModal({ visible: false, vehicle: null }); setDeleteVehicleConfirm(v); }}
          />
        )}
      </Modal>

      <Modal visible={vehiclePastRepairsModal.visible} animationType="slide" onRequestClose={() => setVehiclePastRepairsModal({ visible: false, vehicle: null })}>
        {vehiclePastRepairsModal.vehicle && (
          <PastRepairsScreen
            vehicle={vehiclePastRepairsModal.vehicle}
            onClose={() => setVehiclePastRepairsModal({ visible: false, vehicle: null })}
          />
        )}
      </Modal>

      <ConfirmModal
        visible={!!deleteVehicleConfirm}
        title="Delete Vehicle"
        message={deleteVehicleConfirm ? `Delete vehicle "${deleteVehicleConfirm.vehicle_number}"?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteVehicle}
        onCancel={() => setDeleteVehicleConfirm(null)}
        type="destructive"
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
    </ThemedView>
  );
}

function DetailRow({ label, value, styles: s }: { label: string; value: string; styles: any }) {
  return (
    <View style={s.detailRow}>
      <ThemedText style={s.detailLabel}>{label}</ThemedText>
      <ThemedText style={s.detailValue}>{value}</ThemedText>
    </View>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundElement },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingBottom: 8,
      backgroundColor: theme.background,
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    headerBack: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.backgroundElement,
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    headerEdit: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.primary,
    },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },

    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 11, fontWeight: '700', color: theme.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.5,
      marginBottom: 12,
    },

    customerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatarWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customerInfo: { flex: 1, gap: 4 },
    customerName: { fontSize: 18, fontWeight: '800', color: theme.text },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    customerPhone: { fontSize: 14, fontWeight: '500', color: theme.textSecondary },
    callBtn: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: theme.primary + '15',
      alignItems: 'center', justifyContent: 'center',
    },
    inactiveBadge: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
      backgroundColor: theme.destructive + '18',
    },
    inactiveBadgeText: { fontSize: 10, fontWeight: '700', color: theme.destructive },

    detailRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: 6,
    },
    detailLabel: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
    detailValue: { fontSize: 13, fontWeight: '700', color: theme.text },

    vehicleSection: {
      marginHorizontal: -10,
    },
    vehicleCardWrap: {
      paddingHorizontal: 10,
    },
    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: theme.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
      paddingHorizontal: 16,
    },
    noVehiclesText: {
      fontSize: 13, color: theme.textSecondary, fontStyle: 'italic',
      textAlign: 'center', paddingVertical: 12,
    },

    actionsRow: {
      flexDirection: 'row', gap: 10, paddingTop: 4,
    },
    actionEdit: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 12, borderRadius: 10,
      backgroundColor: theme.primary,
    },
    actionDelete: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 12, borderRadius: 10,
      backgroundColor: theme.destructive + '12',
      borderWidth: 1, borderColor: theme.destructive + '30',
    },
    actionText: { fontSize: 13, fontWeight: '700', color: theme.primaryForeground },
  }), [theme]);
  return styles;
};
