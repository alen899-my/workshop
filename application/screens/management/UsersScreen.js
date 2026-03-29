import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Phone, Shield, Search, Plus, SlidersHorizontal,
  X, ChevronRight, User, CheckCircle2, XCircle,
  Pencil, Trash2, Eye,
} from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { userService, shopService } from '../../services/management.service';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';

/* ─── helpers ─── */
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
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
  <View style={[av.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(id) }]}>
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
export default function UsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const { can, isSuperAdmin } = useRBAC();
  const { toast } = useToast();

  const uniqueRoles = useMemo(() => {
    const seen = new Set();
    return users
      .filter(u => u.role && !seen.has(u.role) && seen.add(u.role))
      .map(u => ({ value: u.role, label: u.role_name || u.role?.replace('_', ' ') }));
  }, [users]);

  const displayData = useMemo(() => users.filter(u => {
    const q = search.toLowerCase();
    if (q && !u.name?.toLowerCase().includes(q) && !u.phone?.includes(q)) return false;
    if (filterStatus && u.status !== filterStatus) return false;
    if (filterRole && u.role !== filterRole) return false;
    return true;
  }), [users, search, filterStatus, filterRole]);

  const activeFilters = [filterStatus, filterRole].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    const [uRes, sRes] = await Promise.all([
      userService.getAll(),
      isSuperAdmin ? shopService.getAll() : Promise.resolve({ success: false }),
    ]);
    if (uRes.success) setUsers(uRes.data || []);
    if (sRes.success) setShops(sRes.data || []);
    setLoading(false);
  }, [isSuperAdmin]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (user) => {
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      status: user.status || 'active',
      role: user.role || '',
      shop_id: user.shop_id ? String(user.shop_id) : '',
      password: '',
      confirmPassword: '',
    });
    setEditUser(user);
    setPasswordError('');
  };

  const handleSave = async () => {
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setSaving(true);
    const { confirmPassword, ...payload } = editForm;
    if (!payload.password) delete payload.password;
    const res = await userService.update(editUser.id, payload);
    setSaving(false);
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...payload } : u));
      setEditUser(null);
      toast({ type: 'success', title: 'Saved', description: 'User updated.' });
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed.' });
    }
  };

  const handleDelete = async (user) => {
    const res = await userService.delete(user.id);
    if (res.success) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setViewUser(null);
      toast({ type: 'success', title: 'Deleted', description: 'User removed.' });
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed.' });
    }
  };

  /* ── Row ── */
  const renderItem = ({ item: user }) => (
    <TouchableOpacity
      style={s.row}
      activeOpacity={0.7}
      onPress={() => setViewUser(user)}
    >
      <Avatar name={user.name} id={user.id} size={46} />

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={s.rowName} numberOfLines={1}>{user.name || 'Anonymous'}</Text>
          <StatusChip status={user.status} />
        </View>
        <View style={s.rowMeta}>
          <Phone size={11} color="#9CA3AF" strokeWidth={2} />
          <Text style={s.rowMetaTxt}>{user.phone}</Text>
          <Text style={s.dot}>·</Text>
          <Shield size={11} color="#9CA3AF" strokeWidth={2} />
          <Text style={s.rowMetaTxt}>
            {user.role_name || user.role?.replace('_', ' ')}
          </Text>
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
        <User size={28} color="#9CA3AF" strokeWidth={1.5} />
      </View>
      <Text style={s.emptyTitle}>No users found</Text>
      <Text style={s.emptySub}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <Text style={s.screenTitle}>Users</Text>
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{displayData.length}</Text>
          </View>
        </View>
        {can('users:write') && (
          <TouchableOpacity
            style={s.addBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateUser')}
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
            placeholder="Search name or phone…"
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
          {uniqueRoles.length > 0 && (
            <View style={s.filterRow}>
              <Text style={s.filterHeading}>Role</Text>
              <View style={s.pillRow}>
                <Pill label="All" on={!filterRole} onPress={() => setFilterRole('')} />
                {uniqueRoles.map(r => (
                  <Pill key={r.value} label={r.label} on={filterRole === r.value} onPress={() => setFilterRole(r.value)} />
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
        visible={!!viewUser}
        onClose={() => setViewUser(null)}
        title="Profile"
      >
        {viewUser && (
          <View style={s.profileWrap}>
            {/* Avatar hero */}
            <View style={s.profileHero}>
              <Avatar name={viewUser.name} id={viewUser.id} size={72} />
              <Text style={s.profileName}>{viewUser.name}</Text>
              <StatusChip status={viewUser.status} />
            </View>

            {/* Detail cards */}
            <View style={s.detailCard}>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Phone</Text>
                <Text style={s.detailVal}>{viewUser.phone || '—'}</Text>
              </View>
              <View style={s.detailDivider} />
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Role</Text>
                <Text style={s.detailVal}>{viewUser.role_name || viewUser.role || '—'}</Text>
              </View>
              {viewUser.shop_name && (
                <>
                  <View style={s.detailDivider} />
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Shop</Text>
                    <Text style={s.detailVal}>{viewUser.shop_name}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Actions */}
            <View style={s.actionRow}>
              {can('users:write') && (
                <TouchableOpacity
                  style={s.actionBtn}
                  activeOpacity={0.75}
                  onPress={() => { setViewUser(null); setTimeout(() => openEdit(viewUser), 350); }}
                >
                  <Pencil size={15} color="#2563EB" strokeWidth={2} />
                  <Text style={[s.actionTxt, { color: '#2563EB' }]}>Edit</Text>
                </TouchableOpacity>
              )}
              {can('users:delete') && (
                <TouchableOpacity
                  style={[s.actionBtn, s.actionBtnDanger]}
                  activeOpacity={0.75}
                  onPress={() => handleDelete(viewUser)}
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
        visible={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        footer={
          <>
            <AppButton title="Cancel" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => setEditUser(null)} />
            <AppButton title="Save changes" variant="primary" size="sm" loading={saving} style={{ flex: 1 }} onPress={handleSave} />
          </>
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <AppInput label="Full Name" value={editForm.name}
            onChangeText={v => setEditForm(f => ({ ...f, name: v }))}
            placeholder="John Doe" autoCapitalize="words" />
          <AppInput label="Phone" value={editForm.phone}
            onChangeText={v => setEditForm(f => ({ ...f, phone: v }))}
            placeholder="+91 XXXXX" keyboardType="phone-pad" />

          {uniqueRoles.length > 0 && (
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Role</Text>
              <View style={s.pillRow}>
                {uniqueRoles.map(r => (
                  <Pill key={r.value} label={r.label}
                    on={editForm.role === r.value}
                    onPress={() => setEditForm(f => ({ ...f, role: r.value }))} />
                ))}
              </View>
            </View>
          )}

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

          {isSuperAdmin && shops.length > 0 && (
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Shop Assignment</Text>
              <View style={s.pillRow}>
                <Pill label="Global" on={!editForm.shop_id} onPress={() => setEditForm(f => ({ ...f, shop_id: '' }))} />
                {shops.map(sh => (
                  <Pill key={sh.id} label={sh.name}
                    on={editForm.shop_id === String(sh.id)}
                    onPress={() => setEditForm(f => ({ ...f, shop_id: String(sh.id) }))} />
                ))}
              </View>
            </View>
          )}

          <View style={s.divider} />
          <Text style={s.formSection}>Change Password</Text>
          <AppInput label="New Password" value={editForm.password}
            onChangeText={v => setEditForm(f => ({ ...f, password: v }))}
            placeholder="Leave blank to keep current" secureTextEntry />
          <AppInput label="Confirm Password" value={editForm.confirmPassword}
            onChangeText={v => { setEditForm(f => ({ ...f, confirmPassword: v })); setPasswordError(''); }}
            placeholder="Repeat new password" secureTextEntry error={passwordError} />
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
  rowMetaTxt: { fontSize: 12, color: '#9CA3AF', fontWeight: '400' },
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
  formSection: { fontSize: 13, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12, marginHorizontal: -20 },
});