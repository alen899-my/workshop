import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  Linking, Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings, Phone, Search, Plus, SlidersHorizontal,
  X, ChevronRight, Wrench, Calendar, FileText, CheckCircle2,
  XCircle, Clock, CheckCircle, Receipt, Pencil, Trash2, Key
} from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';
import { repairService, billService } from '../../services/repair.service';
import { API_URL } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ── Status Colors ── */
const StatusChip = ({ status }) => {
  let colors = { bg: '#F3F4F6', txt: '#6B7280', Icon: Clock };
  if (status === 'Pending') colors = { bg: '#FFF7ED', txt: '#EA580C', Icon: Clock };
  if (status === 'Started') colors = { bg: '#EFF6FF', txt: '#2563EB', Icon: Settings };
  if (status === 'In Progress') colors = { bg: '#F5F3FF', txt: '#7C3AED', Icon: Wrench };
  if (status === 'Completed') colors = { bg: '#ECFDF5', txt: '#059669', Icon: CheckCircle2 };

  const { Icon, bg, txt } = colors;
  return (
    <View style={[chip.wrap, { backgroundColor: bg }]}>
      <Icon size={10} color={txt} strokeWidth={2.5} />
      <Text style={[chip.txt, { color: txt }]}>{status}</Text>
    </View>
  );
};

const chip = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  txt: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});

/* ── Filter pill ── */
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

