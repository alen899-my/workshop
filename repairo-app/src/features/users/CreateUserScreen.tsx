import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView,
  Platform, Pressable, SectionList, StyleSheet, Switch, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Toast from '@/components/ui/Toast';
import PhoneInputWithCode from '@/components/ui/PhoneInputWithCode';
import { getCallingCode } from '@/utils/preload-countries';
import { userService } from '@/features/users/services/user.service';
import type { User, RoleOption } from '@/features/users/services/user.service';
import { permissionService } from '@/features/permissions/services/permission.service';
import type { Permission } from '@/features/permissions/services/permission.service';
import { useRBAC } from '@/hooks/use-rbac';

interface CreateUserScreenProps {
  mode?: 'create' | 'edit';
  initialUser?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

type OverrideState = 'default' | 'inherited' | 'added' | 'excluded';

const COMMON_COUNTRIES = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US' },
  { code: '+44', country: 'GB' },
  { code: '+86', country: 'CN' },
  { code: '+971', country: 'AE' },
  { code: '+966', country: 'SA' },
  { code: '+61', country: 'AU' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+39', country: 'IT' },
  { code: '+7', country: 'RU' },
  { code: '+81', country: 'JP' },
  { code: '+82', country: 'KR' },
  { code: '+65', country: 'SG' },
  { code: '+60', country: 'MY' },
  { code: '+63', country: 'PH' },
  { code: '+64', country: 'NZ' },
  { code: '+55', country: 'BR' },
  { code: '+52', country: 'MX' },
].sort((a, b) => b.code.length - a.code.length);

function extractCallingCode(phone: string): { callingCode: string; digits: string; country: string } {
  for (const cc of COMMON_COUNTRIES) {
    if (phone.startsWith(cc.code)) {
      return { callingCode: cc.code, digits: phone.slice(cc.code.length), country: cc.country };
    }
  }
  return { callingCode: '', digits: phone, country: 'IN' };
}

export default function CreateUserScreen({
  mode = 'create',
  initialUser,
  onClose,
  onSuccess,
}: CreateUserScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(theme);
  const { can } = useRBAC();
  const isEdit = mode === 'edit';

  const parsedPhone = useMemo(
    () => initialUser?.phone ? extractCallingCode(initialUser.phone) : null,
    [initialUser?.phone],
  );

  const [form, setForm] = useState({
    name: initialUser?.name || '',
    phone: parsedPhone?.digits || '',
    callingCode: parsedPhone?.callingCode || '+91',
    countryCode: parsedPhone?.country || 'IN',
    email: initialUser?.email || '',
    password: '',
    role: initialUser?.role || 'worker',
    status: initialUser?.status || 'active',
  });
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [additionalPerms, setAdditionalPerms] = useState<Set<string>>(new Set(initialUser?.additional_permissions || []));
  const [excludedPerms, setExcludedPerms] = useState<Set<string>>(new Set(initialUser?.excluded_permissions || []));
  const [rolePermissionSlugs, setRolePermissionSlugs] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    userService.getRoleOptions().then((res) => {
      if (res.success) {
        const filtered = res.data.filter((r) => r.slug !== 'super-admin');
        setRoleOptions(filtered);
        if (isEdit && initialUser?.role === 'super-admin' && filtered.length > 0) {
          update('role', filtered[0].slug);
        }
      }
    });
  }, [isEdit, initialUser?.role]);

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
  }, [can, showToast]);

  useEffect(() => {
    if (!form.role) return;
    permissionService.getRolePermissions(form.role).then((res) => {
      if (res.success) setRolePermissionSlugs(new Set(res.data));
    });
  }, [form.role]);

  const debouncedCheckPhone = useCallback((phone: string, callingCode: string) => {
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    const fullPhone = `${callingCode}${phone}`;
    if (!phone || phone.length < 7) {
      setPhoneError(undefined);
      return;
    }

    checkTimerRef.current = setTimeout(async () => {
      setPhoneChecking(true);
      const res = await userService.checkPhone(fullPhone, isEdit ? initialUser?.id : undefined);
      if (res.success) {
        setPhoneError(res.exists ? 'This phone number is already registered' : undefined);
      }
      setPhoneChecking(false);
    }, 500);
  }, [isEdit, initialUser?.id]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, phone: value }));
    debouncedCheckPhone(value, form.callingCode);
  }, [debouncedCheckPhone, form.callingCode]);

  const handleCountryChange = useCallback((c: { cca2: string; callingCode: string; currency: string }) => {
    setForm((prev) => ({ ...prev, countryCode: c.cca2, callingCode: c.callingCode }));
    if (form.phone) debouncedCheckPhone(form.phone, c.callingCode);
  }, [debouncedCheckPhone, form.phone]);

  const getOverrideState = useCallback((slug: string): OverrideState => {
    if (additionalPerms.has(slug)) return 'added';
    if (excludedPerms.has(slug)) return 'excluded';
    if (rolePermissionSlugs.has(slug)) return 'inherited';
    return 'default';
  }, [additionalPerms, excludedPerms, rolePermissionSlugs]);

  const toggleOverride = useCallback((slug: string) => {
    const current = getOverrideState(slug);

    if (current === 'default') {
      setAdditionalPerms((prev) => new Set(prev).add(slug));
    } else if (current === 'inherited') {
      setExcludedPerms((prev) => new Set(prev).add(slug));
    } else if (current === 'added') {
      setAdditionalPerms((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    } else {
      setExcludedPerms((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  }, [getOverrideState]);

  const onToggleSwitch = useCallback((slug: string, value: boolean) => {
    const current = getOverrideState(slug);
    if (value) {
      if (current === 'excluded') {
        setExcludedPerms((prev) => {
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
      } else if (current === 'default') {
        setAdditionalPerms((prev) => new Set(prev).add(slug));
      }
    } else {
      if (current === 'inherited') {
        setExcludedPerms((prev) => new Set(prev).add(slug));
      } else if (current === 'added') {
        setAdditionalPerms((prev) => {
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
      }
    }
  }, [getOverrideState]);

  const toggleModule = useCallback((modulePerms: Permission[]) => {
    const moduleSlugs = modulePerms.map((p) => p.slug);
    const allAdded = moduleSlugs.every((s) => additionalPerms.has(s));
    const allExcluded = moduleSlugs.every((s) => excludedPerms.has(s));
    const allInherited = moduleSlugs.every((s) => !additionalPerms.has(s) && !excludedPerms.has(s));

    if (allAdded) {
      const nextAdd = new Set(additionalPerms);
      const nextExc = new Set(excludedPerms);
      for (const s of moduleSlugs) {
        nextAdd.delete(s);
        if (rolePermissionSlugs.has(s)) nextExc.add(s);
      }
      setAdditionalPerms(nextAdd);
      setExcludedPerms(nextExc);
    } else if (allExcluded) {
      const nextAdd = new Set(additionalPerms);
      const nextExc = new Set(excludedPerms);
      for (const s of moduleSlugs) {
        nextAdd.delete(s);
        nextExc.delete(s);
      }
      setAdditionalPerms(nextAdd);
      setExcludedPerms(nextExc);
    } else if (allInherited) {
      const nextAdd = new Set(additionalPerms);
      for (const s of moduleSlugs) nextAdd.add(s);
      setAdditionalPerms(nextAdd);
    } else {
      const nextAdd = new Set(additionalPerms);
      const nextExc = new Set(excludedPerms);
      for (const s of moduleSlugs) {
        nextAdd.delete(s);
        nextExc.delete(s);
      }
      setAdditionalPerms(nextAdd);
      setExcludedPerms(nextExc);
    }
  }, [additionalPerms, excludedPerms, rolePermissionSlugs]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!form.name.trim()) { showToast('Name is required', 'error'); return; }
    if (!form.phone.trim() || form.phone.trim().length < 7) { showToast('Valid phone number required', 'error'); return; }
    if (!isEdit && !form.password.trim()) { showToast('Password is required', 'error'); return; }
    if (phoneError) { showToast('Fix the phone number error first', 'error'); return; }

    const fullPhone = `${form.callingCode}${form.phone.trim()}`;

    setSubmitting(true);
    try {
      let res;
      if (isEdit && initialUser) {
        res = await userService.update(initialUser.id, {
          name: form.name.trim(),
          phone: fullPhone,
          email: form.email.trim() || undefined,
          role: form.role,
          status: form.status,
          password: form.password.trim() || undefined,
          additional_permissions: Array.from(additionalPerms),
          excluded_permissions: Array.from(excludedPerms),
        });
      } else {
        res = await userService.create({
          name: form.name.trim(),
          phone: fullPhone,
          email: form.email.trim(),
          password: form.password.trim(),
          role: form.role,
          status: form.status,
          additional_permissions: Array.from(additionalPerms),
          excluded_permissions: Array.from(excludedPerms),
        });
      }

      if (res.success) {
        showToast(isEdit ? 'User updated successfully' : 'User created successfully');
        setTimeout(() => onSuccess(), 500);
      } else {
        showToast(res.error || 'Failed to save user', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const sections = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of allPermissions) {
      if (!can(p.slug)) continue;
      if (!map.has(p.module_name)) map.set(p.module_name, []);
      map.get(p.module_name)!.push(p);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, perms]) => ({
        title: module,
        data: perms.sort((a, b) => a.permission_name.localeCompare(b.permission_name)),
      }));
  }, [allPermissions, can]);

  const addedCount = additionalPerms.size;
  const excludedCount = excludedPerms.size;
  const inheritedCount = rolePermissionSlugs.size - [...rolePermissionSlugs].filter((s) => additionalPerms.has(s) || excludedPerms.has(s)).length;

  const renderSectionHeader = useCallback(({ section }: { section: typeof sections[0] }) => {
    const moduleSlugs = section.data.map((p) => p.slug);
    const allAdded = moduleSlugs.every((s) => additionalPerms.has(s));
    const allExcluded = moduleSlugs.every((s) => excludedPerms.has(s));
    const allInherited = moduleSlugs.every((s) => !additionalPerms.has(s) && !excludedPerms.has(s) && rolePermissionSlugs.has(s));
    const someOverridden = moduleSlugs.some((s) => additionalPerms.has(s) || excludedPerms.has(s));

    let icon: keyof typeof Ionicons.glyphMap = 'square-outline';
    let iconColor: string = theme.textSecondary;
    if (allAdded) { icon = 'checkbox'; iconColor = theme.success; }
    else if (allExcluded) { icon = 'close-circle'; iconColor = theme.destructive; }
    else if (allInherited) { icon = 'checkmark-circle'; iconColor = theme.textSecondary + '60'; }
    else if (someOverridden) { icon = 'remove'; iconColor = theme.warning; }

    const aCount = moduleSlugs.filter((s) => additionalPerms.has(s)).length;
    const eCount = moduleSlugs.filter((s) => excludedPerms.has(s)).length;

    return (
      <Pressable
        style={({ pressed }) => [styles.secHead, pressed && styles.pressed]}
        onPress={() => toggleModule(section.data)}
      >
        <View style={styles.secHeadLeft}>
          <View style={[styles.secHeadIcon, { backgroundColor: iconColor + '18' }]}>
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
          <ThemedText style={styles.secHeadTitle}>{section.title}</ThemedText>
        </View>
        {(aCount > 0 || eCount > 0) && (
          <View style={styles.secHeadCounts}>
            {aCount > 0 && (
              <View style={[styles.secCountDot, { backgroundColor: theme.success }]}>
                <ThemedText style={styles.secCountText}>+{aCount}</ThemedText>
              </View>
            )}
            {eCount > 0 && (
              <View style={[styles.secCountDot, { backgroundColor: theme.destructive }]}>
                <ThemedText style={styles.secCountText}>-{eCount}</ThemedText>
              </View>
            )}
          </View>
        )}
      </Pressable>
    );
  }, [additionalPerms, excludedPerms, rolePermissionSlugs, toggleModule, theme]);

  const renderPermissionItem = useCallback(({ item }: { item: Permission }) => {
    const state = getOverrideState(item.slug);
    const isActive = state === 'inherited' || state === 'added';

    let icon: keyof typeof Ionicons.glyphMap;
    let iconColor: string;
    let rowBg: string;

    switch (state) {
      case 'inherited':
        icon = 'checkmark-circle';
        iconColor = theme.textSecondary + '50';
        rowBg = 'transparent';
        break;
      case 'added':
        icon = 'checkmark-circle';
        iconColor = theme.success;
        rowBg = theme.success + '06';
        break;
      case 'excluded':
        icon = 'close-circle';
        iconColor = theme.destructive;
        rowBg = theme.destructive + '05';
        break;
      default:
        icon = 'add-circle-outline';
        iconColor = theme.textSecondary + '35';
        rowBg = 'transparent';
    }

    return (
      <View style={[styles.permRow, { backgroundColor: rowBg }]}>
        <View style={styles.permIconWrap}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.permInfo}>
          <ThemedText style={[
            styles.permName,
            state === 'excluded' && { textDecorationLine: 'line-through', color: theme.textSecondary },
          ]}>
            {item.permission_name}
          </ThemedText>
          {!!item.description && (
            <ThemedText style={[styles.permDesc, state === 'excluded' && { color: theme.textSecondary + '70' }]}>
              {item.description}
            </ThemedText>
          )}
        </View>
        <Switch
          value={isActive}
          onValueChange={(v) => onToggleSwitch(item.slug, v)}
          trackColor={{ false: theme.border, true: theme.success + '50' }}
          thumbColor={isActive ? theme.success : theme.textSecondary + '60'}
          ios_backgroundColor={theme.border}
        />
      </View>
    );
  }, [getOverrideState, onToggleSwitch, theme]);

  const isFormValid = form.name.trim() && form.phone.trim().length >= 7 && (isEdit || form.password.trim()) && !phoneError;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {isEdit ? 'Edit User' : 'Add User'}
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
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.formSection}>
              <View style={styles.fieldCard}>
                <ThemedText style={styles.fieldLabel}>Full name</ThemedText>
                <View style={styles.fieldInputRow}>
                  <Ionicons name="person-outline" size={18} color={theme.textSecondary} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    value={form.name}
                    onChangeText={(v) => update('name', v)}
                    placeholder="Enter full name"
                    placeholderTextColor={theme.textSecondary + '60'}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.fieldCard}>
                <PhoneInputWithCode
                  countryCode={form.countryCode}
                  callingCode={form.callingCode}
                  phone={form.phone}
                  onCountryChange={handleCountryChange}
                  onPhoneChange={handlePhoneChange}
                  error={phoneError}
                  label="Phone number"
                />
                {phoneChecking && (
                  <View style={styles.checkingRow}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <ThemedText style={styles.checkingText}>Checking availability...</ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.fieldCard}>
                <ThemedText style={styles.fieldLabel}>Email</ThemedText>
                <View style={styles.fieldInputRow}>
                  <Ionicons name="mail-outline" size={18} color={theme.textSecondary} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    value={form.email}
                    onChangeText={(v) => update('email', v)}
                    placeholder="email@example.com"
                    placeholderTextColor={theme.textSecondary + '60'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.fieldCard}>
                <ThemedText style={styles.fieldLabel}>
                  {isEdit ? 'New password' : 'Password'}
                </ThemedText>
                <View style={styles.fieldInputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    value={form.password}
                    onChangeText={(v) => update('password', v)}
                    placeholder={isEdit ? 'Leave blank to keep current' : 'Enter password'}
                    placeholderTextColor={theme.textSecondary + '60'}
                    secureTextEntry
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.fieldCard}>
                <ThemedText style={styles.fieldLabel}>Role</ThemedText>
                <View style={styles.roleWrap}>
                  {roleOptions.length > 0 ? roleOptions.map((r) => {
                    const active = form.role === r.slug;
                    return (
                      <Pressable
                        key={r.slug}
                        style={[styles.roleChip, active && styles.roleChipActive]}
                        onPress={() => update('role', r.slug)}
                      >
                        <ThemedText style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                          {r.name}
                        </ThemedText>
                        {active && <Ionicons name="checkmark" size={14} color={theme.primaryForeground} />}
                      </Pressable>
                    );
                  }) : (
                    ['worker', 'shop_owner', 'admin'].map((r) => {
                      const active = form.role === r;
                      return (
                        <Pressable
                          key={r}
                          style={[styles.roleChip, active && styles.roleChipActive]}
                          onPress={() => update('role', r)}
                        >
                          <ThemedText style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                            {r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </ThemedText>
                          {active && <Ionicons name="checkmark" size={14} color={theme.primaryForeground} />}
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>

              {isEdit && (
                <View style={styles.fieldCard}>
                  <ThemedText style={styles.fieldLabel}>Status</ThemedText>
                  <View style={styles.roleWrap}>
                    {['active', 'inactive'].map((s) => {
                      const active = form.status === s;
                      return (
                        <Pressable
                          key={s}
                          style={[styles.roleChip, active && (s === 'active' ? styles.roleChipSuccess : styles.roleChipDanger)]}
                          onPress={() => update('status', s)}
                        >
                          <ThemedText style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </ThemedText>
                          {active && <Ionicons name="checkmark" size={14} color={theme.primaryForeground} />}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.permHeaderRow}>
                <ThemedText style={styles.permSectionTitle}>Permissions</ThemedText>
                <ThemedText style={styles.permSubtitle}>
                  Tap to add or remove individual permissions
                </ThemedText>
              </View>

              {loadingPerms ? (
                <View style={styles.loadingPerms}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <ThemedText style={styles.loadingPermsText}>Loading permissions...</ThemedText>
                </View>
              ) : (
                <>
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: theme.textSecondary + '40' }]} />
                      <ThemedText style={styles.legendText}>In role</ThemedText>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                      <ThemedText style={styles.legendText}>Extra</ThemedText>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: theme.destructive }]} />
                      <ThemedText style={styles.legendText}>Removed</ThemedText>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.textSecondary + '25' }]} />
                      <ThemedText style={styles.legendText}>Addable</ThemedText>
                    </View>
                  </View>
                  {(addedCount > 0 || excludedCount > 0 || inheritedCount > 0) && (
                    <View style={styles.permSummaryRow}>
                      {addedCount > 0 && (
                        <View style={[styles.permCountBadge, { backgroundColor: theme.success + '12' }]}>
                          <Ionicons name="add-circle" size={13} color={theme.success} />
                          <ThemedText style={[styles.permCountText, { color: theme.success }]}>
                            {addedCount} extra
                          </ThemedText>
                        </View>
                      )}
                      {excludedCount > 0 && (
                        <View style={[styles.permCountBadge, { backgroundColor: theme.destructive + '12' }]}>
                          <Ionicons name="remove-circle" size={13} color={theme.destructive} />
                          <ThemedText style={[styles.permCountText, { color: theme.destructive }]}>
                            {excludedCount} removed
                          </ThemedText>
                        </View>
                      )}
                      {inheritedCount > 0 && (
                        <View style={[styles.permCountBadge, { backgroundColor: theme.textSecondary + '12' }]}>
                          <Ionicons name="checkmark-circle" size={13} color={theme.textSecondary + '70'} />
                          <ThemedText style={[styles.permCountText, { color: theme.textSecondary }]}>
                            {inheritedCount} in role
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.submitBtnPressed,
                  (!isFormValid || submitting) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name={isEdit ? 'checkmark-circle' : 'person-add'} size={20} color="#FFFFFF" />
                    <ThemedText style={styles.submitText}>
                      {isEdit ? 'Update User' : 'Create User'}
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
      paddingBottom: 12,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.backgroundElement,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.text },

    scrollContent: { paddingBottom: 32 },

    formSection: { padding: 16, gap: 14, paddingBottom: 8 },

    fieldCard: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 16,
      gap: 8,
    },
    fieldLabel: {
      fontSize: 12, fontWeight: '600', color: theme.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.4,
    },
    fieldInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundElement,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
    },
    fieldIcon: { marginRight: 8 },
    fieldInput: {
      flex: 1,
      paddingVertical: 11,
      fontSize: 15,
      color: theme.text,
      fontWeight: '500',
    },

    checkingRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginTop: 2,
    },
    checkingText: { fontSize: 11, fontWeight: '500', color: theme.textSecondary },

    roleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    roleChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 14, paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
    },
    roleChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    roleChipSuccess: { backgroundColor: theme.success, borderColor: theme.success },
    roleChipDanger: { backgroundColor: theme.destructive, borderColor: theme.destructive },
    roleChipText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
    roleChipTextActive: { color: theme.primaryForeground },

    divider: { height: 1, backgroundColor: theme.border, marginVertical: 2 },

    permHeaderRow: { paddingHorizontal: 4, paddingTop: 4 },
    permSectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
    permSubtitle: { fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginTop: 2 },

    legend: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 12,
      paddingHorizontal: 4, paddingVertical: 6,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: {
      width: 10, height: 10, borderRadius: 5,
    },
    legendText: { fontSize: 11, fontWeight: '500', color: theme.textSecondary },

    loadingPerms: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 24,
    },
    loadingPermsText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },

    permSummaryRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 6,
      paddingHorizontal: 4, paddingVertical: 4,
    },
    permCountBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7,
    },
    permCountText: { fontSize: 11, fontWeight: '700' },

    secHead: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 10,
      backgroundColor: theme.backgroundElement,
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    secHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    secHeadIcon: {
      width: 26, height: 26, borderRadius: 7,
      alignItems: 'center', justifyContent: 'center',
    },
    secHeadTitle: { fontSize: 13, fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: 0.3 },
    secHeadCounts: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    secCountDot: {
      minWidth: 20, height: 20, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 5,
    },
    secCountText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 12 },

    permRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 11,
      gap: 11,
    },
    permIconWrap: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    permInfo: { flex: 1, gap: 1 },
    permName: { fontSize: 14, fontWeight: '600', color: theme.text },
    permDesc: { fontSize: 11, fontWeight: '500', color: theme.textSecondary, marginTop: 1 },
    permBadge: {
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    },
    permBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 },

    footer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
    submitBtn: {
      height: 50, borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    submitBtnPressed: { opacity: 0.9, shadowOpacity: 0.15, elevation: 2 },
    submitBtnDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
    btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    pressed: { opacity: 0.82 },
  }), [theme]);
  return styles;
};
