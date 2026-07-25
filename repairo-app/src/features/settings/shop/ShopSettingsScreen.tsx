import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Switch, TextInput, View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CountryPicker from 'react-native-country-picker-modal';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ImagePickerSheet from '@/components/ui/ImagePickerSheet';
import InputField from '@/components/ui/InputField';
import PhoneInputWithCode from '@/components/ui/PhoneInputWithCode';
import ModalSheet from '@/components/ui/ModalSheet';
import Toast from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';
import { getCallingCode } from '@/utils/preload-countries';
import { getCurrentUser, updateCurrentUser } from '@/services/auth.service';
import { shopService } from '@/services/shop.service';
import type { Shop } from '@/types';
import { State as StateLib, City } from 'country-state-city';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const PREDEFINED_SERVICES = [
  'General Servicing', 'Oil Change', 'Brake Repair',
  'Clutch Repair', 'Suspension Work', 'Engine Diagnostics',
  'Engine Overhaul', 'Engine Tuning', 'Tire Replacement & Balancing',
  'Wheel Alignment', 'AC Service & Repair', 'Heater Repair',
  'Battery & Electrical', 'Denting & Painting', 'Car Wash & Detailing',
  'Transmission Repair', 'Timing Belt Replacement', 'Coolant Flush',
  'Radiator Repair', 'Fuel System Cleaning', 'Injector Service',
  'Exhaust System Repair', 'Muffler Replacement', 'Welding Works',
  'Towing Service', 'Roadside Assistance', 'Diagnostic Scanning',
  'ECU Remapping', 'Turbo Repair', 'Head Gasket Replacement',
  'Water Pump Replacement', 'Alternator Repair', 'Starter Motor Repair',
  'Driveshaft Repair', 'Differential Service', '4x4 Service',
  'Undersealing / Rust Proofing', 'Glass Replacement',
  'Interior Detailing', 'Headlight Restoration',
  'Paint Protection Film', 'Ceramic Coating',
];

const MAIN_VEHICLES = ['Car', 'Motorbike', 'Scooter', 'Van', 'Truck'];
const VEHICLE_CONFIG: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'Car', label: 'Car', icon: 'car-outline' },
  { id: 'Hatchback', label: 'Hatchback', icon: 'car-outline' },
  { id: 'SUV', label: 'SUV / 4x4', icon: 'car-outline' },
  { id: 'Pickup', label: 'Pickup Truck', icon: 'car-outline' },
  { id: 'Taxi', label: 'Taxi / Cab', icon: 'car-outline' },
  { id: 'Motorbike', label: 'Motorbike', icon: 'bicycle-outline' },
  { id: 'Scooter', label: 'Scooter', icon: 'bicycle-outline' },
  { id: 'Moped', label: 'Moped', icon: 'bicycle-outline' },
  { id: 'Bicycle', label: 'Bicycle', icon: 'bicycle-outline' },
  { id: 'EBike', label: 'E-Bike', icon: 'bicycle-outline' },
  { id: 'KickScooter', label: 'Kick Scooter', icon: 'bicycle-outline' },
  { id: 'Auto', label: 'Auto Rickshaw', icon: 'car-sport-outline' },
  { id: 'Van', label: 'Van', icon: 'car-outline' },
  { id: 'Bus', label: 'Bus', icon: 'bus-outline' },
  { id: 'Truck', label: 'Truck / Lorry', icon: 'car-outline' },
  { id: 'Ambulance', label: 'Ambulance', icon: 'medical-outline' },
  { id: 'FireTruck', label: 'Fire Truck', icon: 'flame-outline' },
  { id: 'PoliceCar', label: 'Police Car', icon: 'shield-outline' },
  { id: 'Tractor', label: 'Tractor', icon: 'construct-outline' },
  { id: 'Forklift', label: 'Forklift', icon: 'construct-outline' },
  { id: 'Bulldozer', label: 'Bulldozer', icon: 'construct-outline' },
  { id: 'Other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const POPULATION_OPTIONS = [
  { label: 'Less than 1,000', value: 'less_than_1000' },
  { label: '1,000 – 5,000', value: '1000_5000' },
  { label: '5,000 – 25,000', value: '5000_25000' },
  { label: '25,000 – 100,000', value: '25000_100000' },
  { label: '100,000 – 500,000', value: '100000_500000' },
  { label: '500,000+', value: '500000_plus' },
];