export default function RepairsScreen({ navigation }) {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const [viewRepair, setViewRepair] = useState(null);
  const [viewBill, setViewBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const { can } = useRBAC();
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await repairService.getAll();
    if (res.success) setRepairs(res.data || []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const displayData = useMemo(() => repairs.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.vehicle_number?.toLowerCase().includes(q) && !r.owner_name?.toLowerCase().includes(q)) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  }), [repairs, search, filterStatus]);

  const activeFilters = filterStatus ? 1 : 0;

  const handleView = async (repair) => {
    setViewRepair(repair);
    setViewBill(null);
    setBillLoading(true);
    const bRes = await billService.getByRepairId(repair.id);
    if (bRes.success && bRes.data) {
      setViewBill(bRes.data);
    }
    setBillLoading(false);
  };

  const handleDelete = async (r) => {
    const res = await repairService.delete(r.id);
    if (res.success) {
      setRepairs(p => p.filter(x => x.id !== r.id));
      setViewRepair(null);
      toast({ type: 'success', title: 'Deleted', description: 'Repair removed.' });
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed.' });
    }
  };

  const handleShareWhatsApp = async () => {
    if (!viewRepair) return;
    setShareLoading(true);
    try {
      const token = await AsyncStorage.getItem('workshop_token');
      const bRes = await fetch(`${API_URL}/repairs/${viewRepair.id}/pdf?action=store`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await bRes.json();
      if (!data.success || !data.url) throw new Error("Failed");
      const url = `whatsapp://send?text=Here is the receipt for your vehicle repair: ${encodeURIComponent(data.url)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
          Linking.openURL(url);
      } else {
          toast({ type: "error", title: "App Required", description: "WhatsApp is not installed." });
      }
    } catch(e) {
      toast({ type: "error", title: "Error", description: "Failed to generate receipt." });
    } finally {
      setShareLoading(false);
    }
  };

  const renderItem = ({ item: r }) => (
    <TouchableOpacity
      style={s.row}
      activeOpacity={0.7}
      onPress={() => handleView(r)}
    >
      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={s.rowName} numberOfLines={1}>{r.vehicle_number}</Text>
          <StatusChip status={r.status} />
        </View>
        <Text style={s.ownerName}>{r.owner_name || 'N/A'}</Text>
        <View style={[s.rowMeta, { marginTop: 6 }]}>
          <Calendar size={11} color="#9CA3AF" strokeWidth={2} />
          <Text style={s.rowMetaTxt}>{r.repair_date ? new Date(r.repair_date).toLocaleDateString() : 'N/A'}</Text>
          <Text style={s.dot}>·</Text>
          <Wrench size={11} color="#9CA3AF" strokeWidth={2} />
          <Text style={s.rowMetaTxt}>{r.attending_worker_name || 'Unassigned'}</Text>
        </View>
      </View>
      <ChevronRight size={15} color="#D1D5DB" strokeWidth={2.5} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      {/* ── Top Bar ── */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <Text style={s.screenTitle}>Repairs</Text>
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{displayData.length}</Text>
          </View>
        </View>
        {can('create:repair') && (
          <TouchableOpacity
            style={s.addBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateRepair')} 
          >
            <Plus size={16} color="#fff" strokeWidth={2.5} />
            <Text style={s.addBtnTxt}>New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search Bar ── */}
      <View style={s.searchBar}>
        <View style={s.searchBox}>
          <Search size={15} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder="Search vehicle or owner…"
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
          <SlidersHorizontal size={15} color={activeFilters > 0 ? '#fff' : '#374151'} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={s.filterPanel}>
          <Text style={s.filterHeading}>Status</Text>
          <View style={s.pillRow}>
            {['', 'Pending', 'Started', 'In Progress', 'Completed'].map(v => (
              <Pill key={v || 'all'} label={v || 'All'} on={filterStatus === v} onPress={() => setFilterStatus(v)} />
            ))}
          </View>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={s.loadWrap}><ActivityIndicator size="large" color="#1C1C1E" /></View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={u => String(u.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={() => (
            <View style={s.emptyWrap}>
              <Wrench size={32} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No repairs found</Text>
            </View>
          )}
          contentContainerStyle={displayData.length === 0 ? s.flatEmpty : s.flatContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={load}
        />
      )}

      {/* ══ View Modal ══ */}
      <AppModal
        visible={!!viewRepair}
        onClose={() => setViewRepair(null)}
        title="Repair Details"
        subtitle="Full job card history and billing status."
      >
        {viewRepair && (
          <View style={s.profileWrap}>
            {viewRepair.vehicle_image && (
               <View style={s.imgBox}>
                  <Image source={{ uri: viewRepair.vehicle_image }} style={s.imgFill} resizeMode="cover" />
               </View>
            )}

            <View style={s.detailCard}>
              <View style={s.detailGrid}>
                 <View style={s.dgCell}>
                    <Text style={s.detailHeading}>Vehicle No</Text>
                    <Text style={s.detailValBold}>{viewRepair.vehicle_number}</Text>
                 </View>
                 <View style={s.dgCell}>
                    <Text style={s.detailHeading}>Owner Name</Text>
                    <Text style={s.detailValBold}>{viewRepair.owner_name || 'N/A'}</Text>
                 </View>
                 <View style={s.dgCell}>
                    <Text style={s.detailHeading}>Phone</Text>
                    <Text style={s.detailValBold}>{viewRepair.phone_number || 'N/A'}</Text>
                 </View>
                 <View style={s.dgCell}>
                    <Text style={s.detailHeading}>Service Type</Text>
                    <Text style={[s.detailValBold, { color: '#059669', textTransform: 'uppercase', fontSize: 12}]}>{viewRepair.service_type || 'Repair'}</Text>
                 </View>
              </View>

              <View style={s.complaintBox}>
                 <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                   <FileText size={12} color="#6B7280" style={{marginRight: 6}}/>
                   <Text style={s.detailHeading}>Complaints</Text>
                 </View>
                 <Text style={s.detailValBase}>{viewRepair.complaints || 'None reported.'}</Text>
              </View>

              <View style={[s.detailGrid, { borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 12, marginTop: 4 }]}>
                 <View style={s.dgCell}>
                    <Text style={s.detailHeading}>Status</Text>
                    <View style={{marginTop:4, alignItems: 'flex-start'}}><StatusChip status={viewRepair.status} /></View>
                 </View>
                 <View style={s.dgCell}>
                    <Text style={s.detailHeading}>Date</Text>
                    <Text style={s.detailValBase}>{viewRepair.repair_date ? new Date(viewRepair.repair_date).toLocaleDateString() : 'N/A'}</Text>
                 </View>
              </View>

              <View style={s.detailRowPad}>
                 <Text style={s.detailHeading}>Attending Worker</Text>
                 <Text style={[s.detailValBase, {marginTop: 4}]}>{viewRepair.attending_worker_name || 'Unassigned'}</Text>
              </View>
            </View>

            {/* Bill Summary Section */}
            {(viewBill?.items?.length > 0 || viewBill?.service_charge > 0) && (
              <View style={s.billBox}>
                 <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10, alignSelf:'center'}}>
                   <Receipt size={14} color="#1C1C1E" style={{marginRight: 6}} />
                   <Text style={{fontWeight: '800', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: '#1C1C1E'}}>Estimated Bill</Text>
                 </View>

                 {viewBill.items?.map((it, i) => (
                    <View key={i} style={s.billItem}>
                       <Text style={s.billName}>{it.name} <Text style={{color: '#9CA3AF'}}>x{it.qty}</Text></Text>
                       <Text style={s.billCost}>₹{(it.cost * it.qty).toFixed(2)}</Text>
                    </View>
                 ))}

                 <View style={[s.billItem, { marginTop: 8 }]}>
                    <Text style={s.billName}>Service Charge</Text>
                    <Text style={s.billCost}>₹{Number(viewBill.service_charge || 0).toFixed(2)}</Text>
                 </View>

                 <View style={s.billTotalRow}>
                    <Text style={s.billTotalTxt}>TOTAL AMOUNT</Text>
                    <Text style={s.billTotalVal}>₹{Number(viewBill.total_amount || 0).toFixed(2)}</Text>
                 </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                 <AppButton 
                  title="Share Receipt" 
                  variant="primary" 
                  style={{flex:1}} 
                  disabled={shareLoading} 
                  loading={shareLoading} 
                  onPress={handleShareWhatsApp}
               />
               <TouchableOpacity
                  style={[s.actionBtnSecondary, { paddingHorizontal: 12, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent:'center', gap: 6 }]}
                  activeOpacity={0.75}
                  onPress={() => {
                    const rid = viewRepair.id;
                    setViewRepair(null);
                    navigation.navigate('RepairBill', { id: rid });
                  }}
               >
                  <Receipt size={18} color="#1C1C1E" />
                  <Text style={{fontSize: 10, fontWeight:'900'}}>BILL</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={[s.actionBtnSecondary, { width: 50, height: 50, alignItems: 'center', justifyContent:'center' }]}
                  activeOpacity={0.75}
                  onPress={() => {
                    const rid = viewRepair.id;
                    setViewRepair(null);
                    navigation.navigate('EditRepair', { id: rid });
                  }}
               >
                  <Pencil size={20} color="#1C1C1E" />
               </TouchableOpacity>
               {can('delete:repair') && (
                 <TouchableOpacity
                    style={[s.actionBtnDanger, { width: 50, height: 50, alignItems: 'center', justifyContent:'center' }]}
                    activeOpacity={0.75}
                    onPress={() => handleDelete(viewRepair)}
                 >
                    <Trash2 size={20} color="#DC2626" />
                 </TouchableOpacity>
               )}
            </View>
          </View>
        )}
      </AppModal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  screenTitle: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  countBadge: { backgroundColor: '#F3F4F6', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  countTxt: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1C1C1E', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9,
  },
  addBtnTxt: { fontSize: 13, fontWeight: '600', color: '#fff' },

  searchBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1C1C1E', padding: 0 },
  filterBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  filterBtnOn: { backgroundColor: '#1C1C1E' },
  filterPanel: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  filterHeading: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, letterSpacing: 0.8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },

  flatContent: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 32 },
  flatEmpty: { flex: 1 },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  rowName: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', flex: 1, marginRight: 8, letterSpacing: -0.3 },
  ownerName: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowMetaTxt: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  dot: { fontSize: 12, color: '#D1D5DB' },
  sep: { height: 8 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#6B7280', marginTop: 12 },

  profileWrap: { gap: 12 },
  imgBox: { width: '100%', height: 180, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000', marginBottom: 4 },
  imgFill: { width: '100%', height: '100%', opacity: 0.9 },

  detailCard: { backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  dgCell: { width: '50%', padding: 4 },
  detailHeading: { fontSize: 10, color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  detailValBold: { fontSize: 14, color: '#1C1C1E', fontWeight: '700', marginTop: 4 },
  detailValBase: { fontSize: 13, color: '#374151', fontWeight: '500', lineHeight: 18 },
  
  complaintBox: { backgroundColor: '#F3F4F6', margin: 12, marginTop: 0, padding: 12, borderRadius: 10 },
  detailRowPad: { padding: 16, paddingTop: 12, borderTopWidth: 1, borderColor: '#E5E7EB' },

  billBox: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  billItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginBottom: 6 },
  billName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  billCost: { fontSize: 13, fontWeight: '700', fontFamily: Platform.OS==='ios'?'Menlo':'monospace', color: '#1C1C1E' },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#E5E7EB' },
  billTotalTxt: { fontSize: 12, fontWeight: '800', color: '#2563EB', letterSpacing: 0.5 },
  billTotalVal: { fontSize: 18, fontWeight: '900', color: '#2563EB', fontFamily: Platform.OS==='ios'?'Menlo':'monospace' },

  actionBtnDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 14 },
  actionBtnSecondary: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 14 },
});
