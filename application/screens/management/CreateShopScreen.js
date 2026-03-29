import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { shopService } from '../../services/management.service';
import { useToast } from '../../components/ui/WorkshopToast';
import { T } from '../../constants/Theme';

export default function CreateShopScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', location: '', owner_name: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Shop name is required';
    if (!form.owner_name.trim()) e.owner_name = 'Owner name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const res = await shopService.create(form);
    setSaving(false);
    if (res.success) {
      toast({ type: 'success', title: 'Shop Added', description: `${form.name} created successfully.` });
      navigation.goBack();
    } else {
      toast({ type: 'error', title: 'Error', description: res.error || 'Failed to register shop.' });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Text style={s.sectionTitle}>Shop Information</Text>
        <View style={s.card}>
          <AppInput label="Shop Name" value={form.name} onChangeText={set('name')} placeholder="e.g. Speed Auto Works" autoCapitalize="words" error={errors.name} />
          <View style={s.divider} />
          <AppInput label="Location" value={form.location} onChangeText={set('location')} placeholder="e.g. Kochi, Kerala" autoCapitalize="words" error={errors.location} />
        </View>

        <Text style={s.sectionTitle}>Owner Account</Text>
        <View style={s.card}>
          <AppInput label="Owner Full Name" value={form.owner_name} onChangeText={set('owner_name')} placeholder="e.g. Rajan K." autoCapitalize="words" error={errors.owner_name} />
        </View>

        <View style={s.buttons}>
          <AppButton title="Cancel" variant="ghost" size="md" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
          <AppButton title="Register Shop" variant="primary" size="md" loading={saving} style={{ flex: 1 }} onPress={handleSave} />
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
});
