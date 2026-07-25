import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useRBAC } from '@/hooks/use-rbac';
import { getCurrentUser, loadStoredUser } from '@/services/auth.service';
import { authService } from '@/services/auth.service';
import { router } from 'expo-router';
import SettingsScreen from '@/features/settings/SettingsScreen';
import PermissionsScreen from '@/features/permissions/PermissionsScreen';
import RolesListScreen from '@/features/roles/RolesListScreen';
import UsersListScreen from '@/features/users/UsersListScreen';
import TaxSettingsScreen from '@/features/settings/taxes/TaxSettingsScreen';
import CurrencySettingsScreen from '@/features/settings/currency/CurrencySettingsScreen';
import InvoicesListScreen from '@/features/invoices/InvoicesListScreen';
import ShopSettingsScreen from '@/features/settings/shop/ShopSettingsScreen';
import EditProfileScreen from './EditProfileScreen';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  permission?: string;
  action: 'modal' | 'screen' | 'coming-soon';
  screen?: string;
}

export default function ProfileScreen() {
  const { can, user } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);
  const insets = useSafeAreaInsets();
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [userData, setUserData] = useState(getCurrentUser());

  useEffect(() => {
    loadStoredUser().then(setUserData);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setEditProfileVisible(false);
    loadStoredUser().then(setUserData);
  }, []);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [rolesModalVisible, setRolesModalVisible] = useState(false);
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [taxesModalVisible, setTaxesModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [invoicesModalVisible, setInvoicesModalVisible] = useState(false);
  const [shopsModalVisible, setShopsModalVisible] = useState(false);

  const menuItems: MenuItem[] = useMemo(() => [
    {
      icon: 'settings-outline',
      label: 'Settings',
      description: 'Theme, appearance & app preferences',
      permission: 'manage:settings',
      action: 'modal',
    },
    {
      icon: 'calculator-outline',
      label: 'Tax Settings',
      description: 'Manage GST, VAT, and sales tax rules',
      permission: 'manage:settings',
      action: 'modal',
    },
    {
      icon: 'cash-outline',
      label: 'Currency',
      description: 'Set your workshop base currency',
      permission: 'manage:settings',
      action: 'modal',
    },
    {
      icon: 'people-outline',
      label: 'Users',
      description: 'Manage workshop users and staff',
      permission: 'view:users',
      action: 'modal',
    },
    {
      icon: 'shield-half-outline',
      label: 'Roles',
      description: 'Define access roles & assign permissions',
      permission: 'view:role',
      action: 'modal',
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Permissions',
      description: 'Manage system permissions',
      permission: 'view:permission',
      action: 'modal',
    },
    {
      icon: 'receipt-outline',
      label: 'Invoices',
      description: 'View all generated bills & invoices',
      action: 'modal',
    },
    {
      icon: 'business-outline',
      label: 'Shops',
      description: 'Manage workshop locations',
      permission: 'manage:settings',
      action: 'modal',
    },
    {
      icon: 'construct-outline',
      label: 'Workers',
      description: 'Manage attending workers',
      permission: 'view:workers',
      action: 'coming-soon',
    },
  ], []);

  const handleMenuPress = useCallback((item: MenuItem) => {
    if (item.action === 'modal') {
      if (item.label === 'Settings') setSettingsModalVisible(true);
      else if (item.label === 'Tax Settings') setTaxesModalVisible(true);
      else if (item.label === 'Currency') setCurrencyModalVisible(true);
      else if (item.label === 'Invoices') setInvoicesModalVisible(true);
      else if (item.label === 'Shops') setShopsModalVisible(true);
      else if (item.label === 'Permissions') setPermissionsModalVisible(true);
      else if (item.label === 'Roles') setRolesModalVisible(true);
      else if (item.label === 'Users') setUsersModalVisible(true);
    } else if (item.action === 'coming-soon') {
      Alert.alert('Coming Soon', `${item.label} management will be available in an upcoming update.`);
    }
  }, []);

  const roleBadgeColor = userData?.role === 'super-admin' ? '#F59E0B' : '#3B82F6';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.card }]}>
          <View style={styles.avatarWrap}>
            {userData?.profile_image ? (
              <Image source={userData.profile_image} style={[styles.avatar, { backgroundColor: theme.primary + '18' }]} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="person" size={36} color={theme.primary} />
              </View>
            )}
            <View style={[styles.roleBadge, { backgroundColor: roleBadgeColor }]}>
              <ThemedText style={styles.roleBadgeText}>
                {userData?.role === 'super-admin' ? 'SA' : 'USR'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.userName}>{userData?.ownerName || 'User'}</ThemedText>
          <View style={[styles.roleChip, { backgroundColor: theme.primary + '12' }]}>
            <ThemedText style={[styles.roleText, { color: theme.primary }]}>
              {userData?.role || 'N/A'}
            </ThemedText>
          </View>
          <View style={styles.userMeta}>
            {userData?.shopName && (
              <View style={styles.metaRow}>
                <Ionicons name="business-outline" size={14} color={theme.textSecondary} />
                <ThemedText style={styles.metaText}>{userData.shopName}</ThemedText>
              </View>
            )}
            {userData?.phone && (
              <View style={styles.metaRow}>
                <Ionicons name="call-outline" size={14} color={theme.textSecondary} />
                <ThemedText style={styles.metaText}>{userData.phone}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Edit Profile */}
        <Pressable
          style={({ pressed }) => [styles.editProfileBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '25' }, pressed && { opacity: 0.8 }]}
          onPress={() => setEditProfileVisible(true)}
        >
          <Ionicons name="create-outline" size={18} color={theme.primary} />
          <ThemedText style={[styles.editProfileText, { color: theme.primary }]}>Edit Profile</ThemedText>
        </Pressable>

        {/* Management Menu */}
        <View style={styles.menuSection}>
          <ThemedText style={styles.sectionTitle}>MANAGEMENT</ThemedText>
          <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {menuItems.map((item, index) => {
              const hasPermission = !item.permission || can(item.permission);
              if (!hasPermission) return null;
              const isLast = index === menuItems.length - 1 || menuItems.slice(index + 1).every((m) => m.permission && !can(m.permission));
              return (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.menuRow,
                    index === 0 && styles.menuRowFirst,
                    isLast && styles.menuRowLast,
                    { borderColor: theme.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: theme.primary + '12' }]}>
                    <Ionicons name={item.icon} size={20} color={theme.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
                    {item.description && (
                      <ThemedText style={styles.menuDescription} numberOfLines={1}>{item.description}</ThemedText>
                    )}
                  </View>
                  <Ionicons
                    name={item.action === 'coming-soon' ? 'time-outline' : 'chevron-forward'}
                    size={18}
                    color={theme.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: async () => { await authService.logout(); router.replace('/auth/login'); } },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.destructive} />
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </Pressable>

        {/* Version */}
        <ThemedText style={styles.version}>Repairo v1.0.0</ThemedText>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} animationType="slide" onRequestClose={() => setSettingsModalVisible(false)}>
        <SettingsScreen onClose={() => setSettingsModalVisible(false)} />
      </Modal>

      {/* Permissions Modal */}
      <Modal visible={permissionsModalVisible} animationType="slide" onRequestClose={() => setPermissionsModalVisible(false)}>
        <PermissionsScreen onClose={() => setPermissionsModalVisible(false)} />
      </Modal>

      {/* Roles Modal */}
      <Modal visible={rolesModalVisible} animationType="slide" onRequestClose={() => setRolesModalVisible(false)}>
        <RolesListScreen onClose={() => setRolesModalVisible(false)} />
      </Modal>

      {/* Users Modal */}
      <Modal visible={usersModalVisible} animationType="slide" onRequestClose={() => setUsersModalVisible(false)}>
        <UsersListScreen onClose={() => setUsersModalVisible(false)} />
      </Modal>

      {/* Tax Settings Modal */}
      <Modal visible={taxesModalVisible} animationType="slide" onRequestClose={() => setTaxesModalVisible(false)}>
        <TaxSettingsScreen onClose={() => setTaxesModalVisible(false)} />
      </Modal>

      {/* Currency Settings Modal */}
      <Modal visible={currencyModalVisible} animationType="slide" onRequestClose={() => setCurrencyModalVisible(false)}>
        <CurrencySettingsScreen onClose={() => setCurrencyModalVisible(false)} />
      </Modal>

      {/* Invoices Modal */}
      <Modal visible={invoicesModalVisible} animationType="slide" onRequestClose={() => setInvoicesModalVisible(false)}>
        <InvoicesListScreen />
      </Modal>

      {/* Shops Modal */}
      <Modal visible={shopsModalVisible} animationType="slide" onRequestClose={() => setShopsModalVisible(false)}>
        <ShopSettingsScreen onClose={() => setShopsModalVisible(false)} />
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileVisible} animationType="slide" onRequestClose={() => setEditProfileVisible(false)}>
        <EditProfileScreen
          onClose={() => setEditProfileVisible(false)}
          onSuccess={handleEditSuccess}
        />
      </Modal>
    </ThemedView>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundElement },

    scrollContent: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16, gap: 20 },

    // ── User Card ──
    userCard: {
      alignItems: 'center',
      padding: 24,
      borderRadius: 20,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    roleBadge: {
      position: 'absolute',
      bottom: -2,
      right: -4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    roleBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
    userName: { fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 4 },
    roleChip: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    roleText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    userMeta: { gap: 4, marginTop: 4, alignItems: 'center' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },

    // ── Edit Profile ──
    editProfileBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    editProfileText: {
      fontSize: 14,
      fontWeight: '700',
    },

    // ── Menu ──
    menuSection: { gap: 8 },
    sectionTitle: {
      fontSize: 11, fontWeight: '700', color: theme.textSecondary,
      letterSpacing: 1, paddingLeft: 4,
    },
    menuCard: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    menuRowFirst: {},
    menuRowLast: { borderBottomWidth: 0 },
    menuIcon: {
      width: 38, height: 38, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 12,
    },
    menuContent: { flex: 1, gap: 1 },
    menuLabel: { fontSize: 15, fontWeight: '600', color: theme.text },
    menuDescription: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },

    // ── Logout ──
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 14, borderRadius: 14,
      borderWidth: 1, borderColor: theme.destructive + '30',
      backgroundColor: theme.destructive + '08',
    },
    logoutText: { fontSize: 15, fontWeight: '700', color: theme.destructive },

    // ── Version ──
    version: {
      fontSize: 12, fontWeight: '500', color: theme.textSecondary,
      textAlign: 'center', opacity: 0.6,
    },
  }), [theme]);
  return styles;
};
