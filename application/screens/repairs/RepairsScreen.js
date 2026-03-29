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
  XCircle, Clock, CheckCircle, Receipt, Pencil, Trash2, Key,
  ShieldCheck
} from 'lucide-react-native';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';
import { repairService, billService } from '../../services/repair.service';
import { API_URL } from '../../api';
import { formatDate, formatDateTime } from '../../lib/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RepairCard } from '../../components/RepairCard';
import { VehicleIcon } from '../../constants/Vehicles';
import { useTheme } from '../../lib/theme';

/* ── Filter pill ── */
const Pill = ({ label, on, onPress, T }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75}
    style={[pl.wrap, { backgroundColor: T.surface, borderColor: T.border }, on && { backgroundColor: T.primary, borderColor: T.primary }]}>
    <Text style={[pl.txt, { color: on ? T.primaryText : T.textMuted }]}>{label}</Text>
  </TouchableOpacity>
);
const pl = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
  txt: { fontSize: 13, fontWeight: '500' },
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
  const T = useTheme();

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
      const message = `Here is the receipt for your vehicle repair: ${data.url}`;
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      try {
        await Linking.openURL(url);
      } catch (err) {
        try {
          await Linking.openURL(fallbackUrl);
        } catch (fallbackErr) {
          toast({ type: "error", title: "App Required", description: "WhatsApp is not installed." });
        }
      }
    } catch(e) {
      toast({ type: "error", title: "Error", description: "Failed to generate receipt." });
    } finally {
      setShareLoading(false);
    }
  };

  const renderItem = ({ item: r }) => (
    <RepairCard 
      item={r} 
      onPress={() => handleView(r)} 
    />
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: T.bg }]} edges={['top', 'bottom']}>
      {/* ── Top Bar ── */}
      <View style={[s.topBar, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
        <View style={s.topLeft}>
          <Text style={[s.screenTitle, { color: T.text }]} numberOfLines={1}>Repairs</Text>
          <View style={[s.countBadge, { backgroundColor: T.surfaceAlt }]}>
            <Text style={[s.countTxt, { color: T.textMuted }]}>{displayData.length}</Text>
          </View>
        </View>
        {can('create:repair') && (
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: T.primary }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateRepair')} 
          >
            <Plus size={14} color={T.primaryText} strokeWidth={3} />
            <Text style={[s.addBtnTxt, { color: T.primaryText }]}>NEW</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search Bar ── */}
      <View style={[s.searchBar, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
        <View style={[s.searchBox, { backgroundColor: T.surfaceAlt, borderColor: T.border }]}>
          <Search size={15} color={T.textFaint} strokeWidth={2} />
          <TextInput
            style={[s.searchInput, { color: T.text }]}
            placeholder="Search vehicle or owner…"
            placeholderTextColor={T.textFaint}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={14} color={T.textFaint} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            s.filterBtn, 
            { backgroundColor: T.surfaceAlt, borderColor: T.border },
            activeFilters > 0 && { backgroundColor: T.primary, borderColor: T.primary }
          ]}
          activeOpacity={0.75}
          onPress={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal size={15} color={activeFilters > 0 ? T.primaryText : T.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[s.filterPanel, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
          <Text style={[s.filterHeading, { color: T.textFaint }]}>Status</Text>
          <View style={s.pillRow}>
            {['', 'Pending', 'Started', 'In Progress', 'Completed'].map(v => (
              <Pill key={v || 'all'} label={v || 'All'} on={filterStatus === v} onPress={() => setFilterStatus(v)} T={T} />
            ))}
          </View>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={s.loadWrap}><ActivityIndicator size="large" color={T.primary} /></View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={u => String(u.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={() => (
            <View style={s.emptyWrap}>
              <Wrench size={32} color={T.textFaint} />
              <Text style={[s.emptyTitle, { color: T.textMuted }]}>No repairs found</Text>
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
               <View style={[s.imgBox, { backgroundColor: T.surfaceAlt }]}>
                  <Image source={{ uri: viewRepair.vehicle_image }} style={s.imgFill} resizeMode="cover" />
               </View>
            )}

            <View style={[s.detailCard, { backgroundColor: T.surface, borderColor: T.border }]}>
              <View style={s.detailGrid}>
                 <View style={s.dgCell}>
                    <Text style={[s.detailHeading, { color: T.textFaint }]}>Vehicle No</Text>
                    <Text style={[s.detailValBold, { color: T.text }]}>{viewRepair.vehicle_number}</Text>
                 </View>
                 <View style={s.dgCell}>
                    <Text style={[s.detailHeading, { color: T.textFaint }]}>Vehicle Type</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4}}>
                       <VehicleIcon typeId={viewRepair.vehicle_type} size={16} />
                       <Text style={[s.detailValBold, { color: T.text }]}>{viewRepair.vehicle_type}</Text>
                    </View>
                 </View>
                 <View style={s.dgCell}>
                    <Text style={[s.detailHeading, { color: T.textFaint }]}>Model</Text>
                    <Text style={[s.detailValBold, { color: T.text }]}>{viewRepair.model_name || 'N/A'}</Text>
                 </View>
                 <View style={s.dgCell}>
                    <Text style={[s.detailHeading, { color: T.textFaint }]}>Service Type</Text>
                    <Text style={[s.detailValBold, { color: T.success, textTransform: 'uppercase', fontSize: 12}]}>{viewRepair.service_type || 'Repair'}</Text>
                 </View>
                 <View style={s.dgCell}>
                    <Text style={[s.detailHeading, { color: T.textFaint }]}>Owner Name</Text>
                    <Text style={[s.detailValBold, { color: T.text }]}>{viewRepair.owner_name || 'N/A'}</Text>
                 </View>
                 <View style={s.dgCell}>
                    <Text style={[s.detailHeading, { color: T.textFaint }]}>Phone</Text>
                    <Text style={[s.detailValBold, { color: T.text }]}>{viewRepair.phone_number || 'N/A'}</Text>
                 </View>
              </View>

              <View style={[s.complaintBox, { backgroundColor: T.surfaceAlt }]}>
                 <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
                   <FileText size={12} color={T.textMuted} style={{marginRight: 6}}/>
                    <Text style={[s.detailHeading, { color: T.textFaint }]}>Complaints Checklist</Text>
                  </View>
                  {Array.isArray(viewRepair.complaints) && viewRepair.complaints.length > 0 ? (
                    viewRepair.complaints.map((c, i) => (
                      <View key={i} style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, backgroundColor: c.fixed ? T.successBg : 'transparent', padding: c.fixed ? 6 : 0, borderRadius: 8}}>
                        <View style={{ 
                          width: 18, height: 18, borderRadius: 9, 
                          backgroundColor: c.fixed ? T.success : T.surface,
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: c.fixed ? 0 : 1.5, borderColor: T.border
                        }}>
                           {c.fixed && <ShieldCheck size={10} color="#FFF" />}
                        </View>
                        <Text style={[s.detailValBase, { color: T.text }, c.fixed && { textDecorationLine: 'line-through', color: T.textFaint }]}>
                          {typeof c === 'string' ? c : c.text}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[s.detailValBase, { color: T.text }]}>No complaints recorded.</Text>
                  )}
               </View>

              <View style={[s.detailGrid, { borderTopWidth: 1, borderColor: T.border, paddingTop: 12, marginTop: 4 }]}>
                 <View style={s.dgCell}>
                    <Text style={[s.detailHeading, { color: T.textFaint }]}>Status</Text>
                    <View style={{marginTop:4, alignItems: 'flex-start'}}>
                       <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 
                              viewRepair.status === 'Completed' ? T.success : 
                              viewRepair.status === 'Pending' ? T.danger : T.primary 
                          }} />
                          <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: 
                              viewRepair.status === 'Completed' ? T.success : 
                              viewRepair.status === 'Pending' ? T.danger : T.primary 
                          }}>{viewRepair.status}</Text>
                       </View>
                    </View>
                 </View>
                  <View style={s.dgCell}>
                    <Text style={[s.detailHeading, { color: T.textFaint }]}>Date & Time</Text>
                    <Text style={[s.detailValBase, { color: T.text }]}>{formatDateTime(viewRepair.repair_date)}</Text>
                  </View>
              </View>

              <View style={[s.detailRowPad, { borderColor: T.border }]}>
                 <Text style={[s.detailHeading, { color: T.textFaint }]}>Attending Worker</Text>
                 <Text style={[s.detailValBase, { color: T.text }, {marginTop: 4}]}>{viewRepair.attending_worker_name || 'Unassigned'}</Text>
              </View>
            </View>

            {/* Bill Summary Section */}
            {(viewBill?.items?.length > 0 || viewBill?.service_charge > 0) && (
              <View style={[s.billBox, { backgroundColor: T.surface, borderColor: T.border }]}>
                 <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10, alignSelf:'center'}}>
                   <Receipt size={14} color={T.text} style={{marginRight: 6}} />
                   <Text style={{fontWeight: '800', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: T.text}}>Estimated Bill</Text>
                 </View>

                 {viewBill.items?.map((it, i) => (
                    <View key={i} style={[s.billItem, { backgroundColor: T.surfaceAlt }]}>
                       <Text style={[s.billName, { color: T.text }]}>{it.name} <Text style={{color: T.textFaint}}>x{it.qty}</Text></Text>
                       <Text style={[s.billCost, { color: T.text }]}>{(it.cost * it.qty).toFixed(2)}</Text>
                    </View>
                 ))}

                 <View style={[s.billItem, { backgroundColor: T.surfaceAlt, marginTop: 8 }]}>
                    <Text style={[s.billName, { color: T.text }]}>Service Charge</Text>
                    <Text style={[s.billCost, { color: T.text }]}>{Number(viewBill.service_charge || 0).toFixed(2)}</Text>
                 </View>

                 <View style={[s.billTotalRow, { borderColor: T.border }]}>
                    <Text style={s.billTotalTxt}>TOTAL AMOUNT</Text>
                    <Text style={s.billTotalVal}>{Number(viewBill.total_amount || 0).toFixed(2)}</Text>
                 </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={s.modalActions}>
               <AppButton 
                  title="Share Receipt" 
                  variant="primary" 
                  style={{ flex: 2 }} 
                  disabled={shareLoading} 
                  loading={shareLoading} 
                  onPress={handleShareWhatsApp}
               />
               <View style={s.iconActions}>
                  <TouchableOpacity
                    style={[s.iconBtn, { backgroundColor: T.surfaceAlt, borderColor: T.border }]}
                    activeOpacity={0.75}
                    onPress={() => {
                      const rid = viewRepair.id;
                      setViewRepair(null);
                      navigation.navigate('RepairBill', { id: rid });
                    }}
                  >
                    <Receipt size={22} color={T.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.iconBtn, { backgroundColor: T.surfaceAlt, borderColor: T.border }]}
                    activeOpacity={0.75}
                    onPress={() => {
                      const rid = viewRepair.id;
                      setViewRepair(null);
                      navigation.navigate('EditRepair', { id: rid });
                    }}
                  >
                    <Pencil size={22} color={T.text} />
                  </TouchableOpacity>
                  {can('delete:repair') && (
                    <TouchableOpacity
                      style={[s.iconBtn, { backgroundColor: T.dangerBg, borderColor: T.dangerBorder }]}
                      activeOpacity={0.75}
                      onPress={() => handleDelete(viewRepair)}
                    >
                      <Trash2 size={22} color={T.danger} />
                    </TouchableOpacity>
                  )}
               </View>
            </View>
          </View>
        )}
      </AppModal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  screenTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  countBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  countTxt: { fontSize: 11, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8,
    marginLeft: 10,
  },
  addBtnTxt: { fontSize: 12, fontWeight: '700' },

  searchBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13, padding: 0, fontWeight: '600' },
  filterBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  filterPanel: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  filterHeading: { fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },

  flatContent: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 32 },
  flatEmpty: { flex: 1 },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sep: { height: 0 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginTop: 12 },

  profileWrap: { gap: 12 },
  imgBox: { width: '100%', height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  imgFill: { width: '100%', height: '100%', opacity: 0.9 },

  detailCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  dgCell: { width: '50%', padding: 4 },
  detailHeading: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  detailValBold: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  detailValBase: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  
  complaintBox: { margin: 12, marginTop: 0, padding: 12, borderRadius: 10 },
  detailRowPad: { padding: 16, paddingTop: 12, borderTopWidth: 1 },

  billBox: { borderRadius: 14, padding: 16, borderWidth: 1, borderStyle: 'dashed' },
  billItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 6 },
  billName: { fontSize: 13, fontWeight: '600' },
  billCost: { fontSize: 13, fontWeight: '700', fontFamily: Platform.OS==='ios'?'Menlo':'monospace' },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  billTotalTxt: { fontSize: 12, fontWeight: '800', color: '#2563EB', letterSpacing: 0.5 },
  billTotalVal: { fontSize: 18, fontWeight: '900', color: '#2563EB', fontFamily: Platform.OS==='ios'?'Menlo':'monospace' },

  modalActions: { gap: 12, marginTop: 8 },
  iconActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    flex: 1, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
});
