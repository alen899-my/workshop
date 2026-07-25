import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenLayout from '@/components/ScreenLayout';
import Toast from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import type { BillListItem } from '@/features/repairs/services/bill.service';
import { billService } from '@/features/repairs/services/bill.service';
import { useRBAC } from '@/hooks/use-rbac';
import type { Repair } from '@/features/repairs/services/repair.service';
import { repairService } from '@/features/repairs/services/repair.service';

import InvoiceCard from './components/InvoiceCard';
import InvoiceActionsModal from './components/InvoiceActionsModal';
import GenerateBillScreen from '@/features/repairs/GenerateBillScreen';

const PAGE_SIZE = 20;

export default function InvoicesListScreen() {
  const theme = useTheme();
  const styles = useStyles(theme);
  const { can } = useRBAC();

  const [invoices, setInvoices] = useState<BillListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const [actionsModal, setActionsModal] = useState<{
    visible: boolean; invoice: BillListItem | null;
  }>({ visible: false, invoice: null });
  const [billModal, setBillModal] = useState<{
    visible: boolean; repair: Repair | null;
  }>({ visible: false, repair: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean; invoice: BillListItem | null;
  }>({ visible: false, invoice: null });
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);
  const hideToast = useCallback(() => {
    setToast((p) => ({ ...p, visible: false }));
  }, []);

  const fetchInvoices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await billService.getAll({
      search: search || undefined,
      payment_status: filterPayment || undefined,
    });
    if (res.success && res.data) {
      setInvoices(res.data);
      setDisplayCount(PAGE_SIZE);
    } else {
      showToast(res.error || 'Failed to load invoices', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [search, filterPayment, showToast]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => invoices, [invoices]);

  const displayedItems = useMemo(
    () => filteredInvoices.slice(0, displayCount),
    [filteredInvoices, displayCount],
  );

  const hasMore = displayCount < filteredInvoices.length;

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredInvoices.length));
  }, [filteredInvoices.length]);

  const handleCardPress = useCallback((invoice: BillListItem) => {
    setActionsModal({ visible: true, invoice });
  }, []);

  const handleViewBill = useCallback(async (invoice: BillListItem) => {
    setActionsModal({ visible: false, invoice: null });
    const res = await repairService.getById(invoice.repair_id);
    if (res.success && res.data) {
      setBillModal({ visible: true, repair: res.data });
    } else {
      showToast('Could not load repair details', 'error');
    }
  }, [showToast]);

  const handleBillClose = useCallback(() => {
    setBillModal({ visible: false, repair: null });
    fetchInvoices(true);
  }, [fetchInvoices]);

  const handleDeleteInvoice = useCallback((invoice: BillListItem) => {
    if (!can('edit:repair')) {
      showToast('Access Denied', 'error');
      return;
    }
    setActionsModal({ visible: false, invoice: null });
    setDeleteConfirm({ visible: true, invoice });
  }, [can, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    const inv = deleteConfirm.invoice;
    if (!inv?.id) return;
    setDeleteConfirm({ visible: false, invoice: null });
    const res = await billService.delete(inv.id);
    if (res.success) {
      showToast('Invoice deleted successfully', 'success');
      fetchInvoices(true);
    } else {
      showToast(res.error || 'Failed to delete invoice', 'error');
    }
  }, [deleteConfirm.invoice, fetchInvoices, showToast]);

  // ── Render ──

  const renderItem = useCallback(
    ({ item }: { item: BillListItem }) => (
      <InvoiceCard
        invoice={item}
        onPress={handleCardPress}
        onDelete={can('edit:repair') ? handleDeleteInvoice : undefined}
      />
    ),
    [handleCardPress, handleDeleteInvoice, can],
  );

  const ListHeader = useMemo(() => (
    <View style={{ gap: 10, paddingBottom: 4 }}>
      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search vehicle or owner..."
          placeholderTextColor={theme.tabIconDefault}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Payment filter pills */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
        {['', 'Paid', 'Unpaid'].map((p) => {
          const active = filterPayment === p;
          return (
            <Pressable
              key={p}
              style={[
                styles.filterPill,
                { backgroundColor: active ? theme.primary : theme.card, borderColor: active ? theme.primary : theme.border },
              ]}
              onPress={() => setFilterPayment(p)}
            >
              <ThemedText style={[
                styles.filterPillText,
                { color: active ? theme.primaryForeground : theme.textSecondary },
              ]}>
                {p || 'All'}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Count */}
      {!loading && filteredInvoices.length > 0 && (
        <View style={{ paddingHorizontal: 4, paddingTop: 4 }}>
          <ThemedText style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}
    </View>
  ), [search, filterPayment, loading, filteredInvoices.length, theme, styles]);

  const ListFooter = useMemo(() => {
    if (loading) return <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={theme.primary} /></View>;
    if (hasMore) return <View style={{ paddingVertical: 20, alignItems: 'center' }}><ActivityIndicator size="small" color={theme.primary} /></View>;
    return null;
  }, [loading, hasMore, theme.primary]);

  const ListEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="receipt-outline" size={32} color={theme.primary} />
        </View>
        <ThemedText style={styles.emptyTitle}>No Invoices</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          {search || filterPayment
            ? 'No invoices match your search'
            : 'Invoices appear here once you generate bills from repairs'}
        </ThemedText>
      </View>
    );
  }, [loading, search, filterPayment, theme]);

  return (
    <ScreenLayout
      title="Invoices"
      description="All generated bills and financial records"
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
        onRefresh={() => fetchInvoices(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <InvoiceActionsModal
        visible={actionsModal.visible}
        invoice={actionsModal.invoice}
        onClose={() => setActionsModal({ visible: false, invoice: null })}
        onViewBill={handleViewBill}
        onDelete={handleDeleteInvoice}
      />

      <Modal visible={billModal.visible} animationType="slide" onRequestClose={handleBillClose}>
        {billModal.repair && (
          <GenerateBillScreen
            repair={billModal.repair}
            onClose={handleBillClose}
            onSuccess={handleBillClose}
          />
        )}
      </Modal>

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="Delete Invoice"
        message={deleteConfirm.invoice
          ? `Are you sure you want to delete the invoice for "${deleteConfirm.invoice.vehicle_number}"? This action cannot be undone.`
          : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ visible: false, invoice: null })}
        type="destructive"
      />
    </ScreenLayout>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(() => StyleSheet.create({
    listContent: { paddingBottom: 200, flexGrow: 1, paddingTop: 8 },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 44,
      marginHorizontal: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      paddingVertical: 0,
    },
    filterPill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterPillText: {
      fontSize: 12,
      fontWeight: '700',
    },
    emptyContainer: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      gap: 6, paddingHorizontal: 24, paddingTop: 40,
    },
    emptyIconWrap: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', color: theme.text },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18, color: theme.textSecondary },
  }), [theme]);
};
