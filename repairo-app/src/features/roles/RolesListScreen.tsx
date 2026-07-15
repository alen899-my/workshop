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
import type { Role } from '@/features/roles/services/role.service';
import { roleService } from '@/features/roles/services/role.service';
import { useRBAC } from '@/hooks/use-rbac';

import RoleEditorScreen from '@/features/roles/RoleEditorScreen';
import RoleCard from './components/RoleCard';

const PAGE_SIZE = 20;

export default function RolesListScreen({ onClose }: { onClose?: () => void }) {
  const { can } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');

  const [editorModal, setEditorModal] = useState<{
    visible: boolean; mode: 'create' | 'edit'; role?: Role;
  }>({ visible: false, mode: 'create' });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean; role?: Role;
  }>({ visible: false });
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const fetchRoles = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await roleService.getAll();
    if (res.success) {
      setRoles(res.data);
      setDisplayCount(PAGE_SIZE);
    } else {
      showToast(res.error || 'Failed to load roles', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [showToast]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const searchFiltered = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.trim().toLowerCase();
    return roles.filter((r) =>
      r.name?.toLowerCase().includes(q) ||
      r.slug?.toLowerCase().includes(q)
    );
  }, [roles, search]);

  const displayedItems = useMemo(
    () => searchFiltered.slice(0, displayCount),
    [searchFiltered, displayCount],
  );

  const hasMore = displayCount < searchFiltered.length;

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, searchFiltered.length));
  }, [searchFiltered.length]);

  const handleNewRole = useCallback(() => {
    if (!can('create:role')) { showToast('Access Denied', 'error'); return; }
    setEditorModal({ visible: true, mode: 'create' });
  }, [can, showToast]);

  const handleRolePress = useCallback(async (role: Role) => {
    if (!can('edit:role')) { showToast('Access Denied', 'error'); return; }
    const res = await roleService.getById(role.id);
    if (res.success && res.data) {
      setEditorModal({ visible: true, mode: 'edit', role: res.data });
    } else {
      showToast(res.error || 'Failed to load role details', 'error');
    }
  }, [can, showToast]);

  const handleDeleteRole = useCallback((role: Role) => {
    if (!can('delete:role')) { showToast('Access Denied', 'error'); return; }
    setDeleteConfirm({ visible: true, role });
  }, [can, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    const role = deleteConfirm.role;
    if (!role) return;
    setDeleteConfirm({ visible: false });
    const res = await roleService.delete(role.id);
    if (res.success) {
      showToast('Role deleted successfully');
      fetchRoles(true);
    } else {
      showToast(res.error || 'Failed to delete role', 'error');
    }
  }, [deleteConfirm.role, fetchRoles, showToast]);

  const handleEditorClose = useCallback(() => {
    setEditorModal({ visible: false, mode: 'create' });
    fetchRoles(true);
  }, [fetchRoles]);

  const renderItem = useCallback(
    ({ item }: { item: Role }) => (
      <RoleCard
        role={item}
        onPress={handleRolePress}
        onDelete={can('delete:role') ? handleDeleteRole : undefined}
      />
    ),
    [handleRolePress, handleDeleteRole, can],
  );

  const ListHeader = useMemo(() => (
    <View>
      <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search roles..."
          placeholderTextColor={theme.textSecondary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
      {!loading && roles.length > 0 && (
        <View style={styles.listHeader}>
          <ThemedText style={styles.listHeaderText}>
            {searchFiltered.length} role{searchFiltered.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}
    </View>
  ), [loading, roles.length, search, searchFiltered.length, theme]);

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
          <Ionicons name="shield-half-outline" size={28} color={theme.primary} />
        </View>
        <ThemedText style={styles.emptyTitle}>No Roles</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          Create your first role to get started
        </ThemedText>
      </View>
    );
  }, [loading, theme]);

  return (
    <ScreenLayout
      title="Roles"
      description="Manage roles & permissions"
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
        onRefresh={() => fetchRoles(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.fabWrap}>
        <FAB onPress={handleNewRole} label="New Role" />
      </View>

      <Modal visible={editorModal.visible} animationType="slide" onRequestClose={handleEditorClose}>
        <RoleEditorScreen
          mode={editorModal.mode}
          initialRole={editorModal.role}
          onClose={handleEditorClose}
          onSuccess={handleEditorClose}
        />
      </Modal>

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="Delete Role"
        message={deleteConfirm.role ? `Are you sure you want to delete "${deleteConfirm.role.name}"? This action cannot be undone.` : ''}
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

    fabWrap: { position: 'absolute', bottom: 120, right: 20 },
    headerActions: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    headerCloseBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: 'center', justifyContent: 'center',
    },
  }), [theme]);
  return styles;
};
