import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Plus, SlidersHorizontal, MapPin, Building2,
  X, ChevronRight, User, Pencil, Trash2, Eye,
} from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { shopService } from '../../services/management.service';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';

/* ─── helpers ─── */
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

/* ─── Avatar ─── */
const Avatar = ({ name, id, size = 44 }) => (
  <View style={[av.circle, { width: size, height: size, borderRadius: size / 4, backgroundColor: avatarColor(id), opacity: 0.95 }]}>
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
export default function ShopsScreen({ navigation }) {
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
      style={s.row}
      activeOpacity={0.7}
      onPress={() => setViewShop(shop)}
    >
      <Avatar name={shop.name} id={shop.id} size={46} />

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={s.rowName} numberOfLines={1}>{shop.name || 'Anonymous'}</Text>
        </View>
        <View style={s.rowMeta}>
          <User size={11} color="#9CA3AF" strokeWidth={2} />
          <Text style={s.rowMetaTxt}>{shop.owner_name || '—'}</Text>
          {shop.location && (
            <>
              <Text style={s.dot}>·</Text>
              <MapPin size={11} color="#9CA3AF" strokeWidth={2} />
              <Text style={s.rowMetaTxt} numberOfLines={1}>
                {shop.location}
              </Text>
            </>
          )}
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
        <Building2 size={28} color="#9CA3AF" strokeWidth={1.5} />
      </View>
      <Text style={s.emptyTitle}>No shops registered</Text>
      <Text style={s.emptySub}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <Text style={s.screenTitle}>Shops</Text>
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{displayData.length}</Text>
          </View>
        </View>
        {can('shops:write') && (
          <TouchableOpacity
            style={s.addBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateShop')}
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
            placeholder="Search name, owner or location…"
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
          {uniqueLocations.length > 0 && (
            <View style={s.filterRow}>
              <Text style={s.filterHeading}>Location</Text>
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
        visible={!!viewShop}
        onClose={() => setViewShop(null)}
        title="Shop Details"
      >
        {viewShop && (
          <View style={s.profileWrap}>
            {/* Avatar hero */}
            <View style={s.profileHero}>
              <Avatar name={viewShop.name} id={viewShop.id} size={72} />
              <Text style={s.profileName}>{viewShop.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <MapPin size={13} color="#6B7280" />
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>{viewShop.location || 'Unknown location'}</Text>
              </View>
            </View>

            {/* Detail cards */}
            <View style={s.detailCard}>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Owner / Manager</Text>
                <Text style={s.detailVal}>{viewShop.owner_name || '—'}</Text>
              </View>
              <View style={s.detailDivider} />
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Date Registered</Text>
                <Text style={s.detailVal}>{fmt(viewShop.created_at)}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={s.actionRow}>
              {can('shops:write') && (
                <TouchableOpacity
                  style={s.actionBtn}
                  activeOpacity={0.75}
                  onPress={() => { setViewShop(null); setTimeout(() => openEdit(viewShop), 350); }}
                >
                  <Pencil size={15} color="#2563EB" strokeWidth={2} />
                  <Text style={[s.actionTxt, { color: '#2563EB' }]}>Edit</Text>
                </TouchableOpacity>
              )}
              {can('shops:delete') && (
                <TouchableOpacity
                  style={[s.actionBtn, s.actionBtnDanger]}
                  activeOpacity={0.75}
                  onPress={() => handleDelete(viewShop)}
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
  rowMetaTxt: { fontSize: 12, color: '#9CA3AF', fontWeight: '400', flexShrink: 1 },
  dot: { fontSize: 12, color: '#D1D5DB' },
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

  /* profile modal */
  profileWrap: { gap: 16 },
  profileHero: { alignItems: 'center', paddingVertical: 8, gap: 10 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  detailCard: {
    backgroundColor: '#F9FAFB', borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13,
  },
  detailLabel: { fontSize: 14, color: '#6B7280', fontWeight: '400' },
  detailVal: { fontSize: 14, color: '#1C1C1E', fontWeight: '600' },
  detailDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
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
});
