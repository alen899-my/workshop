import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable,
  StyleSheet, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FAB from '@/components/FAB';
import ScreenLayout from '@/components/ScreenLayout';
import Toast from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ModalSheet from '@/components/ui/ModalSheet';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import { useRBAC } from '@/hooks/use-rbac';

import CreateVehicleScreen from '@/features/vehicles/CreateVehicleScreen';
import VehicleDetailScreen from '@/features/vehicles/VehicleDetailScreen';
import PastRepairsScreen from '@/features/vehicles/PastRepairsScreen';
import VehicleCard from './components/VehicleCard';
import VehicleActionsModal from './components/VehicleActionsModal';

const PAGE_SIZE = 20;

export default function VehiclesListScreen() {
  const { can } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const [formModal, setFormModal] = useState<{
    visible: boolean; mode: 'create' | 'edit'; vehicle?: Vehicle;
  }>({ visible: false, mode: 'create' });
  const [actionsModal, setActionsModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [detailModal, setDetailModal] = useState<{
    visible: boolean; vehicle: Vehicle | null;
  }>({ visible: false, vehicle: null });
  const [pastRepairsModal, setPastRepairsModal] = useState<{
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
      const seen = new Set<string>();
      const deduped = res.data.filter((v) => {
        const key = `${v.shop_id}:${v.vehicle_number.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setVehicles(deduped);
      setDisplayCount(PAGE_SIZE);
    } else {
      showToast(res.error || 'Failed to load vehicles', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [filterStatus, showToast]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const searchFiltered = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) =>
      v.vehicle_number.toLowerCase().includes(q) ||
      v.owner_name?.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  const displayedItems = useMemo(
    () => searchFiltered.slice(0, displayCount),
    [searchFiltered, displayCount],
  );

  const hasMore = displayCount < searchFiltered.length;

  const filterCount = filterStatus ? 1 : 0;

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, searchFiltered.length));
  }, [searchFiltered.length]);

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

  const handlePastRepairs = useCallback((vehicle: Vehicle) => {
    setActionsModal({ visible: false, vehicle: null });
    setPastRepairsModal({ visible: true, vehicle });
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
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by number or owner..."
          placeholderTextColor={theme.textSecondary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
      {!loading && vehicles.length > 0 && (
        <View style={styles.listHeader}>
          <ThemedText style={styles.listHeaderText}>
            {searchFiltered.length} vehicle{searchFiltered.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}
    </View>
  ), [loading, vehicles.length, search, searchFiltered.length, theme]);

  const ListFooter = useMemo(() => {
    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator color={theme.primary} /></View>;
    if (hasMore) return <View style={styles.footer}><ActivityIndicator size="small" color={theme.primary} /></View>;
    return null;
  }, [loading, hasMore, theme]);

  const ListEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name="car-outline" size={28} color={theme.primary} />
        </View>
        <ThemedText style={styles.emptyTitle}>No Vehicles</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          {filterStatus ? 'No vehicles match the current filter' : 'Add your first vehicle to get started'}
        </ThemedText>
      </View>
    );
  }, [loading, filterStatus, theme]);

  return (
    <ScreenLayout
      title="Vehicles"
      description="Manage registered vehicles"
      rightAction={
        <Pressable onPress={() => setFilterModalVisible(true)} style={styles.headerFilterBtn}>
          <Ionicons name="funnel-outline" size={16} color={theme.primaryForeground} />
          <ThemedText style={styles.headerFilterText}>Filter</ThemedText>
          {filterCount > 0 && (
            <View style={styles.headerFilterBadge}>
              <ThemedText style={styles.headerFilterBadgeText}>{filterCount}</ThemedText>
            </View>
          )}
        </Pressable>
      }
    >
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

      <View style={styles.fabWrap}>
        <FAB onPress={handleNewVehicle} label="New" />
      </View>

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

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    listContent: { paddingBottom: 200, paddingHorizontal: 16, flexGrow: 1 },
    listHeader: { paddingBottom: 8 },
    listHeaderText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderRadius: 10, borderWidth: 1,
      paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
    },
    searchInput: { flex: 1, fontSize: 14, padding: 0 },
    footer: { paddingVertical: 16, alignItems: 'center' },
    loadingContainer: { flex: 1, paddingTop: 80, alignItems: 'center' },

    emptyContainer: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      gap: 8, paddingHorizontal: 16, paddingTop: 60,
    },
    emptyIconWrap: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 8,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', color: theme.text },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

    fabWrap: {
      position: 'absolute', bottom: 120, right: 20,
    },
    headerFilterBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 8,
    },
    headerFilterText: { fontSize: 13, fontWeight: '700', color: theme.primaryForeground },
    headerFilterBadge: {
      position: 'absolute', top: -5, right: -5,
      backgroundColor: '#000', borderRadius: 10,
      width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    },
    headerFilterBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    filterSection: { padding: 16, gap: 10 },
    filterLabel: { fontSize: 12, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' },
    filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 8, borderWidth: 1, borderColor: theme.border,
      backgroundColor: theme.card,
    },
    filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    filterChipText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
    filterChipTextActive: { color: theme.primaryForeground },
  }), [theme]);
  return styles;
};
