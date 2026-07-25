import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';

import ScreenLayout from '@/components/ScreenLayout';
import ImagePickerSheet from '@/components/ui/ImagePickerSheet';
import InputField from '@/components/ui/InputField';
import PhoneInputWithCode from '@/components/ui/PhoneInputWithCode';
import Toast from '@/components/ui/Toast';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentUser, updateCurrentUser } from '@/services/auth.service';
import { userService, type User } from '@/features/users/services/user.service';

interface EditProfileScreenProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProfileScreen({ onClose, onSuccess }: EditProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(theme);
  const user = getCurrentUser();

  const [name, setName] = useState(user?.ownerName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(!user?.email);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user?.userId || user?.email) return;
    (async () => {
      if (!user.userId) return;
      try {
        const res = await userService.getById(user.userId);
        if (res.success && res.data?.email) {
          setEmail(res.data.email);
        }
      } catch {} finally {
        setLoadingProfile(false);
      }
    })();
  }, [user?.userId, user?.email]);

  const currentImage = imageUri || user?.profile_image || null;

  const pickFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to choose a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    if (email && !email.includes('@')) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }
    if (!user?.userId) return;

    setSubmitting(true);
    try {
      let res: { success: boolean; data?: User; error?: string };

      const payload: Record<string, string> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };
      if (newPassword) payload.password = newPassword;

      if (imageUri && imageUri !== user?.profile_image) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        payload.profile_image = `data:${mimeType};base64,${base64}`;
      }

      res = await userService.update(user.userId, payload);

      if (!res.success) {
        setToast({ visible: true, message: res.error || 'Failed to update profile', type: 'error' });
        return;
      }

      await updateCurrentUser({
        ownerName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        profile_image: res.data?.profile_image || user?.profile_image || null,
      });

      setToast({ visible: true, message: 'Profile updated successfully', type: 'success' });
      setTimeout(() => { onSuccess(); onClose(); }, 600);
    } catch {
      setToast({ visible: true, message: 'Something went wrong', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [name, email, phone, imageUri, newPassword, confirmPassword, user, onClose, onSuccess]);

  const initials = (user?.ownerName || 'U').slice(0, 2).toUpperCase();

  return (
    <ScreenLayout
      title="Edit Profile"
      rightAction={
        <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.border }]}>
          <Ionicons name="close" size={18} color={theme.text} />
        </Pressable>
      }
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => setShowPicker(true)} style={styles.avatarSection}>
            <View style={[styles.avatarWrap, { borderColor: theme.border }]}>
              {currentImage ? (
                <Image source={currentImage} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '18' }]}>
                  <ThemedText style={[styles.avatarInitials, { color: theme.primary }]}>{initials}</ThemedText>
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: theme.primary }]}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </View>
            <ThemedText style={[styles.changePhoto, { color: theme.primary }]}>Change Photo</ThemedText>
          </Pressable>

          {loadingProfile ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText style={{ fontSize: 13, color: theme.textSecondary }}>Loading profile...</ThemedText>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <InputField
                label="Full Name"
                value={name}
                onChangeText={setName}
                type="text"
                required
                editable={!submitting}
              />

              <PhoneInputWithCode
                countryCode={user?.shopCountry || 'IN'}
                callingCode={user?.shopCallingCode || '+91'}
                phone={phone}
                onPhoneChange={setPhone}
                onCountryChange={() => {}}
              />

              <InputField
                label="Email"
                value={email}
                onChangeText={setEmail}
                type="email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!submitting}
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name={showPassword ? 'lock-open-outline' : 'lock-closed-outline'} size={16} color={theme.primary} />
                <ThemedText style={[styles.toggleText, { color: theme.primary }]}>
                  {showPassword ? 'Cancel password change' : 'Change password (optional)'}
                </ThemedText>
              </Pressable>

              {showPassword && (
                <View style={styles.passwordSection}>
                  <InputField
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    type="password"
                    placeholder="At least 6 characters"
                    editable={!submitting}
                  />
                  <InputField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    type="password"
                    placeholder="Re-enter new password"
                    editable={!submitting}
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, { backgroundColor: theme.primary }, pressed && styles.pressed, submitting && styles.disabled]}
            onPress={handleSave}
            disabled={submitting || loadingProfile}
          >
            {submitting ? (
              <ActivityIndicator color={theme.primaryForeground} size="small" />
            ) : (
              <View style={styles.btnInner}>
                <Ionicons name="checkmark-circle-outline" size={18} color={theme.primaryForeground} />
                <ThemedText style={[styles.saveText, { color: theme.primaryForeground }]}>Save Changes</ThemedText>
              </View>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ImagePickerSheet
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onCamera={pickFromCamera}
        onGallery={pickFromGallery}
      />
    </ScreenLayout>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(() => StyleSheet.create({
    closeBtn: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    scroll: {
      padding: 16,
      gap: 20,
    },
    avatarSection: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
    },
    avatarWrap: {
      position: 'relative',
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderStyle: 'dashed',
      overflow: 'hidden',
    },
    avatarImage: {
      width: 92,
      height: 92,
      borderRadius: 46,
    },
    avatarPlaceholder: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontSize: 28,
      fontWeight: '800',
    },
    cameraBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    changePhoto: {
      fontSize: 13,
      fontWeight: '600',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 40,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      gap: 16,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    toggleText: {
      fontSize: 13,
      fontWeight: '600',
    },
    passwordSection: {
      gap: 16,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    saveBtn: {
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: {
      fontSize: 15,
      fontWeight: '700',
    },
    btnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    pressed: { opacity: 0.82 },
    disabled: { opacity: 0.6 },
  }), [theme]);
};
