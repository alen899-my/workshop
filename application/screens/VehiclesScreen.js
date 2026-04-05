import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Image, Alert, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Car, Search, ExternalLink, Calendar,
  User as UserIcon, Settings, Trash2, MapPin
} from 'lucide-react-native';

import DashboardHeader from '../components/DashboardHeader';
import { vehicleService } from '../services/vehicle.service';
import { useToast } from '../components/ui/WorkshopToast';
import { VEHICLE_CONFIG, getVehiclesByCategory, VehicleIcon } from '../constants/Vehicles';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';

const FONT = 'monospace'; // Same fallback as other screens

export default function VehiclesScreen({ navigation }) {
  const T = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await vehicleService.getAll("Active");
    if (res.success) {
      setVehicles(res.data || []);
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

  const handleDelete = (v) => {
    Alert.alert(
      "Delete Vehicle",
      `Are you sure you want to delete ${v.vehicle_number}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const res = await vehicleService.delete(v.id);
            if (res.success) {
              setVehicles(prev => prev.filter(x => x.id !== v.id));
              toast({ type: 'success', title: 'Deleted', description: 'Vehicle removed.' });
            } else {
              toast({ type: 'error', title: 'Error', description: res.error });
            }
          }
        }
      ]
    );
  };

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    return (
      (v.vehicle_number || '').toLowerCase().includes(q) ||
      (v.model_name || '').toLowerCase().includes(q) ||
      (v.owner_name || '').toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }) => {
    const config = VEHICLE_CONFIG.find(c => c.id === item.vehicle_type) || VEHICLE_CONFIG[0];

    return (
      <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
        <View style={s.cardHeader}>
          <View style={s.headerLeft}>
            {item.vehicle_image ? (
              <Image source={{ uri: item.vehicle_image }} style={s.vehicleImg} />
            ) : (
              <View style={[s.iconBox, { backgroundColor: config.color }]}>
                <VehicleIcon typeId={config.id} size={20} color="#FFF" />
              </View>
            )}
            <View style={s.titleWrap}>
              <Text style={[s.plateNum, { color: T.primary }]}>{item.vehicle_number}</Text>
              <Text style={[s.modelName, { color: T.text }]} numberOfLines={1}>{item.model_name}</Text>
            </View>
          </View>
          <View style={[s.badgeBox, { backgroundColor: config.color + '15', borderColor: config.color + '40' }]}>
            <Text style={[s.badgeTxt, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        
        <View style={[s.divider, { backgroundColor: T.border }]} />
        
        <View style={s.row}>
           <View style={{flex: 1}}>
              <Text style={[s.label, { color: T.textMuted }]}>OWNER</Text>
              <Text style={[s.val, { color: T.text }]}>{item.owner_name || 'N/A'}</Text>
           </View>
           <View style={{flex: 1}}>
              <Text style={[s.label, { color: T.textMuted }]}>PHONE</Text>
              <Text style={[s.val, { color: T.text }]}>{item.owner_phone || 'N/A'}</Text>
           </View>
        </View>
        
        <View style={s.actions}>
           <TouchableOpacity 
             style={[s.actionBtn, { backgroundColor: T.danger + '10' }]} 
             onPress={() => handleDelete(item)}
           >
              <Trash2 size={16} color={T.danger} />
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
           <Text style={[s.pageTitle, { color: T.text }]}>Registry</Text>
           <Text style={[s.pageSubtitle, { color: T.textMuted }]}>Manage {vehicles.length} vehicle profiles</Text>
         </View>
      </View>
      
      <View style={s.searchWrap}>
         <View style={[s.searchBox, { backgroundColor: T.surface, borderColor: T.border }]}>
            <Search size={18} color={T.textMuted} />
            <TextInput
               style={[s.searchInput, { color: T.text }]}
               placeholder="Search plates, models..."
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
                <Car size={32} color={T.textFaint} />
                <Text style={[s.emptyTxt, { color: T.textMuted }]}>NO VEHICLES FOUND</Text>
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
  
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  vehicleImg: { width: 44, height: 44, borderRadius: 12 },
  titleWrap: { flex: 1, justifyContent: 'center' },
  plateNum: { fontSize: 16, fontWeight: '900', fontFamily: FONT, letterSpacing: -0.5, marginBottom: 2 },
  modelName: { fontSize: 12, fontWeight: '600', opacity: 0.8 },
  badgeBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  badgeTxt: { fontSize: 9, fontWeight: '900', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  divider: { height: 1, width: '100%' },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 9, fontWeight: '900', fontFamily: FONT, letterSpacing: 1, marginBottom: 4 },
  val: { fontSize: 13, fontWeight: '700' },
  
  actions: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionTxt: { fontSize: 11, fontWeight: '800', fontFamily: FONT },
  
  emptyState: { paddingVertical: 60, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, gap: 12, marginTop: 20 },
  emptyTxt: { fontSize: 11, fontWeight: '900', fontFamily: FONT, letterSpacing: 2 }
});
