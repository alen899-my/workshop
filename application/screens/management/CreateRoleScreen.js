import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { AppPicker } from '../../components/ui/AppPicker'; // Just in case
import { roleService, permissionService } from '../../services/management.service';
import { useToast } from '../../components/ui/WorkshopToast';
import { useTheme } from '../../lib/theme';

export default function CreateRoleScreen({ navigation }) {
  const T = useTheme();
  const s = getStyles(T);
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

  const groupedPerms = allPerms.reduce((acc, p) => {
    const mod = p.module_name || 'General';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

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

        <Text style={s.sectionTitle}>Permission Coverage</Text>
        <View style={s.card}>
          {loadingPerms ? (
            <ActivityIndicator color={T.primary} style={{ margin: 10 }} />
          ) : allPerms.length === 0 ? (
            <Text style={{ fontSize: 13, color: T.textMuted, fontFamily: T.font }}>No permissions loaded.</Text>
          ) : (
            <View style={s.tableGroup}>
              {Object.entries(groupedPerms).map(([mod, perms]) => (
                <View key={mod} style={s.tableSection}>
                  <View style={s.tableHeader}>
                    <Text style={s.tableHeaderTxt}>{mod}</Text>
                  </View>
                  {perms.map((p, idx) => {
                    const has = form.permissions.includes(p.slug);
                    return (
                      <TouchableOpacity 
                        key={p.slug} 
                        style={[s.tableRow, idx === perms.length - 1 && s.tableRowLast]} 
                        onPress={() => togglePermission(p.slug)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.tableCellLabel}>{p.permission_name}</Text>
                        <View style={[s.checkSq, has && s.checkSqOn]}>
                          {has && <Check size={12} color={T.primaryText || '#fff'} strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
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

const getStyles = (T) => StyleSheet.create({
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
  tableGroup: { gap: 16 },
  tableSection: { borderRadius: 12, borderWidth: 1, borderColor: T.border, overflow: 'hidden', backgroundColor: T.surface },
  tableHeader: { backgroundColor: T.surfaceAlt, padding: 10, borderBottomWidth: 1, borderBottomColor: T.border },
  tableHeaderTxt: { fontSize: 12, fontWeight: '800', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border },
  tableRowLast: { borderBottomWidth: 0 },
  tableCellLabel: { fontSize: 13, color: T.text, flex: 1, fontWeight: '500' },
  checkSq: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: T.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkSqOn: { backgroundColor: T.primary, borderColor: T.primary },
});
