import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Plus, SlidersHorizontal, MapPin, Building2,
  X, ChevronRight, ChevronLeft, User, Pencil, Trash2, Eye,
} from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { shopService } from '../../services/management.service';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';
import { useTheme } from '../../lib/theme';

/* ─── helpers ─── */
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

/* ─── Avatar ─── */
const Avatar = ({ name, id, size = 44 }) => {
  const T = useTheme();
  return (
    <View style={[av.circle, { width: size, height: size, borderRadius: size / 4, backgroundColor: avatarColor(id), opacity: T.isDark ? 0.8 : 0.95 }]}>
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
export default function ShopsScreen({ navigation }) {
  const T = useTheme();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  
  const [viewShop, setViewShop] = useState(null);
  const [editShop, setEditShop] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const { can } = useRBAC();
  const { toast } = useToast();

  const uniqueLocations = useMemo(() => {
    const seen = new Set();
    return shops
      .filter(s => s.location && !seen.has(s.location) && seen.add(s.location))
      .map(s => s.location);
  }, [shops]);

  const displayData = useMemo(() => shops.filter(s => {
    const q = search.toLowerCase();
    if (q && !s.name?.toLowerCase().includes(q) && !s.owner_name?.toLowerCase().includes(q) && !s.location?.toLowerCase().includes(q)) return false;
    if (filterLocation && s.location !== filterLocation) return false;
    return true;
  }), [shops, search, filterLocation]);

  const activeFilters = [filterLocation].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await shopService.getAll();
    if (res.success) setShops(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (shop) => {
    setEditForm({
      name: shop.name || '',
      location: shop.location || '',
      owner_name: shop.owner_name || '',
    });
    setEditShop(shop);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await shopService.update(editShop.id, editForm);
    setSaving(false);
    if (res.success) {
      setShops(prev => prev.map(s => s.id === editShop.id ? { ...s, ...editForm } : s));
      setEditShop(null);
      toast({ type: 'success', title: 'Saved', description: 'Workshop profile updated.' });
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to update.' });
    }
  };

  const handleDelete = async (shop) => {
    const res = await shopService.delete(shop.id);
    if (res.success) {
      setShops(prev => prev.filter(s => s.id !== shop.id));
      setViewShop(null);
      toast({ type: 'success', title: 'Deleted', description: 'Workshop record discarded.' });
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to delete.' });
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  /* ── Row ── */
  const renderItem = ({ item: shop }) => (
    <TouchableOpacity
      style={[s.row, { backgroundColor: T.surface, borderColor: T.border, borderWidth: T.isDark ? 1 : 0, elevation: T.isDark ? 0 : 1 }]}
      activeOpacity={0.7}
      onPress={() => setViewShop(shop)}
    >
      <Avatar name={shop.name} id={shop.id} size={46} />

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={[s.rowName, { color: T.text }]} numberOfLines={1}>{shop.name || 'Anonymous'}</Text>
        </View>
        <View style={s.rowMeta}>
          <User size={11} color={T.textMuted} strokeWidth={2} />
          <Text style={[s.rowMetaTxt, { color: T.textMuted }]}>{shop.owner_name || '—'}</Text>
          {shop.location && (
            <>
              <Text style={[s.dot, { color: T.borderStrong }]}>·</Text>
              <MapPin size={11} color={T.textMuted} strokeWidth={2} />
              <Text style={[s.rowMetaTxt, { color: T.textMuted }]} numberOfLines={1}>
                {shop.location}
              </Text>
            </>
          )}
        </View>
      </View>

      <ChevronRight size={15} color={T.borderStrong} strokeWidth={2.5} />
    </TouchableOpacity>
  );

  const Separator = () => <View style={s.sep} />;

  const Empty = () => (
    <View style={s.emptyWrap}>
      <View style={[s.emptyIcon, { backgroundColor: T.surfaceAlt }]}>
        <Building2 size={28} color={T.textMuted} strokeWidth={1.5} />
      </View>
      <Text style={[s.emptyTitle, { color: T.text }]}>No shops registered</Text>
      <Text style={[s.emptySub, { color: T.textMuted }]}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: T.bg }]} edges={['top']}>

      {/* ── Top bar ── */}
      <View style={[s.topBar, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: T.surfaceAlt }]} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <ChevronLeft size={22} color={T.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.topLeft}>
          <Text style={[s.screenTitle, { color: T.text }]}>Shops</Text>
          <View style={[s.countBadge, { backgroundColor: T.surfaceAlt }]}>
            <Text style={[s.countTxt, { color: T.textMuted }]}>{displayData.length}</Text>
          </View>
        </View>
        {can('shops:write') && (
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: T.primary }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateShop')}
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
            placeholder="Search name, owner or location…"
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
          {uniqueLocations.length > 0 && (
            <View style={s.filterRow}>
              <Text style={[s.filterHeading, { color: T.textMuted }]}>Location</Text>
              <View style={s.pillRow}>
                <Pill label="All" on={!filterLocation} onPress={() => setFilterLocation('')} />
                {uniqueLocations.map(loc => (
                  <Pill key={loc} label={loc} on={filterLocation === loc} onPress={() => setFilterLocation(loc)} />
                ))}
              </View>
            </View>
          )}
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
        visible={!!viewShop}
        onClose={() => setViewShop(null)}
        title="Shop Details"
      >
        {viewShop && (
          <View style={s.profileWrap}>
            <View style={s.profileHero}>
              <Avatar name={viewShop.name} id={viewShop.id} size={72} />
              <Text style={[s.profileName, { color: T.text }]}>{viewShop.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <MapPin size={13} color={T.textMuted} />
                <Text style={{ color: T.textMuted, fontSize: 13, fontWeight: '500' }}>{viewShop.location || 'Unknown location'}</Text>
              </View>
            </View>

            <View style={[s.detailCard, { backgroundColor: T.bg, borderColor: T.border }]}>
              <View style={s.detailRow}>
                <Text style={[s.detailLabel, { color: T.textMuted }]}>Owner / Manager</Text>
                <Text style={[s.detailVal, { color: T.text }]}>{viewShop.owner_name || '—'}</Text>
              </View>
              <View style={[s.detailDivider, { backgroundColor: T.border }]} />
              <View style={s.detailRow}>
                <Text style={[s.detailLabel, { color: T.textMuted }]}>Date Registered</Text>
                <Text style={[s.detailVal, { color: T.text }]}>{fmt(viewShop.created_at)}</Text>
              </View>
            </View>

            <View style={s.actionRow}>
              {can('shops:write') && (
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: T.isDark ? '#1e3a8a' : '#EFF6FF', borderColor: T.isDark ? '#1e3a8a' : '#BFDBFE' }]}
                  activeOpacity={0.75}
                  onPress={() => { setViewShop(null); setTimeout(() => openEdit(viewShop), 350); }}
                >
                  <Pencil size={15} color={T.isDark ? '#60a5fa' : '#2563EB'} strokeWidth={2} />
                  <Text style={[s.actionTxt, { color: T.isDark ? '#60a5fa' : '#2563EB' }]}>Edit</Text>
                </TouchableOpacity>
              )}
              {can('shops:delete') && (
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: T.isDark ? '#7f1d1d' : '#FEF2F2', borderColor: T.isDark ? '#7f1d1d' : '#FECACA' }]}
                  activeOpacity={0.75}
                  onPress={() => handleDelete(viewShop)}
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
        visible={!!editShop}
        onClose={() => setEditShop(null)}
        title="Edit Shop"
        footer={
          <>
            <AppButton title="Cancel" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => setEditShop(null)} />
            <AppButton title="Save changes" variant="primary" size="sm" loading={saving} style={{ flex: 1 }} onPress={handleSave} />
          </>
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <AppInput label="Shop Name" value={editForm.name}
            onChangeText={v => setEditForm(f => ({ ...f, name: v }))}
            placeholder="Speed Auto Works" autoCapitalize="words" />
          <AppInput label="Owner Name" value={editForm.owner_name}
            onChangeText={v => setEditForm(f => ({ ...f, owner_name: v }))}
            placeholder="Rajan K." autoCapitalize="words" />
          <AppInput label="Location" value={editForm.location}
            onChangeText={v => setEditForm(f => ({ ...f, location: v }))}
            placeholder="Kochi, Kerala" autoCapitalize="words" />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
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
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
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
    position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8,
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
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    padding: 14, gap: 12, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  rowName: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowMetaTxt: { fontSize: 12, fontWeight: '400', flexShrink: 1 },
  dot: { fontSize: 12 },
  sep: { height: 8 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 13 },
  profileWrap: { gap: 16 },
  profileHero: { alignItems: 'center', paddingVertical: 8, gap: 10 },
  profileName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  detailCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  detailLabel: { fontSize: 14, fontWeight: '400' },
  detailVal: { fontSize: 14, fontWeight: '600' },
  detailDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  actionTxt: { fontSize: 14, fontWeight: '600' },
  formGroup: { gap: 8, marginTop: 4 },
  formLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});
