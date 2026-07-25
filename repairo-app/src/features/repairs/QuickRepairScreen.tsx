import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import InputField from '@/components/ui/InputField';
import Toast from '@/components/ui/Toast';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Repair } from '@/features/repairs/services/repair.service';
import { repairService } from '@/features/repairs/services/repair.service';
import { billService } from '@/features/repairs/services/bill.service';
import { vehicleService } from '@/features/repairs/services/vehicle.service';

import ImagePickerSheet from '@/components/ui/ImagePickerSheet';
import SuccessModal from '@/components/ui/SuccessModal';

interface QuickRepairScreenProps {
  mode?: 'create' | 'edit';
  initialRepair?: Repair;
  onClose: () => void;
  onSuccess: () => void;
}

function extractComplaint(complaints?: unknown): string {
  if (!complaints) return '';
  let blocks: any[];
  if (typeof complaints === 'string') {
    try { blocks = JSON.parse(complaints); } catch { return complaints; }
  } else if (Array.isArray(complaints)) {
    blocks = complaints;
  } else {
    return '';
  }
  const texts = blocks.flatMap((b: any) =>
    (b.tasks || []).map((t: any) => t.text || '')
  );
  return texts.filter(Boolean).join(', ');
}

export default function QuickRepairScreen({ mode = 'create', initialRepair, onClose, onSuccess }: QuickRepairScreenProps) {
  const isEdit = mode === 'edit';
  const theme = useTheme();
  const styles = useStyles(theme);

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [complaint, setComplaint] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const [showSuccess, setShowSuccess] = useState(false);

  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const registryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const repairIdRef = useRef<number | null>(null);
  const [hasExistingBill, setHasExistingBill] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    vehicleService.getAll().then((res) => {
      if (res.success && res.data) setAllVehicles(res.data);
    });
  }, []);

  useEffect(() => {
    if (!initialRepair) return;
    setVehicleNumber(initialRepair.vehicle_number || '');
    setComplaint(extractComplaint(initialRepair.complaints));
    if (initialRepair.vehicle_image) setExistingImage(initialRepair.vehicle_image);
    if (initialRepair.id) repairIdRef.current = initialRepair.id;
  }, [initialRepair]);

  useEffect(() => {
    if (!isEdit || !initialRepair?.id) return;
    billService.getByRepairId(initialRepair.id).then((res) => {
      if (res.success && res.data) {
        const items = (res.data as any).items;
        if (items && items.length > 0) {
          setBillAmount(String(items[0].cost || ''));
          setHasExistingBill(true);
        }
      }
    });
  }, [isEdit, initialRepair?.id]);

  const handleVehicleNumberChange = useCallback((val: string) => {
    setVehicleNumber(val);
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
  }, [allVehicles]);

  const selectSuggestion = useCallback((v: any) => {
    setVehicleNumber(v.vehicle_number);
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const pickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast('Camera roll permission needed', 'error'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.82,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageFile(result.assets[0]);
      setExistingImage(null);
    }
  }, [showToast]);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { showToast('Camera permission needed', 'error'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.82 });
    if (!result.canceled && result.assets.length > 0) {
      setImageFile(result.assets[0]);
      setExistingImage(null);
    }
  }, [showToast]);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setExistingImage(null);
  }, []);

  const buildFormData = useCallback(async () => {
    const fd = new FormData();
    fd.append('vehicle_number', vehicleNumber.trim());
    fd.append('vehicle_type', 'Car');
    fd.append('brand', '');
    fd.append('model_name', '');
    fd.append('owner_name', '');
    fd.append('phone_number', '');
    fd.append('whatsapp_number', '');
    fd.append('km_reading', '');

    const blocks = [{ type: 'Quick Repair', tasks: [{ text: complaint.trim(), fixed: false }] }];
    fd.append('complaints', JSON.stringify(blocks));
    fd.append('service_type', 'Quick Repair');
    fd.append('repair_date', new Date().toISOString());
    fd.append('attending_worker_id', '');
    fd.append('priority', 'Medium');
    fd.append('status', 'Completed');

    if (imageFile?.uri) {
      const ext = imageFile.uri.split('.').pop() || 'jpg';
      const name = imageFile.fileName || `vehicle_0.${ext}`;
      const type = imageFile.mimeType || `image/${ext === 'png' ? 'png' : 'jpeg'}`;
      if (Platform.OS === 'web') {
        const resp = await fetch(imageFile.uri);
        const blob = await resp.blob();
        fd.append('vehicle_image[]', blob, name);
      } else {
        fd.append('vehicle_image[]', {
          uri: Platform.OS === 'android' ? imageFile.uri : imageFile.uri.replace('file://', ''),
          name,
          type,
        } as any);
      }
    } else if (existingImage && !existingImage.startsWith('file')) {
      fd.append('prefilled_image', String(existingImage));
    }

    return fd;
  }, [vehicleNumber, complaint, imageFile, existingImage]);

  const handleSubmit = useCallback(async () => {
    if (!vehicleNumber.trim()) {
      showToast('Vehicle number is required', 'error');
      return;
    }
    if (!complaint.trim()) {
      showToast('Complaint is required', 'error');
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
        if (!res.success || !res.data) { showToast(res.error || 'Failed to create repair', 'error'); return; }
        repairIdRef.current = res.data.id;
      }

      const rid = repairIdRef.current;
      if (!rid) { showToast('Repair ID not found', 'error'); return; }
      if (billAmount.trim() && parseFloat(billAmount) > 0) {
        await billService.saveBill(rid, {
          items: [{ name: 'Quick Repair Service', qty: 1, cost: parseFloat(billAmount) }],
          service_charge: 0,
          tax_snapshot: [],
          tax_total: 0,
          payment_status: 'Unpaid',
        });
      } else if (hasExistingBill) {
        await billService.saveBill(rid, {
          items: [],
          service_charge: 0,
          tax_snapshot: [],
          tax_total: 0,
          payment_status: 'Unpaid',
        });
      }

      setShowSuccess(true);
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [vehicleNumber, complaint, billAmount, hasExistingBill, buildFormData, showToast]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    onSuccess();
  }, [onSuccess]);

  const displayImageUri = imageFile?.uri || (existingImage || null);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{isEdit ? 'Edit Quick Repair' : 'Quick Repair'}</ThemedText>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>Photo</ThemedText>
            {displayImageUri ? (
              <View style={styles.imageRow}>
                <View style={styles.imageThumbWrap}>
                  <Image source={{ uri: displayImageUri }} style={styles.imageThumb} contentFit="cover" />
                  <Pressable style={styles.removeImgBtn} onPress={removeImage}>
                    <Ionicons name="close-circle" size={22} color={theme.destructive} />
                  </Pressable>
                </View>
                <Pressable style={styles.addImageBtn} onPress={() => setShowImagePicker(true)}>
                  <Ionicons name="camera-outline" size={24} color={theme.primary} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.addImageLarge} onPress={() => setShowImagePicker(true)}>
                <View style={styles.addImageIconWrap}>
                  <Ionicons name="camera-outline" size={36} color={theme.primary} />
                </View>
                <ThemedText style={styles.addImageLabel}>Add vehicle photo</ThemedText>
                <ThemedText style={styles.addImageHint}>Optional</ThemedText>
              </Pressable>
            )}
          </View>

          <View style={styles.card}>
            <View>
              <InputField
                label="Vehicle Number"
                value={vehicleNumber}
                onChangeText={handleVehicleNumberChange}
                placeholder="e.g. KA-01-AB-1234"
                icon="car-side"
                autoCapitalize="characters"
                required
              />
              {showSuggestions && (
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
          </View>

          <View style={styles.card}>
            <ThemedText style={styles.fieldLabel}>
              Complaint<ThemedText style={{ color: '#E5544D' }}> *</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
              value={complaint}
              onChangeText={setComplaint}
              placeholder="Describe the issue..."
              placeholderTextColor={theme.tabIconDefault}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.card}>
            <InputField
              label="Estimated Amount"
              value={billAmount}
              onChangeText={setBillAmount}
              placeholder="e.g. 5000"
              icon="currency-usd"
              keyboardType="phone-pad"
            />
            <ThemedText style={styles.hint}>
              {isEdit
                ? (hasExistingBill ? 'Update the bill amount' : 'Enter an amount to create a bill')
                : 'An invoice will be created automatically if an amount is entered'}
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={({ pressed }) => [
            styles.submitBtn,
            submitting && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.primaryForeground} />
          <ThemedText style={styles.submitBtnText}>
            {submitting ? 'Saving...' : 'Save'}
          </ThemedText>
        </Pressable>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />

      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onCamera={takePhoto}
        onGallery={pickFromGallery}
      />

      <SuccessModal
        visible={showSuccess}
        onClose={handleSuccessClose}
        title={isEdit ? 'Quick Repair Updated!' : 'Quick Repair Completed!'}
        subtitle={isEdit ? 'The job card has been updated.' : 'The job has been saved and marked as completed.'}
      />
    </View>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
      backgroundColor: theme.card,
    },
    headerBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
    },
    scrollContent: {
      padding: 16,
      gap: 14,
      paddingBottom: 32,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 6,
    },
    hint: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.tabIconDefault,
      lineHeight: 16,
    },
    textArea: {
      borderWidth: 1.5,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontWeight: '500',
      minHeight: 100,
      lineHeight: 22,
    },
    imageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    imageThumb: {
      width: 100,
      height: 100,
      borderRadius: 12,
      backgroundColor: theme.divider,
    },
    imageThumbWrap: {
      position: 'relative',
    },
    removeImgBtn: {
      position: 'absolute',
      top: -8,
      right: -8,
    },
    addImageBtn: {
      width: 100,
      height: 100,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.primary + '40',
      backgroundColor: theme.primary + '06',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addImageLarge: {
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.primary + '40',
      backgroundColor: theme.primary + '06',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      gap: 8,
    },
    addImageIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary + '12',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addImageLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.primary,
    },
    addImageHint: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.tabIconDefault,
    },
    suggestionsList: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      marginTop: 4,
      overflow: 'hidden',
    },
    suggestionItem: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    suggestionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    suggestionSub: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.textSecondary,
      marginTop: 2,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
      backgroundColor: theme.card,
    },
    submitBtn: {
      height: 52,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },
    submitBtnText: {
      color: theme.primaryForeground,
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
  return styles;
};
