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
import type { Customer } from '@/features/customers/services/customer.service';
import { customerService } from '@/features/customers/services/customer.service';
import { useRBAC } from '@/hooks/use-rbac';

import CreateCustomerScreen from '@/features/customers/CreateCustomerScreen';
import CustomerDetailScreen from '@/features/customers/CustomerDetailScreen';
import PastVisitsScreen from '@/features/customers/PastVisitsScreen';
import CustomerVehiclesScreen from '@/features/customers/CustomerVehiclesScreen';
import CustomerCard from './components/CustomerCard';
import CustomerActionsModal from './components/CustomerActionsModal';

const PAGE_SIZE = 20;

export default function CustomersListScreen() {
  const { can } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const [formModal, setFormModal] = useState<{
    visible: boolean; mode: 'create' | 'edit'; customer?: Customer;
  }>({ visible: false, mode: 'create' });
  const [actionsModal, setActionsModal] = useState<{
    visible: boolean; customer: Customer | null;
  }>({ visible: false, customer: null });
  const [detailModal, setDetailModal] = useState<{
    visible: boolean; customer: Customer | null;
  }>({ visible: false, customer: null });
  const [pastVisitsModal, setPastVisitsModal] = useState<{
    visible: boolean; customer: Customer | null;
  }>({ visible: false, customer: null });
  const [vehiclesModal, setVehiclesModal] = useState<{
    visible: boolean; customer: Customer | null;
  }>({ visible: false, customer: null });
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean; customer?: Customer;
  }>({ visible: false });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((p) => ({ ...p, visible: false }));
  }, []);

  const fetchCustomers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await customerService.getAll(filterStatus);
    if (res.success) {
      setCustomers(res.data);
      setDisplayCount(PAGE_SIZE);
    } else {
      showToast(res.error || 'Failed to load customers', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [filterStatus, showToast]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const searchFiltered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.trim().toLowerCase();
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const displayedItems = useMemo(
    () => searchFiltered.slice(0, displayCount),
    [searchFiltered, displayCount],
  );

  const hasMore = displayCount < searchFiltered.length;

  const filterCount = filterStatus ? 1 : 0;

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, searchFiltered.length));
  }, [searchFiltered.length]);

  const handleNewCustomer = useCallback(() => {
    if (!can('create:customers')) { showToast('Access Denied', 'error'); return; }
    setFormModal({ visible: true, mode: 'create' });
  }, [can, showToast]);

  const handleCardPress = useCallback((customer: Customer) => {
    setActionsModal({ visible: true, customer });
  }, []);

  const handleViewDetails = useCallback((customer: Customer) => {
    setActionsModal({ visible: false, customer: null });
    setDetailModal({ visible: true, customer });
  }, []);

  const handlePastVisits = useCallback((customer: Customer) => {
    setActionsModal({ visible: false, customer: null });
    setPastVisitsModal({ visible: true, customer });
  }, []);

  const handleVehicles = useCallback((customer: Customer) => {
    setActionsModal({ visible: false, customer: null });
    setVehiclesModal({ visible: true, customer });
  }, []);

  const handleEditFromModal = useCallback((customer: Customer) => {
    setActionsModal({ visible: false, customer: null });
    setFormModal({ visible: true, mode: 'edit', customer });
  }, []);

  const handleDeleteFromModal = useCallback((customer: Customer) => {
    setActionsModal({ visible: false, customer: null });
    if (!can('delete:customers')) {
      showToast('Access Denied: You do not have permission to delete customers', 'error');
      return;
    }
    setDeleteConfirm({ visible: true, customer });
  }, [can, showToast]);

  const handleDeleteCustomer = useCallback((customer: Customer) => {
    if (!can('delete:customers')) {
      showToast('Access Denied: You do not have permission to delete customers', 'error');
      return;
    }
    setDeleteConfirm({ visible: true, customer });
  }, [can, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    const customer = deleteConfirm.customer;
    if (!customer) return;
    setDeleteConfirm({ visible: false });
    const res = await customerService.delete(customer.id);
    if (res.success) {
      showToast('Customer deleted successfully');
      fetchCustomers(true);
    } else {
      showToast(res.error || 'Failed to delete customer', 'error');
    }
  }, [deleteConfirm.customer, fetchCustomers, showToast]);

  const handleFormClose = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchCustomers(true);
  }, [fetchCustomers]);

  const handleFormSuccess = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchCustomers(true);
  }, [fetchCustomers]);

  const handleDetailClose = useCallback(() => {
    setDetailModal({ visible: false, customer: null });
    fetchCustomers(true);
  }, [fetchCustomers]);

  const handleDeleteFromDetail = useCallback((customer: Customer) => {
    setDetailModal({ visible: false, customer: null });
    setDeleteConfirm({ visible: true, customer });
  }, []);

  const handleEditFromDetail = useCallback((customer: Customer) => {
    setDetailModal({ visible: false, customer: null });
    setFormModal({ visible: true, mode: 'edit', customer });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Customer }) => (
      <CustomerCard
        customer={item}
        onPress={handleCardPress}
        onDelete={can('delete:customers') ? handleDeleteCustomer : undefined}
      />
    ),
    [handleCardPress, handleDeleteCustomer, can],
  );

  const ListHeader = useMemo(() => (
    <View>
      <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or phone..."
          placeholderTextColor={theme.textSecondary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
      {!loading && customers.length > 0 && (
        <View style={styles.listHeader}>
          <ThemedText style={styles.listHeaderText}>
            {searchFiltered.length} customer{searchFiltered.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}
    </View>
  ), [loading, customers.length, search, searchFiltered.length, theme]);

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
          <Ionicons name="people-outline" size={28} color={theme.primary} />
        </View>
        <ThemedText style={styles.emptyTitle}>No Customers</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          {filterStatus ? 'No customers match the current filter' : 'Add your first customer to get started'}
        </ThemedText>
      </View>
    );
  }, [loading, filterStatus, theme]);

  return (
    <ScreenLayout
      title="Customers"
      description="Manage customer records"
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
        onRefresh={() => fetchCustomers(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.fabWrap}>
        <FAB onPress={handleNewCustomer} label="New" />
      </View>

      <CustomerActionsModal
        visible={actionsModal.visible}
        customer={actionsModal.customer}
        onClose={() => setActionsModal({ visible: false, customer: null })}
        onViewDetails={handleViewDetails}
        onPastVisits={handlePastVisits}
        onVehicles={handleVehicles}
        onEdit={handleEditFromModal}
        onDelete={handleDeleteFromModal}
        canEdit={can('edit:customers')}
        canDelete={can('delete:customers')}
      />

      <ModalSheet visible={filterModalVisible} title="Filter Customers" onClose={() => setFilterModalVisible(false)}>
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
        <CreateCustomerScreen
          mode={formModal.mode}
          initialCustomer={formModal.customer}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Modal>

      <Modal visible={detailModal.visible} animationType="slide" onRequestClose={handleDetailClose}>
        {detailModal.customer && (
          <CustomerDetailScreen
            customer={detailModal.customer}
            onClose={handleDetailClose}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteFromDetail}
          />
        )}
      </Modal>

      <Modal visible={pastVisitsModal.visible} animationType="slide" onRequestClose={() => setPastVisitsModal({ visible: false, customer: null })}>
        {pastVisitsModal.customer && (
          <PastVisitsScreen
            customer={pastVisitsModal.customer}
            onClose={() => setPastVisitsModal({ visible: false, customer: null })}
          />
        )}
      </Modal>

      <Modal visible={vehiclesModal.visible} animationType="slide" onRequestClose={() => setVehiclesModal({ visible: false, customer: null })}>
        {vehiclesModal.customer && (
          <CustomerVehiclesScreen
            customer={vehiclesModal.customer}
            onClose={() => setVehiclesModal({ visible: false, customer: null })}
          />
        )}
      </Modal>

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="Delete Customer"
        message={deleteConfirm.customer ? `Are you sure you want to delete customer "${deleteConfirm.customer.name}"? This action cannot be undone.` : ''}
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
