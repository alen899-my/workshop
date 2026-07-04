import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
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

const TABS = [
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'service', label: 'Service' },
  { key: 'billing', label: 'Billing' },
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const PRIORITY_COLORS: Record<string, string> = {
  Low: '#38A169', Medium: '#D69E2E', High: '#DD6B20', Urgent: '#E53E3E',
};

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

  const [activeTab, setActiveTab] = useState('vehicle');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
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
    repairDate: initialRepair?.repair_date || new Date().toISOString().split('T')[0],
    priority: initialRepair?.priority || 'Medium',
    expectedCompletion: initialRepair?.expected_completion?.split('T')[0] || '',
    status: initialRepair?.status || 'Pending',
  });

  const [form, setForm] = useState<RepairForm>(initForm);
  const update = useCallback(<K extends keyof RepairForm>(key: K, val: RepairForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const [whatsappSame, setWhatsappSame] = useState(!initialRepair?.whatsapp_number && !!initialRepair?.phone_number);
  const [vehicleImage, setVehicleImage] = useState<string | null>(initialRepair?.vehicle_image || null);
  const [imageFiles, setImageFiles] = useState<ImagePicker.ImagePickerAsset[]>([]);
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
    if (whatsappSame) update('whatsappNumber', form.phoneNumber);
  }, [form.phoneNumber, whatsappSame]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    vehicleService.getAll().then((res) => {
      if (res.success && res.data) setAllVehicles(res.data);
    });
  }, []);

  const handlePhoneChange = useCallback((val: string) => {
    update('phoneNumber', val);
    if (whatsappSame) update('whatsappNumber', val);
  }, [whatsappSame, update]);

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

  const handlePickImages = useCallback(async () => {
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

  const isCreate = mode === 'create';

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

  const buildFormData = useCallback(() => {
    const fd = new FormData();
    fd.append('vehicle_number', form.vehicleNumber);
    fd.append('vehicle_type', form.vehicleType);
    fd.append('brand', form.brand);
    fd.append('model_name', form.modelName);
    fd.append('owner_name', form.ownerName);
    fd.append('phone_number', form.phoneNumber);
    fd.append('whatsapp_number', form.whatsappNumber);
    fd.append('km_reading', form.kmReading);
    fd.append('complaints', JSON.stringify(serviceBlocks));
    fd.append('service_type', serviceBlocks.map((b) => b.type).join(', '));
    fd.append('repair_date', form.repairDate);
    fd.append('attending_worker_id', form.workerId);
    fd.append('priority', form.priority);
    fd.append('expected_completion', form.expectedCompletion);
    fd.append('status', form.status);
    imageFiles.forEach((file, i) => {
      fd.append('vehicle_image[]', {
        uri: file.uri,
        type: file.mimeType || 'image/jpeg',
        name: file.fileName || `vehicle_${i}.jpg`,
      } as any);
    });
    if (imageFiles.length === 0 && vehicleImage && !vehicleImage.startsWith('file')) {
      fd.append('prefilled_image', vehicleImage);
    }
    if (isEdit) {
      fd.append('payment_status', paymentStatus);
    }
    return fd;
  }, [form, serviceBlocks, imageFiles, vehicleImage, isEdit, paymentStatus]);

  const saveBill = useCallback(async (repairId: number) => {
    if (billItems.length === 0 && serviceCharge === 0 && taxSnapshot.length === 0) return;
    await billService.saveBill(repairId, {
      items: billItems,
      service_charge: serviceCharge,
      tax_snapshot: taxSnapshot,
      tax_total: taxSnapshot.reduce((s, t) => s + t.amount, 0),
      payment_status: paymentStatus,
    });
  }, [billItems, serviceCharge, taxSnapshot, paymentStatus]);

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
      const fd = buildFormData();
      if (repairIdRef.current) {
        const res = await repairService.update(repairIdRef.current, fd);
        if (!res.success) { showToast(res.error || 'Save failed', 'error'); return; }
      } else {
        const res = await repairService.create(fd);
        if (!res.success) { showToast(res.error || 'Save failed', 'error'); return; }
        if (res.data?.id) repairIdRef.current = res.data.id;
      }
      const idx = TABS.findIndex((t) => t.key === activeTab);
      if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].key);
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [activeTab, form, buildFormData, showToast]);

  const handleStepBack = useCallback(() => {
    const idx = TABS.findIndex((t) => t.key === activeTab);
    if (idx > 0) setActiveTab(TABS[idx - 1].key);
  }, [activeTab]);

  const handleSubmit = useCallback(async () => {
    if (!form.vehicleNumber.trim()) {
      showToast('Vehicle number is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const fd = buildFormData();
      const id = repairIdRef.current;
      if (id) {
        const res = await repairService.update(id, fd);
        if (!res.success) { showToast(res.error || 'Update failed', 'error'); return; }
        await saveBill(id);
      } else {
        const res = await repairService.create(fd);
        if (!res.success) { showToast(res.error || 'Creation failed', 'error'); return; }
        if (res.data?.id) await saveBill(res.data.id);
      }
      showToast('Repair saved', 'success');
      setTimeout(onSuccess, 1000);
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, buildFormData, repairIdRef, saveBill, showToast, onSuccess]);

  const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <View style={styles.card}>
      {title && <ThemedText style={styles.cardTitle}>{title}</ThemedText>}
      {children}
    </View>
  );

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
              <InputField label="Phone Number" value={form.phoneNumber} onChangeText={handlePhoneChange}
                placeholder="Contact number" keyboardType="phone-pad" icon="phone" editable={!isView}
                required error={errors.phone_number} />
              <InputField label="WhatsApp Number" value={form.whatsappNumber} onChangeText={(v) => update('whatsappNumber', v)}
                placeholder="WhatsApp number" keyboardType="phone-pad" icon="whatsapp" editable={!isView} />
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
                  {imageFiles.length > 0 ? (
                    <View style={styles.imageRow}>
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
            <Card title="Service Details">
              <ServiceBlockEditor blocks={serviceBlocks} onChange={setServiceBlocks} />
            </Card>

            <Card title="Assignment">
              <WorkerSelect value={form.workerId} onChange={(v) => update('workerId', v)} />
              <View style={styles.row2}>
                <InputField label="Repair Date" value={form.repairDate} onChangeText={(v) => update('repairDate', v)}
                  placeholder="YYYY-MM-DD" icon="calendar" containerStyle={{ flex: 1 }} editable={!isView} />
                <InputField label="Expected Completion" value={form.expectedCompletion} onChangeText={(v) => update('expectedCompletion', v)}
                  placeholder="YYYY-MM-DD" icon="calendar-check" containerStyle={{ flex: 1 }} editable={!isView} />
              </View>
              {renderPriorityChips()}
            </Card>

            <Card title="Status">
              {!isView ? (
                <View style={styles.chipRow}>
                  {['Pending', 'Started', 'In Progress', 'Completed'].map((s) => {
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

      case 'billing':
        return (
          <BillItemEditor
            items={billItems} onChange={setBillItems}
            serviceCharge={serviceCharge} onServiceChargeChange={setServiceCharge}
            paymentStatus={paymentStatus} onPaymentStatusChange={setPaymentStatus}
            taxes={taxes} taxSnapshot={taxSnapshot} onTaxChange={setTaxSnapshot}
          />
        );

      default:
        return null;
    }
  };

  return (
    <FormScreen
      title="New Repair"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
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
});
