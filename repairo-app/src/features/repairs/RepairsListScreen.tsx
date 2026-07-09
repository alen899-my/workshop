import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable,
  StyleSheet, View,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import FAB from '@/components/FAB';
import ScreenLayout from '@/components/ScreenLayout';
import Toast from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import type { Repair, RepairFilters } from '@/features/repairs/services/repair.service';
import { repairService } from '@/features/repairs/services/repair.service';
import { useRBAC } from '@/hooks/use-rbac';

import CreateRepairScreen from '@/features/repairs/CreateRepairScreen';
import ViewRepairScreen from '@/features/repairs/ViewRepairScreen';
import GenerateBillScreen from '@/features/repairs/GenerateBillScreen';
import RepairCard from './components/RepairCard';
import RepairFilterModal from './components/RepairFilterModal';
import RepairActionsModal from './components/RepairActionsModal';
import DateStrip from '@/components/ui/DateStrip';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey = 'Pending' | 'Started' | 'Completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'Pending',   label: 'Pending'   },
  { key: 'Started',   label: 'Started'   },
  { key: 'Completed', label: 'Completed' },
];

const STATUS_ORDER: Record<string, number> = {
  Pending: 0, Started: 1, Completed: 2,
};

function sortRepairs(a: Repair, b: Repair): number {
  const aO = STATUS_ORDER[a.status] ?? 99;
  const bO = STATUS_ORDER[b.status] ?? 99;
  if (aO !== bO) return aO - bO;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

// ─── Segmented Control ────────────────────────────────────────────────────────

function SegmentedControl({
  activeTab, counts, onSelect,
}: {
  activeTab: TabKey;
  counts: Record<TabKey, number>;
  onSelect: (k: TabKey) => void;
}) {
  const theme = useTheme();
  const [containerW, setContainerW] = useState(0);
  const tabW = useMemo(() => (containerW - 6) / TABS.length, [containerW]);
  const startPad = 3;

  const segStyles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundElement,
      borderRadius: 10,
      padding: 2,
      position: 'relative',
    },
    pill: {
      position: 'absolute',
      top: 2,
      bottom: 2,
      backgroundColor: theme.primary,
      borderRadius: 8,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 4,
      zIndex: 1,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      letterSpacing: -0.2,
    },
    labelActive: {
      color: theme.primaryForeground,
      fontWeight: '700',
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundSelected,
    },
    badgeActive: {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
      includeFontPadding: false,
    },
    badgeTextActive: {
      color: theme.primaryForeground,
    },
  }), [theme]);

  const leftVal = useSharedValue(startPad + TABS.findIndex((t) => t.key === activeTab) * tabW);

  useEffect(() => {
    if (tabW > 0) {
      leftVal.value = withTiming(
        startPad + TABS.findIndex((t) => t.key === activeTab) * tabW,
        { duration: 250, easing: Easing.out(Easing.cubic) }
      );
    }
  }, [activeTab, tabW]);

  const pillStyle = useAnimatedStyle(() => ({
    left: leftVal.value,
  }));

  return (
    <View style={segStyles.container} onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}>
      {containerW > 0 && (
        <Animated.View pointerEvents="none" style={[segStyles.pill, { width: tabW }, pillStyle]} />
      )}
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={segStyles.tab}
          >
            <ThemedText style={[segStyles.label, active && segStyles.labelActive]}>
              {tab.label}
            </ThemedText>
            <View style={[segStyles.badge, active && segStyles.badgeActive]}>
              <ThemedText style={[segStyles.badgeText, active && segStyles.badgeTextActive]}>
                {counts[tab.key]}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RepairsListScreen() {
  const theme = useTheme();
  const styles = useStyles(theme);

  const { can } = useRBAC();

  const [repairs,              setRepairs]           = useState<Repair[]>([]);
  const [loading,              setLoading]           = useState(true);
  const [refreshing,           setRefreshing]        = useState(false);
  const [displayCount,         setDisplayCount]      = useState(PAGE_SIZE);
  const [filters,              setFilters]           = useState<RepairFilters>({});
  const [filterModalVisible,   setFilterModalVisible] = useState(false);
  const [activeTab,            setActiveTab]         = useState<TabKey>('Pending');
  const [selectedDate,         setSelectedDate]      = useState<string | null>(null);

  const [formModal, setFormModal] = useState<{
    visible: boolean; mode: 'create' | 'edit' | 'view'; repair?: Repair;
  }>({ visible: false, mode: 'create' });
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean; repair?: Repair;
  }>({ visible: false });
  const [actionsModal, setActionsModal] = useState<{
    visible: boolean; repair: Repair | null;
  }>({ visible: false, repair: null });
  const [billModal, setBillModal] = useState<{
    visible: boolean; repair: Repair | null;
  }>({ visible: false, repair: null });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((p) => ({ ...p, visible: false }));
  }, []);

  const fetchRepairs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await repairService.getAll(filters);
    if (res.success) {
      setRepairs(res.data.sort(sortRepairs));
      setDisplayCount(PAGE_SIZE);
    } else {
      showToast(res.error || 'Failed to load repairs', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [filters, showToast]);

  useEffect(() => { fetchRepairs(); }, [fetchRepairs]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { Pending: 0, Started: 0, Completed: 0 };
    for (const r of repairs) {
      if (selectedDate && (!r.repair_date || r.repair_date.split('T')[0] !== selectedDate)) continue;
      if (r.status === 'Pending')   counts.Pending++;
      if (r.status === 'Started')   counts.Started++;
      if (r.status === 'Completed') counts.Completed++;
    }
    return counts;
  }, [repairs, selectedDate]);

  const filteredRepairs = useMemo(() => {
    let list = repairs.filter((r) => r.status === activeTab);
    if (selectedDate) {
      list = list.filter((r) => r.repair_date && r.repair_date.split('T')[0] === selectedDate);
    }
    return list;
  }, [repairs, activeTab, selectedDate]);

  const displayedItems = useMemo(
    () => filteredRepairs.slice(0, displayCount),
    [filteredRepairs, displayCount],
  );

  const hasMore = displayCount < filteredRepairs.length;

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([k, v]) => k !== 'search' && v).length,
    [filters],
  );

  const availableWorkers = useMemo(() => {
    const seen = new Set<string>();
    return repairs
      .map((r) => r.attending_worker_name)
      .filter((w): w is string => !!w && !seen.has(w) && !!seen.add(w))
      .map((w) => ({ value: w, label: w }));
  }, [repairs]);

  const availableVehicleTypes = useMemo(() => {
    const seen = new Set<string>();
    return repairs
      .map((r) => r.vehicle_type)
      .filter((v): v is string => !!v && !seen.has(v) && !!seen.add(v))
      .map((v) => ({ value: v, label: v }));
  }, [repairs]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTabSelect = useCallback((key: TabKey) => {
    setActiveTab(key);
    setDisplayCount(PAGE_SIZE);
  }, []);

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredRepairs.length));
  }, [filteredRepairs.length]);

  const handleApplyFilters = useCallback((f: RepairFilters) => { setFilters(f); }, []);

  const handleNewRepair = useCallback(() => {
    if (!can('create:repair')) { showToast('Access Denied', 'error'); return; }
    setFormModal({ visible: true, mode: 'create' });
  }, [can, showToast]);

  const handleCardPress = useCallback((repair: Repair) => {
    setActionsModal({ visible: true, repair });
  }, []);

  const handleViewDetails = useCallback((repair: Repair) => {
    setActionsModal({ visible: false, repair: null });
    setFormModal({ visible: true, mode: 'view', repair });
  }, []);

  const handleEditDetails = useCallback((repair: Repair) => {
    setActionsModal({ visible: false, repair: null });
    setFormModal({ visible: true, mode: 'edit', repair });
  }, []);

  const handleGenerateBill = useCallback((repair: Repair) => {
    setActionsModal({ visible: false, repair: null });
    setBillModal({ visible: true, repair });
  }, []);

  const handleBillClose = useCallback(() => {
    setBillModal({ visible: false, repair: null });
    fetchRepairs(true);
  }, [fetchRepairs]);

  const handleDeleteRepair = useCallback((repair: Repair) => {
    if (!can('delete:repair')) {
      showToast('Access Denied: You do not have permission to delete repairs', 'error');
      return;
    }
    setDeleteConfirm({ visible: true, repair });
  }, [can, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    const repair = deleteConfirm.repair;
    if (!repair) return;
    setDeleteConfirm({ visible: false });
    const res = await repairService.delete(repair.id);
    if (res.success) {
      showToast('Repair job deleted successfully', 'success');
      fetchRepairs(true);
    } else {
      showToast(res.error || 'Failed to delete repair job', 'error');
    }
  }, [deleteConfirm.repair, fetchRepairs, showToast]);

  const handleTriggerDelete = useCallback((repair: Repair) => {
    setActionsModal({ visible: false, repair: null });
    handleDeleteRepair(repair);
  }, [handleDeleteRepair]);

  const handleStatusTransition = useCallback(async (repair: Repair, nextStatus: string) => {
    setActionsModal({ visible: false, repair: null });
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('vehicle_number', String(repair.vehicle_number || ''));
      fd.append('vehicle_type', String(repair.vehicle_type || 'Car'));
      fd.append('brand', String(repair.brand || ''));
      fd.append('model_name', String(repair.model_name || ''));
      fd.append('owner_name', String(repair.owner_name || ''));
      fd.append('phone_number', String(repair.phone_number || ''));
      fd.append('whatsapp_number', String(repair.whatsapp_number || ''));
      fd.append('km_reading', String(repair.km_reading || ''));
      fd.append('complaints', typeof repair.complaints === 'string' ? repair.complaints : JSON.stringify(repair.complaints || []));
      fd.append('service_type', String(repair.service_type || 'Repair'));
      if (repair.repair_date) fd.append('repair_date', String(repair.repair_date));
      if (repair.attending_worker_id) fd.append('attending_worker_id', String(repair.attending_worker_id));
      fd.append('priority', String(repair.priority || 'Medium'));
      if (repair.expected_completion) fd.append('expected_completion', String(repair.expected_completion));
      fd.append('status', String(nextStatus));
      if (repair.vehicle_image && !repair.vehicle_image.startsWith('file')) {
        fd.append('prefilled_image', String(repair.vehicle_image));
      }
      const res = await repairService.update(repair.id, fd);
      if (res.success) {
        showToast(`Status updated to ${nextStatus}`, 'success');
        fetchRepairs(true);
      } else {
        showToast(res.error || 'Failed to update status', 'error');
      }
    } catch (e) {
      showToast('Something went wrong updating status', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchRepairs, showToast]);

  const handleFormClose   = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchRepairs(true);
  }, [fetchRepairs]);
  const handleFormSuccess = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchRepairs(true);
  }, [fetchRepairs]);

  const handleUpdateRepair = useCallback((updated: Repair) => {
    setFormModal((prev) => ({ ...prev, repair: updated }));
    setRepairs((prev) => prev.map((r) => r.id === updated.id ? updated : r));
  }, []);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: Repair }) => (
      <RepairCard
        repair={item}
        onPress={handleCardPress}
        onDelete={can('delete:repair') ? handleDeleteRepair : undefined}
      />
    ),
    [handleCardPress, handleDeleteRepair, can],
  );

  const ListHeader = useMemo(() => (
    <View>
      {/* Date Strip */}
      <DateStrip selectedDate={selectedDate} onChange={setSelectedDate} />

      {/* Segmented tab bar */}
      <View style={styles.tabBarWrap}>
        <SegmentedControl activeTab={activeTab} counts={tabCounts} onSelect={handleTabSelect} />
      </View>

      {/* Summary */}
      {!loading && filteredRepairs.length > 0 && (
        <View style={styles.listHeader}>
          <ThemedText style={styles.listHeaderText}>
            {filteredRepairs.length} {activeTab.toLowerCase()} repair{filteredRepairs.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}
    </View>
  ), [loading, filteredRepairs.length, activeTab, tabCounts, handleTabSelect, selectedDate]);

  const ListFooter = useMemo(() => {
    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator color={theme.primary} /></View>;
    if (hasMore) return <View style={styles.footer}><ActivityIndicator size="small" color={theme.primary} /></View>;
    return null;
  }, [loading, hasMore]);

  const ListEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="build-outline" size={32} color={theme.primary} />
        </View>
        <ThemedText style={styles.emptyTitle}>No {activeTab} Jobs</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          No jobs are currently {activeTab.toLowerCase()}
        </ThemedText>
      </View>
    );
  }, [loading, activeTab]);

  return (
    <ScreenLayout
      title="Repairs"
      description="Track and manage vehicle repairs"
      rightAction={
        <Pressable onPress={() => setFilterModalVisible(true)} style={styles.headerFilterBtn}>
          <Ionicons name="funnel-outline" size={16} color={theme.primaryForeground} />
          <ThemedText style={styles.headerFilterText}>Filter</ThemedText>
          {activeFilterCount > 0 && (
            <View style={styles.headerFilterBadge}>
              <ThemedText style={styles.headerFilterBadgeText}>{activeFilterCount}</ThemedText>
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
        onRefresh={() => fetchRepairs(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.fabWrap}>
        <FAB onPress={handleNewRepair} label="New" />
      </View>

      <RepairFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        availableWorkers={availableWorkers}
        availableVehicleTypes={availableVehicleTypes}
      />

      <Modal visible={formModal.visible} animationType="slide" onRequestClose={handleFormClose}>
        {formModal.mode === 'view' && formModal.repair ? (
          <ViewRepairScreen
            repair={formModal.repair}
            onClose={handleFormClose}
            onEdit={() => {
              setFormModal((prev) => ({ ...prev, mode: 'edit' }));
            }}
            onUpdateRepair={handleUpdateRepair}
          />
        ) : (
          <CreateRepairScreen
            mode={formModal.mode}
            initialRepair={formModal.repair}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </Modal>

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="Delete Repair Job"
        message={deleteConfirm.repair ? `Are you sure you want to delete the repair job for vehicle "${deleteConfirm.repair.vehicle_number}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ visible: false })}
        type="destructive"
      />

      <RepairActionsModal
        visible={actionsModal.visible}
        repair={actionsModal.repair}
        onClose={() => setActionsModal({ visible: false, repair: null })}
        onViewDetails={handleViewDetails}
        onEditDetails={handleEditDetails}
        onStatusTransition={handleStatusTransition}
        onDelete={handleTriggerDelete}
        canDelete={can('delete:repair')}
        canEdit={can('edit:repair')}
        onGenerateBill={handleGenerateBill}
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
    </ScreenLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GAP = 14;

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    tabBarWrap: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 4,
    },

    listContent: { paddingBottom: 200, flexGrow: 1, paddingTop: 4 },
    listHeader: { paddingHorizontal: 20, paddingVertical: 8 },
    listHeaderText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      letterSpacing: 0.2,
    },
    footer: { paddingVertical: 20, alignItems: 'center' },
    loadingContainer: { flex: 1, paddingTop: 80, alignItems: 'center' },

    emptyContainer: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      gap: 6, paddingHorizontal: 24, paddingTop: 40,
    },
    emptyIconWrap: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 16, fontWeight: '700', textAlign: 'center',
      color: theme.text,
    },
    emptySubtitle: {
      fontSize: 13, textAlign: 'center', lineHeight: 18,
      color: theme.textSecondary,
    },

    fabWrap: {
      position: 'absolute', bottom: 120, right: 20,
    },
    headerFilterBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
      backgroundColor: theme.primary,
    },
    headerFilterText: {
      fontSize: 13, fontWeight: '700', color: theme.primaryForeground,
    },
    headerFilterBadge: {
      position: 'absolute', top: -5, right: -5,
      backgroundColor: theme.background, borderRadius: 7,
      width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    },
    headerFilterBadgeText: { color: theme.text, fontSize: 9, fontWeight: '800' },
  }), [theme]);
  return styles;
};
