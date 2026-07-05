import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable,
  StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FAB from '@/components/FAB';
import ScreenLayout from '@/components/ScreenLayout';
import Toast from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ModalSheet from '@/components/ui/ModalSheet';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import { useRBAC } from '@/hooks/use-rbac';

import CreateVehicleScreen from '@/features/vehicles/CreateVehicleScreen';
import VehicleDetailScreen from '@/features/vehicles/VehicleDetailScreen';
import VehicleCard from './components/VehicleCard';
import VehicleActionsModal from './components/VehicleActionsModal';

const PAGE_SIZE = 20;

function FilterFAB({ onPress, count }: { onPress: () => void; count: number }) {
  return (
    <Pressable onPress={onPress} style={styles.filterFab}>
      <Ionicons name="funnel-outline" size={20} color={Colors.textInverse} />
      {count > 0 && (
        <View style={styles.filterFabBadge}>
          <ThemedText style={styles.filterFabBadgeText}>{count}</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

export default function VehiclesListScreen() {
  const { can } = useRBAC();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [formModal, setFormModal] = useState<{
    visible: boolean; mode: 'create' | 'edit'; vehicle?: Vehicle;
  }>({ visible: false, mode: 'create' });
  const [actionsModal, setActionsModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [detailModal, setDetailModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean; vehicle?: Vehicle;
  }>({ visible: false });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((p) => ({ ...p, visible: false }));
  }, []);

  const fetchVehicles = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await vehicleService.getAll(filterStatus);
    if (res.success) {
      setVehicles(res.data);
      setDisplayCount(PAGE_SIZE);
    } else {
      showToast(res.error || 'Failed to load vehicles', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [filterStatus, showToast]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const displayedItems = useMemo(
    () => vehicles.slice(0, displayCount),
    [vehicles, displayCount],
  );

  const hasMore = displayCount < vehicles.length;

  const filterCount = filterStatus ? 1 : 0;

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, vehicles.length));
  }, [vehicles.length]);

  const handleNewVehicle = useCallback(() => {
    if (!can('create:vehicle')) { showToast('Access Denied', 'error'); return; }
    setFormModal({ visible: true, mode: 'create' });
  }, [can, showToast]);

  const handleCardPress = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: true, vehicle });
  }, []);

  const handleViewDetails = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: false, vehicle: null });
    setDetailModal({ visible: true, vehicle });
  }, []);

  const handleEditFromModal = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: false, vehicle: null });
    setFormModal({ visible: true, mode: 'edit', vehicle });
  }, []);

  const handleDeleteFromModal = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: false, vehicle: null });
    if (!can('delete:vehicle')) {
      showToast('Access Denied: You do not have permission to delete vehicles', 'error');
      return;
    }
    setDeleteConfirm({ visible: true, vehicle });
  }, [can, showToast]);

  const handleDeleteVehicle = useCallback((vehicle: Vehicle) => {
    if (!can('delete:vehicle')) {
      showToast('Access Denied: You do not have permission to delete vehicles', 'error');
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
      fetchVehicles(true);
    } else {
      showToast(res.error || 'Failed to delete vehicle', 'error');
    }
  }, [deleteConfirm.vehicle, fetchVehicles, showToast]);

  const handleFormClose = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchVehicles(true);
  }, [fetchVehicles]);

  const handleFormSuccess = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchVehicles(true);
  }, [fetchVehicles]);

  const handleDetailClose = useCallback(() => {
    setDetailModal({ visible: false, vehicle: null });
    fetchVehicles(true);
  }, [fetchVehicles]);

  const handleDeleteFromDetail = useCallback((vehicle: Vehicle) => {
    setDetailModal({ visible: false, vehicle: null });
    setDeleteConfirm({ visible: true, vehicle });
  }, []);

  const handleEditFromDetail = useCallback((vehicle: Vehicle) => {
    setDetailModal({ visible: false, vehicle: null });
    setFormModal({ visible: true, mode: 'edit', vehicle });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Vehicle }) => (
      <VehicleCard
        vehicle={item}
        onPress={handleCardPress}
        onDelete={can('delete:vehicle') ? handleDeleteVehicle : undefined}
      />
    ),
    [handleCardPress, handleDeleteVehicle, can],
  );

  const ListHeader = useMemo(() => (
    <View>
      {!loading && vehicles.length > 0 && (
        <View style={styles.listHeader}>
          <ThemedText style={styles.listHeaderText}>
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}
    </View>
  ), [loading, vehicles.length]);

  const ListFooter = useMemo(() => {
    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator color={Colors.primary} /></View>;
    if (hasMore) return <View style={styles.footer}><ActivityIndicator size="small" color={Colors.primary} /></View>;
    return null;
  }, [loading, hasMore]);

  const ListEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrap, { backgroundColor: Colors.primaryLight }]}>
          <Ionicons name="car-outline" size={32} color={Colors.primary} />
        </View>
        <ThemedText style={styles.emptyTitle}>No Vehicles</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          {filterStatus ? 'No vehicles match the current filter' : 'Add your first vehicle to get started'}
        </ThemedText>
      </View>
    );
  }, [loading, filterStatus]);

  return (
    <ScreenLayout title="Vehicles">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <FlatList
        data={displayedItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={() => fetchVehicles(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.floatingColumn}>
        <FilterFAB onPress={() => setFilterModalVisible(true)} count={filterCount} />
        <FAB onPress={handleNewVehicle} />
      </View>

      <VehicleActionsModal
        visible={actionsModal.visible}
        vehicle={actionsModal.vehicle}
        onClose={() => setActionsModal({ visible: false, vehicle: null })}
        onViewDetails={handleViewDetails}
        onEdit={handleEditFromModal}
        onDelete={handleDeleteFromModal}
        canEdit={can('edit:vehicle')}
        canDelete={can('delete:vehicle')}
      />

      <ModalSheet visible={filterModalVisible} title="Filter Vehicles" onClose={() => setFilterModalVisible(false)}>
        <View style={styles.filterSection}>
          <ThemedText style={styles.filterLabel}>Status</ThemedText>
          <View style={styles.filterChips}>
            {[undefined, 'Active', 'Inactive'].map((s) => {
              const active = filterStatus === s;
              return (
                <Pressable
                  key={s || 'all'}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => { setFilterStatus(s); setFilterModalVisible(false); }}
                >
                  <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {s || 'All'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ModalSheet>

      <Modal visible={formModal.visible} animationType="slide" onRequestClose={handleFormClose}>
        <CreateVehicleScreen
          mode={formModal.mode}
          initialVehicle={formModal.vehicle}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Modal>

      <Modal visible={detailModal.visible} animationType="slide" onRequestClose={handleDetailClose}>
        {detailModal.vehicle && (
          <VehicleDetailScreen
            vehicle={detailModal.vehicle}
            onClose={handleDetailClose}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteFromDetail}
          />
        )}
      </Modal>

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="Delete Vehicle"
        message={deleteConfirm.vehicle ? `Are you sure you want to delete vehicle "${deleteConfirm.vehicle.vehicle_number}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ visible: false })}
        type="destructive"
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 200, flexGrow: 1 },
  listHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  listHeaderText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  footer: { paddingVertical: 16, alignItems: 'center' },
  loadingContainer: { flex: 1, paddingTop: 80, alignItems: 'center' },

  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: 8, paddingHorizontal: 16, paddingTop: 60,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  floatingColumn: {
    position: 'absolute', bottom: 130, right: 24,
    alignItems: 'center', gap: 14,
  },
  filterFab: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.text, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  filterFabBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.primary, borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  filterFabBadgeText: { color: Colors.primaryForeground, fontSize: 11, fontWeight: '800' },

  filterSection: { padding: 16, gap: 10 },
  filterLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#E8E0CC',
    backgroundColor: '#F8F7F4',
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#8A8A80' },
  filterChipTextActive: { color: '#FFFFFF' },
});
