import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView,
  Platform, Pressable, SectionList, StyleSheet, Switch,
  TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Toast from '@/components/ui/Toast';
import { roleService } from '@/features/roles/services/role.service';
import type { Role } from '@/features/roles/services/role.service';
import { permissionService } from '@/features/permissions/services/permission.service';
import type { Permission } from '@/features/permissions/services/permission.service';
import { useRBAC } from '@/hooks/use-rbac';

interface RoleEditorScreenProps {
  mode: 'create' | 'edit';
  initialRole?: Role | null;
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

export default function RoleEditorScreen({
  mode,
  initialRole,
  onClose,
  onSuccess,
}: RoleEditorScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(theme);
  const { can } = useRBAC();
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    name: initialRole?.name || '',
    slug: initialRole?.slug || '',
    description: initialRole?.description || '',
    status: initialRole?.status || 'active',
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set(
    initialRole?.permissions || []
  ));
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [savingPerms, setSavingPerms] = useState(false);

  const toggleChangedRef = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingPerms(true);
      const res = await permissionService.getAll();
      if (res.success) {
        setAllPermissions(res.data);
      } else {
        showToast('Failed to load permissions', 'error');
      }
      setLoadingPerms(false);
    };
    load();
  }, [showToast]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !slugManuallyEdited && !isEdit) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const sections = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of allPermissions) {
      if (!map.has(p.module_name)) map.set(p.module_name, []);
      map.get(p.module_name)!.push(p);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, perms]) => ({
        title: module,
        data: perms.sort((a, b) => a.permission_name.localeCompare(b.permission_name)),
      }));
  }, [allPermissions]);

  const totalPerms = allPermissions.length;
  const assignedPerms = selectedSlugs.size;

  const togglePermission = useCallback((slug: string) => {
    toggleChangedRef.current = true;
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const toggleModule = useCallback((modulePerms: Permission[]) => {
    toggleChangedRef.current = true;
    const moduleSlugs = modulePerms.map((p) => p.slug);
    const allSelected = moduleSlugs.every((s) => selectedSlugs.has(s));
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      for (const s of moduleSlugs) {
        if (allSelected) next.delete(s);
        else next.add(s);
      }
      return next;
    });
  }, [selectedSlugs]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!form.name.trim()) { showToast('Role name is required', 'error'); return; }
    if (!form.slug.trim()) { showToast('Slug is required', 'error'); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
      };

      let res;
      if (isEdit && initialRole) {
        const perms = toggleChangedRef.current
          ? Array.from(selectedSlugs)
          : undefined;
        res = await roleService.update(initialRole.id, {
          ...payload,
          status: form.status,
          permissions: perms,
        });
      } else {
        res = await roleService.create({
          ...payload,
          permissions: Array.from(selectedSlugs),
        });
      }

      if (res.success) {
        showToast(isEdit ? 'Role updated successfully' : 'Role created successfully');
        setTimeout(() => onSuccess(), 500);
      } else {
        showToast(res.error || 'Failed to save role', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSectionHeader = useCallback(({ section }: { section: typeof sections[0] }) => {
    const moduleSlugs = section.data.map((p) => p.slug);
    const allOn = moduleSlugs.every((s) => selectedSlugs.has(s));
    const someOn = moduleSlugs.some((s) => selectedSlugs.has(s));
    return (
      <Pressable
        style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}
        onPress={() => toggleModule(section.data)}
      >
        <View style={styles.sectionHeaderLeft}>
          {allOn ? (
            <Ionicons name="checkbox" size={18} color={theme.primary} />
          ) : someOn ? (
            <Ionicons name="remove" size={18} color={theme.warning} />
          ) : (
            <Ionicons name="square-outline" size={18} color={theme.textSecondary} />
          )}
          <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
        </View>
        <ThemedText style={styles.sectionCount}>
          {moduleSlugs.filter((s) => selectedSlugs.has(s)).length}/{section.data.length}
        </ThemedText>
      </Pressable>
    );
  }, [selectedSlugs, toggleModule, theme]);

  const renderPermissionItem = useCallback(({ item }: { item: Permission }) => {
    const isSelected = selectedSlugs.has(item.slug);
    return (
      <Pressable
        style={({ pressed }) => [styles.permRow, pressed && styles.pressed]}
        onPress={() => togglePermission(item.slug)}
      >
        <Switch
          value={isSelected}
          onValueChange={() => togglePermission(item.slug)}
          trackColor={{ false: theme.divider, true: theme.primary + '60' }}
          thumbColor={isSelected ? theme.primary : theme.textSecondary}
          ios_backgroundColor={theme.divider}
          style={styles.switch}
        />
        <View style={styles.permInfo}>
          <ThemedText style={styles.permName}>{item.permission_name}</ThemedText>
          <ThemedText style={styles.permSlug}>{item.slug}</ThemedText>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
        )}
      </Pressable>
    );
  }, [selectedSlugs, togglePermission, theme]);

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
            {isEdit ? 'Edit Role' : 'New Role'}
          </ThemedText>
          <View style={{ width: 38 }} />
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPermissionItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.formSection}>
              <View style={styles.card}>
                <ThemedText style={styles.label}>Role Name *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(v) => updateForm('name', v)}
                  placeholder="e.g. Workshop Admin"
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
                  placeholder="e.g. workshop-admin"
                  placeholderTextColor="#B0AA97"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {!slugManuallyEdited && !isEdit && form.name.length > 0 && (
                  <ThemedText style={styles.autoSlugHint}>Auto-generated from name</ThemedText>
                )}
              </View>

              <View style={styles.card}>
                <ThemedText style={styles.label}>Description</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(v) => updateForm('description', v)}
                  placeholder="Optional description of this role"
                  placeholderTextColor="#B0AA97"
                  multiline
                  numberOfLines={2}
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

              <View style={styles.permHeaderRow}>
                <ThemedText style={styles.permSectionTitle}>PERMISSIONS</ThemedText>
                <ThemedText style={styles.permSummary}>
                  {loadingPerms ? 'Loading...' : `${assignedPerms} / ${totalPerms} assigned`}
                </ThemedText>
              </View>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {loadingPerms ? (
                <View style={styles.loadingPerms}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <ThemedText style={styles.loadingPermsText}>Loading permissions...</ThemedText>
                </View>
              ) : null}

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
                      {isEdit ? 'Save Changes' : 'Create Role'}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
          }
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
      backgroundColor: theme.muted,
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    scrollContent: { paddingBottom: 40 },
    formSection: { padding: 16, gap: 12, paddingBottom: 8 },
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
    textArea: { minHeight: 70 },
    autoSlugHint: {
      fontSize: 11,
      color: theme.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
    statusChips: { flexDirection: 'row', gap: 8 },
    statusChip: {
      paddingHorizontal: 16, paddingVertical: 10,
      borderRadius: 10, borderWidth: 1, borderColor: theme.border,
      backgroundColor: theme.muted,
    },
    statusChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    statusChipText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
    statusChipTextActive: { color: theme.primaryForeground },

    permHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingTop: 8,
    },
    permSectionTitle: {
      fontSize: 12, fontWeight: '700', color: theme.textSecondary,
      letterSpacing: 0.5,
    },
    permSummary: {
      fontSize: 12, fontWeight: '600', color: theme.primary,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.backgroundElement,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    sectionCount: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },

    permRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.divider,
      gap: 10,
    },
    switch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
    permInfo: { flex: 1, gap: 1 },
    permName: { fontSize: 14, fontWeight: '600', color: theme.text },
    permSlug: { fontSize: 11, fontWeight: '500', color: theme.textSecondary, fontFamily: 'monospace' },

    footer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 40,
      gap: 12,
    },
    loadingPerms: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 20,
    },
    loadingPermsText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
    submitBtn: {
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    pressed: { opacity: 0.82 },
    disabled: { opacity: 0.6 },
  }), [theme]);
  return styles;
};
