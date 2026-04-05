import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Receipt, Calculator, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AppButton } from '../../components/ui/AppButton';
import { repairService, billService } from '../../services/repair.service';
import { useToast } from '../../components/ui/WorkshopToast';
import { useTheme } from '../../lib/theme';
import { useCurrency } from '../../lib/currency';
import { useAuth } from '../../lib/auth';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export default function RepairBillScreen({ navigation, route }) {
  const repairId = route.params?.id;
  const T = useTheme();
  const { user } = useAuth();
  const { format } = useCurrency(user);

  const [items, setItems] = useState([]);
  const [serviceCharge, setServiceCharge] = useState('0');
  const [repairContext, setRepairContext] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      console.log("[RepairBillScreen] Initializing with repairId:", repairId);
      if (!repairId) return;
      setLoading(true);
      
      try {
        const [rRes, bRes] = await Promise.all([
          repairService.getById(repairId),
          billService.getByRepairId(repairId)
        ]);

        if (rRes.success && rRes.data) {
          setRepairContext(rRes.data);
        } else {
          toast({ type: 'error', title: 'Error', description: rRes.error || 'Repair not found.' });
        }

        if (bRes.success && bRes.data) {
          setItems(bRes.data.items || []);
          setServiceCharge(String(bRes.data.service_charge || 0));
        }
      } catch (err) {
        toast({ type: 'error', title: 'System Error', description: 'Request failed.' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [repairId]);

  const subtotal = items.reduce((acc, item) => acc + (Number(item.cost || 0) * Number(item.qty || 1)), 0);
  const total = subtotal + Number(serviceCharge || 0);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', cost: 0, qty: 1 }]);
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id, field, val) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await billService.saveBill(repairId, {
      items,
      service_charge: Number(serviceCharge)
    });
    setSaving(false);

    if (res.success) {
      toast({ type: 'success', title: 'Bill Updated', description: 'Repair bill saved successfully.' });
      navigation.goBack();
    } else {
      toast({ type: 'error', title: 'Failed', description: res.error || 'Could not save bill.' });
    }
  };

  if (loading) {
    return (
      <View style={[s.loadCenter, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <View style={s.header}>
           <Text style={[s.pageTitle, { color: T.text }]}>Repair Billing</Text>
           <Text style={[s.pageSubtitle, { color: T.textMuted }]}>For vehicle <Text style={{fontWeight:'900', color: T.text}}>{repairContext?.vehicle_number}</Text></Text>
        </View>

        <View style={s.sectionHeader}>
           <Receipt size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>PARTS & LABOR</Text>
           <View style={{flex: 1}} />
           <TouchableOpacity style={[s.addBtn, { backgroundColor: T.primary }]} onPress={addItem}>
              <Plus size={14} color={T.primaryText} strokeWidth={3} />
              <Text style={[s.addBtnTxt, { color: T.primaryText }]}>Add Item</Text>
           </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
             <View style={[s.emptyBox, { backgroundColor: T.surfaceAlt, borderColor: T.border }]}>
                <Receipt size={32} color={T.borderStrong} strokeWidth={1.5} />
                <Text style={[s.emptyTxt, { color: T.textFaint }]}>No items added yet. Click "Add Item" to begin billing.</Text>
             </View>
          </View>
        ) : (
          <View style={s.itemsList}>
             {items.map((item, index) => (
                <View key={item.id} style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
                   <View style={s.itemMain}>
                      <TextInput 
                        style={[s.itemName, { color: T.text, borderBottomColor: T.border }]} 
                        placeholder="Item name / replacement part" 
                        placeholderTextColor={T.textFaint}
                        value={item.name}
                        onChangeText={(v) => updateItem(item.id, 'name', v)}
                      />
                      <TouchableOpacity onPress={() => removeItem(item.id)} style={[s.trash, { backgroundColor: T.dangerBg }]}>
                        <Trash2 size={16} color={T.danger} />
                      </TouchableOpacity>
                   </View>
                   
                   <View style={s.itemGrid}>
                      <View style={s.inputCol}>
                         <Text style={[s.inputLabel, { color: T.textMuted }]}>QTY</Text>
                         <View style={[s.qtyRow, { backgroundColor: T.surfaceAlt, borderColor: T.border }]}>
                            <TouchableOpacity style={s.qtyBtn} onPress={() => updateItem(item.id, 'qty', Math.max(1, (item.qty || 1) - 1))}>
                               <ChevronDown size={14} color={T.textMuted} />
                            </TouchableOpacity>
                            <TextInput 
                              style={[s.qtyVal, { color: T.text }]} 
                              keyboardType="numeric" 
                              value={String(item.qty || 1)}
                              onChangeText={(v) => updateItem(item.id, 'qty', parseInt(v) || 0)}
                            />
                            <TouchableOpacity style={s.qtyBtn} onPress={() => updateItem(item.id, 'qty', (item.qty || 1) + 1)}>
                               <ChevronUp size={14} color={T.textMuted} />
                            </TouchableOpacity>
                         </View>
                      </View>
                      
                      <View style={[s.inputCol, { flex: 1 }]}>
                         <Text style={[s.inputLabel, { color: T.textMuted }]}>UNIT COST</Text>
                         <TextInput 
                           style={[s.costVal, { backgroundColor: T.surfaceAlt, borderColor: T.border, color: T.text }]} 
                           keyboardType="numeric" 
                           placeholder="0"
                           placeholderTextColor={T.textFaint}
                           value={String(item.cost || '')}
                           onChangeText={(v) => updateItem(item.id, 'cost', v)}
                         />
                      </View>
                      
                      <View style={s.totalCol}>
                         <Text style={[s.inputLabel, { color: T.textMuted }]}>SUBTOTAL</Text>
                         <Text style={[s.lineTotal, { color: T.primary }]}>{format(Number(item.cost || 0) * Number(item.qty || 1))}</Text>
                      </View>
                   </View>
                </View>
             ))}
          </View>
        )}

        <View style={s.sectionHeader}>
           <Calculator size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>BILL SUMMARY</Text>
        </View>

        <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
           <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: T.textMuted }]}>Items Subtotal</Text>
              <Text style={[s.summaryVal, { color: T.text }]}>{format(subtotal)}</Text>
           </View>
           
           <View style={[s.divider, { backgroundColor: T.border }]} />
           
           <View style={s.summaryRow}>
              <View style={{flex: 1, paddingRight: 10}}>
                 <Text style={[s.summaryLabelBold, { color: T.text }]}>Service Charge (Labor)</Text>
                 <Text style={[s.summaryHint, { color: T.textMuted }]}>Workshop fees, diagnostics, etc.</Text>
              </View>
              <TextInput 
                style={[s.serviceChargeInput, { backgroundColor: T.surfaceAlt, borderColor: T.border, color: T.text }]} 
                keyboardType="numeric" 
                value={serviceCharge}
                onChangeText={setServiceCharge}
              />
           </View>
           
           <View style={[s.divider, {height: 2, backgroundColor: T.primary + '20'}]} />
           
           <View style={s.totalRow}>
              <Text style={[s.totalLabel, { color: T.primary }]}>TOTAL AMOUNT</Text>
              <Text style={[s.totalVal, { color: T.primary }]}>{format(total)}</Text>
           </View>
        </View>

        <View style={s.actionRow}>
           <AppButton title="Discard" variant="ghost" style={{flex: 1}} onPress={() => navigation.goBack()} />
           <AppButton title="Save Bill" variant="primary" style={{flex: 1.5}} loading={saving} onPress={handleSave} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingVertical: 10, paddingHorizontal: 20, paddingBottom: 60 },
  loadCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { marginBottom: 30 },
  pageTitle: { fontSize: 26, fontWeight: '900', fontFamily: FONT, letterSpacing: -0.8 },
  pageSubtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 24, paddingLeft: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '900', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 1.5 },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addBtnTxt: { fontSize: 12, fontWeight: '800' },
  
  card: {
    borderRadius: 20, borderWidth: 1, padding: 20, gap: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
      default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 }
    }),
  },
  
  emptyBox: { padding: 30, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', gap: 12 },
  emptyTxt: { fontSize: 12, textAlign: 'center', lineHeight: 18, fontWeight: '600', fontFamily: FONT },
  
  itemsList: { gap: 16 },
  
  itemMain: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  itemName: { flex: 1, fontSize: 15, fontWeight: '700', borderBottomWidth: 1, paddingVertical: 4 },
  trash: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  
  itemGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  inputCol: { flexShrink: 1, gap: 6, minWidth: 80 },
  inputLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1 },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', paddingVertical: 0 },
  
  costVal: { borderRadius: 10, borderWidth: 1, minHeight: 44, paddingHorizontal: 10, paddingVertical: 0, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  
  totalCol: { flex: 1, alignItems: 'flex-end', gap: 6, minWidth: 80, justifyContent: 'center' },
  lineTotal: { fontSize: 17, fontWeight: '900', fontFamily: FONT },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryLabelBold: { fontSize: 13, fontWeight: '700' },
  summaryHint: { fontSize: 10, marginTop: 2 },
  summaryVal: { fontSize: 15, fontWeight: '700', fontFamily: FONT },
  
  serviceChargeInput: { width: 100, borderWidth: 1, borderRadius: 10, minHeight: 44, paddingVertical: 0, textAlign: 'right', paddingHorizontal: 12, fontSize: 15, fontWeight: '800' },
  
  divider: { height: 1, marginHorizontal: -20 },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  totalLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  totalVal: { fontSize: 26, fontWeight: '900', fontFamily: FONT },
  
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 40 }
});
