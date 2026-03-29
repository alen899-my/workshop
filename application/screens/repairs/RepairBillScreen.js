import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Receipt, PenTool, Calculator, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AppButton } from '../../components/ui/AppButton';
import { repairService, billService } from '../../services/repair.service';
import { useToast } from '../../components/ui/WorkshopToast';
import { T } from '../../constants/Theme';

export default function RepairBillScreen({ navigation, route }) {
  const repairId = route.params?.id;

  const [items, setItems] = useState([]);
  const [serviceCharge, setServiceCharge] = useState('0');
  const [repairContext, setRepairContext] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      console.log("[RepairBillScreen] Initializing with repairId:", repairId);
      if (!repairId) {
        console.warn("[RepairBillScreen] No repairId provided in route params.");
        return;
      }
      setLoading(true);
      
      try {
        const [rRes, bRes] = await Promise.all([
          repairService.getById(repairId),
          billService.getByRepairId(repairId)
        ]);

        console.log("[RepairBillScreen] repairService.getById result:", JSON.stringify(rRes));
        console.log("[RepairBillScreen] billService.getByRepairId result:", JSON.stringify(bRes));

        if (rRes.success && rRes.data) {
          setRepairContext(rRes.data);
        } else {
          const errMsg = rRes.error || 'Repair record not found.';
          console.error("[RepairBillScreen] Failed to load repair context:", errMsg);
          toast({ type: 'error', title: 'Error', description: errMsg });
          // navigation.goBack(); // Temporarily disabled to debug
        }

        if (bRes.success && bRes.data) {
          setItems(bRes.data.items || []);
          setServiceCharge(String(bRes.data.service_charge || 0));
        }
      } catch (err) {
        console.error("[RepairBillScreen] unexpected error in init:", err);
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
      <View style={s.loadCenter}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <View style={s.header}>
           <Text style={s.pageTitle}>Job Billing</Text>
           <Text style={s.pageSubtitle}>For vehicle <Text style={{fontWeight:'900', color:T.text}}>{repairContext?.vehicle_number}</Text></Text>
        </View>

        <View style={s.sectionHeader}>
           <Text style={s.sectionTitle}>Parts & Labor</Text>
           <TouchableOpacity style={s.addBtn} onPress={addItem}>
              <Plus size={14} color={T.primary} strokeWidth={3} />
              <Text style={s.addBtnTxt}>Add Item</Text>
           </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={s.emptyBox}>
             <Receipt size={32} color={T.textFaint} strokeWidth={1} />
             <Text style={s.emptyTxt}>No items added yet. Click "Add Item" to begin billing.</Text>
          </View>
        ) : (
          <View style={s.itemsList}>
             {items.map((item, index) => (
                <View key={item.id} style={s.itemCard}>
                   <View style={s.itemMain}>
                      <TextInput 
                        style={s.itemName} 
                        placeholder="Item name / replacement part" 
                        value={item.name}
                        onChangeText={(v) => updateItem(item.id, 'name', v)}
                      />
                      <TouchableOpacity onPress={() => removeItem(item.id)} style={s.trash}>
                        <Trash2 size={18} color={T.danger} />
                      </TouchableOpacity>
                   </View>
                   <View style={s.itemGrid}>
                      <View style={s.inputCol}>
                         <Text style={s.inputLabel}>QTY</Text>
                         <View style={s.qtyRow}>
                            <TouchableOpacity style={s.qtyBtn} onPress={() => updateItem(item.id, 'qty', Math.max(1, (item.qty || 1) - 1))}>
                               <ChevronDown size={14} color={T.textMuted} />
                            </TouchableOpacity>
                            <TextInput 
                              style={s.qtyVal} 
                              keyboardType="numeric" 
                              value={String(item.qty || 1)}
                              onChangeText={(v) => updateItem(item.id, 'qty', parseInt(v) || 0)}
                            />
                            <TouchableOpacity style={s.qtyBtn} onPress={() => updateItem(item.id, 'qty', (item.qty || 1) + 1)}>
                               <ChevronUp size={14} color={T.textMuted} />
                            </TouchableOpacity>
                         </View>
                      </View>
                      <View style={[s.inputCol, { flex: 1.5 }]}>
                         <Text style={s.inputLabel}>UNIT COST (₹)</Text>
                         <TextInput 
                           style={s.costVal} 
                           keyboardType="numeric" 
                           placeholder="0.00"
                           value={String(item.cost || '')}
                           onChangeText={(v) => updateItem(item.id, 'cost', v)}
                         />
                      </View>
                      <View style={s.totalCol}>
                         <Text style={s.inputLabel}>SUBTOTAL</Text>
                         <Text style={s.lineTotal}>₹{(Number(item.cost || 0) * Number(item.qty || 1)).toFixed(0)}</Text>
                      </View>
                   </View>
                </View>
             ))}
          </View>
        )}

        <View style={s.summaryCard}>
           <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Items Subtotal</Text>
              <Text style={s.summaryVal}>₹{subtotal.toFixed(2)}</Text>
           </View>
           <View style={s.divider} />
           <View style={s.summaryRow}>
              <View style={{flex: 1}}>
                 <Text style={[s.summaryLabel, {color: T.text, fontWeight:'700'}]}>Service Charge (Labor)</Text>
                 <Text style={{fontSize:10, color:T.textFaint}}>Workshop fees, diagnostics, etc.</Text>
              </View>
              <TextInput 
                style={s.serviceChargeInput} 
                keyboardType="numeric" 
                value={serviceCharge}
                onChangeText={setServiceCharge}
              />
           </View>
           <View style={[s.divider, {height: 2, backgroundColor: T.primary + '20'}]} />
           <View style={s.totalRow}>
              <View style={s.totalInfo}>
                 <Calculator size={20} color={T.primary} />
                 <Text style={s.totalLabel}>TOTAL AMOUNT</Text>
              </View>
              <Text style={s.totalVal}>₹{total.toFixed(2)}</Text>
           </View>
        </View>

        <View style={s.buttons}>
           <AppButton title="Discard Changes" variant="ghost" style={{flex: 1}} onPress={() => navigation.goBack()} />
           <AppButton title="Save Bill" variant="primary" style={{flex: 1.5}} loading={saving} onPress={handleSave} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 20, paddingBottom: 60 },
  loadCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  header: { marginBottom: 24 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: T.text, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: T.textMuted, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.primary + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addBtnTxt: { fontSize: 12, fontWeight: '800', color: T.primary },
  emptyBox: { padding: 40, alignItems: 'center', backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, borderStyle: 'dashed', gap: 12 },
  emptyTxt: { fontSize: 12, color: T.textFaint, textAlign: 'center', lineHeight: 18 },
  itemsList: { gap: 12 },
  itemCard: { backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 16, gap: 12, ...T.shadowSm },
  itemMain: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  itemName: { flex: 1, fontSize: 14, fontWeight: '700', color: T.text, borderBottomWidth: 1, borderBottomColor: T.border, paddingVertical: 4 },
  trash: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: 8 },
  itemGrid: { flexDirection: 'row', gap: 12 },
  inputCol: { gap: 4 },
  inputLabel: { fontSize: 9, fontWeight: '800', color: T.textFaint, textTransform: 'uppercase' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg, borderRadius: 8, borderWidth: 1, borderColor: T.border },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { width: 30, textAlign: 'center', fontSize: 13, fontWeight: '700', color: T.text },
  costVal: { backgroundColor: T.bg, borderRadius: 8, borderWidth: 1, borderColor: T.border, height: 32, paddingHorizontal: 10, fontSize: 13, fontWeight: '700', color: T.text, textAlign: 'right' },
  totalCol: { flex: 1, alignItems: 'flex-end', gap: 4 },
  lineTotal: { fontSize: 15, fontWeight: '900', color: T.text },
  summaryCard: { backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, marginTop: 24, padding: 20, gap: 16, ...T.shadowMd },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: T.textMuted, fontWeight: '600' },
  summaryVal: { fontSize: 14, fontWeight: '700', color: T.text, fontFamily: Platform.OS==='ios'?'Menlo':'monospace' },
  serviceChargeInput: { width: 100, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 8, height: 36, textAlign: 'right', paddingHorizontal: 10, fontSize: 14, fontWeight: '800', color: T.text },
  divider: { height: 1, backgroundColor: T.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  totalInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalLabel: { fontSize: 12, fontWeight: '900', color: T.primary, letterSpacing: 1 },
  totalVal: { fontSize: 24, fontWeight: '900', color: T.primary, fontFamily: Platform.OS==='ios'?'Menlo':'monospace' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 32 }
});
