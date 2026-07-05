import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import FormScreen from '@/components/FormScreen';
import InputField from '@/components/ui/InputField';
import Toast from '@/components/ui/Toast';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import type { Repair } from '@/features/repairs/services/repair.service';
import { repairService } from '@/features/repairs/services/repair.service';
import type { BillItem, TaxSnapshotItem } from '@/features/repairs/services/bill.service';
import { billService } from '@/features/repairs/services/bill.service';
import type { Tax } from '@/features/repairs/services/tax.service';
import { taxService } from '@/features/repairs/services/tax.service';
import { vehicleService } from '@/features/repairs/services/vehicle.service';

import BillItemEditor from './components/BillItemEditor';
import ServiceBlockEditor from './components/ServiceBlockEditor';
import type { ServiceBlock } from './components/ServiceBlockEditor';
import VehicleTypePicker from './components/VehicleTypePicker';
import WorkerSelect from './components/WorkerSelect';
import { formatUTCToLocal, convertLocalToUTC } from '@/utils/date';
import DateTimePickerInput from '@/components/ui/DateTimePickerInput';
import SuccessModal from '@/components/ui/SuccessModal';
import ImagePickerSheet from '@/components/ui/ImagePickerSheet';
import PhoneInputWithCode from '@/components/ui/PhoneInputWithCode';
import type { Worker } from '@/features/repairs/services/worker.service';
import { workerService } from '@/features/repairs/services/worker.service';
import { getCurrentUser } from '@/services/auth.service';
import { getCallingCode, countriesCache } from '@/utils/preload-countries';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const PRIORITY_COLORS: Record<string, string> = {
  Low: '#38A169', Medium: '#D69E2E', High: '#DD6B20', Urgent: '#E53E3E',
};

function stripCallingCode(fullNumber: string, defaultCC: string): { cc: string; number: string } {
  if (!fullNumber) return { cc: defaultCC, number: '' };
  const trimmed = fullNumber.trim();
  if (!trimmed.startsWith('+')) return { cc: defaultCC, number: trimmed };
  if (countriesCache) {
    const entries = Object.entries(countriesCache) as any[];
    const sorted = entries
      .filter(([_, c]: any) => c.callingCode?.[0])
      .sort(([_, a]: any, [__, b]: any) => (b.callingCode[0].length) - (a.callingCode[0].length));
    for (const [_, country] of sorted) {
      const code = `+${country.callingCode[0]}`;
      if (trimmed.startsWith(code)) {
        return { cc: code, number: trimmed.slice(code.length) };
      }
    }
  }
  return { cc: defaultCC, number: trimmed };
}

interface RepairForm {
  vehicleNumber: string;
  vehicleType: string;
  brand: string;
  modelName: string;
  ownerName: string;
  phoneNumber: string;
  whatsappNumber: string;
  kmReading: string;
  workerId: string;
  repairDate: string;
  priority: string;
  expectedCompletion: string;
  status: string;
}

interface CreateRepairScreenProps {
  mode: 'create' | 'edit' | 'view';
  initialRepair?: Repair;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRepairScreen({ mode, initialRepair, onClose, onSuccess }: CreateRepairScreenProps) {
  const isEdit = mode === 'edit';
  const isView = mode === 'view';
  const isCreate = mode === 'create';

  const shopUser = getCurrentUser();
  const shopCountry = shopUser?.shopCountry || 'IN';
  // Resolve the shop's default calling code synchronously (from cache) or fall back to empty
  const shopCallingCode = shopUser?.shopCallingCode || getCallingCode(shopCountry) || '';

  const steps = useMemo<{ key: string; label: string }[]>(() => {
    return [
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'service', label: 'Service' },
      { key: 'review', label: 'Review Job' },
    ];
  }, []);

