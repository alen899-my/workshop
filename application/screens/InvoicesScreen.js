import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Receipt, Search, Eye, Filter, Calendar
} from 'lucide-react-native';

import DashboardHeader from '../components/DashboardHeader';
import { billService } from '../services/bill.service';
import { useToast } from '../components/ui/WorkshopToast';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useCurrency } from '../lib/currency';

const FONT = 'monospace';

export default function InvoicesScreen({ navigation }) {
  const T = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  // We use shop_currency if available, else INR default
  const { format } = useCurrency(user);

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await billService.getAll({ recordStatus: 'Active' });
    if (res.success) {
      setBills(res.data || []);
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to fetch' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', () => load());
    return unsubscribe;
  }, [navigation]);

  const filtered = bills.filter(b => {
    const q = search.toLowerCase();
    return (
      (b.vehicle_number || '').toLowerCase().includes(q) ||
      (b.owner_name || '').toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }) => {
    const isPaid = (item.payment_status || 'Unpaid') === 'Paid';
    
    return (
      <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
        <View style={s.cardHeader}>
          <View style={s.headerLeft}>
            <View style={[s.iconBox, { backgroundColor: isPaid ? T.success + '15' : T.warning + '15' }]}>
               <Receipt size={20} color={isPaid ? T.success : T.warning} />
            </View>
            <View style={s.titleWrap}>
              <Text style={[s.plateNum, { color: T.text }]}>{item.vehicle_number}</Text>
              <Text style={[s.ownerName, { color: T.textMuted }]} numberOfLines={1}>
                {item.owner_name || 'Walk-in'}
              </Text>
            </View>
          </View>
          <View style={{alignItems: 'flex-end'}}>
             <Text style={[s.amount, { color: T.success }]}>{format(item.total_amount)}</Text>
             <View style={[s.statusBadge, { backgroundColor: isPaid ? T.successBg : T.warningBg }]}>
                <View style={[s.statusDot, { backgroundColor: isPaid ? T.success : T.warning }]} />
                <Text style={[s.statusTxt, { color: isPaid ? T.success : T.warningText || T.warning }]}>
                  {item.payment_status || 'Unpaid'}
                </Text>
             </View>
          </View>
        </View>
        
        <View style={[s.divider, { backgroundColor: T.border }]} />
        
        <View style={s.row}>
           <View style={{flex: 1}}>
              <Text style={[s.label, { color: T.textMuted }]}>ISSUED DATE</Text>
              <Text style={[s.val, { color: T.text }]}>
                 {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
              </Text>
           </View>
           <TouchableOpacity 
             style={[s.actionBtn, { backgroundColor: T.primary + '15' }]} 
             onPress={() => navigation.navigate('RepairBill', { id: item.repair_id })}
           >
              <Eye size={16} color={T.primary} />
              <Text style={[s.actionTxt, { color: T.primary }]}>View</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]} edges={['top', 'bottom']}>
      <DashboardHeader />
      
      <View style={s.header}>
         <View>
           <Text style={[s.pageTitle, { color: T.text }]}>Invoices</Text>
           <Text style={[s.pageSubtitle, { color: T.textMuted }]}>Financial history & receipts</Text>
         </View>
      </View>
      
      <View style={s.searchWrap}>
         <View style={[s.searchBox, { backgroundColor: T.surface, borderColor: T.border }]}>
            <Search size={18} color={T.textMuted} />
            <TextInput
               style={[s.searchInput, { color: T.text }]}
               placeholder="Search invoices..."
               placeholderTextColor={T.textMuted}
               value={search}
               onChangeText={setSearch}
            />
         </View>
      </View>
      
      <FlatList
         data={filtered}
         keyExtractor={(item) => String(item.id)}
         renderItem={renderItem}
         contentContainerStyle={s.list}
         showsVerticalScrollIndicator={false}
         ListEmptyComponent={
           loading ? (
             <View style={{padding: 40, alignItems: 'center'}}><ActivityIndicator size="large" color={T.primary} /></View>
           ) : (
             <View style={[s.emptyState, { borderColor: T.borderStrong }]}>
                <Receipt size={32} color={T.textFaint} />
                <Text style={[s.emptyTxt, { color: T.textMuted }]}>NO INVOICES FOUND</Text>
             </View>
           )
         }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '900', fontFamily: FONT, letterSpacing: -1 },
  pageSubtitle: { fontSize: 13, marginTop: 4 },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 10, zIndex: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderRadius: 12, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600', height: '100%' },
  list: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, justifyContent: 'center' },
  plateNum: { fontSize: 15, fontWeight: '900', fontFamily: FONT, letterSpacing: -0.5, marginBottom: 2 },
  ownerName: { fontSize: 12, fontWeight: '600', opacity: 0.8 },
  
  amount: { fontSize: 16, fontWeight: '900', fontFamily: FONT, marginBottom: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 9, fontWeight: '800', fontFamily: FONT, textTransform: 'uppercase' },
  
  divider: { height: 1, width: '100%', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 9, fontWeight: '900', fontFamily: FONT, letterSpacing: 1, marginBottom: 2 },
  val: { fontSize: 12, fontWeight: '700' },
  
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionTxt: { fontSize: 11, fontWeight: '800', fontFamily: FONT },
  
  emptyState: { paddingVertical: 60, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, gap: 12, marginTop: 20 },
  emptyTxt: { fontSize: 11, fontWeight: '900', fontFamily: FONT, letterSpacing: 2 }
});
