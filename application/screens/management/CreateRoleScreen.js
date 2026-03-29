import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { roleService, permissionService } from '../../services/management.service';
import { useToast } from '../../components/ui/WorkshopToast';
import { T } from '../../constants/Theme';

export default function CreateRoleScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', slug: '', description: '', status: 'active', permissions: [] });
  const [allPerms, setAllPerms] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    permissionService.getAll().then(res => {
      if (res.success && Array.isArray(res.data)) setAllPerms(res.data);
      setLoadingPerms(false);
    });
  }, []);

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  const togglePermission = (slug) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(slug)
        ? f.permissions.filter(p => p !== slug)
        : [...f.permissions, slug]
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.slug.trim()) e.slug = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const res = await roleService.create(form);
    setSaving(false);
    if (res.success) {
      toast({ type: 'success', title: 'Role Created', description: `Security boundaries established.` });
      navigation.goBack();
    } else {
      toast({ type: 'error', title: 'Creation Failed', description: res.error || 'Failed to create role.' });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>Role Definition</Text>
        <View style={s.card}>
          <AppInput label="Role Name" value={form.name} onChangeText={set('name')} placeholder="e.g. Content Manager" autoCapitalize="words" error={errors.name} />
          <View style={s.divider} />
          <AppInput label="System Slug" value={form.slug} onChangeText={set('slug')} placeholder="e.g. content_manager" autoCapitalize="none" error={errors.slug} />
          <View style={s.divider} />
          <AppInput label="Description" value={form.description} onChangeText={set('description')} placeholder="Optional description..." multiline numberOfLines={3} />
        </View>

        <Text style={s.sectionTitle}>Permission Coverage Grid</Text>
        <View style={s.card}>
          {loadingPerms ? (
            <ActivityIndicator color={T.primary} style={{ margin: 10 }} />
          ) : allPerms.length === 0 ? (
            <Text style={{ fontSize: 13, color: T.textMuted, fontFamily: T.font }}>No permissions loaded.</Text>
          ) : (
            <View style={s.permGrid}>
              {allPerms.map(p => {
                const active = form.permissions.includes(p.slug);
                return (
                  <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => togglePermission(p.slug)}
                    style={[s.permSelect, active && s.permSelectOn]}>
                    <View style={[s.checkSq, active && s.checkSqOn]}>
                      {active && <Check size={10} color="#fff" strokeWidth={3} />}
                    </View>
                    <Text style={[s.permSelectTxt, active && s.permSelectTxtOn]} numberOfLines={1}>{p.permission_name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {errors.general && <Text style={s.errorGeneral}>{errors.general}</Text>}

        <View style={s.buttons}>
          <AppButton title="Cancel" variant="ghost" size="md" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
          <AppButton title="Create Role" variant="primary" size="md" loading={saving} style={{ flex: 1 }} onPress={handleSave} />
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
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16,
  },
  card: {
    backgroundColor: T.surface, borderRadius: T.radiusLg, borderWidth: 1,
    borderColor: T.border, padding: 14, gap: 12, ...T.shadow,
  },
  divider: { height: 1, backgroundColor: T.border, marginHorizontal: -14 },
  errorGeneral: { fontSize: 13, color: T.danger, fontFamily: T.font, textAlign: 'center', marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 24 },
  permGrid: { gap: 6 },
  permSelect: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: T.radiusSm, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  permSelectOn: { backgroundColor: T.primaryLight, borderColor: '#C3D9F0' },
  checkSq: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: T.textFaint, alignItems: 'center', justifyContent: 'center' },
  checkSqOn: { backgroundColor: T.primary, borderColor: T.primary },
  permSelectTxt: { fontSize: 12, fontWeight: '600', color: T.textMuted, fontFamily: T.font, flex: 1 },
  permSelectTxtOn: { color: T.primary },
});
