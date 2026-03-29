import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Plus, SlidersHorizontal, ShieldHalf, KeySquare,
  X, ChevronRight, CheckCircle2, XCircle, Pencil, Trash2,
} from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { roleService, permissionService } from '../../services/management.service';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';

/* ─── helpers ─── */
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

const AVATAR_COLORS = ['#6B21A8', '#9333EA', '#7C3AED', '#4F46E5', '#4338CA', '#3730A3'];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

/* ─── Status chip ─── */
const StatusChip = ({ status }) => {
  const active = status === 'active';
  return (
    <View style={[chip.wrap, active ? chip.activeWrap : chip.inactiveWrap]}>
      {active
        ? <CheckCircle2 size={10} color="#059669" strokeWidth={2.5} />
        : <XCircle size={10} color="#DC2626" strokeWidth={2.5} />}
      <Text style={[chip.txt, active ? chip.activeTxt : chip.inactiveTxt]}>
        {active ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
};
const chip = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  activeWrap: { backgroundColor: '#ECFDF5' },
  inactiveWrap: { backgroundColor: '#FEF2F2' },
  txt: { fontSize: 11, fontWeight: '600' },
  activeTxt: { color: '#059669' },
  inactiveTxt: { color: '#DC2626' },
});

/* ─── Avatar ─── */
const Avatar = ({ name, id, size = 44 }) => (
  <View style={[av.circle, { width: size, height: size, borderRadius: size / 3, backgroundColor: avatarColor(id), opacity: 0.95 }]}>
    <Text style={[av.txt, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
  </View>
);
const av = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  txt: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
});

/* ─── Filter pill ─── */
const Pill = ({ label, on, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75}
    style={[pl.wrap, on && pl.on]}>
    <Text style={[pl.txt, on && pl.onTxt]}>{label}</Text>
  </TouchableOpacity>
);
const pl = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  on: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  txt: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  onTxt: { color: '#fff' },
});


