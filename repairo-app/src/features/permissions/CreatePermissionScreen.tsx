import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Toast from '@/components/ui/Toast';
import { permissionService } from '@/features/permissions/services/permission.service';
import type { Permission } from '@/features/permissions/services/permission.service';

interface CreatePermissionScreenProps {
  mode?: 'create' | 'edit';
  initialPermission?: Permission | null;
  onClose: () => void;
  onSuccess: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function CreatePermissionScreen({
  mode = 'create',
  initialPermission,
  onClose,
  onSuccess,
}: CreatePermissionScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(theme);
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    permission_name: initialPermission?.permission_name || '',
    module_name: initialPermission?.module_name || '',
    slug: initialPermission?.slug || '',
    description: initialPermission?.description || '',
    status: initialPermission?.status || 'active',
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const update = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'permission_name' && !slugManuallyEdited && !isEdit) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!form.permission_name.trim()) {
      showToast('Permission name is required', 'error');
      return;
    }
    if (!form.module_name.trim()) {
      showToast('Module name is required', 'error');
      return;
    }
    if (!form.slug.trim()) {
      showToast('Slug is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (isEdit && initialPermission) {
        res = await permissionService.update(initialPermission.id, {
          permission_name: form.permission_name.trim(),
          module_name: form.module_name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          status: form.status,
        });
      } else {
        res = await permissionService.create({
          permission_name: form.permission_name.trim(),
          module_name: form.module_name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
        });
      }

      if (res.success) {
        showToast(isEdit ? 'Permission updated successfully' : 'Permission added successfully');
        setTimeout(() => onSuccess(), 500);
      } else {
        showToast(res.error || 'Failed to save permission', 'error');
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
            {isEdit ? 'Edit Permission' : 'Add Permission'}
          </ThemedText>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <ThemedText style={styles.label}>Permission Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={form.permission_name}
              onChangeText={(v) => update('permission_name', v)}
              placeholder="e.g. Create Vehicle"
              placeholderTextColor="#B0AA97"
              returnKeyType="next"
            />
          </View>

          <View style={styles.card}>
            <ThemedText style={styles.label}>Module Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={form.module_name}
              onChangeText={(v) => update('module_name', v)}
              placeholder="e.g. Vehicles"
              placeholderTextColor="#B0AA97"
              returnKeyType="next"
            />
          </View>

          <View style={styles.card}>
            <ThemedText style={styles.label}>Slug *</ThemedText>
            <TextInput
              style={[styles.input, styles.monoInput]}
              value={form.slug}
              onChangeText={(v) => { setSlugManuallyEdited(true); setForm((prev) => ({ ...prev, slug: v })); }}
              placeholder="e.g. create:vehicle"
              placeholderTextColor="#B0AA97"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            {!slugManuallyEdited && !isEdit && form.permission_name.length > 0 && (
              <ThemedText style={styles.autoSlugHint}>Auto-generated from name</ThemedText>
            )}
          </View>

          <View style={styles.card}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(v) => update('description', v)}
              placeholder="Optional description of this permission"
              placeholderTextColor="#B0AA97"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {isEdit && (
            <View style={styles.card}>
              <ThemedText style={styles.label}>Status</ThemedText>
              <View style={styles.statusChips}>
                {['active', 'inactive'].map((s) => {
                  const active = form.status === s;
                  return (
                    <Pressable
                      key={s}
                      style={[styles.statusChip, active && styles.statusChipActive]}
                      onPress={() => setForm((prev) => ({ ...prev, status: s }))}
                    >
                      <ThemedText style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
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
                  {isEdit ? 'Update Permission' : 'Add Permission'}
                </ThemedText>
              </View>
            )}
          </Pressable>
        </View>

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
      backgroundColor: theme.muted,
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    scrollContent: { padding: 16, gap: 14, paddingBottom: 120 },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      gap: 10,
    },
    label: { fontSize: 13, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
    input: {
      backgroundColor: theme.muted,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
    monoInput: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 14,
    },
    textArea: { minHeight: 80 },
    autoSlugHint: {
      fontSize: 11,
      color: theme.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
    statusChips: {
      flexDirection: 'row',
      gap: 8,
    },
    statusChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.muted,
    },
    statusChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    statusChipText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
    statusChipTextActive: { color: theme.primaryForeground },
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
