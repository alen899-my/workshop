import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Shield } from 'lucide-react-native';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { permissionService } from '../../services/management.service';
import { useToast } from '../../components/ui/WorkshopToast';
import { T } from '../../constants/Theme';

export default function CreatePermissionScreen({ navigation }) {
  const [moduleName, setModuleName] = useState('');
  const [items, setItems] = useState([
    { permission_name: '', slug: '', description: '', status: 'active' }
  ]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const addRow = () => {
    setItems([...items, { permission_name: '', slug: '', description: '', status: 'active' }]);
  };

  const removeRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-generate slug
    if (field === 'permission_name') {
       newItems[index].slug = value.toLowerCase().trim().replace(/\s+/g, ':');
    }
    
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!moduleName.trim()) {
      toast({ type: 'error', title: 'Required', description: 'Module Name is missing.' });
      return;
    }

    const invalid = items.some(item => !item.permission_name.trim() || !item.slug.trim());
    if (invalid) {
      toast({ type: 'error', title: 'Validation Error', description: 'All rows must have a Name and Slug.' });
      return;
    }

    setSaving(true);
    // Mimic the Next.js bulk array payload structure
    const res = await permissionService.create({
      module_name: moduleName.toUpperCase(),
      items: items
    });
    setSaving(false);

    if (res.success) {
      toast({ type: 'success', title: 'Permissions Added', description: `Rules successfully added to ${moduleName.toUpperCase()}.` });
      navigation.goBack();
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to add permissions.' });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Module Master Config */}
        <Text style={s.sectionTitle}>Module Scope</Text>
        <View style={[s.card, { paddingVertical: 18 }]}>
          <AppInput 
            label="Module Name" 
            value={moduleName} 
            onChangeText={(v) => setModuleName(v.toUpperCase())} 
            placeholder="e.g. INVENTORY, USERS, REPAIRS" 
            autoCapitalize="characters" 
          />
        </View>

        {/* Dynamic Permissions List */}
        <View style={s.batchHeaderWrap}>
           <Text style={s.sectionTitle}>Permissions List</Text>
           <TouchableOpacity onPress={addRow} style={s.addRowBtn} activeOpacity={0.75}>
             <Plus size={13} color={T.primary} strokeWidth={2.5} />
             <Text style={s.addRowTxt}>Add Row</Text>
           </TouchableOpacity>
        </View>

        <View style={s.itemsStack}>
          {items.map((item, idx) => (
            <View key={idx} style={s.itemCard}>
              {/* Optional Delete Badge */}
              {items.length > 1 && (
                <TouchableOpacity style={s.deleteBadge} onPress={() => removeRow(idx)} activeOpacity={0.7}>
                  <Trash2 size={12} color="#fff" />
                </TouchableOpacity>
              )}
              
              <Text style={s.rowTitle}>Rule #{idx + 1}</Text>

              <AppInput 
                label="Permission Name" 
                value={item.permission_name} 
                onChangeText={(v) => updateItem(idx, 'permission_name', v)} 
                placeholder="e.g. VIEW_ALL" 
                autoCapitalize="words" 
              />
              <View style={s.divider} />
              <AppInput 
                label="Security Slug" 
                value={item.slug} 
                onChangeText={(v) => updateItem(idx, 'slug', v.toLowerCase())} 
                placeholder="e.g. inventory:view" 
                autoCapitalize="none" 
              />
              <View style={s.divider} />
              <AppInput 
                label="Description" 
                value={item.description} 
                onChangeText={(v) => updateItem(idx, 'description', v)} 
                placeholder="Optional purpose summary..." 
                multiline 
                numberOfLines={2} 
              />
              <View style={s.divider} />
              
              <View style={{ gap: 6 }}>
                <Text style={s.fieldLabel}>Status</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['active', 'inactive'].map(opt => (
                    <TouchableOpacity key={opt} onPress={() => updateItem(idx, 'status', opt)}
                      style={[s.statusPill, item.status === opt && s.statusPillOn]}>
                      <Text style={[s.statusPillTxt, item.status === opt && s.statusPillTxtOn]}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </View>
          ))}
        </View>

        <View style={s.buttons}>
          <AppButton title="Cancel" variant="ghost" size="md" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
          <AppButton title="Create All Rules" variant="primary" size="md" loading={saving} style={{ flex: 1.5 }} onPress={handleSave} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16, paddingBottom: 40, gap: 0 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: T.textFaint, fontFamily: T.font,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 8,
  },
  card: {
    backgroundColor: T.surface, borderRadius: T.radiusLg, borderWidth: 1,
    borderColor: T.border, padding: 14, gap: 12, ...T.shadow,
  },
  divider: { height: 1, backgroundColor: T.border, marginHorizontal: -14 },
  
  batchHeaderWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: T.primaryLight, borderWidth: 1, borderColor: '#C3D9F0' },
  addRowTxt: { fontSize: 11, fontWeight: '700', color: T.primary, fontFamily: T.font },
  
  itemsStack: { gap: 14, marginTop: 4 },
  itemCard: {
    backgroundColor: T.surfaceAlt, borderRadius: T.radiusLg, borderWidth: 1,
    borderColor: T.border, padding: 14, gap: 12, ...T.shadow,
  },
  rowTitle: { fontSize: 11, fontWeight: '800', color: T.textMuted, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1 },
  deleteBadge: { position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: T.danger, alignItems: 'center', justifyContent: 'center', zIndex: 10, ...T.shadowMd },
  
  fieldLabel: { fontSize: 12, fontWeight: '600', color: T.textMuted, fontFamily: T.font },
  statusPill: { flex: 1, paddingVertical: 10, borderRadius: T.radius, borderWidth: 1, borderColor: T.border, alignItems: 'center', backgroundColor: T.surface },
  statusPillOn: { backgroundColor: T.primary, borderColor: T.primary },
  statusPillTxt: { fontSize: 13, fontWeight: '600', color: T.textMuted, fontFamily: T.font },
  statusPillTxtOn: { color: T.primaryText },
  
  buttons: { flexDirection: 'row', gap: 10, marginTop: 32 },
});
