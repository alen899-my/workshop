import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Image as ImageIcon, X, Trash2, Calendar, User, Wrench } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { repairService } from '../../services/repair.service';
import { userService } from '../../services/management.service';
import { useToast } from '../../components/ui/WorkshopToast';
import { T } from '../../constants/Theme';

export default function CreateEditRepairScreen({ navigation, route }) {
  const repairId = route.params?.id;
  const isEdit = !!repairId;

  const [form, setForm] = useState({
    vehicle_number: '',
    owner_name: '',
    phone_number: '',
    complaints: '',
    repair_date: new Date().toISOString().substring(0, 10),
    attending_worker_id: '',
    status: 'Pending',
    service_type: 'Repair'
  });

  const [image, setImage] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [wRes, rRes] = await Promise.all([
          userService.getAll(),
          isEdit ? repairService.getById(repairId) : Promise.resolve({ success: false })
        ]);

        if (wRes.success) setWorkers(wRes.data || []);
        
        if (isEdit && rRes.success && rRes.data) {
          const d = rRes.data;
          setForm({
            vehicle_number: d.vehicle_number || '',
            owner_name: d.owner_name || '',
            phone_number: d.phone_number || '',
            complaints: d.complaints || '',
            repair_date: d.repair_date ? new Date(d.repair_date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
            attending_worker_id: d.attending_worker_id ? String(d.attending_worker_id) : '',
            status: d.status || 'Pending',
            service_type: d.service_type || 'Repair'
          });
          if (d.vehicle_image) setImage(d.vehicle_image);
        }
      } catch (err) {
        toast({ type: 'error', title: 'Init Failed', description: 'Could not load required data.' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [repairId, isEdit]);

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.vehicle_number.trim()) e.vehicle_number = 'Vehicle number required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key]) formData.append(key, form[key]);
      });

      if (image && !image.startsWith('http')) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('vehicle_image', { uri: image, name: filename, type });
      }

      const res = isEdit 
        ? await repairService.update(repairId, formData)
        : await repairService.create(formData);

      if (res.success) {
        toast({ 
          type: 'success', 
          title: isEdit ? 'Repair Updated' : 'Repair Created', 
          description: `Vehicle ${form.vehicle_number} successfully ${isEdit ? 'updated' : 'added'}.` 
        });
        navigation.goBack();
      } else {
        toast({ type: 'error', title: 'Error', description: res.error || 'Failed to save.' });
      }
    } catch (err) {
      console.error(err);
      toast({ type: 'error', title: 'Error', description: 'Internal submission error.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loadCenter}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={s.loadTxt}>Syncing Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Header Summary */}
        <View style={s.header}>
           <Text style={s.pageTitle}>{isEdit ? 'Update Repair' : 'Log New Repair'}</Text>
           <Text style={s.pageSubtitle}>Precision tracking for every workshop job.</Text>
        </View>

        <Text style={s.sectionTitle}>Vehicle Identification</Text>
        <View style={s.card}>
           <AppInput 
             label="Vehicle Number *" 
             value={form.vehicle_number} 
             onChangeText={set('vehicle_number')} 
             placeholder="e.g. KL 01 AB 1234" 
             autoCapitalize="characters" 
             error={errors.vehicle_number} 
           />
           <View style={s.divider} />
           <View style={s.row}>
              <View style={{flex: 1}}>
                <AppInput label="Owner Name" value={form.owner_name} onChangeText={set('owner_name')} placeholder="Full name" autoCapitalize="words" />
              </View>
           </View>
           <View style={s.divider} />
           <AppInput label="Contact Phone" value={form.phone_number} onChangeText={set('phone_number')} placeholder="Mobile number" keyboardType="phone-pad" />
        </View>

        <Text style={s.sectionTitle}>Job Particulars</Text>
        <View style={s.card}>
           <AppInput 
             label="Primary Complaints" 
             value={form.complaints} 
             onChangeText={set('complaints')} 
             placeholder="List all issues reported by the owner..." 
             multiline 
             numberOfLines={4} 
           />
           
           <View style={s.divider} />
           
           <AppInput label="Repair Date" value={form.repair_date} onChangeText={set('repair_date')} placeholder="YYYY-MM-DD" />
           
           <View style={s.divider} />
           
           <Text style={s.fieldLabel}>Service Category</Text>
           <View style={s.chipRow}>
              {['Repair', 'Servicing', 'Inspection', 'Other'].map(type => (
                <TouchableOpacity key={type} style={[s.chip, form.service_type === type && s.chipOn]} onPress={() => set('service_type')(type)}>
                   <Text style={[s.chipTxt, form.service_type === type && s.chipTxtOn]}>{type}</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        <Text style={s.sectionTitle}>Assignment & Progress</Text>
        <View style={s.card}>
           <Text style={s.fieldLabel}>Attending Technician</Text>
           <View style={s.chipRow}>
              <TouchableOpacity style={[s.chip, !form.attending_worker_id && s.chipOn]} onPress={() => set('attending_worker_id')('')}>
                 <Text style={[s.chipTxt, !form.attending_worker_id && s.chipTxtOn]}>Unassigned</Text>
              </TouchableOpacity>
              {workers.map(w => (
                <TouchableOpacity key={w.id} style={[s.chip, form.attending_worker_id === String(w.id) && s.chipOn]} onPress={() => set('attending_worker_id')(String(w.id))}>
                   <Text style={[s.chipTxt, form.attending_worker_id === String(w.id) && s.chipTxtOn]}>{w.name}</Text>
                </TouchableOpacity>
              ))}
           </View>

           <View style={s.divider} />

           <Text style={s.fieldLabel}>Current Status</Text>
           <View style={s.chipRow}>
              {['Pending', 'Started', 'In Progress', 'Completed'].map(st => (
                <TouchableOpacity key={st} style={[s.chip, form.status === st && s.chipOn]} onPress={() => set('status')(st)}>
                   <Text style={[s.chipTxt, form.status === st && s.chipTxtOn]}>{st}</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        <Text style={s.sectionTitle}>Media Assets</Text>
        <View style={s.card}>
           <Text style={s.fieldLabel}>Vehicle Condition Photo</Text>
           <View style={s.imageContainer}>
             {image ? (
               <View style={s.imageWrapper}>
                 <Image source={{ uri: image }} style={s.imagePreview} />
                 <TouchableOpacity style={s.removeBtn} onPress={() => setImage(null)}>
                    <X size={16} color="#FFF" />
                 </TouchableOpacity>
               </View>
             ) : (
               <TouchableOpacity style={s.imagePlaceholder} onPress={pickImage}>
                  <Camera size={32} color={T.textFaint} strokeWidth={1.5} />
                  <Text style={s.placeholderTxt}>Attach Condition Photo</Text>
               </TouchableOpacity>
             )}
           </View>
        </View>

        <View style={s.actionRow}>
           <AppButton title="Discard" variant="ghost" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
           <AppButton title={isEdit ? "Update Job" : "Start Repair"} variant="primary" style={{ flex: 1.5 }} loading={saving} onPress={handleSave} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 20, paddingBottom: 60 },
  loadCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  loadTxt: { marginTop: 12, fontSize: 13, color: T.textMuted, fontWeight: '600', letterSpacing: 1 },
  header: { marginBottom: 24, marginTop: 10 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: T.text, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: T.textMuted, marginTop: 4, fontFamily: T.font },
  sectionTitle: {
    fontSize: 10, fontWeight: '900', color: T.textFaint, fontFamily: T.font,
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, marginTop: 24, paddingLeft: 4,
  },
  card: {
    backgroundColor: T.surface, borderRadius: T.radiusLg, borderWidth: 1,
    borderColor: T.border, padding: 20, gap: 16, ...T.shadowMd,
  },
  divider: { height: 1, backgroundColor: T.border, marginHorizontal: -20 },
  row: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: T.textMuted, fontFamily: T.font, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: T.border, backgroundColor: T.bg,
  },
  chipOn: { backgroundColor: T.primary, borderColor: T.primary },
  chipTxt: { fontSize: 12, fontWeight: '700', color: T.textMuted, fontFamily: T.font },
  chipTxtOn: { color: T.primaryText },
  imageContainer: { marginTop: 6 },
  imagePlaceholder: {
    height: 160, borderRadius: 16, borderWidth: 2, borderColor: T.border,
    borderStyle: 'dashed', backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  placeholderTxt: { fontSize: 12, color: T.textFaint, fontWeight: '600', fontFamily: T.font },
  imageWrapper: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute', top: 12, right: 12, width: 32, height: 32,
    borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 40 },
});