function to12h(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getDefaultOperatingHours(): Record<string, { open: string; close: string; closed: boolean }> {
  const defaults: Record<string, { open: string; close: string; closed: boolean }> = {};
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  for (const day of weekdays) {
    defaults[day] = { open: '09:00', close: '18:00', closed: false };
  }
  defaults['saturday'] = { open: '09:00', close: '14:00', closed: false };
  defaults['sunday'] = { open: '09:00', close: '18:00', closed: true };
  return defaults;
}

interface ShopSettingsScreenProps {
  onClose: () => void;
}

export default function ShopSettingsScreen({ onClose }: ShopSettingsScreenProps) {
  const { top, bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const user = getCurrentUser();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Shop>>({});
  const [imageFile, setImageFile] = useState<{ uri: string; mimeType?: string; fileName?: string | null } | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [timePicker, setTimePicker] = useState<{ day: string; field: 'open' | 'close' } | null>(null);
  const [pendingTime, setPendingTime] = useState<Date | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  // Service picker
  const [servicePickerVisible, setServicePickerVisible] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  // Vehicle type picker
  const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');

  // State / City pickers
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  // Population picker
  const [populationPickerVisible, setPopulationPickerVisible] = useState(false);

  const updateStateCode = useCallback((countryCode: string, stateName: string) => {
    if (!countryCode || !stateName) { setSelectedStateCode(''); return; }
    const states = StateLib.getStatesOfCountry(countryCode);
    const found = states?.find((s) => s.name.toLowerCase() === stateName.toLowerCase());
    setSelectedStateCode(found?.isoCode || '');
  }, []);

  const statesList = useMemo(() => {
    if (!form.country) return [];
    return StateLib.getStatesOfCountry(form.country) || [];
  }, [form.country]);

  const citiesList = useMemo(() => {
    if (!form.country || !selectedStateCode) return [];
    return City.getCitiesOfState(form.country, selectedStateCode) || [];
  }, [form.country, selectedStateCode]);

  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return statesList;
    const q = stateSearch.toLowerCase();
    return statesList.filter((s) => s.name.toLowerCase().includes(q));
  }, [stateSearch, statesList]);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return citiesList;
    const q = citySearch.toLowerCase();
    return citiesList.filter((c) => c.name.toLowerCase().includes(q));
  }, [citySearch, citiesList]);

  useEffect(() => {
    (async () => {
      const shopId = user?.shopId;
      if (!shopId) { setLoading(false); return; }
      try {
        const res = await shopService.getById(shopId);
        if (res.success && res.data) {
          const data = { ...res.data };
          for (const key of ['operating_hours', 'services_offered', 'vehicle_types'] as const) {
            if (typeof data[key] === 'string') {
              try { data[key] = JSON.parse(data[key] as string); } catch {}
            }
          }
          setShop(data);
          setForm(data);
          if (data.country) updateStateCode(data.country, data.state || '');
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [user?.shopId]);

  const pickFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setImageFile(result.assets[0]);
  }, []);

  const pickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Required', 'Gallery access is needed.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setImageFile(result.assets[0]);
  }, []);

  const handleSave = useCallback(async () => {
    const shopId = user?.shopId;
    if (!shopId) { setSaving(false); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      payload.name = form.name || '';
      payload.owner_name = form.owner_name || '';
      payload.phone = form.phone || '';
      payload.country = form.country || '';
      payload.city = form.city || '';
      payload.state = form.state || '';
      payload.address = form.address || '';
      payload.population = form.population || '';
      payload.is_public = !!form.is_public;
      payload.operating_hours = form.operating_hours && Object.keys(form.operating_hours).length > 0
        ? JSON.stringify(form.operating_hours) : JSON.stringify(getDefaultOperatingHours());
      payload.services_offered = form.services_offered
        ? JSON.stringify(form.services_offered) : '[]';
      payload.vehicle_types = form.vehicle_types
        ? JSON.stringify(form.vehicle_types) : '[]';

      if (imageFile && imageFile.uri !== shop?.shop_image) {
        const base64 = await FileSystem.readAsStringAsync(imageFile.uri, { encoding: FileSystem.EncodingType.Base64 });
        const ext = imageFile.uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        payload.shop_image = `data:${mimeType};base64,${base64}`;
      }

      const res = await shopService.update(shopId, payload);
      if (res.success) {
        const updates: Record<string, string | undefined> = {};
        if (res.data?.name && res.data.name !== user?.shopName) updates.shopName = res.data.name;
        if (res.data?.country && res.data.country !== user?.shopCountry) updates.shopCountry = res.data.country;
        if (Object.keys(updates).length > 0) await updateCurrentUser(updates as any);
        const fetchRes = await shopService.getById(shopId);
        if (fetchRes.success && fetchRes.data) {
          const saved = { ...fetchRes.data };
          if (!saved.shop_image && payload.shop_image) saved.shop_image = String(payload.shop_image);
          for (const key of ['operating_hours', 'services_offered', 'vehicle_types'] as const) {
            if (typeof saved[key] === 'string') {
              try { (saved as any)[key] = JSON.parse(saved[key] as string); } catch {}
            }
          }
          setShop(saved);
          setForm(saved);
        } else if (res.data) {
          const saved = { ...shop, ...res.data };
          if (!saved.shop_image && payload.shop_image) saved.shop_image = String(payload.shop_image);
          for (const key of ['operating_hours', 'services_offered', 'vehicle_types'] as const) {
            if (typeof saved[key] === 'string') {
              try { (saved as any)[key] = JSON.parse(saved[key] as string); } catch {}
            }
          }
          setShop(saved);
          setForm(saved);
        }
        setToast({ visible: true, message: 'Shop details updated successfully', type: 'success' });
        setEditing(false);
      } else {
        setToast({ visible: true, message: res.error || 'Failed to save shop details', type: 'error' });
      }
    } catch (e) {
      setToast({ visible: true, message: e instanceof Error ? e.message : 'Something went wrong', type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [form, imageFile, shop, user]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setForm(shop || {});
    setImageFile(null);
    if (shop?.country && shop?.state) updateStateCode(shop.country, shop.state);
    else setSelectedStateCode('');
  }, [shop, updateStateCode]);

  const updateForm = useCallback(<K extends keyof Shop>(key: K, value: Shop[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const shopCountry = form.country || user?.shopCountry || 'IN';
  const shopCallingCode = getCallingCode(shopCountry) || user?.shopCallingCode || '';

  const handlePhoneChange = useCallback((phone: string) => {
    updateForm('phone', phone);
  }, [updateForm]);

  const handleCountryChange = useCallback((c: { cca2: string; callingCode: string; currency: string }) => {
    const oldCode = getCallingCode(form.country || user?.shopCountry || 'IN') || '';
    const newCode = c.callingCode || '';
    const rawPhone = form.phone || '';
    const cleanPhone = rawPhone.startsWith(oldCode) ? rawPhone.slice(oldCode.length).trimStart() : rawPhone;
    updateForm('country', c.cca2);
    updateForm('phone', newCode + cleanPhone);
    updateForm('state', '');
    updateForm('city', '');
    setSelectedStateCode('');
  }, [form.country, form.phone, user?.shopCountry, updateForm]);

  // Time picker
  const openTimePicker = useCallback((day: string, field: 'open' | 'close') => {
    const hours = (form.operating_hours || {}) as Record<string, { open: string; close: string; closed: boolean }>;
    const h = hours[day] || { open: '09:00', close: '18:00', closed: false };
    const t = field === 'open' ? h.open : h.close;
    const [hrs, mins] = t.split(':').map(Number);
    const d = new Date();
    d.setHours(hrs || 9, mins || 0, 0, 0);
    setPendingTime(d);
    setTimePicker({ day, field });
  }, [form.operating_hours]);

  const handleTimeValueChange = useCallback((_event: any, selectedDate?: Date) => {
    if (selectedDate) setPendingTime(selectedDate);
  }, []);

  const handleTimeDone = useCallback(() => {
    if (!timePicker || !pendingTime) { setTimePicker(null); return; }
    const timeStr = `${String(pendingTime.getHours()).padStart(2, '0')}:${String(pendingTime.getMinutes()).padStart(2, '0')}`;
    const hours = { ...form.operating_hours } as Record<string, { open: string; close: string; closed: boolean }>;
    const day = hours[timePicker.day] || { open: '09:00', close: '18:00', closed: false };
    hours[timePicker.day] = { ...day, [timePicker.field]: timeStr };
    updateForm('operating_hours', hours);
    setTimePicker(null);
    setPendingTime(null);
  }, [timePicker, pendingTime, form.operating_hours, updateForm]);

  const handleTimeDismiss = useCallback(() => {
    setTimePicker(null);
    setPendingTime(null);
  }, []);

  // Service helpers
  const toggleService = useCallback((service: string) => {
    const current = form.services_offered || [];
    if (current.includes(service)) {
      updateForm('services_offered', current.filter((s) => s !== service));
    } else {
      updateForm('services_offered', [...current, service]);
    }
  }, [form.services_offered, updateForm]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return PREDEFINED_SERVICES;
    const q = serviceSearch.toLowerCase();
    return PREDEFINED_SERVICES.filter((s) => s.toLowerCase().includes(q));
  }, [serviceSearch]);

  // Vehicle helpers
  const toggleVehicle = useCallback((id: string) => {
    const current = form.vehicle_types || [];
    if (current.includes(id)) {
      updateForm('vehicle_types', current.filter((v) => v !== id));
    } else {
      updateForm('vehicle_types', [...current, id]);
    }
  }, [form.vehicle_types, updateForm]);

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return VEHICLE_CONFIG;
    const q = vehicleSearch.toLowerCase();
    return VEHICLE_CONFIG.filter((v) => v.label.toLowerCase().includes(q));
  }, [vehicleSearch]);

  // Loading state
  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: top + 60, alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  // ── VIEW MODE ──
  if (!editing) {
    const display = shop || form;
    const hours = display.operating_hours || {};
    return (
      <ThemedView style={styles.container}>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
        <View style={[styles.header, { paddingTop: top + 4 }]}>
          <Pressable style={styles.headerBack} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Shop Details</ThemedText>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: bottom + 100 }} showsVerticalScrollIndicator={false}>
          {/* Banner Image */}
          {display.shop_image ? (
            <Image source={{ uri: display.shop_image }} style={[styles.bannerImage]} contentFit="cover" />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: theme.primary + '12' }]}>
              <Ionicons name="business" size={48} color={theme.primary} />
            </View>
          )}

          <View style={styles.viewContent}>
            {/* Shop Name & Visibility */}
            <View style={{ alignItems: 'center', paddingVertical: 8, gap: 8 }}>
              <ThemedText style={{ fontSize: 22, fontWeight: '800' }}>{display.name || 'Unnamed Shop'}</ThemedText>
              {display.is_public !== undefined && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
                  backgroundColor: display.is_public ? theme.success + '15' : theme.border,
                }}>
                  <Ionicons name={display.is_public ? 'globe-outline' : 'lock-closed-outline'} size={14} color={display.is_public ? theme.success : theme.textSecondary} />
                  <ThemedText style={{ fontSize: 11, fontWeight: '700', color: display.is_public ? theme.success : theme.textSecondary, textTransform: 'uppercase' }}>
                    {display.is_public ? 'Public' : 'Private'}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText style={styles.sectionLabel}>OWNER</ThemedText>
              <View style={styles.infoRow}><Ionicons name="person-outline" size={16} color={theme.textSecondary} /><ThemedText style={styles.infoValue}>{display.owner_name || '—'}</ThemedText></View>
              {display.phone && <View style={styles.infoRow}><Ionicons name="call-outline" size={16} color={theme.textSecondary} /><ThemedText style={styles.infoValue}>{display.phone}</ThemedText></View>}
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText style={styles.sectionLabel}>ADDRESS</ThemedText>
              {display.city ? <View style={styles.infoRow}><Ionicons name="location-outline" size={16} color={theme.textSecondary} /><ThemedText style={styles.infoValue}>{display.city}{display.state ? `, ${display.state}` : ''}</ThemedText></View> : null}
              {display.country ? <View style={styles.infoRow}><Ionicons name="flag-outline" size={16} color={theme.textSecondary} /><ThemedText style={styles.infoValue}>{display.country}</ThemedText></View> : null}
              {display.population ? <View style={styles.infoRow}><Ionicons name="people-outline" size={16} color={theme.textSecondary} /><ThemedText style={styles.infoValue}>{POPULATION_OPTIONS.find((o) => o.value === display.population)?.label || display.population}</ThemedText></View> : null}
              {display.address ? <ThemedText style={[styles.infoValue, { marginTop: 4, fontStyle: 'italic' }]}>{display.address}</ThemedText> : null}
              {!display.city && !display.country ? <ThemedText style={[styles.infoValue, { fontStyle: 'italic', color: theme.textSecondary }]}>No address set</ThemedText> : null}
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText style={styles.sectionLabel}>OPERATING HOURS</ThemedText>
              {DAYS.map((day) => {
                const h = hours[day];
                return (
                  <View key={day} style={styles.hourRow}>
                    <ThemedText style={{ fontSize: 14, fontWeight: '600', width: 100 }}>{DAY_LABELS[day].slice(0, 3)}</ThemedText>
                    {h?.closed ? (
                      <ThemedText style={{ fontSize: 13, fontWeight: '500', color: theme.destructive, fontStyle: 'italic' }}>Closed</ThemedText>
                    ) : h ? (
                      <ThemedText style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>{to12h(h.open)} – {to12h(h.close)}</ThemedText>
                    ) : (
                      <ThemedText style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, fontStyle: 'italic' }}>Not set</ThemedText>
                    )}
                  </View>
                );
              })}
            </View>

            {display.services_offered && display.services_offered.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionLabel}>SERVICES OFFERED</ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {display.services_offered.map((s) => (
                    <View key={s} style={[styles.tag, { backgroundColor: theme.primary + '12' }]}>
                      <ThemedText style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>{s}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {display.vehicle_types && display.vehicle_types.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionLabel}>VEHICLE TYPES</ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {display.vehicle_types.map((v) => {
                    const vc = VEHICLE_CONFIG.find((x) => x.id === v);
                    return (
                      <View key={v} style={[styles.tag, { backgroundColor: theme.primary + '12' }]}>
                        <Ionicons name={vc?.icon || 'car-outline'} size={14} color={theme.primary} />
                        <ThemedText style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>{vc?.label || v}</ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.editBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }]}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <ThemedText style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Edit Shop Details</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // ── EDIT MODE ──
  const hours = form.operating_hours || {};
  const selectedServices = form.services_offered || [];
  const selectedVehicles = form.vehicle_types || [];

  return (
    <ThemedView style={styles.container}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
      <View style={[styles.header, { paddingTop: top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Edit Shop</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottom + 220, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Image */}
        <View style={[styles.editBannerWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {imageFile || form.shop_image ? (
            <Image
              source={imageFile ? { uri: imageFile.uri } : { uri: form.shop_image as string }}
              style={[styles.editBannerImage]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.editBannerPlaceholder]}>
              <Ionicons name="business" size={40} color={theme.textSecondary} />
              <ThemedText style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginTop: 4 }}>No shop photo</ThemedText>
            </View>
          )}
          <Pressable
            style={[styles.editBannerOverlay]}
            onPress={() => setShowImagePicker(true)}
          >
            <View style={[styles.editBannerBtn, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
            <ThemedText style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>Change Photo</ThemedText>
          </Pressable>
        </View>

        <View style={[styles.switchRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 15, fontWeight: '600' }}>Public Shop</ThemedText>
            <ThemedText style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary }}>Visible on the shop locator map</ThemedText>
          </View>
          <Switch
            value={!!form.is_public}
            onValueChange={(v) => updateForm('is_public', v)}
            trackColor={{ false: theme.border, true: theme.primary + '60' }}
            thumbColor={form.is_public ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, gap: 16 }]}>
          <InputField label="Shop Name" value={form.name || ''} onChangeText={(v) => updateForm('name', v)} />
          <InputField label="Owner Name" value={form.owner_name || ''} onChangeText={(v) => updateForm('owner_name', v)} />
          <PhoneInputWithCode
            countryCode={shopCountry}
            callingCode={shopCallingCode}
            phone={form.phone || ''}
            onPhoneChange={handlePhoneChange}
            onCountryChange={handleCountryChange}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, gap: 16 }]}>
          <View style={{ gap: 6 }}>
            <ThemedText style={{ fontSize: 12, fontWeight: '600', marginLeft: 2 }}>Country</ThemedText>
            <View style={[styles.selectBtn, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <CountryPicker
                countryCode={(form.country || 'IN') as any}
                withFilter
                withFlag
                withCountryNameButton={false}
                withCallingCode={false}
                withEmoji
                withAlphaFilter
                onSelect={(country) => {
                  updateForm('country', country.cca2);
                  updateForm('state', '');
                  updateForm('city', '');
                  setSelectedStateCode('');
                }}
              />
              <ThemedText style={{ flex: 1, fontSize: 15, fontWeight: '500' }}>{form.country || 'Select Country'}</ThemedText>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </View>
          </View>
          {/* State Picker */}
          <View style={{ gap: 6 }}>
            <ThemedText style={{ fontSize: 12, fontWeight: '600', marginLeft: 2 }}>State</ThemedText>
            <Pressable
              style={({ pressed }) => [styles.selectBtn, { borderColor: theme.border, backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}
              onPress={() => { if (form.country) setStatePickerVisible(true); }}
            >
              <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
              <ThemedText style={{ flex: 1, fontSize: 15, fontWeight: '500', color: form.state ? theme.text : theme.tabIconDefault }}>
                {form.state || (form.country ? 'Select State' : 'Select a country first')}
              </ThemedText>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* City Picker */}
          <View style={{ gap: 6 }}>
            <ThemedText style={{ fontSize: 12, fontWeight: '600', marginLeft: 2 }}>City</ThemedText>
            <Pressable
              style={({ pressed }) => [styles.selectBtn, { borderColor: theme.border, backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}
              onPress={() => { if (form.country && selectedStateCode) setCityPickerVisible(true); }}
            >
              <Ionicons name="business-outline" size={18} color={theme.textSecondary} />
              <ThemedText style={{ flex: 1, fontSize: 15, fontWeight: '500', color: form.city ? theme.text : theme.tabIconDefault }}>
                {form.city || (selectedStateCode ? 'Select City' : 'Select a state first')}
              </ThemedText>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Population Picker */}
          <View style={{ gap: 6 }}>
            <ThemedText style={{ fontSize: 12, fontWeight: '600', marginLeft: 2 }}>Area Population</ThemedText>
            <Pressable
              style={({ pressed }) => [styles.selectBtn, { borderColor: theme.border, backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}
              onPress={() => setPopulationPickerVisible(true)}
            >
              <Ionicons name="people-outline" size={18} color={theme.textSecondary} />
              <ThemedText style={{ flex: 1, fontSize: 15, fontWeight: '500', color: form.population ? theme.text : theme.tabIconDefault }}>
                {POPULATION_OPTIONS.find((o) => o.value === form.population)?.label || 'Select Population'}
              </ThemedText>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          <InputField label="Address" value={form.address || ''} onChangeText={(v) => updateForm('address', v)} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionLabel}>OPERATING HOURS</ThemedText>
          {DAYS.map((day) => {
            const h = hours[day] || { open: '09:00', close: '18:00', closed: false };
            return (
              <View key={day} style={styles.editHourRow}>
                <View style={{ width: 80 }}>
                  <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>{DAY_LABELS[day].slice(0, 3)}</ThemedText>
                </View>
                {h.closed ? (
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <ThemedText style={{ fontSize: 13, fontWeight: '600', color: theme.destructive, fontStyle: 'italic' }}>Closed</ThemedText>
                  </View>
                ) : (
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <Pressable
                      style={({ pressed }) => [styles.timeSlot, { borderColor: theme.border, backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}
                      onPress={() => openTimePicker(day, 'open')}
                    >
                      <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>{to12h(h.open)}</ThemedText>
                    </Pressable>
                    <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>to</ThemedText>
                    <Pressable
                      style={({ pressed }) => [styles.timeSlot, { borderColor: theme.border, backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}
                      onPress={() => openTimePicker(day, 'close')}
                    >
                      <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>{to12h(h.close)}</ThemedText>
                    </Pressable>
                  </View>
                )}
                <Pressable
                  onPress={() => {
                    const newHours = { ...hours };
                    newHours[day] = { ...h, closed: !h.closed };
                    updateForm('operating_hours', newHours);
                  }}
                  hitSlop={8}
                >
                  <ThemedText style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: h.closed ? theme.primary : theme.destructive, marginLeft: 8 }}>
                    {h.closed ? 'Open' : 'Close'}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Services Offered */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionLabel}>SERVICES OFFERED</ThemedText>
          {selectedServices.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {selectedServices.map((s) => (
                <View key={s} style={[styles.tag, { backgroundColor: theme.primary + '12' }]}>
                  <ThemedText style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>{s}</ThemedText>
                  <Pressable onPress={() => toggleService(s)} hitSlop={8}>
                    <Ionicons name="close-circle" size={14} color={theme.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.addBtn, { borderColor: theme.primary + '40' }, pressed && { opacity: 0.7 }]}
            onPress={() => setServicePickerVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
            <ThemedText style={{ fontSize: 14, fontWeight: '600', color: theme.primary }}>
              {selectedServices.length === 0 ? 'Add Services' : 'Add More Services'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Vehicle Types */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionLabel}>VEHICLE TYPES</ThemedText>
          {/* Main vehicles grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MAIN_VEHICLES.map((id) => {
              const v = VEHICLE_CONFIG.find((x) => x.id === id)!;
              const active = selectedVehicles.includes(id);
              return (
                <Pressable
                  key={id}
                  style={({ pressed }) => [
                    styles.vehicleCard,
                    { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary + '08' : theme.card },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => toggleVehicle(id)}
                >
                  <View style={[styles.vehicleIconWrap, { backgroundColor: active ? theme.primary : theme.divider }]}>
                    <Ionicons name={v.icon} size={20} color={active ? theme.primaryForeground : theme.textSecondary} />
                  </View>
                  <ThemedText style={{ fontSize: 11, fontWeight: active ? '700' : '500', color: active ? theme.primary : theme.textSecondary, textAlign: 'center' }}>
                    {v.label}
                  </ThemedText>
                </Pressable>
              );
            })}
            <Pressable
              style={({ pressed }) => [styles.vehicleCard, { borderColor: theme.primary + '30', backgroundColor: theme.primary + '04' }, pressed && { opacity: 0.7 }]}
              onPress={() => setVehiclePickerVisible(true)}
            >
              <View style={[styles.vehicleIconWrap, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="apps-outline" size={20} color={theme.primary} />
              </View>
              <ThemedText style={{ fontSize: 11, fontWeight: '700', color: theme.primary, textAlign: 'center' }}>View All</ThemedText>
            </Pressable>
          </View>
          {/* Non-main selected vehicles */}
          {selectedVehicles.filter((v) => !MAIN_VEHICLES.includes(v)).length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {selectedVehicles.filter((v) => !MAIN_VEHICLES.includes(v)).map((id) => {
                const v = VEHICLE_CONFIG.find((x) => x.id === id);
                return (
                  <View key={id} style={[styles.tag, { backgroundColor: theme.primary + '12' }]}>
                    <Ionicons name={v?.icon || 'car-outline'} size={14} color={theme.primary} />
                    <ThemedText style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>{v?.label || id}</ThemedText>
                    <Pressable onPress={() => toggleVehicle(id)} hitSlop={8}>
                      <Ionicons name="close-circle" size={14} color={theme.primary} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(bottom, 16), backgroundColor: theme.background }]}>
        <Pressable
          style={({ pressed }) => [styles.cancelFooterBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
          onPress={handleCancel}
          disabled={saving}
        >
          <ThemedText style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Cancel</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.saveFooterBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <ThemedText style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Save</ThemedText>
            </View>
          )}
        </Pressable>
      </View>

      {/* Services Picker Modal */}
      <ModalSheet visible={servicePickerVisible} title="Select Services" onClose={() => { setServicePickerVisible(false); setServiceSearch(''); }}>
        <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search services..."
            placeholderTextColor={theme.tabIconDefault}
            value={serviceSearch}
            onChangeText={setServiceSearch}
            autoCapitalize="none"
          />
          {serviceSearch ? (
            <Pressable onPress={() => setServiceSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
          {filteredServices.map((service) => {
            const active = selectedServices.includes(service);
            return (
              <Pressable
                key={service}
                style={[styles.pickerRow, active && { backgroundColor: theme.backgroundSelected }]}
                onPress={() => toggleService(service)}
              >
                <View style={[styles.checkbox, { borderColor: active ? theme.primary : theme.border }, active && { backgroundColor: theme.primary }]}>
                  {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <ThemedText style={{ flex: 1, fontSize: 15, fontWeight: active ? '600' : '500', color: active ? theme.primary : theme.text }}>
                  {service}
                </ThemedText>
              </Pressable>
            );
          })}
          {filteredServices.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' }}>No services found</ThemedText>
            </View>
          )}
        </ScrollView>
      </ModalSheet>

      {/* Vehicle Types Picker Modal */}
      <ModalSheet visible={vehiclePickerVisible} title="Select Vehicle Types" onClose={() => { setVehiclePickerVisible(false); setVehicleSearch(''); }}>
        <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search vehicles..."
            placeholderTextColor={theme.tabIconDefault}
            value={vehicleSearch}
            onChangeText={setVehicleSearch}
            autoCapitalize="none"
          />
          {vehicleSearch ? (
            <Pressable onPress={() => setVehicleSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}>
            {filteredVehicles.map((v) => {
              const active = selectedVehicles.includes(v.id);
              return (
                <Pressable
                  key={v.id}
                  style={({ pressed }) => [
                    styles.vehiclePickerItem,
                    { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary + '08' : theme.card },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => toggleVehicle(v.id)}
                >
                  <View style={[styles.vehiclePickerIcon, { backgroundColor: active ? theme.primary : theme.divider }]}>
                    <Ionicons name={v.icon} size={22} color={active ? theme.primaryForeground : theme.textSecondary} />
                  </View>
                  <ThemedText style={{ fontSize: 10, fontWeight: active ? '700' : '500', color: active ? theme.primary : theme.textSecondary, textAlign: 'center' }} numberOfLines={1}>
                    {v.label}
                  </ThemedText>
                  {active && (
                    <View style={[styles.vehiclePickerCheck, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
            {filteredVehicles.length === 0 && (
              <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' }}>No vehicles found</ThemedText>
              </View>
            )}
          </View>
        </ScrollView>
      </ModalSheet>

      {/* State Picker Modal */}
      <ModalSheet visible={statePickerVisible} title="Select State" onClose={() => { setStatePickerVisible(false); setStateSearch(''); }}>
        <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search states..."
            placeholderTextColor={theme.tabIconDefault}
            value={stateSearch}
            onChangeText={setStateSearch}
            autoCapitalize="none"
          />
          {stateSearch ? (
            <Pressable onPress={() => setStateSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
          {filteredStates.map((s) => {
            const active = form.state === s.name;
            return (
              <Pressable
                key={s.isoCode}
                style={[styles.pickerRow, active && { backgroundColor: theme.backgroundSelected }]}
                onPress={() => {
                  updateForm('state', s.name);
                  updateForm('city', '');
                  setSelectedStateCode(s.isoCode);
                  setStatePickerVisible(false);
                  setStateSearch('');
                }}
              >
                <View style={[styles.checkbox, { borderColor: active ? theme.primary : theme.border }, active && { backgroundColor: theme.primary }]}>
                  {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <ThemedText style={{ flex: 1, fontSize: 15, fontWeight: active ? '600' : '500', color: active ? theme.primary : theme.text }}>
                  {s.name}
                </ThemedText>
              </Pressable>
            );
          })}
          {filteredStates.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' }}>
                {form.country ? 'No states found' : 'Select a country first'}
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </ModalSheet>

      {/* City Picker Modal */}
      <ModalSheet visible={cityPickerVisible} title="Select City" onClose={() => { setCityPickerVisible(false); setCitySearch(''); }}>
        <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search cities..."
            placeholderTextColor={theme.tabIconDefault}
            value={citySearch}
            onChangeText={setCitySearch}
            autoCapitalize="none"
          />
          {citySearch ? (
            <Pressable onPress={() => setCitySearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
          {filteredCities.map((c) => {
            const active = form.city === c.name;
            return (
              <Pressable
                key={c.name}
                style={[styles.pickerRow, active && { backgroundColor: theme.backgroundSelected }]}
                onPress={() => {
                  updateForm('city', c.name);
                  setCityPickerVisible(false);
                  setCitySearch('');
                }}
              >
                <View style={[styles.checkbox, { borderColor: active ? theme.primary : theme.border }, active && { backgroundColor: theme.primary }]}>
                  {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <ThemedText style={{ flex: 1, fontSize: 15, fontWeight: active ? '600' : '500', color: active ? theme.primary : theme.text }}>
                  {c.name}
                </ThemedText>
              </Pressable>
            );
          })}
          {filteredCities.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' }}>
                {selectedStateCode ? 'No cities found' : 'Select a state first'}
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </ModalSheet>

      {/* Population Picker Modal */}
      <ModalSheet visible={populationPickerVisible} title="Select Area Population" onClose={() => setPopulationPickerVisible(false)}>
        <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
          {POPULATION_OPTIONS.map((opt) => {
            const active = form.population === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.pickerRow, active && { backgroundColor: theme.backgroundSelected }]}
                onPress={() => {
                  updateForm('population', opt.value);
                  setPopulationPickerVisible(false);
                }}
              >
                <View style={[styles.checkbox, { borderColor: active ? theme.primary : theme.border }, active && { backgroundColor: theme.primary }]}>
                  {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <ThemedText style={{ flex: 1, fontSize: 15, fontWeight: active ? '600' : '500', color: active ? theme.primary : theme.text }}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </ModalSheet>

      {/* Time Picker Modal */}
      {timePicker && (
        <Modal visible animationType="fade" transparent onRequestClose={handleTimeDismiss}>
          <Pressable style={styles.timePickerOverlay} onPress={handleTimeDismiss}>
            <View style={[styles.timePickerSheet, { backgroundColor: theme.card }]}>
              <View style={[styles.timePickerHeader, { borderBottomColor: theme.divider }]}>
                <ThemedText style={{ fontSize: 15, fontWeight: '700' }}>
                  {DAY_LABELS[timePicker.day]} — {timePicker.field === 'open' ? 'Opening Time' : 'Closing Time'}
                </ThemedText>
                <Pressable onPress={handleTimeDone}>
                  <ThemedText style={{ fontSize: 14, fontWeight: '700', color: theme.primary }}>Done</ThemedText>
                </Pressable>
              </View>
              <DateTimePicker
                value={pendingTime || new Date()}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onValueChange={handleTimeValueChange}
                onDismiss={handleTimeDismiss}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onCamera={pickFromCamera}
        onGallery={pickFromGallery}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerBack: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  // ── View Mode ──
  bannerImage: { width: '100%', height: 200 },
  bannerPlaceholder: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },
  viewContent: { padding: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#71717A', marginBottom: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  hourRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 12 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, marginTop: 8 },

  // ── Edit Mode ──
  editBannerWrap: {
    borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden',
    height: 180, position: 'relative',
  },
  editBannerImage: { width: '100%', height: 180 },
  editBannerPlaceholder: {
    width: '100%', height: 180,
    alignItems: 'center', justifyContent: 'center',
  },
  editBannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  editBannerBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, gap: 12 },
  selectBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10 },
  editHourRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 4 },
  timeSlot: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
  },
  vehicleCard: {
    width: '30%', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1,
  },
  vehicleIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // ── Footer ──
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  cancelFooterBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveFooterBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // ── Picker Modal Shared ──
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginTop: 12, marginBottom: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  // ── Vehicle Picker Modal ──
  vehiclePickerItem: {
    width: '30%', alignItems: 'center', gap: 4, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, position: 'relative',
  },
  vehiclePickerIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  vehiclePickerCheck: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Time Picker Modal ──
  timePickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  timePickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  timePickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1 },
});