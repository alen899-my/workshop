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
import type { Permission } from '@/features/permissions/services/permission.service';
import { permissionService } from '@/features/permissions/services/permission.service';
import { useRBAC } from '@/hooks/use-rbac';

import CreatePermissionScreen from '@/features/permissions/CreatePermissionScreen';
import PermissionCard from './components/PermissionCard';

const PAGE_SIZE = 20;

interface PermissionsScreenProps {
  onClose?: () => void;
}

export default function PermissionsScreen({ onClose }: PermissionsScreenProps) {
  const { can } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [filterModule, setFilterModule] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const [formModal, setFormModal] = useState<{
    visible: boolean; mode: 'create' | 'edit'; permission?: Permission;
  }>({ visible: false, mode: 'create' });
  const [viewModal, setViewModal] = useState<{
    visible: boolean; permission: Permission | null;
  }>({ visible: false, permission: null });
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean; permission?: Permission;
  }>({ visible: false });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((p) => ({ ...p, visible: false }));
  }, []);

  const fetchPermissions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await permissionService.getAll(filterStatus);
    if (res.success) {
      setPermissions(res.data);
      setDisplayCount(PAGE_SIZE);
    } else {
      showToast(res.error || 'Failed to load permissions', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [filterStatus, showToast]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const uniqueModules = useMemo(() => {
    const modules = new Set(permissions.map((p) => p.module_name));
    return Array.from(modules).sort();
  }, [permissions]);

  const searchFiltered = useMemo(() => {
    let filtered = permissions;
    if (filterModule) {
      filtered = filtered.filter((p) => p.module_name === filterModule);
    }
    if (!search.trim()) return filtered;
    const q = search.trim().toLowerCase();
    return filtered.filter((p) =>
      p.permission_name?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.module_name?.toLowerCase().includes(q)
    );
  }, [permissions, search, filterModule]);

  const displayedItems = useMemo(
    () => searchFiltered.slice(0, displayCount),
    [searchFiltered, displayCount],
  );

  const hasMore = displayCount < searchFiltered.length;

  const filterCount = (filterModule ? 1 : 0) + (filterStatus ? 1 : 0);

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, searchFiltered.length));
  }, [searchFiltered.length]);

  const handleNewPermission = useCallback(() => {
    if (!can('create:new:permission')) { showToast('Access Denied', 'error'); return; }
    setFormModal({ visible: true, mode: 'create' });
  }, [can, showToast]);

  const handleCardPress = useCallback((permission: Permission) => {
    setViewModal({ visible: true, permission });
  }, []);

  const handleEdit = useCallback((permission: Permission) => {
    setViewModal({ visible: false, permission: null });
    setFormModal({ visible: true, mode: 'edit', permission });
  }, []);

  const handleDelete = useCallback((permission: Permission) => {
    setViewModal({ visible: false, permission: null });
    if (!can('delete:permission')) {
      showToast('Access Denied: You do not have permission to delete permissions', 'error');
      return;
    }
    setDeleteConfirm({ visible: true, permission });
  }, [can, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    const permission = deleteConfirm.permission;
    if (!permission) return;
    setDeleteConfirm({ visible: false });
    const res = await permissionService.delete(permission.id);
    if (res.success) {
      showToast('Permission deleted successfully');
      fetchPermissions(true);
    } else {
      showToast(res.error || 'Failed to delete permission', 'error');
    }
  }, [deleteConfirm.permission, fetchPermissions, showToast]);

  const handleFormClose = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchPermissions(true);
  }, [fetchPermissions]);

  const handleFormSuccess = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchPermissions(true);
  }, [fetchPermissions]);

  const clearFilters = useCallback(() => {
    setFilterModule(undefined);
    setFilterStatus(undefined);
    setFilterModalVisible(false);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Permission }) => (
      <PermissionCard permission={item} onPress={handleCardPress} />
    ),
    [handleCardPress],
  );

  const ListHeader = useMemo(() => (
    <View>
      <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, slug or module..."
          placeholderTextColor={theme.textSecondary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
      {!loading && permissions.length > 0 && (
        <View style={styles.listHeader}>
          <ThemedText style={styles.listHeaderText}>
            {searchFiltered.length} permission{searchFiltered.length !== 1 ? 's' : ''}
            {filterCount > 0 && ' (filtered)'}
          </ThemedText>
        </View>
      )}
    </View>
  ), [loading, permissions.length, search, searchFiltered.length, filterCount, theme]);

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
          <Ionicons name="shield-checkmark-outline" size={28} color={theme.primary} />
        </View>
        <ThemedText style={styles.emptyTitle}>No Permissions</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          {filterCount > 0 ? 'No permissions match the current filter' : 'Create your first permission to get started'}
        </ThemedText>
      </View>
    );
  }, [loading, filterCount, theme]);

  const selectedPermission = viewModal.permission;

  return (
    <ScreenLayout
      title="Permissions"
      description="Manage system permissions"
      rightAction={
        <View style={styles.headerActions}>
          {onClose && (
            <Pressable onPress={onClose} style={styles.headerCloseBtn}>
              <Ionicons name="close" size={18} color={theme.primaryForeground} />
            </Pressable>
          )}
          <Pressable onPress={() => setFilterModalVisible(true)} style={styles.headerFilterBtn}>
            <Ionicons name="funnel-outline" size={16} color={theme.primaryForeground} />
            <ThemedText style={styles.headerFilterText}>Filter</ThemedText>
            {filterCount > 0 && (
              <View style={styles.headerFilterBadge}>
                <ThemedText style={styles.headerFilterBadgeText}>{filterCount}</ThemedText>
              </View>
            )}
          </Pressable>
        </View>
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
        onRefresh={() => fetchPermissions(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.fabWrap}>
        <FAB onPress={handleNewPermission} label="New" />
      </View>

      {/* View Detail Modal */}
      <Modal visible={viewModal.visible} animationType="slide" transparent onRequestClose={() => setViewModal({ visible: false, permission: null })}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setViewModal({ visible: false, permission: null })} />
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {selectedPermission && (
              <>
                <View style={styles.detailHeader}>
                  <View style={[styles.detailIconWrap, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="shield-checkmark-outline" size={32} color={theme.primary} />
                  </View>
                  <View style={styles.detailHeaderInfo}>
                    <ThemedText style={styles.detailName}>{selectedPermission.permission_name}</ThemedText>
                    <ThemedText style={styles.detailSlug}>{selectedPermission.slug}</ThemedText>
                  </View>
                  <View style={[
                    styles.detailStatusBadge,
                    { backgroundColor: selectedPermission.status === 'active' ? theme.success + '18' : theme.textSecondary + '18' },
                  ]}>
                    <View style={[
                      styles.detailStatusDot,
                      { backgroundColor: selectedPermission.status === 'active' ? theme.success : theme.textSecondary },
                    ]} />
                    <ThemedText style={[
                      styles.detailStatusText,
                      { color: selectedPermission.status === 'active' ? theme.success : theme.textSecondary },
                    ]}>
                      {selectedPermission.status}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Module</ThemedText>
                    <View style={[styles.moduleBadge, { backgroundColor: theme.info + '18' }]}>
                      <ThemedText style={[styles.moduleBadgeText, { color: theme.info }]}>
                        {selectedPermission.module_name}
                      </ThemedText>
                    </View>
                  </View>
                  {selectedPermission.description ? (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Description</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedPermission.description}</ThemedText>
                    </View>
                  ) : null}
                  {selectedPermission.created_at && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Created</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {new Date(selectedPermission.created_at).toLocaleDateString()}
                      </ThemedText>
                    </View>
                  )}
                  {selectedPermission.updated_at && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Updated</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {new Date(selectedPermission.updated_at).toLocaleDateString()}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.detailActions}>
                  {can('edit:permissions') && (
                    <Pressable
                      style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && styles.pressed]}
                      onPress={() => handleEdit(selectedPermission)}
                    >
                      <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.actionBtnText}>Edit</ThemedText>
                    </Pressable>
                  )}
                  {can('delete:permission') && (
                    <Pressable
                      style={({ pressed }) => [styles.actionBtn, styles.actionBtnDestructive, pressed && styles.pressed]}
                      onPress={() => handleDelete(selectedPermission)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.actionBtnText}>Delete</ThemedText>
                    </Pressable>
                  )}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                  onPress={() => setViewModal({ visible: false, permission: null })}
                >
                  <ThemedText style={styles.closeText}>Close</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Filter Sheet */}
      <ModalSheet visible={filterModalVisible} title="Filter Permissions" onClose={() => setFilterModalVisible(false)}>
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <ThemedText style={styles.filterLabel}>Module</ThemedText>
            <Pressable onPress={clearFilters}>
              <ThemedText style={styles.clearText}>Clear</ThemedText>
            </Pressable>
          </View>
          <View style={styles.filterChips}>
            {[undefined, ...uniqueModules].map((m) => {
              const active = filterModule === m;
              return (
                <Pressable
                  key={m || 'all'}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => { setFilterModule(m); setFilterModalVisible(false); }}
                >
                  <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {m || 'All'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.filterSection}>
          <ThemedText style={styles.filterLabel}>Status</ThemedText>
          <View style={styles.filterChips}>
            {[undefined, 'active', 'inactive'].map((s) => {
              const active = filterStatus === s;
              return (
                <Pressable
                  key={s || 'all'}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => { setFilterStatus(s); setFilterModalVisible(false); }}
                >
                  <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ModalSheet>

      {/* Create/Edit Modal */}
      <Modal visible={formModal.visible} animationType="slide" onRequestClose={handleFormClose}>
        <CreatePermissionScreen
          mode={formModal.mode}
          initialPermission={formModal.permission}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Modal>

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="Delete Permission"
        message={deleteConfirm.permission ? `Are you sure you want to delete "${deleteConfirm.permission.permission_name}"? This action cannot be undone.` : ''}
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

    // View Modal
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 23, 0.55)' },
    sheet: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingBottom: 36,
      maxHeight: '85%',
    },
    handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 14 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border },

    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    detailIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailHeaderInfo: { flex: 1 },
    detailName: { fontSize: 18, fontWeight: '800', color: theme.text },
    detailSlug: { fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginTop: 2, fontFamily: 'monospace' },
    detailStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    detailStatusDot: { width: 8, height: 8, borderRadius: 4 },
    detailStatusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

    detailSection: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 16,
      padding: 16,
      gap: 14,
      marginBottom: 20,
    },
    detailRow: { gap: 4 },
    detailLabel: { fontSize: 11, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
    detailValue: { fontSize: 14, fontWeight: '500', color: theme.text },
    moduleBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    moduleBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

    detailActions: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 46,
      borderRadius: 12,
    },
    actionBtnPrimary: { backgroundColor: theme.primary },
    actionBtnDestructive: { backgroundColor: theme.destructive },
    actionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

    closeBtn: {
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: { fontSize: 14, fontWeight: '700', color: theme.primaryForeground },
    pressed: { opacity: 0.8 },

    // Filter
    filterSection: { padding: 16, gap: 10 },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    filterLabel: { fontSize: 12, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' },
    clearText: { fontSize: 12, fontWeight: '700', color: theme.primary },
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