  const [activeTab, setActiveTab] = useState('vehicle');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [kbHeight, setKbHeight] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    workerService.getWorkers().then((res) => {
      if (res.success && res.data) {
        setWorkers(res.data);
      }
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const initForm = (): RepairForm => ({
    vehicleNumber: initialRepair?.vehicle_number || '',
    vehicleType: initialRepair?.vehicle_type || 'Car',
    brand: initialRepair?.brand || '',
    modelName: initialRepair?.model_name || '',
    ownerName: initialRepair?.owner_name || '',
    phoneNumber: initialRepair?.phone_number || '',
    whatsappNumber: initialRepair?.whatsapp_number || '',
    kmReading: initialRepair?.km_reading || '',
    workerId: String(initialRepair?.attending_worker_id || ''),
    repairDate: formatUTCToLocal(initialRepair?.repair_date) || formatUTCToLocal(new Date().toISOString()),
    priority: initialRepair?.priority || 'Medium',
    expectedCompletion: formatUTCToLocal(initialRepair?.expected_completion) || '',
    status: initialRepair?.status || 'Pending',
  });

  const [form, setForm] = useState<RepairForm>(initForm);
  const update = useCallback(<K extends keyof RepairForm>(key: K, val: RepairForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => { const next = { ...prev }; delete next[key as string]; return next; });
  }, []);

  const [whatsappSame, setWhatsappSame] = useState(!initialRepair?.whatsapp_number && !!initialRepair?.phone_number);
  const [vehicleImage, setVehicleImage] = useState<string | null>(initialRepair?.vehicle_image || null);
  const [imageFiles, setImageFiles] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  // Pre-initialize with shop's default calling code; will be overridden when PhoneInputWithCode mounts
  const [phoneCC, setPhoneCC] = useState(shopCallingCode);
  const [whatsappCC, setWhatsappCC] = useState(shopCallingCode);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [serviceBlocks, setServiceBlocks] = useState<ServiceBlock[]>(
    initialRepair?.complaints
      ? (typeof initialRepair.complaints === 'string' ? JSON.parse(initialRepair.complaints) : initialRepair.complaints)
      : [{ type: 'Repair', tasks: [] }],
  );

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(initialRepair?.payment_status || 'Unpaid');
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [taxSnapshot, setTaxSnapshot] = useState<TaxSnapshotItem[]>([]);

  const registryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repairIdRef = useRef<number | null>(initialRepair?.id || null);

  useEffect(() => {
    taxService.getAll().then((res) => {
      if (res.success && res.data) setTaxes(res.data.filter((t) => t.is_active));
    });
  }, []);

  // On edit, strip calling code from existing phone numbers so they don't get double-coded
  useEffect(() => {
    if (initialRepair?.phone_number) {
      const parsed = stripCallingCode(initialRepair.phone_number, shopCallingCode);
      setPhoneCC(parsed.cc);
      update('phoneNumber', parsed.number);
    }
    if (initialRepair?.whatsapp_number) {
      const parsed = stripCallingCode(initialRepair.whatsapp_number, shopCallingCode);
      setWhatsappCC(parsed.cc);
      update('whatsappNumber', parsed.number);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isEdit && initialRepair?.id && initialRepair.bill_id) {
      billService.getByRepairId(initialRepair.id).then((res) => {
        if (res.success && res.data) {
          setBillItems(res.data.items || []);
          setServiceCharge(res.data.service_charge || 0);
          setTaxSnapshot(res.data.tax_snapshot || []);
          setPaymentStatus(res.data.payment_status || 'Unpaid');
        }
      });
    }
  }, [isEdit, initialRepair?.id, initialRepair?.bill_id]);

  useEffect(() => {
    if (whatsappSame) {
      update('whatsappNumber', form.phoneNumber);
      setWhatsappCC(phoneCC);
    }
  }, [form.phoneNumber, whatsappSame, phoneCC]);

  useEffect(() => {
    vehicleService.getAll().then((res) => {
      if (res.success && res.data) setAllVehicles(res.data);
    });
  }, []);

  const handlePhoneChange = useCallback((val: string) => {
    update('phoneNumber', val);
    if (whatsappSame) {
      update('whatsappNumber', val);
      setWhatsappCC(phoneCC);
    }
  }, [whatsappSame, update, phoneCC]);

  const handleVehicleNumberChange = useCallback((val: string) => {
    update('vehicleNumber', val);
    if (registryTimer.current !== null) clearTimeout(registryTimer.current);
    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    registryTimer.current = setTimeout(() => {
      const upper = trimmed.toUpperCase().replace(/\s+/g, '');
      const matches = allVehicles
        .filter((v) =>
          v.vehicle_number.toUpperCase().replace(/\s+/g, '').includes(upper)
        )
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    }, 300);
  }, [allVehicles, update]);

  const pickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast('Camera roll permission needed', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: !isCreate,
      quality: 0.82,
    });
    if (!result.canceled && result.assets.length > 0) {
      if (isCreate) {
        setImageFiles([result.assets[0]]);
      } else {
        setImageFiles((prev) => [...prev, ...result.assets]);
      }
    }
  }, [showToast, isCreate]);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast('Camera permission needed', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.82,
    });
    if (!result.canceled && result.assets.length > 0) {
      if (isCreate) {
        setImageFiles([result.assets[0]]);
      } else {
        setImageFiles((prev) => [...prev, ...result.assets]);
      }
    }
  }, [showToast, isCreate]);

  const handlePickImages = useCallback(() => {
    setShowImagePicker(true);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const selectSuggestion = useCallback((v: any) => {
    setForm((prev) => ({
      ...prev,
      vehicleNumber: v.vehicle_number,
      ownerName: v.owner_name || prev.ownerName,
      phoneNumber: v.owner_phone || prev.phoneNumber,
      modelName: v.model_name || prev.modelName,
      vehicleType: v.vehicle_type || prev.vehicleType,
      brand: v.brand || prev.brand,
    }));
    if (v.vehicle_image) setVehicleImage(v.vehicle_image);
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const buildFormData = useCallback(async () => {
    const fd = new FormData();
    fd.append('vehicle_number', String(form.vehicleNumber || ''));
    fd.append('vehicle_type', String(form.vehicleType || 'Car'));
    fd.append('brand', String(form.brand || ''));
    fd.append('model_name', String(form.modelName || ''));
    fd.append('owner_name', String(form.ownerName || ''));
    fd.append('phone_number', `${phoneCC || ''}${form.phoneNumber || ''}`);
    fd.append('whatsapp_number', `${whatsappCC || ''}${form.whatsappNumber || ''}`);
    fd.append('km_reading', String(form.kmReading || ''));
    fd.append('complaints', JSON.stringify(serviceBlocks));
    fd.append('service_type', serviceBlocks.map((b) => b.type).join(', '));
    fd.append('repair_date', String(convertLocalToUTC(form.repairDate) || ''));
    fd.append('attending_worker_id', String(form.workerId || ''));
    fd.append('priority', String(form.priority || 'Medium'));
    if (form.expectedCompletion) {
      fd.append('expected_completion', String(convertLocalToUTC(form.expectedCompletion) || ''));
    }
    fd.append('status', String(form.status || 'Pending'));
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!file || !file.uri) continue;
      const ext = file.uri.split('.').pop() || 'jpg';
      const name = file.fileName || `vehicle_${i}.${ext}`;
      const type = file.mimeType || `image/${ext === 'png' ? 'png' : 'jpeg'}`;
      if (Platform.OS === 'web') {
        const resp = await fetch(file.uri);
        const blob = await resp.blob();
        fd.append('vehicle_image[]', blob, name);
      } else {
        fd.append('vehicle_image[]', {
          uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
          name,
          type,
        } as any);
      }
    }
    if (imageFiles.length === 0 && vehicleImage && !vehicleImage.startsWith('file')) {
      fd.append('prefilled_image', String(vehicleImage));
    }
    if (isEdit) {
      fd.append('payment_status', String(paymentStatus || 'Unpaid'));
    }
    return fd;
  }, [form, serviceBlocks, imageFiles, vehicleImage, isEdit, paymentStatus, phoneCC, whatsappCC]);


  const handleStepNext = useCallback(async () => {
    if (activeTab === 'vehicle') {
      const newErrors: Record<string, string> = {};
      if (!form.vehicleNumber.trim()) newErrors.vehicle_number = 'Vehicle number is required';
      if (!form.ownerName.trim()) newErrors.owner_name = 'Owner name is required';
      if (!form.phoneNumber.trim()) newErrors.phone_number = 'Phone number is required';
      if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
      setErrors({});
    }
    setSubmitting(true);
    try {
      const fd = await buildFormData();
      if (repairIdRef.current) {
        const res = await repairService.update(repairIdRef.current, fd);
        if (!res.success) { showToast(res.error || 'Save failed', 'error'); return; }
      } else {
        const res = await repairService.create(fd);
        if (!res.success) { showToast(res.error || 'Save failed', 'error'); return; }
        if (res.data?.id) repairIdRef.current = res.data.id;
      }
      const idx = steps.findIndex((t) => t.key === activeTab);
      if (idx < steps.length - 1) setActiveTab(steps[idx + 1].key);
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [activeTab, form, buildFormData, showToast, steps]);

  const handleStepBack = useCallback(() => {
    const idx = steps.findIndex((t) => t.key === activeTab);
    if (idx > 0) setActiveTab(steps[idx - 1].key);
  }, [activeTab, steps]);

  // Step-dot taps: always allow backward; only allow forward if this step's
  // required fields are filled.
  const handleStepBarPress = useCallback((key: string, targetIndex: number) => {
    const currentIndex = steps.findIndex((t) => t.key === activeTab);

    // Backward — always free
    if (targetIndex <= currentIndex) {
      setActiveTab(key);
      return;
    }

    // Forward — validate current tab's required fields
    if (activeTab === 'vehicle') {
      const missing: string[] = [];
      if (!form.vehicleNumber.trim()) missing.push('Vehicle Number');
      if (!form.ownerName.trim()) missing.push('Owner Name');
      if (!form.phoneNumber.trim()) missing.push('Phone Number');
      if (missing.length > 0) {
        showToast(`Fill required fields first: ${missing.join(', ')}`, 'info');
        return;
      }
    }

    if (!repairIdRef.current && activeTab !== 'vehicle') {
      showToast('Please save this step first using "Next"', 'info');
      return;
    }

    setActiveTab(key);
  }, [activeTab, form.vehicleNumber, form.ownerName, form.phoneNumber, showToast, steps]);

  const handleSubmit = useCallback(async () => {
    if (!form.vehicleNumber.trim()) {
      showToast('Vehicle number is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const fd = await buildFormData();
      const id = repairIdRef.current;
      if (id) {
        const res = await repairService.update(id, fd);
        if (!res.success) { showToast(res.error || 'Update failed', 'error'); return; }
      } else {
        const res = await repairService.create(fd);
        if (!res.success) { showToast(res.error || 'Creation failed', 'error'); return; }
      }
      setShowSuccess(true);
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, buildFormData, repairIdRef, showToast]);



  const renderPriorityChips = () => {
    if (isView) {
      return <InputField label="Priority" value={form.priority} onChangeText={() => {}} editable={false} />;
    }
    return (
      <View>
        <ThemedText style={styles.fieldLabel}>Priority</ThemedText>
        <View style={styles.chipRow}>
          {PRIORITIES.map((p) => {
            const active = form.priority === p;
            const c = PRIORITY_COLORS[p];
            return (
              <Pressable
                key={p}
                style={[styles.priChip, active && { backgroundColor: c + '18', borderColor: c }]}
                onPress={() => update('priority', p)}
              >
                <View style={[styles.priDot, { backgroundColor: active ? c : '#B0AA97' }]} />
                <ThemedText style={[styles.priText, active && { color: c, fontWeight: '700' }]}>{p}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'vehicle':
        return (
          <View style={styles.tabContent}>
            <Card title="Vehicle Information">
              <View>
                <InputField label="Vehicle Number" value={form.vehicleNumber} onChangeText={handleVehicleNumberChange}
                  placeholder="e.g. KA-01-AB-1234" icon="car-side" editable={!isView}
                  autoCapitalize="characters" required error={errors.vehicle_number} />
                {showSuggestions && !isView && (
                  <View style={styles.suggestionsList}>
                    {suggestions.map((v) => (
                      <Pressable key={v.id} style={styles.suggestionItem} onPress={() => selectSuggestion(v)}>
                        <ThemedText style={styles.suggestionTitle}>{v.vehicle_number}</ThemedText>
                        {v.owner_name && (
                          <ThemedText style={styles.suggestionSub}>{v.owner_name} · {v.model_name || '—'}</ThemedText>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              <VehicleTypePicker value={form.vehicleType} onChange={(v) => update('vehicleType', v)} />
              <View style={styles.row2}>
                <InputField label="Brand" value={form.brand} onChangeText={(v) => update('brand', v)}
                  placeholder="e.g. Toyota" icon="car-hatchback" containerStyle={{ flex: 1 }} editable={!isView} />
                <InputField label="Model" value={form.modelName} onChangeText={(v) => update('modelName', v)}
                  placeholder="e.g. Fortuner" icon="card-text" containerStyle={{ flex: 1 }} editable={!isView} />
              </View>
              <InputField label="KM Reading" value={form.kmReading} onChangeText={(v) => update('kmReading', v)}
                placeholder="e.g. 45,000" keyboardType="phone-pad" icon="counter" editable={!isView} />
            </Card>

            <Card title="Customer">
              <InputField label="Owner Name" value={form.ownerName} onChangeText={(v) => update('ownerName', v)}
                placeholder="Customer name" icon="account" editable={!isView}
                required error={errors.owner_name} />
              {!isView ? (
                <PhoneInputWithCode
                  countryCode={shopCountry}
                  label="Phone Number"
                  phone={form.phoneNumber}
                  onCountryChange={(c) => {
                    setPhoneCC(c.callingCode);
                    if (whatsappSame) setWhatsappCC(c.callingCode);
                  }}
                  onPhoneChange={handlePhoneChange}
                  error={errors.phone_number}
                />
              ) : (
                <InputField label="Phone Number" value={form.phoneNumber} onChangeText={() => {}}
                  icon="phone" editable={false} />
              )}
              {!isView ? (
                <PhoneInputWithCode
                  countryCode={shopCountry}
                  label="WhatsApp Number"
                  phone={form.whatsappNumber}
                  onCountryChange={(c) => setWhatsappCC(c.callingCode)}
                  onPhoneChange={(v) => update('whatsappNumber', v)}
                />
              ) : (
                <InputField label="WhatsApp Number" value={form.whatsappNumber} onChangeText={() => {}}
                  icon="whatsapp" editable={false} />
              )}
              {!isView && (
                <Pressable style={styles.checkboxRow} onPress={() => setWhatsappSame(!whatsappSame)}>
                  <Ionicons name={whatsappSame ? 'checkbox' : 'square-outline'} size={20} color={Colors.primary} />
                  <ThemedText style={styles.checkboxLabel}>Same as phone number</ThemedText>
                </Pressable>
              )}
            </Card>

            <Card title="Photos">
              {!isView ? (
                <View>
                  {(imageFiles.length > 0 || vehicleImage) ? (
                    <View style={styles.imageRow}>
                      {/* Pre-filled registry image */}
                      {vehicleImage && imageFiles.length === 0 && (
                        <View style={styles.imageThumbWrap}>
                          <Image source={{ uri: vehicleImage }} style={styles.imageThumb} contentFit="cover" />
                          <View style={styles.prefilledBadge}>
                            <ThemedText style={styles.prefilledBadgeText}>From Registry</ThemedText>
                          </View>
                          <Pressable style={styles.removeImgBtn} onPress={() => setVehicleImage(null)}>
                            <Ionicons name="close-circle" size={22} color="#E53E3E" />
                          </Pressable>
                        </View>
                      )}
                      {/* Locally picked files */}
                      {imageFiles.map((file, i) => (
                        <View key={i} style={styles.imageThumbWrap}>
                          <Image source={{ uri: file.uri }} style={styles.imageThumb} contentFit="cover" />
                          <Pressable style={styles.removeImgBtn} onPress={() => removeImage(i)}>
                            <Ionicons name="close-circle" size={22} color="#E53E3E" />
                          </Pressable>
                        </View>
                      ))}
                      <Pressable style={styles.addImageBtn} onPress={handlePickImages}>
                        <Ionicons name="camera-outline" size={24} color={Colors.primary} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.addImageLarge} onPress={handlePickImages}>
                      <View style={styles.addImageIconWrap}>
                        <Ionicons name="camera-outline" size={36} color={Colors.primary} />
                      </View>
                      <ThemedText style={styles.addImageLabel}>Tap to add vehicle photo</ThemedText>
                      <ThemedText style={styles.addImageHint}>JPG, PNG • Max 10MB</ThemedText>
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={styles.imageRow}>
                  {(initialRepair?.images?.length ? initialRepair.images : vehicleImage ? [vehicleImage] : []).map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.imageThumb} contentFit="cover" />
                  ))}
                </View>
              )}
            </Card>
          </View>
        );

      case 'service':
        return (
          <View style={styles.tabContent}>
            <ServiceBlockEditor blocks={serviceBlocks} onChange={setServiceBlocks} />

            <Card title="Assignment">
              <WorkerSelect value={form.workerId} onChange={(v) => update('workerId', v)} />
              <DateTimePickerInput label="Repair Date" value={form.repairDate} onChange={(v) => update('repairDate', v)}
                placeholder="Select Repair Date & Time" icon="calendar" editable={!isView} />
              <DateTimePickerInput label="Expected Completion" value={form.expectedCompletion} onChange={(v) => update('expectedCompletion', v)}
                placeholder="Select Expected Completion" icon="calendar-check" editable={!isView} />
              {renderPriorityChips()}
            </Card>

            <Card title="Status">
              {!isView ? (
                <View style={styles.chipRow}>
                  {['Pending', 'Started', 'Completed'].map((s) => {
                    const active = form.status === s;
                    return (
                      <Pressable
                        key={s}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => update('status', s)}
                      >
                        <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>{s}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <InputField label="Status" value={form.status} onChangeText={() => {}} editable={false} />
              )}
            </Card>
          </View>
        );


      case 'review':
        return (
          <View style={styles.tabContent}>
            <Card title="Vehicle Details">
              <SummaryRow label="Vehicle Number" value={form.vehicleNumber} />
              <SummaryRow label="Model / Brand" value={form.brand || form.modelName ? `${form.brand} ${form.modelName}` : '—'} />
              <SummaryRow label="Vehicle Type" value={form.vehicleType} />
              <SummaryRow label="KM Reading" value={form.kmReading} />
            </Card>

            <Card title="Customer Details">
              <SummaryRow label="Owner Name" value={form.ownerName} />
              <SummaryRow label="Phone Number" value={form.phoneNumber} />
              <SummaryRow label="WhatsApp Number" value={form.whatsappNumber} />
            </Card>

            <Card title="Service Details">
              <SummaryRow label="Priority" value={form.priority} />
              <SummaryRow label="Repair Date" value={form.repairDate} />
              <SummaryRow label="Expected Completion" value={form.expectedCompletion} />
              <SummaryRow label="Status" value={form.status} />
              <SummaryRow
                label="Assigned Worker"
                value={(() => {
                  if (!form.workerId) return 'None';
                  const w = workers.find((item) => item.id.toString() === form.workerId);
                  if (w) return w.name;
                  if (initialRepair && String(initialRepair.attending_worker_id) === form.workerId) {
                    return initialRepair.attending_worker_name || `Worker #${form.workerId}`;
                  }
                  return `Worker #${form.workerId}`;
                })()}
              />
            </Card>

            <Card title="Complaints & Service Categories">
              {serviceBlocks.map((block, bi) => (
                <View key={bi} style={{ marginBottom: bi === serviceBlocks.length - 1 ? 0 : 12, borderBottomWidth: bi === serviceBlocks.length - 1 ? 0 : 1, borderBottomColor: '#F0ECE3', paddingBottom: bi === serviceBlocks.length - 1 ? 0 : 8 }}>
                  <ThemedText style={{ fontSize: 14, fontWeight: '700', color: '#3D7A78', marginBottom: 4 }}>
                    {block.type}
                  </ThemedText>
                  {block.tasks.filter((t) => t.text.trim()).map((task, ti) => (
                    <ThemedText key={ti} style={{ fontSize: 13, color: '#4A4A4A', marginLeft: 8, marginTop: 2 }}>
                      • {task.text}
                    </ThemedText>
                  ))}
                  {block.tasks.filter((t) => t.text.trim()).length === 0 && (
                    <ThemedText style={{ fontSize: 12, color: '#8A8A80', fontStyle: 'italic', marginLeft: 8 }}>
                      No items specified
                    </ThemedText>
                  )}
                </View>
              ))}
            </Card>

            {(imageFiles.length > 0 || !!vehicleImage || !!initialRepair?.images?.length) && (
              <Card title="Photos">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {imageFiles.map((file, i) => (
                    <Image key={`new-${i}`} source={{ uri: file.uri }} style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#F0ECE3' }} contentFit="cover" />
                  ))}
                  {!imageFiles.length && initialRepair?.images && initialRepair.images.map((url, i) => (
                    <Image key={`ext-${i}`} source={{ uri: url }} style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#F0ECE3' }} contentFit="cover" />
                  ))}
                  {!imageFiles.length && !initialRepair?.images?.length && vehicleImage && (
                    <Image source={{ uri: vehicleImage }} style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#F0ECE3' }} contentFit="cover" />
                  )}
                </View>
              </Card>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <FormScreen
        title="New Repair"
        tabs={steps}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onStepBarPress={handleStepBarPress}
        onStepNext={handleStepNext}
        onStepBack={handleStepBack}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel={isView ? 'Close' : 'Save'}
        submitting={submitting}
        keyboardPadding={kbHeight > 0 ? kbHeight + 80 : 0}
        toast={<Toast visible={toast.visible} message={toast.message} type={toast.type}
          onHide={() => setToast((p) => ({ ...p, visible: false }))} />}
      >
        {renderTab()}
      </FormScreen>

      <SuccessModal
        visible={showSuccess}
        onClose={onSuccess}
        title={isCreate ? "Job Created!" : "Job Updated!"}
        subtitle={isCreate ? "Repair job card has been successfully created." : "Repair job card details have been updated."}
      />

      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onCamera={takePhoto}
        onGallery={pickFromGallery}
      />
    </>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {title && <ThemedText style={styles.cardTitle}>{title}</ThemedText>}
      {children}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0ECE3' }}>
      <ThemedText style={{ fontSize: 13, fontWeight: '600', color: '#8A8A80' }}>{label}</ThemedText>
      <ThemedText style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A' }}>{value || '—'}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: { gap: 12, paddingBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  row2: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#8A8A80', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#E8E0CC', backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#3D7A78' + '15', borderColor: '#3D7A78' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#8A8A80' },
  chipTextActive: { color: '#3D7A78', fontWeight: '700' },
  priChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#E8E0CC', backgroundColor: '#FFFFFF',
  },
  priDot: { width: 8, height: 8, borderRadius: 4 },
  priText: { fontSize: 13, fontWeight: '600', color: '#8A8A80' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkboxLabel: { fontSize: 13, fontWeight: '600', color: '#8A8A80' },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageThumb: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#F0ECE3' },
  imageThumbWrap: { position: 'relative' },
  removeImgBtn: { position: 'absolute', top: -8, right: -8 },
  prefilledBadge: {
    position: 'absolute', bottom: 4, left: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.52)', borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 2, alignItems: 'center',
  },
  prefilledBadgeText: { fontSize: 8, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  addImageBtn: {
    width: 100, height: 100, borderRadius: 12,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#3D7A78' + '40',
    backgroundColor: '#3D7A78' + '06',
    alignItems: 'center', justifyContent: 'center',
  },
  addImageLarge: {
    borderRadius: 16, borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#3D7A78' + '40', backgroundColor: '#3D7A78' + '06',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 32, gap: 8,
  },
  addImageIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#3D7A78' + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  addImageLabel: { fontSize: 15, fontWeight: '600', color: '#3D7A78' },
  addImageHint: { fontSize: 12, fontWeight: '500', color: '#B0AA97' },
  suggestionsList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0CC',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE3',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  suggestionSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8A80',
    marginTop: 2,
  },
  submitBtnLarge: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#3D7A78',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#3D7A78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
