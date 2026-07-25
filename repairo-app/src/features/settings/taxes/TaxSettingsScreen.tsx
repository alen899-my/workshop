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
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useRBAC } from '@/hooks/use-rbac';
import { taxService, type Tax } from '@/features/repairs/services/tax.service';

import TaxCard from './components/TaxCard';
import TaxFormModal from './components/TaxFormModal';

const PAGE_SIZE = 20;

interface TaxSettingsScreenProps {
  onClose?: () => void;
}

export default function TaxSettingsScreen({ onClose }: TaxSettingsScreenProps) {
  const { can } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);
  const canManage = can('manage:settings');

  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');

  const [formModal, setFormModal] = useState<{
    visible: boolean; mode: 'create' | 'edit'; tax?: Tax;
  }>({ visible: false, mode: 'create' });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean; tax?: Tax;
  }>({ visible: false });
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const fetchTaxes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await taxService.getAll();
    if (res.success) {
      setTaxes(res.data);
      setDisplayCount(PAGE_SIZE);
    } else {
      showToast(res.error || 'Failed to load taxes', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [showToast]);

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

  const searchFiltered = useMemo(() => {
    if (!search.trim()) return taxes;
    const q = search.trim().toLowerCase();
    return taxes.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  }, [taxes, search]);

  const displayedItems = useMemo(
    () => searchFiltered.slice(0, displayCount),
    [searchFiltered, displayCount],
  );

  const hasMore = displayCount < searchFiltered.length;

  const activeTaxes = taxes.filter((t) => t.is_active);
  const inactiveTaxes = taxes.filter((t) => !t.is_active);
  const combinedRate = activeTaxes.reduce((acc, t) => acc + Number(t.rate), 0);

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, searchFiltered.length));
  }, [searchFiltered.length]);

  const handleNewTax = useCallback(() => {
    if (!canManage) { showToast('Access Denied', 'error'); return; }
    setFormModal({ visible: true, mode: 'create' });
  }, [canManage, showToast]);

  const handleEditTax = useCallback((tax: Tax) => {
    if (!canManage) { showToast('Access Denied', 'error'); return; }
    setFormModal({ visible: true, mode: 'edit', tax });
  }, [canManage, showToast]);

  const handleToggleTax = useCallback(async (tax: Tax) => {
    if (!canManage) { showToast('Access Denied', 'error'); return; }
    const newActive = !tax.is_active;
    setTaxes((prev) => prev.map((t) => t.id === tax.id ? { ...t, is_active: newActive } : t));
    const res = await taxService.update(tax.id, { is_active: newActive });
    if (!res.success) {
      setTaxes((prev) => prev.map((t) => t.id === tax.id ? { ...t, is_active: tax.is_active } : t));
    }
  }, [canManage, showToast]);

  const handleDeleteTax = useCallback((tax: Tax) => {
    if (!canManage) { showToast('Access Denied', 'error'); return; }
    setDeleteConfirm({ visible: true, tax });
  }, [canManage, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    const tax = deleteConfirm.tax;
    if (!tax) return;
    setDeleteConfirm({ visible: false });
    const res = await taxService.delete(tax.id);
    if (res.success) {
      setTaxes((prev) => prev.filter((t) => t.id !== tax.id));
      showToast('Tax deleted successfully');
    } else {
      showToast(res.error || 'Failed to delete tax', 'error');
    }
  }, [deleteConfirm.tax, showToast]);

  const handleFormClose = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchTaxes(true);
  }, [fetchTaxes]);

  const renderItem = useCallback(
    ({ item }: { item: Tax }) => (
      <TaxCard
        tax={item}
        onEdit={canManage ? handleEditTax : undefined}
        onToggle={canManage ? handleToggleTax : undefined}
        onDelete={canManage ? handleDeleteTax : undefined}
      />
    ),
    [handleEditTax, handleToggleTax, handleDeleteTax, canManage],
  );

  const ListHeader = useMemo(() => (
    <View>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.success + '08', borderColor: theme.success + '20' }]}>
          <ThemedText style={[styles.statLabel, { color: theme.success }]}>Active</ThemedText>
          <ThemedText style={[styles.statValue, { color: theme.success }]}>{activeTaxes.length}</ThemedText>
          <ThemedText style={styles.statHint}>Applied to bills</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Inactive</ThemedText>
          <ThemedText style={[styles.statValue, { color: theme.text }]}>{inactiveTaxes.length}</ThemedText>
          <ThemedText style={styles.statHint}>Saved, not applied</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}>
          <ThemedText style={[styles.statLabel, { color: theme.primary }]}>Combined</ThemedText>
          <ThemedText style={[styles.statValue, { color: theme.primary }]}>{combinedRate.toFixed(1)}%</ThemedText>
          <ThemedText style={styles.statHint}>Total rate</ThemedText>
        </View>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '18' }]}>
        <View style={[styles.infoIcon, { backgroundColor: theme.primary + '12' }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
        </View>
        <View style={styles.infoContent}>
          <ThemedText style={styles.infoTitle}>Understanding Tax Rules</ThemedText>
          <ThemedText style={styles.infoDesc}>
            We support both Extra Tax (added on top) and Included Tax (built-in).
            Apply to spare parts, labor, or the entire bill.
          </ThemedText>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search taxes..."
          placeholderTextColor={theme.textSecondary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  ), [loading, taxes, search, searchFiltered.length, theme, activeTaxes.length, inactiveTaxes.length, combinedRate]);

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
          <Ionicons name="calculator-outline" size={28} color={theme.primary} />
        </View>
        <ThemedText style={styles.emptyTitle}>No Tax Rules</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          {search
            ? 'No taxes match your search criteria'
            : 'Add a tax rule (like GST, VAT, or Sales Tax) to have it automatically applied on every new bill.'}
        </ThemedText>
        {canManage && !search && (
          <Pressable
            style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed, { backgroundColor: theme.primary }]}
            onPress={handleNewTax}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <ThemedText style={styles.emptyBtnText}>Create First Tax Rule</ThemedText>
          </Pressable>
        )}
      </View>
    );
  }, [loading, theme, search, canManage, handleNewTax]);

  return (
    <ScreenLayout
      title="Tax Settings"
      description="Manage tax rules for bills"
      rightAction={
        <View style={styles.headerActions}>
          {onClose && (
            <Pressable onPress={onClose} style={styles.headerCloseBtn}>
              <Ionicons name="close" size={18} color={theme.primaryForeground} />
            </Pressable>
          )}
        </View>
      }
    >
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />

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
        onRefresh={() => fetchTaxes(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {canManage && (
        <View style={styles.fabWrap}>
          <FAB onPress={handleNewTax} label="Add Tax" />
        </View>
      )}

      <Modal visible={formModal.visible} animationType="slide" onRequestClose={handleFormClose}>
        <TaxFormModal
          mode={formModal.mode}
          initialTax={formModal.tax}
          onClose={handleFormClose}
          onSuccess={handleFormClose}
        />
      </Modal>

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="Delete Tax"
        message={deleteConfirm.tax ? `Are you sure you want to delete "${deleteConfirm.tax.name}"? Existing bills with this tax won't be affected.` : ''}
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
    loadingContainer: { flex: 1, paddingTop: 80, alignItems: 'center' },
    footer: { paddingVertical: 16, alignItems: 'center' },

    statsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      gap: 2,
    },
    statLabel: {
      fontSize: 9,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
    },
    statHint: {
      fontSize: 8,
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    infoBanner: {
      flexDirection: 'row',
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      gap: 12,
      marginBottom: 14,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoContent: {
      flex: 1,
      gap: 4,
    },
    infoTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    infoDesc: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.textSecondary,
      lineHeight: 16,
    },

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
    },
    searchInput: { flex: 1, fontSize: 14, padding: 0 },

    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 60,
    },
    emptyIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      color: theme.text,
    },
    emptySubtitle: {
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
      paddingHorizontal: 20,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
    },
    emptyBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    fabWrap: { position: 'absolute', bottom: 120, right: 20 },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.85 },
  }), [theme]);
  return styles;
};
