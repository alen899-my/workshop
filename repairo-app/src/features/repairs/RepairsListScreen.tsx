import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import FAB from '@/components/FAB';
import ScreenLayout from '@/components/ScreenLayout';
import Toast from '@/components/ui/Toast';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import type {
  Repair,
  RepairFilters,
} from '@/features/repairs/services/repair.service';
import { repairService } from '@/features/repairs/services/repair.service';
import { useRBAC } from '@/hooks/use-rbac';

import CreateRepairScreen from '@/features/repairs/CreateRepairScreen';
import RepairCard from './components/RepairCard';
import RepairFilterModal from './components/RepairFilterModal';

const PAGE_SIZE = 20;
const FAB_SIZE = 56;
const FILTER_BTN_SIZE = 46;
const GAP = 14;

const STATUS_ORDER: Record<string, number> = {
  Pending: 0,
  Started: 1,
  'In Progress': 2,
  Completed: 3,
};

function sortRepairs(a: Repair, b: Repair): number {
  const aOrder = STATUS_ORDER[a.status] ?? 99;
  const bOrder = STATUS_ORDER[b.status] ?? 99;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function FilterFAB({ onPress, count }: { onPress: () => void; count: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.9); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={styles.filterFab}
      >
        <Ionicons name="funnel-outline" size={20} color={Colors.textInverse} />
        {count > 0 && (
          <View style={styles.filterFabBadge}>
            <ThemedText style={styles.filterFabBadgeText}>{count}</ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function RepairsListScreen() {
  const { can } = useRBAC();

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState<RepairFilters>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [formModal, setFormModal] = useState<{ visible: boolean; mode: 'create' | 'edit' | 'view'; repair?: Repair }>({ visible: false, mode: 'create' });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
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

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, repairs.length));
  }, [repairs.length]);

  const displayedItems = useMemo(
    () => repairs.slice(0, displayCount),
    [repairs, displayCount],
  );

  const hasMore = displayCount < repairs.length;

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

  const handleApplyFilters = useCallback((newFilters: RepairFilters) => {
    setFilters(newFilters);
  }, []);

  const handleNewRepair = useCallback(() => {
    if (!can('create:repair')) {
      showToast('Access Denied', 'error');
      return;
    }
    setFormModal({ visible: true, mode: 'create' });
  }, [can, showToast]);

  const handleCardPress = useCallback((repair: Repair) => {
    setFormModal({ visible: true, mode: can('edit:repair') ? 'edit' : 'view', repair });
  }, [can]);

  const handleFormClose = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
  }, []);

  const handleFormSuccess = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchRepairs(true);
  }, [fetchRepairs]);

  const renderItem = useCallback(
    ({ item }: { item: Repair }) => <RepairCard repair={item} onPress={handleCardPress} />,
    [handleCardPress],
  );

  const renderListHeader = useMemo(() => {
    if (loading || repairs.length === 0) return null;
    return (
      <View style={styles.listHeader}>
        <ThemedText style={styles.listHeaderText}>
          {repairs.length} repair{repairs.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>
    );
  }, [loading, repairs.length]);

  const renderListFooter = useMemo(() => {
    if (loading) return null;
    if (hasMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    return null;
  }, [loading, hasMore]);

  const renderEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="build-outline" size={56} color={Colors.tabIconDefault} />
        <ThemedText style={styles.emptyTitle}>No Repairs Found</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          {Object.keys(filters).some((k) => filters[k as keyof RepairFilters])
            ? 'Try adjusting your filters'
            : 'Create a new repair to get started'}
        </ThemedText>
      </View>
    );
  }, [loading, filters]);

  return (
    <ScreenLayout title="Repairs">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <FlatList
        data={displayedItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={() => fetchRepairs(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.floatingColumn}>
        <FilterFAB onPress={() => setFilterModalVisible(true)} count={activeFilterCount} />
        <FAB onPress={handleNewRepair} />
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
        <CreateRepairScreen
          mode={formModal.mode}
          initialRepair={formModal.repair}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 180, flexGrow: 1 },
  listHeader: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  listHeaderText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  footer: { paddingVertical: Spacing.four, alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  floatingColumn: {
    position: 'absolute', bottom: 120, right: 24,
    alignItems: 'center', gap: GAP,
  },
  filterFab: {
    width: FILTER_BTN_SIZE, height: FILTER_BTN_SIZE, borderRadius: FILTER_BTN_SIZE / 2,
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
});
