import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User, Search, Phone, Car, MapPin, Trash2
} from 'lucide-react-native';

import DashboardHeader from '../components/DashboardHeader';
import { customerService } from '../services/customer.service';
import { useToast } from '../components/ui/WorkshopToast';
import { useTheme } from '../lib/theme';

const FONT = 'monospace';

export default function CustomersScreen({ navigation }) {
  const T = useTheme();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await customerService.getAll();
    if (res.success) {
      setCustomers(res.data || []);
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

  const handleDelete = (c) => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${c.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const res = await customerService.delete(c.id);
            if (res.success) {
              setCustomers(prev => prev.filter(x => x.id !== c.id));
              toast({ type: 'success', title: 'Deleted', description: 'Customer removed.' });
            } else {
              toast({ type: 'error', title: 'Error', description: res.error });
            }
          }
        }
      ]
    );
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }) => {
    const vCount = item.vehicles?.length || item.vehicle_count || 0;
    
    return (
      <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
        <View style={s.cardHeader}>
          <View style={s.headerLeft}>
            <View style={[s.iconBox, { backgroundColor: T.primary + '15' }]}>
               <Text style={[s.initialTxt, { color: T.primary }]}>
                 {(item.name || '?').charAt(0).toUpperCase()}
               </Text>
            </View>
            <View style={s.titleWrap}>
              <Text style={[s.name, { color: T.text }]} numberOfLines={1}>{item.name || 'Unknown'}</Text>
              <View style={s.contactRow}>
                <Phone size={10} color={T.textMuted} />
                <Text style={[s.phone, { color: T.textMuted }]}>{item.phone}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={[s.divider, { backgroundColor: T.border }]} />
        
        <View style={s.row}>
           <View style={{flex: 1}}>
              <Text style={[s.label, { color: T.textMuted }]}>OWNED VEHICLES</Text>
              <View style={[s.badge, { backgroundColor: T.primary + '10', borderColor: T.primary + '30' }]}>
                 <Car size={10} color={T.primary} />
                 <Text style={[s.val, { color: T.primary }]}>{vCount} Vehicles</Text>
              </View>
           </View>
           {item.shop_name && (
             <View style={{flex: 0.8}}>
                <Text style={[s.label, { color: T.textMuted }]}>WORKSHOP</Text>
                <View style={s.contactRow}>
                   <MapPin size={10} color={T.textMuted} />
                   <Text style={[s.valMini, { color: T.text }]}>{item.shop_name}</Text>
                </View>
             </View>
           )}
        </View>

        <View style={s.actions}>
           <TouchableOpacity 
             style={[s.actionBtn, { backgroundColor: T.danger + '10' }]} 
             onPress={() => handleDelete(item)}
           >
              <Trash2 size={14} color={T.danger} />
              <Text style={[s.actionTxt, { color: T.danger }]}>Delete</Text>
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
           <Text style={[s.pageTitle, { color: T.text }]}>Customers</Text>
           <Text style={[s.pageSubtitle, { color: T.textMuted }]}>Manage your client network</Text>
         </View>
      </View>
      
      <View style={s.searchWrap}>
         <View style={[s.searchBox, { backgroundColor: T.surface, borderColor: T.border }]}>
            <Search size={18} color={T.textMuted} />
            <TextInput
               style={[s.searchInput, { color: T.text }]}
               placeholder="Search names, phones..."
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
                <User size={32} color={T.textFaint} />
                <Text style={[s.emptyTxt, { color: T.textMuted }]}>NO CUSTOMERS FOUND</Text>
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
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initialTxt: { fontSize: 16, fontWeight: '900', fontFamily: FONT },
  titleWrap: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '800', fontFamily: FONT, letterSpacing: -0.5, marginBottom: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phone: { fontSize: 12, fontWeight: '600' },
  
  divider: { height: 1, width: '100%', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  label: { fontSize: 9, fontWeight: '900', fontFamily: FONT, letterSpacing: 1, marginBottom: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, gap: 6 },
  val: { fontSize: 10, fontWeight: '800', fontFamily: FONT, textTransform: 'uppercase' },
  valMini: { fontSize: 11, fontWeight: '700' },

  actions: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionTxt: { fontSize: 11, fontWeight: '800', fontFamily: FONT },
  
  emptyState: { paddingVertical: 60, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, gap: 12, marginTop: 20 },
  emptyTxt: { fontSize: 11, fontWeight: '900', fontFamily: FONT, letterSpacing: 2 }
});
