import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Plus, SlidersHorizontal, ShieldHalf, KeySquare,
  X, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Pencil, Trash2, Check,
} from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { AppPicker } from '../../components/ui/AppPicker';
import { roleService, permissionService } from '../../services/management.service';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';
import { useTheme } from '../../lib/theme';

/* ─── helpers ─── */
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

const AVATAR_COLORS = ['#6B21A8', '#9333EA', '#7C3AED', '#4F46E5', '#4338CA', '#3730A3'];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

/* ─── Status chip ─── */
const StatusChip = ({ status }) => {
  const T = useTheme();
  const active = status === 'active';
  return (
    <View style={[
      chip.wrap, 
      active ? { backgroundColor: T.isDark ? '#064e3b' : '#ECFDF5' } : { backgroundColor: T.isDark ? '#7f1d1d' : '#FEF2F2' }
    ]}>
      {active
        ? <CheckCircle2 size={10} color={T.isDark ? '#34d399' : '#059669'} strokeWidth={2.5} />
        : <XCircle size={10} color={T.isDark ? '#f87171' : '#DC2626'} strokeWidth={2.5} />}
      <Text style={[
        chip.txt, 
        active ? { color: T.isDark ? '#34d399' : '#059669' } : { color: T.isDark ? '#f87171' : '#DC2626' }
      ]}>
        {active ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
};
const chip = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  txt: { fontSize: 11, fontWeight: '600' },
});

