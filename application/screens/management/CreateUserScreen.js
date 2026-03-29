import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '../../components/ui/AppInput';
import { AppPicker } from '../../components/ui/AppPicker';
import { AppButton } from '../../components/ui/AppButton';
import { userService, roleService, shopService } from '../../services/management.service';
import { useRBAC } from '../../lib/rbac';
import { useToast } from '../../components/ui/WorkshopToast';
import { useTheme } from '../../lib/theme';

export default function CreateUserScreen({ navigation }) {
  const T = useTheme();
  const s = getStyles(T);
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: '', shop_id: '', status: 'active' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isSuperAdmin } = useRBAC();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [rRes, sRes] = await Promise.all([
        roleService.getAll(),
        isSuperAdmin ? shopService.getAll() : Promise.resolve({ success: false })
      ]);
      if (rRes.success && Array.isArray(rRes.data)) setRoles(rRes.data.filter(r => r.slug !== 'admin'));
      if (sRes.success && Array.isArray(sRes.data)) setShops(sRes.data);
      setLoading(false);
    };
    init();
  }, [isSuperAdmin]);

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.password || form.password.length < 6) e.password = 'Minimum 6 characters';
    if (!form.role) e.role = 'Role is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const res = await userService.create(form);
    setSaving(false);
    if (res.success) {
      toast({ type: 'success', title: 'User Created', description: `${form.name} successfully added.` });
      navigation.goBack();
    } else {
      toast({ type: 'error', title: 'Creation Failed', description: res.error || 'Failed to create user.' });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Text style={s.sectionTitle}>Basic Information</Text>
        <View style={s.card}>
          <AppInput label="Full Name" value={form.name} onChangeText={set('name')} placeholder="e.g. John Doe" autoCapitalize="words" error={errors.name} />
          <View style={s.divider} />
          <AppInput label="Phone Number" value={form.phone} onChangeText={set('phone')} placeholder="e.g. 09876543210" keyboardType="phone-pad" error={errors.phone} />
          <View style={s.divider} />
          <AppInput label="Password" value={form.password} onChangeText={set('password')} placeholder="Minimum 6 characters" secureTextEntry error={errors.password} />
        </View>

        <Text style={s.sectionTitle}>Role & Status</Text>
        <View style={s.card}>
          {loading ? (
            <ActivityIndicator color={T.primary} style={{ marginVertical: 8 }} />
          ) : (
            <AppPicker 
              label="Role" 
              value={form.role} 
              onSelect={set('role')} 
              options={roles.map(r => ({ id: r.slug, name: r.name }))} 
              placeholder="Select a role" 
            />
          )}

          <View style={s.divider} />

          <AppPicker 
            label="Status" 
            value={form.status} 
            onSelect={set('status')} 
            options={[
              { id: 'active', name: 'Active' },
              { id: 'inactive', name: 'Inactive' }
            ]} 
            placeholder="Select status" 
          />

          {isSuperAdmin && shops.length > 0 && (
            <>
              <View style={s.divider} />
              <AppPicker 
                label="Workshop Assignment" 
                value={form.shop_id} 
                onSelect={set('shop_id')} 
                options={[
                  { id: '', name: 'Direct (Global)' },
                  ...shops.map(shop => ({ id: String(shop.id), name: shop.name }))
                ]} 
                placeholder="Select assigned workshop" 
              />
            </>
          )}
        </View>

        {errors.general && <Text style={s.errorGeneral}>{errors.general}</Text>}

        <View style={s.buttons}>
          <AppButton title="Cancel" variant="ghost" size="md" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
          <AppButton title="Create User" variant="primary" size="md" loading={saving} style={{ flex: 1 }} onPress={handleSave} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (T) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16, gap: 0, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: T.textFaint, fontFamily: T.font,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16,
  },
  card: {
    backgroundColor: T.surface, borderRadius: T.radiusLg, borderWidth: 1,
    borderColor: T.border, padding: 14, gap: 12, ...T.shadow,
  },
  divider: { height: 1, backgroundColor: T.border, marginHorizontal: -14 },
  fieldLabel: {
    fontSize: 12, fontWeight: '600', color: T.textMuted, fontFamily: T.font, marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
    borderWidth: 1, borderColor: T.border, backgroundColor: T.bg,
  },
  chipOn: { backgroundColor: T.primary, borderColor: T.primary },
  chipTxt: { fontSize: 13, fontWeight: '600', color: T.textMuted, fontFamily: T.font, textTransform: 'capitalize' },
  chipTxtOn: { color: T.primaryText || '#fff' },
  errorGeneral: { fontSize: 13, color: T.danger, fontFamily: T.font, textAlign: 'center', marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 24 },
});
