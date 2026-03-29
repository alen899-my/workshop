import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Plus, SlidersHorizontal, ShieldCheck, Tag,
  X, ChevronRight, CheckCircle2, XCircle, Pencil, Trash2, KeyRound
} from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { permissionService } from '../../services/management.service';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';

/* ─── helpers ─── */
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

const MODULE_COLORS = {
  users: '#2563EB',
  shops: '#059669',
  roles: '#7C3AED',
  permissions: '#D97706',
};
const getModColor = (mod) => MODULE_COLORS[mod?.toLowerCase()] || '#4B5563';
const getModBg = (mod) => (MODULE_COLORS[mod?.toLowerCase()] || '#4B5563') + '15';

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

/* ─── Mod Avatar ─── */
const ModAvatar = ({ mod, size = 44 }) => (
  <View style={[av.circle, { width: size, height: size, borderRadius: size / 3.5, backgroundColor: getModBg(mod) }]}>
    <ShieldCheck size={size * 0.45} color={getModColor(mod)} strokeWidth={2} />
  </View>
);
const av = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
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
export default function PermissionsScreen({ navigation }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState('');
  const [filterModule, setFilterModule] = useState('');

  const [viewPerm, setViewPerm] = useState(null);
  const [editPerm, setEditPerm] = useState(null);
  const [editForm, setEditForm] = useState({ permission_name: '', module_name: '', description: '', status: 'active' });
  const [saving, setSaving] = useState(false);

  const { can } = useRBAC();
  const { toast } = useToast();

  const uniqueModules = useMemo(() => {
    const seen = new Set();
    return permissions
      .filter(p => p.module_name && !seen.has(p.module_name) && seen.add(p.module_name))
      .map(p => p.module_name);
  }, [permissions]);

  const displayData = useMemo(() => permissions.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.permission_name?.toLowerCase().includes(q) && !p.slug?.toLowerCase().includes(q)) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterModule && p.module_name !== filterModule) return false;
    return true;
  }), [permissions, search, filterStatus, filterModule]);

  const activeFilters = [filterStatus, filterModule].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await permissionService.getAll();
    if (res.success) setPermissions(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = async (perm) => {
    setEditForm({
      permission_name: perm.permission_name || '',
      description: perm.description || '',
      status: perm.status || 'active',
      module_name: perm.module_name || '',
    });
    setEditPerm(perm);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await permissionService.update(editPerm.id, editForm);
    setSaving(false);
    if (res.success) {
      setPermissions(prev => prev.map(p => p.id === editPerm.id ? { ...p, ...editForm } : p));
      setEditPerm(null);
      toast({ type: 'success', title: 'Saved', description: 'Rule definition updated.' });
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to update.' });
    }
  };

  const handleDelete = async (perm) => {
    const res = await permissionService.delete(perm.id);
    if (res.success) {
      setPermissions(prev => prev.filter(p => p.id !== perm.id));
      setViewPerm(null);
      toast({ type: 'success', title: 'Removed', description: 'Permission rule dumped.' });
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to delete.' });
    }
  };

  /* ── Row ── */
  const renderItem = ({ item: perm }) => (
    <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => setViewPerm(perm)}>
      <ModAvatar mod={perm.module_name} size={46} />

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={s.rowName} numberOfLines={1}>{perm.permission_name}</Text>
          <StatusChip status={perm.status} />
        </View>
        <View style={s.rowMeta}>
          <Tag size={11} color="#9CA3AF" strokeWidth={2} />
          <Text style={s.modTxt} numberOfLines={1}>{perm.module_name}</Text>
          <Text style={s.dot}>·</Text>
          <KeyRound size={11} color={getModColor(perm.module_name)} strokeWidth={2} />
          <Text style={[s.slugTxt, { color: getModColor(perm.module_name) }]} numberOfLines={1}>{perm.slug}</Text>
        </View>
      </View>

      <ChevronRight size={15} color="#D1D5DB" strokeWidth={2.5} />
    </TouchableOpacity>
  );

  const Separator = () => <View style={s.sep} />;

  const Empty = () => (
    <View style={s.emptyWrap}>
      <View style={s.emptyIcon}>
        <ShieldCheck size={28} color="#9CA3AF" strokeWidth={1.5} />
      </View>
      <Text style={s.emptyTitle}>No permissions found</Text>
      <Text style={s.emptySub}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <Text style={s.screenTitle}>Permissions</Text>
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{displayData.length}</Text>
          </View>
        </View>
        {can('permissions:write') && (
          <TouchableOpacity
            style={s.addBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreatePermission')}
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
            placeholder="Search rules or slugs…"
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
          {uniqueModules.length > 0 && (
            <View style={s.filterRow}>
              <Text style={s.filterHeading}>Module</Text>
              <View style={s.pillRow}>
                <Pill label="All" on={!filterModule} onPress={() => setFilterModule('')} />
                {uniqueModules.map(m => (
                  <Pill key={m} label={m} on={filterModule === m} onPress={() => setFilterModule(m)} />
                ))}
              </View>
            </View>
          )}
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
        visible={!!viewPerm}
        onClose={() => setViewPerm(null)}
        title="Access Node"
      >
        {viewPerm && (
          <View style={s.profileWrap}>
            <View style={s.profileHero}>
              <ModAvatar mod={viewPerm.module_name} size={64} />
              <Text style={s.profileName}>{viewPerm.permission_name}</Text>
              <Text style={s.heroSlug}>{viewPerm.slug}</Text>
              <View style={{ marginTop: 6 }}><StatusChip status={viewPerm.status} /></View>
            </View>

            {viewPerm.description && (
              <Text style={s.descBox}>{viewPerm.description}</Text>
            )}

            <View style={s.actionRow}>
              {can('permissions:write') && (
                <TouchableOpacity
                  style={s.actionBtn}
                  activeOpacity={0.75}
                  onPress={() => { setViewPerm(null); setTimeout(() => openEdit(viewPerm), 350); }}
                >
                  <Pencil size={15} color="#2563EB" strokeWidth={2} />
                  <Text style={[s.actionTxt, { color: '#2563EB' }]}>Edit Rule</Text>
                </TouchableOpacity>
              )}
              {can('permissions:delete') && (
                <TouchableOpacity
                  style={[s.actionBtn, s.actionBtnDanger]}
                  activeOpacity={0.75}
                  onPress={() => handleDelete(viewPerm)}
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
        visible={!!editPerm}
        onClose={() => setEditPerm(null)}
        title="Edit Perimeter"
        footer={
          <>
            <AppButton title="Cancel" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => setEditPerm(null)} />
            <AppButton title="Save changes" variant="primary" size="sm" loading={saving} style={{ flex: 1 }} onPress={handleSave} />
          </>
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <AppInput label="Rule Title" value={editForm.permission_name}
            onChangeText={v => setEditForm(f => ({ ...f, permission_name: v }))}
            placeholder="e.g. Delete Posts" autoCapitalize="words" />
          <AppInput label="Module grouping" value={editForm.module_name}
            onChangeText={v => setEditForm(f => ({ ...f, module_name: v }))}
            placeholder="e.g. Posts / Shops / Auth" autoCapitalize="words" />
            
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

          <AppInput label="Description Context" value={editForm.description}
            onChangeText={v => setEditForm(f => ({ ...f, description: v }))}
            placeholder="Optional summary of this logic barrier..." multiline numberOfLines={2} />
        </KeyboardAvoidingView>
      </AppModal>

    </SafeAreaView>
  );
}

/* ════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },

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

  filterPanel: {
    backgroundColor: '#fff', paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 16, gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: { gap: 8 },
  filterHeading: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },

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
  modTxt: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  slugTxt: { fontSize: 11, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', opacity: 0.8 },
  dot: { fontSize: 12, color: '#E5E7EB' },
  sep: { height: 8 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#9CA3AF' },

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

  formGroup: { gap: 8, marginTop: 4, marginBottom: 8 },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.3 },
});