/* ─── Avatar ─── */
const Avatar = ({ name, id, size = 44 }) => {
  const T = useTheme();
  return (
    <View style={[av.circle, { width: size, height: size, borderRadius: size / 3, backgroundColor: avatarColor(id), opacity: T.isDark ? 0.75 : 0.95 }]}>
      <Text style={[av.txt, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
};
const av = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  txt: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
});

/* ─── Filter pill ─── */
const Pill = ({ label, on, onPress }) => {
  const T = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[pl.wrap, { backgroundColor: T.surface, borderColor: T.border }, on && { backgroundColor: T.primary, borderColor: T.primary }]}>
      <Text style={[pl.txt, { color: T.textMuted }, on && { color: T.primaryText || '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
};
const pl = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
  txt: { fontSize: 13, fontWeight: '500' },
});


/* ══════════════════════════════════════════════════════ */
export default function RolesScreen({ navigation }) {
  const T = useTheme();
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

  const groupedPerms = useMemo(() => {
    return allPerms.reduce((acc, p) => {
      const mod = p.module_name || 'General';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    }, {});
  }, [allPerms]);

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
      style={[s.row, { backgroundColor: T.surface, borderColor: T.border, borderWidth: T.isDark ? 1 : 0, elevation: T.isDark ? 0 : 1 }]}
      activeOpacity={0.7}
      onPress={() => handleView(role)}
    >
      <Avatar name={role.name} id={role.id} size={46} />

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={[s.rowName, { color: T.text }]} numberOfLines={1}>{role.name}</Text>
          <StatusChip status={role.status} />
        </View>
        <View style={s.rowMeta}>
          <KeySquare size={11} color={T.textMuted} strokeWidth={2} />
          <Text style={[s.slugTxt, { color: T.textMuted }]} numberOfLines={1}>{role.slug}</Text>
        </View>
      </View>

      <ChevronRight size={15} color={T.borderStrong} strokeWidth={2.5} />
    </TouchableOpacity>
  );

  const Separator = () => <View style={s.sep} />;

  const Empty = () => (
    <View style={s.emptyWrap}>
      <View style={[s.emptyIcon, { backgroundColor: T.surfaceAlt }]}>
        <ShieldHalf size={28} color={T.textMuted} strokeWidth={1.5} />
      </View>
      <Text style={[s.emptyTitle, { color: T.text }]}>No roles found</Text>
      <Text style={[s.emptySub, { color: T.textMuted }]}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: T.bg }]} edges={['top']}>

      {/* ── Top bar ── */}
      <View style={[s.topBar, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: T.surfaceAlt }]} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <ChevronLeft size={22} color={T.text} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        <View style={s.topLeft}>
          <Text style={[s.screenTitle, { color: T.text }]}>Roles</Text>
          <View style={[s.countBadge, { backgroundColor: T.surfaceAlt }]}>
            <Text style={[s.countTxt, { color: T.textMuted }]}>{displayData.length}</Text>
          </View>
        </View>
        {can('roles:write') && (
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: T.primary }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateRole')}
          >
            <Plus size={16} color={T.primaryText || '#fff'} strokeWidth={2.5} />
            <Text style={[s.addBtnTxt, { color: T.primaryText || '#fff' }]}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search + filter bar ── */}
      <View style={[s.searchBar, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
        <View style={[s.searchBox, { backgroundColor: T.surfaceAlt }]}>
          <Search size={15} color={T.textMuted} strokeWidth={2} />
          <TextInput
            style={[s.searchInput, { color: T.text }]}
            placeholder="Search roles or slugs…"
            placeholderTextColor={T.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={14} color={T.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.filterBtn, { backgroundColor: T.surfaceAlt }, activeFilters > 0 && { backgroundColor: T.primary }]}
          activeOpacity={0.75}
          onPress={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal size={15}
            color={activeFilters > 0 ? (T.primaryText || '#fff') : T.text} strokeWidth={2} />
          {activeFilters > 0 && (
            <View style={[s.filterDot, { backgroundColor: T.isDark ? '#60a5fa' : '#2563EB' }]}>
              <Text style={s.filterDotTxt}>{activeFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Filter pills ── */}
      {showFilters && (
        <View style={[s.filterPanel, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
          <View style={s.filterRow}>
            <Text style={[s.filterHeading, { color: T.textMuted }]}>Status</Text>
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
          <ActivityIndicator size="large" color={T.text} />
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
              <Text style={[s.profileName, { color: T.text }]}>{viewRole.name}</Text>
              <Text style={[s.heroSlug, { color: T.textMuted }]}>{viewRole.slug}</Text>
              <View style={{ marginTop: 6 }}><StatusChip status={viewRole.status} /></View>
            </View>

            {viewRole.description && (
              <Text style={[s.descBox, { backgroundColor: T.bg, borderColor: T.border, color: T.textMuted }]}>{viewRole.description}</Text>
            )}

            <View style={s.actionRow}>
              {can('roles:write') && (
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: T.isDark ? '#1e3a8a' : '#EFF6FF', borderColor: T.isDark ? '#1e3a8a' : '#BFDBFE' }]}
                  activeOpacity={0.75}
                  onPress={() => { setViewRole(null); setTimeout(() => openEdit(viewRole), 350); }}
                >
                  <Pencil size={15} color={T.isDark ? '#60a5fa' : '#2563EB'} strokeWidth={2} />
                  <Text style={[s.actionTxt, { color: T.isDark ? '#60a5fa' : '#2563EB' }]}>Edit Role</Text>
                </TouchableOpacity>
              )}
              {can('roles:delete') && (
                <TouchableOpacity
                  style={[s.actionBtnDanger, { backgroundColor: T.isDark ? '#7f1d1d' : '#FEF2F2', borderColor: T.isDark ? '#7f1d1d' : '#FECACA' }]}
                  activeOpacity={0.75}
                  onPress={() => handleDelete(viewRole)}
                >
                  <Trash2 size={15} color={T.isDark ? '#f87171' : '#DC2626'} strokeWidth={2} />
                  <Text style={[s.actionTxt, { color: T.isDark ? '#f87171' : '#DC2626' }]}>Delete</Text>
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
              <AppPicker 
                label="Status" 
                value={editForm.status} 
                onSelect={v => setEditForm(f => ({ ...f, status: v }))} 
                options={[
                  { id: 'active', name: 'Active' },
                  { id: 'inactive', name: 'Inactive' }
                ]} 
                placeholder="Select status" 
              />
            </View>

            <View style={[s.divider, { backgroundColor: T.surfaceAlt }]} />

            <View style={s.formGroup}>
              <Text style={[s.formSection, { color: T.text }]}>Coverage Grid</Text>
              <Text style={[s.coverageSub, { color: T.textFaint }]}>Select all granted capabilities.</Text>
              
              <View style={s.tableGroup}>
                {Object.entries(groupedPerms).map(([mod, perms]) => (
                  <View key={mod} style={s.tableSection}>
                    <View style={s.tableHeader}>
                      <Text style={s.tableHeaderTxt}>{mod}</Text>
                    </View>
                    {perms.map((p, idx) => {
                      const has = editForm.permissions.includes(p.slug);
                      return (
                        <TouchableOpacity 
                          key={p.slug} 
                          style={[s.tableRow, idx === perms.length - 1 && s.tableRowLast]} 
                          onPress={() => togglePermission(p.slug)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.tableCellLabel}>{p.permission_name}</Text>
                          <View style={[s.checkSq, has && s.checkSqOn]}>
                            {has && <Check size={12} color={T.primaryText || '#fff'} strokeWidth={3} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

            </View>
          </View>
        </ScrollView>
      </AppModal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 4,
  },
  topLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  countBadge: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  countTxt: { fontSize: 13, fontWeight: '600' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  addBtnTxt: { fontSize: 13, fontWeight: '600' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  filterDot: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  filterDotTxt: { fontSize: 9, fontWeight: '700', color: '#fff' },

  filterPanel: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterRow: { gap: 8 },
  filterHeading: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },

  flatContent: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 32 },
  flatEmpty: { flex: 1 },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 14, gap: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  rowName: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slugTxt: { fontSize: 12, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  sep: { height: 8 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 13 },

  profileWrap: { gap: 16 },
  profileHero: { alignItems: 'center', paddingVertical: 8 },
  profileName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginTop: 10 },
  heroSlug: { fontSize: 13, fontWeight: '500', marginTop: 3, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  descBox: { padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, fontSize: 14, lineHeight: 20 },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionBtnDanger: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  actionTxt: { fontSize: 14, fontWeight: '600' },

  formGroup: { gap: 8, marginTop: 4 },
  formLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  formSection: { fontSize: 15, fontWeight: '800' },
  coverageSub: { fontSize: 12, marginBottom: -4 },
  divider: { height: 1, marginVertical: 12, marginHorizontal: -20 },

  tableGroup: { gap: 16, marginTop: 16 },
  tableSection: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { padding: 10, borderBottomWidth: 1 },
  tableHeaderTxt: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  tableRowLast: { borderBottomWidth: 0 },
  tableCellLabel: { fontSize: 13, flex: 1, fontWeight: '500' },
  checkSq: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkSqOn: { borderWidth: 0 },
});
