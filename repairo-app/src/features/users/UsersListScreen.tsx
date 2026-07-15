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
import type { User } from '@/features/users/services/user.service';
import { userService } from '@/features/users/services/user.service';
import { useRBAC } from '@/hooks/use-rbac';

import CreateUserScreen from '@/features/users/CreateUserScreen';
import UserCard from './components/UserCard';

const PAGE_SIZE = 20;

export default function UsersListScreen({ onClose }: { onClose?: () => void }) {
  const { can, user } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const [formModal, setFormModal] = useState<{
    visible: boolean; mode: 'create' | 'edit'; user?: User;
  }>({ visible: false, mode: 'create' });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean; user?: User;
  }>({ visible: false });
  const [toast, setToast] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error' | 'info',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await userService.getAll(filterStatus);
    if (res.success) {
      setUsers(res.data);
      setDisplayCount(PAGE_SIZE);
    } else {
      showToast(res.error || 'Failed to load users', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [filterStatus, showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(users.map((u) => u.role));
    return Array.from(roles).sort();
  }, [users]);

  const searchFiltered = useMemo(() => {
    let filtered = users.filter((u) => u.id !== user?.userId);
    if (filterRole) {
      filtered = filtered.filter((u) => u.role === filterRole);
    }
    if (!search.trim()) return filtered;
    const q = search.trim().toLowerCase();
    return filtered.filter((u) =>
      u.name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [users, search, filterRole, user?.userId]);

  const displayedItems = useMemo(
    () => searchFiltered.slice(0, displayCount),
    [searchFiltered, displayCount],
  );

  const hasMore = displayCount < searchFiltered.length;
  const filterCount = (filterRole ? 1 : 0) + (filterStatus ? 1 : 0);

  const handleEndReached = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, searchFiltered.length));
  }, [searchFiltered.length]);

  const handleNewUser = useCallback(() => {
    if (!can('create:users')) { showToast('Access Denied', 'error'); return; }
    setFormModal({ visible: true, mode: 'create' });
  }, [can, showToast]);

  const handleUserPress = useCallback((user: User) => {
    if (!can('edit:users')) { showToast('Access Denied', 'error'); return; }
    setFormModal({ visible: true, mode: 'edit', user });
  }, [can, showToast]);

  const handleDeleteUser = useCallback((user: User) => {
    if (!can('delete:users')) { showToast('Access Denied', 'error'); return; }
    setDeleteConfirm({ visible: true, user });
  }, [can, showToast]);

  const handleConfirmDelete = useCallback(async () => {
    const user = deleteConfirm.user;
    if (!user) return;
    setDeleteConfirm({ visible: false });
    const res = await userService.delete(user.id);
    if (res.success) {
      showToast('User deleted successfully');
      fetchUsers(true);
    } else {
      showToast(res.error || 'Failed to delete user', 'error');
    }
  }, [deleteConfirm.user, fetchUsers, showToast]);

  const handleFormClose = useCallback(() => {
    setFormModal({ visible: false, mode: 'create' });
    fetchUsers(true);
  }, [fetchUsers]);

  const clearFilters = useCallback(() => {
    setFilterRole(undefined);
    setFilterStatus(undefined);
    setFilterModalVisible(false);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <UserCard
        user={item}
        onPress={handleUserPress}
        onDelete={can('delete:users') ? handleDeleteUser : undefined}
      />
    ),
    [handleUserPress, handleDeleteUser, can],
  );

  const ListHeader = useMemo(() => (
    <View>
      <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, phone or email..."
          placeholderTextColor={theme.textSecondary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
      {!loading && users.length > 0 && (
        <View style={styles.listHeader}>
          <ThemedText style={styles.listHeaderText}>
            {searchFiltered.length} user{searchFiltered.length !== 1 ? 's' : ''}
            {filterCount > 0 && ' (filtered)'}
          </ThemedText>
        </View>
      )}
    </View>
  ), [loading, users.length, search, searchFiltered.length, filterCount, theme]);

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
        <ThemedText style={styles.emptyTitle}>No Users</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          {filterCount > 0 ? 'No users match the current filter' : 'Add your first user to get started'}
        </ThemedText>
      </View>
    );
  }, [loading, filterCount, theme]);

  return (
    <ScreenLayout
      title="Users"
      description="Manage workshop users & staff"
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
        onRefresh={() => fetchUsers(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.fabWrap}>
        <FAB onPress={handleNewUser} label="New" />
      </View>

      <ModalSheet visible={filterModalVisible} title="Filter Users" onClose={() => setFilterModalVisible(false)}>
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <ThemedText style={styles.filterLabel}>Role</ThemedText>
            <Pressable onPress={clearFilters}>
              <ThemedText style={styles.clearText}>Clear</ThemedText>
            </Pressable>
          </View>
          <View style={styles.filterChips}>
            {[undefined, ...uniqueRoles].map((r) => {
              const active = filterRole === r;
              return (
                <Pressable
                  key={r || 'all'}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => { setFilterRole(r); setFilterModalVisible(false); }}
                >
                  <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {r ? r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
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

      <Modal visible={formModal.visible} animationType="slide" onRequestClose={handleFormClose}>
        <CreateUserScreen
          mode={formModal.mode}
          initialUser={formModal.user}
          onClose={handleFormClose}
          onSuccess={handleFormClose}
        />
      </Modal>

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="Delete User"
        message={deleteConfirm.user ? `Are you sure you want to delete "${deleteConfirm.user.name}"? This action cannot be undone.` : ''}
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
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerCloseBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: 'center', justifyContent: 'center',
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
