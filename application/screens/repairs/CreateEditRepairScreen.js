import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Camera, 
  Image as ImageIcon, 
  X, 
  Trash2, 
  User, 
  Wrench, 
  ShieldCheck, 
  Plus,
  Clock
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { AppPicker } from '../../components/ui/AppPicker';
import { repairService } from '../../services/repair.service';
import { userService } from '../../services/management.service';
import { useToast } from '../../components/ui/WorkshopToast';
import { VEHICLE_CONFIG, getVehiclesByCategory, VehicleIcon } from '../../constants/Vehicles';
import { formatDateTime, toUTC } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const MAIN_VEHICLES = ['Car', 'Motorbike', 'Scooter', 'Van', 'Truck'];

export default function CreateEditRepairScreen({ navigation, route }) {
  const { user } = useAuth();
  const T = useTheme();
  const repairId = route.params?.id;
  const isEdit = !!repairId;

  const [form, setForm] = useState({
    vehicle_number: '',
    vehicle_type: 'Car',
    model_name: '',
    owner_name: '',
    phone_number: '',
    complaints: [],
    repair_date: new Date().toISOString(),
    attending_worker_id: user?.role === 'worker' ? String(user.id) : '',
    status: 'Pending',
    service_type: 'Repair'
  });
  const [currentComplaint, setCurrentComplaint] = useState('');

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
            vehicle_type: d.vehicle_type || 'Car',
            model_name: d.model_name || '',
            owner_name: d.owner_name || '',
            phone_number: d.phone_number || '',
            complaints: Array.isArray(d.complaints) 
              ? d.complaints.map(c => typeof c === 'string' ? { text: c, fixed: false } : c) 
              : [],
            repair_date: d.repair_date || new Date().toISOString(),
            attending_worker_id: d.attending_worker_id ? String(d.attending_worker_id) : '',
            status: d.status || 'Pending',
            service_type: d.service_type || 'Repair'
          });
          if (d.vehicle_image) setImage(d.vehicle_image);
        }
      } catch (err) {
        toast({ type: 'error', title: 'Error', description: 'Failed to load details.' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [repairId, isEdit]);

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast({ type: 'error', title: 'Permission', description: 'Camera permission is required.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addComplaint = () => {
    if (currentComplaint.trim()) {
      setForm(f => ({ 
        ...f, 
        complaints: [...f.complaints, { text: currentComplaint.trim(), fixed: false }] 
      }));
      setCurrentComplaint('');
    }
  };

  const toggleComplaint = (index) => {
    setForm(f => ({
      ...f,
      complaints: f.complaints.map((c, i) => i === index ? { ...c, fixed: !c.fixed } : c)
    }));
  };

  const removeComplaint = (index) => {
    setForm(f => ({ ...f, complaints: f.complaints.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const e = {};
    if (!form.vehicle_number.trim()) e.vehicle_number = 'Plate number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'complaints') {
          formData.append(key, JSON.stringify(form[key]));
        } else if (key === 'repair_date') {
          formData.append(key, toUTC(form[key]));
        } else if (form[key]) {
          formData.append(key, form[key]);
        }
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
          title: isEdit ? 'Saved' : 'Started', 
          description: `success` 
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
      <View style={[s.loadCenter, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  const isMainSelected = MAIN_VEHICLES.includes(form.vehicle_type);
  const currentOther = !isMainSelected ? VEHICLE_CONFIG.find(v => v.id === form.vehicle_type) : null;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <View style={s.header}>
           <Text style={[s.pageTitle, { color: T.text }]}>{isEdit ? 'Edit Repair' : 'Create New Repair'}</Text>
           <Text style={[s.pageSubtitle, { color: T.textMuted }]}>Enter vehicle and customer details to save.</Text>
        </View>

        <View style={s.sectionHeader}>
           <Wrench size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>SELECT VEHICLE TYPE</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.typeGrid}>
           {MAIN_VEHICLES.map(id => {
             const type = VEHICLE_CONFIG.find(v => v.id === id);
             const isSelected = form.vehicle_type === id;
             // Ensure type.color isn't overriding dark mode themes too aggressively, but it's a branded color
             return (
               <TouchableOpacity 
                 key={id} 
                 style={[s.typeCard, { backgroundColor: T.surface, borderColor: T.border }, isSelected && { borderColor: type.color, backgroundColor: type.color + (T.isDark ? '15' : '05') }]}
                 onPress={() => set('vehicle_type')(id)}
               >
                 <View style={[s.iconBox, { backgroundColor: T.surfaceAlt }, isSelected && { backgroundColor: type.color }]}>
                   <VehicleIcon typeId={id} size={24} color={isSelected ? '#FFFFFF' : type.color} />
                 </View>
                 <Text style={[s.typeLabel, { color: T.textFaint }, isSelected && { color: type.color }]}>{type.label}</Text>
               </TouchableOpacity>
             );
           })}

           {!isMainSelected && currentOther && (
             <TouchableOpacity 
               style={[s.typeCard, { backgroundColor: currentOther.color + (T.isDark ? '15' : '05'), borderColor: currentOther.color }]}
               onPress={() => navigation.navigate('VehicleTypePicker', { 
                 onSelect: (id) => set('vehicle_type')(id),
                 selectedId: form.vehicle_type 
               })}
             >
               <View style={[s.iconBox, { backgroundColor: currentOther.color }]}>
                 <VehicleIcon typeId={currentOther.id} size={24} color="#FFFFFF" />
               </View>
               <Text style={[s.typeLabel, { color: currentOther.color }]}>{currentOther.label}</Text>
             </TouchableOpacity>
           )}

           <TouchableOpacity 
             style={[s.typeCard, { borderStyle: 'dashed', backgroundColor: T.surface, borderColor: T.borderStrong }]}
             onPress={() => navigation.navigate('VehicleTypePicker', { 
               onSelect: (id) => set('vehicle_type')(id),
               selectedId: form.vehicle_type 
             })}
           >
             <View style={[s.iconBox, { backgroundColor: T.surfaceAlt }]}>
               <Plus size={24} color={T.textMuted} strokeWidth={2} />
             </View>
             <Text style={[s.typeLabel, { color: T.textFaint }]}>View All</Text>
           </TouchableOpacity>
        </ScrollView>

        <View style={s.sectionHeader}>
           <User size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>OWNER & VEHICLE INFO</Text>
        </View>
        <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
           <AppInput 
             label="Plate Number (Required)" 
             value={form.vehicle_number} 
             onChangeText={set('vehicle_number')} 
             placeholder="e.g. KL 01 AB 1234" 
             autoCapitalize="characters" 
             error={errors.vehicle_number} 
           />
           <View style={[s.divider, { backgroundColor: T.border }]} />
           <AppInput 
             label="Model Name" 
             value={form.model_name} 
             onChangeText={set('model_name')} 
             placeholder="e.g. MT15, R15, Pulsar" 
             autoCapitalize="words" 
           />
           <View style={[s.divider, { backgroundColor: T.border }]} />
           <AppInput label="Customer Name" value={form.owner_name} onChangeText={set('owner_name')} placeholder="Full name of owner" autoCapitalize="words" />
           <View style={[s.divider, { backgroundColor: T.border }]} />
           <AppInput label="Phone Number" value={form.phone_number} onChangeText={set('phone_number')} placeholder="Mobile number" keyboardType="phone-pad" />
        </View>

        <View style={s.sectionHeader}>
           <Wrench size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>REPAIR INFORMATION</Text>
        </View>
        <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
           <View>
             <Text style={[s.fieldLabel, { color: T.text }]}>What's wrong? (Complaints)</Text>
             <View style={s.complaintInputRow}>
                <AppInput 
                  placeholder="Type a complaint..." 
                  value={currentComplaint} 
                  onChangeText={setCurrentComplaint}
                  onSubmitEditing={addComplaint}
                  style={{ flex: 1, marginBottom: 0 }}
                />
                <TouchableOpacity style={[s.addComplaintBtn, { backgroundColor: T.primary }]} onPress={addComplaint}>
                   <Plus size={20} color="#FFF" />
                </TouchableOpacity>
             </View>
             
             <View style={s.complaintList}>
                {form.complaints.map((c, i) => (
                   <View key={i} style={[s.complaintItem, { backgroundColor: T.surfaceAlt }]}>
                      <TouchableOpacity 
                        style={[s.checkCircle, { borderColor: T.borderStrong }, c.fixed && { backgroundColor: T.success, borderColor: T.success }]} 
                        onPress={() => toggleComplaint(i)}
                      >
                         {c.fixed && <ShieldCheck size={12} color="#FFF" />}
                      </TouchableOpacity>
                      <Text style={[s.complaintText, { color: T.text }, c.fixed && { textDecorationLine: 'line-through', color: T.textFaint }]}>{c.text}</Text>
                      <TouchableOpacity onPress={() => removeComplaint(i)}>
                         <X size={16} color={T.danger} />
                      </TouchableOpacity>
                   </View>
                ))}
             </View>
           </View>
           
           <View style={[s.divider, { backgroundColor: T.border }]} />
           
           <View>
             <Text style={[s.fieldLabel, { color: T.text }]}>Repair Time</Text>
             <View style={[s.timestampBadge, { backgroundColor: T.primary + '15', borderColor: T.primary + '30' }]}>
                <Clock size={16} color={T.primary} strokeWidth={2.5} />
                <Text style={[s.timestampTxt, { color: T.primary }]}>{formatDateTime(form.repair_date)}</Text>
             </View>
             <Text style={[s.timestampHint, { color: T.textMuted }]}>This timestamp is automatically recorded and saved.</Text>
           </View>
           
           <View style={[s.divider, { backgroundColor: T.border }]} />
           
           <AppPicker 
              label="Repair Type" 
              value={form.service_type} 
              onSelect={set('service_type')} 
              placeholder="Select Service Type"
              options={[
                { id: 'Repair', name: 'Repair' },
                { id: 'Service', name: 'Service' },
                { id: 'Checkup', name: 'Checkup' },
                { id: 'Other', name: 'Other' }
              ]} 
           />
           
           <View style={[s.divider, { backgroundColor: T.border }]} />
        </View>

        <View style={s.sectionHeader}>
           <User size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>WORK STATUS</Text>
        </View>
        <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
           <AppPicker 
              label="Worker Assigned" 
              value={form.attending_worker_id} 
              onSelect={set('attending_worker_id')} 
              placeholder="Select a worker"
              disabled={user?.role === 'worker'}
              options={
                user?.role === 'worker' 
                  ? [{ id: String(user.id), name: user.name }]
                  : [
                      { id: '', name: 'None / Unassigned' },
                      ...workers.map(w => ({ id: String(w.id), name: w.name }))
                    ]
              } 
           />

           <View style={[s.divider, { backgroundColor: T.border }]} />

           {isEdit && (
             <>
               <Text style={[s.fieldLabel, { color: T.text }]}>Current Stage</Text>
               <View style={s.chipRow}>
                  {['Pending', 'Started', 'In Progress', 'Done'].map(st => (
                    <TouchableOpacity key={st} style={[s.chip, { backgroundColor: T.surfaceAlt, borderColor: T.border }, form.status === st && { backgroundColor: T.primary, borderColor: T.primary }]} onPress={() => set('status')(st)}>
                       <Text style={[s.chipTxt, { color: T.textMuted }, form.status === st && { color: T.primaryText }]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
               </View>
             </>
           )}
        </View>

        <View style={s.sectionHeader}>
           <Camera size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>PHOTOS</Text>
        </View>
        <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
           <View style={s.imageContainer}>
             {image ? (
               <View style={s.imageWrapper}>
                 <Image source={{ uri: image }} style={s.imagePreview} />
                 <TouchableOpacity style={s.removeBtn} onPress={() => setImage(null)}>
                    <X size={16} color="#FFF" />
                 </TouchableOpacity>
               </View>
             ) : (
               <View style={{flexDirection: 'row', gap: 12}}>
                 <TouchableOpacity style={[s.imagePlaceholder, {flex: 1, backgroundColor: T.surfaceAlt, borderColor: T.borderStrong}]} onPress={pickImage}>
                    <ImageIcon size={32} color={T.textFaint} strokeWidth={1.5} />
                    <Text style={[s.placeholderTxt, { color: T.textMuted }]}>Gallery</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[s.imagePlaceholder, {flex: 1, backgroundColor: T.surfaceAlt, borderColor: T.borderStrong}]} onPress={takePhoto}>
                    <Camera size={32} color={T.textFaint} strokeWidth={1.5} />
                    <Text style={[s.placeholderTxt, { color: T.textMuted }]}>Camera</Text>
                 </TouchableOpacity>
               </View>
             )}
           </View>
        </View>

        <View style={s.actionRow}>
           <AppButton title="Discard" variant="ghost" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
           <AppButton title={isEdit ? "Update Repair" : "Start Repair"} variant="primary" style={{ flex: 1.5 }} loading={saving} onPress={handleSave} />
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
  sectionTitle: {
    fontSize: 10, fontWeight: '900', fontFamily: FONT,
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  typeGrid: {
    paddingLeft: 4,
    gap: 12,
  },
  typeCard: {
    width: 90,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 8,
    fontWeight: '900',
    fontFamily: FONT,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 20, borderWidth: 1,
    padding: 20, gap: 16,
  },
  divider: { height: 1, marginHorizontal: -20 },
  fieldLabel: { fontSize: 12, fontWeight: '800', fontFamily: FONT, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 12, fontWeight: '700', fontFamily: FONT },
  imageContainer: { marginTop: 4 },
  imagePlaceholder: {
    height: 140, borderRadius: 16, borderWidth: 1,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  placeholderTxt: { fontSize: 12, fontWeight: '700', fontFamily: FONT },
  imageWrapper: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute', top: 12, right: 12, width: 32, height: 32,
    borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 40 },
  complaintInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addComplaintBtn: { 
    width: 44, height: 44, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center' 
  },
  complaintList: { marginTop: 10, gap: 8 },
  complaintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complaintText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT,
  },
  timestampBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 10, 
    padding: 14, borderRadius: 16, borderWidth: 1 
  },
  timestampTxt: { fontSize: 13, fontWeight: '800', fontFamily: FONT },
  timestampHint: { fontSize: 10, marginTop: 6, opacity: 0.8 },
});
