import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, Keyboard
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
  Clock,
  Car,
  Loader2
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { AppPicker } from '../../components/ui/AppPicker';
import { repairService } from '../../services/repair.service';
import { userService } from '../../services/management.service';
import { vehicleService } from '../../services/vehicle.service';
import { useToast } from '../../components/ui/WorkshopToast';
import { VEHICLE_CONFIG, getVehiclesByCategory, VehicleIcon } from '../../constants/Vehicles';
import { formatDateTime, toUTC } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const MAIN_VEHICLES = ['Car', 'Motorbike', 'Scooter', 'Van', 'Truck'];
const SERVICE_TYPES = ["Repair", "Servicing", "Inspection", "Modification", "Other"];

const SERVICE_CONFIG_UI = {
  "Repair": { label: "What's wrong with the vehicle?" },
  "Servicing": { label: "What needs to be serviced?" },
  "Inspection": { label: "What do we need to check?" },
  "Modification": { label: "What are the modification details?" },
  "Other": { label: "Additional work details" }
};

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
    repair_date: new Date().toISOString(),
    attending_worker_id: user?.role === 'worker' ? String(user.id) : '',
    status: 'Pending',
  });

  const [serviceBlocks, setServiceBlocks] = useState([
    { type: "Repair", tasks: [] }
  ]);
  const [currentTasks, setCurrentTasks] = useState(['']); // One input string per block

  const [image, setImage] = useState(null);
  const [prefilledImage, setPrefilledImage] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  const [searchingVehicle, setSearchingVehicle] = useState(false);
  const selectedFromRegistry = useRef(false);

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
            repair_date: d.repair_date || new Date().toISOString(),
            attending_worker_id: d.attending_worker_id ? String(d.attending_worker_id) : '',
            status: d.status || 'Pending',
          });
          
          if (Array.isArray(d.complaints) && d.complaints.length > 0) {
            // Check if it's the new multi-block structure or old string array
            if (d.complaints[0].tasks !== undefined) {
              setServiceBlocks(d.complaints);
            } else {
              // Migrate old complaints to a single block
              setServiceBlocks([{
                 type: d.service_type || "Repair",
                 tasks: d.complaints.map(c => typeof c === 'string' ? { text: c, fixed: false } : c)
              }]);
            }
          } else {
            setServiceBlocks([{ type: d.service_type || "Repair", tasks: [] }]);
          }

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

  // -- Auto-Population Logic
  useEffect(() => {
    const vNum = form.vehicle_number.trim();
    if (vNum.length === 0) {
      setPrefilledImage(null);
      selectedFromRegistry.current = false;
      return;
    }
    if (selectedFromRegistry.current || isEdit) return;
    if (vNum.length < 2) return;

    const timeoutId = setTimeout(async () => {
      setSearchingVehicle(true);
      try {
        const res = await vehicleService.getByNumber(vNum);
        if (res.success && res.data) {
          const v = res.data;
          setForm(prev => ({
            ...prev,
            owner_name: v.owner_name || prev.owner_name,
            phone_number: v.owner_phone || prev.phone_number,
            model_name: v.model_name || prev.model_name,
            vehicle_type: v.vehicle_type || prev.vehicle_type,
          }));
          setPrefilledImage(v.vehicle_image || null);
          toast({ type: "success", title: "Registry Match", description: `History found for ${vNum}.` });
        } else {
          setPrefilledImage(null);
        }
      } catch (err) {
      } finally {
        setSearchingVehicle(false);
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [form.vehicle_number, isEdit]);

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  // Image Picking
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast({ type: 'error', title: 'Permission', description: 'Camera permission is required.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // Service Blocks Logic
  const addServiceBlock = () => setServiceBlocks([...serviceBlocks, { type: "Repair", tasks: [] }]);
  const removeServiceBlock = (index) => {
    if (serviceBlocks.length > 1) setServiceBlocks(serviceBlocks.filter((_, i) => i !== index));
  };
  const updateBlockType = (index, type) => {
    const next = [...serviceBlocks];
    next[index].type = type;
    setServiceBlocks(next);
  };
  const addTaskToBlock = (index) => {
    const text = currentTasks[index] || '';
    if (!text.trim()) return;
    const next = [...serviceBlocks];
    next[index].tasks.push({ text: text.trim(), fixed: false });
    setServiceBlocks(next);
    
    // Clear the specific input
    setCurrentTasks(prev => {
      const p = [...prev];
      p[index] = '';
      return p;
    });
  };
  const toggleTaskInBlock = (blockIdx, taskIdx) => {
    const next = [...serviceBlocks];
    next[blockIdx].tasks[taskIdx].fixed = !next[blockIdx].tasks[taskIdx].fixed;
    setServiceBlocks(next);
  };
  const removeTaskFromBlock = (blockIdx, taskIdx) => {
    const next = [...serviceBlocks];
    next[blockIdx].tasks = next[blockIdx].tasks.filter((_, i) => i !== taskIdx);
    setServiceBlocks(next);
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
        if (key === 'repair_date') {
          formData.append(key, toUTC(form[key]));
        } else if (form[key]) {
          formData.append(key, form[key]);
        }
      });
      
      formData.append('complaints', JSON.stringify(serviceBlocks));
      const mainServiceType = serviceBlocks.map(b => b.type).join(', ');
      formData.append('service_type', mainServiceType);

      if (image && !image.startsWith('http')) {
         const filename = image.split('/').pop();
         const match = /\.(\w+)$/.exec(filename);
         const type = match ? `image/${match[1]}` : `image`;
         formData.append('vehicle_image', { uri: image, name: filename, type });
      } else if (prefilledImage && !image && !isEdit) {
         formData.append('prefilled_image', prefilledImage);
      }

      const res = isEdit 
        ? await repairService.update(repairId, formData)
        : await repairService.create(formData);

      if (res.success) {
        toast({ type: 'success', title: isEdit ? 'Saved' : 'Started', description: `success` });
        navigation.goBack();
      } else {
        toast({ type: 'error', title: 'Error', description: res.error || 'Failed to save.' });
      }
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: 'Internal submission error.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.loadCenter, { backgroundColor: T.bg }]}><ActivityIndicator size="large" color={T.primary} /></View>
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
               onPress={() => navigation.navigate('VehicleTypePicker', { onSelect: set('vehicle_type'), selectedId: form.vehicle_type })}
             >
               <View style={[s.iconBox, { backgroundColor: currentOther.color }]}>
                 <VehicleIcon typeId={currentOther.id} size={24} color="#FFFFFF" />
               </View>
               <Text style={[s.typeLabel, { color: currentOther.color }]}>{currentOther.label}</Text>
             </TouchableOpacity>
           )}

           <TouchableOpacity 
             style={[s.typeCard, { borderStyle: 'dashed', backgroundColor: T.surface, borderColor: T.borderStrong }]}
             onPress={() => navigation.navigate('VehicleTypePicker', { onSelect: set('vehicle_type'), selectedId: form.vehicle_type })}
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
           <View style={{ position: 'relative' }}>
             <AppInput 
               label="Plate Number (Required)" 
               value={form.vehicle_number} 
               onChangeText={v => { set('vehicle_number')(v.toUpperCase()); }} 
               placeholder="e.g. KL 01 AB 1234" 
               autoCapitalize="characters" 
               error={errors.vehicle_number} 
             />
             {searchingVehicle && (
                <View style={{position: 'absolute', right: 12, top: 40}}>
                  <ActivityIndicator size="small" color={T.primary} />
                </View>
             )}
           </View>
           <View style={[s.divider, { backgroundColor: T.border }]} />
           <AppInput label="Model Name" value={form.model_name} onChangeText={set('model_name')} placeholder="e.g. MT15, R15, Pulsar" autoCapitalize="words" />
           <View style={[s.divider, { backgroundColor: T.border }]} />
           <AppInput label="Customer Name" value={form.owner_name} onChangeText={set('owner_name')} placeholder="Full name of owner" autoCapitalize="words" />
           <View style={[s.divider, { backgroundColor: T.border }]} />
           <AppInput label="Phone Number" value={form.phone_number} onChangeText={set('phone_number')} placeholder="Mobile number" keyboardType="phone-pad" />
        </View>

        <View style={s.sectionHeader}>
           <Wrench size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>REPAIR INFORMATION</Text>
        </View>

        {serviceBlocks.map((block, bIdx) => {
          const ui = SERVICE_CONFIG_UI[block.type] || SERVICE_CONFIG_UI["Other"];
          return (
            <View key={bIdx} style={[s.blockCard, { backgroundColor: T.surface, borderColor: T.border, marginBottom: 12 }]}>
               <View style={s.blockHeader}>
                 <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                   <View style={[s.blockNum, { backgroundColor: T.primary + '20' }]}>
                      <Text style={[s.blockNumTxt, { color: T.primary }]}>{bIdx + 1}</Text>
                   </View>
                   <Text style={[s.blockTitle, { color: T.primary }]}>SERVICE CATEGORY</Text>
                 </View>
                 {serviceBlocks.length > 1 && (
                   <TouchableOpacity onPress={() => removeServiceBlock(bIdx)} style={{padding: 4}}>
                      <Trash2 size={16} color={T.danger} />
                   </TouchableOpacity>
                 )}
               </View>

               <AppPicker 
                  value={block.type} 
                  onSelect={(v) => updateBlockType(bIdx, v)}
                  options={SERVICE_TYPES.map(st => ({ id: st, name: st }))} 
               />

               <View style={{marginTop: 16}}>
                 <Text style={[s.fieldLabel, { color: T.text }]}>{ui.label}</Text>
                 <View style={s.complaintInputRow}>
                    <AppInput 
                      placeholder="Add an item to the list..." 
                      value={currentTasks[bIdx] || ''} 
                      onChangeText={(t) => {
                         setCurrentTasks(p => {
                            const n = [...p];
                            n[bIdx] = t;
                            return n;
                         });
                      }}
                      onSubmitEditing={() => addTaskToBlock(bIdx)}
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                    <TouchableOpacity style={[s.addComplaintBtn, { backgroundColor: T.primary }]} onPress={() => addTaskToBlock(bIdx)}>
                       <Plus size={20} color="#FFF" />
                    </TouchableOpacity>
                 </View>
                 
                 <View style={s.complaintList}>
                    {block.tasks.length === 0 && (
                       <View style={[s.emptyTaskArea, { borderColor: T.borderStrong }]}>
                          <Text style={[s.emptyTaskTxt, { color: T.textMuted }]}>EMPTY SERVICE LIST</Text>
                       </View>
                    )}
                    {block.tasks.map((t, tIdx) => (
                       <View key={tIdx} style={[s.complaintItem, { backgroundColor: T.surfaceAlt, borderColor: T.border }]}>
                          <TouchableOpacity 
                            style={[s.checkCircle, { borderColor: T.borderStrong }, t.fixed && { backgroundColor: T.success, borderColor: T.success }]} 
                            onPress={() => toggleTaskInBlock(bIdx, tIdx)}
                          >
                             {t.fixed && <ShieldCheck size={12} color="#FFF" />}
                          </TouchableOpacity>
                          <Text style={[s.complaintText, { color: T.text }, t.fixed && { textDecorationLine: 'line-through', color: T.textFaint }]}>{t.text}</Text>
                          <TouchableOpacity onPress={() => removeTaskFromBlock(bIdx, tIdx)}>
                             <X size={16} color={T.danger} />
                          </TouchableOpacity>
                       </View>
                    ))}
                 </View>
               </View>
            </View>
          );
        })}

        <TouchableOpacity 
           style={[s.addBlockBtn, { backgroundColor: T.primary + '0A', borderColor: T.primary + '40' }]} 
           activeOpacity={0.7} 
           onPress={addServiceBlock}
        >
           <View style={[s.addBlockIconWrap, { backgroundColor: T.primary + '1A' }]}>
              <Plus size={20} color={T.primary} />
           </View>
           <Text style={[s.addBlockTxt, { color: T.primary }]}>ADD ANOTHER SERVICE CATEGORY</Text>
        </TouchableOpacity>

        <View style={s.sectionHeader}>
           <User size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>WORK STATUS & METADATA</Text>
        </View>
        <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
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

           <Text style={[s.fieldLabel, { color: T.text }]}>Current Stage</Text>
           <View style={s.chipRow}>
              {['Pending', 'Started', 'In Progress', 'Completed'].map(st => (
                <TouchableOpacity key={st} style={[s.chip, { backgroundColor: T.surfaceAlt, borderColor: T.border }, form.status === st && { backgroundColor: T.primary, borderColor: T.primary }]} onPress={() => set('status')(st)}>
                   <Text style={[s.chipTxt, { color: T.textMuted }, form.status === st && { color: T.primaryText }]}>{st}</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        <View style={s.sectionHeader}>
           <Camera size={16} color={T.textMuted} strokeWidth={2.5} />
           <Text style={[s.sectionTitle, { color: T.textMuted }]}>PHOTOS</Text>
        </View>
        <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
           <View style={s.imageContainer}>
             {(image || prefilledImage) ? (
               <View style={s.imageWrapper}>
                 <Image source={{ uri: image || prefilledImage }} style={s.imagePreview} />
                 <TouchableOpacity style={s.removeBtn} onPress={() => { setImage(null); setPrefilledImage(null); }}>
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
  sectionTitle: { fontSize: 10, fontWeight: '900', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 1.5 },
  typeGrid: { paddingLeft: 4, gap: 12 },
  typeCard: { width: 90, borderRadius: 18, padding: 12, alignItems: 'center', borderWidth: 1, gap: 6 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  typeLabel: { fontSize: 8, fontWeight: '900', fontFamily: FONT, letterSpacing: 0.5 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  divider: { height: 1, marginHorizontal: -20 },
  fieldLabel: { fontSize: 12, fontWeight: '800', fontFamily: FONT, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  chipTxt: { fontSize: 12, fontWeight: '700', fontFamily: FONT },
  imageContainer: { marginTop: 4 },
  imagePlaceholder: { height: 140, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10 },
  placeholderTxt: { fontSize: 12, fontWeight: '700', fontFamily: FONT },
  imageWrapper: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 40 },
  
  blockCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  blockNum: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  blockNumTxt: { fontSize: 12, fontWeight: '900', fontFamily: FONT },
  blockTitle: { fontSize: 10, fontWeight: '900', fontFamily: FONT, letterSpacing: 1.5 },
  
  complaintInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addComplaintBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  complaintList: { marginTop: 10, gap: 8 },
  emptyTaskArea: { paddingVertical: 20, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center' },
  emptyTaskTxt: { fontSize: 10, fontWeight: '800', fontFamily: FONT, letterSpacing: 1.5 },
  complaintItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  complaintText: { flex: 1, fontSize: 13, fontWeight: '600', fontFamily: FONT },
  
  addBlockBtn: { paddingVertical: 20, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 },
  addBlockIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  addBlockTxt: { fontSize: 10, fontWeight: '900', fontFamily: FONT, letterSpacing: 1.5 },

  timestampBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1 },
  timestampTxt: { fontSize: 13, fontWeight: '800', fontFamily: FONT },
  timestampHint: { fontSize: 10, marginTop: 6, opacity: 0.8 },
});