/* ══════════════════════════════════════════════════════ */
export default function RolesScreen({ navigation }) {
  const [roles, setRoles] = useState([]);
  const [allPerms, setAllPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const [viewRole, setViewRole] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'active', permissions: [] });
  const [saving, setSaving] = useState(false);

  const { can } = useRBAC();
  const { toast } = useToast();

  const baseRoles = useMemo(() => roles.filter(r => r.slug !== 'admin'), [roles]);

  const displayData = useMemo(() => baseRoles.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.name?.toLowerCase().includes(q) && !r.slug?.toLowerCase().includes(q)) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  }), [baseRoles, search, filterStatus]);

  const activeFilters = [filterStatus].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    const [rRes, pRes] = await Promise.all([roleService.getAll(), permissionService.getAll()]);
    if (rRes.success) setRoles(rRes.data || []);
    if (pRes.success) setAllPerms(pRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleView = async (role) => {
    setViewRole(role);
    const res = await roleService.getById(role.id);
    if (res.success && res.data) setViewRole(res.data);
  };

  const openEdit = async (role) => {
    setEditForm({
      name: role.name || '',
      description: role.description || '',
      status: role.status || 'active',
      permissions: role.permissions || [],
    });
    setEditRole(role);
    const res = await roleService.getById(role.id);
    if (res.success && res.data) {
      setEditForm(prev => ({ ...prev, permissions: res.data.permissions || [] }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await roleService.update(editRole.id, editForm);
    setSaving(false);
    if (res.success) {
      setRoles(prev => prev.map(r => r.id === editRole.id ? { ...r, ...editForm } : r));
      setEditRole(null);
      toast({ type: 'success', title: 'Saved', description: 'Role policy updated.' });
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to update.' });
    }
  };

  const handleDelete = async (role) => {
    const res = await roleService.delete(role.id);
    if (res.success) {
      setRoles(prev => prev.filter(r => r.id !== role.id));
      setViewRole(null);
      toast({ type: 'success', title: 'Deleted', description: 'Role removed.' });
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to delete.' });
    }
  };

  const togglePermission = (slug) => {
    setEditForm(f => ({
      ...f,
      permissions: f.permissions.includes(slug)
        ? f.permissions.filter(p => p !== slug)
        : [...f.permissions, slug]
    }));
  };

  /* ── Row ── */
  const renderItem = ({ item: role }) => (
    <TouchableOpacity
      style={s.row}
      activeOpacity={0.7}
      onPress={() => handleView(role)}
    >
      <Avatar name={role.name} id={role.id} size={46} />

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={s.rowName} numberOfLines={1}>{role.name}</Text>
          <StatusChip status={role.status} />
        </View>
        <View style={s.rowMeta}>
          <KeySquare size={11} color="#9CA3AF" strokeWidth={2} />
          <Text style={s.slugTxt} numberOfLines={1}>{role.slug}</Text>
        </View>
      </View>

      <ChevronRight size={15} color="#D1D5DB" strokeWidth={2.5} />
    </TouchableOpacity>
  );

  /* ── Separator ── */
  const Separator = () => <View style={s.sep} />;

  /* ── Empty ── */
  const Empty = () => (
    <View style={s.emptyWrap}>
      <View style={s.emptyIcon}>
        <ShieldHalf size={28} color="#9CA3AF" strokeWidth={1.5} />
      </View>
      <Text style={s.emptyTitle}>No roles found</Text>
      <Text style={s.emptySub}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <Text style={s.screenTitle}>Roles</Text>
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{displayData.length}</Text>
          </View>
        </View>
        {can('roles:write') && (
          <TouchableOpacity
            style={s.addBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateRole')}
          >
            <Plus size={16} color="#fff" strokeWidth={2.5} />
            <Text style={s.addBtnTxt}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search + filter bar ── */}
      <View style={s.searchBar}>
        <View style={s.searchBox}>
          <Search size={15} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder="Search roles or slugs…"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={14} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.filterBtn, activeFilters > 0 && s.filterBtnOn]}
          activeOpacity={0.75}
          onPress={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal size={15}
            color={activeFilters > 0 ? '#fff' : '#374151'} strokeWidth={2} />
          {activeFilters > 0 && (
            <View style={s.filterDot}>
              <Text style={s.filterDotTxt}>{activeFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Filter pills ── */}
      {showFilters && (
        <View style={s.filterPanel}>
          <View style={s.filterRow}>
            <Text style={s.filterHeading}>Status</Text>
            <View style={s.pillRow}>
              {['', 'active', 'inactive'].map(v => (
                <Pill key={v} label={v || 'All'} on={filterStatus === v} onPress={() => setFilterStatus(v)} />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={s.loadWrap}>
          <ActivityIndicator size="large" color="#1C1C1E" />
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={u => String(u.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={Separator}
          ListEmptyComponent={Empty}
          contentContainerStyle={displayData.length === 0 ? s.flatEmpty : s.flatContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ══ View Modal ══ */}
      <AppModal
        visible={!!viewRole}
        onClose={() => setViewRole(null)}
        title="Role Policy"
      >
        {viewRole && (
          <View style={s.profileWrap}>
            <View style={s.profileHero}>
              <Avatar name={viewRole.name} id={viewRole.id} size={72} />
              <Text style={s.profileName}>{viewRole.name}</Text>
              <Text style={s.heroSlug}>{viewRole.slug}</Text>
              <View style={{ marginTop: 6 }}><StatusChip status={viewRole.status} /></View>
            </View>

            {viewRole.description && (
              <Text style={s.descBox}>{viewRole.description}</Text>
            )}

            <View style={s.actionRow}>
              {can('roles:write') && (
                <TouchableOpacity
                  style={s.actionBtn}
                  activeOpacity={0.75}
                  onPress={() => { setViewRole(null); setTimeout(() => openEdit(viewRole), 350); }}
                >
                  <Pencil size={15} color="#2563EB" strokeWidth={2} />
                  <Text style={[s.actionTxt, { color: '#2563EB' }]}>Edit Role</Text>
                </TouchableOpacity>
              )}
              {can('roles:delete') && (
                <TouchableOpacity
                  style={[s.actionBtn, s.actionBtnDanger]}
                  activeOpacity={0.75}
                  onPress={() => handleDelete(viewRole)}
                >
                  <Trash2 size={15} color="#DC2626" strokeWidth={2} />
                  <Text style={[s.actionTxt, { color: '#DC2626' }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </AppModal>

      {/* ══ Edit Modal ══ */}
      <AppModal
        visible={!!editRole}
        onClose={() => setEditRole(null)}
        title="Edit Role Policies"
        scrollable={false}
        footer={
          <>
            <AppButton title="Cancel" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => setEditRole(null)} />
            <AppButton title="Save changes" variant="primary" size="sm" loading={saving} style={{ flex: 1 }} onPress={handleSave} />
          </>
        }
      >
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ gap: 16, paddingBottom: 24 }}>
            <View style={{ gap: 8 }}>
              <AppInput label="Role Name" value={editForm.name}
                onChangeText={v => setEditForm(f => ({ ...f, name: v }))}
                placeholder="e.g. Area Manager" autoCapitalize="words" />
              <AppInput label="Description" value={editForm.description}
                onChangeText={v => setEditForm(f => ({ ...f, description: v }))}
                placeholder="Limits and capabilities..." multiline numberOfLines={2} />
            </View>
            
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Status</Text>
              <View style={s.pillRow}>
                {['active', 'inactive'].map(opt => (
                  <Pill key={opt}
                    label={opt.charAt(0).toUpperCase() + opt.slice(1)}
                    on={editForm.status === opt}
                    onPress={() => setEditForm(f => ({ ...f, status: opt }))} />
                ))}
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.formGroup}>
              <Text style={s.formSection}>Coverage Grid</Text>
              <Text style={s.coverageSub}>Select all granted capabilities.</Text>
              <View style={s.permGrid}>
                {allPerms.map(p => {
                  const has = editForm.permissions.includes(p.slug);
                  return (
                    <TouchableOpacity
                      key={p.slug}
                      activeOpacity={0.7}
                      onPress={() => togglePermission(p.slug)}
                      style={[s.permTile, has && s.permTileOn]}
                    >
                      <View style={[s.permBox, has && s.permBoxOn]}>
                        {has ? <CheckCircle2 size={12} color="#fff" strokeWidth={3} /> : <View style={s.permEmpty} />}
                      </View>
                      <Text style={[s.permTxt, has && s.permTxtOn]}>
                        {p.permission_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </AppModal>

    </SafeAreaView>
  );
}

/* ════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },

  /* top bar */
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  screenTitle: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  countBadge: {
    backgroundColor: '#F3F4F6', borderRadius: 99,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  countTxt: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1C1C1E', borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  addBtnTxt: { fontSize: 13, fontWeight: '600', color: '#fff' },

  /* search */
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1C1C1E', padding: 0 },
  filterBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  filterBtnOn: { backgroundColor: '#1C1C1E' },
  filterDot: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
  },
  filterDotTxt: { fontSize: 9, fontWeight: '700', color: '#fff' },

  /* filter panel */
  filterPanel: {
    backgroundColor: '#fff', paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 16, gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: { gap: 8 },
  filterHeading: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },

  /* list */
  flatContent: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 32 },
  flatEmpty: { flex: 1 },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    padding: 14, gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
    elevation: 1,
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  rowName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', flex: 1, marginRight: 8 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slugTxt: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  sep: { height: 8 },

  /* empty */
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#9CA3AF' },

  /* profile wrap */
  profileWrap: { gap: 16 },
  profileHero: { alignItems: 'center', paddingVertical: 8 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4, marginTop: 10 },
  heroSlug: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 3, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  descBox: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB', fontSize: 14, lineHeight: 20, color: '#4B5563' },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#BFDBFE',
  },
  actionBtnDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  actionTxt: { fontSize: 14, fontWeight: '600' },

  /* edit form */
  formGroup: { gap: 8, marginTop: 4 },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.3 },
  formSection: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
  coverageSub: { fontSize: 12, color: '#9CA3AF', marginBottom: -4 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12, marginHorizontal: -20 },

  /* nested perms */
  permGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  permTile: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  permTileOn: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
  permBox: { width: 16, height: 16, borderRadius: 4, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  permBoxOn: { backgroundColor: '#7C3AED' },
  permEmpty: { width: 16, height: 16 },
  permTxt: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  permTxtOn: { color: '#5B21B6', fontWeight: '600' },
});
