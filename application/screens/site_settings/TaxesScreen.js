import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Percent, Plus, Trash2, Edit, CheckCircle2, Globe, Layers, Package, Wrench } from 'lucide-react-native';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui/WorkshopToast';
import { taxService } from '../../services/tax.service';

const APPLIES_TO_OPTIONS = [
  { value: 'all', label: 'Everything (Parts + Labor)' },
  { value: 'parts', label: 'Only Spare Parts' },
  { value: 'service', label: 'Only Labor Charges' },
];

export default function TaxesScreen({ navigation }) {
  const T = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    rate: '',
    description: '',
    is_active: true,
    is_inclusive: false,
    applies_to: 'all'
  });

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    setLoading(true);
    const res = await taxService.getAll();
    if (res.success) setTaxes(res.data);
    setLoading(false);
  };

  const activeTaxes = taxes.filter(t => t.is_active);

  const openCreate = () => {
    setForm({ name: '', rate: '', description: '', is_active: true, is_inclusive: false, applies_to: 'all' });
    setEditingId(null);
    setModalVisible(true);
  };

  const openEdit = (tax) => {
    setForm({
      name: tax.name,
      rate: String(tax.rate),
      description: tax.description || '',
      is_active: tax.is_active,
      is_inclusive: tax.is_inclusive,
      applies_to: tax.applies_to,
    });
    setEditingId(tax.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.rate) {
      toast({ type: 'error', title: 'Missing Fields', description: 'Name and rate are required.' });
      return;
    }
    setSaving(true);
    const payload = { ...form, rate: Number(form.rate), shop_id: user?.shopId || user?.shop_id };
    
    const res = editingId 
      ? await taxService.update(editingId, payload)
      : await taxService.create(payload);
    
    setSaving(false);
    if (res.success) {
      toast({ type: 'success', title: 'Saved', description: 'Tax rule saved successfully.' });
      setModalVisible(false);
      fetchTaxes();
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to save.' });
    }
  };

  const handleDelete = (tax) => {
    Alert.alert('Delete Tax?', `Are you sure you want to delete ${tax.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
         const res = await taxService.delete(tax.id);
         if (res.success) {
           toast({ type: 'success', title: 'Deleted', description: 'Tax rule removed.' });
           fetchTaxes();
         }
      }}
    ]);
  };

  const handleToggle = async (tax) => {
    const res = await taxService.update(tax.id, { is_active: !tax.is_active });
    if (res.success) fetchTaxes();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: T.primary + '10', borderColor: T.primary + '30' }]}>
           <Globe size={20} color={T.primary} />
           <View style={{ flex: 1 }}>
             <Text style={[styles.infoTitle, { color: T.primary }]}>Tax Rules</Text>
             <Text style={[styles.infoText, { color: T.textMuted }]}>
               Set up GST, VAT, or Sales Tax. They are applied to new bills.
             </Text>
           </View>
        </View>
        
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#10b98115', borderColor: '#10b98130' }]}>
            <Text style={[styles.statLabel, { color: '#059669' }]}>ACTIVE</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>{activeTaxes.length}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: T.surface, borderColor: T.border }]}>
            <Text style={[styles.statLabel, { color: T.textMuted }]}>RATE TOTAL</Text>
            <Text style={[styles.statValue, { color: T.text }]}>
              {activeTaxes.reduce((a, t) => a + Number(t.rate), 0).toFixed(1)}%
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={T.primary} style={{ marginTop: 40 }} />
        ) : taxes.length === 0 ? (
           <View style={[styles.emptyBox, { borderColor: T.border, backgroundColor: T.surface }]}>
             <Percent size={40} color={T.textMuted} style={{ marginBottom: 16 }} />
             <Text style={[styles.emptyBoxTitle, { color: T.text }]}>No Tax Configured</Text>
             <Text style={[styles.emptyBoxText, { color: T.textMuted }]}>Add a tax rule (like GST/VAT) to apply it on bills.</Text>
             <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: T.primary, marginTop: 24 }]} onPress={openCreate}>
               <Plus size={16} color="#fff" />
               <Text style={styles.btnPrimaryTxt}>ADD TAX RULE</Text>
             </TouchableOpacity>
           </View>
        ) : (
           <View style={styles.list}>
             {taxes.map(tax => (
               <View key={tax.id} style={[styles.taxCard, { backgroundColor: T.surface, borderColor: T.border }]}>
                 <View style={styles.cardHeader}>
                   <View style={styles.cardHeaderLeft}>
                     <View style={[styles.rateBadge, { backgroundColor: tax.is_active ? T.primary : T.border }]}>
                       <Text style={styles.rateBadgeTxt}>{tax.rate}%</Text>
                     </View>
                     <View>
                        <Text style={[styles.taxName, { color: T.text }]}>{tax.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          <Text style={[styles.taxMetaBadge, { color: tax.is_inclusive ? '#3b82f6' : '#f59e0b', backgroundColor: tax.is_inclusive ? '#3b82f620' : '#f59e0b20' }]}>
                            {tax.is_inclusive ? 'Included' : 'Extra'}
                          </Text>
                          <Text style={[styles.taxMetaBadge, { color: T.textMuted, backgroundColor: T.bg }]}>
                            {APPLIES_TO_OPTIONS.find(a => a.value === tax.applies_to)?.label || tax.applies_to}
                          </Text>
                        </View>
                     </View>
                   </View>
                   <Switch
                     value={tax.is_active}
                     onValueChange={() => handleToggle(tax)}
                     trackColor={{ true: T.primary, false: T.borderStrong }}
                   />
                 </View>
                 <View style={[styles.cardFooter, { borderTopColor: T.border }]}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(tax)}>
                      <Edit size={14} color={T.textMuted} />
                      <Text style={[styles.actionBtnTxt, { color: T.textMuted }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(tax)}>
                      <Trash2 size={14} color={T.danger} />
                      <Text style={[styles.actionBtnTxt, { color: T.danger }]}>Delete</Text>
                    </TouchableOpacity>
                 </View>
               </View>
             ))}
           </View>
        )}

      </ScrollView>

      {taxes.length > 0 && (
        <View style={[styles.footer, { backgroundColor: T.surface, borderColor: T.border }]}>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: T.primary }]} onPress={openCreate}>
            <Plus size={16} color="#fff" />
            <Text style={styles.btnPrimaryTxt}>ADD NEW TAX</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Editor Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
         <SafeAreaView style={[styles.modalSafe, { backgroundColor: T.bg }]}>
           <View style={[styles.modalHeader, { borderBottomColor: T.border }]}>
             <Text style={[styles.modalTitle, { color: T.text }]}>{editingId ? 'Edit Tax' : 'Add Tax Rule'}</Text>
             <TouchableOpacity onPress={() => setModalVisible(false)}>
               <Text style={[styles.modalClose, { color: T.textMuted }]}>Close</Text>
             </TouchableOpacity>
           </View>

           <ScrollView contentContainerStyle={styles.modalScroll}>
             
             <View style={styles.inputGroup}>
               <Text style={[styles.label, { color: T.textMuted }]}>TAX NAME</Text>
               <TextInput 
                 style={[styles.input, { backgroundColor: T.surface, borderColor: T.border, color: T.text }]}
                 placeholder="e.g. GST" placeholderTextColor={T.textMuted}
                 value={form.name} onChangeText={t => setForm({ ...form, name: t })}
               />
             </View>

             <View style={styles.inputGroup}>
               <Text style={[styles.label, { color: T.textMuted }]}>RATE PERCENTAGE (%)</Text>
               <TextInput 
                 style={[styles.input, { backgroundColor: T.surface, borderColor: T.border, color: T.text }]}
                 placeholder="e.g. 18" placeholderTextColor={T.textMuted} keyboardType="numeric"
                 value={form.rate} onChangeText={t => setForm({ ...form, rate: t })}
               />
             </View>

             <View style={styles.inputGroup}>
               <Text style={[styles.label, { color: T.textMuted }]}>APPLIES TO</Text>
               <View style={styles.toggleRow}>
                  {APPLIES_TO_OPTIONS.map(opt => {
                    const active = form.applies_to === opt.value;
                    return (
                      <TouchableOpacity key={opt.value} style={[styles.toggleBtn, { backgroundColor: active ? T.primary : T.surface, borderColor: active ? T.primary : T.border }]} onPress={() => setForm({...form, applies_to: opt.value})}>
                        <Text style={[styles.toggleBtnTxt, { color: active ? '#fff' : T.text }]}>{opt.label.split('(')[0]}</Text>
                      </TouchableOpacity>
                    );
                  })}
               </View>
             </View>

             <View style={styles.inputGroup}>
               <Text style={[styles.label, { color: T.textMuted }]}>CALCULATION MODE</Text>
               <View style={styles.toggleRow}>
                 <TouchableOpacity style={[styles.toggleBtn, { flex: 1, backgroundColor: !form.is_inclusive ? T.primary : T.surface, borderColor: !form.is_inclusive ? T.primary : T.border }]} onPress={() => setForm({...form, is_inclusive: false})}>
                    <Text style={[styles.toggleBtnTxt, { color: !form.is_inclusive ? '#fff' : T.text }]}>Extra (Add on Top)</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.toggleBtn, { flex: 1, backgroundColor: form.is_inclusive ? '#3b82f6' : T.surface, borderColor: form.is_inclusive ? '#3b82f6' : T.border }]} onPress={() => setForm({...form, is_inclusive: true})}>
                    <Text style={[styles.toggleBtnTxt, { color: form.is_inclusive ? '#fff' : T.text }]}>Included (Built-in)</Text>
                 </TouchableOpacity>
               </View>
             </View>

             <View style={[styles.switchRow, { backgroundColor: T.surface, borderColor: T.border }]}>
               <View>
                 <Text style={[styles.switchLabel, { color: T.text }]}>Active on New Bills</Text>
                 <Text style={[styles.switchSub, { color: T.textMuted }]}>Will be added automatically</Text>
               </View>
               <Switch value={form.is_active} onValueChange={v => setForm({ ...form, is_active: v })} trackColor={{ true: T.primary, false: T.borderStrong }} />
             </View>

           </ScrollView>

           <View style={[styles.footer, { backgroundColor: T.surface, borderColor: T.border }]}>
             <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: T.primary }]} onPress={handleSave} disabled={saving}>
               {saving ? <ActivityIndicator color="#fff" /> : (
                 <>
                   <CheckCircle2 size={16} color="#fff" />
                   <Text style={styles.btnPrimaryTxt}>SAVE TAX RULE</Text>
                 </>
               )}
             </TouchableOpacity>
           </View>
         </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  
  infoBox: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  infoTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  infoText: { fontSize: 12, lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1 },
  statLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '800' },

  emptyBox: { alignItems: 'center', padding: 40, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed' },
  emptyBoxTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  emptyBoxText: { fontSize: 12, textAlign: 'center', lineHeight: 20 },

  list: { gap: 12 },
  taxCard: { borderRadius: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  cardHeaderLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rateBadge: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rateBadgeTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  taxName: { fontSize: 16, fontWeight: '700' },
  taxMetaBadge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  
  cardFooter: { flexDirection: 'row', borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  actionBtnTxt: { fontSize: 12, fontWeight: '800' },

  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 12 },
  btnPrimaryTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  footer: { padding: 16, borderTopWidth: 1 },

  // Modal
  modalSafe: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalClose: { fontSize: 14, fontWeight: '600' },
  modalScroll: { padding: 16, gap: 20, paddingBottom: 40 },
  
  inputGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  input: { height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 15 },
  
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleBtn: { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: 8 },
  toggleBtnTxt: { fontSize: 12, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1, borderRadius: 12 },
  switchLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  switchSub: { fontSize: 11 }
});
