import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import InputField from '@/components/ui/InputField';
import VehicleTypePicker from '@/features/repairs/components/VehicleTypePicker';
import ImagePickerSheet from '@/components/ui/ImagePickerSheet';
import Toast from '@/components/ui/Toast';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';

interface CreateVehicleScreenProps {
  mode?: 'create' | 'edit';
  initialVehicle?: Vehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateVehicleScreen({
  mode = 'create',
  initialVehicle,
  onClose,
  onSuccess,
}: CreateVehicleScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(theme);
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    vehicleNumber: initialVehicle?.vehicle_number || '',
    vehicleType: initialVehicle?.vehicle_type || '',
    modelName: initialVehicle?.model_name || '',
    brand: initialVehicle?.brand || '',
    ownerName: initialVehicle?.owner_name || '',
    ownerPhone: initialVehicle?.owner_phone || '',
  });
  const [vehicleImage, setVehicleImage] = useState<string | null>(initialVehicle?.vehicle_image || null);
  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { showToast('Camera permission required', 'error'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageFile(result.assets[0]);
      setVehicleImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast('Gallery permission required', 'error'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageFile(result.assets[0]);
      setVehicleImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!form.vehicleNumber.trim()) {
      showToast('Vehicle number is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('vehicle_number', form.vehicleNumber.trim());
      fd.append('vehicle_type', form.vehicleType || 'Car');
      if (form.modelName) fd.append('model_name', form.modelName);
      if (form.brand) fd.append('brand', form.brand);
      fd.append('status', 'Active');

      if (imageFile && imageFile.uri) {
        const ext = imageFile.uri.split('.').pop() || 'jpg';
        const name = imageFile.fileName || `vehicle_${Date.now()}.${ext}`;
        const type = imageFile.mimeType || `image/${ext === 'png' ? 'png' : 'jpeg'}`;
        if (Platform.OS === 'web') {
          const resp = await fetch(imageFile.uri);
          const blob = await resp.blob();
          fd.append('vehicle_image', blob, name);
        } else {
          fd.append('vehicle_image', {
            uri: Platform.OS === 'android' ? imageFile.uri : imageFile.uri.replace('file://', ''),
            name,
            type,
          } as any);
        }
      } else if (isEdit && vehicleImage && !vehicleImage.startsWith('file')) {
        fd.append('vehicle_image', vehicleImage);
      }

      let res;
      if (isEdit && initialVehicle) {
        res = await vehicleService.update(initialVehicle.id, fd);
      } else {
        res = await vehicleService.create(fd);
      }

      if (res.success) {
        showToast(isEdit ? 'Vehicle updated successfully' : 'Vehicle added successfully');
        setTimeout(() => onSuccess(), 500);
      } else {
        showToast(res.error || 'Failed to save vehicle', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#1A1A1A" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
          </ThemedText>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <InputField
            label="Vehicle Number"
            value={form.vehicleNumber}
            onChangeText={(v) => update('vehicleNumber', v.toUpperCase())}
            placeholder="e.g. KA-01-AB-1234"
            type="text"
            icon="car-outline"
            required
            autoCapitalize="characters"
          />

          <VehicleTypePicker
            value={form.vehicleType}
            onChange={(v) => update('vehicleType', v)}
          />

          <InputField
            label="Model Name"
            value={form.modelName}
            onChangeText={(v) => update('modelName', v)}
            placeholder="e.g. Swift, Activa, etc."
            type="text"
            icon="card-bulleted-outline"
            autoCapitalize="words"
          />

          <InputField
            label="Brand / Make"
            value={form.brand}
            onChangeText={(v) => update('brand', v)}
            placeholder="e.g. Maruti, Honda, etc."
            type="text"
            icon="domain"
            autoCapitalize="words"
          />

          <InputField
            label="Owner Name"
            value={form.ownerName}
            onChangeText={(v) => update('ownerName', v)}
            placeholder="Owner name"
            type="text"
            icon="account-outline"
            autoCapitalize="words"
          />

          <InputField
            label="Owner Phone"
            value={form.ownerPhone}
            onChangeText={(v) => update('ownerPhone', v)}
            placeholder="Phone number"
            type="phone"
            icon="phone-outline"
          />

          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, gap: 10 }}>
            <ThemedText style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Photo</ThemedText>
            {vehicleImage ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: vehicleImage }} style={styles.imagePreview} contentFit="cover" />
                <Pressable style={styles.removeImageBtn} onPress={() => { setVehicleImage(null); setImageFile(null); }}>
                  <Ionicons name="close-circle" size={24} color={theme.error} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.addPhotoBtn} onPress={() => setShowImagePicker(true)}>
                <Ionicons name="camera-outline" size={28} color={theme.primary} />
                <ThemedText style={styles.addPhotoText}>Tap to add photo</ThemedText>
              </Pressable>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.pressed,
              submitting && styles.disabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnInner}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <ThemedText style={styles.submitText}>
                  {isEdit ? 'Update Vehicle' : 'Add Vehicle'}
                </ThemedText>
              </View>
            )}
          </Pressable>
        </View>

        <ImagePickerSheet
          visible={showImagePicker}
          onClose={() => setShowImagePicker(false)}
          onCamera={pickFromCamera}
          onGallery={pickFromGallery}
        />

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.border,
      backgroundColor: theme.card,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    scrollContent: { padding: 16, gap: 14, paddingBottom: 120 },
    imagePreviewWrap: { position: 'relative', alignSelf: 'flex-start' },
    imagePreview: {
      width: 120, height: 120, borderRadius: 16,
      backgroundColor: theme.card,
    },
    removeImageBtn: { position: 'absolute', top: -8, right: -8 },
    addPhotoBtn: {
      borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.primary + '40',
      borderRadius: 14, paddingVertical: 24,
      alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: theme.primary + '06',
    },
    addPhotoText: { fontSize: 13, fontWeight: '600', color: theme.primary },
    footer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 16, paddingTop: 12,
      backgroundColor: theme.card,
      borderTopWidth: 1, borderTopColor: theme.border,
    },
    submitBtn: {
      height: 50, borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    pressed: { opacity: 0.82 },
    disabled: { opacity: 0.6 },
  }), [theme]);
  return styles;
};
