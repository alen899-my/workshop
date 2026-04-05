import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Plus, SlidersHorizontal, ShieldCheck, Tag,
  X, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Pencil, Trash2, KeyRound
} from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { AppPicker } from '../../components/ui/AppPicker';
import { AppInput } from '../../components/ui/AppInput';
import { permissionService } from '../../services/management.service';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';
import { useTheme } from '../../lib/theme';

/* ─── helpers ─── */
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

const MODULE_COLORS = {
  users: '#2563EB',
  shops: '#059669',
  roles: '#7C3AED',
  permissions: '#D97706',
};
const getModColor = (mod, isDark) => {
  const base = MODULE_COLORS[mod?.toLowerCase()] || '#4B5563';
  if (isDark) {
      if (base === '#2563EB') return '#60a5fa'; // lighter blue
      if (base === '#059669') return '#34d399'; // lighter green
      if (base === '#7C3AED') return '#a78bfa'; // lighter purple
      if (base === '#D97706') return '#fbbf24'; // lighter amber
      return '#9ca3af';
  }
  return base;
};
const getModBg = (mod, isDark) => {
  const color = getModColor(mod, isDark);
  return color + (isDark ? '20' : '15');
};

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

/* ─── Mod Avatar ─── */
const ModAvatar = ({ mod, size = 44 }) => {
  const T = useTheme();
  return (
    <View style={[av.circle, { width: size, height: size, borderRadius: size / 3.5, backgroundColor: getModBg(mod, T.isDark) }]}>
      <ShieldCheck size={size * 0.45} color={getModColor(mod, T.isDark)} strokeWidth={2} />
    </View>
  );
};
const av = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
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
export default function PermissionsScreen({ navigation }) {
  const T = useTheme();
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
    <TouchableOpacity 
      style={[s.row, { backgroundColor: T.surface, borderColor: T.border, borderWidth: T.isDark ? 1 : 0, elevation: T.isDark ? 0 : 1 }]} 
      activeOpacity={0.7} 
      onPress={() => setViewPerm(perm)}
    >
      <ModAvatar mod={perm.module_name} size={46} />

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={[s.rowName, { color: T.text }]} numberOfLines={1}>{perm.permission_name}</Text>
          <StatusChip status={perm.status} />
        </View>
        <View style={s.rowMeta}>
          <Tag size={11} color={T.textMuted} strokeWidth={2} />
          <Text style={[s.modTxt, { color: T.textMuted }]} numberOfLines={1}>{perm.module_name}</Text>
          <Text style={[s.dot, { color: T.borderStrong }]}>·</Text>
          <KeyRound size={11} color={getModColor(perm.module_name, T.isDark)} strokeWidth={2} />
          <Text style={[s.slugTxt, { color: getModColor(perm.module_name, T.isDark) }]} numberOfLines={1}>{perm.slug}</Text>
        </View>
      </View>

      <ChevronRight size={15} color={T.borderStrong} strokeWidth={2.5} />
    </TouchableOpacity>
  );

  const Separator = () => <View style={s.sep} />;

  const Empty = () => (
    <View style={s.emptyWrap}>
      <View style={[s.emptyIcon, { backgroundColor: T.surfaceAlt }]}>
        <ShieldCheck size={28} color={T.textMuted} strokeWidth={1.5} />
      </View>
      <Text style={[s.emptyTitle, { color: T.text }]}>No permissions found</Text>
      <Text style={[s.emptySub, { color: T.textMuted }]}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: T.bg }]}>

      {/* ── Top bar ── */}
      <View style={[s.topBar, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: T.surfaceAlt }]} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <ChevronLeft size={22} color={T.text} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        <View style={s.topLeft}>
          <Text style={[s.screenTitle, { color: T.text }]}>Permissions</Text>
          <View style={[s.countBadge, { backgroundColor: T.surfaceAlt }]}>
            <Text style={[s.countTxt, { color: T.textMuted }]}>{displayData.length}</Text>
          </View>
        </View>
        {can('permissions:write') && (
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: T.primary }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreatePermission')}
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
            placeholder="Search rules or slugs…"
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
          {uniqueModules.length > 0 && (
            <View style={s.filterRow}>
              <Text style={[s.filterHeading, { color: T.textMuted }]}>Module</Text>
              <View style={s.pillRow}>
                <Pill label="All" on={!filterModule} onPress={() => setFilterModule('')} />
                {uniqueModules.map(m => (
                  <Pill key={m} label={m} on={filterModule === m} onPress={() => setFilterModule(m)} />
                ))}
              </View>
            </View>
          )}
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
        visible={!!viewPerm}
        onClose={() => setViewPerm(null)}
        title="Access Node"
      >
        {viewPerm && (
          <View style={s.profileWrap}>
            <View style={s.profileHero}>
              <ModAvatar mod={viewPerm.module_name} size={64} />
              <Text style={[s.profileName, { color: T.text }]}>{viewPerm.permission_name}</Text>
              <Text style={[s.heroSlug, { color: T.textMuted }]}>{viewPerm.slug}</Text>
              <View style={{ marginTop: 6 }}><StatusChip status={viewPerm.status} /></View>
            </View>

            {viewPerm.description && (
              <Text style={[s.descBox, { backgroundColor: T.bg, borderColor: T.border, color: T.textMuted }]}>{viewPerm.description}</Text>
            )}

            <View style={s.actionRow}>
              {can('permissions:write') && (
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: T.isDark ? '#1e3a8a' : '#EFF6FF', borderColor: T.isDark ? '#1e3a8a' : '#BFDBFE' }]}
                  activeOpacity={0.75}
                  onPress={() => { setViewPerm(null); setTimeout(() => openEdit(viewPerm), 350); }}
                >
                  <Pencil size={15} color={T.isDark ? '#60a5fa' : '#2563EB'} strokeWidth={2} />
                  <Text style={[s.actionTxt, { color: T.isDark ? '#60a5fa' : '#2563EB' }]}>Edit Rule</Text>
                </TouchableOpacity>
              )}
              {can('permissions:delete') && (
                <TouchableOpacity
                  style={[s.actionBtnDanger, { backgroundColor: T.isDark ? '#7f1d1d' : '#FEF2F2', borderColor: T.isDark ? '#7f1d1d' : '#FECACA' }]}
                  activeOpacity={0.75}
                  onPress={() => handleDelete(viewPerm)}
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

          <AppInput label="Description Context" value={editForm.description}
            onChangeText={v => setEditForm(f => ({ ...f, description: v }))}
            placeholder="Optional summary of this logic barrier..." multiline numberOfLines={2} />
        </KeyboardAvoidingView>
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
  modTxt: { fontSize: 12, fontWeight: '500' },
  slugTxt: { fontSize: 11, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', opacity: 0.8 },
  dot: { fontSize: 12 },
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
    gap: 6, paddingVertical: 13, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  actionBtnDanger: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  actionTxt: { fontSize: 14, fontWeight: '600' },

  formGroup: { gap: 8, marginTop: 4, marginBottom: 8 },
  formLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});
